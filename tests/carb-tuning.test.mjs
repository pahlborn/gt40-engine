// Tests fuer den Vergaser-Komplex: Kapitel 27/28 (Phase 3) und Kapitel 22 (Phase 4).
//
// Hintergrund: Kapitel 22 hiess "Synchronize DellOrto, Log Lambda" und enthielt
// ausschliesslich Vergaser-Montage - Arbeit, die vor dem Start passiert, waehrend
// das Kapitel zehn Schritte nach "START" steht. Montage und Abstimmung sind jetzt
// getrennt. Diese Tests halten die Trennung und die Inhalte fest.
//
// Lokal: node tests/carb-tuning.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, REPO_ROOT,
  suite, test, assert, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const HTML = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');

// Bedueusung je Vergaser (Kapitel 27) - 4 Vergaser x 6 Positionen.
const JET_FELDER = [];
for (const c of ['c1', 'c2', 'c3', 'c4']) {
  for (const j of ['main', 'idle', 'air', 'emul', 'pump', 'aux']) {
    JET_FELDER.push('p3_jet_' + c + '_' + j);
  }
}
// Entscheidungstabelle (Kapitel 22) - Ist/Soll/Begruendung je Duesenart.
const ENTSCHEID_FELDER = [];
for (const j of ['main', 'idle', 'air', 'emul', 'pump', 'vent']) {
  for (const s of ['ist', 'soll', 'why']) {
    ENTSCHEID_FELDER.push('p5_jd_' + j + '_' + s);
  }
}
const LEAK_FELDER = ['p5_leak_method','p5_leak_result','p5_leak_recheck'];
const BEZUGS_FELDER = [
  'p5_tune_compression', 'p5_tune_cam', 'p5_tune_exhaust',
  'p5_tune_timing_total', 'p5_tune_fuel', 'p5_tune_altitude'
];

function karte(id) {
  const start = HTML.indexOf('id="' + id + '"');
  assert(start > -1, 'Karte nicht gefunden: ' + id);
  const von = HTML.lastIndexOf('<div', start);
  let tiefe = 0, i = von;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = von;
  let m;
  while ((m = re.exec(HTML))) {
    tiefe += m[0].startsWith('<div') ? 1 : -1;
    if (tiefe === 0) { i = m.index + m[0].length; break; }
  }
  return HTML.slice(von, i);
}

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

