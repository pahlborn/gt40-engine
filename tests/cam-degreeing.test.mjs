/**
 * Tests: Cam Degreeing am GT40, 3 Messungen mit Gist-Feld-Kompatibilität.
 * Keine angegebene Freigabetoleranz: Spannweite misst nur Wiederholbarkeit.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const js = readFileSync(resolve(root, 'cam-degreeing.js'), 'utf8');
const html = readFileSync(resolve(root, 'build-log.html'), 'utf8');
const exkurs = readFileSync(resolve(root, 'docs/cam-degreeing.html'), 'utf8');
const sandbox = {};
vm.runInNewContext(js, sandbox);
const { lauf, auswerten, zahl } = sandbox.CamDegreeing;

test('Altbestand 65 / 154 = 109,5 ICL (nicht @.050 am Grundkreis)', () => {
  assert.equal(lauf('65', '154'), 109.5);
  const r = auswerten([['65','154'],['',''],['','']], '108');
  assert.equal(r.anzahl, 1);
  assert.equal(r.komplett, false);
  assert.equal(r.mittel, 109.5);
  assert.equal(r.abweichung, 1.5);
  assert.equal(r.spannweite, null);
});
test('Drei Wiederholungen: Mittel, Sollabweichung und Spannweite', () => {
  const r = auswerten([['65','154'],['64','154'],['65','155']], '108');
  assert.equal(r.anzahl, 3);
  assert.equal(r.komplett, true);
  assert.equal(r.mittel, 109.5);
  assert.equal(r.abweichung, 1.5);
  assert.equal(r.spannweite, 1);
});
test('Kommawert und Winkelkreis 360°', () => {
  assert.equal(zahl('108,5'), 108.5);
  assert.equal(lauf('350','10'), 0);
  assert.equal(lauf('120','119'), null); // 359° Abstand, falsche Skala
});
test('Unvollständige und fehlerhafte Paare werden nicht gemittelt', () => {
  const r = auswerten([['65', '154'], ['64',''], ['abc','155']], '108');
  assert.equal(r.anzahl, 1);
  assert.equal(r.komplett, false);
  assert.equal(r.spannweite, null);
  assert.equal(lauf('','154'), null);
  assert.equal(lauf('65','65'), null);
});
test('Die Gist-Feldnamen aus v123 bleiben erhalten und sind eindeutig', () => {
  for (const key of ['p2_icl_target','p2_icl_actual','p2_open050','p2_close050',
    'p2_degree_r2_vor','p2_degree_r2_nach','p2_degree_r3_vor','p2_degree_r3_nach']) {
    assert.equal((html.match(new RegExp('data-field="' + key + '"', 'g')) || []).length, 1,
      'Einziges Feld: ' + key);
  }
  assert.match(html, /cam-degreeing\.js/);
  assert.match(html, /CamDegreeing\.render\(\)/);
  assert.match(html, /docs\/cam-degreeing\.html/);
});
test('Exkurs trennt echten OT von Nockenmaximum und belegt die Quelle', () => {
  assert.match(exkurs, /Summit SUM-900061-S/);
  assert.match(exkurs, /Moroso 62191/);
  assert.match(exkurs, /Proform 66838/);
  assert.match(exkurs, /TFS-90000-16/);
  assert.match(exkurs, /unterhalb des Maximums/);
  assert.match(exkurs, /Kolbenhöhe/);
  assert.match(exkurs, /compcams\.com/);
  assert.match(exkurs, /1632-16/);
});

test('OT mit Messuhr und mit passendem Kolbenstopper sind getrennte Verfahren', () => {
  assert.match(exkurs, /A · Messuhr auf dem Kolben/);
  assert.match(exkurs, /B · Kolbenstopper \/ Piston Stop \/ OT-Finder/);
  assert.match(exkurs, /im Zündkerzenloch/);
  assert.match(exkurs, /beide Ventile geschlossen/);
  assert.match(exkurs, /Nie mit Anlasser oder Gewalt/);
  assert.match(exkurs, /Stopper <strong>entfernen<\/strong>/);
  assert.match(exkurs, /Winkelmitte/);
  assert.match(exkurs, /compcams\.com\/pub\/media\/productattach\/1\/4\/145\.pdf/);
  assert.match(html, /Echter OT mit Messuhr oder Kolbenstopper verifiziert/);
  assert.match(html, /compatible spark-plug-hole piston stop/);
  assert.match(html, /class="spec-line"><span>ICL Mittelwert/);
  assert.doesNotMatch(exkurs, /Deine Werkzeuge|Mit deinen COMP|hier deine Messuhrbrücke/);
  assert.equal((exkurs.match(/<svg\b/g) || []).length, 6);
});

test('DE/EN definieren denselben Messbezug unter dem Maximum', () => {
  const start = html.indexOf('id="p2_step6"');
  const end = html.indexOf('id="p2_step7"',start);
  const block = html.slice(start,end);
  const en = [...block.matchAll(/<span class="en">([\s\S]*?)<\/span>/g)].map(m=>m[1]).join(' ');
  assert.match(en,/equal piston heights/);
  assert.match(en,/correctly identified roller-cam follower/);
  assert.match(en,/below peak lobe lift/);
  assert.doesNotMatch(en,/install piston stop|lifter rise on each side/);
  assert.match(exkurs,/href="https:\/\/performanceparts\.ford\.com\/part\/M-6268-A302"/);
});

test('Visuelle Anleitung ist kompakt, bebildert, navigierbar und weiterhin quellenbasiert', () => {
  assert.equal((exkurs.match(/class="stage"/g) || []).length, 5, 'genau fünf Arbeitsschritte');
  assert((exkurs.match(/<svg\b/g) || []).length >= 5, 'mindestens fünf erklärende Zeichnungen');
  assert((exkurs.match(/<desc\b/g) || []).length >= 5, 'SVG-Bildbeschreibungen für Barrierefreiheit');
  for (const key of ['ot','messen','bewerten','verstellen','abschluss']) {
    assert(exkurs.includes('id="' + key + '"'), 'Schritt ' + key + ' erreichbar');
    assert(exkurs.includes('href="#' + key + '"'), 'Sprungnavigation für ' + key);
  }
  for (const source of ['M-6268-A302','TFS-90000-16','SUM-900061-S','Proform 66838','Moroso 62191']) {
    assert(exkurs.includes(source), source + ' als dokumentiertes Werkzeug/Teil');
  }
  assert(exkurs.includes('unterhalb des Maximums'), 'korrekter .050-Referenzpunkt');
  assert(exkurs.includes('Kolbenhöhe'), 'echter OT via gleiche Kolbenhöhen');
  assert(exkurs.includes('compcams.com'), 'COMP-Primärquelle');
  assert(exkurs.includes('1632-16'), 'Rocker-Erklärung');
  assert(exkurs.includes('keine zahn- oder markierungsgenaue Montagezeichnung'), 'Montagegrafik als Schema gekennzeichnet');
  assert(exkurs.includes('neue Messrunde'), 'keine Vermischung unterschiedlich referenzierter Messungen');
  assert(exkurs.includes('2 volle Umdrehungen'), 'Ford-Durchdrehprüfung');
});
