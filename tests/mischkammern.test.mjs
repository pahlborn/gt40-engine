// Tests fuer die Ist-Bestueckung je Mischkammer und die Begriffswahl.
//
// Hintergrund: Die Ist-Beduesung war je Vergaser angelegt - vier Spalten fuer
// vier Vergaser. Ein DRLA 45 ist aber ein Doppel-Fallstromvergaser: jede der
// beiden Mischkammern hat ihre eigene Haupt-, Leerlauf- und Luftkorrekturduese,
// ihr eigenes Emulsionsrohr, ihren eigenen Pumpjet und ihren eigenen Venturi.
// Vier Vergaser sind acht Mischkammern. Die alte Tabelle konnte die reale
// Bestueckung also gar nicht aufnehmen - wer sie ausfuellte, musste mitteln
// oder eine Kammer weglassen, und das faellt erst beim Abstimmen auf.
//
// Lokal: node tests/mischkammern.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, summary
} from './helpers.mjs';

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

const DUESEN = ['main', 'idle', 'air', 'emul', 'pump', 'aux'];
const KAMMERN = [];
for (const v of ['1', '2', '3', '4']) for (const k of ['a', 'b']) KAMMERN.push(v + k);

const JET_FELDER = [];
for (const d of DUESEN) for (const vk of KAMMERN) JET_FELDER.push('p3_jet_v' + vk + '_' + d);
const CARB_FELDER = [];
for (const m of ['housing', 'needle', 'float', 'pump', 'cond'])
  for (const v of ['1', '2', '3', '4']) CARB_FELDER.push('p3_carb_v' + v + '_' + m);
const MAP_FELDER = [];
for (const vk of KAMMERN) { MAP_FELDER.push('p3_map_v' + vk + '_cyl'); MAP_FELDER.push('p3_map_v' + vk + '_col'); }

const { server, base } = await startServer();
const browser = await chromium.launch();

async function felder() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined', null, { timeout: 30000 });
  const daten = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[data-field]'));
    return {
      namen: els.map((e) => e.dataset.field),
      nichtEingabe: els.filter((e) => /^p3_(jet_v|carb_v|map_v)/.test(e.dataset.field))
        .filter((e) => !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName))
        .map((e) => e.dataset.field)
    };
  });
  await ctx.close();
  return { daten, fehler };
}

