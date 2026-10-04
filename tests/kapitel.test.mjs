// Tests fuer kapitel.js und die Gesamtgalerie.
//
// Hintergrund: die Kapitelstruktur stand nirgends als Daten. gallery.js hat
// den Titel einer Fotogruppe ermittelt, indem es im DOM rueckwaerts nach der
// naechsten Ueberschrift lief. Bei 13 der 15 Build-Log-Gruppen kam dabei
// "Photo Documentation" heraus - das ist dort die Zwischenueberschrift ueber
// dem Fotostreifen. Eine seitenuebergreifende Galerie kann diese Heuristik
// ohnehin nicht benutzen.
//
// Der teuerste Fehler waere, dass Registry und Markup auseinanderlaufen:
// eine Gruppe im Markup ohne Eintrag bekaeme wieder ihre technische ID als
// Titel, ein Eintrag ohne Markup eine Karteileiche in der Gesamtgalerie.
// Beide Richtungen werden darum geprueft.
//
// Lokal: node tests/kapitel.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, waitForGallery, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

async function oeffne(datei) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + datei);
  await page.waitForFunction(() => typeof KAPITEL !== 'undefined', null, { timeout: 30000 });
  await waitForGallery(page);
  return { ctx, page, errors, close: () => ctx.close() };
}

// Gruppen aus dem Markup, ohne Browser - damit der Test auch dann etwas sagt,
// wenn die Seite gar nicht erst laedt.
function gruppenImMarkup(datei) {
  const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
  return [...html.matchAll(/data-comp-gallery="([^"]+)"/g)].map((m) => m[1]);
}

try {

suite('Registry und Markup muessen zusammenpassen');

await test('Jede Fotogruppe im Markup steht in der Registry', async () => {
  const p = await oeffne('specs.html');
  const bekannt = await p.page.evaluate(() => KAPITEL.GRUPPEN.map((e) => e.gruppe));
  const fehlen = [];
  for (const datei of ['specs.html', 'build-log.html']) {
    for (const g of gruppenImMarkup(datei)) {
      if (!bekannt.includes(g)) fehlen.push(datei + ': ' + g);
    }
  }
  assertEqual(fehlen, [], 'Gruppen ohne Registry-Eintrag');
  await p.close();
});

await test('Jeder Registry-Eintrag hat Markup auf der genannten Seite', async () => {
  const p = await oeffne('specs.html');
  const eintraege = await p.page.evaluate(() =>
    KAPITEL.GRUPPEN.map((e) => ({ gruppe: e.gruppe, seite: e.seite })));
  const markup = {
    'specs.html': gruppenImMarkup('specs.html'),
    'build-log.html': gruppenImMarkup('build-log.html')
  };
  const falsch = eintraege
    .filter((e) => !(markup[e.seite] || []).includes(e.gruppe))
    .map((e) => e.gruppe + ' -> ' + e.seite);
  assertEqual(falsch, [], 'Registry-Eintraege ohne passendes Markup');
  await p.close();
});

await test('Jede Gruppe liegt in einem deklarierten Bereich', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    const ids = KAPITEL.BEREICHE.map((b) => b.id);
    return KAPITEL.GRUPPEN.filter((e) => !ids.includes(e.bereich)).map((e) => e.gruppe);
  });
  assertEqual(r, [], 'Gruppen mit unbekanntem Bereich');
  await p.close();
});

suite('Die Titel sind nicht mehr "Photo Documentation"');

await test('Build-Log-Gruppen tragen ihren Schrittnamen', async () => {
  const p = await oeffne('build-log.html');
  const titel = await p.page.evaluate(() =>
    KAPITEL.GRUPPEN.filter((e) => e.seite === 'build-log.html').map((e) => ({
      g: e.gruppe,
      t: _galleryTitleFor(e.gruppe, document.querySelector('[data-comp-gallery="' + e.gruppe + '"]'))
    })));
  const schlecht = titel.filter((x) => /Photo Documentation/i.test(x.t) || x.t === x.g);
  assertEqual(schlecht.map((x) => x.g + ': ' + x.t), [], 'Gruppen ohne sprechenden Titel');
  assert(titel.length === 15, 'erwartet 15 Build-Log-Gruppen, waren ' + titel.length);
  await p.close();
});

await test('Eine Gruppe der anderen Seite bekommt trotzdem ihren Titel', async () => {
  // Der eigentliche Grund fuer die Registry: build-log.html hat kein Markup
  // der specs-Bauteile und kann deren Ueberschrift nicht im DOM suchen.
  const p = await oeffne('build-log.html');
  const t = await p.page.evaluate(() => _galleryTitleFor('heads', null));
  assert(/AFR/.test(t), 'Fremdgruppe ohne Titel aus der Registry: ' + t);
  await p.close();
});

suite('Gesamtgalerie');

