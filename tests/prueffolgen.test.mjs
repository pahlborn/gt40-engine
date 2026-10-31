// #75/#76 und die beauftragte Pointer-/Kuehlkreis-Dokumentation.
// Dokument-Regression, keine Hersteller- oder reale Montagefreigabe.
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';
const read = p => fs.readFileSync(path.join(REPO_ROOT,p),'utf8');
const specs=read('specs.html'), build=read('build-log.html'), trouble=read('docs/troubleshooting.html');
const card=id=>{const a=build.indexOf('<div class="step-card" id="'+id+'"');assert(a>=0,id+' fehlt');const z=build.indexOf('<div class="step-card"',a+10);return build.slice(a,z<0?undefined:z);};
try {
suite('Prueffolgen: eindeutige Motorbezuege und offene Herstellervorgabe');
await test('Zylinderlayout und Lifterbezug verwenden Motorbaenke statt Sitzposition',async()=>{
  const layout=specs.slice(specs.indexOf('<strong>Zylinderanordnung'),specs.indexOf('<strong>Zylinderanordnung')+1000);
  assert(/Bank 1&ndash;4/.test(layout)&&/Bank 5&ndash;8/.test(layout)&&/Schwungrad/.test(layout),'Bank-/Blickbezug fehlt');
  assert(!/Beifahrerseite \(RH\)|Fahrerseite \(LH\)/.test(layout),'Sitzposition wieder als Motorbank');
  assert(!/passenger side, front|Beifahrerseite, vorne/.test(card('p2_step5')),'Lifterposition als Fahrzeugseite');
  assert(!/passenger side|driver side|von vorne gesehen/i.test(trouble.slice(trouble.indexOf('Zylindernummerierung'),trouble.indexOf('Zylindernummerierung')+650)),'Fehlersuche wieder mit unklarem Bezug');
});
await test('Pickup-Arbeitsschritte zeigen beide Kontexte in DE/EN, ohne Idealzahl',async()=>{
  for(const id of ['p2_step18','p2_step19','p3_pickup']){
    const c=card(id);assert(c.includes('IS-1850-0632')&&c.includes('IS-1850-0229'),id+': Ford-Kontext fehlt');
    assert(c.includes('OPEN:')&&c.includes('OFFEN:'),id+': sichtbarer Sprachvorbehalt fehlt');
    assert(!/Ideal<\/span>|eher naeher|Target Clearance[^\n]*1\/4|Pickup-to-Pan Bottom: 1\/4/.test(c),id+': veraltetes Soll/Ideal');
  }
  assert(!specs.includes('Pickup-Abstand .250')&&!/Oil Pickup to Pan Bottom<\/td>[^\n]*\.250/.test(specs),'veraltete Vergleichs-/Sollzeile');
  assert(!/Pickup-Abstand zum Wannenboden[^\n]*Soll:/.test(trouble),'Fehlersuche setzt universellen Pickup-Sollwert');
});
await test('Build unterscheidet MSD 11 und 10 Uhr und verweist auf echte Quellen',async()=>{
  const c=card('p3_timing_cover');assert(/89889[^<]{0,40}11-Uhr/.test(c)&&/89888[^<]{0,40}10 Uhr/.test(c),'Pointerpositionen fehlen/verdreht');
  for(const n of ['89889','89888']) assert(specs.includes('parts/'+n+'"'),'Holley-Primärquelle fehlt: '+n);
  assert(/echten OT/.test(c)&&/true TDC/.test(c),'DE/EN-Nullkontrolle fehlt');
});
await test('Kuehlkreis zeigt genau den berichteten Hauptweg und keine erfundene E-Pumpenleitung',async()=>{
  const svg=read('docs/kuehlkreislauf.svg');
  const links=[...svg.matchAll(/<path[^>]*data-from="([^"]+)"[^>]*data-to="([^"]+)"[^>]*class="([^"]+)"/g)];
  const main=links.filter(x=>x[3]==='main').map(x=>x[1]+'>'+x[2]).sort();
  assert(JSON.stringify(main)===JSON.stringify(['radiator>mechanical-pump','mechanical-pump>engine','engine>manifold','manifold>radiator','expansion>recovery'].sort()),'Hauptweg/Überlauf stimmt nicht mit dokumentierten Kanten überein');
  assert(links.every(x=>x[1]!=='electric-pump'&&x[2]!=='electric-pump'),'E-Pumpe wurde einer nicht belegten Leitung zugeordnet');
  assert(links.some(x=>x[1]==='pipe'&&x[2]==='expansion'&&x[3]==='known'),'Behälterabgang fehlt/falsch zugeordnet');
  assert(links.some(x=>x[1]==='manifold'&&x[2]==='mechanical-pump'&&x[3]==='unknown'),'Bypass nicht als ungeklärt markiert');
  assert(specs.includes('src="docs/kuehlkreislauf.svg"')&&svg.includes('Owner-Angaben')&&svg.includes('Flussrichtung OFFEN'),'Einbettung oder Evidenzvorbehalt fehlt');
});
} finally {process.exit(summary());}
