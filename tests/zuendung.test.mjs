// Tests fuer die Zuendanlage: MSD 8479 Verteiler und MSD 6AL Zuendbox.
//
// Hintergrund: Die Dokumentation behauptete an mehreren Stellen, MSD-Verteiler
// haetten keine Unterdruckdose und die gesamte Verstellung liefe elektronisch
// ueber die 6AL. Beides ist falsch. Der verbaute 8479 hat eine Unterdruckdose;
// die 6AL setzt ausschliesslich den Drehzahlbegrenzer und regelt keinen
// Zuendzeitpunkt. Wer dieser Behauptung folgt, sucht die Verstellkurve an der
// falschen Komponente und faehrt den Motor mit einer unbekannten Kurve.
//
// Zweiter Punkt: Sollwerte. Die endgueltige Zuendkurve fuer AFR 165 / XE274HR /
// 98-100 ROZ ist noch nicht festgelegt. Bis dahin darf keine Seite eine
// Gradzahl als unseren Wert fuehren - nur Ist-Felder zum Eintragen.
//
// Lokal: node tests/zuendung.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, summary
} from './helpers.mjs';

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

// Alle Seiten, auch die verwaisten Phasendateien: sie sind per URL erreichbar
// und wuerden die widerlegte Aussage sonst weiter ausliefern.
const ALLE_SEITEN = fs.readdirSync(REPO_ROOT)
  .filter((f) => f.endsWith('.html'))
  .concat(fs.readdirSync(path.join(REPO_ROOT, 'docs'))
    .filter((f) => f.endsWith('.html')).map((f) => 'docs/' + f));

const VERBOTEN = [
  [/(MSD[- ]Verteiler haben keine Unterdruckverstellung|MSD distributors have no vacuum advance)/i,
   'Der verbaute 8479 hat eine Unterdruckdose'],
  [/(gesamte Verstellung elektronisch|all advance is electronic)/i,
   'Die Verstellung sitzt im Verteiler, nicht in der Zuendbox'],
  [/MSD 6AL also has 2-step|6AL hat auch 2-Step/i,
   '2-Step bietet erst die 6AL-2 (6421) bzw. die 7er-Serie'],
];

const { server, base } = await startServer();
const browser = await chromium.launch();

async function felderAuf(file) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/' + file);
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined', null, { timeout: 30000 });
  const felder = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-field]')).map((e) => e.dataset.field));
  await ctx.close();
  return felder;
}

