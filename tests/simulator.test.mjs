// Tests fuer den Motor-Simulator auf index.html.
//
// Das Modell schaetzt Leistung und Drehmoment aus Hubraum, Kopfdurchsatz,
// Nockenwelle, Verdichtung und Abstimmung. Es kam ohne Testabdeckung ins
// Repository, und seine Koeffizienten sind Erfahrungswerte - eben deshalb
// muss wenigstens festgehalten sein, dass es sich physikalisch sinnvoll
// verhaelt und bei keiner Eingabe NaN ausgibt.
//
// Was hier NICHT geprueft wird: ob die Zahlen stimmen. Dafuer braeuchte es
// einen Pruefstand. Geprueft wird die Richtung - mehr Hubraum muss mehr
// Leistung ergeben - und dass das Ergebnis als Schaetzung gekennzeichnet
// bleibt.
//
// Lokal: node tests/simulator.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

async function oeffne() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/index.html');
  await page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  await page.waitForTimeout(300);
  return { ctx, page, errors, close: () => ctx.close() };
}

// Laesst den Simulator mit den uebergebenen Feldwerten rechnen und liest ab.
async function rechne(page, felder = {}) {
  return page.evaluate((f) => {
    Object.keys(f).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = String(f[id]);
    });
    runSim();
    const zahl = (id) => {
      const t = (document.getElementById(id).textContent || '').replace(/[^0-9.,-]/g, '').replace(',', '.');
      return parseFloat(t);
    };
    return {
      hp: zahl('simPeakHP'),
      hpRpm: zahl('simPeakHPrpm'),
      tq: zahl('simPeakTQ'),
      tqRpm: zahl('simPeakTQrpm'),
      hpText: document.getElementById('simPeakHP').textContent,
      tqText: document.getElementById('simPeakTQ').textContent,
      convText: document.getElementById('simPeakHPconv').textContent
    };
  }, felder);
}

const BASIS = {
  simBore: 4.000, simStroke: 3.000, simCyl: 8, simCR: 9.0,
  simCFMint: 250, simCFMexh: 190, simDurInt: 230, simDurExh: 236,
  simLiftInt: 0.555, simLiftExh: 0.565, simLSA: 110,
  simMechEff: 85, simTiming: 34
};

