// Tests fuer die Hauptlagerdeckel des M-6010-BOSS302.
//
// Warum eigene Tests: die Anzugswerte sind sicherheitsrelevant und es gibt
// zwei Saetze, die sich NICHT mischen lassen - Fords 100/35 lb-ft mit 30W-Oel
// fuer die serienmaessigen Befestiger, und ARPs eigene Werte mit Ultra-Torque
// fuer Studs. Dieselbe Verwechslung hat bei den Kopfschrauben schon einmal zu
// einer Warnung im Build-Log gefuehrt.
//
// Beide Zahlen sind aus Ford-Datenblaettern belegt (Regel 5):
//   M-6010-BOSS302 Instruction Sheet:
//     "Main Bolt Torque 100 lb-ft (inner) 35 lb-ft (outer) with 30wt oil"
//   M-6010-B302BB Instruction Sheet:
//     "Main Bolt configuration Splayed 4 bolt main caps on positions 2, 3, 4"
//     "Main Cap Fasteners 1/2-13 UNC (torque spec. 100 lb-ft) and
//      3/8-16 UNC (35 lb-ft) grade 8 HCS"
//
// Lokal: node tests/hauptlager.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, assertEqual, summary } from './helpers.mjs';

const specs = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
const buildlog = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
const pickliste = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'pickliste.html'), 'utf8');

