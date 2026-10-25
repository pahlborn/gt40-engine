// Regressionstests fuer das Speichern und Zusammenfuehren der Messwert-Felder.
//
// Gemeldetes Problem: Ein Messwert-Feld leeren wurde nicht gespeichert. Der alte
// Code hat an zwei Stellen "leer gewinnt nie" erzwungen - beim Speichern und beim
// Merge. Damit war das Loeschen eines Wertes nicht ausdrueckbar.
//
// Lokal: npm test

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, suite, test, assert, assertEqual, summary
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
      el.value = '';                                  // Feld leeren, wie der Nutzer
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
    el.value = ''; await saveData();
    const t2 = JSON.parse(localStorage.getItem('engineBuildLog'))._fieldTimes.crank_endplay;
    return { t1, t2 };
  });
  assert(typeof r.t1 === 'number' && typeof r.t2 === 'number', 'Keine Zeitstempel geschrieben');
  assert(r.t2 > r.t1, 'Das Leeren hat den Zeitstempel nicht aktualisiert');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Merge: ein geloeschtes Feld kommt nicht aus der Cloud zurueck');

await test('Juengeres Leeren gewinnt gegen aelteren Wert', async () => {
  // Seit v101 nur, wenn das Leeren nach dem Stichtag gestempelt wurde - die
  // Stempel davor stammen ueberwiegend aus dem Fehler, der jedes angezeigte
  // Feld stempelte (siehe die Suite zum Stichtag weiter unten).
  const p = await openPage('specs.html');
  const merged = await p.page.evaluate(() => FieldSync.mergeRecords(
    { crank_endplay: '0.006', _fieldTimes: { crank_endplay: FieldSync.LEER_STICHTAG + 1000 }, _savedAt: '2026-11-01T00:00:00Z' },
    { crank_endplay: '',      _fieldTimes: { crank_endplay: FieldSync.LEER_STICHTAG + 2000 }, _savedAt: '2026-11-02T00:00:00Z' }
  ).crank_endplay);
  assertEqual(merged, '', 'Der geloeschte Wert wurde ueberschrieben');
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
    el.value = ''; await saveData();                 // Nutzer leert das Feld
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

await test('Alle drei Seiten laden ohne Page-Errors', async () => {
  for (const file of PAGES) {
    const p = await openPage(file);
    assertEqual(p.errors, [], file);
    await p.close();
  }
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
