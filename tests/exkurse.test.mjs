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

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
