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
    assertEqual(d.zaehler,'1 / 3 Messungen vollständig','Status');
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
    assertEqual(d.z,'3 / 3 Messungen vollständig','vollständig');
    assertEqual(d.mean,'109,5° ATDC','Mittelwert');
    assert(d.delta.includes('+1,5°'),'Sollabweichung');
    assertEqual(d.spread,'1,0°','Wiederholbarkeit');
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
    assertEqual(after.z,'3 / 3 Messungen vollständig','nach Reload berechnet');
    assertEqual(a.errors.length,0,'Browserfehler: '+a.errors.join(' | '));
    await a.ctx.close();
  });
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
summary();
