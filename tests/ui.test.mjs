// Tests fuer Versionsanzeige, Sync-Datum und Galerie-Beschriftung.
//
// Lokal: npm test

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, waitForGallery, REPO_ROOT,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
const PAGES = ['index.html', 'specs.html', 'build-log.html'];

async function open(file, { gallery = false } = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  if (gallery) await waitForGallery(page);
  else await page.waitForTimeout(1200);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Version: eine Quelle, die nicht auseinanderlaufen kann');

await test('version.js und sw.js nennen dieselbe Version', async () => {
  // Ohne diese Pruefung faellt frueher oder spaeter auf, dass der Header eine
  // andere Version anzeigt, als der Service Worker ausliefert.
  const sw = fs.readFileSync(path.join(REPO_ROOT, 'sw.js'), 'utf8');
  const vjs = fs.readFileSync(path.join(REPO_ROOT, 'version.js'), 'utf8');
  const cacheName = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  const appVersion = (vjs.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  assert(cacheName, 'CACHE_NAME nicht gefunden');
  assert(appVersion, 'APP_VERSION nicht gefunden');
  assertEqual(cacheName, 'boss302-' + appVersion,
    'sw.js (' + cacheName + ') passt nicht zu version.js (' + appVersion + ')');
});

for (const file of PAGES) {
  await test(file + ': Version steht unter dem Titel', async () => {
    const p = await open(file);
    const shown = await p.page.evaluate(() => {
      const el = document.getElementById('appVersion');
      if (!el) return null;
      const title = el.closest('.header-title');
      return { text: el.textContent.trim(), imTitel: !!title };
    });
    assert(shown, 'Kein #appVersion-Element auf ' + file);
    assert(/^v\d+$/.test(shown.text), 'Version sieht falsch aus: ' + shown.text);
    assert(shown.imTitel, 'Version steht nicht im Titelblock');
    await p.close();
  });
}

for (const file of PAGES) {
  await test(file + ': Version steht auch im Menue', async () => {
    const p = await open(file);
    const txt = await p.page.evaluate(() =>
      Array.from(document.querySelectorAll('.app-version')).map((e) => e.textContent.trim()));
    assert(txt.length > 0, 'Kein .app-version im Menue');
    assert(txt.every((t) => /^v\d+$/.test(t)), 'Menue zeigt: ' + JSON.stringify(txt));
    await p.close();
  });
}

await test('Das Sync-Badge nennt keine Version mehr', async () => {
  // Es beschreibt den Verbindungszustand. Die Version gehoert an eine Stelle.
  const p = await open('specs.html');
  const txt = await p.page.evaluate(() => {
    updateSyncBadge();
    return document.getElementById('syncBadge').textContent;
  });
  assert(!/v\d/.test(txt), 'Badge enthaelt noch eine Version: ' + txt);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Sync-Datum im Header');

await test('Foto-Aenderungen aktualisieren das Datum', async () => {
  // Frueher las updateSaveStatus nur engineBuildLog._savedAt, weshalb das
  // Datum beim Speichern von Bildern unveraendert stehen blieb.
  const p = await open('specs.html', { gallery: true });
  const r = await p.page.evaluate(async () => {
    const el = document.getElementById('saveStatus');
    const before = el.textContent;
    const group = Object.keys(photoData)[0];
    setHero(group, 0);                       // eine ganz normale Galerie-Aenderung
    await new Promise((r) => setTimeout(r, 50));
    return { before, after: el.textContent, savedAt: _galleryMeta.savedAt };
  });
  assert(r.savedAt > 0, 'Galerie hat keinen Zeitstempel bekommen');
  assert(/Fotos/.test(r.after), 'Status nennt die Fotos nicht: ' + r.after);
  assert(r.after !== r.before, 'Status hat sich nicht geaendert');
  await p.close();
});

await test('Ohne Foto-Aenderung bleibt es bei den Messwerten', async () => {
  const p = await open('specs.html', { gallery: true });
  const txt = await p.page.evaluate(async () => {
    document.querySelector('[data-field="crank_endplay"]').value = '0.006';
    await saveData();
    return document.getElementById('saveStatus').textContent;
  });
  assert(/Messwerte/.test(txt), 'Status nennt die Messwerte nicht: ' + txt);
  await p.close();
});

await test('Der Galerie-Zeitstempel ueberlebt den Merge', async () => {
  const p = await open('specs.html', { gallery: true });
  const ok = await p.page.evaluate(() => _mergeMeta(
    { version: 2, meta: {}, videos: {}, hero: {}, savedAt: 100 },
    { version: 2, meta: {}, videos: {}, hero: {}, savedAt: 900 }
  ).savedAt === 900);
  assert(ok, 'savedAt geht beim Merge verloren');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Galerie zeigt Name und Aufnahmedatum');

await test('Jede Karte hat Name und Datum', async () => {
  const p = await open('specs.html', { gallery: true });
  const r = await p.page.evaluate(() => {
    openGallery('shortblock');
    const cards = Array.from(document.querySelectorAll('#galleryGrid .gallery-card'));
    return cards.map((c) => ({
      isDefault: c.dataset.isDefault === '1',
      name: (c.querySelector('.gc-name') || {}).textContent || '',
      date: (c.querySelector('.gc-date') || {}).textContent || ''
    }));
  });
  const user = r.filter((c) => !c.isDefault);
  assert(user.length > 0, 'Keine Nutzerfotos in der Galerie');
  assert(user.every((c) => c.name.length > 0), 'Karte ohne Namen: ' + JSON.stringify(user));
  assert(user.every((c) => c.date.length > 0), 'Karte ohne Datum: ' + JSON.stringify(user));
  await p.close();
});

await test('Die Datumszeile wird nicht abgeschnitten', async () => {
  // Die Karten wurden auf die Zeilenhoehe des Grids gestaucht; mit
  // overflow:hidden war die zweite Zeile unsichtbar, obwohl sie im DOM stand.
  const p = await open('specs.html', { gallery: true });
  const clipped = await p.page.evaluate(async () => {
    openGallery('shortblock');
    await new Promise((r) => setTimeout(r, 400));
    return Array.from(document.querySelectorAll('#galleryGrid .gallery-card'))
      .filter((c) => c.scrollHeight > Math.ceil(c.getBoundingClientRect().height))
      .map((c) => (c.querySelector('.gc-name') || {}).textContent);
  });
  assertEqual(clipped, [], 'Abgeschnittene Karten');
  await p.close();
});

await test('Ohne Caption wird ein lesbarer Name aus der Datei gebildet', async () => {
  const p = await open('specs.html', { gallery: true });
  const names = await p.page.evaluate(() => [
    _displayName({ name: '1700000000003_3.jpg', key: 'g/1700000000003_3.jpg' }, 'de'),
    _displayName({ name: 'annotated_1700000000999.jpg', key: 'g/annotated_1700000000999.jpg' }, 'de'),
    _displayName({ name: 'x.jpg', key: 'g/x.jpg', caption: 'Lagerspiel Zyl. 3' }, 'de'),
    _displayName({ isDefault: true }, 'de')
  ]);
  assertEqual(names, ['Foto 4', 'Zeichnung', 'Lagerspiel Zyl. 3', 'Herstellerbild']);
  await p.close();
});

await test('Fehlt das EXIF-Datum, kommt es aus dem Dateinamen', async () => {
  const p = await open('specs.html', { gallery: true });
  const r = await p.page.evaluate(() => ({
    ausExif: _displayDate({ time: '01.01.2026, 10:00:00', name: '1700000000000_0.jpg' }),
    ausName: _displayDate({ time: '', name: '1700000000000_0.jpg', key: 'g/1700000000000_0.jpg' }),
    herstellerbild: _displayDate({ isDefault: true })
  }));
  assertEqual(r.ausExif, '01.01.2026, 10:00:00', 'EXIF hat Vorrang');
  assert(r.ausName.length > 0, 'Kein Datum aus dem Dateinamen');
  assertEqual(r.herstellerbild, '', 'Herstellerbild braucht kein Datum');
  await p.close();
});

await test('Namen werden escaped (kein HTML aus einer Caption)', async () => {
  const p = await open('specs.html', { gallery: true });
  const ok = await p.page.evaluate(() => {
    const group = 'shortblock';
    const entry = photoData[group][0];
    _galleryMeta.meta[entry.key] = { caption: '<img src=x onerror=alert(1)>', m: Date.now() };
    rebuildPhotoData();
    openGallery(group);
    const card = document.querySelector('#galleryGrid .gallery-card:not([data-is-default="1"]) .gc-name');
    return card && card.querySelector('img') === null && card.textContent.includes('<img');
  });
  assert(ok, 'Caption wurde als HTML interpretiert');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Menue');

await test('"Galerie neu laden" ist nicht mehr doppelt im Menue', async () => {
  // Cloud Sync laedt die Galerie ohnehin mit. Der Knopf in der Galerie-Kopfzeile
  // bleibt, dort ist er im Kontext sinnvoll.
  const p = await open('specs.html', { gallery: true });
  const r = await p.page.evaluate(() => ({
    imMenue: document.querySelectorAll('#toolMenu [onclick*="reloadGalleryFromRepo"]').length,
    inGalerie: document.querySelectorAll('.gallery-header [onclick*="reloadGalleryFromRepo"]').length
  }));
  assertEqual(r.imMenue, 0, 'Menueeintrag ist noch da');
  assertEqual(r.inGalerie, 1, 'Knopf in der Galerie-Kopfzeile fehlt');
  await p.close();
});

await test('Cloud Sync laedt die Galerie mit', async () => {
  const p = await open('specs.html', { gallery: true });
  const called = await p.page.evaluate(async () => {
    localStorage.setItem('gh_token', 'test-token');
    let hits = 0;
    const orig = window.refreshGallery;
    window.refreshGallery = function () { hits++; return orig.apply(this, arguments); };
    await syncFromCloud();
    window.refreshGallery = orig;
    return hits;
  });
  assert(called > 0, 'syncFromCloud hat die Galerie nicht aktualisiert');
  await p.close();
});

await test('Alle drei Seiten laden ohne Page-Errors', async () => {
  for (const file of PAGES) {
    const p = await open(file);
    assertEqual(p.errors, [], file);
    await p.close();
  }
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