try {

// ---------------------------------------------------------------------------
suite('Widerlegte Aussagen stehen nirgends mehr');

for (const [muster, grund] of VERBOTEN) {
  await test(grund, async () => {
    const treffer = ALLE_SEITEN.filter((f) => muster.test(lies(f)));
    assert(treffer.length === 0, 'Steht noch in: ' + treffer.join(', '));
  });
}

// ---------------------------------------------------------------------------
suite('Und die richtige Aussage steht stattdessen da');

await test('Build-Log: Verstellung sitzt im Verteiler, 6AL nur Drehzahlbegrenzer', async () => {
  const h = lies('build-log.html');
  assert(/Der verbaute MSD 8479 hat eine Unterdruckdose/.test(h),
    'Unterdruckdose nicht als vorhanden benannt');
  assert(/nur den Drehzahlbegrenzer/.test(h),
    'Rolle der 6AL nicht eingegrenzt');
});

await test('specs.html fuehrt den 8479 mit Unterdruckverstellung', async () => {
  const h = lies('specs.html');
  assert(/Unterdruckverstellung<\/span><span class="spec-value"><strong>Ja<\/strong>/.test(h),
    'Unterdruckverstellung nicht als vorhanden gefuehrt');
  assert(/Magnetischer Pickup/.test(h), 'Trigger-Art fehlt');
  assert(/regelt keinen<\/strong> Z&uuml;ndzeitpunkt|keinen<\/strong> Z&uuml;ndzeitpunkt/.test(h),
    'Abgrenzung der 6AL fehlt in den Spezifikationen');
});

// ---------------------------------------------------------------------------
suite('Total Mechanical Timing ist eindeutig definiert');

await test('Build-Log definiert den Begriff mit Messbedingung', async () => {
  const h = lies('build-log.html');
  assert(/Total Mechanical Timing/.test(h), 'Begriff kommt nicht vor');
  // Ohne die Messbedingung ist der Begriff wertlos - genau hier entsteht die
  // Verwechslung mit "Total inklusive Unterdruck".
  assert(/abgezogen(em|er)[^<]{0,40}(verschlossen|Stopfen)/i.test(h),
    'Messbedingung (Unterdruck abgezogen und verschlossen) fehlt');
});

await test('Der Zuendungs-Guide definiert ihn identisch', async () => {
  const h = lies('docs/msd-advance-tuning.html');
  assert(/Initial Timing \+ Mechanical Advance = <strong>Total Mechanical Timing/.test(h),
    'Formel nicht auf Total Mechanical Timing umgestellt');
  assert(/abgezogenem und verschlossenem Unterdruckschlauch/.test(h),
    'Messbedingung fehlt im Guide');
});

// ---------------------------------------------------------------------------
suite('Keine Sollwerte, solange die Kurve nicht festgelegt ist');

await test('Guide fuehrt keine Empfehlungs-Gradzahlen mehr', async () => {
  const h = lies('docs/msd-advance-tuning.html');
  assert(!/Empfehlung START:|Empfehlung NACH EINFAHREN:/.test(h),
    'Empfehlungsbloecke mit konkreten Gradzahlen stehen wieder drin');
  assert(/noch nicht festgelegt/.test(h), 'Hinweis auf die offene Kurve fehlt');
});

// ---------------------------------------------------------------------------
suite('Die Anschlagbuechsen-Zuordnung stammt aus der MSD-Primaerquelle');

// Aufgeloest ueber das MSD-Beiblatt zum Centrifugal Advance Kit PN 8464:
// Rot 28 (kleinste), Silber 25, Gruen 23, Blau 21, Lila 19, Schwarz 18.
// Die kleinste Buechse gibt die groesste Verstellung - beide frueheren
// Projekttabellen hatten das falsch.
const BUECHSEN = [['Rot', '28'], ['Silber', '25'], ['Gr&uuml;n', '23'],
                  ['Blau', '21'], ['Lila', '19'], ['Schwarz', '18']];

await test('Guide fuehrt alle sechs Buechsen mit den MSD-Werten', async () => {
  const h = lies('docs/msd-advance-tuning.html');
  for (const [farbe, grad] of BUECHSEN) {
    const re = new RegExp('<strong>' + farbe + '</strong></td>[\\s\\S]{0,80}?' + grad + '&deg;');
    assert(re.test(h), farbe + ' ' + grad + ' Grad fehlt oder weicht ab');
  }
  assert(/PN 8464/.test(h), 'Quellenangabe zum Beiblatt fehlt');
});

await test('Build-Log fuehrt dieselben sechs Werte', async () => {
  const h = lies('build-log.html');
  for (const [, grad] of BUECHSEN) {
    assert(new RegExp('<td>' + grad + '&deg;</td>').test(h), grad + ' Grad fehlt in der Build-Log-Tabelle');
  }
});

await test('Die falschen Gradwerte stehen nirgends mehr', async () => {
  // Gold gibt es in der MSD-Reihe nicht; 15 Grad und 11 Grad ebenfalls nicht.
  const treffer = ALLE_SEITEN.filter((f) => {
    const h = lies(f);
    return /Gold \(smallest|Gold \(kleinste|<td>15&deg;<\/td>|<td>11&deg;<\/td>/.test(h);
  });
  assert(treffer.length === 0, 'Alte Buechsenwerte stehen noch in: ' + treffer.join(', '));
});

await test('Die Wirkrichtung ist ausgeschrieben', async () => {
  // Der eigentliche Fallstrick: kleinere Buechse = mehr Verstellung. Wer das
  // umgekehrt annimmt, verstellt in die falsche Richtung.
  for (const f of ['build-log.html', 'docs/msd-advance-tuning.html']) {
    const h = lies(f);
    assert(/kleinste[^<]{0,40}gr&ouml;&szlig;te Verstellung|kleinste<\/em>[^<]{0,60}gr&ouml;&szlig;te<\/em>/.test(h),
      f + ': Wirkrichtung nicht benannt');
  }
});

await test('Generische Unterdruckwerte stehen nicht als unser Wert da', async () => {
  for (const f of ['build-log.html', 'index.html', 'docs/msd-advance-tuning.html']) {
    const h = lies(f);
    assert(!/Zus&auml;tzlich <strong>8&ndash;12&deg;<\/strong> bei Teillast/.test(h),
      f + ': generischer Vacuum-Wert weiterhin als Angabe gefuehrt');
  }
});

// ---------------------------------------------------------------------------
suite('Der Ported-Vacuum-Abgriff gilt als offen');

await test('specs.html markiert den Abgriff als zu verifizieren', async () => {
  const h = lies('specs.html');
  assert(/konkreter Anschluss an der DRLA-Anlage <strong>noch zu verifizieren/.test(h),
    'Abgriff nicht als offen gekennzeichnet');
  // Die Checkliste darf den Punkt nicht als erledigt fuehren.
  assert(!/MSD 8479 \+ Ported Vacuum dokumentiert/.test(h),
    'Checkliste fuehrt den Abgriff weiterhin als erledigt');
});

await test('Guide behauptet den DRLA-Abgriff nicht als vorhanden', async () => {
  const h = lies('docs/msd-advance-tuning.html');
  assert(!/Unterdruckanschluss am Vergaserk&ouml;rper vorhanden/.test(h),
    'Abgriff weiterhin als vorhanden behauptet');
  assert(/noch nicht verifiziert/.test(h), 'Offener Status fehlt');
});

// ---------------------------------------------------------------------------
suite('Die 6AL-Teilenummer gilt als unbestaetigt');

await test('Keine Seite fuehrt PN 6420 als gesetzt', async () => {
  const treffer = ALLE_SEITEN.filter((f) => /6AL Z&uuml;ndbox \(PN 6420\)|MSD 6AL Ignition Box \(PN 6420\)/.test(lies(f)));
  assert(treffer.length === 0, 'PN weiterhin als gesichert in: ' + treffer.join(', '));
});

await test('Beide 6AL-Varianten sind beschrieben', async () => {
  const h = lies('build-log.html');
  // Analog wird per Steckmodul eingestellt, digital per Drehschalter. Wer die
  // falsche Variante annimmt, sucht ein Bauteil, das es nicht gibt.
  assert(/Variante A &ndash; analoge 6AL \(PN 6420\)/.test(h), 'Analoge Variante fehlt');
  assert(/Variante B &ndash; Digital 6AL \(PN 6425\)/.test(h), 'Digitale Variante fehlt');
  assert(/zwei versiegelten Drehschalter/.test(h), 'Bedienung der Digital 6AL fehlt');
});

await test('Die Titeluebersetzung zieht mit', async () => {
  // Faellt der Uebersetzungsschluessel auseinander, verschwindet der Eintrag
  // in der englischen Ansicht - derselbe Fehler wie bei der Facet-Pumpe.
  for (const f of ['specs.html', 'index.html', 'build-log.html']) {
    const h = lies(f);
    assert(/'MSD 6AL Z\\u00fcndbox \(Teilenummer offen\)'/.test(h),
      f + ': Uebersetzungsschluessel nicht nachgezogen');
  }
});

// ---------------------------------------------------------------------------
suite('MSD-Vorgaben zur Messung stehen dort, wo gemessen wird');

await test('Kein digitales und kein dial-back Stroboskop', async () => {
  // Die CD-Box feuert unter ~3000 rpm mehrfach. Eine Lampe, die Blitze zaehlt
  // oder zurueckrechnet, zeigt einen falschen Winkel - damit waeren alle
  // Ist-Werte, die wir gerade erst eingefuehrt haben, unbrauchbar.
  for (const f of ['build-log.html', 'docs/msd-advance-tuning.html']) {
    const h = lies(f);
    // Die deutsche Warnung muss stehen - eine Pruefung auf "dial-back" allein
    // wuerde auch dann gruen bleiben, wenn nur noch der englische Text da ist.
    assert(/Kein digitales und kein R&uuml;ckstell-Stroboskop \(dial-back\)/.test(h),
      f + ': deutsche Warnung vor dial-back fehlt');
    assert(/Mehrfachfunken|mehrere Funken|mehrfach je Z&uuml;ndung/i.test(h),
      f + ': Begruendung (Mehrfachfunken) fehlt');
  }
});

await test('Der Einbau der Digital-Box verschiebt den Zuendzeitpunkt', async () => {
  for (const f of ['build-log.html', 'docs/msd-advance-tuning.html']) {
    assert(/timing will be affected/i.test(lies(f)), f + ': MSD-Hinweis fehlt');
  }
});

// ---------------------------------------------------------------------------
suite('Die Zuendbox ist als Digital 6AL bestimmt');

await test('Zwei Drehschalter grenzen die Varianten ein', async () => {
  const h = lies('build-log.html');
  assert(/zwei Drehschalter am Geh&auml;use best&auml;tigt/.test(h), 'Befund nicht dokumentiert');
  assert(/6AL-2 \(6421\) h&auml;tte vier Drehschalter/.test(h), 'Abgrenzung zur 6AL-2 fehlt');
});

await test('Zylinderzahl per Kabelschlaufe, 8 Zylinder ungeschnitten', async () => {
  // Eine geschnittene Schlaufe laesst sich nicht rueckgaengig machen.
  for (const f of ['build-log.html', 'specs.html']) {
    const h = lies(f);
    assert(/Kabelschlaufen/.test(h), f + ': Schlaufen nicht erwaehnt');
    assert(/8 Zylinder = keine Schlaufe geschnitten/.test(h), f + ': Vorgabe fuer 8 Zylinder fehlt');
  }
});

await test('Die Drehschalter-Belegung steht da', async () => {
  const h = lies('build-log.html');
  assert(/linke Schalter die Tausender/.test(h), 'Belegung der Schalter fehlt');
});

// ---------------------------------------------------------------------------
suite('Das Advance Kit 8464 ist richtig eingeordnet');

await test('Das Kit erweitert den Einstellbereich nicht', async () => {
  // Es ist derselbe Satz, der dem Verteiler ohnehin beiliegt. Wer glaubt, das
  // Kit bringe zusaetzliche Moeglichkeiten, aendert womoeglich etwas, bevor der
  // Ist-Zustand aufgenommen ist.
  for (const f of ['specs.html', 'docs/msd-advance-tuning.html']) {
    const h = lies(f);
    assert(/8464/.test(h), f + ': Kit nicht benannt');
    assert(/derselbe Satz/.test(h), f + ': Einordnung des Kits fehlt');
  }
});

// ---------------------------------------------------------------------------
suite('Die Ist-Felder existieren im DOM und sind speicherbar');

const ERWARTET_BUILDLOG = [
  // Ist-Aufnahme vor dem Verteilereinbau
  'p3_dist_pn', 'p3_dist_gear', 'p3_dist_bushing',
  'p3_dist_spring1', 'p3_dist_spring2', 'p3_dist_vac',
  // Ist-Zustand Zuendkurve
  'p4_tim_initial', 'p4_tim_bushing', 'p4_tim_mech',
  'p4_tim_spring1', 'p4_tim_spring2',
  'p4_tim_start_rpm', 'p4_tim_full_rpm', 'p4_tim_total',
  // Ist-Zustand Unterdruckverstellung
  'p4_vac_source', 'p4_vac_start', 'p4_vac_full', 'p4_vac_max', 'p4_vac_status',
  // Zuendbox
  'p4_6al_pn', 'p4_6al_limit',
];

await test('build-log.html enthaelt alle Zuendungs-Ist-Felder', async () => {
  const felder = await felderAuf('build-log.html');
  const fehlend = ERWARTET_BUILDLOG.filter((f) => !felder.includes(f));
  assert(fehlend.length === 0, 'Fehlen im DOM: ' + fehlend.join(', '));
});

await test('Jedes Ist-Feld ist ein beschreibbares Eingabefeld', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined', null, { timeout: 30000 });
  const schlecht = await page.evaluate((keys) => keys.filter((k) => {
    const el = document.querySelector('[data-field="' + k + '"]');
    // contenteditable wird von der Feldsynchronisation nicht gelesen - ein
    // solches Feld saehe bedienbar aus und wuerde nie gespeichert.
    return !el || !(el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
  }), ERWARTET_BUILDLOG);
  await ctx.close();
  assert(schlecht.length === 0, 'Nicht speicherbar: ' + schlecht.join(', '));
});

await test('Ein Zuendungsfeld ueberlebt Speichern und Neuladen', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => dataLoaded === true, null, { timeout: 30000 });
  await page.evaluate(() => {
    const el = document.querySelector('[data-field="p4_tim_initial"]');
    el.value = '14';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof autoSave === 'function') autoSave();
  });
  await page.waitForTimeout(1500);
  const gespeichert = await page.evaluate(() => {
    const roh = localStorage.getItem('engineBuildLog');
    if (!roh) return null;
    try { return JSON.parse(roh).p4_tim_initial; } catch { return null; }
  });
  await ctx.close();
  assert(gespeichert === '14', 'Wert nicht im Speicher angekommen: ' + gespeichert);
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
