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
const APP_VERSION_ERWARTET = (fs.readFileSync(path.join(REPO_ROOT, 'version.js'), 'utf8')
  .match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/) || [])[1];

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

await test('version.js nennt einen Freigabezeitpunkt, der zum Journal passt', async () => {
  // Es gibt keinen Build-Schritt, der den Zeitstempel stempeln koennte. Ohne
  // diese Pruefung bleibt er beim naechsten Hochzaehlen einfach stehen und
  // behauptet dann ein falsches Freigabedatum.
  const vjs = fs.readFileSync(path.join(REPO_ROOT, 'version.js'), 'utf8');
  const cjs = fs.readFileSync(path.join(REPO_ROOT, 'changelog.js'), 'utf8');
  const built = (vjs.match(/APP_BUILT\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  assert(built, 'APP_BUILT nicht gefunden');
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(built),
    'APP_BUILT ist kein ISO-8601 mit Zonenangabe: ' + built);

  // Der oberste Eintrag im Journal ist der aktuelle Release.
  const ersterBlock = cjs.slice(cjs.indexOf('var RELEASES'), cjs.indexOf('var RELEASES') + 600);
  const datum = (ersterBlock.match(/date:\s*'([^']+)'/) || [])[1];
  const zeit = (ersterBlock.match(/time:\s*'([^']+)'/) || [])[1];
  assertEqual(built.slice(0, 10), datum,
    'APP_BUILT (' + built + ') und das Datum des obersten Journal-Eintrags (' + datum + ')');
  assert(zeit, 'Der oberste Journal-Eintrag hat keine Uhrzeit');
  assertEqual(built.slice(11, 16), zeit, 'Uhrzeit in version.js und changelog.js');
});

for (const file of PAGES) {
  await test(file + ': Freigabezeitpunkt steht neben der Version', async () => {
    const p = await open(file);
    const r = await p.page.evaluate(() => {
      const kopf = document.querySelector('.header-title .ht-built');
      const menue = document.querySelector('.menu-version .app-built');
      return {
        kopf: kopf ? kopf.textContent.trim() : null,
        menue: menue ? menue.textContent.trim() : null,
        tip: kopf ? kopf.title : null,
        formatiert: typeof formatBuilt === 'function' ? formatBuilt('2026-01-05T07:09:00+01:00') : null,
        ohneZeit: typeof formatBuilt === 'function' ? formatBuilt('2026-01-05') : null
      };
    });
    const muster = /^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/;
    assert(muster.test(r.kopf), 'Kopfzeile zeigt: ' + r.kopf);
    assertEqual(r.menue, r.kopf, 'Menue und Kopfzeile zeigen Verschiedenes');
    assert(/^Freigegeben \d{4}-/.test(r.tip), 'Tooltip ohne vollen Zeitstempel: ' + r.tip);
    // Bewusst ohne new Date(): sonst verschiebt die Zeitzone des Betrachters
    // den Zeitpunkt, und derselbe Release sieht auf zwei Geraeten anders aus.
    assertEqual(r.formatiert, '05.01.2026, 07:09', 'Formatierung');
    assertEqual(r.ohneZeit, '05.01.2026', 'Datum ohne Uhrzeit');
    assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
    await p.close();
  });
}

for (const file of PAGES) {
  await test(file + ': Klick auf die Version oeffnet die Dokumentation', async () => {
    // Im Build Log steckt die Anzeige in einem <a href="./">. Ohne
    // preventDefault navigiert der Klick zur Startseite und das Overlay
    // erscheint nie - genau so war es bis v53.
    const p = await open(file);
    const vorher = p.page.url();
    await p.page.click('.ht-meta');
    await p.page.waitForTimeout(400);
    const r = await p.page.evaluate(() => {
      const o = document.getElementById('changelogOverlay');
      return { offen: !!o && o.classList.contains('show'), url: location.pathname };
    });
    assert(r.offen, 'Dokumentation hat sich nicht geoeffnet');
    assert(vorher.endsWith(r.url), 'Klick hat navigiert: ' + vorher + ' -> ' + r.url);
    await p.close();
  });
}

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
suite('Release-Dokumentation');

for (const file of PAGES) {
  await test(file + ': Versionsnummer oeffnet die Release-Dokumentation', async () => {
    const p = await open(file);
    const r = await p.page.evaluate(async () => {
      document.querySelector('.menu-version').click();
      await new Promise((r) => setTimeout(r, 200));
      const ov = document.getElementById('changelogOverlay');
      return {
        offen: !!ov && ov.classList.contains('show'),
        releases: ov ? ov.querySelectorAll('.cl-rel').length : 0,
        aktuell: ov ? (ov.querySelector('.cl-rel.current .cl-ver') || {}).textContent : null
      };
    });
    assert(r.offen, 'Overlay hat sich nicht geoeffnet');
    assert(r.releases >= 5, 'Nur ' + r.releases + ' Eintraege');
    assertEqual(r.aktuell, APP_VERSION_ERWARTET, 'Aktuelle Version markiert');
    await p.close();
  });
}

await test('Jeder Eintrag hat Version, Datum, Titel und Aenderungen', async () => {
  const p = await open('specs.html');
  const r = await p.page.evaluate(() => {
    openChangelog();
    const TYPE_LABEL_PUBLIC = window.CHANGELOG_TYPE_LABEL || {};
    return RELEASES.map((rel) => ({
      v: /^v\d+$/.test(rel.version),
      d: /^\d{4}-\d{2}-\d{2}$/.test(rel.date),
      t: !!(rel.title && rel.title.length > 5),
      c: Array.isArray(rel.changes) && rel.changes.length > 0,
      // Ein Typ zaehlt als bekannt, wenn er eine Beschriftung hat - nicht,
      // wenn er auf einer Liste steht. Sonst faellt nicht auf, dass er ohne
      // Badge dargestellt wird, so geschehen bei 'verbessert' in v58/v59.
      typen: rel.changes.every((x) => !!TYPE_LABEL_PUBLIC[x.type])
    }));
  });
  assert(r.every((x) => x.v), 'Versionsformat');
  assert(r.every((x) => x.d), 'Datumsformat');
  assert(r.every((x) => x.t), 'Titel fehlt');
  assert(r.every((x) => x.c), 'Keine Aenderungen');
  assert(r.every((x) => x.typen),
    'Aenderungstyp ohne Beschriftung - wird ohne Badge dargestellt');
  // Und die Farbe muss es auch geben, sonst faellt der Badge farblos aus.
  const css = fs.readFileSync(path.join(REPO_ROOT, 'gallery.css'), 'utf8');
  const ohneFarbe = Object.keys(r.length ? (await p.page.evaluate(
    () => window.CHANGELOG_TYPE_LABEL || {})) : {})
    .filter((t) => !css.includes('.cl-type.' + t + ' '));
  assertEqual(ohneFarbe, [], 'Aenderungstyp ohne eigene Farbe in gallery.css');
  await p.close();
});

await test('Das Journal zeigt deutsche Daten, der aktuelle Eintrag mit Uhrzeit', async () => {
  const p = await open('specs.html');
  const r = await p.page.evaluate(() => {
    openChangelog();
    const ov = document.getElementById('changelogOverlay');
    return Array.from(ov.querySelectorAll('.cl-date')).map((e) => e.textContent.trim());
  });
  assert(r.length >= 5, 'Nur ' + r.length + ' Datumsangaben');
  assert(r.every((t) => /^\d{2}\.\d{2}\.\d{4}(, \d{2}:\d{2})?$/.test(t)),
    'Kein deutsches Datum: ' + JSON.stringify(r.filter((t) => !/^\d{2}\./.test(t))));
  assert(/, \d{2}:\d{2}$/.test(r[0]), 'Der aktuelle Eintrag hat keine Uhrzeit: ' + r[0]);
  // Aeltere Eintraege haben keine - die wird nicht nachtraeglich erfunden.
  assert(r.slice(1).some((t) => !/, /.test(t)), 'Allen alten Eintraegen wurde eine Uhrzeit angedichtet');
  await p.close();
});

await test('Die aktuelle Version hat einen Eintrag', async () => {
  // Sonst waere die Dokumentation beim naechsten Release sofort veraltet.
  const p = await open('specs.html');
  const r = await p.page.evaluate(() => ({
    aktuell: APP_VERSION,
    versionen: RELEASES.map((x) => x.version)
  }));
  assert(r.versionen.indexOf(r.aktuell) === 0,
    'Neuester Eintrag ist ' + r.versionen[0] + ', APP_VERSION ist ' + r.aktuell);
  await p.close();
});

await test('Die Versionsfolge hat keine Luecke', async () => {
  // Die Pruefung darunter sieht nur die oberste Nummer. Genau daran ist v50
  // bis v53 vorbeigerutscht: jede dieser Versionen ging ohne Eintrag raus, die
  // CI war vier Releases lang rot, und der v54-Eintrag hat sie wieder gruen
  // gemacht, ohne dass die Luecke verschwunden war.
  const p = await open('specs.html');
  const nummern = await p.page.evaluate(() => RELEASES.map((r) => Number(r.version.slice(1))));
  const luecken = [];
  for (let i = 0; i < nummern.length - 1; i++) {
    for (let n = nummern[i] - 1; n > nummern[i + 1]; n--) luecken.push('v' + n);
  }
  assertEqual(luecken.length, 0, 'Ohne Eintrag: ' + luecken.join(', '));
  assert(nummern.every((n, i) => i === 0 || n < nummern[i - 1]),
    'Die Eintraege stehen nicht absteigend: ' + nummern.join(', '));
  await p.close();
});

// _gistOk und _gistError halten den Sync-Zustand. Deklariert sind sie in
// gallery.js, das specs.html und build-log.html laden; index.html laedt es
// nicht und deklariert sein _gistError selbst. Faellt eine Deklaration weg,
// entsteht bei der ersten Zuweisung still eine globale Variable - das laeuft,
// bis jemand strict mode einschaltet. Deshalb wird hier auf Anwesenheit
// geprueft, nicht auf Abwesenheit: eine implizit angelegte Eigenschaft gibt es
// beim Laden noch gar nicht, eine per var deklarierte schon.
const SYNC_GLOBALS = {
  'index.html': ['_gistError'],
  'specs.html': ['_gistOk', '_gistError'],
  'build-log.html': ['_gistOk', '_gistError']
};

for (const file of PAGES) {
  await test(file + ': der Sync-Zustand ist deklariert, nicht implizit', async () => {
    const p = await open(file);
    const r = await p.page.evaluate((namen) => namen.map((n) => {
      const d = Object.getOwnPropertyDescriptor(window, n);
      return { n, da: !!d, konfigurierbar: !!d && d.configurable };
    }), SYNC_GLOBALS[file]);
    const fehlt = r.filter((x) => !x.da).map((x) => x.n);
    const implizit = r.filter((x) => x.da && x.konfigurierbar).map((x) => x.n);
    assertEqual(fehlt.length, 0, 'Keine Deklaration gefunden fuer: ' + fehlt.join(', '));
    assertEqual(implizit.length, 0, 'Implizit angelegt statt deklariert: ' + implizit.join(', '));
    await p.close();
  });
}

await test('Escape und Klick daneben schliessen das Overlay', async () => {
  const p = await open('specs.html');
  const r = await p.page.evaluate(async () => {
    openChangelog();
    const ov = document.getElementById('changelogOverlay');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const nachEsc = ov.classList.contains('show');
    openChangelog();
    ov.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return { nachEsc, nachKlick: ov.classList.contains('show'),
             scroll: document.body.style.overflow };
  });
  assert(!r.nachEsc, 'Escape schliesst nicht');
  assert(!r.nachKlick, 'Klick daneben schliesst nicht');
  assertEqual(r.scroll, '', 'Seiten-Scroll blieb gesperrt');
  await p.close();
});

await test('Text wird escaped', async () => {
  const p = await open('specs.html');
  const ok = await p.page.evaluate(() => {
    RELEASES.unshift({ version: 'v999', date: '2026-01-01', title: '<img src=x onerror=alert(1)>',
                       changes: [{ type: 'neu', text: '<script>alert(1)</scr' + 'ipt>' }] });
    openChangelog();
    const body = document.getElementById('changelogBody');
    const treffer = body.querySelectorAll('img, script').length === 0
                 && body.textContent.indexOf('<img') !== -1;
    RELEASES.shift();
    return treffer;
  });
  assert(ok, 'Inhalt wurde als HTML interpretiert');
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
