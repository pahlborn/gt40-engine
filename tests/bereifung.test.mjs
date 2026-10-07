// Tests fuer die Bereifung in specs.html, Kapitel 15.
//
// Hintergrund: die Seite hat "A24" und "Crossply" als dieselbe Tatsache
// gefuehrt - Ueberschrift "Avon Historic Crossply", Zeile "Profil: Crossply
// Historic". A24 ist aber eine MISCHUNG, keine Bauart, und Avon fuehrt die
// Historic-Reihe sowohl diagonal als auch radial. Aus dem Mischungscode laesst
// sich die Bauart nicht ableiten.
//
// Das ist nicht nur Begriffspflege: specs.html und index.html leiten aus der
// Bauart den Rollwiderstandsbeiwert (Crr 0.015) und eine V-max-Warnung ab.
// Eine ungepruefte Annahme traegt damit zwei Rechenergebnisse.
//
// Zu den konkreten Groessen 8.5/23.0-15 und 11.0/25.0-15 war kein
// Avon-Dokument beschaffbar (Herstellerseiten JS-gerendert, Haendler-PDFs
// nicht extrahierbar, web.archive.org aus dieser Umgebung nicht erreichbar).
// Darum: kennzeichnen statt behaupten - Regel 5.
//
// Lokal: node tests/bereifung.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, assertEqual, summary } from './helpers.mjs';

const specs = fs.readFileSync(path.join(REPO_ROOT, 'specs.html'), 'utf8');
const index = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf8');
const glossar = fs.readFileSync(path.join(REPO_ROOT, 'glossar.js'), 'utf8');

// Der Reifenblock, vom Titel bis zum Ende seiner comp-box.
function reifenblock() {
  const i = specs.indexOf('Bereifung &ndash; Avon A24 Historic');
  assert(i > 0, 'Der Reifenblock wurde nicht gefunden');
  return specs.slice(i, specs.indexOf('<div class="comp-box', i));
}

