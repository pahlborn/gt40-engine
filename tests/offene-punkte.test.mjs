// Tests fuer die Auswirkungs-Hinweise an den offenen Werkstattpunkten.
//
// Hintergrund: Fuenf Punkte koennen nur am Fahrzeug beantwortet werden. Drei
// von ihnen haben Folgen, die man erst merkt, wenn es zu spaet ist:
//
//   - Ein digitales oder Rueckstell-Stroboskop liefert plausible, aber falsche
//     Winkel. Es entwertet rueckwirkend auch die Aufnahme von Buechse und
//     Federn, weil deren Wirkung nur ueber den gemessenen Winkel nachweisbar ist.
//   - Eine durchtrennte Kabelschlaufe an der 6AL laesst die Box fuer sechs
//     Zylinder zuenden - und ist nicht rueckgaengig zu machen.
//   - Der falsche Unterdruckabgriff zieht schon im Leerlauf Fruehzuendung hinzu.
//
// Ohne diese Hinweise an der jeweiligen Stelle traegt jemand einen Wert ein
// und haelt ihn fuer belastbar.
//
// Lokal: node tests/offene-punkte.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  REPO_ROOT, startServer, stubGitHub, suite, test, assert, summary
} from './helpers.mjs';

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }
const BL = () => lies('build-log.html');

const { server, base } = await startServer();
const browser = await chromium.launch();

try {

// ---------------------------------------------------------------------------
suite('Verteiler: die Baseline und das Advance Kit');

await test('Der Hinweis auf die Baseline steht bei den Feldern', async () => {
  const h = BL();
  assert(/Baseline der Z&uuml;ndkurve/.test(h), 'Einordnung als Baseline fehlt');
  assert(/kein Federn- oder Buchsenwechsel mehr r&uuml;cknehmbar/.test(h),
    'Folge (nicht rueckholbar) fehlt');
  // Die Kette bis in die Beduesung: zu wenig Fruehzuendung sieht mager aus.
  assert(/verf&uuml;hrt zur falschen D&uuml;se/.test(h),
    'Auswirkung auf die Beduesung fehlt');
});

await test('Die Verwechslungsgefahr mit dem 8464-Kit ist benannt', async () => {
  // Das Kit enthaelt alle sechs Buechsen und sechs Federn. Landet das
  // ausgebaute Teil darin, ist die Baseline verloren.
  const h = BL();
  assert(/Advance Kit 8464/.test(h), 'Kit nicht erwaehnt');
  assert(/getrennt vom Kit beutelweise beschriften/.test(h),
    'Anweisung zum getrennten Aufbewahren fehlt');
});

// ---------------------------------------------------------------------------
suite('6AL: Teilenummer und Kabelschlaufen');

await test('Die Kabelschlaufen sind erfassbar', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof dataLoaded !== 'undefined', null, { timeout: 30000 });
  const da = await page.evaluate(() => {
    const el = document.querySelector('[data-field="p4_6al_loops"]');
    return el ? el.tagName : null;
  });
  await ctx.close();
  assert(da === 'INPUT', 'Feld p4_6al_loops fehlt oder ist kein Eingabefeld');
});

await test('Die Schlaufen gelten als durch die Betriebsgeschichte beantwortet', async () => {
  // Die Box lief im Fahrzeug auf acht Zylindern. Eine durchtrennte Schlaufe
  // haette die Box fuer sechs zuenden lassen - das waere aufgefallen.
  const h = BL();
  assert(/durch die Betriebsgeschichte beantwortet/.test(h), 'Schlussfolgerung fehlt');
  assert(/z&uuml;ndet die Box f&uuml;r sechs Zylinder|w&uuml;rde die Box f&uuml;r sechs Zylinder z&uuml;nden/.test(h),
    'Begruendung (Fehlerbild bei sechs Zylindern) fehlt');
  assert(/Annahme in eine Beobachtung verwandelt/.test(h),
    'Hinweis auf die billige Sichtpruefung fehlt');
});

await test('Der eingestellte Drehzahlwert bleibt ausdruecklich offen', async () => {
  // Das ist der Punkt, den "sie lief" gerade nicht beantwortet - und der mit
  // der schaerfsten Folge: ein zu hoch gesetzter Begrenzer schuetzt nichts.
  const h = BL();
  assert(/nicht<\/em> beantwortet: bei welcher Drehzahl der Begrenzer steht/.test(h),
    'Abgrenzung gegen die Betriebsgeschichte fehlt');
  assert(/praktisch keinen Schutz/.test(h), 'Folge eines zu hohen Werts fehlt');
  assert(/etwa 6\.500 U\/min her/.test(h), 'Bezug zur Nockenwelle fehlt');
});

