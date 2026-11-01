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
import { pathToFileURL } from 'node:url';
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

await test('Die Pickliste sagt, wie die Laenge zu messen ist, ohne eine Zahl vorzugeben', async () => {
  // Peter muss die sechs Schrauben bestellen (01.11.). Ohne Messanleitung
  // bleibt "Laenge offen" eine Sackgasse; mit erfundener Zahl waere es Regel 5.
  const i = pickliste.indexOf('data-id="s-mainouter"');
  const eintrag = pickliste.slice(i, pickliste.indexOf('</li>', i));
  assert(/So messen:/.test(eintrag), 'Die Messanleitung fehlt');
  assert(/schraegen Achse/.test(eintrag) && /Grund der Gewindebohrung/.test(eintrag),
    'Es fehlt, wo gemessen wird (schraege Achse bis zum Bohrungsgrund)');
  assert(/Scheibendicke/.test(eintrag) && /darf nicht aufsitzen/.test(eintrag),
    'Scheibe oder Bodenabstand fehlen in der Rechnung');
  assert(/bestaetigen lassen/.test(eintrag), 'Der Hinweis, Eingriff/Bodenabstand bestaetigen zu lassen, fehlt');
  const ohneTags = eintrag.replace(/<[^>]+>/g, ' ');
  assert(!/\d+(\.\d+)?\s*(&quot;|"|mm|inch|Zoll)\s*(lang|Laenge|Eingriff|Abstand)/i.test(ohneTags),
    'In der Messanleitung steht eine Laenge oder ein Mass als Vorgabe');
});

suite('Nachschlagekarte: Hauptlager wie im Ford-Datenblatt');

await test('Die Karte nennt innen 100 und aussen 35 lb-ft mit 30W-Oel, nichts anderes', async () => {
  // Bis v130 stand in reference.js "obere Reihe 1-5 80 ft-lbs / untere Reihe
  // 6-10 70 ft-lbs + Thread Sealant" - das Muster der Kopfstehbolzen, nicht
  // der Hauptlager. Ford (IS-1850-0427): 100 lb-ft innen, 35 lb-ft aussen,
  // 30wt oil. Dichtmittel gehoert nicht an die Hauptlagerschrauben.
  await import(pathToFileURL(path.join(REPO_ROOT, 'reference.js')).href);
  const g = globalThis.REFERENCE.gruppen.find((x) => x.id === 'ref-torque');
  for (const [feld, muster, innen, aussen, oel] of [
    ['zeilen', /Hauptlager/, /innen/, /au&szlig;en/, /30wt &Ouml;l/],
    ['zeilenEN', /Main cap/, /inner/, /outer/, /30wt oil/]]) {
    const z = g[feld].filter((r) => muster.test(r[0]));
    assertEqual(z.length, 2, feld + ': Anzahl Hauptlagerzeilen');
    assert(innen.test(z[0][0]) && /1\/2&quot;-13/.test(z[0][0]), feld + ': erste Zeile ist nicht innen 1/2-13');
    assert(aussen.test(z[1][0]) && /3\/8&quot;-16/.test(z[1][0]), feld + ': zweite Zeile ist nicht aussen 3/8-16');
    assert(/^100 ft-lbs \(136 Nm\)$/.test(z[0][1]), feld + ': innen nicht 100 ft-lbs: ' + z[0][1]);
    assert(/^35 ft-lbs \(47 Nm\)$/.test(z[1][1]), feld + ': aussen nicht 35 ft-lbs: ' + z[1][1]);
    for (const r of z) {
      assert(oel.test(r[2]) && !/Sealant|sealant/.test(r[2]), feld + ': Betriebsmittel falsch: ' + r[2]);
    }
  }
  const b = globalThis.REFERENCE.gruppen.find((x) => x.id === 'ref-lubes');
  for (const feld of ['zeilen', 'zeilenEN']) {
    const s = b[feld].find((r) => /Thread Sealant/.test(r[0]));
    assert(s && !/Hauptlager|Main cap|main cap/.test(s[1]), feld + ': Thread Sealant wird weiter den Hauptlagern zugeordnet');
  }
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

await test('Fuer den Canton-Testaufbau stehen Wannenschrauben und Fuehrungsbolzen auf der Liste', async () => {
  // Peter, 01.11.: Die Canton 15-630S vom alten Motor ist samt Pickup
  // vorhanden und am Fahrzeug geprueft; sie kommt fuer den ersten
  // Testaufbau drauf. Im GT40 laesst sich die Wanne nur aufgebockt
  // montieren - daher die zwei Fuehrungsbolzen.
  const eintrag = (id) => {
    const i = pickliste.indexOf('data-id="' + id + '"');
    assert(i > 0, 'Eintrag fehlt: ' + id);
    return pickliste.slice(i, pickliste.indexOf('</li>', i));
  };
  const wanne = eintrag('s-pan');
  assert(/Testaufbau/.test(wanne) && /Canton 15-630S vom alten Motor/.test(wanne),
    'Der Canton-Testaufbau steht nicht bei der Wanne');
  assert(/samt Pickup vorhanden/.test(wanne) && /class="price">vorhanden</.test(wanne),
    'Die Wanne steht nicht als vorhanden (mit Pickup) da, sondern als Kauf');
  assert(/vorhanden/.test(eintrag('s-pickup')), 'Pickup fuer den Testaufbau nicht als vorhanden markiert');
  const schrauben = eintrag('s-panbolts');
  assert(/vom alten Motor/.test(schrauben), 'Wannenschrauben: Hinweis auf die vorhandenen fehlt');
  const fuehrung = eintrag('s-panguides');
  assert(/2 St&uuml;ck/.test(fuehrung) && /gegen&uuml;berliegenden Ecken/.test(fuehrung),
    'Fuehrungsbolzen: Anzahl oder Lage fehlt');
  assert(/aufgebockt/.test(fuehrung), 'Der Grund (Wanne nur aufgebockt montierbar) fehlt');
  for (const [name, e] of [['s-panbolts', schrauben], ['s-panguides', fuehrung]]) {
    const text = e.replace(/<[^>]+>/g, ' ');
    assert(!/\d+\/\d+&quot;-\d+|\d+\/\d+"-\d+|\d+(\.\d+)?\s*(ft-lbs|lb-ft|Nm)/.test(text),
      name + ': Gewinde oder Anzugsmoment ohne Beleg vorgegeben');
  }
});

suite('Oelwannen-Vergleich (v95)');

const vergleich = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'oelwanne-vergleich.html'), 'utf8');

await test('Alle drei Hersteller stehen mit Teilenummer, Massen und Preis da', async () => {
  for (const [wer, teil, preis] of [
    ['Armando', '#407', '\\$520'],
    ['Aviaid',  '155-55360', '\\$994'],
    ['Canton',  '15-630S', '\\$479']
  ]) {
    assert(vergleich.includes(teil), wer + ': Teilenummer fehlt');
    assert(new RegExp(preis).test(vergleich), wer + ': Preis fehlt');
  }
  // Sumpftiefe ist das entscheidende Mass - ohne sie ist der Vergleich wertlos.
  assert(/6\.5&quot;/.test(vergleich) && /8&quot;/.test(vergleich), 'Sumpftiefen fehlen');
});

await test('Jede Angabe ist zu ihrer Herstellerseite verlinkt', async () => {
  for (const host of ['aroilpans.com', 'aviaid.com', 'cantonracingproducts.com']) {
    assert(vergleich.includes(host), 'Quelle fehlt: ' + host);
  }
});

await test('Die Grenze des Vergleichs steht vor der Tabelle, nicht darunter', async () => {
  // Ob eine Wanne passt, entscheidet das Fahrzeug. Ein Datenblattvergleich,
  // der das nicht vorweg sagt, liest sich wie eine Empfehlung.
  const warnung = vergleich.indexOf('Was dieser Vergleich nicht leisten kann');
  const tabelle = vergleich.indexOf('Die drei Wannen nebeneinander');
  assert(warnung > 0, 'Der Vorbehalt fehlt');
  assert(warnung < tabelle, 'Der Vorbehalt steht hinter der Tabelle');
});

await test('Der Schwungrad-Konflikt ist festgehalten', async () => {
  assert(/104/.test(vergleich), 'Der 104-Zahn-Hinweis von Aviaid fehlt');
  assert(/164-Zahn/.test(vergleich), 'Das verbaute 164-Zahn-Schwungrad wird nicht gegenuebergestellt');
});

await test('Die Gesamtkosten rechnen den fehlenden Canton-Pickup mit', async () => {
  assert(/\$547/.test(vergleich),
    'Canton ohne Pickup gerechnet - der Listenpreisvergleich waere irrefuehrend');
});

await test('Der Vergleich ist von Pickliste und Spezifikationen aus erreichbar', async () => {
  assert(/oelwanne-vergleich\.html/.test(pickliste), 'Pickliste verlinkt den Vergleich nicht');
  assert(/docs\/oelwanne-vergleich\.html/.test(specs), 'specs.html verlinkt den Vergleich nicht');
});

await test('Der widerspruechliche Pickup-Abstand ist als strittig gekennzeichnet', async () => {
  // specs.html nennt .250-.375", Fords M-6009-363 Instruction Sheet 1/2" +/- 1/16".
  // Beide berufen sich auf Ford. Unmarkiert stuenden zwei Sollwerte gegeneinander.
  const i = specs.indexOf('Abstand zum Wannenboden');
  assert(i > 0, 'Die Zeile fehlt');
  const zeile = specs.slice(i, specs.indexOf('</div>',i));
  assert(/src-link unverified/.test(zeile), 'Der Widerspruch ist nicht gekennzeichnet');
  assert(/IS-1850-0632/.test(zeile) && /IS-1850-0229/.test(zeile), 'Beide Ford-Kontexte muessen sichtbar sein');
  assert(/OPEN/.test(zeile) && /ungekl/.test(zeile), 'DE/EN-Anwendbarkeitsvorbehalt fehlt');
  assert(!/lt\. Ford Performance/.test(zeile),
    'Die Zeile beruft sich weiter allein auf Ford, obwohl Ford zwei Werte nennt');
});

} finally {
  process.exit(summary());
}
