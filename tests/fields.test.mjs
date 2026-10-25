// Regressionstests fuer das Speichern und Zusammenfuehren der Messwert-Felder.
//
// Gemeldetes Problem: Ein Messwert-Feld leeren wurde nicht gespeichert. Der alte
// Code hat an zwei Stellen "leer gewinnt nie" erzwungen - beim Speichern und beim
// Merge. Damit war das Loeschen eines Wertes nicht ausdrueckbar.
//
// Lokal: npm test

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, TREE_FIXTURE, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

// Seiten, die Messwert-Felder anzeigen. Das konkrete Feld wird zur Laufzeit
// gewaehlt, damit der Test nicht bricht, wenn Felder umbenannt werden.
const PAGES = ['specs.html', 'index.html', 'build-log.html'];

async function openPage(file) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined', null, { timeout: 30000 });
  await page.waitForFunction(() => dataLoaded === true, null, { timeout: 30000 });
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Ein Feld leeren wird gespeichert (das gemeldete Problem)');

for (const file of PAGES) {
  await test(file + ': geleertes Feld bleibt geleert', async () => {
    const p = await openPage(file);
    const r = await p.page.evaluate(async () => {
      const el = Array.from(document.querySelectorAll('input[data-field]'))
        .find((e) => e.type === 'text' && !e.readOnly);
      if (!el) return { skipped: true };
      const f = el.dataset.field;
      el.value = '0.006';
      await saveData();
      const afterWrite = JSON.parse(localStorage.getItem('engineBuildLog'))[f];
      // Feld leeren, wie der Nutzer - mit dem Eingabe-Ereignis, das der
      // Browser dabei ausloest. Seit v109 zaehlt nur ein beruehrtes Feld.
      el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true }));
      await saveData();
      const afterClear = JSON.parse(localStorage.getItem('engineBuildLog'))[f];
      return { afterWrite, afterClear, field: f };
    });
    assert(!r.skipped, 'Kein beschreibbares Messwert-Feld auf ' + file + ' gefunden');
    assertEqual(r.afterWrite, '0.006', 'Schreiben');
    assertEqual(r.afterClear, '', 'Leeren');
    await p.close();
  });
}

await test('Leeren wird mit einem Zeitstempel versehen', async () => {
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(async () => {
    const el = document.querySelector('[data-field="crank_endplay"]');
    el.value = '0.006'; await saveData();
    const t1 = JSON.parse(localStorage.getItem('engineBuildLog'))._fieldTimes.crank_endplay;
    await new Promise((r) => setTimeout(r, 10));
    el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); await saveData();
    const t2 = JSON.parse(localStorage.getItem('engineBuildLog'))._fieldTimes.crank_endplay;
    return { t1, t2 };
  });
  assert(typeof r.t1 === 'number' && typeof r.t2 === 'number', 'Keine Zeitstempel geschrieben');
  assert(r.t2 > r.t1, 'Das Leeren hat den Zeitstempel nicht aktualisiert');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Merge: ein geloeschtes Feld kommt nicht aus der Cloud zurueck');

await test('Ein junges Leer schlaegt einen Wert nur, wenn es als bewusstes Leeren vermerkt ist (v109)', async () => {
  // v103 hatte das Leeren ganz ausgesetzt (Stempel nicht verlaesslich). Seit
  // v109 zaehlt ein Leer nur mit Eintrag in _geleert - den schreibt nur ein
  // Feld, das der Nutzer selbst geleert hat.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const wert = { crank_endplay: '0.006', _fieldTimes: { crank_endplay: 1000 } };
    const ohne = { crank_endplay: '', _fieldTimes: { crank_endplay: 2000 } };
    const mit = { crank_endplay: '', _fieldTimes: { crank_endplay: 2000 }, _geleert: { crank_endplay: 2000 } };
    return [FieldSync.LEER_LOESCHT, FieldSync.mergeRecords(wert, ohne).crank_endplay,
      FieldSync.mergeRecords(wert, mit).crank_endplay, FieldSync.mergeRecords(mit, wert).crank_endplay];
  });
  assertEqual(r, [true, '0.006', '', ''], 'Schalter / ohne Vermerk / mit Vermerk lokal / mit Vermerk in der Cloud');
  await p.close();
});

await test('Ein Status-Altwert "false" loescht nach dem Stichtag kein "erledigt" eines anderen Geraets (v103)', async () => {
  // Nachgerechnet am 2026-10-25: Die Seite zeigt "false" als offen ('') an.
  // Speichert das Geraet danach irgendein anderes Feld, wird daraus ein frisch
  // gestempeltes Leer. Ab dem Stichtag haette es das "done" eines anderen
  // Geraets geschlagen, das niemand angefasst hat.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const sept = Date.parse('2026-09-20T00:00:00Z');
    const laptop = FieldSync.mergeIntoExisting(
      { p1_timing_set: 'false', _fieldTimes: { p1_timing_set: sept } },
      { p1_timing_set: '', anderes_feld: '42' },
      { now: FieldSync.LEER_STICHTAG + 8 * 3600000 });
    const ipad = { p1_timing_set: 'done', _fieldTimes: { p1_timing_set: sept }, _savedAt: '2026-10-24T18:00:00Z' };
    return [FieldSync.mergeRecords(laptop, ipad).p1_timing_set, FieldSync.mergeRecords(ipad, laptop).p1_timing_set];
  });
  assertEqual(r, ['done', 'done'], 'Status nach dem Mischen (Laptop in der Cloud / iPad in der Cloud)');
  await p.close();
});

await test('Aelteres Leeren verliert gegen juengeren Wert', async () => {
  const p = await openPage('specs.html');
  const merged = await p.page.evaluate(() => FieldSync.mergeRecords(
    { crank_endplay: '0.007', _fieldTimes: { crank_endplay: 3000 }, _savedAt: '2026-01-03T00:00:00Z' },
    { crank_endplay: '',      _fieldTimes: { crank_endplay: 2000 }, _savedAt: '2026-01-02T00:00:00Z' }
  ).crank_endplay);
  assertEqual(merged, '0.007', 'Ein alter leerer Wert hat den neuen verdraengt');
  await p.close();
});

