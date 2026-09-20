// Tests fuer Phase 5 "Abstimmung & Feuertaufe".
//
// Hintergrund: Kapitel 22 lag als einzelne 35-KB-Karte am Ende von Phase 4,
// zwischen Oeldruckpruefung und Kerzenbild. Das mischte zwei verschiedene
// Taetigkeiten: Phase 4 prueft, ob der frische Motor gesund ist - pass oder
// fail, in den ersten Betriebsstunden. Abstimmen ist Optimierung, iterativ,
// ueber Wochen. Und der entscheidende Punkt: in der Werkstatt gibt es nur
// Grundeinstellungen. Teillast braucht die Strasse, Volllast die Rennstrecke.
//
// Lokal: node tests/phase5.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, REPO_ROOT, suite, test, assert, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const HTML = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');

const KAPITEL = [
  'p5_leak', 'p5_sync', 'p5_lambda', 'p5_jetting',
  'p5_road', 'p5_bolts', 'p5_track', 'p5_oil'
];
// Schluessel, die aus Phase 4 mitgewandert sind und deren Werte erhalten
// bleiben muessen.
const GEWANDERT = [
  'p4_sync', 'p4_leak_method', 'p4_collector_a', 'p4_afr_wot_a',
  'p4_tune_cam', 'p4_jd_main_soll', 'p4_jd_vent_why'
];

function phase5Block() {
  const von = HTML.indexOf('id="phase5"');
  assert(von > -1, 'Phase 5 fehlt');
  return HTML.slice(von);
}

