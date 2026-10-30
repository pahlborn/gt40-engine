// Tests zu GT40-V113-F001 (#68): Anzugsanweisung der Kopfstehbolzen.
//
// Build Log und Nachschlagekarte nannten fuer ARP 154-4003 drei Stufen
// 35 -> 55 -> 80 ft-lbs (obere Reihe) bzw. 70 ft-lbs (untere Reihe). Die
// ARP-Anleitung 154-4003 (c)2019, S. 1 nennt dagegen drei gleiche Stufen bis
// 110 ft-lbs mit Ultra-Torque - einen Wert fuer alle Bolzen. Welcher Satz
// verbaut ist und welche Beipackanweisung gilt, ist offen. Deshalb steht der
// Endwert als offen da, nicht als Zahl - auch nicht als die ARP-Zahl, solange
// die Identitaet des Satzes nicht feststeht.
//
// Geprueft wird der sichtbare Text der drei betroffenen Arbeitsschritte (Tags
// entfernt), ihre Eingabe-Platzhalter und die Kartenzeilen in reference.js.
//
// Lokal: node tests/kopfanzug.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

const buildlog = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
await import(pathToFileURL(path.join(REPO_ROOT, 'reference.js')).href);

// Ein Arbeitsschritt reicht von seinem step-card bis zum naechsten.
function karte(id) {
  const start = buildlog.indexOf('<div class="step-card" id="' + id + '"');
  assert(start > 0, 'Arbeitsschritt ' + id + ' fehlt im Build Log');
  const ende = buildlog.indexOf('<div class="step-card"', start + 10);
  return buildlog.slice(start, ende > 0 ? ende : undefined);
}
const sichtbar = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#?\w+;/g, ' ');
const ZAHL_MIT_EINHEIT = /\d\s*(ft-lbs|ft lbs|lb-ft|Nm)\b/;

try {

// ---------------------------------------------------------------------------
suite('Build Log: kein Kopfanzugswert ohne geklaerten Satz');

await test('Schmier- und Anzugsschritt nennen kein Drehmoment als Zahl', async () => {
  for (const id of ['p3_arp_lube', 'p3_heads_torque']) {
    const text = sichtbar(karte(id));
    const m = text.match(new RegExp('.{0,40}' + ZAHL_MIT_EINHEIT.source + '.{0,20}'));
    assert(!m, id + ': Drehmoment steht als Zahl da: "' + (m && m[0].trim()) + '"');
  }
});

await test('Die Eingabefelder schlagen keinen Wert vor', async () => {
  const k = karte('p3_heads_torque');
  const vorschlag = (k.match(/placeholder="[^"]*\d[^"]*"/g) || []);
  assert(vorschlag.length === 0, 'Platzhalter mit Zahl: ' + vorschlag.join(', '));
});

await test('Der Endwert steht als offen da und verweist auf die ARP-Anleitung', async () => {
  for (const id of ['p3_arp_lube', 'p3_heads_torque']) {
    const k = karte(id);
    const zeile = (k.match(/<div class="spec-line"><span>Final torque \(Endwert\)<\/span>.*?<\/div>/) || [])[0];
    assert(zeile, id + ': die Zeile Endwert fehlt');
    assert(/offen/.test(zeile), id + ': Endwert nicht als offen gekennzeichnet');
    assert(/href="https:\/\/cdn\.arp-bolts\.com\/instructions\/154-4003\.pdf"/.test(k),
      id + ': der Verweis auf die ARP-Anleitung 154-4003 fehlt');
  }
});

await test('Der Anzugsschritt warnt, bevor jemand nach alten Werten anzieht', async () => {
  const k = karte('p3_heads_torque');
  const w = (k.match(/<div class="warning-box">[\s\S]*?<\/div>/g) || []).find((x) => /Endwert OFFEN/.test(x));
  assert(w, 'Warnung "Endwert OFFEN" fehlt im Anzugsschritt');
  assert(/Kitnummer/.test(w) && /Beipackanweisung/.test(w),
    'Die Warnung sagt nicht, was vor dem Anziehen zu klaeren ist');
  assert(k.indexOf(w) < k.indexOf('<h4 class="procedure">'),
    'Die Warnung steht erst hinter der Vorgehensweise');
});

await test('Nachziehen nennt fuer die Kopfstehbolzen keinen Wert', async () => {
  const k = karte('p4_retorque_card');
  const zeilen = k.match(/<div class="spec-line"><span>Head Studs[^<]*<\/span>.*?<\/div>/g) || [];
  assert(zeilen.length >= 1, 'Die Nachzieh-Zeile fuer die Kopfstehbolzen fehlt');
  for (const z of zeilen) {
    assert(!ZAHL_MIT_EINHEIT.test(sichtbar(z)), 'Nachziehwert als Zahl: ' + sichtbar(z).trim());
    assert(/offen/.test(z), 'Nachzieh-Zeile nicht als offen gekennzeichnet');
  }
});

// ---------------------------------------------------------------------------
suite('Nachschlagekarte: Kopfstehbolzen offen');

await test('Die Kartenzeilen nennen weder Endwert noch Zwischenstufen', async () => {
  const g = globalThis.REFERENCE.gruppen.find((x) => x.id === 'ref-torque');
  assert(g, 'Die Gruppe ref-torque fehlt');
  for (const [feld, vermerk] of [['zeilen', /offen/], ['zeilenEN', /open/]]) {
    const z = g[feld].filter((r) => /154-4003/.test(r[0]));
    assert(z.length === 2, feld + ': zwei Zeilen fuer ARP 154-4003 erwartet, gefunden ' + z.length);
    for (const r of z) {
      assert(!ZAHL_MIT_EINHEIT.test(sichtbar(r[0] + ' ' + r[1])),
        feld + ': Wert oder Zwischenstufe als Zahl: ' + sichtbar(r[0] + ' | ' + r[1]).trim());
      assert(vermerk.test(r[1]), feld + ': offen-Vermerk fehlt in ' + sichtbar(r[0]).trim());
    }
  }
});

} finally {
  process.exit(summary());
}