await test('Felder ohne Zeitstempel behalten die alte Heuristik (Altbestand)', async () => {
  // Vor dem Update gibt es keine _fieldTimes. Dann darf ein leeres Feld
  // einen vorhandenen Wert NICHT verdraengen, sonst gehen Altdaten verloren.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const m = FieldSync.mergeRecords(
      { alt_feld: '0.005', _savedAt: '2026-01-01T00:00:00Z' },
      { alt_feld: '',      _savedAt: '2026-01-09T00:00:00Z' }   // lokal neuer, aber leer
    );
    return m.alt_feld;
  });
  assertEqual(r, '0.005', 'Altbestand wurde durch ein leeres Feld ersetzt');
  await p.close();
});

await test('Felder, die nur eine Seite kennt, bleiben erhalten', async () => {
  const p = await openPage('specs.html');
  const m = await p.page.evaluate(() => FieldSync.mergeRecords(
    { nur_cloud: 'A', _fieldTimes: { nur_cloud: 100 } },
    { nur_lokal: 'B', _fieldTimes: { nur_lokal: 100 } }
  ));
  assertEqual(m.nur_cloud, 'A');
  assertEqual(m.nur_lokal, 'B');
  await p.close();
});

await test('Checkbox abwaehlen ueberlebt den Merge', async () => {
  const p = await openPage('specs.html');
  const m = await p.page.evaluate(() => FieldSync.mergeRecords(
    { chk_clay_check: true,  _fieldTimes: { chk_clay_check: 1000 } },
    { chk_clay_check: false, _fieldTimes: { chk_clay_check: 2000 } }
  ).chk_clay_check);
  assertEqual(m, false, 'Das Abwaehlen wurde rueckgaengig gemacht');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Stichtag: alte Leer-Stempel loeschen keine Werte (v101)');

await test('Ein Leer-Stempel vor dem Stichtag schlaegt keinen Wert - in beiden Richtungen', async () => {
  // Im Gist lagen 204 leere Felder mit Zeitstempel, in Bloecken von 77 und
  // 109 Feldern derselben Minute - je ein Seitenaufruf. Mit "juengerer
  // Stempel gewinnt" haetten sie die Werte eines anderen Geraets geloescht.
  // Der Testfall nimmt den Wert absichtlich AELTER als das Leer: genau dann
  // waere der Fehler sichtbar (Regel 6).
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const vor = FieldSync.LEER_STICHTAG - 60000;
    const wert = { x: '0.006', _fieldTimes: { x: vor - 1000 } };
    const leer = { x: '',      _fieldTimes: { x: vor } };
    return [FieldSync.mergeRecords(leer, wert).x, FieldSync.mergeRecords(wert, leer).x];
  });
  assertEqual(r, ['0.006', '0.006'], 'Wert nach dem Mischen (Cloud leer / lokal leer)');
  await p.close();
});

await test('Ein Leer ohne eigenen Stempel zaehlt nicht, auch mit neuem _savedAt', async () => {
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => FieldSync.mergeRecords(
    { x: '0.006', _fieldTimes: { x: FieldSync.LEER_STICHTAG + 10 } },
    { x: '', y: '1', _fieldTimes: { y: FieldSync.LEER_STICHTAG + 99 }, _savedAt: '2030-01-01T00:00:00Z' }
  ).x);
  assertEqual(r, '0.006', 'Ein Rueckfall auf _savedAt hat den Wert geloescht');
  await p.close();
});

