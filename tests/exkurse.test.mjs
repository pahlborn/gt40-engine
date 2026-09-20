// Tests fuer die Exkurs-Seiten unter docs/ und ihre Verlinkung.
//
// Hintergrund: Informationen, die sich keinem Arbeitsschritt zuordnen lassen,
// sollen die Struktur des Build Logs nicht aufbrechen. Sie stehen stattdessen
// als eigene Unterseite und werden von der Stelle aus verlinkt, an der die
// Frage auftaucht. Diese Tests halten fest, dass die Seiten existieren, laden
// und erreichbar sind - und dass kein Verweis ins Leere zeigt.
//
// Lokal: node tests/exkurse.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, REPO_ROOT, suite, test, assert, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

const EXKURSE = [
  { datei: 'docs/exkurs-kraftstoffdruck.html', stichwort: 'Kraftstoffdruck',
    verlinktVon: ['build-log.html', 'index.html'] },
  { datei: 'docs/exkurs-ethanol.html', stichwort: 'Ethanol',
    verlinktVon: ['build-log.html', 'specs.html', 'index.html'] }
];
const SEITEN = ['index.html', 'specs.html', 'build-log.html'];

try {

// ---------------------------------------------------------------------------
suite('Exkurs-Seiten existieren und laden');

for (const ex of EXKURSE) {
  await test(ex.datei + ' laedt ohne Page-Errors', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const resp = await page.goto(base + '/' + ex.datei);
    assert(resp && resp.ok(), 'Seite nicht erreichbar: ' + ex.datei);
    const titel = await page.title();
    assert(titel.includes(ex.stichwort), 'Titel passt nicht: ' + titel);
    assert(errors.length === 0, 'Page-Errors: ' + errors.join(' | '));
    await ctx.close();
  });

  await test(ex.datei + ' hat Ruecklink und Quellenlage', async () => {
    const html = fs.readFileSync(path.join(REPO_ROOT, ex.datei), 'utf8');
    assert(/class="back-link"/.test(html), 'Ruecklink fehlt');
    // Ein Exkurs ohne Angabe, was belegt ist und was nicht, waere genau das
    // Problem, das er loesen soll.
    assert(/belegt/.test(html), 'Keine Aussage zur Quellenlage');
    assert(/[Oo]ffen/.test(html), 'Keine offenen Punkte benannt');
  });
}

// ---------------------------------------------------------------------------
suite('Erreichbarkeit von der Frage aus');

for (const ex of EXKURSE) {
  for (const von of ex.verlinktVon) {
    await test(ex.datei + ' ist von ' + von + ' aus verlinkt', async () => {
      const html = fs.readFileSync(path.join(REPO_ROOT, von), 'utf8');
      assert(html.includes('href="' + ex.datei + '"'),
        von + ' verlinkt ' + ex.datei + ' nicht');
    });
  }
}

// ---------------------------------------------------------------------------
suite('Keine toten Verweise auf docs/');

await test('Jeder docs/-Link zeigt auf eine vorhandene Datei', async () => {
  const fehlend = [];
  for (const seite of SEITEN) {
    const html = fs.readFileSync(path.join(REPO_ROOT, seite), 'utf8');
    for (const m of html.matchAll(/href="(docs\/[^"#]+)"/g)) {
      if (!fs.existsSync(path.join(REPO_ROOT, m[1]))) fehlend.push(seite + ' -> ' + m[1]);
    }
  }
  assert(fehlend.length === 0, 'Tote Links: ' + fehlend.join(', '));
});

await test('Exkurse brechen die Build-Log-Struktur nicht auf', async () => {
  // Der Verweis gehoert in die Kapitelkarte, nicht als eigenes Kapitel daneben.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  for (const m of html.matchAll(/href="docs\/exkurs-[^"]+"/g)) {
    const davor = html.slice(0, m.index);
    const karte = davor.lastIndexOf('class="step-card"');
    const kartenEnde = davor.lastIndexOf('<!-- Phase Photos');
    assert(karte > -1 && karte > kartenEnde,
      'Exkurs-Link steht ausserhalb einer Kapitelkarte: ' + m[0]);
  }
});

// ---------------------------------------------------------------------------
suite('Tuning Guide: Quellenlage statt Behauptung');

const GUIDE = 'docs/dellorto-drla-tuning.html';

await test('Die externe Bedueusungstabelle ersetzt die Baseline nicht', async () => {
  // Abschnitt 9 hiess "Empfohlene Bedueusung als Startpunkt" und stand damit
  // frontal gegen das Baseline-Prinzip: die verbaute Bestueckung IST der
  // Startpunkt, weil sie auf dem alten 302 funktioniert hat.
  const html = fs.readFileSync(path.join(REPO_ROOT, GUIDE), 'utf8');
  assert(!/Empfohlene Bed&uuml;sung als Startpunkt/.test(html),
    'Abschnitt 9 empfiehlt die Tabelle weiterhin als Startpunkt');
  assert(/Diese Tabelle ist nicht euer Startpunkt/.test(html),
    'Vorrang der verbauten Bestueckung fehlt');
  assert(/Kapitel&nbsp;27/.test(html), 'Verweis auf die Ist-Erfassung fehlt');
});

await test('Unbelegte Zielwerte sind als solche gekennzeichnet', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, GUIDE), 'utf8');
  for (const stelle of ['Ziel-AFR Leerlauf', 'Ziel-AFR bei Volllast']) {
    const i = html.indexOf(stelle);
    assert(i > -1, 'Stelle fehlt: ' + stelle);
    assert(/unbelegt/.test(html.slice(i, i + 400)),
      stelle + ' ist nicht als unbelegt gekennzeichnet');
  }
});

await test('Druck und Ethanol verweisen auf die Exkurse statt sie zu wiederholen', async () => {
  // Inhalt an zwei Stellen zu pflegen laeuft auseinander - in diesem Repo
  // bereits passiert (verwaiste build-log-phase4.html).
  const html = fs.readFileSync(path.join(REPO_ROOT, GUIDE), 'utf8');
  assert(html.includes('href="exkurs-kraftstoffdruck.html"'),
    'Kein Verweis auf den Druck-Exkurs');
  assert(html.includes('href="exkurs-ethanol.html"'),
    'Kein Verweis auf den Ethanol-Exkurs');
});

await test('Das pauschale Ethanol-Verbot ist differenziert', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, GUIDE), 'utf8');
  assert(!/ETHANOL: VERBOTEN/.test(html), 'Pauschales Verbot steht weiterhin');
  assert(/&uuml;ber Standzeit, nicht &uuml;ber Kilometer/.test(html),
    'Der eigentliche Mechanismus ist nicht benannt');
});

await test('Guide-interne Verweise zeigen auf vorhandene Dateien', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, GUIDE), 'utf8');
  const fehlend = [];
  for (const m of html.matchAll(/href="(exkurs-[^"#]+)"/g)) {
    if (!fs.existsSync(path.join(REPO_ROOT, 'docs', m[1]))) fehlend.push(m[1]);
  }
  assert(fehlend.length === 0, 'Tote Links im Guide: ' + fehlend.join(', '));
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