await test('Die Teilenummer ist als nicht blockierend eingeordnet', async () => {
  // Zwei Drehschalter genuegen zur Bedienung; die Nummer braucht es nur fuer
  // Ersatzteile. Sie darf die Startfreigabe nicht aufhalten.
  const h = BL();
  assert(/Kein Hindernis f&uuml;r die Startfreigabe/.test(h),
    'Einordnung der Teilenummer fehlt');
  assert(!/l&auml;sst sich der Eintrag in der Startfreigabe \(Kapitel 19\) nicht abschlie&szlig;en/.test(h),
    'Alte, jetzt falsche Blockade-Aussage steht noch da');
});

// ---------------------------------------------------------------------------
suite('Stroboskop: zuerst klaeren, dann messen');

await test('Die rueckwirkende Folge ist benannt', async () => {
  const h = BL();
  assert(/Zuerst kl&auml;ren, dann messen/.test(h), 'Reihenfolge nicht benannt');
  // Der eigentliche Punkt: die Anzeige liefert plausible Zahlen.
  assert(/ohne dass es auff&auml;llt/.test(h), 'Tuecke (plausible Falschwerte) fehlt');
  assert(/entwertet r&uuml;ckwirkend die Aufnahme von Buchse und Federn/.test(h),
    'Rueckwirkung auf die Verteiler-Aufnahme fehlt');
});

// ---------------------------------------------------------------------------
suite('Ported Vacuum: Auswirkung des falschen Abgriffs');

await test('Das Fehlerbild und das Pruefkriterium stehen da', async () => {
  const h = BL();
  assert(/Auswirkung, wenn der falsche Abgriff gew&auml;hlt wird/.test(h), 'Hinweis fehlt');
  assert(/bereits im Stand Fr&uuml;hz&uuml;ndung hinzu/.test(h), 'Fehlerbild fehlt');
  assert(/Pr&uuml;fkriterium:<\/strong> am richtigen Abgriff liegt im Leerlauf <em>kein<\/em>/.test(h),
    'Pruefkriterium fehlt');
  assert(/nicht zuordenbar/.test(h), 'Folge fuer die Messzeilen fehlt');
});

// ---------------------------------------------------------------------------
suite('Dichtsaetze: die Kraftstoffregel haengt davon ab');

await test('Der Zusammenhang zum Ethanol-Exkurs steht dabei', async () => {
  const h = BL();
  assert(/entscheidet die Kraftstoffregel/.test(h), 'Auswirkung nicht benannt');
  assert(/ethanolarm tanken Pflicht/.test(h), 'Konsequenz bei nicht E10-festen Teilen fehlt');
  assert(h.includes('docs/exkurs-ethanol.html'), 'Verweis auf den Exkurs fehlt');
});

// ---------------------------------------------------------------------------
suite('Die Stroboskop-Anforderung steht in jeder Werkzeugliste');

await test('Keine Werkzeugliste nennt die Blitzlampe ohne Einschraenkung', async () => {
  // Die Warnung stand nur in Kapitel 16. Ausgerechnet Kapitel 18, wo die
  // Kurve gemessen wird, listete "Blitzlampe / Stroboskop" ohne Zusatz.
  // Geprueft werden nur Werkzeuglisten - in Arbeitsschritten waere die
  // Wiederholung Ballast, dort genuegt der Verweis.
  const h = BL();
  // An der Ueberschrift festmachen, nicht an der Klasse: "tools" wird auch
  // als reine Stilangabe fuer Nicht-Werkzeugbloecke verwendet.
  const bloecke = [...h.matchAll(/<h4 class="tools">Tools[^<]*<\/h4>[\s\S]*?<\/ul>/g)].map((m) => m[0]);
  assert(bloecke.length > 20, 'Zu wenige Werkzeugbloecke gefunden: ' + bloecke.length);
  const eintraege = [];
  for (const b of bloecke) {
    for (const li of b.match(/<li>[\s\S]*?<\/li>/g) || []) {
      if (/Blitzlampe|Stroboskop|[Tt]iming light/.test(li)) eintraege.push(li);
    }
  }
  assert(eintraege.length >= 3,
    'Erwartet mindestens drei Werkzeugeintraege, gefunden: ' + eintraege.length);
  const ohne = eintraege.filter((z) =>
    !/dial-back|nicht digital|einfache Ausf&uuml;hrung/i.test(z));
  assert(ohne.length === 0,
    'Ohne Einschraenkung: ' + ohne.map((z) => z.replace(/<[^>]+>/g, '').trim().slice(0, 60)).join(' | '));
});

