// Tests fuer die Kraftstoffsystem-Karte in build-log.html (Phase 4, Kapitel 6).
//
// Hintergrund: die Karte beschrieb bis v31 durchgehend eine mechanische Pumpe
// samt Handhebel, den dieses Auto nicht hat, und forderte 5.5-7.0 psi - einen
// Wert, der vom nicht verbauten Holley-Alternativvergaser stammt. Die DellOrto
// DRLA vertraegt maximal 3.5 psi. Diese Tests halten den tatsaechlichen Aufbau
// fest, damit er nicht wieder zurueckfaellt.
//
// Lokal: node tests/fuel-system.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  startServer, stubGitHub, REPO_ROOT,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

// Die Messfelder, ohne die der Tankbilanz-Test nicht dokumentierbar ist.
const PFLICHTFELDER = [
  'p4_fuel_psi_a', 'p4_fuel_psi_b',
  'p4_fuel_return_tank', 'p4_fuel_bal_time',
  'p4_fuel_bal_a_own', 'p4_fuel_bal_a_other',
  'p4_fuel_bal_b_own', 'p4_fuel_bal_b_other'
];

async function open(file) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  await page.waitForTimeout(800);
  return { ctx, page, errors, close: () => ctx.close() };
}

function kartenText() {
  // Roh aus der Datei lesen: der Guide-Block ist im DOM eingeklappt, und die
  // Sprachumschaltung blendet je nach Zustand eine Haelfte aus.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  const start = html.indexOf('id="p4_fuel_card"');
  assert(start > -1, 'Karte p4_fuel_card nicht gefunden');
  const next = html.indexOf('<!-- 7. Static Ignition Timing', start);
  assert(next > -1, 'Ende der Karte nicht gefunden');
  return html.slice(start, next);
}

try {

// ---------------------------------------------------------------------------
suite('Kraftstoffsystem: der Aufbau, den das Auto wirklich hat');

await test('Keine mechanische Pumpe mehr im gesamten Build Log', async () => {
  // Der Handhebel war der auffaelligste Fehler: den gibt es an einer
  // elektrischen Facet nicht.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  for (const begriff of ['Mechanische Kraftstoffpumpe', 'Mechanical pump', 'Hebel an der Pumpe']) {
    assert(!html.includes(begriff), 'Build Log nennt noch: ' + begriff);
  }
});

await test('Karte nennt zwei elektrische Facet-Pumpen und beide Regler', async () => {
  const txt = kartenText();
  assert(/Facet Red Top 480532/.test(txt), 'Pumpentyp fehlt');
  assert(/elektrisch/.test(txt), 'Hinweis "elektrisch" fehlt');
  assert(/Filter King/.test(txt), 'Filter King fehlt');
  assert(/zwei getrennte Kreise/i.test(txt), 'Zwei-Kreis-Aufbau nicht beschrieben');
});

await test('Obergrenze 3.5 psi steht, der Holley-Wert nicht mehr', async () => {
  const txt = kartenText();
  assert(/3\.5 psi/.test(txt), 'Obergrenze 3.5 psi fehlt');
  assert(!/5\.5&ndash;7\.0 psi/.test(txt) && !/5\.5-7\.0 psi/.test(txt),
    'Karte nennt weiterhin den Holley-Druck 5.5-7.0 psi');
});

await test('Ablesen statt verstellen - die Anlage lief mit ihrer Einstellung', async () => {
  // Die vorhandene Reglereinstellung ist Teil der bewaehrten Baseline. Ein
  // Sollwert, auf den man sie "korrigiert", wuerde sie zerstoeren.
  const txt = kartenText();
  assert(/Ablesen, nicht verstellen/.test(txt), 'Grundregel fehlt');
  // Die Schwelle ist seit v44 als Arbeitsbereich formuliert, weil fuer eine
  // harte 3,5-psi-Grenze keine Dell'Orto-Primaerquelle vorliegt.
  assert(/deutlich &uuml;ber dem Arbeitsbereich/.test(txt), 'Eingriffsschwelle fehlt');
  assert(/2,5&ndash;3,5 psi/.test(txt), 'Arbeitsbereich nicht beziffert');
  assert(/weichen voneinander ab/.test(txt), 'Abweichung der Kreise als Ausloeser fehlt');
});

