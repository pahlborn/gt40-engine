// Tests fuer die Ethanol-Aussagen - ueber alle ausgelieferten Dateien.
//
// Warum diese Datei existiert
// ---------------------------
// v97 hat das pauschale E10-Verbot auf index.html getilgt, weil
// docs/exkurs-ethanol.html es ausdruecklich als nicht haltbar bezeichnet.
// Der zugehoerige Test las aber NUR index.html und blieb gruen - waehrend
// specs.html dasselbe Verbot noch fuenfmal behauptete und exkurs-engine.js
// weiter schrieb, Ethanol greife Kork-Dichtungen und Gummi-Leitungen an,
// ohne jede Bedingung.
//
// Eine Aussage auf einer Datei zu pruefen, wenn sie auf acht Dateien steht,
// faengt nichts. Dieser Test geht ueber alle - und prueft nicht den Wortlaut,
// sondern die Struktur:
//
//     Wer Schaden behauptet, muss die Bedingung mitnennen.
//
// Der Exkurs selbst ist die Quelle und darum ausgenommen; changelog.js ist
// Geschichte und wird nicht umgeschrieben.
//
// Lokal: node tests/ethanol.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

const DOCS = fs.readdirSync(path.join(REPO_ROOT, 'docs'))
  .filter((f) => f.endsWith('.html') && f !== 'exkurs-ethanol.html')
  .map((f) => 'docs/' + f);

const DATEIEN = ['index.html', 'specs.html', 'build-log.html',
                 'exkurs-engine.js', 'glossar.js', ...DOCS];

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

// Behauptet dieser Satz einen Schaden?
//
// Bewusst NICHT im Muster: "quellen" - im Deutschen sind das meistens Quellen
// im Sinne von Belegen ("Quellenlage", "Hersteller und Quellen"), und das
// steht regelmaessig im selben Satz wie der Verweis auf den Exkurs.
//
// "greift ... an" steht sehr wohl drin: genau so war die alte Fassung in
// exkurs-engine.js formuliert, und ein Test, der die gemeldete Formulierung
// nicht faengt, ist wertlos. Dass es den GL-5-Hinweis zum Getriebeoel nicht
// mittrifft, liegt an der Satzgrenze - jener Satz nennt kein Ethanol. Mit
// einem Zeichenfenster statt Saetzen schlug er zu; das war der erste Entwurf.
const SCHADEN = /greift[^.!?]{0,80}an\b|attacks|korrosion|korrodier|zerst(ö|oe)r|aufquell|quellung|quillt|verh(ä|ae)rten|wird sauer|turns acidic|corrosion|corrode|swell/i;
// Nennt er die Bedingung, unter der der Schaden eintritt?
const BEDINGUNG = /standzeit|stehend|stillstand|standing time|layup|lagerung|(ü|ue)berwinterung/i;
const ETHANOL = /ethanol|\bE10\b/i;

// Markup raus, Entities aufloesen, in Saetze zerlegen. Ohne das pruefte der
// Test Attributwerte und Linktexte mit.
function saetze(html) {
  const text = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä').replace(/&uuml;/g, 'ü')
    .replace(/&Ouml;/g, 'Ö').replace(/&Auml;/g, 'Ä').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß')
    .replace(/\\u00e4/g, 'ä').replace(/\\u00f6/g, 'ö').replace(/\\u00fc/g, 'ü')
    .replace(/&[a-zA-Z]+;|&#\d+;/g, ' ')
    .replace(/\s+/g, ' ');
  return text.split(/(?<=[.!?:])\s+/);
}

// Ein Satz ueber Ethanol, der Schaden behauptet, braucht die Bedingung - im
// Satz selbst oder in einem direkt benachbarten. Die Erklaerung steht oft im
// Vorspann, die Aufzaehlung darunter.
function verstoesse(html) {
  const s = saetze(html);
  const schlecht = [];
  for (let i = 0; i < s.length; i++) {
    if (!ETHANOL.test(s[i]) || !SCHADEN.test(s[i])) continue;
    const umfeld = s.slice(Math.max(0, i - 2), i + 3).join(' ');
    if (!BEDINGUNG.test(umfeld)) schlecht.push(s[i].trim().slice(0, 220));
  }
  return schlecht;
}

try {

suite('Kein pauschales Verbot - nirgends');

await test('Keine absolute Formulierung in einer ausgelieferten Datei', async () => {
  const absolut = [/VERBOTEN/, /KEIN E10/, /niemals E10/i, /E10\s+verboten/i,
                   /auf keinen Fall[^.]{0,40}E10/i];
  for (const datei of DATEIEN) {
    const t = lies(datei);
    for (const muster of absolut) {
      const treffer = t.match(muster);
      assert(!treffer, datei + ': absolute Formulierung "' + (treffer || [''])[0] + '"');
    }
  }
});

suite('Wer Schaden behauptet, nennt die Bedingung');

for (const datei of DATEIEN) {
  await test(datei, async () => {
    const schlecht = verstoesse(lies(datei));
    assert(schlecht.length === 0,
      datei + ': Schadensbehauptung ohne Bedingung (Standzeit): "' + schlecht[0] + '"');
  });
}

suite('Die Begruendung steht an genau einer Stelle');

await test('Jede Datei mit Schadensbehauptung verlinkt den Exkurs', async () => {
  // Sonst wird die Begruendung an jeder Stelle neu erfunden - und laeuft
  // auseinander. Genau das war der Zustand vor v98/v99.
  for (const datei of DATEIEN) {
    const t = lies(datei);
    const behauptet = saetze(t).some((x) => ETHANOL.test(x) && SCHADEN.test(x));
    if (!behauptet) continue;
    assert(/exkurs-ethanol\.html/.test(t),
      datei + ': behauptet Ethanolschaden, verlinkt aber den Exkurs nicht');
  }
});

suite('Einzelne Faktenfehler, die aufgefallen sind');

await test('Premium-Sorten werden nicht pauschal als ethanolfrei ausgegeben', async () => {
  // Super Plus 98 ist in Deutschland E5. "Premium-Sorten sind fast immer
  // ethanol-frei" stand so in specs.html und war schlicht falsch.
  for (const datei of DATEIEN) {
    assert(!/fast immer ethanol-?frei/i.test(lies(datei)),
      datei + ': Premium-Sorten werden wieder pauschal als ethanolfrei gefuehrt');
  }
  assert(/Super Plus 98 ist in Deutschland E5/.test(lies('specs.html')),
    'Die Richtigstellung zu Super Plus fehlt');
});

await test('Kein verwaister Woerterbucheintrag der alten Warnueberschrift', async () => {
  for (const datei of ['index.html', 'specs.html', 'build-log.html']) {
    const t = lies(datei);
    if (!/'Warnung: E10 & DellOrto-Vergaser'/.test(t)) continue;
    assert(/Warnung: E10 &amp; DellOrto-Vergaser/.test(t),
      datei + ': Woerterbucheintrag ohne deutschen Quelltext');
  }
});

} finally {
  process.exit(summary());
}
