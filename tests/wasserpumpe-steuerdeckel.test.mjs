// Tests gegen die Befunde vom 2026-10-26: Wasserpumpe, Steuerdeckel, Timing
// Pointer, Kopfstehbolzen.
//
// Hintergrund: Die Seite wurde aus Notion-Angaben erstellt, ohne dass die Werte
// gegen Herstellerunterlagen geprueft wurden. Dabei standen mehrere Dinge
// nebeneinander, die nicht nebeneinander stehen koennen:
//
//  - Die Milodon 16230 war als gesetzte Pumpe gefuehrt. Ihre Stutzen sind
//    eingegossen, der nicht benoetigte Heizungsanschluss laesst sich damit
//    nicht sauber verschliessen - sie passt zu diesem Aufbau nicht.
//  - Der Build Log nannte fuer die Kopfstehbolzen 7/16"-14, die
//    Spezifikationen 1/2-13 UNC. Ford schreibt fuer den M-6010-BOSS302
//    1/2-13 UNC vor. Es ist das Teil, bei dem ein zu langer Bolzen im
//    Sackloch den Block sprengt.
//  - Deckelschrauben-Drehmoment (12-18 ft-lbs) und Wasserpumpen-Drehmoment
//    (15-22 ft-lbs) standen als Sollwerte da, ohne dass eine Quelle sie
//    traegt.
//  - Die zwei unteren Deckelschrauben sind beim BOSS-Block 3/8-16 UNC statt
//    5/16-18. Diese Ford-Angabe stand nirgends, obwohl ein Nachmarkt-Deckel
//    fuer Serienbloecke dort zu kleine Durchgangsloecher hat.
//
// Lokal: node tests/wasserpumpe-steuerdeckel.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

