// Tests fuer die Galerie in build-log.html.
//
// Dort lag frueher ein eigenes, aelteres Foto-System: Base64 in localStorage
// ('buildPhotos_<gruppe>'), kein Repo-Upload, kein Sync. Damit waren die Fotos
// nur auf dem aufnehmenden Geraet sichtbar - dieselbe Bug-Klasse wie in der
// Komponenten-Galerie, nur an anderer Stelle.
//
// Jetzt benutzt build-log.html gallery.js, genau wie specs.html. Angezeigt
// werden hoechstens vier Vorschaubilder, damit das Seitenformat erhalten
// bleibt; dahinter liegt die vollstaendige Galerie.
//
// Lokal: npm test

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, fixtureCounts,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const COUNTS = fixtureCounts();
const MANY = 'p1_block_photos';     // 6 Fotos in der Fixture -> Begrenzung greift
const FEW = 'p1_pdeck_photos';      // 2 Fotos -> kein "+N"
const MAX_THUMBS = 4;

const { server, base } = await startServer();
const browser = await chromium.launch();

async function openBuildLog(opts = {}) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page, opts);
  if (opts.beforeLoad) {
    await page.goto(base + '/build-log.html');
    await page.evaluate(opts.beforeLoad);
    await page.reload();
  } else {
    await page.goto(base + '/build-log.html');
  }
  await page.waitForFunction(
    () => typeof _treeFetchedAt !== 'undefined' && _treeFetchedAt > 0,
    null, { timeout: 30000 });
  await page.waitForTimeout(300);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('build-log.html benutzt dieselbe Galerie wie specs.html');

await test('Das alte Base64-System ist weg', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => ({
    renderPhotos: typeof renderPhotos,
    alteContainer: document.querySelectorAll('.photo-gallery[data-photo-group]').length,
    alteButtons: document.querySelectorAll('.photo-add-btn').length
  }));
  assertEqual(r.renderPhotos, 'undefined', 'renderPhotos() existiert noch');
  assertEqual(r.alteContainer, 0, 'Alte Galerie-Container');
  assertEqual(r.alteButtons, 0, 'Alte Add-Photo-Buttons');
  await p.close();
});

await test('Alle Foto-Gruppen haengen an gallery.js', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => ({
    gruppen: document.querySelectorAll('[data-comp-gallery]').length,
    engine: typeof openGallery === 'function' && typeof addPhoto === 'function'
      && typeof rebuildPhotoData === 'function'
  }));
  assert(r.gruppen >= 14, 'Nur ' + r.gruppen + ' Gruppen gefunden');
  assert(r.engine, 'gallery.js ist nicht geladen');
  await p.close();
});

await test('Overlay und Lightbox werden automatisch angelegt', async () => {
  // build-log.html hat das Markup nicht im HTML - gallery.js ergaenzt es.
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => ({
    overlay: !!document.getElementById('galleryOverlay'),
    grid: !!document.getElementById('galleryGrid'),
    lightbox: !!document.getElementById('photoLightbox'),
    toolbar: document.querySelectorAll('#lbToolbar .lb-tool').length
  }));
  assert(r.overlay && r.grid, 'Galerie-Overlay fehlt');
  assert(r.lightbox, 'Lightbox fehlt');
  assert(r.toolbar >= 6, 'Lightbox-Werkzeuge fehlen (' + r.toolbar + ')');
  await p.close();
});