try {

// ---------------------------------------------------------------------------
suite('Das Modell rechnet ueberhaupt');

await test('Eine vollstaendige Eingabe ergibt endliche, plausible Werte', async () => {
  const p = await oeffne();
  const r = await rechne(p.page, BASIS);
  assert(Number.isFinite(r.hp), 'Leistung ist keine Zahl: ' + r.hpText);
  assert(Number.isFinite(r.tq), 'Drehmoment ist keine Zahl: ' + r.tqText);
  // 302 ci Sauger: alles ausserhalb dieser Spanne waere ein Rechenfehler,
  // keine Abstimmungsfrage.
  assert(r.hp > 150 && r.hp < 700, 'Leistung ausserhalb jeder Plausibilitaet: ' + r.hp);
  assert(r.tq > 150 && r.tq < 600, 'Drehmoment ausserhalb jeder Plausibilitaet: ' + r.tq);
  assert(r.hpRpm > 2000 && r.hpRpm <= 7500, 'Leistungsdrehzahl: ' + r.hpRpm);
  assert(r.tqRpm > 1000 && r.tqRpm <= 7500, 'Drehmomentdrehzahl: ' + r.tqRpm);
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Die Leistungsspitze liegt oberhalb der Drehmomentspitze', async () => {
  // Bei einem Saugmotor ohne Getriebe dazwischen ist das keine Abstimmungs-
  // frage, sondern folgt aus HP = TQ * RPM / 5252.
  const p = await oeffne();
  const r = await rechne(p.page, BASIS);
  assert(r.hpRpm > r.tqRpm,
    'Leistung bei ' + r.hpRpm + ', Drehmoment bei ' + r.tqRpm);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Richtungen, die stimmen muessen');

await test('Mehr Hubraum ergibt mehr Leistung', async () => {
  const p = await oeffne();
  const klein = await rechne(p.page, { ...BASIS, simStroke: 3.000 });
  const gross = await rechne(p.page, { ...BASIS, simStroke: 3.400 });
  assert(gross.hp > klein.hp,
    'Laengerer Hub gab nicht mehr Leistung: ' + klein.hp + ' -> ' + gross.hp);
  await p.close();
});

await test('Mehr Verdichtung ergibt mehr Leistung', async () => {
  // Folgt aus dem Otto-Wirkungsgrad, der im Modell steckt.
  const p = await oeffne();
  const niedrig = await rechne(p.page, { ...BASIS, simCR: 8.5 });
  const hoch = await rechne(p.page, { ...BASIS, simCR: 11.0 });
  assert(hoch.hp > niedrig.hp,
    'Hoehere Verdichtung gab nicht mehr Leistung: ' + niedrig.hp + ' -> ' + hoch.hp);
  await p.close();
});

await test('Mehr Kopfdurchsatz ergibt nicht weniger Leistung', async () => {
  const p = await oeffne();
  const eng = await rechne(p.page, { ...BASIS, simCFMint: 200 });
  const weit = await rechne(p.page, { ...BASIS, simCFMint: 300 });
  assert(weit.hp >= eng.hp,
    'Mehr Durchsatz gab weniger Leistung: ' + eng.hp + ' -> ' + weit.hp);
  await p.close();
});

await test('Eine laengere Nockenwelle verschiebt die Drehmomentspitze nach oben', async () => {
  const p = await oeffne();
  const kurz = await rechne(p.page, { ...BASIS, simDurInt: 210, simDurExh: 216 });
  const lang = await rechne(p.page, { ...BASIS, simDurInt: 250, simDurExh: 256 });
  assert(lang.tqRpm > kurz.tqRpm,
    'Drehmomentspitze wanderte nicht nach oben: ' + kurz.tqRpm + ' -> ' + lang.tqRpm);
  await p.close();
});

await test('Schlechterer Wirkungsgrad ergibt weniger Leistung', async () => {
  const p = await oeffne();
  const gut = await rechne(p.page, { ...BASIS, simMechEff: 90 });
  const schlecht = await rechne(p.page, { ...BASIS, simMechEff: 75 });
  assert(schlecht.hp < gut.hp,
    'Schlechterer Wirkungsgrad gab nicht weniger: ' + gut.hp + ' -> ' + schlecht.hp);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Keine Ausgabe von NaN');

await test('Leere Felder erzeugen kein NaN in der Anzeige', async () => {
  // Wer ein Feld leert, um es neu zu tippen, darf nicht "NaN BHP" lesen.
  const p = await oeffne();
  const r = await rechne(p.page, {
    ...BASIS, simBore: '', simStroke: '', simCFMint: '', simDurInt: ''
  });
  for (const [was, text] of [['Leistung', r.hpText], ['Drehmoment', r.tqText],
                             ['Umrechnung', r.convText]]) {
    assert(!/NaN|Infinity|undefined/.test(text), was + ' zeigt: ' + text);
  }
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Nullwerte erzeugen kein NaN in der Anzeige', async () => {
  const p = await oeffne();
  const r = await rechne(p.page, { ...BASIS, simBore: 0, simStroke: 0, simCR: 0 });
  for (const [was, text] of [['Leistung', r.hpText], ['Drehmoment', r.tqText],
                             ['Umrechnung', r.convText]]) {
    assert(!/NaN|Infinity|undefined/.test(text), was + ' zeigt: ' + text);
  }
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Das Ergebnis bleibt als Schaetzung gekennzeichnet');

await test('Beide Ergebniskaesten sind als geschaetzt ueberschrieben', async () => {
  // Regel 5: kein Sollwert ohne Quelle. Die Koeffizienten des Modells sind
  // Erfahrungswerte - die Zahl darf nicht wie ein Messwert dastehen.
  const p = await oeffne();
  const r = await p.page.evaluate(() => {
    const kasten = (id) => document.getElementById(id).parentElement.textContent;
    return { hp: kasten('simPeakHP'), tq: kasten('simPeakTQ') };
  });
  assert(/Gesch|Schaetz|Sch&auml;tz|Schätz|~|ca\./.test(r.hp),
    'Leistungskasten ohne Schaetzungs-Hinweis: ' + r.hp.replace(/\s+/g, ' ').trim());
  assert(/Gesch|Schaetz|Sch&auml;tz|Schätz|~|ca\./.test(r.tq),
    'Drehmomentkasten ohne Schaetzungs-Hinweis: ' + r.tq.replace(/\s+/g, ' ').trim());
  await p.close();
});

await test('Der Simulator sagt, was er nicht ist', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  assert(/Planungswerkzeug/.test(html), 'Einordnung als Planungswerkzeug fehlt');
  assert(/kein Rundenzeitrechner/.test(html), 'Abgrenzung zum Rundenzeitrechner fehlt');
});

await test('Der Kalibrierungs-Kommentar behauptet keine Validierung', async () => {
  // Zitiert wird ein einziger Datenpunkt. Eine Gerade mit zwei freien
  // Parametern laesst sich damit festlegen, nicht bestaetigen.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  assert(!/validated against/.test(html),
    'Kommentar behauptet wieder eine Validierung aus einem Datenpunkt');
  assert(/An einem Punkt kalibriert/.test(html), 'Die ehrliche Einordnung fehlt');
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