await test('Ein nie ausgefuelltes Feld bekommt keinen Zeitstempel', async () => {
  const p = await openPage('specs.html');
  const t = await p.page.evaluate(() => {
    const r = FieldSync.mergeIntoExisting({}, { neu_leer: '', neu_haken: false }, { recordClears: true });
    return [r._fieldTimes.neu_leer, r._fieldTimes.neu_haken];
  });
  assertEqual(t, [undefined, undefined], 'Zeitstempel fuer nie gesetzte Felder');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Speichern liest vor dem Schreiben (v101)');

/** Seite mit nachgebautem Gist, der sich Geschriebenes merkt. */
async function openMitGist(file, gistFiles, extra = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const stub = await stubGitHub(page, Object.assign({
    gistFiles,
    onGistWrite: (files) => {
      for (const [n, f] of Object.entries(files)) gistFiles[n] = f.content;
    }
  }, extra));
  await page.goto(base + '/' + file);
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined' && dataLoaded === true,
    null, { timeout: 30000 });
  return { ctx, page, errors, stub, close: () => ctx.close() };
}

const DATEN = 'engine-build-log-data.json';
const fremdeCloud = () => ({ [DATEN]: JSON.stringify({
  fremdes_feld: 'vom anderen Geraet', _fieldTimes: { fremdes_feld: Date.now() - 60000 } }) });

/** Ein Wert in ein Eingabefeld der Seite, dann speichern wie per autoSave. */
const EINTRAGEN_UND_SPEICHERN = async () => {
  localStorage.setItem('gh_token', 'test-token');
  const el = document.querySelector('input[data-field]:not([readonly]):not([type=checkbox])');
  el.value = '1.234';
  await saveData();
  return el.dataset.field;
};

for (const file of PAGES) {
  await test(file + ': Werte des anderen Geraets bleiben in der Cloud', async () => {
    // Bis v100 schrieben index und specs den lokalen Speicher ungelesen in den
    // Gist, build-log mischte mit Object.assign. Felder, die dieses Geraet
    // nicht kannte, waren danach aus der Cloud weg.
    const gist = fremdeCloud();
    const d = await openMitGist(file, gist);
    const feld = await d.page.evaluate(EINTRAGEN_UND_SPEICHERN);
    const cloud = JSON.parse(gist[DATEN]);
    const fehler = d.errors.slice();
    await d.close();
    assertEqual(fehler, [], 'Fehler auf der Seite');
    assertEqual(cloud.fremdes_feld, 'vom anderen Geraet', 'Fremdes Feld in der Cloud');
    assertEqual(cloud[feld], '1.234', 'Eigener Wert in der Cloud');
  });

  await test(file + ': scheitert das Lesen, wird nicht geschrieben', async () => {
    // Ohne gelesenen Stand waere jedes Schreiben wieder ein blindes.
    const d = await openMitGist(file, fremdeCloud(), { gistGetStatus: 500 });
    await d.page.evaluate(EINTRAGEN_UND_SPEICHERN);
    await d.page.waitForTimeout(200);
    const schreibvorgaenge = d.stub.gistWrites.filter((f) => DATEN in f).length;
    await d.close();
    assertEqual(schreibvorgaenge, 0, 'Schreibzugriffe trotz Lesefehler');
  });
}

await test('build-log: Speichern loescht keine lokalen Werte anderer Seiten', async () => {
  // Object.assign(remote, myData) ersetzte den lokalen Speicher: was eine
  // andere Seite auf diesem Geraet eingetragen, aber noch nicht hochgeladen
  // hatte, war weg.
  const gist = fremdeCloud();
  const d = await openMitGist('build-log.html', gist);
  const lokal = await d.page.evaluate(async () => {
    const log = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
    log.nur_auf_specs = 'lokal, nicht hochgeladen';
    log._fieldTimes = Object.assign({}, log._fieldTimes, { nur_auf_specs: Date.now() });
    localStorage.setItem('engineBuildLog', JSON.stringify(log));
    localStorage.setItem('gh_token', 'test-token');
    await saveData();
    return JSON.parse(localStorage.getItem('engineBuildLog')).nur_auf_specs;
  });
  const cloud = JSON.parse(gist[DATEN]);
  await d.close();
  assertEqual(lokal, 'lokal, nicht hochgeladen', 'Lokaler Wert einer anderen Seite');
  assertEqual(cloud.nur_auf_specs, 'lokal, nicht hochgeladen', 'Derselbe Wert in der Cloud');
  assertEqual(cloud.fremdes_feld, 'vom anderen Geraet', 'Fremdes Feld in der Cloud');
});

// ---------------------------------------------------------------------------
suite('Uebernahme aus dem Build Log darf nichts wiederbeleben');

await test('Ein geleertes Feld wird nicht aus dem Build Log nachgefuellt', async () => {
  // crank_endplay wird aus p1_crank_endplay uebernommen, wenn es leer ist.
  // Damit kam ein geloeschter Wert bei jedem applyData() zurueck - und der
  // naechste Tastendruck schrieb ihn wieder in den Speicher.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(async () => {
    const el = document.querySelector('[data-field="crank_endplay"]');
    const log = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
    log.p1_crank_endplay = '0.006';
    log._fieldTimes = Object.assign({}, log._fieldTimes, { p1_crank_endplay: 1000 });
    localStorage.setItem('engineBuildLog', JSON.stringify(log));
    el.value = '0.006'; await saveData();
    el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); await saveData();   // Nutzer leert das Feld
    const nachSave = JSON.parse(localStorage.getItem('engineBuildLog')).crank_endplay;
    applyData(JSON.parse(localStorage.getItem('engineBuildLog')));   // wie beim Sync
    return { nachSave, imFeld: el.value };
  });
  assertEqual(r.nachSave, '', 'Im Speicher');
  assertEqual(r.imFeld, '', 'Im Feld nach applyData()');
  await p.close();
});

await test('Ein nie gesetztes Feld wird weiterhin uebernommen', async () => {
  // Die Uebernahme soll ja etwas nuetzen - nur nicht gegen den Nutzer.
  const p = await openPage('specs.html');
  const wert = await p.page.evaluate(() => {
    const el = document.querySelector('[data-field="crank_endplay"]');
    el.value = '';
    const daten = { p1_crank_endplay: '0.007' };     // kein _fieldTimes -> nie gesetzt
    applyData(daten);
    return el.value;
  });
  assertEqual(wert, '0.007', 'Uebernahme findet nicht statt');
  await p.close();
});

await test('Das gilt auch fuer Quench- und PTV-Felder', async () => {
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const q = document.querySelector('[data-field="quench_a_1"]');
    const t = document.querySelector('[data-field="ptv_intake_1"]');
    q.value = ''; t.value = '';
    applyData({ p2_quench_1: '0.040', p2_ptv_int: '0.100',
                _fieldTimes: { quench_a_1: 5000, ptv_intake_1: 5000 } });
    const geschuetzt = { quench: q.value, ptv: t.value };
    q.value = ''; t.value = '';
    applyData({ p2_quench_1: '0.040', p2_ptv_int: '0.100' });        // nie gesetzt
    return { geschuetzt, offen: { quench: q.value, ptv: t.value } };
  });
  assertEqual(r.geschuetzt, { quench: '', ptv: '' }, 'Geleerte Felder');
  assertEqual(r.offen, { quench: '0.040', ptv: '0.100' }, 'Nie gesetzte Felder');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Kein Datenverlust durch das neue Verhalten');

await test('Save waehrend des Ladens loescht nichts', async () => {
  // Vor dataLoaded stehen alle Felder auf leer. Ein Save in dem Moment
  // duerfte sonst den kompletten Datensatz ausradieren.
  const p = await openPage('specs.html');
  const kept = await p.page.evaluate(() => {
    const existing = { crank_endplay: '0.006', cam_endplay: '0.005' };
    const current = { crank_endplay: '', cam_endplay: '' };
    const r = FieldSync.mergeIntoExisting(existing, current, { recordClears: false });
    return r.crank_endplay === '0.006' && r.cam_endplay === '0.005';
  });
  assert(kept, 'Ein Save waehrend des Ladens hat Werte geloescht');
  await p.close();
});

