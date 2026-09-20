// Regressionstests fuer die Komponenten-Galerie in specs.html (Galerie v3).
//
// Hintergrund: Fotos, die auf einem Geraet hinzugefuegt wurden, erschienen auf
// anderen Geraeten nicht. Ursache war nicht die Uebertragung, sondern dass der
// Foto-Index bei jedem autoSave mit dem lokalen Stand ueberschrieben wurde und
// der Merge die kuerzere Seite verworfen hat.
//
// Seitdem gilt: das Repo sagt, welche Bilder existieren; der Gist traegt nur
// noch Metadaten, adressiert per Dateiname. Diese Tests halten beides fest.
//
// Lokal:  npm test
// In CI:  .github/workflows/tests.yml

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, waitForGallery, totalPhotos, fixtureCounts,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const COUNTS = fixtureCounts();                       // { shortblock: 5, pistons: 2, heads: 1 }
const TOTAL = Object.values(COUNTS).reduce((a, b) => a + b, 0);
// Short Block hat zwei Herstellerbilder im HTML (comp-hero + data-extra-images)
const SHORTBLOCK_DEFAULTS = 2;

const { server, base } = await startServer();
const browser = await chromium.launch();

/** Frischer Browser-Kontext = fremdes Geraet (eigener localStorage). */
async function openDevice(opts = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const stub = await stubGitHub(page, opts);
  if (opts.beforeLoad) {
    await page.goto(base + '/specs.html');
    await page.evaluate(opts.beforeLoad);
    await page.reload();
  } else {
    await page.goto(base + '/specs.html');
  }
  await waitForGallery(page, { expectTree: opts.tree !== null });
  return { ctx, page, errors, stub, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Das gemeldete Problem: Fotos erscheinen nur auf einem Geraet');

await test('Galerie baut sich ohne Token aus dem Repo-Listing auf', async () => {
  const d = await openDevice();
  assert(!(await d.page.evaluate(() => !!localStorage.getItem('gh_token'))), 'Test braucht ein Geraet ohne Token');
  assertEqual(await totalPhotos(d.page), TOTAL);
  await d.close();
});

await test('Short Block zeigt Repo-Fotos plus Herstellerbilder', async () => {
  const d = await openDevice();
  const cards = await d.page.evaluate(() => {
    openGallery('shortblock');
    return document.querySelectorAll('#galleryGrid .gallery-card').length;
  });
  assertEqual(cards, COUNTS.shortblock + SHORTBLOCK_DEFAULTS);
  await d.close();
});

await test('Zweites Geraet ohne eigenen Stand sieht dieselben Fotos', async () => {
  const a = await openDevice();
  const b = await openDevice();                       // eigener Kontext = fremdes Geraet
  assertEqual(await totalPhotos(b.page), await totalPhotos(a.page));
  await a.close(); await b.close();
});

await test('Geraet mit unvollstaendigem Alt-Index bekommt trotzdem alle Fotos', async () => {
  // Frueher blieb es bei den zwei lokal bekannten Eintraegen haengen.
  const d = await openDevice({
    beforeLoad: () => localStorage.setItem('engineBuildPhotos', JSON.stringify({
      shortblock: [
        { data: 'https://raw.githubusercontent.com/pahlborn/gt40-engine/main/img/user/shortblock/1700000000000_0.jpg', caption: '', time: '' },
        { data: 'https://raw.githubusercontent.com/pahlborn/gt40-engine/main/img/user/shortblock/1700000000001_1.jpg', caption: '', time: '' }
      ]
    }))
  });
  assertEqual(await d.page.evaluate(() => photoData.shortblock.length), COUNTS.shortblock);
  await d.close();
});

// ---------------------------------------------------------------------------
suite('Der alte Zerstoerungsmechanismus darf nicht zurueckkommen');

await test('saveToGist() schreibt nur die Messwerte-Datei', async () => {
  const d = await openDevice();
  await d.page.evaluate(() => localStorage.setItem('gh_token', 'test-token'));
  await d.page.evaluate(() => saveToGist());
  await d.page.waitForTimeout(200);
  assertEqual(d.stub.gistWrites.map(Object.keys), [['engine-build-log-data.json']]);
  await d.close();
});

await test('saveData() fasst die Foto-Metadaten nicht an', async () => {
  // saveData() haengt an autoSave() und lief frueher bei jedem Tastendruck.
  const d = await openDevice();
  await d.page.evaluate(() => localStorage.setItem('gh_token', 'test-token'));
  await d.page.evaluate(() => saveData());
  await d.page.waitForTimeout(300);
  const touched = d.stub.gistWrites.some((f) => 'engine-build-photos.json' in f);
  assert(!touched, 'saveData() hat die Foto-Datei geschrieben');
  await d.close();
});

await test('Geraet mit leerer Galerie loescht den Cloud-Stand nicht', async () => {
  let written = null;
  const cloud = {
    version: 2,
    meta: { 'shortblock/1700000000000_0.jpg': { caption: 'aus der Cloud', m: 5000 } },
    videos: {}, hero: {}
  };
  const d = await openDevice({
    gistFiles: { 'engine-build-photos.json': JSON.stringify(cloud) },
    onGistWrite: (f) => {
      if (f['engine-build-photos.json']) written = JSON.parse(f['engine-build-photos.json'].content);
    }
  });
  await d.page.evaluate(async () => {
    localStorage.setItem('gh_token', 'test-token');
    _galleryMeta = { version: 2, meta: {}, videos: {}, hero: {} };   // leeres Geraet
    await pushGalleryMeta();
  });
  assert(written, 'Es wurde nichts geschrieben');
  assert(written.meta['shortblock/1700000000000_0.jpg'], 'Cloud-Eintrag wurde geloescht');
  await d.close();
});

// ---------------------------------------------------------------------------
suite('Merge verliert nichts');

await test('Merge vereinigt beide Seiten statt die kuerzere zu verwerfen', async () => {
  const d = await openDevice();
  const keys = await d.page.evaluate(() => Object.keys(_mergeMeta(
    { version: 2, meta: { 'g/a.jpg': { m: 100 }, 'g/b.jpg': { m: 100 } }, videos: {}, hero: {} },
    { version: 2, meta: { 'g/c.jpg': { m: 50 } }, videos: {}, hero: {} }
  ).meta).sort());
  assertEqual(keys, ['g/a.jpg', 'g/b.jpg', 'g/c.jpg']);
  await d.close();
});

await test('Bei Konflikt gewinnt der juengere Eintrag, egal in welcher Reihenfolge', async () => {
  const d = await openDevice();
  const caps = await d.page.evaluate(() => {
    const A = { version: 2, meta: { 'g/a.jpg': { caption: 'alt', m: 100 } }, videos: {}, hero: {} };
    const B = { version: 2, meta: { 'g/a.jpg': { caption: 'neu', m: 999 } }, videos: {}, hero: {} };
    return [_mergeMeta(A, B).meta['g/a.jpg'].caption, _mergeMeta(B, A).meta['g/a.jpg'].caption];
  });
  assertEqual(caps, ['neu', 'neu']);
  await d.close();
});

await test('Geloeschtes YouTube-Video bleibt nach dem Merge geloescht', async () => {
  // Videos haben keine Repo-Datei, brauchen also einen expliziten Grabstein.
  const d = await openDevice();
  const stillDeleted = await d.page.evaluate(() => _mergeMeta(
    { version: 2, meta: {}, videos: { g: { vid11111111: { caption: 'x', m: 100 } } }, hero: {} },
    { version: 2, meta: {}, videos: { g: { vid11111111: { del: true, m: 200 } } }, hero: {} }
  ).videos.g.vid11111111.del === true);
  assert(stillDeleted, 'Video ist wieder aufgetaucht');
  await d.close();
});

// ---------------------------------------------------------------------------
suite('Migration aus dem alten Schema');

await test('v1: Caption, YouTube und Hero werden uebernommen', async () => {
  const d = await openDevice();
  const m = await d.page.evaluate(() => {
    const v1 = {
      photos: {
        shortblock: [
          { data: 'https://raw.githubusercontent.com/pahlborn/gt40-engine/main/img/user/shortblock/111_0.jpg', caption: 'Lagerspiel', time: '01.01.2026' },
          { data: 'abc12345678', type: 'youtube', caption: 'Einbau-Video' }
        ]
      },
      heroSelection: { shortblock: { type: 'user', idx: 0 } }
    };
    const r = _normalizeMeta(v1);
    return {
      caption: r.meta['shortblock/111_0.jpg'] && r.meta['shortblock/111_0.jpg'].caption,
      video: r.videos.shortblock && r.videos.shortblock.abc12345678.caption,
      heroKey: r.hero.shortblock && r.hero.shortblock.key
    };
  });
  assertEqual(m.caption, 'Lagerspiel', 'Caption');
  assertEqual(m.video, 'Einbau-Video', 'YouTube');
  assertEqual(m.heroKey, 'shortblock/111_0.jpg', 'Hero wird key-basiert');
  await d.close();
});

await test('Hero zeigt nach einem Neuaufbau noch auf dasselbe Bild', async () => {
  // Frueher war Hero ein Array-Index und rutschte auf ein anderes Foto,
  // sobald ein frueheres Bild verschwand.
  const d = await openDevice();
  const r = await d.page.evaluate(() => {
    const targetKey = photoData.shortblock[3].key;
    setHero('shortblock', 3);
    const before = _getHeroInfo('shortblock').idx;
    _repoFiles.shortblock.shift();                 // ein frueheres Foto faellt weg
    rebuildPhotoData();
    const after = _getHeroInfo('shortblock');
    return {
      before, after: after.idx,
      sameImage: photoData.shortblock[after.idx] && photoData.shortblock[after.idx].key === targetKey
    };
  });
  assert(r.sameImage, 'Hero zeigt auf ein anderes Bild');
  assert(r.after !== r.before, 'Index hat sich gar nicht verschoben - Test greift nicht');
  await d.close();
});

// ---------------------------------------------------------------------------
suite('Aufraeumen verwaister Metadaten');

await test('Frischer Upload von einem anderen Geraet ueberlebt die Schonfrist', async () => {
  const d = await openDevice();
  const kept = await d.page.evaluate(() => {
    _galleryMeta.meta['shortblock/gerade_vom_ipad.jpg'] = { caption: 'frisch', m: Date.now() };
    _pruneOrphanMeta();
    return !!_galleryMeta.meta['shortblock/gerade_vom_ipad.jpg'];
  });
  assert(kept, 'Frischer Fremd-Upload wurde weggeraeumt');
  await d.close();
});

await test('Echtes Waisenkind wird entfernt', async () => {
  const d = await openDevice();
  const gone = await d.page.evaluate(() => {
    _galleryMeta.meta['shortblock/laengst_geloescht.jpg'] = { caption: 'weg', m: Date.now() - 3600e3 };
    _pruneOrphanMeta();
    return !_galleryMeta.meta['shortblock/laengst_geloescht.jpg'];
  });
  assert(gone, 'Waisenkind blieb liegen');
  await d.close();
});

await test('Gruppe ohne Repo-Listing bleibt unangetastet', async () => {
  const d = await openDevice();
  const kept = await d.page.evaluate(() => {
    _galleryMeta.meta['carbs/unbekannt.jpg'] = { caption: '?', m: 1 };
    _pruneOrphanMeta();
    return !!_galleryMeta.meta['carbs/unbekannt.jpg'];
  });
  assert(kept, 'Eintrag einer Gruppe ohne Listing wurde geloescht');
  await d.close();
});

await test('Veraltetes Repo-Listing raeumt nichts weg', async () => {
  const d = await openDevice();
  const kept = await d.page.evaluate(() => {
    _galleryMeta.meta['shortblock/alt.jpg'] = { caption: 'x', m: 1 };
    _treeFetchedAt = Date.now() - 10 * 60 * 1000;
    _pruneOrphanMeta();
    return !!_galleryMeta.meta['shortblock/alt.jpg'];
  });
  assert(kept, 'Mit veraltetem Listing wurde aufgeraeumt');
  await d.close();
});

// ---------------------------------------------------------------------------
suite('Robustheit');

await test('Offline: Galerie kommt aus dem lokalen Cache', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);                               // erster Lauf: online
  await page.goto(base + '/specs.html');
  await waitForGallery(page);
  assertEqual(await totalPhotos(page), TOTAL, 'Vorbedingung');

  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await stubGitHub(page, { tree: null });               // jetzt offline
  await page.reload();
  await waitForGallery(page, { expectTree: false });
  assertEqual(await totalPhotos(page), TOTAL, 'Offline');
  await ctx.close();
});

