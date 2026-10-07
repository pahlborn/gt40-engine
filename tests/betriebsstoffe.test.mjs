// Tests fuer Kapitel 6a (Betriebsstoffe) und die Teilenummer der Kraftstoffpumpe.
//
// Zwei gemeldete Doppelungen:
//
//  1. Kapitel 6a hatte zwei Tabellen. Die erste nannte Motoroel mit 5 qt und
//     Kuehlmittel mit ~12 qt, die zweite ("Fuellmengen-Uebersicht") dieselben
//     Betriebsstoffe noch einmal, aufgeschluesselt nach Anbauteilen - und mit
//     anderen Zahlen (Kuehlmittel "nur Motor ~8 qt"). Zwei Tabellen zum selben
//     Gegenstand laufen auseinander; wer nur eine liest, liest die falsche.
//
//  2. Der Titel des Pumpen-Datenblatts lautete "Facet Red Top, 2 Stueck
//     (Teilenummer zu bestaetigen)". Eine Arbeitsanweisung im Titel eines
//     Datenblatts wird beim Lesen zur Eigenschaft des Teils. Sie gehoert in den
//     Arbeitsschritt, der sie erledigt - Phase 4, Kapitel 6.
//
// Lokal: node tests/betriebsstoffe.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, assertEqual, summary } from './helpers.mjs';

const index = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
const specs = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
const buildlog = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');

// Kapitel 6a: vom Titel bis zum Beginn von 6b.
function kapitel6a() {
  const i = index.indexOf('6a. &Ouml;le, K&uuml;hlmittel');
  assert(i > 0, 'Kapitel 6a nicht gefunden');
  const j = index.indexOf('6b. Kraftstoff', i);
  assert(j > i, 'Kapitel 6b nicht gefunden');
  return index.slice(i, j);
}

try {

suite('Kapitel 6a: ein Betriebsstoff, eine Zeile');

await test('Es gibt nur noch eine Tabelle in 6a', async () => {
  const b = kapitel6a();
  const n = (b.match(/<table/g) || []).length;
  assertEqual(n, 1, '6a enthaelt ' + n + ' Tabellen');
  assert(!/F&uuml;llmengen-&Uuml;bersicht/.test(b),
    'Die zweite Tabelle ist wieder da');
});

await test('Motoroel und Kuehlmittel stehen je einmal als Zeile da', async () => {
  const b = kapitel6a();
  // "Motoroel" kommt in zwei Zeilen vor - Einfahren und Betrieb -, das sind
  // verschiedene Betriebsstoffe. Kuehlmittel genau einmal.
  assertEqual((b.match(/font-weight:700;">K&uuml;hlmittel</g) || []).length, 1,
    'Kuehlmittel steht mehr als einmal in der Tabelle');
  assertEqual((b.match(/font-weight:700;">Motor&ouml;l \(/g) || []).length, 2,
    'Erwartet werden genau zwei Motoroel-Zeilen (Einfahren, Betrieb)');
});

await test('Die Aufschluesselung nach Anbauteilen steht in der Mengenspalte', async () => {
  // Sie war der einzige Grund fuer die zweite Tabelle. Faellt sie weg, geht
  // Information verloren statt Doppelung.
  const b = kapitel6a();
  assert(/Motor allein 5 qt/.test(b), 'Die Menge ohne Filter fehlt');
  assert(/mit &Ouml;lk&uuml;hler 6&ndash;7 qt/.test(b), 'Die Menge mit Oelkuehler fehlt');
  assert(/Motor allein ~8 qt/.test(b), 'Die Kuehlmittelmenge ohne Kuehler fehlt');
});

await test('Die alte Uebersetzung der entfallenen Spalte ist mit entfernt', async () => {
  assert(!/'Nur Motor':'Engine only'/.test(index),
    'Verwaister i18n-Eintrag der geloeschten Tabelle');
});

suite('Kapitel 6b ist die einzige Stelle mit der Sortentabelle');

await test('Die Tabelle steht genau einmal im Markup', async () => {
  const n = (index.match(/data-fuel-roz="/g) || []).length;
  assertEqual(n, 5, 'Erwartet werden 5 Sortenzeilen, gefunden: ' + n);
  assertEqual((index.match(/id="kap6b"/g) || []).length, 1, 'kap6b ist nicht eindeutig');
});

await test('Die Sorten entsprechen der Vorgabe', async () => {
  const i = index.indexOf('id="kap6b"');
  const b = index.slice(i, index.indexOf('6c. Dichtmittel', i));
  for (const [sorte, roz] of [['Super E10', 95], ['Super E5', 95], ['Super Plus', 98],
                              ['Shell V-Power', 100], ['Aral Ultimate 102', 102]]) {
    assert(b.includes(sorte), 'Sorte fehlt: ' + sorte);
    assert(b.includes('data-fuel-roz="' + roz + '"'), 'ROZ fehlt: ' + roz);
  }
});

await test('Die Oktanzahl selbst steht weiter oben im Simulator', async () => {
  // Nur der Verweis gehoert nach 6b, nicht die Rechnung.
  assert(/id="fuelReqHier"/.test(index), 'Der Platzhalter fuer die Oktanzahl fehlt');
  assert(/Motor-Simulator \(Kap\.&nbsp;5\)/.test(index),
    'Es steht nicht da, woher die Zahl kommt');
  assert(/Berechnete Min\. Oktanzahl/.test(index),
    'Die gruene Box mit der Oktanzahl ist verschwunden');
});

suite('Kraftstoffpumpe: der Titel nennt das Teil, nicht die Aufgabe');

await test('Die Arbeitsanweisung steht nicht mehr im Titel', async () => {
  assert(!/Facet Red Top, 2 St&uuml;ck \(Teilenummer/.test(specs),
    'Die Klammer steht wieder im Titel');
  assert(!/part number to be confirmed/.test(specs),
    'Die englische Fassung traegt sie noch');
  assert(/Kraftstoffpumpe &ndash; Facet Red Top, 2 St&uuml;ck<\/div>/.test(specs),
    'Der Titel fehlt oder lautet anders');
});

await test('Die offene Teilenummer steht als eigene Zeile im Datenblatt', async () => {
  const i = specs.indexOf('Kraftstoffpumpe &ndash; Facet Red Top');
  const b = specs.slice(i, specs.indexOf('<div class="comp-box', i));
  assert(/spec-label">Teilenummer</.test(b), 'Die Zeile fehlt');
  assert(/src-link unverified/.test(b), 'Regel 5: sie steht ohne Kennzeichnung da');
  assert(/480532/.test(b), 'Die angenommene Nummer fehlt');
  assert(/Annahme/.test(b), 'Sie steht nicht als Annahme da');
});

await test('Der abgelesene Wert wird im Arbeitsschritt erfasst', async () => {
  assert(/data-field="p4_fuel_pump_pn"/.test(buildlog),
    'Es gibt kein Feld fuer die abgelesene Teilenummer');
  const i = buildlog.indexOf('id="p4_fuel_card"');
  const j = buildlog.indexOf('data-field="p4_fuel_pump_pn"');
  assert(j > i && j - i < 6000,
    'Das Feld steht nicht in der Karte "Kraftstoffsystem pruefen"');
});

await test('Das Datenblatt spiegelt den eingetragenen Wert', async () => {
  // Sonst muesste man ihn an zwei Stellen pflegen - Regel 10.
  assert(/data-spiegel="p4_fuel_pump_pn"/.test(specs),
    'specs.html spiegelt den Wert nicht');
});

} finally {
  process.exit(summary());
}