await test('Felder anderer Seiten bleiben beim Speichern erhalten', async () => {
  // Jede Seite zeigt nur einen Teil der Felder. Was sie nicht kennt,
  // darf sie auch nicht anfassen.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => FieldSync.mergeIntoExisting(
    { feld_von_buildlog: 'bleibt', crank_endplay: '0.006' },
    { crank_endplay: '' },
    { recordClears: true }
  ));
  assertEqual(r.feld_von_buildlog, 'bleibt', 'Fremdes Feld wurde entfernt');
  assertEqual(r.crank_endplay, '', 'Eigenes Feld wurde nicht geleert');
  await p.close();
});

await test('Unveraenderte Felder bekommen keinen neuen Zeitstempel', async () => {
  const p = await openPage('specs.html');
  const same = await p.page.evaluate(() => {
    const existing = { a: '1', _fieldTimes: { a: 500 } };
    const r = FieldSync.mergeIntoExisting(existing, { a: '1' }, { recordClears: true, now: 9999 });
    return r._fieldTimes.a === 500;
  });
  assert(same, 'Ein unveraendertes Feld wurde neu gestempelt');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Holen und Nachziehen (v102)');

const BEFUNDE = 'engine-build-findings.json';
const FOTOS = 'engine-build-photos.json';

/** Seite mit verbundenem Gist; Token vor dem Laden gesetzt. */
async function verbunden(file, opts = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const gist = opts.gistFiles || (opts.gistFiles = {});
  const stub = await stubGitHub(page, Object.assign({
    onGistWrite: (files) => { for (const [n, f] of Object.entries(files)) gist[n] = f.content; }
  }, opts));
  await ctx.addInitScript(() => localStorage.setItem('gh_token', 'test-token'));
  await page.goto(base + '/' + file);
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined' && dataLoaded === true,
    null, { timeout: 30000 });
  await page.waitForTimeout(600);
  return { ctx, page, errors, stub, gist, close: () => ctx.close() };
}

await test('build-log: beim Oeffnen kommen Befunde und Galerie-Texte des anderen Geraets an', async () => {
  // Bis v101 holte keine der drei Fassungen die Galerie-Texte.
  const foto = 'shortblock/1700000000000_0.jpg';
  const d = await verbunden('build-log.html', { gistFiles: {
    [BEFUNDE]: JSON.stringify({ items: { b_ipad: { ch: 'p1', text: 'vom iPad', status: '', created: 1, m: 1 } } }),
    [FOTOS]: JSON.stringify({ version: 2, meta: { [foto]: { caption: 'Beschriftung vom iPad', m: 1 } }, videos: {}, hero: {} })
  } });
  const r = await d.page.evaluate((k) => ({
    befund: ((JSON.parse(localStorage.getItem('engineFindings') || '{}').items || {}).b_ipad || {}).text,
    text: (_galleryMeta.meta[k] || {}).caption
  }), foto);
  const fehler = d.errors.slice();
  await d.close();
  assertEqual(fehler, [], 'Fehler auf der Seite');
  assertEqual(r.befund, 'vom iPad', 'Befund nach dem Oeffnen');
  assertEqual(r.text, 'Beschriftung vom iPad', 'Galerie-Text nach dem Oeffnen');
});

await test('build-log: nach dem Holen zeichnen die Statusknoepfe neu', async () => {
  // Der Kommentar an renderAllStepStatus sagte "nach jedem Laden noetig" -
  // nach dem Holen aus der Cloud lief es trotzdem nicht.
  const d = await verbunden('build-log.html', { gistFiles: {
    [DATEN]: JSON.stringify({ x: '1', _fieldTimes: { x: 1 } })
  } });
  const aufrufe = await d.page.evaluate(async () => {
    let n = 0;
    const echt = window.renderAllStepStatus;
    window.renderAllStepStatus = function () { n++; return echt.apply(this, arguments); };
    await syncFromCloud({ still: true });
    return n;
  });
  await d.close();
  assert(aufrufe > 0, 'renderAllStepStatus lief nach dem Holen nicht');
});

await test('build-log: ein Lesefehler im Hintergrund steht im Protokoll', async () => {
  // Bis v101: r.json() ohne Pruefung von r.ok, dann ein leeres catch.
  const d = await verbunden('build-log.html', { gistGetStatus: 500 });
  const r = await d.page.evaluate(async () => {
    ErrorLog.leeren();
    const ok = await syncFromCloud({ still: true });
    return { ok, eintraege: ErrorLog.alle().map((e) => e.nachricht) };
  });
  await d.close();
  assertEqual(r.ok, false, 'Ergebnis');
  assert(r.eintraege.some((m) => /Abgleich: Status 500/.test(m)), 'Kein Eintrag: ' + r.eintraege.join(' | '));
});

await test('build-log: scheitert das Lesen, schreiben Befunde und Galerie nicht', async () => {
  // Bis v101 ging in dem Fall der rein lokale Stand hoch - wie in jerico bis v32.
  const d = await verbunden('build-log.html', { gistGetStatus: 500 });
  const r = await d.page.evaluate(async () => {
    ErrorLog.leeren();
    await Findings.push();
    await pushGalleryMeta();
    return ErrorLog.alle().map((e) => e.nachricht);
  });
  const schreibvorgaenge = d.stub.gistWrites.filter((w) => BEFUNDE in w || FOTOS in w).length;
  await d.close();
  assertEqual(schreibvorgaenge, 0, 'Schreibzugriffe trotz Lesefehler');
  assert(r.some((m) => /Befunde/.test(m)) && r.some((m) => /Galerie/.test(m)),
    'Fehler von Befunden/Galerie stehen nicht im Protokoll: ' + r.join(' | '));
});

for (const file of ['index.html', 'specs.html']) {
  await test(file + ': nach dem Holen wird das Dashboard nachgezogen', async () => {
    // Bis v101 lief updateBuildDashboard nur einmal beim Start - bevor die
    // Cloud-Werte da waren.
    const d = await verbunden(file, { gistFiles: {
      [DATEN]: JSON.stringify({ x: '1', _fieldTimes: { x: 1 } })
    } });
    const aufrufe = await d.page.evaluate(async () => {
      let n = 0;
      const echt = window.updateBuildDashboard;
      window.updateBuildDashboard = function () { n++; return echt.apply(this, arguments); };
      holenImHintergrund();
      await new Promise((r) => setTimeout(r, 600));
      return n;
    });
    await d.close();
    assert(aufrufe > 0, 'updateBuildDashboard lief nach dem Holen nicht');
  });

  await test(file + ': ein Lesefehler im Hintergrund steht im Protokoll', async () => {
    const d = await verbunden(file, { gistGetStatus: 500 });
    const r = await d.page.evaluate(async () => {
      ErrorLog.leeren();
      holenImHintergrund();
      await new Promise((r) => setTimeout(r, 600));
      return ErrorLog.alle().map((e) => e.nachricht);
    });
    await d.close();
    assert(r.some((m) => /Abgleich: (Status|HTTP) 500/.test(m)), 'Kein Eintrag: ' + r.join(' | '));
  });
}

await test('Ein gekuerztes Bild-Listing raeumt keine Beschriftungen weg', async () => {
  const tree = JSON.parse(JSON.stringify(TREE_FIXTURE));
  tree.truncated = true;
  const key = 'shortblock/1600000000000_9.jpg';     // nicht im (gekuerzten) Listing
  const d = await verbunden('specs.html', { tree });
  await d.page.waitForFunction(() => typeof _treeFetchedAt !== 'undefined' && _treeFetchedAt > 0,
    null, { timeout: 30000 });
  await d.page.evaluate(async (k) => {
    _galleryMeta.meta[k] = { caption: 'Bild jenseits des Listings', m: 1 };
    saveGalleryMeta();
    await pushGalleryMeta();
  }, key);
  const meta = JSON.parse(d.gist[FOTOS] || '{}').meta || {};
  await d.close();
  assert(meta[key], 'Die Beschriftung wurde bei gekuerztem Listing weggeraeumt');
});

await test('Alle drei Seiten laden ohne Page-Errors', async () => {
  for (const file of PAGES) {
    const p = await openPage(file);
    assertEqual(p.errors, [], file);
    await p.close();
  }
});

// ---------------------------------------------------------------------------
suite('Statusknopf: von erledigt zurueck auf offen (v104)');

await test('Ein erledigter Schritt laesst sich wieder auf offen und in Arbeit stellen - auch mit Cloud', async () => {
  // 2026-10-25, Schritt 27 am iPad: "offen" war ein leerer Wert. Seit v103
  // schlaegt ein Leer keinen Wert, also holte der Abgleich sofort "erledigt"
  // zurueck - der Knopf liess sich nicht mehr umstellen.
  const vorhin = Date.now() - 60000;
  const gist = { [DATEN]: JSON.stringify({ p1_timing_set: 'done', _fieldTimes: { p1_timing_set: vorhin } }) };
  const d = await openMitGist('build-log.html', gist);
  const schritte = await d.page.evaluate(async (t) => {
    localStorage.setItem('engineBuildLog', JSON.stringify({ p1_timing_set: 'done', _fieldTimes: { p1_timing_set: t } }));
    localStorage.setItem('gh_token', 'test-token');
    applyData(JSON.parse(localStorage.getItem('engineBuildLog')));
    renderAllStepStatus();
    const btn = document.querySelector('.step-status[data-field="p1_timing_set"]');
    const stand = [];
    for (let i = 0; i < 3; i++) {
      cycleStepStatus(btn);
      clearTimeout(autoSaveTimer);
      await saveData();
      stand.push(Findings.normalizeStatus(btn.value) || 'offen');
    }
    return stand;
  }, vorhin);
  const cloud = JSON.parse(gist[DATEN]);
  await d.close();
  assertEqual(schritte, ['offen', 'wip', 'done'], 'Knopf nach drei Tipps');
  assertEqual(cloud.p1_timing_set, 'done', 'Cloud nach drei Tipps');
});

await test('Ein alter Status "false" bleibt beim Speichern eines anderen Felds unberuehrt', async () => {
  // Bis v103 schrieb das Anzeigen "false" auf leer um; das naechste Speichern
  // stempelte daraus ein Leeren, das niemand gemacht hatte.
  const p = await openPage('build-log.html');
  const r = await p.page.evaluate(async () => {
    const sept = Date.parse('2026-09-20T00:00:00Z');
    localStorage.setItem('engineBuildLog', JSON.stringify({ p1_timing_set: 'false', _fieldTimes: { p1_timing_set: sept } }));
    applyData(JSON.parse(localStorage.getItem('engineBuildLog')));
    renderAllStepStatus();
    const btn = document.querySelector('.step-status[data-field="p1_timing_set"]');
    document.querySelector('[data-field="p1_pd_cyl1"]').value = '0.0130';
    await saveData();
    const log = JSON.parse(localStorage.getItem('engineBuildLog'));
    return [log.p1_timing_set, log._fieldTimes.p1_timing_set === sept, btn.getAttribute('aria-label')];
  });
  await p.close();
  assertEqual(r, ['false', true, 'Status: offen'], 'Wert / Zeitstempel unveraendert / Anzeige');
});

await test('Offen kommt in der Cloud an und schlaegt dort ein aelteres erledigt', async () => {
  const vorhin = Date.now() - 60000;
  const gist = { [DATEN]: JSON.stringify({ p1_timing_set: 'done', _fieldTimes: { p1_timing_set: vorhin } }) };
  const d = await openMitGist('build-log.html', gist);
  const r = await d.page.evaluate(async (t) => {
    localStorage.setItem('engineBuildLog', JSON.stringify({ p1_timing_set: 'done', _fieldTimes: { p1_timing_set: t } }));
    localStorage.setItem('gh_token', 'test-token');
    applyData(JSON.parse(localStorage.getItem('engineBuildLog')));
    renderAllStepStatus();
    const btn = document.querySelector('.step-status[data-field="p1_timing_set"]');
    cycleStepStatus(btn);
    clearTimeout(autoSaveTimer);
    await saveData();
    return [Findings.normalizeStatus(btn.value), btn.getAttribute('aria-label')];
  }, vorhin);
  const cloud = JSON.parse(gist[DATEN]);
  await d.close();
  assertEqual(r, ['', 'Status: offen'], 'Knopf nach einem Tipp');
  assertEqual(['done', 'wip', true, 'true', 'on'].includes(cloud.p1_timing_set), false, 'Status in der Cloud noch erledigt/in Arbeit: ' + JSON.stringify(cloud.p1_timing_set));
});

// ---------------------------------------------------------------------------
suite('Hochladen: buendeln, nacheinander, nachholen (v105)');

/** Erstes Eingabefeld der Seite, das beim Tippen speichert. */
const TIPPFELD = 'input[data-field][oninput*="autoSave"]:not([readonly]):not([type=checkbox])';

for (const file of PAGES) {
  await test(file + ': fuenf Eingaben in Folge ergeben einen Schreibvorgang', async () => {
    // 2026-10-24: von 20:47 bis 21:01 rund 70 Gist-Staende, dann bremste
    // GitHub das Konto (403). Jede Eingabe war ein eigener Schreibvorgang.
    const gist = fremdeCloud();
    const d = await openMitGist(file, gist);
    const feld = await d.page.evaluate(async (sel) => {
      localStorage.setItem('gh_token', 'test-token');
      FieldSync.BUENDELN_MS = 1200;
      const el = document.querySelector(sel);
      for (let i = 1; i <= 5; i++) {
        el.value = '0.00' + i;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 700));
      }
      await new Promise((r) => setTimeout(r, 2500));
      return el.dataset.field;
    }, TIPPFELD);
    const schreibvorgaenge = d.stub.gistWrites.filter((f) => DATEN in f).length;
    const cloud = JSON.parse(gist[DATEN]);
    await d.close();
    assertEqual(schreibvorgaenge, 1, 'Schreibvorgaenge fuer fuenf Eingaben');
    assertEqual(cloud[feld], '0.005', 'Letzter Wert in der Cloud');
  });

  await test(file + ': gleichzeitiges Speichern schreibt nie gleichzeitig', async () => {
    // 2026-10-25, 16:29: vier Staende in drei Sekunden vom selben iPad, einer
    // kollidierte (409).
    const gist = fremdeCloud();
    const d = await openMitGist(file, gist, { gistWriteDelayMs: 400 });
    const feld = await d.page.evaluate(async (sel) => {
      localStorage.setItem('gh_token', 'test-token');
      const el = document.querySelector(sel);
      el.value = '1.111'; const a = saveData();
      el.value = '2.222'; const b = saveData();
      el.value = '3.333'; const c = saveData();
      await Promise.all([a, b, c]);
      return el.dataset.field;
    }, TIPPFELD);
    const cloud = JSON.parse(gist[DATEN]);
    const max = d.stub.maxGleichzeitig;
    await d.close();
    assertEqual(max, 1, 'Gleichzeitig offene Schreibvorgaenge');
    assertEqual(cloud[feld], '3.333', 'Letzter Wert in der Cloud');
  });

  await test(file + ': nach einer Ablehnung wird nachgeholt, die Anzeige sagt es', async () => {
    // 2026-10-24: das iPad bekam 409 und 403 - und versuchte es nie wieder.
    const gist = fremdeCloud();
    const d = await openMitGist(file, gist, { gistWriteStatus: (n) => (n === 1 ? 409 : 200) });
    const r = await d.page.evaluate(async (sel) => {
      localStorage.setItem('gh_token', 'test-token');
      FieldSync.WIEDERHOLEN_MS = [600];
      const el = document.querySelector(sel);
      el.value = '4.444';
      await saveData();
      const badge = () => (document.getElementById('syncBadge') || {}).textContent || '';
      const direkt = [FieldSync.ungesendet('engineBuildLog'), badge()];
      await new Promise((res) => setTimeout(res, 2000));
      return { feld: el.dataset.field, direkt, spaeter: [FieldSync.ungesendet('engineBuildLog'), badge()] };
    }, TIPPFELD);
    const cloud = JSON.parse(gist[DATEN]);
    await d.close();
    assertEqual(r.direkt[0], true, 'Merkzeichen nach der Ablehnung');
    assert(/Nicht hochgeladen/.test(r.direkt[1]), 'Anzeige nach der Ablehnung: ' + r.direkt[1]);
    assertEqual(cloud[r.feld], '4.444', 'Wert in der Cloud nach dem Nachholen');
    assertEqual(r.spaeter[0], false, 'Merkzeichen nach dem Nachholen');
    assert(!/Nicht hochgeladen/.test(r.spaeter[1]), 'Anzeige nach dem Nachholen: ' + r.spaeter[1]);
  });

  await test(file + ': Liegengebliebenes wird beim Oeffnen hochgeladen', async () => {
    // 2026-10-24/25: die Werte des iPads lagen nur dort; Oeffnen holte nur.
    const gist = fremdeCloud();
    const ctx = await browser.newContext();
    await ctx.addInitScript(() => {
      if (sessionStorage.getItem('vorbereitet')) return;
      sessionStorage.setItem('vorbereitet', '1');
      localStorage.setItem('gh_token', 'test-token');
      localStorage.setItem('engineBuildLog', JSON.stringify({
        liegengeblieben: '0.0145', _fieldTimes: { liegengeblieben: Date.now() - 5000 } }));
      localStorage.setItem('engineBuildLog_ungesendet', '1');
    });
    const page = await ctx.newPage();
    await stubGitHub(page, { gistFiles: gist, onGistWrite: (files) => {
      for (const [n, f] of Object.entries(files)) gist[n] = f.content;
    } });
    await page.goto(base + '/' + file);
    await page.waitForFunction(() => typeof dataLoaded !== 'undefined' && dataLoaded === true, null, { timeout: 30000 });
    await page.waitForTimeout(1500);
    const merk = await page.evaluate(() => FieldSync.ungesendet('engineBuildLog'));
    const cloud = JSON.parse(gist[DATEN]);
    await ctx.close();
    assertEqual(cloud.liegengeblieben, '0.0145', 'Liegengebliebener Wert in der Cloud');
    assertEqual(cloud.fremdes_feld, 'vom anderen Geraet', 'Fremdes Feld in der Cloud');
    assertEqual(merk, false, 'Merkzeichen nach dem Hochladen');
  });
}

