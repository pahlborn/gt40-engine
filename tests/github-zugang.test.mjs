// Tests fuer github-zugang.js - Token pruefen und mit dem Gist verbinden.
//
// Bis auf diesen Kopf und SEITE steht dieselbe Datei in gt40-engine,
// jerico-dog-box-assembly-manual und Mustang-Car-Alignment. GitHub ist hier
// nachgebaut (page.route); alles, was nicht ausdruecklich erlaubt ist, wird
// abgewiesen - auch jedes Schreiben in einen Gist.
//
// Lokal: node tests/github-zugang.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  startServer, REPO_ROOT, browserStarten, neuerKontext,
  suite, test, assert, assertEqual, summary
} from './helpers.mjs';

const SEITE = 'index.html';

// Pruefsumme von github-zugang.js (Inhalt ohne Zeilenenden). Dieselbe Zahl
// steht in allen drei Repos. Aendert sich der Baustein, wird dieser Test rot:
// dann die Aenderung in alle drei uebernehmen und die Zahl ueberall ersetzen.
const WORTGLEICH = '7b3b107533fbe991';

const { server, base } = await startServer();
const browser = await browserStarten();

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'Authorization, Content-Type, Accept',
  'access-control-expose-headers': 'X-OAuth-Scopes'
};

/** Konfiguration der App, aus der Seite gelesen - nicht abgeschrieben. */
async function konfig() {
  const ctx = await neuerKontext(browser);
  const page = await ctx.newPage();
  await page.goto(base + '/' + SEITE);
  const c = await page.evaluate(() => {
    const k = GithubZugang.konfiguration();
    return { app: k.app, datei: k.datei, gistIdKey: k.gistIdKey, pflicht: k.pflicht, zusatz: k.zusatz || {}, bekannteId: k.bekannteId || null };
  });
  await ctx.close();
  return c;
}
const CFG = await konfig();

/**
 * Ein Verbindungsversuch gegen das nachgebaute GitHub.
 *   haken     Kopf X-OAuth-Scopes ('gist, public_repo'); null = fine-grained (kein Kopf)
 *   liste     Status der Gist-Liste (200)
 *   vorhanden Datenspeicher steht in der Liste
 *   bekannt   Antwort auf GET /gists/<id>: { owner } oder undefined (404)
 *   anlegen   Status beim Neuanlegen (201)
 *   antwort   Rueckfrage bestaetigen (true) oder abbrechen
 *   vorher    localStorage vor dem Versuch
 *   zusatz    Zusatz-Haken fuer diesen Versuch ({ public_repo: 'Fotos hochladen' }),
 *             damit die Pruefung auch in einer App ohne Fotos laeuft
 */
async function lauf(f = {}) {
  const ctx = await neuerKontext(browser);
  const anfragen = [];
  await ctx.addInitScript((v) => { for (const [k, w] of Object.entries(v)) localStorage.setItem(k, w); }, f.vorher || {});
  await ctx.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const m = req.method();
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    anfragen.push(m + ' ' + u.pathname);
    const json = (status, body, extra = {}) => route.fulfill({
      status, headers: { ...CORS, ...extra }, contentType: 'application/json', body: JSON.stringify(body) });
    if (u.pathname === '/user') {
      const kopf = f.haken === null ? {} : { 'x-oauth-scopes': f.haken === undefined ? 'gist, public_repo' : f.haken };
      return json(200, { login: 'pahlborn' }, kopf);
    }
    if (u.pathname.startsWith('/gists/') && m === 'GET') {
      if (!f.bekannt) return json(404, { message: 'Not Found' });
      return json(200, { id: u.pathname.split('/')[2], owner: { login: f.bekannt.owner }, files: { [CFG.datei]: { filename: CFG.datei } } });
    }
    if (u.pathname === '/gists' && m === 'GET') {
      if ((f.liste || 200) !== 200) return json(f.liste, { message: 'Resource not accessible by personal access token' });
      const l = f.vorhanden ? [{ id: 'VORHANDEN', files: { [CFG.datei]: { filename: CFG.datei } } }] : [];
      return json(200, u.searchParams.get('page') === '1' ? l : []);
    }
    if (u.pathname === '/gists' && m === 'POST') {
      if ((f.anlegen || 201) !== 201) return json(f.anlegen, { message: 'Not Found' });
      return json(201, { id: 'NEU' });
    }
    return route.abort();
  });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  const fragen = [];
  page.on('dialog', (d) => { fragen.push(d.message()); if (f.antwort) d.accept(); else d.dismiss(); });
  await page.goto(base + '/' + SEITE);
  await page.waitForTimeout(300);
  anfragen.length = 0;          // nur der Verbindungsversuch zaehlt
  const r = await page.evaluate(async ([tok, key, zusatz]) => {
    if (zusatz) GithubZugang.einrichten({ ...GithubZugang.konfiguration(), zusatz });
    const meldungen = [];
    const erg = await GithubZugang.verbinden(tok, {
      melden: (t, o) => meldungen.push({ t, fehler: !!(o && o.isError), detail: o && o.detail ? JSON.stringify(o.detail) : '' })
    });
    return { ok: erg.ok, gistId: erg.gistId || null, meldungen,
             token: localStorage.getItem('gh_token'), gid: localStorage.getItem(key) };
  }, [f.token || 'ghp_test', CFG.gistIdKey, f.zusatz || null]);
  await ctx.close();
  return { ...r, anfragen, fragen, fehler, letzte: r.meldungen[r.meldungen.length - 1] || { t: '' } };
}

