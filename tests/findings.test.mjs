// Tests fuer Kapitelstatus und Befunde in build-log.html.
//
// Zwei Luecken im Build Log:
//   1. Ein Kapitel liess sich nur als "fertig" markieren. Ein Umschalter waere
//      genauso binaer gewesen - die Stufe "in Arbeit" fehlte schlicht.
//   2. Pro Kapitel gab es genau eine Zeile fuer Befunde. Bei einer
//      Sichtpruefung faellt aber selten genau eine Sache auf, und jede hat
//      ihren eigenen Verlauf (bestellt, eingetroffen, verbaut).
//
// Lokal: npm test

import { chromium } from 'playwright';
import {
  startServer, stubGitHub, suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const { server, base } = await startServer();
const browser = await chromium.launch();

async function openBuildLog(opts = {}) {
  const ctx = await browser.newContext();
  if (opts.seed) await ctx.addInitScript(opts.seed);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await stubGitHub(page, opts);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof Findings !== 'undefined' && dataLoaded === true,
    null, { timeout: 30000 });
  await page.waitForTimeout(250);
  return { ctx, page, errors, close: () => ctx.close() };
}

try {

// ---------------------------------------------------------------------------
suite('Kapitelstatus: drei Stufen statt an/aus');

await test('Der Knopf schaltet offen -> in Arbeit -> erledigt -> offen', async () => {
  const p = await openBuildLog();
  const werte = await p.page.evaluate(() => {
    const btn = document.querySelector('.step-status[data-field]');
    const out = [btn.value];
    for (let i = 0; i < 3; i++) { cycleStepStatus(btn); out.push(btn.value); }
    return out;
  });
  assertEqual(werte, ['', 'wip', 'done', ''], 'Reihenfolge der Stufen');
  await p.close();
});

await test('Der Status wird gespeichert und ueberlebt das Neuladen', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubGitHub(page);
  await page.goto(base + '/build-log.html');
  await page.waitForFunction(() => typeof Findings !== 'undefined' && dataLoaded === true, null, { timeout: 30000 });
  const feld = await page.evaluate(async () => {
    const btn = document.querySelector('.step-status[data-field]');
    cycleStepStatus(btn);                       // -> wip
    await saveData();
    return btn.dataset.field;
  });
  await page.reload();
  await page.waitForFunction(() => typeof Findings !== 'undefined' && dataLoaded === true, null, { timeout: 30000 });
  await page.waitForTimeout(250);
  const r = await page.evaluate((f) => {
    const btn = document.querySelector('.step-status[data-field="' + f + '"]');
    return { wert: btn.value, attribut: btn.getAttribute('value') };
  }, feld);
  assertEqual(r.wert, 'wip', 'Gespeicherter Wert');
  assertEqual(r.attribut, 'wip', 'Attribut fuers CSS');
  await ctx.close();
});

await test('Alte Wahrheitswerte werden als "erledigt" gelesen', async () => {
  // Vor der Umstellung war das Feld eine Checkbox und speicherte true/false.
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => [
    Findings.normalizeStatus(true), Findings.normalizeStatus('true'),
    Findings.normalizeStatus('on'), Findings.normalizeStatus(false),
    Findings.normalizeStatus(''), Findings.normalizeStatus('wip')
  ]);
  assertEqual(r, ['done', 'done', 'done', '', '', 'wip']);
  await p.close();
});

await test('Der Fortschrittsbalken zaehlt "in Arbeit" halb', async () => {
  // Sonst steht der Balken tagelang still, obwohl gearbeitet wird.
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const phase = document.getElementById('phase1');
    const btns = Array.from(phase.querySelectorAll('.step-status[data-field]'));
    btns.forEach((b) => { b.value = ''; b.setAttribute('value', ''); });
    updateProgress();
    const leer = document.getElementById('prog1').style.width;
    btns[0].value = 'done'; btns[0].setAttribute('value', 'done');
    btns[1].value = 'wip'; btns[1].setAttribute('value', 'wip');
    updateProgress();
    const gemischt = parseFloat(document.getElementById('prog1').style.width);
    const erwartet = (1 + 0.5) / btns.length * 100;
    return { leer, gemischt, erwartet, text: document.getElementById('progText1').textContent };
  });
  assertEqual(r.leer, '0%', 'Ohne Fortschritt');
  assert(Math.abs(r.gemischt - r.erwartet) < 0.01,
    'Balken: ' + r.gemischt + '%, erwartet ' + r.erwartet + '%');
  assert(/in Arbeit/.test(r.text), 'Text nennt "in Arbeit" nicht: ' + r.text);
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Befunde: mehrere pro Kapitel, jeder mit eigenem Status');