// ---------------------------------------------------------------------------
suite('Alte offene Tabs: eine neuere Version hat geschrieben (v106)');

await test('Hat eine neuere Version geschrieben, schreibt dieser Tab nicht und laedt neu', async () => {
  // 2026-10-25, 04:57: ein vergessener Tab mit v100 schrieb seinen alten
  // Stand ueber die Werte vom Vorabend.
  const gist = { [DATEN]: JSON.stringify({ fremdes_feld: 'vom neueren Geraet', _neuesteVersion: 'v999',
    _fieldTimes: { fremdes_feld: Date.now() - 60000 } }) };
  const d = await openMitGist('build-log.html', gist);
  const r = await d.page.evaluate(async (sel) => {
    localStorage.setItem('gh_token', 'test-token');
    window.__neuGeladen = false;
    FieldSync.neuLaden = () => { window.__neuGeladen = true; };
    const el = document.querySelector(sel);
    el.value = '9.999';
    await saveData();
    await new Promise((res) => setTimeout(res, 2500));
    const lokal = JSON.parse(localStorage.getItem('engineBuildLog'));
    return { feld: el.dataset.field, neu: window.__neuGeladen, lokal: lokal[el.dataset.field],
             merk: FieldSync.ungesendet('engineBuildLog') };
  }, TIPPFELD);
  const schreibvorgaenge = d.stub.gistWrites.filter((f) => DATEN in f).length;
  await d.close();
  assertEqual(schreibvorgaenge, 0, 'Schreibvorgaenge des veralteten Tabs');
  assertEqual(r.neu, true, 'Neu laden angestossen');
  assertEqual(r.lokal, '9.999', 'Eingabe lokal erhalten');
  assertEqual(r.merk, true, 'Merkzeichen bleibt fuer das Hochladen nach dem Neuladen');
});

