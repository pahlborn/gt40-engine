// Tests fuer Schritt 7a: Laenge der aeusseren Hauptlagerschrauben messen.
//
// Peter, 01.11.: Die sechs aeusseren (schraegen) Schrauben der Deckel 2-4
// fehlen und muessen bestellt werden - 3/8"-16 UNC, 10.9. Ford nennt keine
// Laenge. Der Schritt erfasst die Tiefe je Bohrung, Deckeldicke, Scheibe,
// Bodenabstand und die gewaehlte Laenge; hauptlager-mass.js rechnet daraus
// die groesste Laenge und den Gewindeeingriff.
//
// Fuer Bodenabstand und noetigen Eingriff steht bewusst keine Zahl da
// (Regel 5) - ohne Bodenabstand wird keine groesste Laenge genannt.
//
// Lokal: node tests/hauptlager-mass.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPO_ROOT, startServer, stubGitHub, suite, test, assert, assertEqual, summary } from './helpers.mjs';

const lies = (f) => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
await import(pathToFileURL(path.join(REPO_ROOT, 'hauptlager-mass.js')).href);
const HM = globalThis.HauptlagerMass;
const nah = (a, b) => a !== null && Math.abs(a - b) < 1e-9;

const { server, base } = await startServer();
const browser = await chromium.launch();

try {

// ---------------------------------------------------------------------------
suite('Rechnung (hauptlager-mass.js)');

await test('Groesste Laenge = kuerzeste Tiefe + Scheibe - Bodenabstand', async () => {
  const r = HM.auswerten({ t: ['2.10', '2.05', '2.12', '2.08', '2.20', '2.15'], s: '0.065', c: '0.100', d: '0.90', l: '1.75' });
  assertEqual(r.gemessen, 6, 'gemessene Bohrungen');
  assert(nah(r.tmin, 2.05), 'kuerzeste Tiefe ' + r.tmin);
  assert(nah(r.lmax, 2.05 + 0.065 - 0.100), 'groesste Laenge ' + r.lmax);
  assert(nah(r.eingriff, 1.75 - 0.065 - 0.90), 'Eingriff ' + r.eingriff);
  assertEqual(r.zuLang, false, 'zu lang');
});

await test('Ohne Bodenabstand keine groesste Laenge', async () => {
  const r = HM.auswerten({ t: ['2.1', '2.1', '2.1', '2.1', '2.1', '2.1'], s: '0.065', c: '', d: '0.9', l: '' });
  assertEqual(r.lmax, null, 'groesste Laenge ohne c');
  assert(r.fehlt.indexOf('abstand') >= 0, 'fehlender Bodenabstand nicht gemeldet');
});

await test('Zu lange Wahl wird erkannt, Komma als Dezimalzeichen geht', async () => {
  const r = HM.auswerten({ t: ['2,05', '2,10', '', '', '', ''], s: '0', c: '0,1', d: '0,9', l: '2,0' });
  assertEqual(r.gemessen, 2, 'nur zwei gemessen');
  assert(nah(r.lmax, 1.95), 'groesste Laenge ' + r.lmax);
  assertEqual(r.zuLang, true, 'zu lang');
  assert(r.fehlt.indexOf('tiefe') >= 0, 'fehlende Tiefen nicht gemeldet');
});

await test('Unsinnige Eingaben zaehlen nicht als Tiefe', async () => {
  const r = HM.auswerten({ t: ['abc', '-1', '0', '2.2', ' ', '2.3'], s: '0', c: '0', d: '', l: '' });
  assertEqual(r.gemessen, 2, 'gemessen');
  assert(nah(r.tmin, 2.2), 'kuerzeste Tiefe');
});

// ---------------------------------------------------------------------------
suite('Schritt 7a im Build Log');

const bl = lies('build-log.html');

await test('Der Schritt steht vor dem Hauptlagerspiel und Schritt 8 verweist darauf', async () => {
  const a = bl.indexOf('<div class="step-card" id="p1_step7a"');
  const b = bl.indexOf('<div class="step-card" id="p1_step8"');
  assert(a > 0 && b > a, 'Schritt 7a fehlt oder steht nicht vor Schritt 8');
  assert(/L&auml;nge messen: Schritt 7a/.test(bl.slice(b, bl.indexOf('<div class="step-card"', b + 10))),
    'Schritt 8 verweist nicht auf das Messen in 7a');
});

await test('Alle Messfelder sind da, eindeutig und rechnen bei Eingabe neu', async () => {
  const k = bl.slice(bl.indexOf('id="p1_step7a"'), bl.indexOf('id="p1_step8"'));
  const felder = [...HM.BOHRUNGEN, 'p1_mo_cap', 'p1_mo_washer', 'p1_mo_clear', 'p1_mo_len'];
  for (const f of felder) {
    const n = (bl.match(new RegExp('data-field="' + f + '"', 'g')) || []).length;
    assertEqual(n, 1, 'Feld ' + f + ' kommt ' + n + 'x vor');
    assert(new RegExp('data-field="' + f + '"[^>]*oninput="HauptlagerMass\\.onInput\\(\\)"').test(k),
      'Feld ' + f + ' rechnet bei Eingabe nicht neu');
  }
  for (const f of ['p1_mo_order_date', 'p1_mo_order_ref']) assert(k.includes('data-field="' + f + '"'), 'Feld ' + f + ' fehlt');
  const c = k.match(/data-field="p1_mo_clear"[^>]*placeholder="([^"]*)"/);
  assert(c && !/\d/.test(c[1]), 'Bodenabstand schlaegt eine Zahl vor');
});