const VORHER = () => ({ gh_token: 'alt' });

try {

// ---------------------------------------------------------------------------
suite('Ein Baustein, an einer Stelle');

await test('github-zugang.js ist wortgleich mit gt40 und jerico (Pruefsumme)', async () => {
  const t = fs.readFileSync(path.join(REPO_ROOT, 'github-zugang.js'), 'utf8').replace(/\r\n/g, '\n');
  const summe = crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
  assertEqual(summe, WORTGLEICH, 'Baustein geaendert - in allen drei Repos uebernehmen und WORTGLEICH ueberall ersetzen');
});

await test('nur der Baustein speichert den Token und sucht oder legt Gists an', async () => {
  // Bis v26 stand das in jeder App selbst, in gt40 dreimal - mit Fehlern,
  // die nur in einer Kopie behoben waren.
  const dateien = fs.readdirSync(REPO_ROOT).filter((d) => /\.(html|js)$/.test(d) && d !== 'github-zugang.js');
  const treffer = [];
  for (const d of dateien) {
    const t = fs.readFileSync(path.join(REPO_ROOT, d), 'utf8');
    if (/setItem\(\s*['"]gh_token['"]/.test(t)) treffer.push(d + ': speichert gh_token');
    if (/function\s+(findGistByFilename|createGist)\b/.test(t)) treffer.push(d + ': eigene Gist-Suche');
    if (/api\.github\.com\/gists['"]\s*,\s*\{\s*method:\s*['"]POST/.test(t)) treffer.push(d + ': legt Gist an');
  }
  assertEqual(treffer, [], 'Verbinden ausserhalb des Bausteins');
});

await test('jede Seite mit Token-Feld laedt den Baustein und zeigt die Vorgabe', async () => {
  const seiten = fs.readdirSync(REPO_ROOT).filter((d) => d.endsWith('.html')
    && fs.readFileSync(path.join(REPO_ROOT, d), 'utf8').includes('id="ghToken"'));
  assert(seiten.length > 0, 'keine Seite mit Token-Feld gefunden');
  const fehlt = [];
  for (const s of seiten) {
    const ctx = await neuerKontext(browser);
    const page = await ctx.newPage();
    await page.goto(base + '/' + s);
    await page.waitForTimeout(200);
    const v = await page.evaluate(() => [...document.querySelectorAll('[data-token-vorgabe]')].map((e) => e.innerHTML).join('|'));
    await ctx.close();
    if (!/gist/.test(v) || !/tokens\/new/.test(v)) fehlt.push(s + ': "' + v.slice(0, 60) + '"');
  }
  assertEqual(fehlt, [], 'Seiten ohne Vorgabe');
});

// ---------------------------------------------------------------------------
suite('Erst pruefen, dann suchen');

await test('klassischer Token ohne Pflicht-Haken: nichts weiter versucht, nichts gespeichert', async () => {
  const r = await lauf({ haken: 'read:org', vorher: VORHER() });
  assertEqual(r.ok, false, 'verbunden');
  assertEqual(r.anfragen, ['GET /user'], 'Anfragen nach der Pruefung');
  assertEqual(r.token, 'alt', 'Der alte Token wurde ueberschrieben');
  assert(/Konto pahlborn/.test(r.letzte.t) && /Haken: read:org/.test(r.letzte.t), 'Meldung nennt Konto/Haken nicht: ' + r.letzte.t);
  assert(/"gist"/.test(r.letzte.t) && /Tokens \(classic\)/.test(r.letzte.t), 'Meldung nennt den Weg nicht: ' + r.letzte.t);
  assert(r.letzte.fehler && /"haken"/.test(r.letzte.detail), 'Nicht als Fehler mit Detail gemeldet');
});

await test('Suche scheitert: kein Anlegen, nichts gespeichert, Grund in der Meldung', async () => {
  const r = await lauf({ liste: 403, vorher: VORHER() });
  assertEqual(r.ok, false, 'verbunden');
  assert(!r.anfragen.includes('POST /gists'), 'Nach gescheiterter Suche angelegt');
  assertEqual(r.token, 'alt', 'Token ueberschrieben');
  assert(/403/.test(r.letzte.t) && /Resource not accessible/.test(r.letzte.t), 'Meldung: ' + r.letzte.t);
});

await test('vorhandener Datenspeicher wird gefunden, nichts angelegt', async () => {
  const r = await lauf({ vorhanden: true, bekannt: CFG.bekannteId ? { owner: 'pahlborn' } : undefined });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  assert(!r.anfragen.includes('POST /gists'), 'angelegt, obwohl vorhanden');
  assertEqual(r.gid, CFG.bekannteId || 'VORHANDEN', 'Gist-ID');
  assertEqual(r.token, 'ghp_test', 'Token nicht gespeichert');
  assert(/^Verbunden: Konto pahlborn, klassischer Token, Haken: gist/.test(r.letzte.t), 'Meldung: ' + r.letzte.t);
});

await test('eine gespeicherte ID wird zuerst geprueft, die Liste nicht gebraucht', async () => {
  const r = await lauf({ vorher: { [CFG.gistIdKey]: 'GESPEICHERT' }, bekannt: { owner: 'pahlborn' } });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  assertEqual(r.gid, 'GESPEICHERT', 'Gist-ID');
  assert(!r.anfragen.includes('GET /gists'), 'Liste trotzdem gelesen: ' + r.anfragen);
});

await test('Datenspeicher eines anderen Kontos: nicht verbunden, beide Konten genannt', async () => {
  const r = await lauf({ vorher: { ...VORHER(), [CFG.gistIdKey]: 'GESPEICHERT' }, bekannt: { owner: 'jemand' } });
  assertEqual(r.ok, false, 'verbunden');
  assertEqual(r.token, 'alt', 'Token ueberschrieben');
  assert(/Konto jemand/.test(r.letzte.t) && /pahlborn/.test(r.letzte.t), 'Meldung: ' + r.letzte.t);
});

// ---------------------------------------------------------------------------
suite('Neu anlegen nur nach Rueckfrage');

await test('nichts da, Rueckfrage abgebrochen: nichts angelegt, nichts gespeichert', async () => {
  const r = await lauf({ antwort: false, vorher: VORHER() });
  assertEqual(r.fragen.length, 1, 'keine Rueckfrage');
  assert(/Neu anlegen\?/.test(r.fragen[0]) && /Konto pahlborn/.test(r.fragen[0]), 'Rueckfrage: ' + r.fragen[0]);
  assert(!r.anfragen.includes('POST /gists'), 'trotz Abbruch angelegt');
  assertEqual(r.token, 'alt', 'Token ueberschrieben');
});

await test('nichts da, Rueckfrage bestaetigt: angelegt und gespeichert', async () => {
  const r = await lauf({ antwort: true });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  assertEqual(r.anfragen.filter((a) => a === 'POST /gists').length, 1, 'Anlegen');
  assertEqual([r.gid, r.token], ['NEU', 'ghp_test'], 'gespeichert');
});

await test('Anlegen verweigert: Grund genannt, nichts gespeichert', async () => {
  const r = await lauf({ antwort: true, anlegen: 403, vorher: VORHER() });
  assertEqual(r.ok, false, 'verbunden');
  assertEqual(r.token, 'alt', 'Token ueberschrieben');
  assert(/angelegt/.test(r.letzte.t) && /403/.test(r.letzte.t) && /"gist"/.test(r.letzte.t), 'Meldung: ' + r.letzte.t);
});

// ---------------------------------------------------------------------------
suite('Haken und Token-Arten');

const FOTOS = { public_repo: 'Fotos hochladen' };

await test('genau die Pflicht-Haken genuegen; die App verlangt nur, was sie braucht', async () => {
  const r = await lauf({ haken: CFG.pflicht.join(', '), vorhanden: true, bekannt: CFG.bekannteId ? { owner: 'pahlborn' } : undefined });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  for (const h of Object.keys(CFG.zusatz)) {
    assert(r.letzte.t.includes('"' + h + '" fehlt'), 'Zusatz ' + h + ' nicht genannt: ' + r.letzte.t);
  }
  if (!Object.keys(CFG.zusatz).length) assert(!/fehlt/.test(r.letzte.t), 'Warnung ohne Grund: ' + r.letzte.t);
});

await test('fehlt ein Zusatz-Haken, wird verbunden und genannt, wofuer er fehlt', async () => {
  const r = await lauf({ haken: 'gist', vorhanden: true, zusatz: FOTOS, bekannt: CFG.bekannteId ? { owner: 'pahlborn' } : undefined });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  assert(/Fotos hochladen geht mit diesem Token nicht: Haken "public_repo" fehlt/.test(r.letzte.t), 'Meldung: ' + r.letzte.t);
});

await test('"repo" deckt "public_repo" ab', async () => {
  const r = await lauf({ haken: 'gist, repo', vorhanden: true, zusatz: FOTOS, bekannt: CFG.bekannteId ? { owner: 'pahlborn' } : undefined });
  assertEqual(r.ok, true, 'nicht verbunden: ' + r.letzte.t);
  assert(!/fehlt/.test(r.letzte.t), 'Warnung trotz repo: ' + r.letzte.t);
});

await test('fine-grained Token: Rueckfrage nennt die fehlende Gists-Berechtigung', async () => {
  const r = await lauf({ token: 'github_pat_test', haken: null, antwort: false });
  assertEqual(r.fragen.length, 1, 'keine Rueckfrage');
  assert(/fine-grained/.test(r.fragen[0]) && /Gists/.test(r.fragen[0]), 'Rueckfrage: ' + r.fragen[0]);
});

await test('der Dialog verbindet ueber den Baustein, ohne Seitenfehler', async () => {
  const ctx = await neuerKontext(browser);
  await ctx.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const json = (status, body, extra = {}) => route.fulfill({ status, headers: { ...CORS, ...extra }, contentType: 'application/json', body: JSON.stringify(body) });
    if (u.pathname === '/user') return json(200, { login: 'pahlborn' }, { 'x-oauth-scopes': 'gist, public_repo' });
    if (u.pathname === '/gists' && req.method() === 'GET') return json(200, u.searchParams.get('page') === '1' ? [{ id: 'VORHANDEN', files: { [CFG.datei]: {} } }] : []);
    if (u.pathname.startsWith('/gists/') && req.method() === 'GET') {
      // Eine bekannte ID (gt40) wird direkt gefunden; der Inhalt ist leer.
      return json(200, { id: u.pathname.split('/')[2], owner: { login: 'pahlborn' },
                         files: { [CFG.datei]: { filename: CFG.datei, content: '{}' } } });
    }
    return route.abort();
  });
  const page = await ctx.newPage();
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  await page.goto(base + '/' + SEITE);
  await page.waitForTimeout(300);
  const r = await page.evaluate(async (key) => {
    openSettings();
    document.getElementById('ghToken').value = 'ghp_test';
    await saveSettings();
    const sm = document.getElementById('settingsModal');
    return { gid: localStorage.getItem(key), token: localStorage.getItem('gh_token'),
             zu: !sm || getComputedStyle(sm).display === 'none' || !sm.classList.contains('open') };
  }, CFG.gistIdKey);
  await page.waitForTimeout(300);
  await ctx.close();
  assertEqual([r.gid, r.token], [CFG.bekannteId || 'VORHANDEN', 'ghp_test'], 'Nicht verbunden');
  assertEqual(fehler, [], 'Seitenfehler');
});

} finally {
  await browser.close();
  server.close();
}

process.exit(summary() === 0 ? 0 : 1);
