// Tests fuer Bildnamen, Doubletten und gruppenuebergreifende Verweise.
//
// Gemeldet: In der Galerie stehen hochgezaehlte Namen ("Foto 4") statt der
// echten Dateinamen. Daraus folgt zweierlei: man erkennt die Bilder nicht
// wieder, und ohne Identitaet der Bilddaten lassen sich Doubletten nicht
// finden - dasselbe Foto landet mehrfach im Repository.
//
// Loesung: Originalname und SHA-256 der Bilddaten wandern in die Metadaten.
// Liegt dieselbe Datei schon irgendwo, wird sie verknuepft statt ein zweites
// Mal abgelegt.
//
// Lokal: npm test

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, waitForGallery,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

async function open(file = 'specs.html') {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  await waitForGallery(page);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Bildnamen statt Nummerierung');

await test('Der Originalname wird angezeigt, wenn er bekannt ist', async () => {
  const p = await open();
  const namen = await p.page.evaluate(() => [
    _displayName({ orig: 'IMG_4711.HEIC', name: '1700000000000_0_IMG_4711.jpg' }, 'de'),
    _displayName({ name: '1700000000000_0_Lagerschale-3.jpg' }, 'de'),
    _displayName({ orig: 'x.jpg', caption: 'Eigene Beschreibung' }, 'de'),
    _displayName({ name: '1700000000000_0.jpg' }, 'de')
  ]);
  assertEqual(namen[0], 'IMG_4711', 'Originalname aus den Metadaten');
  assertEqual(namen[1], 'Lagerschale-3', 'Originalname aus dem Dateinamen');
  assertEqual(namen[2], 'Eigene Beschreibung', 'Eigene Beschreibung hat Vorrang');
  assertEqual(namen[3], 'Foto 1', 'Altbestand ohne Originalnamen');
  await p.close();
});

await test('Dateinamen fuers Repository bleiben unbedenklich', async () => {
  const p = await open();
  const r = await p.page.evaluate(() => [
    _safeFileName('IMG_4711.HEIC'),
    _safeFileName('Lagerschale 3 / oben.jpg'),
    _safeFileName('../../etc/passwd'),
    _safeFileName('Messung  Zyl.4 (60%).jpeg'),
    _safeFileName('')
  ]);
  assertEqual(r[0], 'IMG_4711');
  assert(!/[\s/]/.test(r[1]), 'Leerzeichen oder Schraegstrich: ' + r[1]);
  assert(r[2].indexOf('..') === -1 && r[2].indexOf('/') === -1, 'Pfadanteile: ' + r[2]);
  assert(!/[()%]/.test(r[3]), 'Sonderzeichen: ' + r[3]);
  assertEqual(r[4], 'foto', 'Rueckfall ohne Namen');
  await p.close();
});

await test('Der Name steht in Karte und Lightbox gleich', async () => {
  const p = await open();
  const r = await p.page.evaluate(async () => {
    const key = photoData.shortblock[0].key;
    _galleryMeta.meta[key] = { orig: 'Kurbelwelle_Axialspiel.jpg', time: '01.01.2026, 10:00:00', m: Date.now() };
    rebuildPhotoData();
    openGallery('shortblock');
    await new Promise((r) => setTimeout(r, 300));
    const karte = document.querySelector('#galleryGrid .gallery-card:not([data-is-default="1"]) .gc-name').textContent;
    const all = _getAllPhotos('shortblock');
    let idx = -1;
    for (let i = 0; i < all.length; i++) if (!all[i].isDefault && all[i].key === key) idx = i;
    openLightbox('shortblock', idx);
    await new Promise((r) => setTimeout(r, 200));
    return { karte, lightbox: document.querySelector('#photoLightbox .caption').textContent };
  });
  assertEqual(r.karte, 'Kurbelwelle_Axialspiel', 'Name auf der Karte');
  assert(r.lightbox.indexOf('Kurbelwelle_Axialspiel') === 0, 'Lightbox: ' + r.lightbox);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Doubletten und gruppenuebergreifende Verweise');

await test('Gleiche Bilddaten werden ueber alle Gruppen hinweg gefunden', async () => {
  const p = await open();
  const r = await p.page.evaluate(() => {
    _galleryMeta.meta['shortblock/a.jpg'] = { sha: 'abc123', m: Date.now() };
    _galleryMeta.meta['pistons/b.jpg'] = { sha: 'xyz999', m: Date.now() };
    return {
      treffer: _findBySha('abc123').map((t) => t.key),
      ohne: _findBySha('nicht-vorhanden').length,
      leer: _findBySha(null).length
    };
  });
  assertEqual(r.treffer, ['shortblock/a.jpg']);
  assertEqual(r.ohne, 0);
  assertEqual(r.leer, 0, 'Ohne Pruefsumme kein Treffer');
  await p.close();
});

await test('Ein Verweis zeigt auf die Datei der anderen Gruppe', async () => {
  // Dasselbe Foto in specs/shortblock und build/inspektion: die Datei liegt
  // einmal im Repository, die zweite Galerie verweist darauf.
  const p = await open();
  const r = await p.page.evaluate(() => {
    const ziel = photoData.shortblock[0].key;
    _galleryMeta.meta['p1_block_photos/ref-abc123.jpg'] = {
      ref: ziel, sha: 'abc123', orig: 'IMG_0815.jpg', caption: '', time: '', m: Date.now()
    };
    rebuildPhotoData();
    const eintrag = (photoData.p1_block_photos || []).find((e) => e.ref);
    return {
      vorhanden: !!eintrag,
      url: eintrag ? eintrag.data : null,
      erwartet: _urlFromKey(ziel),
      name: eintrag ? _displayName(eintrag, 'de') : null
    };
  });
  assert(r.vorhanden, 'Verweis erscheint nicht in der Galerie');
  assertEqual(r.url, r.erwartet, 'Verweis zeigt auf die Originaldatei');
  assertEqual(r.name, 'IMG_0815', 'Originalname am Verweis');
  await p.close();
});

await test('Die Zielgruppe zeigt das Bild weiterhin nur einmal', async () => {
  const p = await open();
  const r = await p.page.evaluate(() => {
    const vorher = photoData.shortblock.length;
    _galleryMeta.meta['p1_block_photos/ref-abc.jpg'] = {
      ref: photoData.shortblock[0].key, sha: 'abc', m: Date.now()
    };
    rebuildPhotoData();
    return { vorher, nachher: photoData.shortblock.length };
  });
  assertEqual(r.nachher, r.vorher, 'Ein Verweis hat die Zielgruppe veraendert');
  await p.close();
});

await test('Loeschen entfernt nur den Verweis, nicht die Datei', async () => {
  const p = await open();
  const r = await p.page.evaluate(async () => {
    const ziel = photoData.shortblock[0].key;
    const refKey = 'p1_block_photos/ref-xyz.jpg';
    _galleryMeta.meta[refKey] = { ref: ziel, sha: 'xyz', m: Date.now() };
    rebuildPhotoData();
    const vorher = _refCount(ziel);
    window.confirm = () => true;
    const idx = photoData.p1_block_photos.findIndex((e) => e.key === refKey);
    await deletePhoto('p1_block_photos', idx);
    rebuildPhotoData();
    return {
      vorher,
      nachher: _refCount(ziel),
      zielNochDa: photoData.shortblock.some((e) => e.key === ziel),
      verweisWeg: !(photoData.p1_block_photos || []).some((e) => e.key === refKey)
    };
  });
  assertEqual(r.vorher, 2, 'Original plus Verweis');
  assertEqual(r.nachher, 1, 'Nach dem Loeschen bleibt nur das Original');
  assert(r.zielNochDa, 'Die Originaldatei wurde mitgerissen');
  assert(r.verweisWeg, 'Der Verweis ist noch da');
  await p.close();
});

await test('Das Original bleibt, solange ein Verweis daran haengt', async () => {
  // Sonst reisst man der anderen Galerie das Bild weg.
  const p = await open();
  const r = await p.page.evaluate(async () => {
    const ziel = photoData.shortblock[0].key;
    _galleryMeta.meta['p1_block_photos/ref-q.jpg'] = { ref: ziel, sha: 'q', m: Date.now() };
    let geloescht = false;
    const orig = window._deleteFromGitHub;
    window._deleteFromGitHub = async () => { geloescht = true; return true; };
    localStorage.setItem('gh_token', 'test-token');
    window.confirm = () => true;
    rebuildPhotoData();
    const idx = photoData.shortblock.findIndex((e) => e.key === ziel);
    await deletePhoto('shortblock', idx);
    window._deleteFromGitHub = orig;
    return { geloescht, refBleibt: !!_galleryMeta.meta['p1_block_photos/ref-q.jpg'] };
  });
  assert(!r.geloescht, 'Die Datei wurde geloescht, obwohl ein Verweis daran haengt');
  assert(r.refBleibt, 'Der Verweis wurde mitentfernt');
  await p.close();
});

await test('Verweise werden beim Aufraeumen nicht faelschlich entfernt', async () => {
  const p = await open();
  const r = await p.page.evaluate(() => {
    const alt = Date.now() - 3600e3;
    _galleryMeta.meta['p1_block_photos/ref-gut.jpg'] =
      { ref: photoData.shortblock[0].key, sha: 'g', m: alt };
    _galleryMeta.meta['p1_block_photos/ref-tot.jpg'] =
      { ref: 'shortblock/gibt-es-nicht.jpg', sha: 't', m: alt };
    _pruneOrphanMeta();
    return {
      gut: !!_galleryMeta.meta['p1_block_photos/ref-gut.jpg'],
      tot: !!_galleryMeta.meta['p1_block_photos/ref-tot.jpg']
    };
  });
  assert(r.gut, 'Gueltiger Verweis wurde weggeraeumt');
  assert(!r.tot, 'Verweis auf eine geloeschte Datei blieb liegen');
  await p.close();
});

await test('Die Pruefsumme ist stabil und unterscheidet Inhalte', async () => {
  const p = await open();
  const r = await p.page.evaluate(async () => {
    const a = 'data:image/jpeg;base64,' + btoa('inhalt-A');
    const b = 'data:image/jpeg;base64,' + btoa('inhalt-B');
    return {
      gleich: (await _sha256OfDataUrl(a)) === (await _sha256OfDataUrl(a)),
      verschieden: (await _sha256OfDataUrl(a)) !== (await _sha256OfDataUrl(b)),
      laenge: (await _sha256OfDataUrl(a)).length
    };
  });
  assert(r.gleich, 'Gleiche Daten ergeben verschiedene Pruefsummen');
  assert(r.verschieden, 'Verschiedene Daten ergeben dieselbe Pruefsumme');
  assertEqual(r.laenge, 64, 'SHA-256 als Hex');
  await p.close();
});

await test('specs.html laedt ohne Page-Errors', async () => {
  const p = await open();
  assertEqual(p.errors, []);
  await p.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