await test('Kapitel 18 nennt die Begruendung, nicht nur die Regel', async () => {
  const h = BL();
  assert(/Einfache Blitzlampe &ndash; nicht digital, nicht dial-back/.test(h),
    'Regel in Kapitel 18 fehlt');
  assert(/Begr&uuml;ndung in Kapitel 16/.test(h), 'Verweis auf die Begruendung fehlt');
});

// ---------------------------------------------------------------------------
suite('Keine Sollwerte mehr in Kapiteltiteln und Reihenfolgen');

await test('Kapitel 18 traegt keinen Gradwert im Titel', async () => {
  // Ein Sollwert in der Ueberschrift steht auch in der Fortschrittsliste und
  // im Inhaltsverzeichnis - prominenter geht es nicht.
  const h = BL();
  assert(!/18\. Final Timing: 34&ndash;36&deg; total advance/.test(h),
    'Alter Titel mit Gradwert steht noch da');
  assert(/18\. Z&uuml;ndkurve messen und eintragen \(Total Mechanical Timing\)/.test(h),
    'Neuer Titel fehlt');
});

await test('Die Abstimmreihenfolge nennt keinen Gradwert', async () => {
  const h = BL();
  assert(!/Gesamtfr&uuml;hz&uuml;ndung 34&ndash;36&deg; festnageln/.test(h),
    'Sollwert in der Reihenfolge steht noch da');
  assert(/Z&uuml;ndkurve festnageln und eintragen/.test(h), 'Ersatzformulierung fehlt');
  // Der Grund fuer die Reihenfolge gehoert dazu.
  assert(/sieht am Lambda aus wie zu mager/.test(h), 'Begruendung der Reihenfolge fehlt');
});

// ---------------------------------------------------------------------------
suite('Schreibweise: Buchse, nicht Buechse');

await test('Die falsche Schreibweise steht nirgends mehr', async () => {
  // Eine Buchse ist das Bauteil, eine Buechse die Dose oder das Gewehr.
  const dateien = fs.readdirSync(REPO_ROOT).filter((f) => /\.(html|js|mjs)$/.test(f))
    .concat(fs.readdirSync(path.join(REPO_ROOT, 'docs')).map((f) => 'docs/' + f))
    .concat(fs.readdirSync(path.join(REPO_ROOT, 'tests')).map((f) => 'tests/' + f))
    .filter((f) => /\.(html|js|mjs)$/.test(f));
  // Das Muster aus Teilen bauen, sonst trifft diese Datei sich selbst.
  const U = 'B' + '&uuml;' + 'chs';
  const muster = new RegExp(U + '|' + U.toLowerCase() + '|B\u00fcchs|b\u00fcchs', 'i');
  const treffer = dateien.filter((f) => muster.test(lies(f)));
  assert(treffer.length === 0, 'Falsche Schreibweise in: ' + treffer.join(', '));
});

await test('Und die richtige steht stattdessen da', async () => {
  const h = BL();
  assert(/Anschlagbuchse/.test(h), 'Anschlagbuchse fehlt');
  assert(/Buchsenkombination/.test(h), 'Buchsenkombination fehlt');
  const g = lies('docs/msd-advance-tuning.html');
  assert(/Anschlagbuchsen/.test(g), 'Guide nennt die Buchsen nicht');
});

// ---------------------------------------------------------------------------
suite('Altlasten in denselben Messwertfeldern');

await test('Keine Sollwert-Platzhalter mehr bei Initial und Total', async () => {
  const h = BL();
  assert(!/data-field="total_timing" placeholder="e\.g\. 34/.test(h),
    'Platzhalter 34 Grad steht noch da');
  assert(!/data-field="initial_timing" placeholder="e\.g\. 12/.test(h),
    'Platzhalter 12 Grad steht noch da');
  assert(/data-field="total_timing" placeholder="gemessen"/.test(h),
    'Total-Feld nicht umgestellt');
});

await test('Die Federbenennung folgt den echten MSD-Typen', async () => {
  // MSD liefert Heavy Silver, Light Blue, Light Silver - kein "Medium".
  const h = BL();
  assert(!/Heavy \+ 1× Medium/.test(h), 'Alte Benennung "Medium" steht noch da');
  assert(/placeholder="z\.B\. 2× Heavy Silver"/.test(h), 'Neue Benennung fehlt');
});

await test('Das Total-Feld nennt die Messbedingung', async () => {
  const h = BL();
  assert(/Total Mechanical Timing \(Unterdruck ab\)/.test(h),
    'Messbedingung fehlt in der Feldbeschriftung');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