await test('Jedes Kapitel hat eine Befundliste', async () => {
  const p = await openBuildLog();
  const n = await p.page.evaluate(() => document.querySelectorAll('.findings[data-findings]').length);
  assert(n >= 90, 'Nur ' + n + ' Befundlisten gefunden');
  await p.close();
});

await test('Die alte Einzelzeile ist weg', async () => {
  const p = await openBuildLog();
  const n = await p.page.evaluate(() => document.querySelectorAll('input.step-note').length);
  assertEqual(n, 0, 'Alte Notizzeilen');
  await p.close();
});

await test('Mehrere Befunde lassen sich anlegen', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    Findings.add(ch, 'Lagerschale 3 verkratzt');
    Findings.add(ch, 'Freeze Plug undicht');
    Findings.add(ch, 'Gewinde M10 ausgerissen');
    renderFindings(ch);
    const box = document.querySelector('.findings[data-findings="' + ch + '"]');
    return {
      gespeichert: Findings.forChapter(ch).map((i) => i.text),
      zeilen: box.querySelectorAll('.fx-row').length
    };
  });
  assertEqual(r.gespeichert, ['Lagerschale 3 verkratzt', 'Freeze Plug undicht', 'Gewinde M10 ausgerissen']);
  assertEqual(r.zeilen, 3, 'Angezeigte Zeilen');
  await p.close();
});

await test('Jeder Befund hat seinen eigenen Status', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    const a = Findings.add(ch, 'wartet auf Teile');
    const b = Findings.add(ch, 'schon erledigt');
    Findings.update(a, { status: 'wip' });
    Findings.update(b, { status: 'done' });
    renderFindings(ch);
    return {
      zaehler: Findings.counts(ch),
      status: Findings.forChapter(ch).map((i) => i.status)
    };
  });
  assertEqual(r.status, ['wip', 'done']);
  assertEqual(r.zaehler.wip, 1);
  assertEqual(r.zaehler.done, 1);
  await p.close();
});

await test('Die Liste ist ein- und ausklappbar und merkt sich das', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    Findings.add(ch, 'x');
    renderFindings(ch);
    const box = document.querySelector('.findings[data-findings="' + ch + '"]');
    const zu = getComputedStyle(box.querySelector('.findings-body')).display;
    toggleFindings(ch);
    const auf = getComputedStyle(
      document.querySelector('.findings[data-findings="' + ch + '"] .findings-body')).display;
    return { zu, auf, gemerkt: JSON.parse(localStorage.getItem('engineFindingsOpen'))[ch] };
  });
  assertEqual(r.zu, 'none', 'Eingeklappt');
  assert(r.auf !== 'none', 'Aufgeklappt');
  assert(r.gemerkt === true, 'Zustand wurde nicht gemerkt');
  await p.close();
});

await test('Das Abzeichen zeigt die Zaehlung ohne Aufklappen', async () => {
  const p = await openBuildLog();
  const txt = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    const a = Findings.add(ch, 'a');
    Findings.add(ch, 'b');
    Findings.update(a, { status: 'wip' });
    renderFindings(ch);
    return document.querySelector('.findings[data-findings="' + ch + '"] .findings-badge').textContent;
  });
  assert(/1 offen/.test(txt) && /1 in Arbeit/.test(txt), 'Abzeichen: ' + txt);
  await p.close();
});

await test('Text wird escaped', async () => {
  const p = await openBuildLog();
  const ok = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    Findings.add(ch, '<img src=x onerror=alert(1)>');
    renderFindings(ch);
    const box = document.querySelector('.findings[data-findings="' + ch + '"]');
    const inp = box.querySelector('.fx-row input[type="text"]');
    return box.querySelectorAll('img').length === 0 && inp.value.indexOf('<img') === 0;
  });
  assert(ok, 'Text wurde als HTML interpretiert');
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Keine Sammelliste offener Befunde mehr');

