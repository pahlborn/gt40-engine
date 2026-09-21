// Tests gegen unbelegte Pauschalaussagen und gegen Sollwerte, die als Tabellen-
// wert auftreten, obwohl sie keine Primaerquelle tragen.
//
// Hintergrund: Mehrere Seiten fuehrten Zahlen, die plausibel klingen und
// trotzdem nicht fuer diesen Motor gelten - ein Leerlaufunterdruck-Fenster aus
// dem Seriencontext, eine Gemischschrauben-Grundeinstellung aus der Weber-Welt,
// eine Schwimmerstandsangabe ohne Dell'Orto-Quelle und eine harte
// Kraftstoffdruckgrenze, die derselbe Exkurs an anderer Stelle als unbelegt
// ausweist. Jede einzelne wuerde dazu fuehren, dass eine funktionierende
// Abstimmung gegen eine Tabelle "korrigiert" wird.
//
// Lokal: node tests/pauschalaussagen.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

const SEITEN = ['specs.html', 'index.html', 'build-log.html',
                'docs/troubleshooting.html', 'docs/dellorto-drla-tuning.html'];

try {

// ---------------------------------------------------------------------------
suite('Schwimmerstand: kein Sollmass ohne DRLA-Quelle');

await test('Die Fehlersuche nennt 5.5-6 mm nicht mehr als Pruefwert', async () => {
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(!/Schwimmerstand pr&uuml;fen \(5\.5&ndash;6 mm\)/.test(h),
    'Fehlersuche gibt weiterhin ein Sollmass vor');
  assert(/mit der dokumentierten Baseline vergleichen/.test(h),
    'Vergleich gegen die eigene Baseline fehlt');
  assert(/gesicherten DRLA-spezifischen Quelle/.test(h),
    'Bedingung fuer ein kuenftiges Sollmass fehlt');
});

// ---------------------------------------------------------------------------
suite('Luftkorrekturduese: keine falsche Faustregel');

await test('Die alte Regel steht nirgends mehr', async () => {
  const treffer = SEITEN.filter((f) =>
    /Gr&ouml;&szlig;ere Luftkorrekturd&uuml;se = Hauptd&uuml;se kommt fr&uuml;her/.test(lies(f)));
  assert(treffer.length === 0, 'Steht noch in: ' + treffer.join(', '));
});

await test('Stattdessen steht die Wirkung auf den oberen Bereich da', async () => {
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(/Abmagerung des oberen Last- und Drehzahlbereichs/.test(h),
    'Wirkrichtung nicht beschrieben');
  assert(/zusammen mit Hauptd&uuml;se und Emulsionsrohr/.test(h),
    'Zusammenspiel der drei Bauteile fehlt');
  assert(/darf daraus nicht allein abgeleitet werden/.test(h),
    'Abgrenzung gegen den Uebergang des Hauptsystems fehlt');
});

// ---------------------------------------------------------------------------
suite('Beduesung: Baseline im BUILD, Referenzwerte im Guide');

await test('Der BUILD-Arbeitsablauf fuehrt keine fremden Zahlenreihen mehr', async () => {
  const h = lies('build-log.html');
  assert(!/Integrationsreview<\/th>/.test(h), 'Vergleichstabelle steht noch im Build-Log');
  assert(!/Plausibilit&auml;tsrechnung/.test(h), 'Plausibilitaetsrechnung steht noch im Build-Log');
  assert(h.includes('docs/dellorto-drla-tuning.html#einordnung'),
    'Verweis auf die Einordnung im Guide fehlt');
});

await test('Der Guide traegt sie unter Hintergrund und Einordnung', async () => {
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(/id="einordnung"/.test(h), 'Sprungmarke fehlt');
  assert(/Integrationsreview/.test(h), 'Vergleichstabelle nicht angekommen');
  assert(/Plausibilit&auml;tsrechnung/.test(h), 'Plausibilitaetsrechnung nicht angekommen');
  assert(/Nichts hier ist ein Sollwert/.test(h), 'Warnhinweis fehlt');
});

await test('Die drei gruenen Startbeduesungs-Kaesten sind entschaerft', async () => {
  // Ein gruener Kasten mit "Typische Startbeduesung" liest sich als Empfehlung.
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(!/Typische Startbed&uuml;sung/.test(h), 'Formulierung "Startbeduesung" steht noch da');
  assert(!/Typische Hauptd&uuml;se/.test(h), 'Formulierung "Typische Hauptduese" steht noch da');
  const treffer = (h.match(/Externer Referenzwert/g) || []).length;
  assert(treffer >= 3, 'Nicht alle drei Kaesten umgestellt: ' + treffer);
});

// ---------------------------------------------------------------------------
suite('Kraftstoffdruck: Arbeitsbereich statt harter Grenze');

await test('Keine Seite fuehrt 3.5 psi als belegte Obergrenze', async () => {
  const verboten = [
    [/Obergrenze &ndash; nicht &uuml;berschreiten/, 'Build-Log'],
    [/Obergrenze 3\.5 psi/, 'Troubleshooting'],
    [/braucht max\. <strong>3\.5 psi<\/strong>/, 'Specs'],
    [/Kraftstoffdruck max\. 3\.5 psi/, 'Index'],
    [/DellOrto DRLA Maximum: 3\.5 psi/, 'Guide'],
  ];
  for (const [muster, wo] of verboten) {
    const treffer = SEITEN.filter((f) => muster.test(lies(f)));
    assert(treffer.length === 0, wo + ': harte Grenze steht noch in ' + treffer.join(', '));
  }
});

await test('Stattdessen Arbeitsbereich plus fehlende Primaerquelle', async () => {
  for (const f of ['specs.html', 'index.html', 'build-log.html',
                   'docs/troubleshooting.html', 'docs/dellorto-drla-tuning.html']) {
    const h = lies(f);
    assert(/Arbeitsbereich/.test(h), f + ': Arbeitsbereich nicht benannt');
    assert(/2,5&ndash;3,5 psi/.test(h), f + ': Bereichsangabe fehlt');
  }
  const g = lies('docs/dellorto-drla-tuning.html');
  assert(/Primaerquelle f&uuml;r eine harte 3,5-psi-Grenze liegt derzeit nicht vor/.test(g),
    'Quellenlage im Guide nicht benannt');
});

// ---------------------------------------------------------------------------
suite('Kraftstoffanlage: Bekanntes von Unbestaetigtem getrennt');

await test('Die Hydraulik steht nicht als Ist-Zustand da', async () => {
  const h = lies('build-log.html');
  // Die Teilenummer wurde nie am Bauteil abgelesen - specs.html fuehrt sie
  // seit v40 als unbestaetigt, das Build-Log behauptete sie als Fluss-Schema.
  assert(!/Tank &rarr; Vorfilter &rarr; Facet Red Top 480532/.test(h),
    'Flussdiagramm behauptet weiterhin eine unbestaetigte Teilenummer');
  assert(/<strong>Gesichert:<\/strong>/.test(h), 'Abschnitt "Gesichert" fehlt');
  assert(/Noch zu verifizieren, bevor die Hydraulik exakt beschrieben wird/.test(h),
    'Abschnitt "noch zu verifizieren" fehlt');
  assert(/Arbeitsannahme, zu pr&uuml;fen: gemeinsamer R&uuml;cklauf/.test(h),
    'Ruecklauffuehrung weiterhin als Tatsache gefuehrt');
});

// ---------------------------------------------------------------------------
suite('Zuendung: kein Fremdbauteil in der Konfiguration');

await test('Der MSD-8463-Komponentenblock ist raus', async () => {
  const h = lies('specs.html');
  // Der 8479 bringt seine Unterdruckdose mit; 8463 ist ein Nachruestteil und
  // war nie gekauft. Als eigener Komponentenblock las er sich wie verbaut.
  assert(!/Unterdruckverstellung &ndash; MSD 8463/.test(h), 'Komponentenblock steht noch da');
  assert(!/MSD 8463/.test(h), 'Verweis auf 8463 in den Specs verblieben');
  assert(/Unterdruckverstellung<\/span><span class="spec-value"><strong>Ja<\/strong>/.test(h),
    'Unterdruckverstellung fehlt jetzt ganz - sie gehoert in den 8479-Block');
});

// ---------------------------------------------------------------------------
suite('Troubleshooting: auf diesen Build bezogen');

await test('Der Einstieg nennt die eigene Konfiguration', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(!/Fehlersuche-Leitfaden f&uuml;r klassische Ford Small Block Motoren \(289, 302, 347, 363 ci\)/.test(h),
    'Generischer Einstieg steht noch da');
  for (const teil of ['AFR-165', 'XE274HR', 'DRLA 45', 'MSD 8479']) {
    assert(h.includes(teil), 'Einstieg nennt ' + teil + ' nicht');
  }
  // Das allgemeine Wissen soll ausdruecklich erhalten bleiben.
  assert(/allgemeine Small-Block-Ford-Grundlagen/.test(h),
    'Zusage, Grundlagen zu erklaeren, fehlt');
});

