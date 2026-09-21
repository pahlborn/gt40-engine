// Tests gegen Altlasten aus einem frueheren Fahrzeugstand.
//
// Hintergrund: Teile der Dokumentation stammten aus einer Zeit mit anderer
// Hardware - zwei Vergaser statt vier, mechanische Benzinpumpe statt zwei
// elektrischer Facet, Flat-Tappet-Nockenwelle statt Hydraulic Roller. Diese
// Saetze lesen sich plausibel und sind trotzdem falsch fuer dieses Fahrzeug.
// Einer davon haette echten Schaden angerichtet: "Leerlaufkanal mit duennem
// Draht reinigen" veraendert eine kalibrierte Bohrung unwiederbringlich.
//
// Lokal: node tests/altlasten.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

const DATEIEN = ['specs.html', 'index.html', 'build-log.html',
                 'docs/troubleshooting.html', 'docs/dellorto-drla-tuning.html'];

// Der Ethanol-Exkurs zitiert die widerlegten Saetze absichtlich, um sie zu
// widerlegen - er gehoert deshalb nicht in die allgemeine Verbotsliste. Der
// Rechenfehler dagegen war seine eigene Aussage und wird dort mitgeprueft.

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

// Muster, die nirgends mehr vorkommen duerfen, mit Begruendung.
const VERBOTEN = [
  [/versorgt jeder Vergaser 4 Zylinder/i, 'Zylinderzuordnung: ein DRLA versorgt zwei Zylinder'],
  [/Beide Vergaser m&uuml;ssen identischen Luftdurchsatz/i, 'Zwei-Vergaser-Text; es sind vier mit acht Laeufen'],
  [/Mechanische Benzinpumpe/i, 'Fahrzeug hat zwei elektrische Facet-Pumpen'],
  [/Draht.{0,20}reinigen|reinigen.{0,20}d&uuml;nnem Draht/i, 'Draht in einer kalibrierten Bohrung'],
  [/NIEMALS E10/i, 'Pauschales E10-Verbot; widerspricht dem eigenen Exkurs'],
  [/darf NICHT getankt werden/i, 'dito'],
  [/120 l\/h total/i, 'Widerspricht dem Kraftstoffdruck-Exkurs (~170 l/h je Pumpe)'],
  [/ZDDP-Zusatz \(Zinc\) f&uuml;r Flat-Tappet/i, 'Motor hat Rollen-Ventiltrieb'],
];

try {

// ---------------------------------------------------------------------------
suite('Keine Saetze aus einem frueheren Fahrzeugstand');

for (const [muster, grund] of VERBOTEN) {
  await test(grund, async () => {
    const treffer = DATEIEN.filter((f) => muster.test(lies(f)));
    assert(treffer.length === 0, 'Steht noch in: ' + treffer.join(', '));
  });
}

// ---------------------------------------------------------------------------
suite('Und der richtige Inhalt steht stattdessen da');

await test('Troubleshooting kennt vier Vergaser und acht Laeufe', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(/acht L&auml;ufe|ein Lauf je Zylinder/.test(h), 'Zylinderzuordnung nicht korrigiert');
  assert(/zwei Ebenen/.test(h), 'Zwei-Ebenen-Synchronisation fehlt');
});

await test('Troubleshooting kennt die elektrische Anlage', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(/elektrische<\/strong> Facet-Pumpen|elektrische Facet/.test(h),
    'Elektrische Pumpen nicht benannt');
  // Seit v44 als Arbeitsbereich formuliert - der Punkt bleibt, dass die
  // Troubleshooting-Seite den Druck ueberhaupt beziffert.
  assert(/Arbeitsbereich 2,5&ndash;3,5 psi/.test(h), 'Druckangabe fuer den DRLA fehlt');
});

await test('Troubleshooting beschreibt den Rollen-Ventiltrieb', async () => {
  // Ein Roller faellt am Nadellager aus, nicht durch Lobe Wipe - und er
  // braucht kein Flat-Tappet-Einlaufverfahren.
  const h = lies('docs/troubleshooting.html');
  assert(/Hydraulic Roller/.test(h), 'Ventiltrieb nicht benannt');
  assert(/Nadellager/.test(h), 'Ausfallart des Rollers fehlt');
  assert(/Kein Flat-Tappet-Einlaufverfahren/.test(h), 'Abgrenzung zum Einlaufverfahren fehlt');
});