await test('Jeder Schreibvorgang traegt die eigene Version ein, eine aeltere blockiert nicht', async () => {
  const gist = { [DATEN]: JSON.stringify({ fremdes_feld: 'alt', _neuesteVersion: 'v1',
    _fieldTimes: { fremdes_feld: Date.now() - 60000 } }) };
  const d = await openMitGist('build-log.html', gist);
  const eigene = await d.page.evaluate(async (sel) => {
    localStorage.setItem('gh_token', 'test-token');
    document.querySelector(sel).value = '1.010';
    await saveData();
    return APP_VERSION;
  }, TIPPFELD);
  const cloud = JSON.parse(gist[DATEN]);
  await d.close();
  assertEqual(cloud._neuesteVersion, eigene, 'Version in der Cloud-Datei');
  assertEqual(cloud.fremdes_feld, 'alt', 'Fremdes Feld erhalten');
});

// ---------------------------------------------------------------------------
suite('Zwei Geraete gleichzeitig (v107)');

await test('Speichern zwei Geraete fast gleichzeitig, kommen beide Aenderungen in der Cloud an', async () => {
  // Ein Gist kennt kein bedingtes Schreiben: liest B, bevor A geschrieben
  // hat, schreibt B einen Stand ohne A. Bis v106 fehlte A danach in der
  // Cloud, bis A wieder etwas speicherte.
  const gist = fremdeCloud();
  const a = await openMitGist('build-log.html', gist, { gistWriteDelayMs: 600 });
  const b = await openMitGist('build-log.html', gist, { gistWriteDelayMs: 600 });
  const vorbereiten = (p, nr) => p.page.evaluate(([sel, nr]) => {
    localStorage.setItem('gh_token', 'test-token');
    FieldSync.NACHPRUEFEN_MS = 1500;
    const el = document.querySelectorAll(sel)[nr];
    el.value = nr === 0 ? '0.0131' : '0.0142';
    return el.dataset.field;
  }, [TIPPFELD, nr]);
  const feldA = await vorbereiten(a, 0);
  const feldB = await vorbereiten(b, 1);
  await Promise.all([a.page.evaluate(() => saveData()), b.page.evaluate(() => saveData())]);
  await a.page.waitForTimeout(4500);
  const cloud = JSON.parse(gist[DATEN]);
  await a.close(); await b.close();
  assert(feldA !== feldB, 'Testaufbau: zwei verschiedene Felder');
  assertEqual(cloud[feldA], '0.0131', 'Aenderung von Geraet A in der Cloud');
  assertEqual(cloud[feldB], '0.0142', 'Aenderung von Geraet B in der Cloud');
  assertEqual(cloud.fremdes_feld, 'vom anderen Geraet', 'Fremdes Feld erhalten');
});

