// Smoke-Test gegen die wirklich ausgelieferte Seite auf GitHub Pages.
//
// Bewusst ohne feste Zahlen: es kommen laufend Fotos dazu. Geprueft wird nur,
// dass die Galerie sich ueberhaupt aus dem Repo aufbaut, dass sie das ohne
// Token tut und dass die Seite fehlerfrei laedt.
//
// Laeuft in CI nur auf main und blockiert nichts (continue-on-error).

import { chromium } from 'playwright';
import { suite, test, assert, summary } from './helpers.mjs';

const BASE = process.env.SMOKE_BASE_URL || 'https://pahlborn.github.io/gt40-engine';
const browser = await chromium.launch();

try {
  suite('Live-Seite: ' + BASE);

  for (const file of ['index.html', 'specs.html', 'build-log.html']) {
    await test(file + ' laedt ohne Page-Errors', async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const res = await page.goto(BASE + '/' + file, { waitUntil: 'load', timeout: 60000 });
      assert(res && res.ok(), 'HTTP ' + (res ? res.status() : 'kein Response'));
      await page.waitForTimeout(3000);
      assert(errors.length === 0, 'Page-Errors: ' + errors.join(' | '));
      await ctx.close();
    });
  }

  await test('specs.html baut die Galerie ohne Token aus dem Repo auf', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/specs.html', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(
      () => typeof _treeFetchedAt !== 'undefined' && _treeFetchedAt > 0,
      null, { timeout: 60000 });

    const r = await page.evaluate(() => {
      let n = 0;
      for (const g in photoData) n += photoData[g].length;
      return { hasToken: !!localStorage.getItem('gh_token'), photos: n, groups: Object.keys(photoData).length };
    });
    assert(!r.hasToken, 'Der Test lief mit Token - er soll den tokenlosen Fall pruefen');
    assert(r.photos > 0, 'Galerie ist leer (' + r.photos + ' Fotos) - genau der alte Fehler');
    console.log('        ' + r.photos + ' Fotos in ' + r.groups + ' Gruppen');
    await ctx.close();
  });

  await test('field-sync.js wird ausgeliefert', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.goto(BASE + '/field-sync.js', { timeout: 60000 });
    assert(res && res.ok(), 'HTTP ' + (res ? res.status() : 'kein Response'));
    assert((await res.text()).includes('mergeRecords'), 'Inhalt passt nicht');
    await ctx.close();
  });

} finally {
  await browser.close();
}

process.exit(summary() === 0 ? 0 : 1);