await test('Unbelegte Sollwerte sind als solche gekennzeichnet', async () => {
  const guide = lies('docs/dellorto-drla-tuning.html');
  const ts = lies('docs/troubleshooting.html');
  // Schwimmerstand: Ist-Mass erfassen statt auf Tabellenwert biegen.
  assert(/Ist-Ma&szlig; dokumentieren/.test(guide), 'Schwimmerstand im Guide nicht entschaerft');
  assert(/Ist-Ma&szlig; dokumentieren/.test(ts), 'Schwimmerstand im Troubleshooting nicht entschaerft');
  // Nadelventil: Groesse ist unbekannt, nicht "typisch 200".
  assert(!/Typische Nadelventilgr/.test(guide), 'Nadelventilgroesse weiterhin behauptet');
  assert(/Verbaute Gr&ouml;&szlig;e beim Zerlegen ablesen/.test(guide), 'Hinweis aufs Auslesen fehlt');
});

await test('Die Ethanol-Mehrmenge je Prozent ist nirgends mehr behauptet', async () => {
  // "3 % mehr je Prozent Ethanolanteil" haette bei E10 rund 30 % Mehrmenge
  // bedeutet. Die Bezugsgroesse war falsch, nicht nur die Zahl.
  const muster = /% mehr je Prozent|mehr Kraftstoffmenge pro Prozent|more fuel per percent/i;
  const treffer = DATEIEN.concat(['docs/exkurs-ethanol.html']).filter((f) => muster.test(lies(f)));
  assert(treffer.length === 0, 'Steht noch in: ' + treffer.join(', '));
});

await test('Ethanol: die korrigierte Groessenordnung ist hergeleitet', async () => {
  const g = lies('docs/exkurs-ethanol.html');
  // Die Mischungsrechnung selbst muss dastehen. Eine Suche nur nach "14,7"
  // waere auch dann gruen geblieben, wenn nur noch die Tabelle daruber steht.
  assert(/0,895 &times; 14,7\s*\+\s*0,105 &times; 9,0\s*=/.test(g),
    'Mischungsrechnung fehlt - die 4 % waeren dann eine Behauptung');
  assert(/14,7 \/ 14,1 = 1,043/.test(g), 'Umrechnung auf die Mehrmenge fehlt');
  assert(/4 % mehr Kraftstoff/.test(g), 'Ergebnis fehlt');

  // Der eigentliche Nutzen der Zahl: sie liegt unter einem Duesenschritt.
  // Je Sprache getrennt pruefen - sonst deckt der englische Text den
  // fehlenden deutschen zu (derselbe Fehler wie bei der dial-back-Pruefung).
  assert(/unterhalb eines D&uuml;senschritts/.test(g), 'Exkurs: Einordnung fehlt');
  assert(/7,5/.test(g), 'Exkurs: Vergleichswert 7,5 % fehlt');

  const b = lies('build-log.html');
  assert(/unterhalb eines D&uuml;senschritts<\/strong>: 135&rarr;140/.test(b),
    'Build-Log: deutsche Einordnung gegen den Duesenschritt fehlt');
  assert(/less than one jet step/.test(b), 'Build-Log: englische Einordnung fehlt');
  assert(/am Lambda entscheiden|Decide on the lambda/.test(b),
    'Build-Log: Handlungsanweisung (Lambda statt Kraftstoffsorte) fehlt');
});

await test('Ethanol-Abschnitt verweist auf den Exkurs', async () => {
  const s = lies('specs.html');
  assert(/Risiko liegt in der Standzeit/.test(s), 'Mechanismus nicht benannt');
  assert(s.includes('href="docs/exkurs-ethanol.html"'), 'Kein Verweis auf den Exkurs');
});

await test('Die Facet-Teilenummer gilt als unbestaetigt', async () => {
  const s = lies('specs.html');
  assert(/Teilenummer zu best&auml;tigen/.test(s), 'Teilenummer weiterhin als gesichert gefuehrt');
  // Die Titeluebersetzung muss mitgezogen sein, sonst faellt der Eintrag aus.
  assert(/part number to be confirmed/.test(s), 'Englische Fassung nicht nachgezogen');
});

} finally { /* kein Browser noetig */ }

process.exit(summary() === 0 ? 0 : 1);