function lies(f) { return fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'); }

const specs = lies('specs.html');
const buildlog = lies('build-log.html');
const index = lies('index.html');

try {

// ---------------------------------------------------------------------------
suite('Wasserpumpe: Milodon ist keine gesetzte Wahl mehr');

await test('Keine Seite fuehrt die Milodon 16230 noch als verbaute Pumpe', async () => {
  for (const [name, h] of [['specs.html', specs], ['build-log.html', buildlog], ['index.html', index]]) {
    const treffer = h.match(/Milodon[^<]{0,40}16230/g) || [];
    // Erwaehnung im Verwerfungs-Hinweis ist erlaubt, eine Fuehrung als
    // Komponente nicht.
    for (const t of treffer) {
      const i = h.indexOf(t);
      const umfeld = h.slice(Math.max(0, i - 400), i + 200);
      assert(/entf&auml;llt|entfaellt|nicht mehr|verworfen/i.test(umfeld),
        name + ': Milodon 16230 steht ohne Verwerfungs-Hinweis da (' + t + ')');
    }
  }
});

await test('Der Grund fuer die Verwerfung steht da, nicht nur die Tatsache', async () => {
  const i = specs.indexOf('Milodon 16230 entf');
  assert(i > 0, 'Der Verwerfungs-Hinweis fehlt in specs.html');
  const kasten = specs.slice(i, i + 700);
  assert(/eingegossen/.test(kasten),
    'Der Grund (eingegossene Stutzen) fehlt - ohne ihn waere die Entscheidung spaeter nicht nachvollziehbar');
});

await test('Die Einlassseite steht als Zylinderbank da, nicht als Fahrzeugseite', async () => {
  const i = specs.indexOf('Einlass &ndash; Seite');
  assert(i > 0, 'Die Zeile zur Einlassseite fehlt');
  const zeile = specs.slice(i, i + 700);
  assert(/Zylinder 1&ndash;4|Zylinder 1-4/.test(zeile),
    'Die Einlassseite ist nicht als Zylinderbank angegeben');
  assert(!/Passenger Side Inlet/.test(zeile),
    'Die Zeile nennt weiter eine Fahrzeugseite - die US-Katalogbegriffe gelten fuer Frontmotor im Linkslenker');
});

// ---------------------------------------------------------------------------
suite('Steuerdeckel: BOSS-spezifische Schrauben');

await test('Die zwei unteren 3/8-16-Schrauben stehen mit Ford-Quelle da', async () => {
  const i = specs.indexOf('Untere Schrauben');
  assert(i > 0, 'Die Zeile zu den unteren Deckelschrauben fehlt');
  const zeile = specs.slice(i, i + 800);
  assert(/3\/8-16 UNC/.test(zeile), 'Die Gewindegroesse 3/8-16 UNC fehlt');
  assert(/src-link doc/.test(zeile), 'Die Angabe traegt keine belegte Quelle');
  assert(/boss302/i.test(zeile), 'Die Quelle verweist nicht auf das BOSS-Blockdatenblatt');
});

await test('Der Build Log warnt vor zu kleinen Durchgangsloechern im Nachmarkt-Deckel', async () => {
  const i = buildlog.indexOf('p3_timing_cover');
  assert(i > 0, 'Der Timing-Cover-Schritt fehlt');
  const schritt = buildlog.slice(i, i + 9000);
  assert(/3\/8-16 UNC/.test(schritt), 'Die BOSS-Besonderheit steht nicht im Montageschritt');
});

// ---------------------------------------------------------------------------
suite('Kopfstehbolzen: ein Gewinde, nicht zwei');

await test('Die 7/16-Angabe ist aus dem Build Log verschwunden', async () => {
  const i = buildlog.indexOf('p1_arp_length');
  assert(i > 0, 'Der Stehbolzen-Schritt fehlt');
  const schritt = buildlog.slice(i, i + 6000);
  assert(!/7\/16&quot;-14 block side/.test(schritt),
    'Der Build Log nennt weiter 7/16"-14 - Ford schreibt fuer den BOSS-Block 1/2-13 UNC vor');
  assert(/1\/2-13 UNC/.test(schritt), 'Die Ford-Vorgabe 1/2-13 UNC fehlt');
});

await test('Die Stehbolzenlaengen sind als offen gekennzeichnet, nicht als Sollwert', async () => {
  const i = buildlog.indexOf('Long Studs');
  assert(i > 0, 'Die Laengenzeile fehlt');
  const block = buildlog.slice(i, i + 600);
  assert(!/6\.800&quot; \(172\.72 mm\)/.test(block),
    'Die Laenge 6.800" steht weiter als Sollwert da, obwohl keine Quelle sie traegt');
  assert(/offen/i.test(block), 'Die Laengen sind nicht als offen gekennzeichnet');
});

// ---------------------------------------------------------------------------
suite('Entfernte Sollwerte ohne Quelle');

await test('Das Deckelschrauben-Drehmoment steht nicht mehr als Zahl da', async () => {
  for (const [name, h] of [['specs.html', specs], ['build-log.html', buildlog]]) {
    assert(!/12&ndash;18 ft-lbs/.test(h),
      name + ': 12-18 ft-lbs fuer die Deckelschrauben steht weiter da - keine Quelle nennt diesen Wert');
  }
});

await test('Das Wasserpumpen-Drehmoment steht nicht mehr als Zahl da', async () => {
  // Nur im Wasserpumpen-Abschnitt pruefen: 15-22 ft-lbs ist anderswo der
  // belegte Zuendkerzen-Wert und dort richtig.
  const i = specs.indexOf('Wasserpumpe &ndash; Edelbrock Victor');
  assert(i > 0, 'Der Wasserpumpen-Abschnitt fehlt in specs.html');
  assert(!/15&ndash;22 ft-lbs/.test(specs.slice(i, i + 6000)),
    'specs.html: 15-22 ft-lbs fuer die Wasserpumpe steht weiter da');

  const j = buildlog.indexOf('p3_waterpump');
  assert(j > 0, 'Der Wasserpumpen-Schritt fehlt im Build Log');
  assert(!/15&ndash;22 ft-lbs/.test(buildlog.slice(j, j + 6000)),
    'build-log.html: 15-22 ft-lbs fuer die Wasserpumpe steht weiter da');
});

await test('Die Balancer-Zentralschraube traegt den belegten Ford-Wert', async () => {
  assert(!/70&ndash;90 ft-lbs/.test(specs),
    'Der unbelegte Wert 70-90 ft-lbs steht weiter da');
  const i = specs.indexOf('Drehmoment Zentralschraube');
  assert(i > 0, 'Die Zeile fehlt');
  const zeile = specs.slice(i, i + 700);
  assert(/95 ft-lbs/.test(zeile), 'Der Ford-Wert 95 lb-ft fehlt');
  assert(/src-link doc/.test(zeile), 'Der Wert traegt keine belegte Quelle');
  assert(/ARP/.test(zeile),
    'Der Vorbehalt fehlt, dass der Wert fuer die Ford-Schraube gilt und nicht fuer eine ARP');
});

// ---------------------------------------------------------------------------
suite('Timing Pointer');

await test('Der Pointer steht als eigene, offene Position da', async () => {
  const i = specs.indexOf('Timing Pointer (Z&uuml;ndmarken-Zeiger)');
  assert(i > 0, 'Der Timing-Pointer-Abschnitt fehlt');
  const block = specs.slice(i, i + 6000);
  assert(/im Lieferumfang/.test(block),
    'Dass der Pointer bei keinem Deckel mitgeliefert wird, steht nirgends');
  assert(/M-6059-D351/.test(block) && /4250/.test(block),
    'Es steht nicht da, dass das fuer beide Deckel gilt - Ford wie Edelbrock');
  assert(/OFFEN/.test(block), 'Die offenen Punkte sind nicht als offen gekennzeichnet');
});

await test('Der Balancer-Durchmesser ist als zu messen gekennzeichnet', async () => {
  const i = specs.indexOf('Au&szlig;endurchmesser');
  assert(i > 0, 'Die Zeile zum Balancer-Durchmesser fehlt');
  const zeile = specs.slice(i, i + 600);
  assert(/messen/i.test(zeile),
    'Der Durchmesser ist nicht als zu messen gekennzeichnet - ohne ihn ist kein Pointer auswaehlbar');
});

await test('Der Pflichtpunkt Zugang zur Zuendeinstellung steht im Build Log', async () => {
  const i = buildlog.indexOf('Zugang zur Z&uuml;ndeinstellung');
  assert(i > 0, 'Der Pflichtpunkt fehlt');
  const kasten = buildlog.slice(i, i + 1200);
  assert(/vor dem Motoreinbau|Pflicht vor dem Motoreinbau/i.test(buildlog.slice(Math.max(0, i - 200), i + 400)),
    'Dass der Punkt vor den Motoreinbau gehoert, steht nicht da');
  assert(/Kolbenstopp|echten OT/.test(kasten),
    'Die Kontrolle gegen echten OT fehlt');
});

} finally {
  process.exit(summary());
}