await test('Vor-Start- und Laufwert werden getrennt erfasst', async () => {
  // Elektrische Pumpen bauen den Druck schon bei stehendem Motor auf - dieser
  // Wert ist gueltig. Was er nicht zeigt, ist das Verhalten unter Durchfluss.
  const txt = kartenText();
  assert(/Z&uuml;ndung an und stehendem Motor/.test(txt),
    'Gueltigkeit der statischen Ablesung nicht benannt');
  assert(/Nach dem Erststart nachpr&uuml;fen/.test(txt), 'Nachpruefung unter Last fehlt');
  for (const f of ['p4_fuel_psi_a', 'p4_fuel_psi_b', 'p4_fuel_psi_a_run', 'p4_fuel_psi_b_run']) {
    assert(txt.includes('data-field="' + f + '"'), 'Feld fehlt: ' + f);
  }
});

await test('Bypass-Charakter des Filter King ist benannt', async () => {
  // Ohne diesen Satz wirkt der gemeinsame Ruecklauf harmlos.
  const txt = kartenText();
  assert(/Bypass-Regler/.test(txt), 'Filter King nicht als Bypass-Regler benannt');
  assert(/R&uuml;cklauf/.test(txt), 'Ruecklauf nicht erwaehnt');
});

// ---------------------------------------------------------------------------
suite('Tankbilanz-Test: dokumentierbar, nicht nur beschrieben');

await test('Karte enthaelt den Tankbilanz-Test', async () => {
  const txt = kartenText();
  assert(/Tankbilanz-Test/.test(txt), 'Tankbilanz-Test fehlt');
});

await test('Alle Messfelder des Tests sind vorhanden', async () => {
  const txt = kartenText();
  for (const feld of PFLICHTFELDER) {
    assert(txt.includes('data-field="' + feld + '"'), 'Messfeld fehlt: ' + feld);
  }
});