// ---------------------------------------------------------------------------
suite('Felder ohne Zeitstempel (v108)');

await test('Ein gestempelter Wert schlaegt Altbestand ohne Stempel - auch wenn der Datensatz juenger ist', async () => {
  // 2026-10-25: 29 Felder mit Wert hatten im Gist keinen Stempel (v100 hatte
  // sie beim Schreiben verworfen), darunter der Kolbenueberstand. Bis v107
  // galt fuer sie der Zeitpunkt des ganzen Datensatzes: ein Geraet mit
  // veraltetem Stand, das irgendein Feld speicherte, gewann alle.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const gestempelt = { p1_pd_cyl2: '0.0140', _fieldTimes: { p1_pd_cyl2: Date.parse('2026-10-25T20:00:00Z') },
      _savedAt: '2026-10-25T20:00:00Z' };
    const veraltet = { p1_pd_cyl2: '100000', anderes: '1', _fieldTimes: { anderes: Date.parse('2026-10-26T09:00:00Z') },
      _savedAt: '2026-10-26T09:00:00Z' };
    return [FieldSync.mergeRecords(gestempelt, veraltet).p1_pd_cyl2, FieldSync.mergeRecords(veraltet, gestempelt).p1_pd_cyl2];
  });
  await p.close();
  assertEqual(r, ['0.0140', '0.0140'], 'Wert nach dem Mischen (gestempelt in der Cloud / lokal)');
});