await test('Fotos aus dem Repo erscheinen auch hier', async () => {
  const p = await openBuildLog();
  const n = await p.page.evaluate((g) => (photoData[g] || []).length, MANY);
  assertEqual(n, COUNTS[MANY], 'Fotos in ' + MANY);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Hoechstens vier Vorschaubilder, damit das Seitenformat bleibt');

await test('Bei 6 Fotos erscheinen 4 Thumbnails mit "+2"', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate((g) => {
    const strip = document.querySelector('[data-comp-gallery="' + g + '"]');
    const thumbs = strip.querySelectorAll('.thumb-row .thumb');
    const more = strip.querySelector('.thumb-more');
    return {
      thumbs: thumbs.length,
      more: more ? more.textContent : null,
      zaehler: (document.getElementById(g + '-count') || {}).textContent
    };
  }, MANY);
  assertEqual(r.thumbs, MAX_THUMBS, 'Anzahl Vorschaubilder');
  assertEqual(r.more, '+' + (COUNTS[MANY] - MAX_THUMBS), 'Rest-Markierung');
  assertEqual(r.zaehler, String(COUNTS[MANY]), 'Zaehler im Button');
  await p.close();
});

await test('Bei 2 Fotos erscheint kein "+N"', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate((g) => {
    const strip = document.querySelector('[data-comp-gallery="' + g + '"]');
    return {
      thumbs: strip.querySelectorAll('.thumb-row .thumb').length,
      more: !!strip.querySelector('.thumb-more')
    };
  }, FEW);
  assertEqual(r.thumbs, COUNTS[FEW], 'Anzahl Vorschaubilder');
  assert(!r.more, '"+N" wird faelschlich angezeigt');
  await p.close();
});

await test('Der Streifen bleibt einzeilig', async () => {
  // Der eigentliche Grund fuer die Begrenzung: das Seitenformat soll halten.
  const p = await openBuildLog();
  const zeilen = await p.page.evaluate((g) => {
    const strip = document.querySelector('[data-comp-gallery="' + g + '"]');
    const tops = new Set(Array.from(strip.querySelectorAll('.thumb'))
      .map((t) => Math.round(t.getBoundingClientRect().top)));
    return tops.size;
  }, MANY);
  assertEqual(zeilen, 1, 'Vorschaubilder brechen um');
  await p.close();
});

await test('Ein Klick auf ein Thumbnail oeffnet die volle Galerie', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(async (g) => {
    document.querySelector('[data-comp-gallery="' + g + '"] .thumb').click();
    await new Promise((r) => setTimeout(r, 300));
    const ov = document.getElementById('galleryOverlay');
    return {
      offen: ov.classList.contains('show'),
      gruppe: ov.dataset.group,
      karten: document.querySelectorAll('#galleryGrid .gallery-card').length,
      titel: document.getElementById('galleryTitle').textContent
    };
  }, MANY);
  assert(r.offen, 'Galerie hat sich nicht geoeffnet');
  assertEqual(r.gruppe, MANY, 'Falsche Gruppe');
  assertEqual(r.karten, COUNTS[MANY], 'Alle Fotos - nicht nur die vier Vorschaubilder');
  assert(r.titel && r.titel !== MANY, 'Galerie zeigt nur den Gruppennamen: ' + r.titel);
  await p.close();
});

