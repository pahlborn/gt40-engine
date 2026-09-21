// Tests fuer das gemeinsame Glossar und gegen wiederkehrende Kopien.
//
// Hintergrund: Das Glossar stand bis v44 wortgleich in drei HTML-Dateien - 140
// Eintraege, rund 97 kB je Kopie. Und es war bereits auseinandergelaufen:
//
//   - "Kolbenmulde (Piston Dish)": die Warnung, dass Verdichtungsrechner
//     unterschiedliche Vorzeichenkonventionen verwenden, stand NUR in
//     specs.html. Wer das Glossar im Build-Log aufschlug, bekam die aermere
//     Fassung - und konnte das Vorzeichen falsch setzen, ohne Hinweis.
//   - "Kolbenunterstand": in index.html ein anderes Messverfahren als in den
//     beiden anderen Dateien.
//
// Derselbe Fehlermodus wie beim FIELD_MIGRATION-Bug: kopiert, eine Kopie
// gepflegt, die anderen nicht. Diese Tests sorgen dafuer, dass es dabei bleibt.
//
// Lokal: node tests/glossar.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, summary
} from './helpers.mjs';

const SEITEN = ['build-log.html', 'index.html', 'specs.html'];
function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

const { server, base } = await startServer();
const browser = await chromium.launch();

async function glossarImDom(datei) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + datei);
  await page.waitForFunction(
    () => document.querySelectorAll('#glossaryBody .glossary-entry').length > 0,
    null, { timeout: 30000 });
  const daten = await page.evaluate(() => {
    const eintraege = Array.from(document.querySelectorAll('#glossaryBody .glossary-entry'));
    return {
      anzahl: eintraege.length,
      kategorien: document.querySelectorAll('#glossaryBody .glossary-category').length,
      begriffe: eintraege.map((e) => {
        const t = e.querySelector('.glossary-term');
        return t ? t.textContent.trim() : null;
      }),
      // Der Eintrag, der die Drift sichtbar gemacht hat.
      // Ueber den Begriff suchen, nicht ueber den Volltext: "Piston Dish"
      // kommt auch im Eintrag zum Verdichtungsverhaeltnis vor.
      dishText: (Array.from(document.querySelectorAll('#glossaryBody .glossary-entry'))
        .find((e) => {
          const t = e.querySelector('.glossary-term');
          return t && /Piston Dish/.test(t.textContent);
        }) || {}).textContent || '',
      // Findet search.js die Eintraege ueber seinen eigenen Selektor?
      ueberSuchSelektor: document.querySelectorAll('#guide-glossary .glossary-entry').length
    };
  });
  await ctx.close();
  return { daten, fehler };
}