await test('Gewinnt Altbestand ohne Stempel, bekommt er keinen erfundenen Stempel', async () => {
  // Bis v107 bekam der Gewinner den Zeitpunkt des Datensatzes als Stempel -
  // aus "unbekannt" wurde so eine Aussage.
  const p = await openPage('specs.html');
  const r = await p.page.evaluate(() => {
    const m = FieldSync.mergeRecords(
      { x: '', _fieldTimes: { x: Date.parse('2026-10-20T00:00:00Z') } },
      { x: 'Altbestand', _savedAt: '2026-10-25T00:00:00Z' });
    return [m.x, m._fieldTimes.x];
  });
  await p.close();
  assertEqual(r, ['Altbestand', undefined], 'Wert / Stempel');
});

// ---------------------------------------------------------------------------
suite('Leeren und Eingaben waehrend eines Abgleichs (v109)');

/** Geraet mit Wert in Cloud und lokal; liefert den Feldnamen. */
const MIT_WERT = async (d, sel) => d.page.evaluate((sel) => {
  localStorage.setItem('gh_token', 'test-token');
  const el = document.querySelector(sel);
  const log = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
  log[el.dataset.field] = 'alt';
  log._fieldTimes = Object.assign({}, log._fieldTimes, { [el.dataset.field]: Date.now() - 60000 });
  localStorage.setItem('engineBuildLog', JSON.stringify(log));
  applyData(log);
  return el.dataset.field;
}, sel);
const CLOUD_MIT = (feld) => ({ [DATEN]: JSON.stringify({ [feld]: 'alt', _fieldTimes: { [feld]: Date.now() - 60000 } }) });

await test('Ein vom Nutzer geleertes Feld bleibt leer und wandert auf andere Geraete', async () => {
  // Seit v103 holte der Abgleich den alten Wert zurueck: Leeren war
  // ausgesetzt, weil nicht zu unterscheiden war, wer geleert hatte.
  const feld = await (async () => { const p = await openPage('build-log.html');
    const f = await p.page.evaluate((sel) => document.querySelector(sel).dataset.field, TIPPFELD); await p.close(); return f; })();
  const gist = CLOUD_MIT(feld);
  const d = await openMitGist('build-log.html', gist);
  await MIT_WERT(d, TIPPFELD);
  const imFeld = await d.page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true }));
    await saveData();
    return el.value;
  }, TIPPFELD);
  const cloud = JSON.parse(gist[DATEN]);
  const anderes = await d.page.evaluate(([c, f]) => FieldSync.mergeRecords(c,
    { [f]: 'alt', _fieldTimes: { [f]: Date.now() - 60000 } })[f], [cloud, feld]);
  await d.close();
  assertEqual(imFeld, '', 'Im Feld');
  assertEqual(cloud[feld], '', 'In der Cloud');
  assert(cloud._geleert && cloud._geleert[feld] > 0, 'Leeren nicht vermerkt');
  assertEqual(anderes, '', 'Auf einem anderen Geraet nach dem Abgleich');
});

await test('Ein nur leer angezeigtes Feld loescht nichts', async () => {
  // Felder, die spaet erzeugt werden oder einen Wert nicht darstellen
  // koennen, stehen leer da, ohne dass jemand sie geleert hat.
  const feld = await (async () => { const p = await openPage('build-log.html');
    const f = await p.page.evaluate((sel) => document.querySelector(sel).dataset.field, TIPPFELD); await p.close(); return f; })();
  const gist = CLOUD_MIT(feld);
  const d = await openMitGist('build-log.html', gist);
  await MIT_WERT(d, TIPPFELD);
  const lokal = await d.page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    el.value = '';                                    // ohne Eingabe
    // Ohne Verbindung: hier wirkt allein die Regel beim lokalen Speichern,
    // kein Abgleich holt den Wert zurueck.
    localStorage.removeItem('gh_token');
    await saveData();
    return JSON.parse(localStorage.getItem('engineBuildLog'))[el.dataset.field];
  }, TIPPFELD);
  const cloud = JSON.parse(gist[DATEN]);
  await d.close();
  assertEqual(lokal, 'alt', 'Lokal');
  assertEqual(cloud[feld], 'alt', 'In der Cloud');
});

await test('Eine Eingabe waehrend eines Abgleichs wird gespeichert und nicht ueberschrieben', async () => {
  // Bis v108 verwarf autoSave jede Eingabe, solange ein Abgleich lief, und
  // applyData setzte das Feld danach auf den alten Wert zurueck.
  const feld = await (async () => { const p = await openPage('build-log.html');
    const f = await p.page.evaluate((sel) => document.querySelector(sel).dataset.field, TIPPFELD); await p.close(); return f; })();
  const gist = CLOUD_MIT(feld);
  const d = await openMitGist('build-log.html', gist, { gistGetDelayMs: 600 });
  await MIT_WERT(d, TIPPFELD);
  const r = await d.page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    const lauf = syncFromCloud({ still: true });
    await new Promise((res) => setTimeout(res, 80));
    el.value = '8.888'; el.dispatchEvent(new Event('input', { bubbles: true }));
    await lauf;
    await new Promise((res) => setTimeout(res, 1500));
    return { imFeld: el.value, lokal: JSON.parse(localStorage.getItem('engineBuildLog'))[el.dataset.field] };
  }, TIPPFELD);
  await d.close();
  assertEqual(r.imFeld, '8.888', 'Im Feld nach dem Abgleich');
  assertEqual(r.lokal, '8.888', 'Lokal gespeichert');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