await test('Karten zeigen auch hier Name und Aufnahmedatum', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(async (g) => {
    openGallery(g);
    await new Promise((r) => setTimeout(r, 300));
    return Array.from(document.querySelectorAll('#galleryGrid .gallery-card')).map((c) => ({
      name: (c.querySelector('.gc-name') || {}).textContent || '',
      date: (c.querySelector('.gc-date') || {}).textContent || ''
    }));
  }, MANY);
  assert(r.length > 0, 'Keine Karten');
  assert(r.every((c) => c.name && c.date), 'Name oder Datum fehlt: ' + JSON.stringify(r));
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Altbestand geht nicht verloren');

await test('Alte Fotos werden erkannt und gemeldet', async () => {
  // Wer schon Fotos im alten Format hat, darf sie nicht stillschweigend
  // verlieren, wenn die Seite auf das neue System umstellt.
  const p = await openBuildLog({
    beforeLoad: () => {
      localStorage.setItem('buildPhotos_p1_mainbrg_photos', JSON.stringify([
        { src: 'data:image/jpeg;base64,AAAA', caption: 'Lagerspiel', time: '2026-01-01T10:00:00Z' },
        { src: 'data:image/jpeg;base64,BBBB', caption: '', time: '2026-01-01T10:05:00Z' }
      ]));
    }
  });
  const r = await p.page.evaluate(() => {
    const bar = document.getElementById('legacyPhotoNotice');
    return {
      sichtbar: bar && bar.style.display !== 'none',
      anzahl: bar ? bar.querySelector('.lpn-count').textContent : null,
      funktion: typeof migrateLegacyPhotos
    };
  });
  assert(r.sichtbar, 'Hinweis auf Altbestand fehlt');
  assertEqual(r.anzahl, '2', 'Anzahl im Hinweis');
  assertEqual(r.funktion, 'function', 'migrateLegacyPhotos() fehlt');
  await p.close();
});

await test('Ohne Altbestand bleibt der Hinweis verborgen', async () => {
  const p = await openBuildLog();
  const sichtbar = await p.page.evaluate(() => {
    const bar = document.getElementById('legacyPhotoNotice');
    return bar && bar.style.display !== 'none';
  });
  assert(!sichtbar, 'Hinweis wird ohne Altbestand angezeigt');
  await p.close();
});

await test('Die Uebertragung laedt hoch und raeumt erst danach lokal auf', async () => {
  const uploads = [];
  const p = await openBuildLog({
    beforeLoad: () => {
      localStorage.setItem('gh_token', 'test-token');
      localStorage.setItem('buildPhotos_p1_mainbrg_photos', JSON.stringify([
        { src: 'data:image/jpeg;base64,AAAA', caption: 'Lagerspiel', time: '2026-01-01T10:00:00Z' }
      ]));
    }
  });
  await p.page.route('**api.github.com/repos/**/contents/**', (route) => {
    uploads.push(route.request().url());
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{"content":{}}' });
  });
  await p.page.evaluate(() => { window.confirm = () => true; });
  await p.page.evaluate(() => migrateLegacyPhotos());
  await p.page.waitForTimeout(600);
  const r = await p.page.evaluate(() => ({
    rest: localStorage.getItem('buildPhotos_p1_mainbrg_photos'),
    meta: Object.keys(_galleryMeta.meta).filter((k) => k.indexOf('p1_mainbrg_photos/') === 0).length
  }));
  assertEqual(uploads.length, 1, 'Uploads ins Repo');
  assertEqual(r.rest, null, 'Altbestand wurde lokal nicht entfernt');
  assertEqual(r.meta, 1, 'Metadaten wurden nicht uebernommen');
  await p.close();
});

await test('Schlaegt der Upload fehl, bleibt der Altbestand liegen', async () => {
  // Lieber ein stehender Hinweis als stillschweigend geloeschte Fotos.
  const p = await openBuildLog({
    beforeLoad: () => {
      localStorage.setItem('gh_token', 'test-token');
      localStorage.setItem('buildPhotos_p1_mainbrg_photos', JSON.stringify([
        { src: 'data:image/jpeg;base64,AAAA', caption: 'x', time: '2026-01-01T10:00:00Z' }
      ]));
    }
  });
  await p.page.route('**api.github.com/repos/**/contents/**', (route) =>
    route.fulfill({ status: 403, contentType: 'application/json', body: '{"message":"denied"}' }));
  await p.page.evaluate(() => { window.confirm = () => true; });
  await p.page.evaluate(() => migrateLegacyPhotos());
  await p.page.waitForTimeout(800);
  const rest = await p.page.evaluate(() => localStorage.getItem('buildPhotos_p1_mainbrg_photos'));
  assert(rest, 'Altbestand wurde trotz Fehlschlag geloescht');
  assertEqual(JSON.parse(rest).length, 1, 'Anzahl verbliebener Fotos');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Robustheit');

await test('build-log.html laedt ohne Page-Errors', async () => {
  const p = await openBuildLog();
  assertEqual(p.errors, []);
  await p.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
