// Browsernachweis: Cam-Degreeing-Rechner plus bestehendes lokales Speichersystem.
// GitHub-API wird nur in der Testumgebung abgefangen; kein Nutzer-Gist wird geändert.
import { chromium } from 'playwright';
import { startServer, stubGitHub, suite, test, assertEqual, assert, summary } from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();
async function seite(initial) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await stubGitHub(p);
  if (initial) await p.addInitScript(data => {
    localStorage.setItem('engineBuildLog', JSON.stringify(data));
  }, initial);
  await p.goto(base + '/build-log.html');
  await p.waitForFunction(() => typeof CamDegreeing === 'object' && dataLoaded === true);
  return { p, ctx, errors };
}
try {
  suite('Cam Degreeing in echtem Browser');
  await test('Altmessung aus Gist als erster Durchgang übernommen, ohne Reset', async () => {
    const a=await seite({p2_icl_target:'108',p2_icl_actual:'109,5',p2_open050:'65',p2_close050:'154',
      _savedAt:'2026-10-31T13:21:58.847Z'});
    const d=await a.p.evaluate(() => ({
      v:document.querySelector('[data-field="p2_open050"]').value,
      n:document.querySelector('[data-field="p2_close050"]').value,
      icl:document.getElementById('cam-icl-run-1').textContent,
      mittel:document.getElementById('cam-icl-average').textContent,
      speicher:JSON.parse(localStorage.getItem('engineBuildLog')).p2_open050,
      zaehler:document.getElementById('cam-runs-count').textContent
    }));
    assertEqual(d.v,'65','Vorwert');
    assertEqual(d.n,'154','Nachwert');
    assertEqual(d.icl,'109,5','Ergebnis');
    assertEqual(d.mittel,'109,5° ATDC','Vorläufiger Mittelwert');
    assertEqual(d.speicher,'65','Originalwert im Speicher');
    assertEqual(d.zaehler,'Einstellrunde 1: 1 / 3 Messungen vollständig','Status');
    assertEqual(a.errors.length,0,'Browserfehler: '+a.errors.join(' | '));
    await a.ctx.close();
  });
  await test('Drei Durchgänge werden berechnet, gespeichert und wieder geladen', async () => {
    const a=await seite({p2_icl_target:'108',p2_icl_actual:'109,5',p2_open050:'65',p2_close050:'154',
      _savedAt:'2026-10-31T13:21:58.847Z'});
    await a.p.evaluate(() => {
      function setzen(key,v) {
        const el=document.querySelector('[data-field="'+key+'"]');
        el.value=v; el.dispatchEvent(new Event('input',{bubbles:true}));
      }
      setzen('p2_degree_r2_vor','64'); setzen('p2_degree_r2_nach','154');
      setzen('p2_degree_r3_vor','65'); setzen('p2_degree_r3_nach','155');
    });
    await a.p.waitForTimeout(900); // AutoSave: 500ms Debounce
    const d=await a.p.evaluate(() => ({
      z:document.getElementById('cam-runs-count').textContent,
      mean:document.getElementById('cam-icl-average').textContent,
      delta:document.getElementById('cam-icl-deviation').textContent,
      spread:document.getElementById('cam-icl-spread').textContent,
      saved:JSON.parse(localStorage.getItem('engineBuildLog'))
    }));
    assertEqual(d.z,'Einstellrunde 1: 3 / 3 Messungen vollständig','vollständig');
    assertEqual(d.mean,'109,5° ATDC','Mittelwert');
    assert(d.delta.includes('+1,5°'),'Sollabweichung');
    assertEqual(d.spread,'1°','Wiederholbarkeit');
    assertEqual(d.saved.p2_degree_r2_vor,'64','Persistenz r2');
    assertEqual(d.saved.p2_degree_r3_nach,'155','Persistenz r3');
    assertEqual(d.saved.p2_icl_actual,'109,5','berechneter Istwert gespeichert');
    await a.p.reload();
    await a.p.waitForFunction(() => dataLoaded === true);
    const after=await a.p.evaluate(() => ({
      v:document.querySelector('[data-field="p2_degree_r3_nach"]').value,
      z:document.getElementById('cam-runs-count').textContent
    }));
    assertEqual(after.v,'155','nach Reload noch vorhanden');
    assertEqual(after.z,'Einstellrunde 1: 3 / 3 Messungen vollständig','nach Reload berechnet');
    assertEqual(a.errors.length,0,'Browserfehler: '+a.errors.join(' | '));
    await a.ctx.close();
  });
  await test('Nach Zahnradverstellung beginnt Runde 2, Runde 1 bleibt erhalten',async()=>{
    const a=await seite({p2_icl_target:'108',p2_open050:'65',p2_close050:'154',
      p2_degree_r2_vor:'64',p2_degree_r2_nach:'154',
      p2_degree_r3_vor:'65',p2_degree_r3_nach:'155',
      p2_icl_actual:'109,5',_savedAt:'2026-10-31T13:21:58.847Z'});
    await a.p.evaluate(()=>CamDegreeing.addRound());
    await a.p.evaluate(()=>{
      document.querySelector('[data-field="p2_degree_setting_2"]').value='A2';
      document.querySelector('[data-field="p2_degree_setting_2"]').dispatchEvent(new Event('input',{bubbles:true}));
      const vals={p2_degree_cycle_2_m1_vor:'63',p2_degree_cycle_2_m1_nach:'152',
                  p2_degree_cycle_2_m2_vor:'63',p2_degree_cycle_2_m2_nach:'153',
                  p2_degree_cycle_2_m3_vor:'62',p2_degree_cycle_2_m3_nach:'152'};
      Object.entries(vals).forEach(([key,val])=>{
        const el=document.querySelector('[data-field="'+key+'"]');
        el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));
      });
    });
    await a.p.waitForTimeout(900);
    const r=await a.p.evaluate(()=>({
      count:document.querySelector('[data-field="p2_degree_round_count"]').value,
      run1:JSON.parse(localStorage.getItem('engineBuildLog')).p2_open050,
      run2:JSON.parse(localStorage.getItem('engineBuildLog')).p2_degree_cycle_2_m3_nach,
      avg:document.getElementById('cam-icl-average').textContent
    }));
    assertEqual(r.count,'2','Neue Runde');
    assertEqual(r.run1,'65','Alte Runde erhalten');
    assertEqual(r.run2,'152','Neue Messwerte gespeichert');
    assertEqual(r.avg,'107,5° ATDC','ICL aus neuer Runde');
    await a.p.reload();
    await a.p.waitForFunction(()=>dataLoaded===true);
    const rr=await a.p.evaluate(()=>({
      count:document.querySelector('[data-field="p2_degree_round_count"]').value,
      old:document.querySelector('[data-field="p2_open050"]').value,
      newer:document.querySelector('[data-field="p2_degree_cycle_2_m3_nach"]').value
    }));
    assertEqual(rr.count,'2','Round persistiert');
    assertEqual(rr.old,'65','Alte Runde geladen');
    assertEqual(rr.newer,'152','Neue Runde geladen');
    assertEqual(a.errors.length,0,'Browserfehler: '+a.errors.join(' | '));
    await a.ctx.close();
  });

  await test('Eine neue unvollständige OT-Messrunde bewahrt den historischen ICL-Wert',async()=>{
    const a=await seite({p2_icl_target:'108',p2_open050:'65',p2_close050:'154',
      p2_icl_actual:'109,5', _savedAt:'2026-10-31T13:21:58.847Z'});
    await a.p.evaluate(()=>CamDegreeing.addRound());
    await a.p.evaluate(()=>{
      const set=(key,value)=>{
        const el=document.querySelector('[data-field="'+key+'"]');
        el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));
      };
      set('p2_degree_reason_2','OT erneut überprüft');
      set('p2_degree_cycle_2_m1_vor','64');
      set('p2_degree_cycle_2_m1_nach','152');
    });
    await a.p.waitForTimeout(900);
    const d=await a.p.evaluate(()=>({
      mean:document.getElementById('cam-icl-average').textContent,
      count:document.getElementById('cam-runs-count').textContent,
      previous:JSON.parse(localStorage.getItem('engineBuildLog')).p2_icl_actual,
      old:JSON.parse(localStorage.getItem('engineBuildLog')).p2_open050,
      reason:JSON.parse(localStorage.getItem('engineBuildLog')).p2_degree_reason_2
    }));
    assertEqual(d.mean,'108° ATDC','vorläufiger neuer Mittelwert sichtbar');
    assertEqual(d.count,'Einstellrunde 2: 1 / 3 Messungen vollständig','unvollständig markiert');
    assertEqual(d.previous,'109,5','historischer Istwert nicht überschrieben');
    assertEqual(d.old,'65','historisches Winkelpaar nicht überschrieben');
    assertEqual(d.reason,'OT erneut überprüft','Anlass gespeichert');
    assertEqual(a.errors.length,0,'Browserfehler: '+a.errors.join(' | '));
    await a.ctx.close();
  });
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
summary();
