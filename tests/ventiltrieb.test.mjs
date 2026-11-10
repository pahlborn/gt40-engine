// Visuelle Ventiltrieb-Exkurse: sicherer Methodenbezug, Erreichbarkeit und Browser.
// Kein Zugriff auf echte GitHub-/Gist-Daten. --content-only fuer Gegenproben.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, browserStarten, suite, test, assert, assertEqual, summary, REPO_ROOT } from './helpers.mjs';

const a = 'docs/pushrod-geometrie.html';
const b = 'docs/rocker-hlt-einstellung.html';
const read = f => fs.readFileSync(path.join(REPO_ROOT, f), 'utf8');
const card = (html, id) => html.split('class="step-card" id="'+id+'"')[1]?.split('<div class="step-card"')[0] || '';

suite('Ventiltrieb: anwendbare Methode und Grenzen');
await test('Messung hat eine sichtbare Sitzhoehen-Voraussetzung, keine verdeckte Laengenfreigabe', () => {
  const html = read(a);
  const hold = html.match(/<div class="hold" id="messbezug">[\s\S]*?<\/div>/)?.[0] || '';
  assert(hold.includes('Morel 5327') && hold.includes('keine Bestelllänge'), 'Sitzhoehen-Stop vor Laengenmessung fehlt');
  assert(html.includes('Prüffedern allein garantieren keine unveränderte Pfannenhöhe'), 'Prueffeder als alleinige Lifter-Fixierung dargestellt');
  assert(html.includes('CNC-TC6878') && html.includes('Messkonvention und Gewindesteigung noch zu bestätigen'), 'Fremde Checker-Messkonvention unbemerkt zugeordnet');
});
await test('Endmontage verlangt Betriebsfedern und trennt HLT-Methode von Ventilspiel', () => {
  const html = read(b);
  assert(html.includes('Prüffedern durch die vorgesehenen Betriebsfedern'), 'Prueffedern vor Endmontage nicht ersetzt');
  assert(html.includes('nicht das Öffnen des Ventils mit dem Plungeranschlag verwechseln'), 'Ventiloeffnung als moeglicher falscher Anschlag nicht ausgeschlossen');
  assert(html.includes('unteren Endanschlag') && html.includes('0,006–0,010″') && html.includes('70 °F'), 'HLT-Bezug/Bedingungen fehlen');
  assert(html.includes('weder eine pauschale Umdrehungszahl noch ein verbleibendes Ventilspiel'), 'Anwendungsgrenze fehlt');
  assert(html.includes('Händlerhost, historische Originalkopie') && html.includes('nicht aus PN151'), 'Trunnion-Quelle falsch zugeordnet');
  assert(html.includes('genaue ARP-Unterteilenummer') && html.includes('Keine pauschalen ARP-Drehmomente'), 'Stud-Montagefrage faelschlich freigegeben');
});
await test('Build-Log ersetzt die falschen Einzelregeln und erhaelt bestehende Messfelder', () => {
  const html = read('build-log.html');
  for (const [id, link] of [['p2_step10',a], ['p2_step11',a+'#kontakt'], ['p3_rockers',b], ['p4_preload_recheck_card',b+'#hlt']]) {
    assert(card(html,id).includes('href="'+link+'"'), 'Kontextlink fehlt: '+id);
  }
  for (const id of ['p3_rockers','p4_preload_recheck_card']) {
    const c=card(html,id).replace(/<div class="warning-box"[^>]*>[\s\S]*?<\/div>/g,'');
    assert(!c.includes('1/2 turn past zero lash') && !c.includes('From zero lash: 1/2 turn'), 'Alte HLT-Umdrehungsregel bleibt in '+id);
    assert(!c.includes('Zero lash = pushrod just stops'), 'Spin-to-stop als HLT-Methode bleibt in '+id);
  }
  const c=card(html,'p2_step10');
  assert(!c.includes('Narrow band centered</strong> = correct'), 'Kontaktband gibt allein die Laenge frei');
  for (const field of ['pushrod_intake','pushrod_exhaust','p2_pr_c1i','p2_pr_c1e','p2_pr_c5i','p2_pr_c5e','p2_pushrod_n','p2_sweep_n','p3_rockers_n','p4_preload_recheck_n']) {
    assert(html.includes('data-field="'+field+'"'), 'Bestehendes Datenfeld fehlt: '+field);
  }
});
await test('5327-HLT-Einstellvorgabe gilt auch in Specs, Fehlersuche und nach Kopf-Nachziehen', () => {
  const guide = 'href="' + b + '#hlt"';
  const specs = read('specs.html');
  const troubleshooting = read('docs/troubleshooting.html');
  const build = read('build-log.html');
  const recheck = card(build, 'p4_retorque_card');
  for (const [name, html] of [
    ['Specs', specs], ['Fehlersuche', troubleshooting], ['Kopfnachziehen', recheck]
  ]) {
    assert(!/1\/4 bis 1\/2 Umdrehung|1\/2 Umdrehung nach Nullspiel|1\/2 turn past zero lash|Exhaust Closing \/ Intake Opening/.test(html), 'Alte HLT-Einstellung in ' + name);
    assert(html.includes(name === 'Fehlersuche' ? 'href="rocker-hlt-einstellung.html#hlt"' : guide), 'HLT-Verweis fehlt in ' + name);
  }
  assert(specs.includes('data-field="lifter_preload" placeholder="F&uuml;hlerlehrendicke in Zoll"'), 'Messfeld oder Einheit der HLT-Fuehlerlehre fehlt');
  assert(troubleshooting.includes('0,006&ndash;0,010&quot; F&uuml;hlerlehre') && troubleshooting.includes('am unteren Anschlag'), 'Fehlersuche zeigt den HLT-Messbezug nicht');
  const preparation = card(build, 'p1_step12');
  assert(preparation.includes('10W-30') && preparation.includes('&Ouml;lbad in frischem, sauberem Motor&ouml;l ist optional'), 'Morel-Montageschmierung fehlt');
  assert(!preparation.includes('min. 24h'), 'Unbelegte Oelbad-Dauer');
});
await test('Morel-Archiv stellt PDF und Uebersetzung getrennt von der Einstellvorgabe bereit', () => {
  const html = read(b);
  const adjustment = html.split('id="hlt"')[1]?.split('id="sichern"')[0] || '';
  const archive = html.split('id="morel-herstellerblatt"')[1]?.split('</section>')[0] || '';
  const original = 'morel-hlt-einstellung-archiv-2023.pdf';
  assert(adjustment.includes('0,006–0,010″') && !adjustment.includes('0,006–0,009″'), 'Archivwert in der aktiven Einstellanweisung');
  assert(adjustment.includes('href="#morel-herstellerblatt"'), 'Einstellschritt verweist nicht auf die Originalquelle');
  const note = archive.indexOf('Archivfassung mit früheren Einstellwerten');
  const link = archive.indexOf('href="' + original + '"');
  assert(note >= 0 && link > note && archive.slice(note, link).includes('href="#hlt"'), 'Archivhinweis muss vor dem PDF-Link zur aktiven Anweisung fuehren');
  assert(archive.includes('<details>') && archive.includes('Deutsche Übersetzung der Archivfassung') && archive.includes('0,006–0,009″'), 'Historische Uebersetzung fehlt');
  assert(fs.readFileSync(path.join(REPO_ROOT, 'docs', original)).subarray(0, 5).toString() === '%PDF-', 'Original ist kein PDF');
});
await test('Beide Seiten im Index und Offline-Precache, ohne eigene Datenspeicherung', () => {
  for(const f of [a,b]) {
    assert(read('index.html').includes('href="'+f+'"'), 'Indexlink fehlt: '+f);
    assert(read('sw.js').includes("'/gt40-engine/"+f+"'"), 'Offline-Precache fehlt: '+f);
    assert(!/localStorage|fetch\(|XMLHttpRequest|data-field=/.test(read(f)), 'Neuer Daten-/Gist-Schreibpfad in '+f);
  }
  assert(read('sw.js').includes("'/gt40-engine/docs/ventiltrieb.css'"), 'Offline-CSS fehlt');
});

if (!process.argv.includes('--content-only')) {
  const { server, base } = await startServer();
  let browser;
  try {
    browser = await browserStarten();
    suite('Ventiltrieb im Browser');
    for (const width of [1440,390,360]) {
      for(const f of [a,b]) await test(f+' bei '+width+'px: Navigation, Diagramme und Datenbestand', async () => {
        const ctx=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
        const p=await ctx.newPage();
        const errors=[];p.on('pageerror',e=>errors.push(e.message));
        await p.addInitScript(()=>localStorage.setItem('engineBuildLog','{"pushrod_intake":"unveraendert","p2_icl_actual":"109,5"}'));
        const resp=await p.goto(base+'/'+f);assert(resp.ok(),'Seite laedt nicht');
        assertEqual(await p.locator('section.stage').count(),5,'Fuenf Schritte');
        assertEqual(await p.locator('nav.quicknav a').count(),5,'Fuenf Navigationsziele');
        assertEqual(await p.locator('svg').count(),4,'Vier beschriftete SVG je Seite');
        const svgOk=await p.locator('svg').evaluateAll(svg=>svg.every(s=>s.getAttribute('role')==='img' && s.querySelector('title')?.textContent && s.querySelector('desc')?.textContent));
        assert(svgOk,'Zugaengliche Grafikbeschreibung fehlt');
        const clipped = await p.locator('svg').evaluateAll(svgs => svgs.flatMap(s => {
          const v=s.viewBox.baseVal;
          return [...s.querySelectorAll('text')].filter(t => {
            const b=t.getBBox();
            return b.x < v.x-4 || b.y < v.y-4 || b.x+b.width > v.x+v.width+4 || b.y+b.height > v.y+v.height+4;
          }).map(t => t.textContent);
        }));
        assert(clipped.length===0,'SVG-Beschriftung ausserhalb viewBox: '+clipped.join(' | '));
        for(const link of await p.locator('nav.quicknav a').all()) {
          const dest=await link.getAttribute('href');await link.click();
          assertEqual(await p.locator(dest).count(),1,'Navigationsziel existiert');
        }
        assert(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'Horizontales Overflow');
        assertEqual(await p.evaluate(()=>localStorage.getItem('engineBuildLog')),'{"pushrod_intake":"unveraendert","p2_icl_actual":"109,5"}','Bestehende Messwerte unveraendert');
        assertEqual(errors.length,0,'Browserfehler');await ctx.close();
      });
    }
    await test('EO/IC-Schalter per Tastatur und beide Verfahren im Druck sichtbar', async () => {
      const p=await browser.newPage();await p.goto(base+'/'+b);
      await p.locator('[data-eo="auslass"]').focus();await p.keyboard.press('Enter');
      assert(await p.locator('#auslass').isVisible(),'IC-Text fehlt');
      assert(!(await p.locator('#einlass').isVisible()),'Falscher EO-Text bleibt aktiv');
      assertEqual(await p.locator('[data-eo="auslass"]').getAttribute('aria-pressed'),'true','Tastaturzustand');
      await p.emulateMedia({media:'print'});
      assert(await p.locator('#einlass').isVisible() && await p.locator('#auslass').isVisible(),'Druck unterschlaegt EO oder IC');
      assert(!(await p.locator('.print-button').isVisible()),'Druckbutton im Druck');
      assertEqual(await p.locator('table.record tbody tr').count(),8,'Acht Zylinder mit beiden Ventilen');
      await p.close();
    });
  } finally { if(browser) await browser.close();server.close(); }
}
process.exit(summary()===0?0:1);