try {

// ---------------------------------------------------------------------------
suite('Phase 5 existiert und ist vollstaendig verdrahtet');

await test('Banner, Fortschrittsbalken und Koerper sind vorhanden', async () => {
  for (const teil of ['id="phase5"', 'phase-banner p5', 'id="prog5"',
                      'id="progText5"', 'id="phase5body"', 'togglePhase(\'phase5body\')']) {
    assert(HTML.includes(teil), 'Fehlt: ' + teil);
  }
  assert(/\.phase-banner\.p5\s*\{/.test(HTML), 'Kein Farbschema fuer Phase 5');
});

await test('Die Fortschrittsberechnung kennt Phase 5', async () => {
  // Ohne diesen Eintrag bleibt der Balken auf 0 und die Gesamtzahl stimmt nicht.
  assert(/'phase4','phase5'/.test(HTML), 'Phase 5 fehlt in updateProgress');
});

await test('Galerie und Video-Liste sind angelegt', async () => {
  for (const teil of ['data-comp-gallery="phase5"', 'id="phase5-count"',
                      'videoList_phase5', 'videoUrl_phase5', 'addVideo(\'phase5\')']) {
    assert(HTML.includes(teil), 'Fehlt: ' + teil);
  }
});

await test('Phase 5 steht hinter Phase 4', async () => {
  assert(HTML.indexOf('id="phase4"') < HTML.indexOf('id="phase5"'),
    'Phase 5 steht vor Phase 4');
});

// ---------------------------------------------------------------------------
suite('Werkstatt, Strasse, Strecke sind getrennt');

await test('Die drei Unterphasen stehen in der richtigen Reihenfolge', async () => {
  // Der fachliche Kern: Volllast laesst sich stehend nicht ermitteln.
  const b = phase5Block();
  const werkstatt = b.indexOf('5a &ndash; Werkstatt');
  const strasse = b.indexOf('5b &ndash; Stra&szlig;e');
  const strecke = b.indexOf('5c &ndash; Rennstrecke');
  assert(werkstatt > -1 && strasse > -1 && strecke > -1, 'Eine Unterphase fehlt');
  assert(werkstatt < strasse && strasse < strecke, 'Unterphasen in falscher Reihenfolge');
});

await test('Alle acht Kapitel sind vorhanden und eindeutig nummeriert', async () => {
  const b = phase5Block();
  for (const k of KAPITEL) {
    assert(b.includes('id="' + k + '_card"'), 'Kapitel fehlt: ' + k);
    assert(b.includes('data-findings="' + k + '"'), 'Befundliste fehlt: ' + k);
    assert(b.includes('data-field="' + k + '"'), 'Statusknopf fehlt: ' + k);
  }
  for (let n = 1; n <= 8; n++) {
    const treffer = b.match(new RegExp('class="step-title"[^>]*>' + n + '\\. ', 'g')) || [];
    assert(treffer.length === 1, 'Kapitel ' + n + ' kommt ' + treffer.length + 'x vor');
  }
});

await test('Kapitel 22 ist aus Phase 4 verschwunden', async () => {
  const p4 = HTML.slice(HTML.indexOf('id="phase4"'), HTML.indexOf('id="phase5"'));
  assert(!p4.includes('p4_sync_card'), 'Die alte Karte steht noch in Phase 4');
  assert(!/Synchronize DellOrto, Log Lambda/.test(p4), 'Alter Kapiteltitel noch in Phase 4');
});

await test('Volllast ist ausdruecklich der Strecke vorbehalten', async () => {
  const k = phase5Block();
  assert(/Volllast ist auf der Stra&szlig;e nicht sinnvoll zu ermitteln/.test(k),
    'Begruendung fuer die Streckenfahrt fehlt');
  assert(/erst einen kurzen Zug loggen und auswerten/.test(k),
    'Reihenfolge "erst loggen, dann Vollgas" fehlt');
});

// ---------------------------------------------------------------------------
suite('Die neuen Kapitel tragen Inhalt');

await test('Schraubverbindungen: kalt, mit Reihenfolge und Drehmoment-Falle', async () => {
  const b = phase5Block();
  const i = b.indexOf('id="p5_bolts_card"');
  const k = b.slice(i, i + 9000);
  assert(/Motor kalt/.test(k), 'Hinweis auf kalten Motor fehlt');
  assert(/Losbrechmoment/.test(k), 'Die Drehmomentschluessel-Falle fehlt');
  assert(/Kraftstoffsystem/.test(k), 'Kraftstoffsystem nicht in der Liste');
});

await test('Trackday: erst Systembeobachtung, dann Abstimmung', async () => {
  const b = phase5Block();
  const i = b.indexOf('id="p5_track_card"');
  const k = b.slice(i, i + 9000);
  assert(/Erste Runden nur Systembeobachtung/.test(k), 'Shakedown-Charakter fehlt');
  const beob = k.indexOf('Systembeobachtung');
  const voll = k.indexOf('kurzer Volllastzug');
  assert(beob > -1 && voll > -1 && beob < voll,
    'Volllast steht vor der Systembeobachtung');
});

await test('Nach dem Einsatz: Oel warm ablassen, Filter aufschneiden', async () => {
  const b = phase5Block();
  const i = b.indexOf('id="p5_oil_card"');
  const k = b.slice(i, i + 9000);
  assert(/warm ablassen/.test(k), 'Warmablassen fehlt');
  assert(/Filter aufschneiden/.test(k), 'Filterkontrolle fehlt');
  assert(/Schraubdurchgang wiederholen/.test(k), 'Nachkontrolle der Schrauben fehlt');
});

await test('Strassenkapitel verlangt einen Beifahrer am Logger', async () => {
  const b = phase5Block();
  const i = b.indexOf('id="p5_road_card"');
  const k = b.slice(i, i + 9000);
  assert(/Beifahrer bedient den Logger/.test(k), 'Beifahrer-Regel fehlt');
  assert(/Gleiche Strecke, gleiche Drehzahl/.test(k), 'Reproduzierbarkeit fehlt');
});

// ---------------------------------------------------------------------------
suite('Umbenannte Feldschluessel gehen nicht verloren');

await test('migrateData wird tatsaechlich aufgerufen', async () => {
  // Die Funktion war definiert, aber nirgends verwendet - und griff dabei auf
  // eine Variable zu, die es nicht gab. Sie haette beim ersten Aufruf geworfen.
  assert(/function applyData\(data\) \{\s*migrateData\(data\);/.test(HTML),
    'applyData ruft migrateData nicht auf');
  assert(/var FIELD_MIGRATION = \{/.test(HTML), 'FIELD_MIGRATION ist nicht definiert');
});

await test('Jeder gewanderte Schluessel hat einen Eintrag', async () => {
  for (const alt of GEWANDERT) {
    const neu = alt.replace(/^p4_/, 'p5_');
    assert(HTML.includes("'" + alt + "': '" + neu + "'"),
      'Migration fehlt: ' + alt + ' -> ' + neu);
  }
});

await test('Alte Werte landen im neuen Feld', async () => {
  // Der eigentliche Beweis: ein gespeicherter p4-Wert muss nach dem Laden im
  // p5-Feld stehen.
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('engineBuildLog', JSON.stringify({
        p4_collector_a: '1-3-5-7', p4_jd_main_soll: '144'
      }));
    } catch (e) { /* private mode */ }
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForTimeout(1200);
  const werte = await page.evaluate(() => ({
    collector: (document.querySelector('[data-field="p5_collector_a"]') || {}).value,
    haupt: (document.querySelector('[data-field="p5_jd_main_soll"]') || {}).value
  }));
  assert(errors.length === 0, 'Page-Errors: ' + errors.join(' | '));
  assert(werte.collector === '1-3-5-7',
    'Collector-Wert nicht uebernommen: ' + JSON.stringify(werte.collector));
  assert(werte.haupt === '144',
    'Hauptduesen-Wert nicht uebernommen: ' + JSON.stringify(werte.haupt));
  await ctx.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
