/**
 * findings.js - Befunde pro Kapitel und der Kapitelstatus.
 *
 * Wird von build-log.html benutzt. Muss VOR dem Inline-Script geladen werden.
 *
 * Warum eine eigene Datei statt Feldern
 * -------------------------------------
 * Ein Kapitel hatte genau eine Zeile fuer Befunde. Bei einer Sichtpruefung
 * faellt aber selten genau eine Sache auf, und jede davon hat ihren eigenen
 * Verlauf: bestellt, eingetroffen, verbaut. Eine feste Zeile kann das nicht.
 *
 * Befunde sind darum eine Liste mit eigener Identitaet je Eintrag - genau wie
 * die Galerie-Metadaten. Damit gilt derselbe Grundsatz: adressiert wird per
 * Schluessel, niemals per Position, und beim Zusammenfuehren gewinnt pro
 * Eintrag der juengere Zeitstempel. Ein geloeschter Eintrag bekommt einen
 * Grabstein, sonst taucht er beim naechsten Sync wieder auf.
 *
 * Die Seite muss bereitstellen: getGistConfig(), FIXED_GIST_ID
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'engineFindings';
  var GIST_FILE = 'engine-build-findings.json';

  // Kapitelstatus - dieselben Stufen wie ein Befund, damit die Anzeige
  // ueberall dasselbe bedeutet.
  var STATUS = ['', 'wip', 'done'];
  var STATUS_LABEL = {
    '': { de: 'offen', en: 'open' },
    'wip': { de: 'in Arbeit', en: 'in progress' },
    'done': { de: 'erledigt', en: 'done' }
  };

  var _data = { version: 1, items: {} };
  var _pushTimer = null;

  function now() { return Date.now(); }

  function newId() {
    return 'f' + now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Alte Wahrheitswerte auf die neuen Stufen abbilden. */
  function normalizeStatus(v) {
    if (v === true || v === 'true' || v === 'on' || v === 'done') return 'done';
    if (v === 'wip') return 'wip';
    return '';
  }

  function nextStatus(v) {
    var i = STATUS.indexOf(normalizeStatus(v));
    return STATUS[(i + 1) % STATUS.length];
  }

  function statusLabel(v, lang) {
    var s = STATUS_LABEL[normalizeStatus(v)] || STATUS_LABEL[''];
    return lang === 'en' ? s.en : s.de;
  }

  // ---- Speicher ----

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.items) _data = { version: 1, items: parsed.items, savedAt: parsed.savedAt };
      }
    } catch (e) { console.warn('[Befunde] Lesefehler:', e.message); }
    return _data;
  }

  function save() {
    _data.savedAt = now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_data)); }
    catch (e) { console.error('[Befunde] Speicherfehler:', e.message); }
  }

  /** Pro Schluessel gewinnt der juengere Eintrag. Ein Grabstein bleibt ein Grabstein. */
  function merge(a, b) {
    var out = { version: 1, items: {} };
    var k;
    for (k in (a.items || {})) out.items[k] = a.items[k];
    for (k in (b.items || {})) {
      var cur = out.items[k], next = b.items[k];
      if (!cur || (next.m || 0) >= (cur.m || 0)) out.items[k] = next;
    }
    out.savedAt = Math.max(a.savedAt || 0, b.savedAt || 0) || undefined;
    return out;
  }

  function scheduleSync() {
    save();
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(push, 800);
  }

  async function push() {
    var cfg = typeof getGistConfig === 'function' ? getGistConfig() : { token: '' };
    if (!cfg.token) return false;
    try {
      var res = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID,
        { headers: { 'Authorization': 'Bearer ' + cfg.token } });
      if (res.ok) {
        var gist = await res.json();
        var f = gist.files && gist.files[GIST_FILE];
        if (f && f.content) _data = merge(JSON.parse(f.content), _data);
      }
    } catch (e) { console.warn('[Befunde] Cloud-Stand nicht lesbar:', e.message); }
    save();
    try {
      var files = {};
      files[GIST_FILE] = { content: JSON.stringify(_data) };
      var wr = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: files })
      });
      if (!wr.ok) { console.error('[Befunde] Sync fehlgeschlagen:', wr.status); return false; }
      return true;
    } catch (e) { console.error('[Befunde] Sync-Fehler:', e.message); return false; }
  }

  /** Cloud-Stand hereinholen. Gibt true zurueck, wenn sich etwas geaendert hat. */
  async function pull(gist, token) {
    try {
      var content = typeof _readGistFile === 'function'
        ? await _readGistFile(gist, GIST_FILE, token)
        : (gist.files && gist.files[GIST_FILE] ? gist.files[GIST_FILE].content : null);
      if (!content) return false;
      var before = JSON.stringify(_data.items);
      _data = merge(JSON.parse(content), _data);
      save();
      return JSON.stringify(_data.items) !== before;
    } catch (e) { console.error('[Befunde] Parse-Fehler:', e.message); return false; }
  }

  // ---- Zugriff ----

  function forChapter(chapter) {
    var out = [];
    for (var id in _data.items) {
      var it = _data.items[id];
      if (!it || it.del || it.ch !== chapter) continue;
      out.push(Object.assign({ id: id }, it));
    }
    out.sort(function (x, y) { return (x.created || 0) - (y.created || 0); });
    return out;
  }

  function all(filter) {
    var out = [];
    for (var id in _data.items) {
      var it = _data.items[id];
      if (!it || it.del) continue;
      if (filter && filter.indexOf(normalizeStatus(it.status)) === -1) continue;
      out.push(Object.assign({ id: id }, it));
    }
    out.sort(function (x, y) { return (x.created || 0) - (y.created || 0); });
    return out;
  }

  function counts(chapter) {
    var c = { open: 0, wip: 0, done: 0, total: 0 };
    var list = chapter === undefined ? all() : forChapter(chapter);
    list.forEach(function (it) {
      var s = normalizeStatus(it.status);
      c[s === '' ? 'open' : s]++;
      c.total++;
    });
    return c;
  }

  function add(chapter, text) {
    var id = newId();
    var t = now();
    _data.items[id] = { ch: chapter, text: text || '', status: '', created: t, m: t };
    scheduleSync();
    return id;
  }

  function update(id, patch) {
    var it = _data.items[id];
    if (!it || it.del) return false;
    for (var k in patch) it[k] = patch[k];
    it.m = now();
    scheduleSync();
    return true;
  }

  function remove(id) {
    var it = _data.items[id];
    if (!it) return false;
    // Grabstein statt Loeschen - sonst kommt der Eintrag beim naechsten Merge zurueck.
    _data.items[id] = { ch: it.ch, del: true, m: now() };
    scheduleSync();
    return true;
  }

  /** Einmalige Uebernahme der alten Einzelzeile pro Kapitel. */
  function importLegacyNote(chapter, text, when) {
    if (!text || !String(text).trim()) return null;
    var existing = forChapter(chapter);
    for (var i = 0; i < existing.length; i++) {
      if (existing[i].text === text) return null;      // schon uebernommen
    }
    var id = newId();
    var t = when || now();
    _data.items[id] = { ch: chapter, text: text, status: '', created: t, m: t, fromNote: true };
    return id;
  }

  global.Findings = {
    STATUS: STATUS,
    STORAGE_KEY: STORAGE_KEY,
    GIST_FILE: GIST_FILE,
    normalizeStatus: normalizeStatus,
    nextStatus: nextStatus,
    statusLabel: statusLabel,
    load: load,
    save: save,
    merge: merge,
    scheduleSync: scheduleSync,
    push: push,
    pull: pull,
    forChapter: forChapter,
    all: all,
    counts: counts,
    add: add,
    update: update,
    remove: remove,
    importLegacyNote: importLegacyNote,
    _raw: function () { return _data; },
    _set: function (d) { _data = d; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