try {

// ---------------------------------------------------------------------------
suite('Acht Mischkammern statt vier Vergaser');

await test('Alle 48 Duesenfelder existieren im DOM', async () => {
  const { daten, fehler } = await felder();
  assert(fehler.length === 0, 'Page-Errors: ' + fehler.join(' | '));
  const fehlend = JET_FELDER.filter((f) => !daten.namen.includes(f));
  assert(fehlend.length === 0, 'Fehlen: ' + fehlend.slice(0, 8).join(', ') +
    (fehlend.length > 8 ? ' (+' + (fehlend.length - 8) + ')' : ''));
});

await test('Die alten Felder je Vergaser sind verschwunden', async () => {
  const h = lies('build-log.html');
  // Sie duerfen nur noch in der Migrationstabelle vorkommen, nicht als Feld.
  const alsFeld = /data-field="p3_jet_c[1-4]_/.test(h);
  assert(!alsFeld, 'Alte Vergaser-Spalten stehen weiterhin als Eingabefeld da');
});

await test('Eingetragene Werte gehen beim Umbau nicht verloren', async () => {
  // Ohne Migrationseintrag waere jeder bereits erfasste Wert still weg.
  const h = lies('build-log.html');
  for (const v of ['1', '2', '3', '4']) {
    for (const d of DUESEN) {
      const muster = new RegExp("'p3_jet_c" + v + "_" + d + "': 'p3_jet_v" + v + "a_" + d + "'");
      assert(muster.test(h), 'Migration fehlt fuer p3_jet_c' + v + '_' + d);
    }
  }
});

await test('Je Vergaser gibt es die Felder, die nur einmal vorkommen', async () => {
  const { daten } = await felder();
  const fehlend = CARB_FELDER.filter((f) => !daten.namen.includes(f));
  assert(fehlend.length === 0, 'Fehlen: ' + fehlend.join(', '));
});

await test('Die Zuordnungskette Mischkammer-Zylinder-Collector ist erfassbar', async () => {
  // Ohne sie laesst sich eine Lambda-Abweichung spaeter nicht zurueckverfolgen.
  const { daten } = await felder();
  const fehlend = MAP_FELDER.filter((f) => !daten.namen.includes(f));
  assert(fehlend.length === 0, 'Fehlen: ' + fehlend.join(', '));
});

await test('Alle neuen Felder sind echte Eingabefelder', async () => {
  const { daten } = await felder();
  assert(daten.nichtEingabe.length === 0,
    'Nicht speicherbar: ' + daten.nichtEingabe.join(', '));
});

await test('Der Grund steht dabei', async () => {
  const h = lies('build-log.html');
  assert(/Acht Mischkammern, nicht vier Vergaser/.test(h), 'Warnhinweis fehlt');
  assert(/eigene<\/strong> Haupt-, Leerlauf- und Luftkorrekturd&uuml;se/.test(h),
    'Begruendung (eigene Duesen je Kammer) fehlt');
});

// ---------------------------------------------------------------------------
suite('Begriff: Mischkammer statt Lauf oder Kanal');

await test('Weder Lauf noch Kanal bezeichnen noch die Mischkammer', async () => {
  const seiten = ['build-log.html', 'index.html', 'specs.html',
                  'docs/troubleshooting.html', 'docs/komponenten.html',
                  'docs/dellorto-drla-tuning.html'];
  const verboten = [/acht L&auml;ufe/, /ein Lauf je Zylinder/, /8 L&auml;ufe/,
                    /Venturi-Kan&auml;len/, /Jeder Kanal hat/];
  for (const f of seiten) {
    const h = lies(f);
    for (const m of verboten) {
      assert(!m.test(h), f + ': alter Begriff ' + m + ' steht noch da');
    }
  }
});

await test('Die Verwechslungsgefahr ist einmal erklaert', async () => {
  // Lufttrichter = Venturi, Mischrohr = Emulsionsrohr - beides im deutschen
  // Weber-Teilekatalog belegt besetzt. "Stufe" waere ein Registervergaser.
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(/Lufttrichter<\/em> f&uuml;r den Venturi-Einsatz/.test(h), 'Lufttrichter nicht abgegrenzt');
  assert(/Mischrohr<\/em> f&uuml;r das Emulsionsrohr/.test(h), 'Mischrohr nicht abgegrenzt');
  assert(/Registervergaser/.test(h), 'Abgrenzung gegen "Stufe" fehlt');
});

await test('Das Glossar fuehrt die Vergaser-Begriffe', async () => {
  const js = lies('glossar.js');
  for (const begriff of ['Mischkammer (Barrel)', 'Hauptventuri', 'Hilfsventuri',
                         'Emulsionsrohr (Mischrohr / Polverizzatore)']) {
    assert(js.includes(begriff), 'Glossareintrag fehlt: ' + begriff);
  }
  assert(/18\. Vergaser/.test(js), 'Vergaser-Kategorie fehlt');
  assert(/Die Zahl im Typennamen ist <strong>nicht<\/strong> der Venturi/.test(js),
    'Die 45-ist-nicht-der-Venturi-Klarstellung fehlt');
});

// ---------------------------------------------------------------------------
suite('Verteiler-Fotos in der Galerie');

await test('Die drei Fotos liegen in der Verteiler-Galerie', async () => {
  // Die Galerie liest img/user/<gruppe>/ ueber die GitHub-Tree-API.
  const dir = path.join(REPO_ROOT, 'img', 'user', 'distributor');
  assert(fs.existsSync(dir), 'Verzeichnis img/user/distributor fehlt');
  const bilder = fs.readdirSync(dir).filter((f) => /\.jpg$/i.test(f));
  assert(bilder.length >= 3, 'Erwartet mindestens 3 Fotos, gefunden: ' + bilder.length);
  for (const teil of ['federn', 'pn-8479', '8464']) {
    assert(bilder.some((f) => f.includes(teil)), 'Kein Foto zu "' + teil + '"');
  }
});

await test('Die Dateinamen folgen der Konvention der App', async () => {
  // gallery.js legt sie als <epoch-ms>_<idx>_<name>.jpg ab; der Name wird in
  // Karte und Lightbox angezeigt.
  const dir = path.join(REPO_ROOT, 'img', 'user', 'distributor');
  for (const f of fs.readdirSync(dir).filter((x) => /\.jpg$/i.test(x))) {
    assert(/^\d{13}_\d+_[\w-]+\.jpg$/.test(f), 'Name weicht ab: ' + f);
  }
});

await test('Die Fotos sind auf die Breite der App skaliert', async () => {
  // gallery.js skaliert beim Upload auf maximal 1200 px Breite. Groessere
  // Dateien blaehen Repository und PWA-Cache auf, ohne mehr zu zeigen.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const dir = 'img/user/distributor';
  const bilder = fs.readdirSync(path.join(REPO_ROOT, 'img', 'user', 'distributor'))
    .filter((f) => /\.jpg$/i.test(f));
  const masse = await page.evaluate(async (liste) => {
    const out = [];
    for (const src of liste) {
      const im = new Image();
      im.src = src;
      await new Promise((r) => { im.onload = r; im.onerror = r; });
      out.push({ src: src, w: im.naturalWidth, h: im.naturalHeight });
    }
    return out;
  }, bilder.map((f) => base + '/' + dir + '/' + f));
  await ctx.close();
  for (const m of masse) {
    assert(m.w > 0, 'Laedt nicht: ' + m.src);
    assert(m.w <= 1200, 'Breiter als 1200 px: ' + m.src + ' (' + m.w + ')');
  }
});

// ---------------------------------------------------------------------------
suite('Federn: Farbe genuegt nicht zur Bestimmung');

await test('Der Guide sagt, dass die silbernen Federn gleich aussehen', async () => {
  const g = lies('docs/msd-advance-tuning.html');
  assert(/Heavy Silver und Light Silver sind an der Farbe nicht zu unterscheiden/.test(g),
    'Hinweis fehlt');
  assert(/allein in der <strong>Drahtst&auml;rke<\/strong>/.test(g),
    'Unterscheidungsmerkmal nicht benannt');
  assert(/fallen alle Kombinationen mit Light Blue heraus/.test(g),
    'Ableitungsregel ohne blaue Feder fehlt');
  assert(/direkter Vergleich/.test(g), 'Vergleich gegen das Kit fehlt');
});

// ---------------------------------------------------------------------------
suite('Sprachumschaltung des Glossars');

await test('Kein data-fidx, das parseInt verfaelscht', async () => {
  // "37b" wurde von parseInt zu 37 - der englische Vorzeichen-Hinweis war
  // dadurch nicht erreichbar und der Effect-Text erschien doppelt.
  const js = lies('glossar.js');
  const used = [...new Set([...js.matchAll(/data-fidx="([^"]+)"/g)].map((m) => m[1]))];
  const schlecht = used.filter((k) => String(parseInt(k, 10)) !== k);
  assert(schlecht.length === 0, 'Mehrdeutige fidx: ' + schlecht.join(', '));
});

await test('Die Woerterbuecher stehen nur noch in glossar.js', async () => {
  for (const f of ['build-log.html', 'index.html', 'specs.html']) {
    assert(!/var _g(DE|EN)\s*=\s*\{/.test(lies(f)), f + ': Woerterbuch wieder einkopiert');
  }
  const js = lies('glossar.js');
  assert(/global\._gDE\s*=\s*\{/.test(js) && /global\._gEN\s*=\s*\{/.test(js),
    'Woerterbuecher fehlen in glossar.js');
});

await test('Die Vorzeichen-Warnung ueberlebt den Sprachwechsel', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/specs.html');
  await page.waitForFunction(
    () => document.querySelectorAll('#glossaryBody .glossary-entry').length > 0,
    null, { timeout: 30000 });
  const holen = () => page.evaluate(() => {
    const e = [...document.querySelectorAll('#glossaryBody .glossary-entry')]
      .find((x) => /Piston Dish/.test(x.querySelector('.glossary-term').textContent));
    return [...e.querySelectorAll('[data-fidx]')].map((f) => f.textContent.trim());
  });
  const de = await holen();
  await page.evaluate(() => switchGlossaryLang());
  const en = await holen();
  await page.evaluate(() => switchGlossaryLang());
  const zurueck = await holen();
  await ctx.close();

  assert(de.some((t) => /Achtung Vorzeichen/.test(t)), 'DE: Warnung fehlt');
  assert(en.some((t) => /Sign convention warning/.test(t)), 'EN: Warnung fehlt');
  assert(zurueck.some((t) => /Achtung Vorzeichen/.test(t)), 'Zurueck auf DE: Warnung fehlt');
  // Der Fehler zeigte sich als doppelter Effect-Text.
  assert(new Set(en).size === en.length, 'EN: ein Text erscheint doppelt');
  assert(new Set(de).size === de.length, 'DE: ein Text erscheint doppelt');
});

// ---------------------------------------------------------------------------
suite('Schwimmerstand: DRLA-spezifisches Verfahren');

await test('Das Verfahren steht mit Bezugsflaeche da', async () => {
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(/5 bis 6 mm/.test(h), 'Massangabe fehlt');
  assert(/Deckeldichtung in normaler Lage montieren/.test(h), 'Dichtung nicht als Bedingung genannt');
  assert(/Deckel senkrecht halten/.test(h), 'Haltung des Deckels fehlt');
  assert(/leicht ber&uuml;hrt/.test(h), 'Bedingung am Nadelventil fehlt');
});

await test('Die alte, falsche Angabe ist zurueckgezogen', async () => {
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(!/5\.5&ndash;6 mm tr&auml;gt keine Primaerquelle/.test(h), 'Alte Fassung steht noch da');
  assert(/Zwei unserer bisherigen Angaben waren falsch/.test(h), 'Richtigstellung fehlt');
  assert(/starke Sekund&auml;rquelle/.test(h), 'Quellengrad nicht eingeordnet');
});

await test('Zeichnung und Schwimmerstandblatt liegen im Repo', async () => {
  for (const d of ['img/dellorto-drla-explosionszeichnung.jpg',
                   'img/dellorto-drla-schwimmerstand.jpg']) {
    const p = path.join(REPO_ROOT, d);
    assert(fs.existsSync(p), 'fehlt: ' + d);
    assert(fs.statSync(p).size > 20000, d + ' ist verdaechtig klein');
  }
  const h = lies('docs/dellorto-drla-tuning.html');
  assert(h.includes('../img/dellorto-drla-explosionszeichnung.jpg'), 'Zeichnung nicht eingebunden');
  assert(h.includes('../img/dellorto-drla-schwimmerstand.jpg'), 'Schwimmerstandblatt nicht eingebunden');
});

await test('Die Bilder laden im Browser tatsaechlich', async () => {
  // Ein falscher Pfad faellt sonst erst dem Benutzer auf.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base + '/docs/dellorto-drla-tuning.html');
  const kaputt = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img[src*="dellorto-drla-"]')];
    await Promise.all(imgs.map((i) => i.complete ? null : new Promise((r) => {
      i.addEventListener('load', r); i.addEventListener('error', r);
    })));
    return imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src'));
  });
  await ctx.close();
  assert(kaputt.length === 0, 'Laden fehlgeschlagen: ' + kaputt.join(', '));
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
