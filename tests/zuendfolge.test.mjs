// Tests zu GT40-V113-F007 (#74): Zuendfolge der dokumentierten Nockenwelle.
//
// specs.html ordnet der COMP 35-518-8 die 351W/HO-Folge 1-3-7-2-6-5-4-8 zu.
// Build Log (Verteiler, statische Zuendung, Verkabelung) und die
// Fehlersuche nannten weiter die Standard-302-Folge 1-5-4-2-6-3-7-8. COMP
// (Ford Technical Info, General Tips - Firing Order): Prefix 31 = 1-5-4-2-
// 6-3-7-8, Prefix 35 = 1-3-7-2-6-5-4-8. Wer nach der falschen Folge
// verkabelt, bekommt einen Motor, der nicht anspringt oder zurueckschlaegt.
//
// Geprueft wird jede achtstellige Zuendfolge auf den Seiten: Erlaubt sind
// die Folge dieses Motors und die 302- bzw. Chevy-Folge nur dort, wo sie
// ausdruecklich als "nicht diese" gekennzeichnet ist.
//
// Lokal: node tests/zuendfolge.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

const SEITEN = ['build-log.html', 'specs.html', 'index.html', 'docs/troubleshooting.html'];
const lies = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const sichtbar = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ');
const DIESE = '1-3-7-2-6-5-4-8';
const FOLGE = /\b1(?:-\d){7}\b(?!-)/g;   // 1-2-3-...-10 (Anzugsschema) faellt raus

function karte(h, id) {
  const a = h.indexOf('<div class="step-card" id="' + id + '"');
  assert(a > 0, 'Arbeitsschritt ' + id + ' fehlt');
  const e = h.indexOf('<div class="step-card"', a + 10);
  return h.slice(a, e > 0 ? e : undefined);
}

