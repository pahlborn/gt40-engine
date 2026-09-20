// Smoke-Test gegen die wirklich ausgelieferte Seite auf GitHub Pages.
//
// Bewusst ohne feste Zahlen: es kommen laufend Fotos dazu. Geprueft wird nur,
// dass die Galerie sich ueberhaupt aus dem Repo aufbaut, dass sie das ohne
// Token tut und dass die Seite fehlerfrei laedt.
//
// Laeuft in CI nur auf main und blockiert nichts (continue-on-error).

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { suite, test, assert, summary, REPO_ROOT } from './helpers.mjs';

const BASE = process.env.SMOKE_BASE_URL || 'https://pahlborn.github.io/gt40-engine';

/** Cache-Version aus einer sw.js ziehen ('boss302-v28'). */
function cacheVersion(src) {
  const m = String(src).match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

/**
 * Auf den Pages-Deploy warten.
 *
 * Ohne das startet der Job direkt nach den Browser-Tests und trifft die Seite,
 * waehrend sie noch neu gebaut wird. Ein Fehlschlag waere harmlos - schlimmer
 * ist der andere Ausgang: gruen gegen die ALTE Version, also ein Test, der
 * still gar nichts prueft.
 */
async function waitForDeploy(expected, timeoutMs = 8 * 60 * 1000) {
  const started = Date.now();
  let seen = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(BASE + '/sw.js?cb=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        seen = cacheVersion(await res.text());
        if (seen === expected) {
          console.log('  Deploy ist durch: ' + seen
            + ' (nach ' + Math.round((Date.now() - started) / 1000) + 's)');
          return true;
        }
      }
    } catch (e) { /* Pages baut gerade - weiter warten */ }
    await new Promise((r) => setTimeout(r, 10000));
  }
  console.log('  Timeout: live ist ' + seen + ', erwartet ' + expected);
  return false;
}

const expectedVersion = cacheVersion(fs.readFileSync(path.join(REPO_ROOT, 'sw.js'), 'utf8'));
console.log('Erwartete Cache-Version aus dem Commit: ' + expectedVersion);
const deployed = await waitForDeploy(expectedVersion);

const browser = await chromium.launch();

try {
  suite('Live-Seite: ' + BASE);

  await test('Pages liefert den Stand dieses Commits aus', async () => {
    assert(deployed, 'Deploy war nach 8 Minuten nicht durch - alles Folgende'
      + ' haette die alte Version geprueft');
  });

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

  await test('Versionsnummer steht im Header', async () => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(BASE + '/specs.html', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1500);
    const shown = await page.evaluate(() => {
      const el = document.getElementById('appVersion');
      return el ? el.textContent.trim() : null;
    });
    assert(shown && /^v\d+$/.test(shown), 'Header zeigt keine Version (war: ' + shown + ')');
    console.log('        Header zeigt ' + shown);
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
