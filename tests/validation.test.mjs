// Tests fuer validation.js - die Eingabepruefung der Messwertfelder.
//
// Die Datei kam ohne Testabdeckung ins Repository und greift in 122 Felder
// ein, von denen jedes einzelne ein gespeichertes data-field ist. Zwei Fehler
// steckten drin:
//
//   1. validateField hat el.value beschrieben, ohne ein input-Ereignis
//      auszuloesen. Die Messwertfelder haengen mit oninput="autoSave()" daran
//      - der normalisierte Wert stand also nur in der Anzeige, gespeichert
//      blieb die Fassung mit Komma. Beim naechsten Laden schrieb applyData()
//      sie zurueck. Das Feature sah aus, als taete es etwas, und tat es nicht.
//
//   2. INTEGER_RE passt auf ein einzelnes '-'. parseInt('-') ist NaN, und
//      anders als im numeric-Zweig fehlte die Pruefung darauf. Wer '-' tippt
//      und das Feld verlaesst, hatte den String "NaN" im Messwertfeld.
//
// Lokal: node tests/validation.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const SEITEN = ['index.html', 'specs.html', 'build-log.html'];

async function oeffne(datei) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + datei);
  await page.waitForFunction(() => typeof Validation !== 'undefined', null, { timeout: 30000 });
  await page.waitForTimeout(400);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Die Pruefung ist ueberall eingebunden');

for (const datei of SEITEN) {
  await test(datei + ': laedt validation.js und ruft init() auf', async () => {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(html.includes('src="validation.js"'), 'validation.js wird nicht geladen');
    assert(/Validation\.init\(\)/.test(html), 'init() wird nie aufgerufen');
    const p = await oeffne(datei);
    const da = await p.page.evaluate(() => typeof Validation === 'object');
    assert(da, 'Validation steht nicht bereit');
    assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
    await p.close();
  });
}

// ---------------------------------------------------------------------------
suite('Normalisierung kommt im Speicher an, nicht nur in der Anzeige');

await test('Komma wird zu Punkt - und der Punkt wird gespeichert', async () => {
  // Der eigentliche Fehler: ohne input-Ereignis laeuft autoSave nie an.
  const p = await oeffne('build-log.html');
  await p.page.waitForFunction(() => dataLoaded === true, null, { timeout: 30000 });
  const r = await p.page.evaluate(async () => {
    const el = document.querySelector('[data-validate="numeric"][data-field]');
    const k = el.dataset.field;
    const gespeichert = () => (JSON.parse(localStorage.getItem('engineBuildLog') || '{}'))[k];
    el.value = '0,002';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 800));
    const vorher = { angezeigt: el.value, gespeichert: gespeichert() };
    el.dispatchEvent(new FocusEvent('blur'));
    await new Promise((r) => setTimeout(r, 900));
    return { feld: k, vorher, nachher: { angezeigt: el.value, gespeichert: gespeichert() } };
  });
  assertEqual(r.vorher.angezeigt, '0,002', 'Ausgangslage Anzeige');
  assertEqual(r.nachher.angezeigt, '0.002', 'Anzeige nach dem Verlassen');
  assertEqual(r.nachher.gespeichert, '0.002',
    'Gespeichert wurde ' + JSON.stringify(r.nachher.gespeichert) + ' - die Normalisierung kam nicht an');
  await p.close();
});

await test('Ein bereits richtiger Wert loest kein ueberfluessiges Speichern aus', async () => {
  // setzeWert vergleicht vorher. Sonst feuert jedes Verlassen ein input-
  // Ereignis und setzt den Feld-Zeitstempel ohne Aenderung neu.
  const p = await oeffne('build-log.html');
  const anzahl = await p.page.evaluate(() => {
    const el = document.querySelector('[data-validate="numeric"][data-field]');
    el.value = '0.002';
    let n = 0;
    el.addEventListener('input', () => { n++; });
    Validation.validateField(el);
    return n;
  });
  assertEqual(anzahl, 0, 'Es wurde trotz unveraendertem Wert gespeichert');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Ungueltige Eingaben');

await test('Ein einzelnes Minus ergibt kein "NaN" im Feld', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    const el = document.createElement('input');
    el.dataset.validate = 'integer';
    document.body.appendChild(el);
    el.value = '-';
    const gueltig = Validation.validateField(el);
    return { gueltig, wert: el.value, fehler: el.classList.contains('status-error') };
  });
  assertEqual(r.gueltig, false, 'Ein einzelnes Minus gilt als gueltig');
  assertEqual(r.wert, '-', 'Feldinhalt wurde zu ' + JSON.stringify(r.wert));
  assert(r.fehler, 'Keine Fehlermarkierung gesetzt');
  await p.close();
});

await test('Buchstaben werden abgewiesen, der Wert bleibt stehen', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    const el = document.createElement('input');
    el.dataset.validate = 'numeric';
    document.body.appendChild(el);
    el.value = 'abc';
    return { gueltig: Validation.validateField(el), wert: el.value,
             fehler: el.classList.contains('status-error') };
  });
  assertEqual(r.gueltig, false, 'Buchstaben gelten als gueltig');
  assertEqual(r.wert, 'abc', 'Die Eingabe wurde veraendert');
  assert(r.fehler, 'Keine Fehlermarkierung');
  await p.close();
});

await test('Ein leeres Feld ist gueltig und wird nicht markiert', async () => {
  // Ein Messwert, den man noch nicht hat, ist kein Fehler.
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    const el = document.createElement('input');
    el.dataset.validate = 'numeric:0.001:0.010';
    document.body.appendChild(el);
    el.value = '';
    return { gueltig: Validation.validateField(el),
             markiert: el.className.indexOf('status-') !== -1 };
  });
  assertEqual(r.gueltig, true, 'Leer gilt als ungueltig');
  assertEqual(r.markiert, false, 'Leeres Feld wurde markiert');
  await p.close();
});

await test('Der Bereich wird geprueft, ohne den Wert zu verwerfen', async () => {
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    function pruefe(wert) {
      const el = document.createElement('input');
      el.dataset.validate = 'numeric:0.001:0.010';
      document.body.appendChild(el);
      el.value = wert;
      Validation.validateField(el);
      return { wert: el.value, ok: el.classList.contains('status-ok'),
               fehler: el.classList.contains('status-error') };
    }
    return { drin: pruefe('0.005'), drueber: pruefe('0.500') };
  });
  assert(r.drin.ok && !r.drin.fehler, 'Wert im Bereich nicht als ok markiert');
  assert(r.drueber.fehler, 'Wert ausserhalb nicht als Fehler markiert');
  assertEqual(r.drueber.wert, '0.500', 'Der Wert wurde stillschweigend geaendert');
  await p.close();
});

await test('Felder ohne data-validate bleiben unangetastet', async () => {
  // Kommentar- und Beschreibungsfelder duerfen alles enthalten.
  const p = await oeffne('build-log.html');
  const r = await p.page.evaluate(() => {
    const el = document.createElement('input');
    document.body.appendChild(el);
    el.value = 'Lager leicht angelaufen, 0,05 mm';
    return { gueltig: Validation.validateField(el), wert: el.value };
  });
  assertEqual(r.gueltig, true, 'Freitextfeld wurde abgewiesen');
  assertEqual(r.wert, 'Lager leicht angelaufen, 0,05 mm', 'Freitext wurde veraendert');
  await p.close();
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