try {

suite('Zuendfolge: eine Folge fuer diesen Motor');

await test('Jede genannte Zuendfolge ist die dieses Motors oder ausdruecklich verneint', async () => {
  const fehler = [];
  for (const f of SEITEN) {
    const text = sichtbar(lies(f));
    for (const m of text.matchAll(FOLGE)) {
      if (m[0] === DIESE) continue;
      const umfeld = text.slice(Math.max(0, m.index - 160), m.index + 60);
      const verneint = /\bnicht\b|\bNICHT\b|\bnot\b|nur f.{0,3}r Nockenwellen mit|verwechseln/i.test(umfeld);
      if (!verneint) fehler.push(f + ': ' + m[0] + ' ohne Verneinung: "...' + umfeld.slice(-120).trim() + '"');
    }
  }
  assert(fehler.length === 0, fehler.join(' | '));
});

await test('Verteiler, statische Zuendung und Verkabelung nennen 1-3-7-2-6-5-4-8', async () => {
  const bl = lies('build-log.html');
  for (const id of ['p3_distributor', 'p4_timing_static_card', 'p4_wiring_card']) {
    const t = sichtbar(karte(bl, id));
    assert(t.includes(DIESE), id + ': die Zuendfolge der dokumentierten Nockenwelle fehlt');
  }
});

await test('Die Verkabelungs-Sollzeile traegt Nockenwellenbezug und COMP-Quelle', async () => {
  const k = karte(lies('build-log.html'), 'p4_wiring_card');
  const z = (k.match(/<div class="spec-line"><span>Firing Order[^<]*<\/span>.*?<\/div>/) || [])[0];
  assert(z, 'Zeile Firing Order fehlt');
  assert(sichtbar(z).includes(DIESE), 'Wert ist nicht ' + DIESE + ': ' + sichtbar(z));
  assert(/35-518-8/.test(z), 'Bezug auf die dokumentierte Nockenwelle fehlt');
  assert(/href="https:\/\/www\.compcams\.com\/ford-technical-info"/.test(z), 'COMP-Quelle fehlt');
  assert(/best&auml;tigen|bestaetigen/.test(z), 'Hinweis, die verbaute Nockenwelle zu bestaetigen, fehlt');
});

await test('Die Fehlersuche nennt dieselbe Folge', async () => {
  const t = sichtbar(lies('docs/troubleshooting.html'));
  const n = (t.match(new RegExp(DIESE.replace(/-/g, '\\-'), 'g')) || []).length;
  assert(n >= 2, 'docs/troubleshooting.html: ' + DIESE + ' erwartet in Warnung und Kabelabschnitt, gefunden ' + n + 'x');
});

suite('Zuendfolge-Bild im Verkabelungsschritt');

// Das Bild steht als Inline-SVG im Schritt (eine Bilddatei laesst sich aus
// dem Firmennetz nicht hochladen; Inline haelt es zudem offline verfuegbar).
function bild() {
  const k = karte(lies('build-log.html'), 'p4_wiring_card');
  const a = k.indexOf('<svg class="zf"');
  assert(a > 0, 'Zuendfolge-Bild (svg.zf) fehlt im Schritt p4_wiring_card');
  return k.slice(a, k.indexOf('</svg>', a) + 6);
}

await test('Das Bild nennt fuer jeden Zylinder die richtige Stelle in der Zuendfolge', async () => {
  // Ein falsch beschrifteter Zylinder im Bild waere schlimmer als gar kein
  // Bild. Jede Zylindergruppe traegt ihre Nummer und "k. Zuendung"; k muss
  // die Position in 1-3-7-2-6-5-4-8 sein.
  const svg = bild();
  assert(/<title id="zf-title">Z&#252;ndfolge 1-3-7-2-6-5-4-8/.test(svg), 'Titel nennt nicht ' + DIESE);
  const reihe = DIESE.split('-').map(Number);
  const pos = {};
  for (let z = 1; z <= 8; z++) {
    const g = (svg.match(new RegExp('<g id="zf-zyl-' + z + '">(.*?)</g>')) || [])[1];
    assert(g, 'Zylinder ' + z + ' fehlt im Bild');
    const nr = (g.match(/class="nr">(\d)</) || [])[1];
    const k = (g.match(/class="folge">(\d)\./) || [])[1];
    assert(Number(nr) === z, 'Gruppe zf-zyl-' + z + ' ist mit ' + nr + ' beschriftet');
    assert(Number(k) === reihe.indexOf(z) + 1,
      'Zylinder ' + z + ' zuendet laut Bild als ' + k + '., laut Folge als ' + (reihe.indexOf(z) + 1) + '.');
    pos[z] = { x: Number(g.match(/cx="(\d+)"/)[1]), y: Number(g.match(/cy="(\d+)"/)[1]) };
  }
  // Lage wie in der Sollzeile: Bank 1-4 = RH oben, je Bank vorn (links) beginnend.
  for (const z of [1, 2, 3, 4]) assert(pos[z].y < pos[z + 4].y, 'Zylinder ' + z + ' liegt nicht auf der oberen (RH-)Bank');
  for (const z of [1, 2, 3, 5, 6, 7]) assert(pos[z].x < pos[z + 1].x, 'Zylinder ' + z + ' liegt nicht vor ' + (z + 1));
  assert(/Rechte Motorseite \(RH\)/.test(svg) && /Linke Motorseite \(LH\)/.test(svg), 'Bankbeschriftung fehlt');
  assert(/gegen den Uhrzeigersinn/.test(svg), 'Drehrichtung des Verteilers fehlt');
});

await test('Die Bild-Styles gelten nur im Bild, nicht fuer die ganze Seite', async () => {
  // Ein <style> im Inline-SVG wirkt auf das ganze Dokument. Ohne .zf davor
  // wuerde etwa "text{...}" jede andere Grafik der Seite umfaerben.
  const css = (bild().match(/<style>([\s\S]*?)<\/style>/) || [])[1];
  assert(css, 'Style-Block fehlt');
  const regeln = css.split('}').map((r) => r.trim()).filter(Boolean);
  const offen = regeln.filter((r) => !r.startsWith('.zf '));
  assert(offen.length === 0, 'Nicht auf .zf begrenzt: ' + offen.join(' | '));
});

} finally {
  process.exit(summary());
}