try {

// ---------------------------------------------------------------------------
suite('Montage und Abstimmung sind getrennt');

await test('Kapitel 22 enthaelt keine Montageschritte mehr', async () => {
  // Der eigentliche Fehler: montieren kann man nicht zehn Schritte nach dem Start.
  // Geprueft wird die Montage-ANWEISUNG. Die Fussdichtung als Falschluft-Quelle
  // im Praxis-Tipp zu nennen ist richtig und darf nicht anschlagen.
  const k = karte('p5_sync_card');
  assert(!/Fu&szlig;dichtung <strong>trocken<\/strong> einlegen/.test(k),
    'Kapitel 22 enthaelt weiterhin die Montageanweisung zur Fussdichtung');
  assert(!/&uuml;ber Kreuz anziehen/.test(k), 'Kapitel 22 nennt weiterhin das Anziehen');
  assert(!/Handfest \+ max/.test(k), 'Kapitel 22 nennt weiterhin das Anzugsmoment');
});

await test('Montage steht in Phase 3 und vor Phase 4', async () => {
  const montage = HTML.indexOf('id="p3_carbmount"');
  const phase4 = HTML.indexOf('id="phase4body"');
  assert(montage > -1, 'Montage-Kapitel fehlt');
  assert(montage < phase4, 'Montage steht nicht vor Phase 4');
});

await test('Zerlegen steht vor Montieren', async () => {
  const zerlegen = HTML.indexOf('id="p3_carboverhaul"');
  const montage = HTML.indexOf('id="p3_carbmount"');
  assert(zerlegen > -1, 'Zerlege-Kapitel fehlt');
  assert(zerlegen < montage, 'Zerlegen steht nicht vor Montieren');
});

await test('Kapitelnummern 27 und 28 sind innerhalb von Phase 3 eindeutig', async () => {
  // Die Nummerierung laeuft pro Phase, nicht global: "27. M-6268-A302 Timing Set"
  // liegt in Phase 1 und ist kein Konflikt.
  const von = HTML.indexOf('id="phase3body"');
  const bis = HTML.indexOf('id="phase4body"');
  assert(von > -1 && bis > von, 'Phasengrenzen nicht gefunden');
  const phase3 = HTML.slice(von, bis);
  for (const n of ['26.', '27.', '28.']) {
    const treffer = (phase3.match(new RegExp('class="step-title"[^>]*>' + n + ' ', 'g')) || []);
    assert(treffer.length === 1,
      'Kapitel ' + n + ' kommt in Phase 3 ' + treffer.length + 'x vor');
  }
});

// ---------------------------------------------------------------------------
suite('Kapitel 22 macht, was sein Titel sagt');

await test('Synchronisation in zwei Ebenen beschrieben', async () => {
  // Wer gleich am Gestaenge dreht, verschiebt beide Ebenen zugleich. Geprueft
  // wird der Inhalt beider Ebenen, nicht nur die Beschriftung "Ebene 1" - die
  // steht auch im Wiederholungshinweis und wuerde einen Verlust verdecken.
  const k = karte('p5_sync_card');
  const innen = k.indexOf('innerhalb jedes Vergasers');
  const zwischen = k.indexOf('zwischen den Vergasern');
  assert(innen > -1, 'Ebene 1 (innerhalb eines Vergasers) fehlt');
  assert(zwischen > -1, 'Ebene 2 (zwischen den Vergasern) fehlt');
  assert(innen < zwischen, 'Ebene 2 steht vor Ebene 1');
  assert(/Bypassschraube/.test(k), 'Leerlauf-Bypassschraube nicht genannt');
  assert(/Gest&auml;ngekopplung l&ouml;sen/.test(k), 'Entkoppeln des Gestaenges fehlt');
  assert(/2\.5 Umdrehungen/.test(k), 'Startwert der Gemischschrauben fehlt');
});

await test('Lambda-Logging samt Grenze der Aussage', async () => {
  // Zwei Sonden = zwei Bankmittelwerte. Ein fetter und ein magerer Zylinder
  // derselben Bank heben sich auf - das darf nicht stillschweigend angenommen werden.
  const k = karte('p5_lambda_card');
  assert(/Bank-Mittelwerte/.test(k), 'Einschraenkung auf Bankmittel fehlt');
  assert(/Collector A/.test(k) && /Collector B/.test(k), 'Collector-Zuordnung fehlt');
});

await test('Reihenfolge des Abstimmens ist festgehalten', async () => {
  const k = karte('p5_jetting_card');
  assert(/Reihenfolge des Abstimmens/.test(k), 'Reihenfolge-Block fehlt');
  // Zuendung vor Bedueusung: sonst kompensiert man Zuendfehler mit Kraftstoff.
  const zuend = k.indexOf('Gesamtfr&uuml;hz&uuml;ndung 34&ndash;36&deg; festnageln');
  const voll = k.indexOf('<strong>Volllast</strong>');
  assert(zuend > -1 && voll > -1, 'Zuendung oder Volllast fehlen in der Reihenfolge');
  assert(zuend < voll, 'Zuendung steht nicht vor der Volllast-Bedueusung');
});

await test('Falschluft-Test ist als Anleitung vorhanden', async () => {
  // Ohne Methode ist der Hinweis "Falschluft macht alles zunichte" wertlos.
  const k = karte('p5_leak_card');
  assert(/Falschluft-Test/.test(k), 'Falschluft-Test fehlt');
  assert(/Propan/.test(k), 'Propan-Methode nicht beschrieben');
  assert(/nicht angez&uuml;ndet/.test(k), 'Warnung "unangezuendet" fehlt');
  assert(/Drosselklappenwellen-Enden/.test(k), 'Wellenenden als Pruefpunkt fehlen');
  assert(/Ansaugbr&uuml;cke zum Zylinderkopf/.test(k), 'Bruecke/Kopf als Pruefpunkt fehlt');
  for (const f of LEAK_FELDER) {
    assert(k.includes('data-field="' + f + '"'), 'Feld fehlt: ' + f);
  }
});

await test('Bremsenreiniger ist ausdruecklich ausgeschlossen', async () => {
  // Verbreitete Methode, aber Fehlanzeigen plus brennbare Fluessigkeit auf
  // heissem Motor mit offenen Trichtern.
  const k = karte('p5_leak_card');
  assert(/Nicht mit Bremsenreiniger oder Startpilot/.test(k),
    'Warnung vor Bremsenreiniger fehlt');
});

await test('Falschluft-Test steht als eigenes Kapitel vor der Synchronisation', async () => {
  // Getrennte Kapitel seit Phase 5: dicht sein ist die Voraussetzung, nicht
  // ein Unterpunkt der Synchronisation.
  const leak = HTML.indexOf('id="p5_leak_card"');
  const sync = HTML.indexOf('id="p5_sync_card"');
  assert(leak > -1, 'Falschluft-Kapitel fehlt');
  assert(sync > -1, 'Synchronisations-Kapitel fehlt');
  assert(leak < sync, 'Falschluft-Test steht nach der Synchronisation');
});

// ---------------------------------------------------------------------------
suite('Bedueusung: Ist, Soll, Begruendung');

await test('Ist-Erfassung je Vergaser vollstaendig (Kapitel 27)', async () => {
  const k = karte('p3_carboverhaul');
  for (const f of JET_FELDER) {
    assert(k.includes('data-field="' + f + '"'), 'Feld fehlt in Kapitel 27: ' + f);
  }
  assert(k.includes('data-field="p3_jet_venturi"'), 'Hauptventuri-Feld fehlt');
});

await test('Entscheidungstabelle mit Begruendungsspalte', async () => {
  const k = karte('p5_jetting_card');
  for (const f of ENTSCHEID_FELDER) {
    assert(k.includes('data-field="' + f + '"'), 'Feld fehlt in Kapitel 22: ' + f);
  }
});

await test('Bezugsgroessen sind erfassbar', async () => {
  // Eine Bedueusung gilt fuer diesen Motor in dieser Konfiguration, nicht allgemein.
  const k = karte('p5_jetting_card');
  for (const f of BEZUGS_FELDER) {
    assert(k.includes('data-field="' + f + '"'), 'Bezugsgroesse fehlt: ' + f);
  }
});

await test('Beide Zahlenreihen stehen nebeneinander und keine gilt als Sollwert', async () => {
  // Die Zahlen des Reviews und die des Leitfadens widersprechen sich, und keine
  // traegt eine Primaerquelle. Geprueft wird die Aussage, nicht ein Stichwort -
  // die Formulierung wurde schon einmal geschaerft und der Test lief ins Leere.
  const k = karte('p3_carboverhaul');
  assert(/9164\.2/.test(k) && /9164\.3/.test(k), 'Nicht beide Reihen aufgefuehrt');
  assert(/keine Primaerquelle|keine Primaerquellen|nicht validiert/.test(k),
    'Fehlende Quellenlage nicht benannt');
  assert(/Keine dieser Reihen ist ein Sollwert/.test(k),
    'Reihen sind nicht als Nicht-Sollwert gekennzeichnet');
  assert(/Ma&szlig;geblich ist die Ist-Best&uuml;ckung/.test(k),
    'Vorrang der verbauten Baseline nicht benannt');
});

await test('Plausibilitaetsrechnung leitet die Groessen her', async () => {
  // Die beiden Vorschlaege behaupten nur. Erst die Herleitung macht pruefbar,
  // welcher ueberhaupt in der Groessenordnung liegt.
  const k = karte('p3_carboverhaul');
  assert(/Plausibilit&auml;tsrechnung/.test(k), 'Rechnung fehlt');
  assert(/619 cm&sup3;/.test(k), 'Hubraum je Zylinder fehlt');
  assert(/Barrel &divide; 1\.25/.test(k), 'Venturi-Formel fehlt');
  assert(/Venturi &times; 4/.test(k), 'Hauptduesen-Formel fehlt');
  assert(/Hauptd&uuml;se \+ 50/.test(k), 'Luftkorrektur-Formel fehlt');
});

await test('Grenzen der Rechnung sind benannt', async () => {
  // Die Formeln stammen aus einem DHLA-Leitfaden, nicht von DRLA. Ohne diesen
  // Hinweis wird aus einer Groessenordnung ein vermeintlicher Sollwert.
  const k = karte('p3_carboverhaul');
  assert(/DHLA/.test(k), 'Herkunft der Formeln (DHLA) nicht genannt');
  assert(/nicht als Sollwert/.test(k), 'Einschraenkung "kein Sollwert" fehlt');
});

await test('Hauptventuri ist als fehlender Wert benannt', async () => {
  // Die Hauptduese haengt von ihr ab, im Leitfaden fehlte sie komplett.
  const k = karte('p3_carboverhaul');
  assert(/Hauptventuri/.test(k), 'Hauptventuri kommt nicht vor');
});

// ---------------------------------------------------------------------------
suite('Die bewaehrte Abstimmung ist die Baseline');

await test('Leitprinzip und Herkunft der Anlage stehen im Kapitel', async () => {
  // Die Vergaser kamen vom alten 1968er 302, wurden in England mit zwei
  // Lambdasonden abgestimmt und liefen einwandfrei. Ohne diesen Satz wirkt die
  // vorhandene Bedueusung wie ein unbekannter Zustand statt wie ein Ergebnis.
  const k = karte('p3_carboverhaul');
  assert(/Baseline konservieren/.test(k), 'Leitprinzip fehlt');
  assert(/bereits abgestimmt/.test(k), 'Herkunft der Abstimmung fehlt');
  assert(/unver&auml;ndert zur&uuml;ckbauen/.test(k), 'Konservierungs-Arbeitsweise fehlt');
});

await test('STOPP-Punkte sind benannt', async () => {
  const k = karte('p3_carboverhaul');
  assert(/STOPP/.test(k), 'STOPP-Tabelle fehlt');
  for (const punkt of ['Einstellschraube', 'vertauschen', 'Reibahle', 'Schwimmerstand']) {
    assert(k.includes(punkt), 'STOPP-Punkt fehlt: ' + punkt);
  }
});

await test('Die Plausibilitaetsrechnung ueberschreibt die Baseline nicht', async () => {
  // Eine Faustformel aus einem DHLA-Leitfaden darf nicht als Sollwert gelesen
  // werden, wenn die verbaute Bedueusung auf einem echten Motor funktioniert hat.
  const k = karte('p3_carboverhaul');
  assert(/&uuml;berschreibt die bew&auml;hrte Baseline nicht/.test(k),
    'Einordnung der Rechnung gegenueber der Baseline fehlt');
});

await test('Das Review verwirft seine eigenen Zahlen - das steht dabei', async () => {
  const k = karte('p3_carboverhaul');
  assert(/als nicht validiert verwirft/.test(k),
    'Selbstverwerfung des Reviews nicht vermerkt');
  assert(/Keine dieser Reihen ist ein Sollwert/.test(k), 'Sollwert-Ausschluss fehlt');
});

await test('Diagnosebaum verhindert den Duesenwechsel auf Verdacht', async () => {
  const k = karte('p5_jetting_card');
  assert(/Diagnosebaum/.test(k), 'Diagnosebaum fehlt');
  assert(/Nicht sofort tun/.test(k), 'Spalte "Nicht sofort tun" fehlt');
  assert(/einzeln und umkehrbar/.test(k), 'Umkehrbarkeit der Aenderungen fehlt');
  // Kernaussage: schlechter Leerlauf ist kein Hauptduesen-Problem.
  assert(/Hauptd&uuml;se &auml;ndern<\/span>/.test(k),
    'Gegenmassnahme zum Leerlauf-Fehlgriff fehlt');
});

// ---------------------------------------------------------------------------
suite('Darstellung');

await test('guide-table ist in build-log.html definiert', async () => {
  // Die Regeln standen nur in der verwaisten build-log-phase4.html; vier bereits
  // vorhandene Tabellen wurden dadurch ohne Rahmen dargestellt.
  assert(/\.guide-table\s*\{/.test(HTML), 'guide-table CSS fehlt in build-log.html');
  assert(/\.guide-table input/.test(HTML), 'Eingabefelder in Tabellen nicht gestylt');
});

await test('Alle neuen Felder sind im DOM und speichern', async () => {
  const alle = JET_FELDER.concat(ENTSCHEID_FELDER, BEZUGS_FELDER, LEAK_FELDER);
  const p = await open('build-log.html');
  const fehlend = await p.page.evaluate((felder) => felder.filter((f) => {
    const el = document.querySelector('[data-field="' + f + '"]');
    return !el || !el.getAttribute('oninput');
  }), alle);
  assert(fehlend.length === 0, 'Nicht im DOM oder ohne oninput: ' + fehlend.join(', '));
  assert(p.errors.length === 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Die Tabellen sind sichtbar breit genug (keine abgeschnittene Spalte)', async () => {
  // Frueher schon passiert: Inhalt im DOM, aber von der Kartenhoehe abgeschnitten.
  const p = await open('build-log.html');
  const mass = await p.page.evaluate(() => {
    const el = document.querySelector('[data-field="p5_jd_main_why"]');
    if (!el) return null;
    const guide = el.closest('.step-guide');
    if (guide) guide.style.display = 'block';
    const t = el.closest('table');
    return { tabelle: t.scrollWidth, sichtbar: t.clientWidth };
  });
  assert(mass, 'Begruendungsfeld nicht gefunden');
  assert(mass.tabelle <= mass.sichtbar + 1,
    'Tabelle laeuft ueber: ' + mass.tabelle + ' > ' + mass.sichtbar);
  await p.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
