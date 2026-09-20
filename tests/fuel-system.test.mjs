// Tests fuer die Kraftstoffsystem-Karte in build-log.html (Phase 4, Kapitel 6).
//
// Hintergrund: die Karte beschrieb bis v31 durchgehend eine mechanische Pumpe
// samt Handhebel, den dieses Auto nicht hat, und forderte 5.5-7.0 psi - einen
// Wert, der vom nicht verbauten Holley-Alternativvergaser stammt. Die DellOrto
// DRLA vertraegt maximal 3.5 psi. Diese Tests halten den tatsaechlichen Aufbau
// fest, damit er nicht wieder zurueckfaellt.
//
// Lokal: node tests/fuel-system.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, REPO_ROOT,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

// Die Messfelder, ohne die der Tankbilanz-Test nicht dokumentierbar ist.
const PFLICHTFELDER = [
  'p4_fuel_psi_a', 'p4_fuel_psi_b',
  'p4_fuel_return_tank', 'p4_fuel_bal_time',
  'p4_fuel_bal_a_own', 'p4_fuel_bal_a_other',
  'p4_fuel_bal_b_own', 'p4_fuel_bal_b_other'
];

async function open(file) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  await page.waitForTimeout(800);
  return { ctx, page, errors, close: () => ctx.close() };
}

function kartenText() {
  // Roh aus der Datei lesen: der Guide-Block ist im DOM eingeklappt, und die
  // Sprachumschaltung blendet je nach Zustand eine Haelfte aus.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  const start = html.indexOf('id="p4_fuel_card"');
  assert(start > -1, 'Karte p4_fuel_card nicht gefunden');
  const next = html.indexOf('<!-- 7. Static Ignition Timing', start);
  assert(next > -1, 'Ende der Karte nicht gefunden');
  return html.slice(start, next);
}

try {

// ---------------------------------------------------------------------------
suite('Kraftstoffsystem: der Aufbau, den das Auto wirklich hat');

await test('Keine mechanische Pumpe mehr im gesamten Build Log', async () => {
  // Der Handhebel war der auffaelligste Fehler: den gibt es an einer
  // elektrischen Facet nicht.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  for (const begriff of ['Mechanische Kraftstoffpumpe', 'Mechanical pump', 'Hebel an der Pumpe']) {
    assert(!html.includes(begriff), 'Build Log nennt noch: ' + begriff);
  }
});

await test('Karte nennt zwei elektrische Facet-Pumpen und beide Regler', async () => {
  const txt = kartenText();
  assert(/Facet Red Top 480532/.test(txt), 'Pumpentyp fehlt');
  assert(/elektrisch/.test(txt), 'Hinweis "elektrisch" fehlt');
  assert(/Filter King/.test(txt), 'Filter King fehlt');
  assert(/Zwei getrennte Kreise/.test(txt), 'Zwei-Kreis-Aufbau nicht beschrieben');
});

await test('Obergrenze 3.5 psi steht, der Holley-Wert nicht mehr', async () => {
  const txt = kartenText();
  assert(/3\.5 psi/.test(txt), 'Obergrenze 3.5 psi fehlt');
  assert(!/5\.5&ndash;7\.0 psi/.test(txt) && !/5\.5-7\.0 psi/.test(txt),
    'Karte nennt weiterhin den Holley-Druck 5.5-7.0 psi');
});

await test('Ablesen statt verstellen - die Anlage lief mit ihrer Einstellung', async () => {
  // Die vorhandene Reglereinstellung ist Teil der bewaehrten Baseline. Ein
  // Sollwert, auf den man sie "korrigiert", wuerde sie zerstoeren.
  const txt = kartenText();
  assert(/Ablesen, nicht verstellen/.test(txt), 'Grundregel fehlt');
  assert(/&uuml;ber 3\.5 psi/.test(txt), 'Eingriffsschwelle fehlt');
  assert(/weichen voneinander ab/.test(txt), 'Abweichung der Kreise als Ausloeser fehlt');
});

