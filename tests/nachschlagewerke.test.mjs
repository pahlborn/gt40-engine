// Tests fuer reference.js (Betriebsmittel & Anzugswerte) und exkurs-engine.js
// (Verdichtung, Zuendung, Leistung, Oktan).
//
// Beide kamen ohne Testabdeckung ins Repository. reference.js haelt
// Drehmomentwerte, nach denen an der Werkbank angezogen wird - eine Zeile mit
// einer Zelle zu wenig verschiebt den Wert in die Spalte daneben, und aus
// "80 ft-lbs" wird still ein Betriebsmittel. Das faellt beim Lesen nicht auf.
//
// Beide Dateien endeten auf "? window : this" statt "globalThis". Im Browser
// harmlos - window ist da -, ausserhalb wirft die Zuweisung. Damit waren die
// Daten nur ueber einen Browser pruefbar. Jetzt gehen beide auch in Node, und
// der erste Test haelt das fest.
//
// Lokal: node tests/nachschlagewerke.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const SEITEN = ['index.html', 'specs.html', 'build-log.html'];

await import(path.join(REPO_ROOT, 'reference.js'));
await import(path.join(REPO_ROOT, 'exkurs-engine.js'));
const REFERENCE = globalThis.REFERENCE;
const EXKURS = globalThis.EXKURS_ENGINE;

async function oeffne(datei) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + datei);
  await page.waitForFunction(
    () => typeof showReference === 'function' && typeof showExkursEngine === 'function',
    null, { timeout: 30000 });
  await page.waitForTimeout(300);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Beide Module sind auch ohne Browser ladbar');

await test('Die Daten stehen nach dem Import bereit', async () => {
  // Haelt den globalThis-Abschluss fest. Mit "? window : this" wirft der
  // Import - und die Daten waeren nur ueber einen Browser pruefbar.
  assert(REFERENCE && Array.isArray(REFERENCE.gruppen), 'REFERENCE fehlt');
  assert(EXKURS && Array.isArray(EXKURS.abschnitte), 'EXKURS_ENGINE fehlt');
});

await test('Kein Wurzel-Modul faellt auf den alten Abschluss zurueck', async () => {
  const betroffen = fs.readdirSync(REPO_ROOT)
    .filter((f) => f.endsWith('.js'))
    .filter((f) => /\?\s*window\s*:\s*this\s*\)/.test(
      fs.readFileSync(path.join(REPO_ROOT, f), 'utf8')));
  assertEqual(betroffen.length, 0, 'Noch auf "this" statt globalThis: ' + betroffen.join(', '));
});

// ---------------------------------------------------------------------------
suite('Anzugswerte: die Tabelle darf nicht verrutschen');

await test('Jede Zeile hat so viele Zellen wie ihre Gruppe Spalten', async () => {
  // Der eigentliche Grund fuer diese Suite: eine fehlende Zelle schiebt den
  // Drehmomentwert in die Spalte "Betriebsmittel", ohne dass es auffaellt.
  const schief = [];
  REFERENCE.gruppen.forEach((g) => {
    g.zeilen.forEach((z, i) => {
      if (z.length !== g.spalten.length) {
        schief.push(g.id + ' Zeile ' + (i + 1) + ': ' + z.length + ' statt ' + g.spalten.length);
      }
    });
  });
  assertEqual(schief.length, 0, schief.join(' | '));
});

await test('Jede Gruppe hat id, Titel, Spalten und Zeilen', async () => {
  const luecken = REFERENCE.gruppen
    .filter((g) => !g.id || !g.titel || !g.spalten?.length || !g.zeilen?.length)
    .map((g) => g.id || '(ohne id)');
  assertEqual(luecken.length, 0, 'Unvollstaendig: ' + luecken.join(', '));
  const ids = REFERENCE.gruppen.map((g) => g.id);
  assertEqual(ids.length, new Set(ids).size, 'Doppelte Gruppen-id');
});

await test('Jeder Drehmomentwert nennt eine Einheit', async () => {
  // Eine nackte Zahl in einer Drehmomentspalte ist an der Werkbank wertlos.
  const gruppe = REFERENCE.gruppen.find((g) => g.spalten.indexOf('Drehmoment') !== -1);
  assert(gruppe, 'Keine Gruppe mit Drehmoment-Spalte gefunden');
  const k = gruppe.spalten.indexOf('Drehmoment');
  const ohne = gruppe.zeilen
    .filter((z) => !/ft-lbs|Nm/.test(z[k]))
    .map((z) => z[k]);
  assertEqual(ohne.length, 0, 'Ohne Einheit: ' + ohne.join(' | '));
});

// ---------------------------------------------------------------------------
suite('Exkurs: Inhaltsverzeichnis und Abschnitte passen zusammen');