try {

suite('Anzugswerte und Befestiger');

await test('Beide Anzugswerte stehen mit Gewinde und Schmiermittel da', async () => {
  // Ein Drehmoment ohne Schmiermittel ist kein Sollwert: dasselbe Moment
  // ergibt trocken, mit Oel und mit Montagepaste verschiedene Vorspannung.
  for (const [was, muster] of [
    // Zwischen Gewinde und Wert darf Auszeichnung stehen, aber kein anderer
    // Spec-Eintrag - darum bis zum naechsten spec-item begrenzt.
    ['innen 1/2-13',  /1\/2&quot;-13 UNC(?:(?!spec-item).)*100 lb-ft/],
    ['aussen 3/8-16', /3\/8&quot;-16 UNC, Grade 8 HCS(?:(?!spec-item).)*35 lb-ft/]
  ]) {
    assert(muster.test(specs), was + ': Gewinde und Moment stehen nicht zusammen');
  }
  const stelle = specs.slice(specs.indexOf('Hauptlagerschrauben innen'),
                             specs.indexOf('Zustand am Motor'));
  assertEqual((stelle.match(/30W-Oel/g) || []).length, 2,
    'Beide Werte brauchen die Angabe des Schmiermittels');
});

await test('Jeder Anzugswert nennt seine Quelle', async () => {
  const stelle = specs.slice(specs.indexOf('Hauptlagerschrauben innen'),
                             specs.indexOf('Zustand am Motor'));
  const belege = stelle.match(/performanceparts\.ford\.com[^"]*/gi) || [];
  assert(belege.length >= 2, 'Regel 5: Anzugswerte ohne Beleg (' + belege.length + ' gefunden)');
});

await test('Die Werte sind in Nm umgerechnet, nicht nur in lb-ft', async () => {
  assert(/100 lb-ft \(136 Nm\)/.test(specs), 'innen: Nm fehlt oder falsch');
  assert(/35 lb-ft \(47 Nm\)/.test(specs), 'aussen: Nm fehlt oder falsch');
  // Gegenprobe der Umrechnung selbst: 1 lb-ft = 1.35582 Nm
  assertEqual(Math.round(100 * 1.35582), 136, 'Umrechnung innen');
  assertEqual(Math.round(35 * 1.35582), 47, 'Umrechnung aussen');
});

suite('Die Montagereihenfolge steht beim Schritt, nicht nur die Zahl');

await test('Innen vor aussen ist als Reihenfolge festgehalten', async () => {
  const i = buildlog.indexOf('8. Main Bearing Clearance');
  const schritt = buildlog.slice(i, i + 12000);
  assert(/zuerst die inneren[\s\S]{0,200}danach die aeusseren/.test(schritt),
    'Die Reihenfolge innen-vor-aussen fehlt im Schritt');
});

await test('Begruendet wird sie auch - sonst wird sie beim Arbeiten ignoriert', async () => {
  const i = buildlog.indexOf('8. Main Bearing Clearance');
  const schritt = buildlog.slice(i, i + 12000);
  assert(/schraeg \(splayed\)/.test(schritt), 'Der Begriff splayed wird nicht erklaert');
  assert(/Lagergasse/.test(schritt), 'Die Folge (verspannte Lagergasse) wird nicht genannt');
});

await test('Der Fehlbestand blockiert die Freigabe des Lagerspiels', async () => {
  const i = buildlog.indexOf('8. Main Bearing Clearance');
  const schritt = buildlog.slice(i, i + 12000);
  assert(/Blockierend an diesem Motor/.test(schritt), 'Der Blocker fehlt');
  assert(/nicht freigegeben/.test(schritt),
    'Es steht nicht da, dass ohne die Schrauben nicht freigegeben werden darf');
});

suite('Ford und ARP werden nicht vermischt');

await test('Der ARP-Weg ist als eigener Wertesatz gekennzeichnet', async () => {
  const i = buildlog.indexOf('8. Main Bearing Clearance');
  const schritt = buildlog.slice(i, i + 12000);
  assert(/Ultra-Torque/.test(schritt), 'ARPs Schmiermittel wird nicht genannt');
  assert(/nicht zulaessig/.test(schritt), 'Das Mischverbot steht nicht da');
});

await test('Die ARP-Teilenummer ist als abhaengig von der Oelwanne markiert', async () => {
  // 154-5610 (Rear Sump) und 154-5611 (Front Sump) unterscheiden sich, weil
  // die Sumpflage den Stud fuer die Pumpenaufnahme bestimmt. Die Wanne ist
  // noch nicht entschieden - eine feste Teilenummer waere eine Vorfestlegung.
  assert(/154-5610[\s\S]{0,60}154-5611/.test(pickliste),
    'Die Pickliste nennt nur eine der beiden ARP-Nummern');
  const i = pickliste.indexOf('s-mainstuds');
  const eintrag = pickliste.slice(i, i + 1400);
  assert(/haengt an der Wanne/.test(eintrag), 'Die Abhaengigkeit ist nicht gekennzeichnet');
});

suite('Pickliste');

await test('Die fehlenden aeusseren Schrauben stehen drauf', async () => {
  const i = pickliste.indexOf('s-mainouter');
  assert(i > 0, 'Kein Eintrag fuer die aeusseren Hauptlagerschrauben');
  const eintrag = pickliste.slice(i, i + 1400);
  assert(/6 Stueck|\(6 Stueck\)/.test(eintrag), 'Die Stueckzahl fehlt');
  assert(/3\/8&quot;-16 UNC/.test(eintrag), 'Das Gewinde fehlt');
  assert(/Grade 8/.test(eintrag), 'Die Guete fehlt');
  assert(/35 lb-ft/.test(eintrag), 'Der Anzugswert fehlt');
});

await test('Die unbekannte Laenge ist als offen gekennzeichnet, nicht geraten', async () => {
  const i = pickliste.indexOf('s-mainouter');
  const eintrag = pickliste.slice(i, i + 1400);
  assert(/Laenge offen|Laenge nicht/.test(eintrag), 'Die Laenge wird nicht als offen gefuehrt');
  assert(/messen|Techline/.test(eintrag), 'Es fehlt, wie man an die Laenge kommt');
  assert(!/\b\d\.\d{2,3}&quot; lang|Laenge 1\.|Laenge 2\./.test(eintrag),
    'Es steht eine Laenge da, die nirgends belegt ist');
});

await test('Oelwanne und Pickup sind als noch nicht entschieden markiert', async () => {
  for (const [id, was] of [['s-pan', 'Oelwanne'], ['s-pickup', 'Pickup Tube']]) {
    const i = pickliste.indexOf(id);
    assert(i > 0, 'Eintrag fehlt: ' + id);
    const eintrag = pickliste.slice(i, i + 1400);
    assert(/Entscheidung offen|haengt an der Wanne/.test(eintrag),
      was + ': steht als entschieden da, obwohl die Wanne offen ist');
  }
  assert(/Armando/.test(pickliste) && /Aviaid/.test(pickliste),
    'Die Kandidaten fuer die Wanne sind nicht genannt');
});

} finally {
  process.exit(summary());
}
