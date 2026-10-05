// Tests fuer die Unterscheidung Herstellerangabe / gemessener Wert.
//
// Das Problem: die Eingaben des Verdichtungsrechners waren Zahlen ohne
// Herkunft. Neben dem Muldenfeld stand fest verdrahtet "6.5 cc angenommen -
// nicht gemessen". Traegt jemand einen ausgeliterten Wert ein, bleibt diese
// Beschriftung stehen und wird zur Falschaussage. Umgekehrt haette ein
// Entfernen der Kennzeichnung ungemessene Werte als gesichert dargestellt.
//
// Kennzeichnung und Wert muessen demselben Speicher folgen. Das pruefen
// diese Tests - in beide Richtungen.
//
// Lokal: node tests/messwerte.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, assertEqual, summary
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
  await page.waitForFunction(() => typeof Messwerte !== 'undefined', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

suite('Jede Eingabe traegt ihre Herkunft');

await test('Alle sieben Eingaben haben einen Statusschalter', async () => {
  const p = await oeffne('index.html');
  const r = await p.page.evaluate(() => {
    const fehlt = Messwerte.EINGABEN
      .filter((e) => !document.querySelector('[data-field="' + e.feld + '_gemessen"]'))
      .map((e) => e.feld);
    return { fehlt, anzahl: document.querySelectorAll('[data-field$="_gemessen"]').length };
  });
  assertEqual(r.fehlt, [], 'Eingaben ohne Statusschalter');
  assertEqual(r.anzahl, 7, 'Anzahl der Schalter');
  assertEqual(p.errors, [], 'Seitenfehler');
  await p.close();
});

await test('Ohne Eintrag im Speicher gilt ein Wert als nicht gemessen', async () => {
  // Die sichere Richtung: lieber eine Schaetzung als solche ausweisen, als
  // eine ungepruefte Zahl als Messwert.
  //
  // Geprueft wird auf specs.html, weil es dort KEINE Statusschalter gibt.
  // Auf index.html wuerde istGemessen() die Checkbox lesen und der
  // Speicher-Rueckfall nie zum Zug kommen - der Test koennte dann nicht
  // rot werden, egal was im Speicher steht.
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    const ohneSchalter = document.querySelectorAll('[data-field$="_gemessen"]').length;
    // Altbestand: Werte da, Statusfelder fehlen
    localStorage.setItem('engineBuildLog', JSON.stringify({
      cr_piston: '6.5', cr_deck: '0.010', _savedAt: new Date().toISOString()
    }));
    return {
      ohneSchalter,
      status: Messwerte.EINGABEN.map((e) => Messwerte.istGemessen(e.feld))
    };
  });
  assertEqual(r.ohneSchalter, 0, 'Testannahme: specs.html hat keine Statusschalter');
  assert(r.status.every((x) => x === false),
    'Ein Wert ohne Statusfeld galt als gemessen: ' + JSON.stringify(r.status));
  await p.close();
});

suite('Die Kennzeichnung folgt dem Wert, nicht dem Markup');

await test('Ein gemessener Wert wird nicht mehr als Annahme beschriftet', async () => {
  const p = await oeffne('index.html');
  const r = await p.page.evaluate(() => {
    const label = () => document.querySelector('[data-spiegel-status="cr_piston"]').textContent;
    const vorher = label();
    document.querySelector('[data-field="cr_piston_gemessen"]').checked = true;
    document.getElementById('crPiston').value = '4.1';
    messwerteAnzeigen(); calcCR();
    return { vorher, nachher: label(), cr: document.getElementById('crResult').textContent };
  });
  assert(/nicht gemessen/.test(r.vorher), 'Ausgangszustand war nicht "nicht gemessen": ' + r.vorher);
  assertEqual(r.nachher, 'gemessen', 'Das Feldlabel folgt dem Schalter nicht');
  assert(parseFloat(r.cr) > 9.3, 'Der geaenderte Wert wirkte sich nicht auf die CR aus: ' + r.cr);
  await p.close();
});

await test('Das Markup enthaelt keine fest verdrahtete Herkunftsangabe mehr', async () => {
  // Gegenprobe gegen einen Rueckfall: stuende die Beschriftung wieder im
  // HTML, waere sie wieder vom Wert entkoppelt.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  const i = html.indexOf('Kolbenmulde / Valve Reliefs (cc)');
  assert(i > 0, 'Das Muldenfeld fehlt');
  const label = html.slice(i, html.indexOf('</label>', i));
  assert(!/angenommen|nicht gemessen|6\.5 cc/.test(label),
    'Die Herkunft steht wieder fest im Label: ' + label);
});

suite('Das Ergebnis sagt, worauf es beruht');

await test('Es nennt Anzahl und Namen der ungemessenen Eingaben', async () => {
  const p = await oeffne('index.html');
  const t = await p.page.evaluate(() => {
    document.querySelectorAll('[data-field$="_gemessen"]').forEach((c) => { c.checked = false; });
    messwerteAnzeigen();
    return document.getElementById('crHerkunft').textContent;
  });
  assert(/7 von 7/.test(t), 'Die Anzahl fehlt: ' + t);
  assert(/Kolbenmulde/.test(t), 'Die Namen fehlen: ' + t);
  await p.close();
});

await test('Sind alle gemessen, verschwindet der Schaetzungs-Hinweis', async () => {
  const p = await oeffne('index.html');
  const t = await p.page.evaluate(() => {
    document.querySelectorAll('[data-field$="_gemessen"]').forEach((c) => { c.checked = true; });
    messwerteAnzeigen();
    return document.getElementById('crHerkunft').textContent;
  });
  assert(!/Schätzung/.test(t), 'Es steht weiter "Schaetzung" da: ' + t);
  assert(/gemessenen Werten/.test(t), 'Die Bestaetigung fehlt: ' + t);
  await p.close();
});

suite('specs.html wiederholt die Zahlen nicht mehr');

await test('Mulde und Piston-to-Deck werden gespiegelt, nicht abgeschrieben', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
  for (const feld of ['cr_piston', 'cr_deck']) {
    assert(html.includes('data-spiegel="' + feld + '"'), feld + ': kein Spiegel-Platzhalter');
    assert(html.includes('data-spiegel-status="' + feld + '"'), feld + ': kein Status-Platzhalter');
  }
  assert(!/6\.5 cc &ndash; angenommen, nicht gemessen/.test(html),
    'Die alte feste Beschriftung steht wieder da');
});

await test('Ein geaenderter Wert erscheint in specs.html', async () => {
  const p = await oeffne('specs.html');
  const r = await p.page.evaluate(() => {
    localStorage.setItem('engineBuildLog', JSON.stringify({
      cr_piston: '4.1', cr_piston_gemessen: true, _savedAt: new Date().toISOString()
    }));
    Messwerte.spiegeln();
    return {
      wert: document.querySelector('[data-spiegel="cr_piston"]').textContent,
      status: document.querySelector('[data-spiegel-status="cr_piston"]').textContent
    };
  });
  assertEqual(r.wert, '4.1', 'specs.html zeigt weiter den alten Wert');
  assertEqual(r.status, 'gemessen', 'specs.html zeigt weiter den alten Status');
  await p.close();
});

suite('Die Seiten bleiben heil');

await test('index.html und specs.html laden ohne Page-Errors', async () => {
  for (const datei of ['index.html', 'specs.html']) {
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