await test('Vor-Start- und Laufwert werden getrennt erfasst', async () => {
  // Elektrische Pumpen bauen den Druck schon bei stehendem Motor auf - dieser
  // Wert ist gueltig. Was er nicht zeigt, ist das Verhalten unter Durchfluss.
  const txt = kartenText();
  assert(/Z&uuml;ndung an und stehendem Motor/.test(txt),
    'Gueltigkeit der statischen Ablesung nicht benannt');
  assert(/Nach dem Erststart nachpr&uuml;fen/.test(txt), 'Nachpruefung unter Last fehlt');
  for (const f of ['p4_fuel_psi_a', 'p4_fuel_psi_b', 'p4_fuel_psi_a_run', 'p4_fuel_psi_b_run']) {
    assert(txt.includes('data-field="' + f + '"'), 'Feld fehlt: ' + f);
  }
});

await test('Bypass-Charakter des Filter King ist benannt', async () => {
  // Ohne diesen Satz wirkt der gemeinsame Ruecklauf harmlos.
  const txt = kartenText();
  assert(/Bypass-Regler/.test(txt), 'Filter King nicht als Bypass-Regler benannt');
  assert(/R&uuml;cklauf/.test(txt), 'Ruecklauf nicht erwaehnt');
});

// ---------------------------------------------------------------------------
suite('Tankbilanz-Test: dokumentierbar, nicht nur beschrieben');

await test('Karte enthaelt den Tankbilanz-Test', async () => {
  const txt = kartenText();
  assert(/Tankbilanz-Test/.test(txt), 'Tankbilanz-Test fehlt');
});

await test('Alle Messfelder des Tests sind vorhanden', async () => {
  const txt = kartenText();
  for (const feld of PFLICHTFELDER) {
    assert(txt.includes('data-field="' + feld + '"'), 'Messfeld fehlt: ' + feld);
  }
});

await test('Messfelder sind im DOM erreichbar und speichern', async () => {
  // Die Felder muessen am normalen Feld-System haengen, sonst wird der
  // Testlauf zwar durchgefuehrt, aber nirgends festgehalten.
  const p = await open('build-log.html');
  const gefunden = await p.page.evaluate((felder) => felder.map((f) => {
    const el = document.querySelector('[data-field="' + f + '"]');
    return { f, da: !!el, oninput: el ? !!el.getAttribute('oninput') : false };
  }), PFLICHTFELDER);
  for (const g of gefunden) {
    assert(g.da, 'Feld nicht im DOM: ' + g.f);
    assert(g.oninput, 'Feld speichert nicht (kein oninput): ' + g.f);
  }
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Zylinderzuordnung der DellOrto');

await test('Ein Vergaser versorgt zwei Zylinder, eine Drosselklappe einen', async () => {
  // Stand vorher in beiden Sprachen falsch und widersprach sich dabei selbst:
  // "jeder Vergaser versorgt 4 Zylinder" gegen "each barrel feeds 4 cylinders".
  for (const datei of ['build-log.html', 'build-log-phase4.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(!/each barrel feeds 4 cylinders/.test(html),
      datei + ': englische Fassung weiterhin falsch');
    assert(!/jeder Vergaser versorgt 4 Zylinder/.test(html),
      datei + ': deutsche Fassung weiterhin falsch');
  }
});

await test('Der verbaute Vergaser wird nirgends DHLA genannt', async () => {
  // Geprueft wird die BEZEICHNUNG unseres Vergasers. DHLA als anderes Modell
  // zu erwaehnen ist zulaessig und noetig - die Faustformeln in Kapitel 27
  // stammen aus einem DHLA-Leitfaden, und genau das muss dort stehen duerfen.
  const falsch = /(Dell.?Orto|DellOrto)\s*DHLA|DHLA\s*4[05]/i;
  for (const datei of ['specs.html', 'index.html', 'build-log.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    const treffer = html.match(falsch);
    assert(!treffer, datei + ' bezeichnet den Vergaser als DHLA: ' + (treffer || [''])[0]);
  }
});

await test('Facet-Druck steht ueberall mit 6-8 psi', async () => {
  // Vorher stand an einer Stelle 7.5 psi - ein Wert, den kein Haendler nennt.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
  assert(!/Facet Red Top liefert 7\.5 psi/.test(html),
    'specs.html nennt weiterhin 7.5 psi');
  assert(/Facet Red Top liefert 6&ndash;8 psi/.test(html),
    'specs.html nennt den belegten Bereich 6-8 psi nicht');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