try {

suite('Mischung und Bauart sind zwei verschiedene Angaben');

await test('Die Ueberschrift behauptet keine Bauart mehr', async () => {
  assert(!/Bereifung &ndash; Avon Historic Crossply/.test(specs),
    'Die Ueberschrift nennt die Bauart wieder als gesicherte Eigenschaft');
  for (const datei of ['index.html', 'specs.html', 'build-log.html']) {
    const html = fs.readFileSync(path.join(REPO_ROOT, datei), 'utf8');
    assert(!/Avon Historic Crossply/.test(html),
      datei + ': die alte Ueberschrift steht im i18n-Woerterbuch oder im Markup');
  }
});

await test('Mischung und Bauart stehen in getrennten Zeilen', async () => {
  const b = reifenblock();
  assert(/spec-label">Mischung<\/span><span class="spec-value">Avon A24/.test(b),
    'Die Mischung fehlt oder heisst anders');
  assert(/spec-label">Bauart</.test(b), 'Es gibt keine eigene Zeile fuer die Bauart');
  // Der alte Fehler: die Bauart stand unter "Profil". Ein Profil ist das
  // Laufflaechenmuster - bei einem Slick gibt es keines.
  assert(!/spec-label">Profil<\/span><span class="spec-value">Crossply/.test(b),
    'Die Bauart steht wieder als "Profil" da');
});

await test('Die Bauart ist als ungeprueft gekennzeichnet', async () => {
  const b = reifenblock();
  // Nur die Zeile selbst, nicht bis zur naechsten: die Profil-Zeile darunter
  // traegt eine eigene Kennzeichnung und wuerde diesen Test gruen halten,
  // auch wenn die der Bauart verschwindet. Genau das ist beim Gegenpruefen
  // aufgefallen.
  const i = b.indexOf('spec-label">Bauart');
  assert(i > 0, 'Die Bauart-Zeile fehlt');
  const zeile = b.slice(i, b.indexOf('<div class="spec-item"', i));
  assert(/src-link unverified/.test(zeile), 'Regel 5: die Bauart steht ohne Kennzeichnung da');
  assert(/Seitenwand/.test(zeile), 'Es fehlt, woran man die Bauart ablesen kann');
  // Die Profil-Zeile ist eine eigene offene Frage - Slick oder nachgeschnitten.
  const k = b.indexOf('spec-label">Profil');
  const pz = b.slice(k, b.indexOf('<div class="spec-item"', k));
  assert(/src-link unverified/.test(pz), 'Die Ausfuehrung steht ohne Kennzeichnung da');
});

await test('Die Folge fuer die Simulatoren ist benannt', async () => {
  // Ohne diesen Hinweis liest sich die Kennzeichnung wie eine Formalie.
  const b = reifenblock();
  assert(/Crr/.test(b), 'Der Rollwiderstandsbeiwert wird nicht erwaehnt');
  assert(/V-max-Warnung/.test(b), 'Die zweite abhaengige Stelle fehlt');
});

suite('Die abhaengigen Rechenstellen nennen ihre Annahme');

await test('Die V-max-Warnung behauptet die Bauart nicht als Tatsache', async () => {
  for (const [datei, html] of [['specs.html', specs], ['index.html', index]]) {
    assert(!/Avon Crossply-Reifen sind f&uuml;r solche Geschwindigkeiten/.test(html),
      datei + ': die Warnung beruft sich wieder auf eine ungepruefte Bauart');
    assert(/angenommene Grenze ~220 km\/h/.test(html),
      datei + ': die Grenze steht nicht als Annahme da');
  }
});

await test('Der Rollwiderstandsbeiwert nennt die Annahme im Kommentar', async () => {
  assert(/Annahme Diagonalbauart ~0\.015/.test(specs),
    'Der Crr-Kommentar nennt die Bauart weiter als Tatsache');
});

suite('Glossar: A24 ist eine Mischung');

await test('Der Glossareintrag knuepft die Mischung nicht an eine Bauart', async () => {
  assert(!/Historic Racing Compound f&uuml;r Crossply-Reifen/.test(glossar),
    'Der deutsche Eintrag macht aus der Mischung wieder eine Bauart');
  assert(!/Historic Racing Compound for crossply tires/.test(glossar),
    'Der englische Eintrag macht aus der Mischung wieder eine Bauart');
  assert(/Mischung, keine Bauart/.test(glossar), 'Die Klarstellung fehlt (deutsch)');
  assert(/compound, not a construction/.test(glossar), 'Die Klarstellung fehlt (englisch)');
});

suite('Kapitel 15 listet alle Reifensaetze, nicht nur den verbauten');

await test('Die Satzuebersicht nennt mehr als einen Satz', async () => {
  const i = specs.indexOf('Weitere Reifens&auml;tze');
  assert(i > 0, 'Die Satzuebersicht fehlt');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  for (const satz of ['Avon Historic A24', 'Avon Historic Slick', 'Avon Historic Wet',
                      'Avon CR6ZZ A29', 'Michelin Pilot Sport']) {
    assert(b.includes(satz), 'Satz fehlt in der Uebersicht: ' + satz);
  }
  // "Michelin 17" allein genuegt als Nachweis nicht - das steht auch in der
  // Kopfzeile der Gewichtstabelle und blieb gruen, als die Zeile sich aenderte.
  assert(/335\/35-17 \(hinten\)/.test(b), 'Hinterachsmass fehlt');
  assert(/235\/45-17 \(vorn\)/.test(b), 'Vorderachsmass fehlt');
  assert(!/zu best&auml;tigen<\/span><\/td>[\s\S]{0,40}<td[^>]*>Radial/.test(b),
    'Die Masse stehen weiter als unbestaetigt da');
});

await test('Die Abrolldurchmesser stehen mit ihrer Folge da', async () => {
  // Beide Saetze sind nicht austauschbar: hinten +4,9 %, vorn +10,1 %. Das
  // aendert Uebersetzung UND Rake - und faellt sonst erst auf der Strecke auf.
  const i = specs.indexOf('Abrolldurchmesser');
  assert(i > 0, 'Die Durchmessertabelle fehlt');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  for (const wert of ['584 mm', '643 mm', '635 mm', '666 mm', '+59 mm', '+31 mm']) {
    assert(b.includes(wert), 'Wert fehlt: ' + wert);
  }
  assert(/4,9&nbsp;%|4,9 %/.test(b), 'Die Uebersetzungsfolge fehlt');
  assert(/Rake/.test(b), 'Die Rake-Folge fehlt');
  assert(/nicht zur Auswahl/.test(b),
    'Es fehlt, dass der Michelin-Satz im Simulator nicht waehlbar ist');
  // Gegenrechnung der Nennmasse: Felgendurchmesser + 2 x Querschnitt.
  const d = (w, a, r) => r * 25.4 + 2 * w * a / 100;
  assert(Math.round(d(335, 35, 17)) === 666, 'Michelin hinten');
  assert(Math.round(d(235, 45, 17)) === 643, 'Michelin vorn');
  assert(Math.round(25.0 * 25.4) === 635, 'Avon hinten');
  assert(Math.round(23.0 * 25.4) === 584, 'Avon vorn');
});

await test('Die Uebersicht gibt sich nicht als Bestandsverzeichnis aus', async () => {
  // Die sechs Avon-Saetze stammen aus dem Simulator-Dropdown. Ob sie vorhanden
  // sind, weiss diese Seite nicht - und darf es nicht behaupten.
  const i = specs.indexOf('Weitere Reifens&auml;tze');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  assert(/kein Bestandsverzeichnis/.test(b), 'Der Vorbehalt fehlt');
  assert(/nicht erfasst/.test(b), 'Die Saetze stehen ohne Statusvorbehalt da');
});

await test('Die Koeffizienten stehen nicht noch einmal in specs.html', async () => {
  // Regel 10: Crr und mu gehoeren in den Simulator, nicht in zwei Tabellen.
  const i = specs.indexOf('Weitere Reifens&auml;tze');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  assert(!/0\.0155|0\.018|0\.92|1\.00/.test(b),
    'Die Beiwerte des Simulators sind hier noch einmal abgeschrieben');
});

await test('Der Widerspruch A24 Slick vs. All Weather ist festgehalten', async () => {
  // Der Simulator fuehrt crossply_a24 als type 'historic_aw' (nachgeschnittenes
  // Profil), das Datenblatt als Slick. Beides kann nicht stimmen.
  assert(/historic_aw/.test(index), 'Das Preset wurde umbenannt - Test anpassen');
  const i = specs.indexOf('Weitere Reifens&auml;tze');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  assert(/Widerspruch in der eigenen Datenlage/.test(b), 'Der Widerspruch ist nicht benannt');
});

suite('Radgewichte: gewogen ist nicht geschaetzt');

await test('Beide Saetze stehen mit ihren Einzelgewichten da', async () => {
  const i = specs.indexOf('Radgewichte (gewogen)');
  assert(i > 0, 'Die Gewichtstabelle fehlt');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  for (const wert of ['27,5 kg', '21,5 kg', '20,5 kg', '98 kg', '76 kg']) {
    assert(b.includes(wert), 'Wert fehlt: ' + wert);
  }
});

await test('Der geschaetzte Wert ist als solcher gekennzeichnet', async () => {
  // Das vordere Avon-Rad wurde nicht gewogen. Die Summe 76 kg und damit die
  // ganze Differenz haengen an dieser einen Zahl.
  const i = specs.indexOf('Radgewichte (gewogen)');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  assert(/ca\. 17,5 kg/.test(b), 'Der geschaetzte Wert fehlt');
  assert(/gesch&auml;tzt/.test(b), 'Er steht ohne Kennzeichnung da');
  assert(/nachwiegen/.test(b), 'Es fehlt, was den Vergleich belastbar macht');
});

await test('Die Differenz ist eingeordnet, nicht nur ausgerechnet', async () => {
  const i = specs.indexOf('Radgewichte (gewogen)');
  const b = specs.slice(i, specs.indexOf('section-comment', i));
  assert(/22 kg/.test(b), 'Die Differenz fehlt');
  assert(/ungefederte/.test(b) && /rotierende/.test(b),
    'Die Differenz steht ohne ihre Wirkung da');
  // Gegenrechnung der Summen aus den Einzelwerten.
  assertEqual(2 * 27.5 + 2 * 21.5, 98, 'Michelin-Summe');
  assertEqual(2 * 20.5 + 2 * 17.5, 76, 'Avon-Summe');
  assertEqual(98 - 76, 22, 'Differenz');
});

} finally {
  process.exit(summary());
}