await test('applyData() ueberlebt eine DOM-Exception, der Sync laeuft weiter', async () => {
  // Frueher hat eine Exception hier den gesamten Gist-Sync lautlos abgebrochen,
  // wodurch die Fotos nie geladen wurden.
  const d = await openDevice();
  const survived = await d.page.evaluate(() => {
    const orig = window.calcQuench;
    window.calcQuench = () => { throw new Error('simulierter DOM-Fehler'); };
    let threw = false;
    try { applyData({ crank_endplay: '0.005' }); } catch (e) { threw = true; }
    window.calcQuench = orig;
    return !threw;
  });
  assert(survived, 'applyData() hat die Exception durchgereicht');
  await d.close();
});

await test('specs.html laedt ohne Page-Errors', async () => {
  const d = await openDevice();
  assertEqual(d.errors, [], 'Page-Errors');
  await d.close();
});

await test('index.html hat kein eigenes Foto-System mehr', async () => {
  // Dort lag eine base64-Galerie ohne Container, ohne Lightbox und ohne
  // Aufrufer - toter Code. Die Galerien stehen in specs.html und build-log.html.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/index.html');
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    savePhotoData: typeof savePhotoData,
    renderPhotos: typeof renderPhotos,
    photoData: typeof photoData,
    container: document.querySelectorAll('[data-photo-group]').length,
    galerieKeyUnberuehrt: !localStorage.getItem('engineGalleryMeta')
  }));
  assertEqual(r.savePhotoData, 'undefined', 'savePhotoData() existiert noch');
  assertEqual(r.renderPhotos, 'undefined', 'renderPhotos() existiert noch');
  assertEqual(r.photoData, 'undefined', 'photoData existiert noch');
  assertEqual(r.container, 0, 'Alte Container');
  assert(r.galerieKeyUnberuehrt, 'index.html hat den Galerie-Key angefasst');
  assertEqual(errors, [], 'Page-Errors auf index.html');
  await ctx.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