await test('Modul ist eingebunden, wird nach Abgleich neu gerechnet und offline vorgehalten', async () => {
  assert(/<script defer src="hauptlager-mass\.js"><\/script>/.test(bl), 'Script fehlt in build-log.html');
  const ad = bl.slice(bl.indexOf('function applyData('), bl.indexOf('function lokalSpeichern('));
  assert(/HauptlagerMass\.render\(\)/.test(ad), 'applyData rechnet nach einem Abgleich nicht neu (Regel 8)');
  assert(lies('sw.js').includes("'/gt40-engine/hauptlager-mass.js'"), 'sw.js haelt das Modul nicht vor');
});

// ---------------------------------------------------------------------------
suite('Im Browser');

await test('Eingaben zeigen Ergebnis an und bleiben nach dem Neuladen erhalten', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined' && dataLoaded === true, null, { timeout: 30000 });
  const werte = { p1_mo_t2rh: '2.10', p1_mo_t2lh: '2.05', p1_mo_t3rh: '2.12', p1_mo_t3lh: '2.08', p1_mo_t4rh: '2.20', p1_mo_t4lh: '2.15',
    p1_mo_cap: '0.90', p1_mo_washer: '0.065', p1_mo_clear: '0.100', p1_mo_len: '2.25' };
  await page.evaluate((w) => {
    for (const [f, v] of Object.entries(w)) {
      const el = document.querySelector('[data-field="' + f + '"]');
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, werte);
  const lese = () => page.evaluate(() => ({
    n: document.getElementById('mo-gemessen').textContent,
    lmax: document.getElementById('mo-lmax').textContent,
    eingriff: document.getElementById('mo-eingriff').textContent,
    hinweis: document.getElementById('mo-hinweis').textContent
  }));
  let r = await lese();
  assertEqual(r.n, '6 / 6', 'gemessene Bohrungen');
  assert(r.lmax.startsWith('2.015"'), 'groesste Laenge angezeigt: ' + r.lmax);
  assert(r.eingriff.startsWith('1.285"'), 'Eingriff angezeigt: ' + r.eingriff);
  assert(/s&auml;&szlig;e auf|säße auf/.test(r.hinweis), 'Warnung bei zu langer Wahl fehlt: ' + r.hinweis);
  await page.waitForTimeout(900);   // autoSave schreibt nach 500 ms
  await page.reload();
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined' && dataLoaded === true, null, { timeout: 30000 });
  r = await lese();
  assertEqual(r.n, '6 / 6', 'nach dem Neuladen');
  assert(r.lmax.startsWith('2.015"'), 'groesste Laenge nach dem Neuladen: ' + r.lmax);
  assertEqual(fehler.length, 0, 'Seitenfehler: ' + fehler.join(' | '));
  await ctx.close();
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
