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


// ==== VERDICHTUNG UND KOPF-AUSWAHL ====
//
// Hintergrund: die Kopf-Auswahl hatte eine zweite, eigene CR-Formel, in der
// die Kolbenmulde abgezogen statt addiert wurde. Jeder angezeigte Wert lag
// dadurch 1.4 bis 2.0 Punkte zu hoch, und ueber simCR lief der Fehler weiter
// in Leistungsschaetzung und Oktanempfehlung.
//
// Die Mulde vergroessert den Brennraum - mehr Restvolumen, weniger
// Verdichtung. Das steht so auch im Hinweistext von Kapitel 4.

const CC = 16.387064;

// Unabhaengig vom Seitencode nachgerechnet. Waere das hier aus index.html
// importiert, pruefte der Test die Formel gegen sich selbst.
function crErwartet({ bore, stroke, chamber, gasketT, gasketB, deck, dish }) {
  const swept = (Math.PI / 4) * bore * bore * stroke * CC;
  const rest = chamber
    + (Math.PI / 4) * gasketB * gasketB * gasketT * CC
    + (Math.PI / 4) * bore * bore * deck * CC
    + dish;
  return (swept + rest) / rest;
}

// Setzt Kapitel 4 auf bekannte Werte und waehlt einen Kopf.
async function kopfWaehlen(page, headId, felder = {}) {
  return page.evaluate(({ headId, felder }) => {
    const basis = { crBore: 4.000, crStroke: 3.000, crChamber: 58, crGasket: 0.040,
                    crGasketBore: 4.160, crDeck: 0.010, crPiston: 6.5 };
    Object.assign(basis, felder);
    Object.keys(basis).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = String(basis[id]);
    });
    calcCR();
    const sel = document.getElementById('headPreset');
    sel.value = headId;
    applyHeadPreset();
    const kopf = HEAD_PRESETS.find((x) => x.id === headId);
    const m = /CR mit diesem Kopf \([\d.]+cc\): ([\d.]+):1/
      .exec(document.getElementById('headPresetNote').textContent);
    return {
      chamber: kopf.chamber,
      angezeigt: m ? parseFloat(m[1]) : null,
      simCR: parseFloat(document.getElementById('simCR').value),
      kapitel4: parseFloat(document.getElementById('crResult').textContent)
    };
  }, { headId, felder });
}

const CR_BASIS = { bore: 4.000, stroke: 3.000, gasketT: 0.040, gasketB: 4.160, deck: 0.010, dish: 6.5 };

await test('Jeder Kopf zeigt die CR, die sich aus seinem Brennraum ergibt', async () => {
  const p = await oeffne();
  const koepfe = await p.page.evaluate(() => HEAD_PRESETS.map((h) => h.id));
  assert(koepfe.length >= 5, 'zu wenige Kopf-Presets fuer einen sinnvollen Test');
  for (const id of koepfe) {
    const r = await kopfWaehlen(p.page, id);
    assert(r.angezeigt !== null, id + ': keine CR im Hinweistext');
    const soll = crErwartet({ ...CR_BASIS, chamber: r.chamber });
    assert(Math.abs(r.angezeigt - soll) < 0.02,
      id + ' (' + r.chamber + 'cc): angezeigt ' + r.angezeigt.toFixed(2)
      + ', richtig waere ' + soll.toFixed(2));
  }
  assertEqual(p.errors, [], 'Seitenfehler');
  await p.close();
});

await test('Die Kolbenmulde senkt die Verdichtung, sie hebt sie nicht', async () => {
  // Der eigentliche Vorzeichenfehler. Ohne Bezug auf eine Formel geprueft:
  // mehr Mulde = mehr Restvolumen = weniger Verdichtung.
  const p = await oeffne();
  const ohne = await kopfWaehlen(p.page, 'tfs_tw170_cnc', { crPiston: 0 });
  const mit  = await kopfWaehlen(p.page, 'tfs_tw170_cnc', { crPiston: 12 });
  assert(mit.angezeigt < ohne.angezeigt - 0.5,
    'Mulde 12cc ergibt ' + mit.angezeigt + ', Mulde 0cc ergibt ' + ohne.angezeigt
    + ' - die Mulde wird nicht als zusaetzliches Volumen gerechnet');
  await p.close();
});

await test('Ein groesserer Brennraum ergibt eine kleinere Verdichtung', async () => {
  const p = await oeffne();
  const klein = await kopfWaehlen(p.page, 'tfs_tw170_cnc');   // 53cc
  const gross = await kopfWaehlen(p.page, 'ford_x2');         // 64cc
  assert(gross.chamber > klein.chamber, 'Testannahme zu den Brennraeumen stimmt nicht');
  assert(gross.angezeigt < klein.angezeigt,
    gross.chamber + 'cc ergibt ' + gross.angezeigt + ', '
    + klein.chamber + 'cc ergibt ' + klein.angezeigt);
  await p.close();
});

await test('Der Simulator rechnet mit der CR, die danebensteht', async () => {
  const p = await oeffne();
  for (const id of ['ford_x2', 'tfs_tw170_cnc', 'edelbrock_rpm']) {
    const r = await kopfWaehlen(p.page, id);
    assert(Math.abs(r.simCR - r.angezeigt) <= 0.05,
      id + ': Hinweis sagt ' + r.angezeigt + ', Simulator rechnet mit ' + r.simCR);
  }
  await p.close();
});