await test('Messfelder sind im DOM erreichbar und speichern', async () => {
  // Die Felder muessen am normalen Feld-System haengen, sonst wird der
  // Testlauf zwar durchgefuehrt, aber nirgends festgehalten.
  const p = await open('build-log.html');
  const gefunden = await p.page.evaluate((felder) => felder.map((f) => {
    const el = document.querySelector('[data-field="' + f + '"]');
    return { f, da: !!el, oninput: el ? !!el.getAttribute('oninput') : false };
  }), PFLICHTFELDER);
  for (const g of gefunden) {
    assert(g.da, 'Feld nicht im DOM: ' + g.f);
    assert(g.oninput, 'Feld speichert nicht (kein oninput): ' + g.f);
  }
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Zylinderzuordnung der DellOrto');

await test('Ein Vergaser versorgt zwei Zylinder, eine Drosselklappe einen', async () => {
  // Stand vorher in beiden Sprachen falsch und widersprach sich dabei selbst:
  // "jeder Vergaser versorgt 4 Zylinder" gegen "each barrel feeds 4 cylinders".
  // Die verwaiste build-log-phase4.html wurde in v45 geloescht - sie war per
  // URL erreichbar, aber nirgends verlinkt, und lieferte deshalb ungeprueft
  // laengst korrigierte Aussagen weiter aus.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'build-log.html'), 'utf8');
  assert(!/each barrel feeds 4 cylinders/.test(html), 'englische Fassung weiterhin falsch');
  assert(!/jeder Vergaser versorgt 4 Zylinder/.test(html), 'deutsche Fassung weiterhin falsch');
});

await test('Der verbaute Vergaser wird nirgends DHLA genannt', async () => {
  // Geprueft wird die BEZEICHNUNG unseres Vergasers. DHLA als anderes Modell
  // zu erwaehnen ist zulaessig und noetig - die Faustformeln in Kapitel 27
  // stammen aus einem DHLA-Leitfaden, und genau das muss dort stehen duerfen.
  const falsch = /(Dell.?Orto|DellOrto)\s*DHLA|DHLA\s*4[05]/i;
  for (const datei of ['specs.html', 'index.html', 'build-log.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    const treffer = html.match(falsch);
    assert(!treffer, datei + ' bezeichnet den Vergaser als DHLA: ' + (treffer || [''])[0]);
  }
});

await test('Facet-Druck steht ueberall mit 6-8 psi', async () => {
  // Vorher stand an einer Stelle 7.5 psi - ein Wert, den kein Haendler nennt.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
  assert(!/Facet Red Top liefert 7\.5 psi/.test(html),
    'specs.html nennt weiterhin 7.5 psi');
  assert(/Facet Red Top liefert 6&ndash;8 psi/.test(html),
    'specs.html nennt den belegten Bereich 6-8 psi nicht');
});

suite('Ethanol-Hinweis und Sortentabelle: nur wo sie zutreffen, und nur einmal');

// Bis v97 stand die Sortentabelle zweimal da: statisch in Kapitel 6b und
// dynamisch im Kraftstoffblock des Simulators, jede mit eigener Logik. Seit
// v98 steht sie nur in 6b; der Simulator fuellt nur noch ihre Statusspalte.
// Die Tests lesen darum 6b. Haetten sie weiter den Simulatorblock gelesen,
// waeren sie gruen geworden, weil der den geprueften Text nicht mehr enthaelt.
async function kapitel6b(page, ansaugung) {
  return page.evaluate((a) => {
    document.getElementById('simIntake').value = a;
    runSim();
    return document.getElementById('kap6b').innerText;
  }, ansaugung);
}

async function simulatorBlock(page, ansaugung) {
  return page.evaluate((a) => {
    document.getElementById('simIntake').value = a;
    runSim();
    return document.getElementById('simFuelResult').innerText;
  }, ansaugung);
}

await test('Ein anderer Vergaser bekommt nicht den DellOrto-Hinweis', async () => {
  // Der gemeldete Fehler: die Empfehlung haengte den DellOrto-Hinweis fest an,
  // unabhaengig von der Ansaugung.
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  for (const a of ['single4', 'dual4']) {
    const t = await kapitel6b(p.page, a);
    assert(!/gilt die Regel oben unmittelbar/.test(t),
      a + ': der DellOrto-Zweig steht trotz anderer Ansaugung da');
    assert(/ist hier nicht erfasst/.test(t),
      a + ': der Vorbehalt fuer eine fremde Kraftstoffanlage fehlt');
  }
  await p.close();
});

await test('Beim DellOrto steht der Hinweis weiterhin', async () => {
  // Die Gegenrichtung: wegfallen darf er nur dort, wo er nicht gilt.
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  const t = await kapitel6b(p.page, 'itb');
  assert(/DellOrto DRLA 45 mit Schwimmerkammern/.test(t),
    'Der Bezug auf die verbaute Anlage fehlt');
  assert(/Schwimmerkammern leeren/.test(t), 'Die konkrete Massnahme fehlt');
  await p.close();
});

await test('Die Massnahme steht einmal in Kapitel 6b, nicht viermal', async () => {
  // Vorher: zweimal in fuelNote, einmal in der Tabellenzeile, einmal als
  // Fusszeile. Was immer dasteht, wird irgendwann nicht mehr gelesen.
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  const t = await kapitel6b(p.page, 'itb');
  const n = (t.match(/Schwimmerkammern leeren/g) || []).length;
  assertEqual(n, 1, 'Die Massnahme steht ' + n + ' mal in Kapitel 6b');
  await p.close();
});

await test('E10 wird nur beim DellOrto gesondert bewertet', async () => {
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  const mit = await kapitel6b(p.page, 'itb');
  const ohne = await kapitel6b(p.page, 'single4');
  assert(/Super E10 95 bis 10% nur im Fahrbetrieb/.test(mit.replace(/\s+/g, ' ')),
    'Beim DellOrto fehlt die gesonderte E10-Bewertung');
  assert(/Super E10 95 bis 10% OK/.test(ohne.replace(/\s+/g, ' ')),
    'Ohne DellOrto wird E10 weiter gesondert gesperrt');
  await p.close();
});

await test('Die Sortentabelle steht nicht mehr im Simulatorblock', async () => {
  // Der eigentliche Fehler war nicht der Wortlaut, sondern dass es sie zweimal
  // gab - mit eigener Bewertungslogik je Stelle.
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof runSim === 'function', null, { timeout: 30000 });
  const t = await simulatorBlock(p.page, 'itb');
  assert(!/E-Anteil/.test(t), 'Die Sortentabelle steht wieder im Simulatorblock');
  assert(!/Aral Ultimate/.test(t), 'Die Sortenliste steht wieder im Simulatorblock');
  assert(/Kapitel.?6b/.test(t), 'Der Verweis auf Kapitel 6b fehlt');
  await p.close();
});

await test('Zu wenig Oktan schlaegt die Ethanol-Bewertung', async () => {
  // Reihenfolgefehler der alten Fassung: erst Ethanol, dann Oktan. E10 stand
  // damit auch bei 98 ROZ Bedarf als "nur im Fahrbetrieb" da statt als "NEIN".
  const p = await open('index.html');
  await p.page.waitForFunction(() => typeof fuelTabelleAktualisieren === 'function',
    null, { timeout: 30000 });
  const zeilen = await p.page.evaluate(() => {
    fuelTabelleAktualisieren(98, true);
    return Array.from(document.querySelectorAll('[data-fuel-roz]'))
      .map((z) => z.getAttribute('data-fuel-roz') + ':' + z.textContent);
  });
  assertEqual(zeilen, ['95:NEIN', '95:NEIN', '98:OK', '100:OK', '102:OK'],
    'Die Statusspalte folgt der berechneten Oktanzahl nicht');
  await p.close();
});

await test('Der Kraftstoff-Guide bewertet die generischen Sorten nicht mehr selbst', async () => {
  // Er beantwortet eine andere Frage als 6b: wo man unterwegs tankt, nicht
  // welche Sorte zulaessig ist. Solange er Super E5 und E10 mitbewertet hat,
  // stand dieselbe Frage an zwei Stellen - mit verschiedenen Antworten.
  const specs = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
  const i = specs.indexOf('Kraftstoff-Guide nach Tankketten');
  assert(i > 0, 'Der Guide fehlt');
  const block = specs.slice(i, specs.indexOf('<div class="comp-box', i));
  assert(!/Super E10/.test(block), 'Der Guide bewertet E10 wieder selbst');
  assert(!/Super E5/.test(block), 'Der Guide bewertet Super E5 wieder selbst');
  assert(/Kapitel&nbsp;6b/.test(block), 'Die Abgrenzung zu Kapitel 6b fehlt');
});

suite('Die Seite widerspricht ihrem eigenen Exkurs nicht mehr');

await test('Kein pauschales E10-Verbot mehr - auf keiner der drei Seiten', async () => {
  // docs/exkurs-ethanol.html: "Diese Aussage traegt keine Quelle, und sie ist
  // in dieser Schaerfe nicht haltbar." Solange irgendwo "VERBOTEN" steht,
  // widerspricht die Seite sich selbst.
  //
  // Dieser Test prueft seit v98 alle drei Seiten. v97 hat das Verbot auf
  // index.html getilgt und der Test war gruen - waehrend specs.html es im
  // Kraftstoff-Guide noch fuenfmal behauptet hat.
  for (const datei of ['index.html', 'specs.html', 'build-log.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(!/VERBOTEN/.test(html), datei + ': ein pauschales Verbot steht wieder da');
    assert(!/KEIN E10/.test(html), datei + ': die absolute Formulierung steht wieder da');
  }
});

await test('Die Regel aus dem Exkurs steht auf der Seite', async () => {
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  assert(/stehender/i.test(html), 'Der Kern - stehender Kraftstoff - fehlt');
  assert(/Schwimmerkammern leeren/.test(html), 'Die Massnahme fehlt');
  assert(/exkurs-ethanol\.html/.test(html), 'Der Exkurs ist nicht verlinkt');
});

await test('Die offene Frage zu den Dichtsaetzen bleibt benannt', async () => {
  // Der Exkurs macht die Regel von den Weichteilen abhaengig, und die sind
  // unbekannt. Faellt das weg, liest sich die gelockerte Regel wie eine
  // Freigabe.
  const html = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
  assert(/Dichts&auml;tze|Dichtsaetze|Dichtsätze/.test(html),
    'Die offene Frage nach den Dichtsaetzen fehlt');
  assert(/E10-fest/.test(html), 'Die Bedingung fuer die Regel fehlt');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