// Die Sprungliste oben auf der Seite ist bewusst entfernt worden: alle darin
// aufgefuehrten Arbeiten sind ohnehin offene Punkte, und der Fortschritt steht
// schon in den Phasenbalken. Der Test haelt sie draussen - sonst kommt sie bei
// der naechsten Aenderung an den Befunden unbemerkt zurueck.
await test('Die Uebersicht ist weg und niemand ruft sie noch auf', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => ({
    block: !!document.getElementById('findingsOverview'),
    reste: document.querySelectorAll('.findings-overview, .fo-item, .fo-count, .fo-body').length,
    renderer: typeof renderFindingsOverview,
    sprung: typeof jumpToChapter
  }));
  assertEqual(r.block, false, 'Der Sammelblock steht wieder in der Seite');
  assertEqual(r.reste, 0, 'Reste der Sammelliste im DOM: ' + r.reste);
  assertEqual(r.renderer, 'undefined', 'renderFindingsOverview lebt noch');
  assertEqual(r.sprung, 'undefined', 'jumpToChapter lebt noch');
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('Befunde anlegen und umschalten geht ohne die Uebersicht weiter', async () => {
  // Die fuenf Aufrufe von renderFindingsOverview standen mitten in diesen
  // Funktionen. Faellt dabei einer zu viel weg, merkt man es genau hier.
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    const id = Findings.add(ch, 'Pleuelschrauben nachbestellen');
    renderFindings(ch);
    const box = document.querySelector('.findings[data-findings="' + ch + '"]');
    const vorher = box.querySelector('.findings-badge').textContent;
    Findings.update(id, { status: 'done' });
    renderAllFindings();
    return { vorher, nachher: box.querySelector('.findings-badge').textContent };
  });
  assert(/1 offen/.test(r.vorher), 'Abzeichen vorher: ' + r.vorher);
  assert(/1 erledigt/.test(r.nachher), 'Abzeichen nachher: ' + r.nachher);
  assertEqual(p.errors.length, 0, 'Page-Errors: ' + p.errors.join(' | '));
  await p.close();
});

// ---------------------------------------------------------------------------
suite('Speichern, Zusammenfuehren, Altbestand');

await test('Loeschen hinterlaesst einen Grabstein', async () => {
  // Ohne den taucht der Eintrag beim naechsten Sync wieder auf - derselbe
  // Fehler wie frueher bei den Fotos.
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const ch = document.querySelector('.findings[data-findings]').dataset.findings;
    const id = Findings.add(ch, 'wird geloescht');
    Findings.remove(id);
    return {
      sichtbar: Findings.forChapter(ch).length,
      grabstein: Findings._raw().items[id].del === true
    };
  });
  assertEqual(r.sichtbar, 0, 'Eintrag noch sichtbar');
  assert(r.grabstein, 'Kein Grabstein gesetzt');
  await p.close();
});

await test('Der Merge vereinigt beide Seiten', async () => {
  const p = await openBuildLog();
  const keys = await p.page.evaluate(() => Object.keys(Findings.merge(
    { version: 1, items: { a: { ch: 'x', text: 'A', m: 100 } } },
    { version: 1, items: { b: { ch: 'x', text: 'B', m: 50 } } }
  ).items).sort());
  assertEqual(keys, ['a', 'b']);
  await p.close();
});

await test('Bei Konflikt gewinnt der juengere Eintrag', async () => {
  const p = await openBuildLog();
  const r = await p.page.evaluate(() => {
    const A = { version: 1, items: { a: { ch: 'x', text: 'alt', m: 100 } } };
    const B = { version: 1, items: { a: { ch: 'x', text: 'neu', m: 999 } } };
    return [Findings.merge(A, B).items.a.text, Findings.merge(B, A).items.a.text];
  });
  assertEqual(r, ['neu', 'neu']);
  await p.close();
});

await test('Ein geloeschter Befund bleibt nach dem Merge geloescht', async () => {
  const p = await openBuildLog();
  const ok = await p.page.evaluate(() => Findings.merge(
    { version: 1, items: { a: { ch: 'x', text: 'A', m: 100 } } },
    { version: 1, items: { a: { ch: 'x', del: true, m: 200 } } }
  ).items.a.del === true);
  assert(ok, 'Befund ist wieder aufgetaucht');
  await p.close();
});

await test('Alte Notizzeilen werden in die Liste uebernommen', async () => {
  const p = await openBuildLog({
    seed: () => {
      localStorage.setItem('engineBuildLog', JSON.stringify({
        p1_block_visual_n: 'Riefe in Zylinder 4',
        _savedAt: new Date().toISOString()
      }));
    }
  });
  const r = await p.page.evaluate(() => {
    const items = Findings.forChapter('p1_block_visual');
    return { texte: items.map((i) => i.text), ausNotiz: items.map((i) => !!i.fromNote) };
  });
  assertEqual(r.texte, ['Riefe in Zylinder 4'], 'Uebernommener Text');
  assertEqual(r.ausNotiz, [true], 'Als uebernommen markiert');
  await p.close();
});

await test('Die Uebernahme passiert nicht zweimal', async () => {
  const p = await openBuildLog({
    seed: () => {
      localStorage.setItem('engineBuildLog', JSON.stringify({
        p1_block_visual_n: 'Riefe in Zylinder 4',
        _savedAt: new Date().toISOString()
      }));
    }
  });
  const n = await p.page.evaluate(() => {
    migrateLegacyNotes();
    migrateLegacyNotes();
    return Findings.forChapter('p1_block_visual').length;
  });
  assertEqual(n, 1, 'Befunde nach mehrfacher Uebernahme');
  await p.close();
});

await test('build-log.html laedt ohne Page-Errors', async () => {
  const p = await openBuildLog();
  assertEqual(p.errors, []);
  await p.close();
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