await test('Jeder Abschnitt hat eine eindeutige id und einen Titel', async () => {
  const ohneId = EXKURS.abschnitte.filter((a) => !a.id).length;
  const ohneTitel = EXKURS.abschnitte.filter((a) => !a.titel).length;
  assertEqual(ohneId, 0, ohneId + ' Abschnitte ohne id');
  assertEqual(ohneTitel, 0, ohneTitel + ' Abschnitte ohne Titel');
  const ids = EXKURS.abschnitte.map((a) => a.id);
  assertEqual(ids.length, new Set(ids).size, 'Doppelte Abschnitts-id');
});

// ---------------------------------------------------------------------------
suite('Im Browser: beide Karten oeffnen und filtern');

for (const datei of SEITEN) {
  await test(datei + ': laedt beide Module und stellt die Knoepfe bereit', async () => {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(html.includes('src="reference.js"'), 'reference.js wird nicht geladen');
    assert(html.includes('src="exkurs-engine.js"'), 'exkurs-engine.js wird nicht geladen');
    const p = await oeffne(datei);
    assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
    await p.close();
  });
}

await test('Die Anzugswerte-Karte baut alle Zeilen ins DOM', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    showReference();
    const ov = document.getElementById('guide-reference');
    return {
      da: !!ov,
      gruppen: ov ? ov.querySelectorAll('.ref-group').length : 0,
      zeilen: ov ? ov.querySelectorAll('tr.ref-row').length : 0
    };
  });
  assert(r.da, 'Overlay wurde nicht gebaut');
  assertEqual(r.gruppen, REFERENCE.gruppen.length, 'Gruppen im DOM');
  const erwartet = REFERENCE.gruppen.reduce((n, g) => n + g.zeilen.length, 0);
  assertEqual(r.zeilen, erwartet, 'Zeilen im DOM');
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Die Suche in den Anzugswerten grenzt ein und findet zurueck', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    showReference();
    const zaehle = () => Array.from(document.querySelectorAll('#guide-reference tr.ref-row'))
      .filter((tr) => tr.style.display !== 'none').length;
    const alle = zaehle();
    const feld = document.getElementById('referenceSearch');
    feld.value = 'Schwungrad';
    filterReference();
    const gefiltert = zaehle();
    feld.value = '';
    filterReference();
    return { alle, gefiltert, zurueck: zaehle() };
  });
  assert(r.gefiltert > 0, 'Suche fand nichts');
  assert(r.gefiltert < r.alle, 'Suche hat nicht eingegrenzt: ' + r.gefiltert + ' von ' + r.alle);
  assertEqual(r.zurueck, r.alle, 'Nach dem Leeren nicht wieder vollstaendig');
  await p.close();
});

await test('Der Exkurs baut alle Abschnitte, und jedes Verzeichnisziel existiert', async () => {
  // Ein Eintrag im Inhaltsverzeichnis, dessen Abschnitt fehlt, springt ins Leere.
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    showExkursEngine();
    const ov = document.getElementById('guide-exkurs-engine');
    const ziele = Array.from(ov.querySelectorAll('.exk-toc-link'))
      .map((a) => (a.getAttribute('onclick') || '').match(/'([^']+)'/))
      .map((m) => (m ? m[1] : null));
    return {
      abschnitte: ov.querySelectorAll('.exk-section').length,
      ziele: ziele.length,
      tot: ziele.filter((id) => !id || !ov.querySelector('#' + id))
    };
  });
  assertEqual(r.abschnitte, EXKURS.abschnitte.length, 'Abschnitte im DOM');
  assertEqual(r.ziele, EXKURS.abschnitte.length, 'Verzeichniseintraege');
  assertEqual(r.tot.length, 0, 'Verweise ins Leere: ' + r.tot.join(', '));
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Die Suche im Exkurs grenzt ein', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    showExkursEngine();
    const zaehle = () => Array.from(document.querySelectorAll('#guide-exkurs-engine .exk-section'))
      .filter((s) => s.style.display !== 'none').length;
    const alle = zaehle();
    const feld = document.getElementById('exkursSearch');
    feld.value = 'Oktan';
    filterExkurs();
    const gefiltert = zaehle();
    feld.value = '';
    filterExkurs();
    return { alle, gefiltert, zurueck: zaehle() };
  });
  assert(r.gefiltert > 0, 'Suche fand nichts');
  assert(r.gefiltert < r.alle, 'Suche hat nicht eingegrenzt: ' + r.gefiltert + ' von ' + r.alle);
  assertEqual(r.zurueck, r.alle, 'Nach dem Leeren nicht wieder vollstaendig');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Auslieferung');

await test('Beide Dateien liegen im Service-Worker-Cache', async () => {
  // Sonst haette ein Geraet die Seite offline, aber die Karten nicht.
  const sw = fs.readFileSync(path.join(REPO_ROOT, 'sw.js'), 'utf8');
  for (const f of ['reference.js', 'exkurs-engine.js']) {
    assert(sw.includes("/gt40-engine/" + f), f + ' fehlt in urlsToCache');
  }
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