try {

// ---------------------------------------------------------------------------
suite('Das Glossar steht genau einmal im Repository');

await test('Keine HTML-Datei enthaelt Glossar-Eintraege im Quelltext', async () => {
  const treffer = fs.readdirSync(REPO_ROOT)
    .filter((f) => f.endsWith('.html'))
    .filter((f) => lies(f).includes('class="glossary-entry"'));
  assert(treffer.length === 0,
    'Glossar wieder in HTML einkopiert: ' + treffer.join(', '));
});

await test('glossar.js traegt alle 140 Eintraege', async () => {
  const js = lies('glossar.js');
  const eintraege = (js.match(/class="glossary-entry"/g) || []).length;
  assert(eintraege === 140, 'Erwartet 140 Eintraege, gefunden: ' + eintraege);
  const kategorien = (js.match(/class="glossary-category"/g) || []).length;
  assert(kategorien === 17, 'Erwartet 17 Kategorien, gefunden: ' + kategorien);
});

await test('Alle drei Seiten binden glossar.js ein', async () => {
  for (const f of SEITEN) {
    assert(lies(f).includes('<script src="glossar.js"></script>'),
      f + ': Einbindung fehlt');
    assert(lies(f).includes('id="glossaryBody"'), f + ': Container fehlt');
  }
});

await test('glossar.js ist im Service-Worker-Cache', async () => {
  // Ohne diesen Eintrag verliert die PWA offline das komplette Glossar.
  assert(/\/gt40-engine\/glossar\.js/.test(lies('sw.js')),
    'glossar.js fehlt in urlsToCache');
});

// ---------------------------------------------------------------------------
suite('Der zusammengefuehrte Inhalt ist der vollstaendige');

await test('Die Vorzeichen-Warnung der Verdichtungsrechner ist erhalten', async () => {
  // Sie stand vor der Zusammenfuehrung nur in specs.html. Ein falsches
  // Vorzeichen liefert eine falsche Verdichtung, ohne dass es auffaellt.
  const js = lies('glossar.js');
  assert(/Achtung Vorzeichen/.test(js), 'Warnung fehlt');
  assert(/Summit Racing/.test(js), 'Konkreter Rechner nicht benannt');
  assert(/Andere Rechner erwarten negative Werte/.test(js),
    'Gegenkonvention nicht benannt');
});

await test('Kolbenunterstand traegt das vollstaendige Messverfahren', async () => {
  // index.html hatte hier eine kuerzere Fassung ohne OT-Bestaetigung.
  const js = lies('glossar.js');
  assert(/exakten OT \(h&ouml;chster Ausschlag\) zu best&auml;tigen/.test(js),
    'Schritt zur OT-Bestaetigung fehlt');
  assert(/Thrust &amp; Anti-Thrust/.test(js),
    'Messung an Druck- und Gegenseite fehlt');
});

// ---------------------------------------------------------------------------
suite('Im Browser landet das Glossar tatsaechlich im DOM');

for (const datei of SEITEN) {
  await test(datei + ': 140 Eintraege werden eingesetzt', async () => {
    const { daten, fehler } = await glossarImDom(datei);
    assert(fehler.length === 0, 'Page-Errors: ' + fehler.join(' | '));
    assert(daten.anzahl === 140, 'Im DOM: ' + daten.anzahl + ' statt 140');
    assert(daten.kategorien === 17, 'Kategorien im DOM: ' + daten.kategorien);
  });
}

await test('search.js findet die Eintraege ueber seinen eigenen Selektor', async () => {
  // search.js sucht ueber "#guide-glossary .glossary-entry". Liegt der
  // Container ausserhalb, laeuft die Suche stumm ins Leere - genau die Art
  // Fehler, die erst dem Benutzer auffaellt.
  for (const datei of SEITEN) {
    const { daten } = await glossarImDom(datei);
    assert(daten.ueberSuchSelektor === 140,
      datei + ': search.js sieht ' + daten.ueberSuchSelektor + ' statt 140 Eintraege');
  }
});

await test('Alle drei Seiten zeigen dieselben Begriffe', async () => {
  // Das war vor der Zusammenfuehrung nicht garantiert.
  const listen = [];
  for (const datei of SEITEN) listen.push((await glossarImDom(datei)).daten.begriffe);
  const [a, ...rest] = listen;
  for (let i = 0; i < rest.length; i++) {
    assert(JSON.stringify(a) === JSON.stringify(rest[i]),
      SEITEN[i + 1] + ' weicht von ' + SEITEN[0] + ' ab');
  }
});

await test('Die reiche Fassung erscheint auf jeder Seite', async () => {
  for (const datei of SEITEN) {
    const { daten } = await glossarImDom(datei);
    assert(/Achtung Vorzeichen/.test(daten.dishText),
      datei + ': Vorzeichen-Warnung kommt nicht im DOM an');
  }
});

// ---------------------------------------------------------------------------
suite('Die verwaisten Phasendateien sind weg');

await test('Keine build-log-phaseN.html mehr im Repository', async () => {
  // Sie waren nirgends verlinkt, aber per URL abrufbar - und lieferten
  // deshalb ungeprueft Aussagen aus, die im Build-Log laengst korrigiert
  // waren (Unterdruckdose, 2-Step, Buechsentabelle).
  const rest = fs.readdirSync(REPO_ROOT).filter((f) => /^build-log-phase\d+\.html$/.test(f));
  assert(rest.length === 0, 'Noch vorhanden: ' + rest.join(', '));
});

await test('Nichts verweist mehr auf sie', async () => {
  const kandidaten = [];
  for (const d of ['.', 'docs', 'tests']) {
    const p = path.join(REPO_ROOT, d);
    for (const f of fs.readdirSync(p)) {
      if (/\.(html|js|mjs|yml|json)$/.test(f)) kandidaten.push(path.join(d, f));
    }
  }
  const treffer = kandidaten.filter((f) => {
    // Diese Datei selbst enthaelt das Suchmuster als Literal.
    if (f.endsWith('glossar.test.mjs')) return false;
    const h = fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
    // Ein erklaerender Kommentar darf die Datei nennen; ein Zugriff nicht.
    return /readFileSync\([^)]*build-log-phase|href="build-log-phase|src="build-log-phase/.test(h);
  });
  assert(treffer.length === 0, 'Zugriff verblieben in: ' + treffer.join(', '));
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
