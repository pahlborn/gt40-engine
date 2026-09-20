// Tests fuer den Referenzhistorie-Block in specs.html.
//
// Hintergrund: die vier Vergaser stammen vom alten 1968er 302, wurden dort
// professionell mit zwei Lambdasonden abgestimmt und liefen einwandfrei.
// Ohne diese Herkunft wirkt die verbaute Bedueusung wie ein unbekannter
// Zustand - und jemand "korrigiert" sie auf einen Tabellenwert. Der Block
// ist bewusst als Historie gekennzeichnet, nicht als Spezifikationswert.
//
// Lokal: node tests/referenzhistorie.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, REPO_ROOT, suite, test, assert, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const HTML = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');

const ID_FELDER = [
  'carb_v1_code', 'carb_v2_code', 'carb_v3_code', 'carb_v4_code',
  'carb_trumpet_dims', 'carb_float_needle', 'carb_manifold_maker'
];

// Der Block gehoert in die Vergaser-Komponente, nicht irgendwohin auf die Seite.
function vergaserBlock() {
  const von = HTML.indexOf('data-comp-gallery="carbs"');
  assert(von > -1, 'Vergaser-Galerie nicht gefunden');
  const start = HTML.lastIndexOf('class="comp-box"', von);
  assert(start > -1, 'Vergaser-Komponente nicht gefunden');
  return HTML.slice(start, von);
}

try {

// ---------------------------------------------------------------------------
suite('Referenzhistorie: Herkunft statt Spezifikation');

await test('Herkunft der Anlage steht in der Vergaser-Komponente', async () => {
  const b = vergaserBlock();
  assert(/Referenzhistorie/.test(b), 'Block fehlt');
  assert(/1968er Small Block Ford 302/.test(b), 'Herkunftsmotor fehlt');
  assert(/zwei Lambdasonden abgestimmt/.test(b), 'Abstimmhistorie fehlt');
});

await test('Konservierung ist begruendet, nicht behauptet', async () => {
  const b = vergaserBlock();
  assert(/nichts an Bed&uuml;sung oder Einstellschrauben ver&auml;ndert/.test(b),
    'Unveraendertheit seit der Abstimmung fehlt');
  assert(/Start-Baseline f&uuml;r den neuen M-6009-302/.test(b),
    'Schlussfolgerung auf die Baseline fehlt');
});

await test('Als Owner-Historie gekennzeichnet, nicht als Sollwert', async () => {
  // Das Abstimmprotokoll existiert nicht mehr. Ohne diesen Hinweis wuerde aus
  // einer Erzaehlung ein technischer Sollwert.
  const b = vergaserBlock();
  assert(/Owner-Historie/.test(b), 'Einordnung als Owner-Historie fehlt');
  assert(/kein Herstellerfakt/.test(b), 'Abgrenzung zum Herstellerfakt fehlt');
  assert(/keine Spezifikation/.test(b), 'Abgrenzung zur Spezifikation fehlt');
});

// ---------------------------------------------------------------------------
suite('Identitaet und offene Kennzeichnungen');

await test('Erfassungsfelder fuer die Vergaser-Identitaet vorhanden', async () => {
  const b = vergaserBlock();
  for (const f of ID_FELDER) {
    assert(b.includes('data-field="' + f + '"'), 'Feld fehlt: ' + f);
  }
});

await test('Felder sind im DOM und speichern', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/specs.html');
  await page.waitForTimeout(800);
  const fehlend = await page.evaluate((felder) => felder.filter((f) => {
    const el = document.querySelector('[data-field="' + f + '"]');
    return !el || !el.getAttribute('oninput');
  }), ID_FELDER);
  assert(fehlend.length === 0, 'Nicht im DOM oder ohne oninput: ' + fehlend.join(', '));
  assert(errors.length === 0, 'Page-Errors: ' + errors.join(' | '));
  await ctx.close();
});

await test('Unaufgeloeste Kennzeichnungen stehen mit ehrlichem Status', async () => {
  // "8010 2" ist teilvalidiert, "R 6205 P" ist offen. Beides zu dokumentieren
  // ist richtig - beides zu interpretieren waere es nicht.
  const b = vergaserBlock();
  assert(/8010 2/.test(b), 'Kennzeichnung 8010 2 fehlt');
  assert(/R 6205 P/.test(b), 'Kennzeichnung R 6205 P fehlt');
  assert(/Teilvalidiert/i.test(b), 'Status "teilvalidiert" fehlt');
  assert(/dokumentieren, nicht interpretieren/.test(b),
    'Warnung vor Interpretation fehlt');
});

// ---------------------------------------------------------------------------
suite('Querverweise');

await test('Der Druckwert verweist auf die Quellenlage', async () => {
  const b = vergaserBlock();
  assert(/Max\. Kraftstoffdruck/.test(b), 'Druckzeile fehlt');
  assert(b.includes('href="docs/exkurs-kraftstoffdruck.html"'),
    'Kein Verweis auf den Exkurs zur Quellenlage');
});

await test('Der Arbeitsschritt steht im Build Log, nicht hier', async () => {
  // specs.html ist die Konfiguration, nicht die Arbeitsanweisung.
  const b = vergaserBlock();
  assert(/Kapitel&nbsp;27/.test(b), 'Verweis auf den Erfassungsschritt fehlt');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