await test('Zurueck zum verbauten Kopf holt auch die CR zurueck', async () => {
  // Frueher blieb die CR des zuletzt gewaehlten Fremdkopfes im Simulator
  // stehen, weil sie nur bei abweichendem Brennraum ueberhaupt gesetzt wurde.
  const p = await oeffne();
  const fremd = await kopfWaehlen(p.page, 'ford_x2');
  const zurueck = await kopfWaehlen(p.page, 'afr165_1399');
  assert(Math.abs(zurueck.simCR - fremd.simCR) > 0.3,
    'Die CR des Fremdkopfes (' + fremd.simCR + ') steht noch im Simulator');
  assert(Math.abs(zurueck.simCR - zurueck.kapitel4) <= 0.05,
    'Verbauter Kopf: Simulator ' + zurueck.simCR + ', Kapitel 4 ' + zurueck.kapitel4);
  await p.close();
});

await test('Eine Aenderung in Kapitel 4 wirft das Planspiel nicht um', async () => {
  // calcCR ruft simPullData, und das hat frueher die CR des gewaehlten Kopfes
  // stillschweigend durch die des verbauten ersetzt - bei unveraendertem
  // Dropdown. Regel 8 verlangt das Nachziehen, nicht das Zuruecksetzen.
  const p = await oeffne();
  const vorher = await kopfWaehlen(p.page, 'ford_x2');
  const nachher = await p.page.evaluate(() => {
    document.getElementById('crDeck').value = '0.020';
    calcCR();
    return {
      simCR: parseFloat(document.getElementById('simCR').value),
      auswahl: document.getElementById('headPreset').value
    };
  });
  assertEqual(nachher.auswahl, 'ford_x2', 'Kopf-Auswahl veraendert');
  const soll = crErwartet({ ...CR_BASIS, chamber: vorher.chamber, deck: 0.020 });
  assert(Math.abs(nachher.simCR - soll) < 0.06,
    'Nach der Deck-Aenderung rechnet der Simulator mit ' + nachher.simCR
    + ', zum gewaehlten Kopf gehoeren ' + soll.toFixed(2));
  await p.close();
});

await test('Es gibt nur noch eine Verdichtungsformel im Quelltext', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  const treffer = html.match(/=\s*[\w.]*chamber\s*\+\s*gasketVol\s*\+\s*deckVol\s*[+-]\s*[\w.]+/g) || [];
  assert(treffer.length === 1,
    'Restvolumen wird an ' + treffer.length + ' Stellen gebildet: ' + treffer.join(' | '));
  assert(!/-\s*piston\b/.test(html), 'Die Kolbenmulde wird irgendwo wieder abgezogen');
});


// ==== EHRLICHE KENNZEICHNUNG DER KOLBENMULDE ====
//
// Die 6.5 cc sind nicht gemessen und stammen aus keinem Mahle-Datenblatt.
// Die Seite hat sie trotzdem wie eine Herstellerangabe dargestellt, waehrend
// specs.html zwei Zeilen weiter "Datenblatt pruefen" sagte. Regel 5 verlangt,
// dass ein Sollwert ohne Quelle als solcher dasteht.

await test('Die Kolbenmulde steht nicht mehr als Herstellerangabe da', async () => {
  // Bis v95 stand der Hinweis "6.5 cc angenommen - nicht gemessen" fest im
  // Label. Seit v96 kommt die Kennzeichnung aus dem gespeicherten Status,
  // damit sie dem Wert folgt. Die Zusicherung bleibt dieselbe: am Feld muss
  // sichtbar sein, woher der Wert stammt, und die Teilenummer darf nicht als
  // Beleg auftreten.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  const i = html.indexOf('Kolbenmulde / Valve Reliefs (cc)');
  assert(i > 0, 'Das Muldenfeld fehlt');
  const block = html.slice(i, i + 1200);
  assert(/data-field="cr_piston_gemessen"/.test(block),
    'Am Muldenfeld fehlt der Herkunfts-Schalter');
  assert(/data-spiegel-status="cr_piston"/.test(block),
    'Am Muldenfeld fehlt die Herkunfts-Anzeige');
  assert(!/SBF600000FPF/.test(block),
    'Die Teilenummer steht wieder am Feld, als waere der Wert belegt');
});

await test('Die Seite nennt die Spanne, die aus der offenen Mulde folgt', async () => {
  for (const datei of ['index.html', 'specs.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(/9\.19/.test(html) && /9\.67/.test(html),
      datei + ': die Spanne 9.19 bis 9.67 steht nicht da');
  }
});

await test('specs.html kennzeichnet Mulde und Verdichtung als ungesichert', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
  for (const zeile of ['Kolbenmulde (Dish)', 'Verdichtung mit AFR 58cc']) {
    const i = html.indexOf(zeile);
    assert(i > 0, 'Zeile fehlt: ' + zeile);
    const block = html.slice(i, html.indexOf('</div>', i));
    assert(/src-link unverified/.test(block),
      zeile + ': ohne Unverified-Marker - liest sich wie ein gesicherter Wert');
  }
});

} finally {
  await browser.close();
  server.close();
  process.exit(summary());
}