await test('Leerlaufunterdruck ist kein Gesundheitskriterium mehr', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(!/SBF gesund = <strong>15&ndash;18 inHg<\/strong>/.test(h),
    'Pauschalaussage steht noch da');
  assert(/kein Gesundheitskriterium/.test(h), 'Einordnung fehlt');
  assert(/XE274HR/.test(h), 'Bezug zur verbauten Nockenwelle fehlt');
  assert(/Verhalten der Anzeige/.test(h), 'Der aussagekraeftige Teil fehlt');
});

await test('Gemischschrauben: Stellung dokumentieren statt 1.5 Umdrehungen', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(!/Ausgangsposition: 1\.5 Umdrehungen auf/.test(h),
    'Generische Grundeinstellung steht noch als Ausgangsposition da');
  assert(/vorhandene Stellung zuerst dokumentieren und erhalten/i.test(h),
    'Baseline-Regel fehlt');
  assert(/belastbare DRLA-spezifische Vorgabe daf&uuml;r liegt uns nicht vor/.test(h),
    'Quellenlage nicht benannt');
});

await test('Kerzenbild ist kein Ersatz fuer Lambda', async () => {
  const h = lies('docs/troubleshooting.html');
  assert(!/<strong>Ideal \(Perfect\)<\/strong>/.test(h), '"Ideal" steht noch als Befund da');
  assert(!/Keine Aktion n&ouml;tig\. Gemisch stimmt\./.test(h),
    'Kerzenfarbe wird weiterhin als Gemischmessung gelesen');
  assert(/keine Gemischmessung/.test(h), 'Abgrenzung fehlt');
  assert(/Widebands/.test(h), 'Verweis auf die Lambdasonden fehlt');
});

} finally { /* keine Ressourcen */ }

process.exit(summary() === 0 ? 0 : 1);