await test('Sie oeffnet sich und gliedert nach Bauteil', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    oeffneGesamtgalerie();
    const ov = document.getElementById('galerieGesamt');
    return {
      offen: ov.classList.contains('show'),
      bereiche: [...ov.querySelectorAll('.gg-bereich')].map((e) => e.textContent),
      gruppen: [...ov.querySelectorAll('.gg-gruppe')].map((e) => e.dataset.ggGruppe)
    };
  });
  assert(r.offen, 'Overlay ist nicht offen');
  assert(r.bereiche.length >= 3, 'zu wenige Bereiche: ' + r.bereiche.join(', '));
  assert(r.gruppen.length > 0, 'keine Gruppen gerendert');
  assertEqual(p.errors, [], 'Seitenfehler');
  await p.close();
});

await test('Sie zeigt auch Gruppen der jeweils anderen Seite', async () => {
  // Das ist der Kern des Wunsches: kapiteluebergreifend, von jeder Seite aus.
  const p = await oeffne('build-log.html');
  const gruppen = await p.page.evaluate(() => {
    document.getElementById('galerieLeereZeigen');
    oeffneGesamtgalerie();
    document.getElementById('galerieLeereZeigen').checked = true;
    renderGesamtgalerie();
    return [...document.querySelectorAll('#galerieGesamt .gg-gruppe')].map((e) => e.dataset.ggGruppe);
  });
  assert(gruppen.includes('heads'), 'specs-Gruppe "heads" fehlt auf build-log.html');
  assert(gruppen.includes('p1_block_photos'), 'eigene Gruppe fehlt');
  await p.close();
});

await test('Der Aufruf aus einem Kapitel springt zum richtigen Abschnitt', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    oeffneGesamtgalerie('shortblock');
    const el = document.getElementById('gg-shortblock');
    return { da: !!el, fokus: el ? el.classList.contains('gg-fokus') : false };
  });
  assert(r.da, 'Abschnitt gg-shortblock fehlt');
  assert(r.fokus, 'Abschnitt wurde nicht hervorgehoben');
  await p.close();
});

await test('Herstellerbilder sind als solche gekennzeichnet', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    oeffneGesamtgalerie();
    const standard = [...document.querySelectorAll('#galerieGesamt .gg-standard')];
    return {
      anzahl: standard.length,
      beschriftet: standard.every((e) => /Herstellerbild/.test(e.textContent))
    };
  });
  assert(r.anzahl > 0, 'keine Herstellerbilder in der Gesamtgalerie');
  assert(r.beschriftet, 'Herstellerbild ohne Beschriftung');
  await p.close();
});

await test('Leere Kapitel bleiben verborgen, bis man sie anfordert', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    oeffneGesamtgalerie();
    const zu = document.querySelectorAll('#galerieGesamt .gg-gruppe').length;
    document.getElementById('galerieLeereZeigen').checked = true;
    renderGesamtgalerie();
    const auf = document.querySelectorAll('#galerieGesamt .gg-gruppe').length;
    return { zu, auf, gesamt: KAPITEL.GRUPPEN.length };
  });
  assert(r.auf === r.gesamt, 'mit Schalter muessen alle ' + r.gesamt + ' Gruppen kommen, waren ' + r.auf);
  assert(r.zu < r.auf, 'ohne Schalter wurden genauso viele gezeigt (' + r.zu + ')');
  await p.close();
});

await test('Jeder Abschnitt verweist zurueck auf sein Kapitel', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    oeffneGesamtgalerie();
    document.getElementById('galerieLeereZeigen').checked = true;
    renderGesamtgalerie();
    return [...document.querySelectorAll('#galerieGesamt .gg-gruppe')].map((e) => {
      const a = e.querySelector('.gg-sprung');
      return { g: e.dataset.ggGruppe, href: a ? a.getAttribute('href') : null };
    });
  });
  const ohne = r.filter((x) => !x.href);
  assertEqual(ohne.map((x) => x.g), [], 'Abschnitte ohne Ruecksprung');
  const falsch = r.filter((x) => !/^(specs|build-log)\.html#galerie-/.test(x.href));
  assertEqual(falsch.map((x) => x.g + ' -> ' + x.href), [], 'Ruecksprung zeigt ins Leere');
  await p.close();
});

await test('Das Sprungziel existiert im Markup der Zielseite', async () => {
  // Die Anker werden in _collectDefaults() gesetzt. Ohne sie landet der
  // Ruecksprung oben auf der Seite statt beim Bauteil.
  for (const datei of ['specs.html', 'build-log.html']) {
    const p = await oeffne(datei);
    const r = await p.page.evaluate(() =>
      [...document.querySelectorAll('[data-comp-gallery]')]
        .filter((s) => s.id !== 'galerie-' + s.dataset.compGallery)
        .map((s) => s.dataset.compGallery));
    assertEqual(r, [], datei + ': Streifen ohne Anker-Id');
    await p.close();
  }
});

suite('Die Seite bleibt heil');

await test('Beide Seiten laden ohne Page-Errors', async () => {
  for (const datei of ['specs.html', 'build-log.html']) {
    const p = await oeffne(datei);
    assertEqual(p.errors, [], datei);
    await p.close();
  }
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
