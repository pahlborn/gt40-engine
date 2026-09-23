/**
 * gallery.js - Komponenten-Galerie (Galerie v3).
 *
 * Gemeinsam genutzt von specs.html und build-log.html. Muss VOR dem
 * Inline-Script der Seite geladen werden.
 *
 * Grundsatz: das Repo sagt, welche Bilder existieren (Git-Trees-API, ein
 * Request fuer alle Gruppen, ohne Token). Der Gist traegt nur Metadaten -
 * Beschreibung, Aufnahmezeit, Reihenfolge, Hauptbild, YouTube - adressiert
 * per Dateiname, niemals per Array-Index.
 *
 * Die Seite muss bereitstellen:
 *   showToast(text), getGistConfig(), FIXED_GIST_ID
 *   updateSaveStatus()   - optional, fuer das Datum in der Kopfzeile
 *
 * Bildgruppen kommen aus dem Markup: [data-comp-gallery="<gruppe>"].
 */

// ==== KONFIGURATION ====
var REPO_OWNER = 'pahlborn';
var REPO_NAME = 'gt40-engine';
var REPO_BRANCH = 'main';
var PHOTO_MAX_PER_GROUP = 20;
var PHOTO_MAX_BYTES = 500 * 1024;              // 500 KB pro Foto
var GIST_PHOTOS_FILE = 'engine-build-photos.json';
var GALLERY_META_KEY = 'engineGalleryMeta';    // lokaler Metadaten-Cache
var GALLERY_TREE_KEY = 'engineGalleryTree';    // lokaler Offline-Cache des Repo-Listings
var GALLERY_DIR = 'img/user/';
var TREE_MAX_AGE_MS = 60 * 1000;               // Repo-Listing hoechstens 1x/Minute neu holen

// Gist-Datei lesen und Truncation (>1 MB) aufloesen
async function _readGistFile(gist, name, token) {
    var f = gist.files ? gist.files[name] : null;
    if (!f) return null;
    var content = f.content;
    if (f.truncated && f.raw_url) {
        var h = token ? { 'Authorization': 'Bearer ' + token } : {};
        var r = await fetch(f.raw_url, { headers: h });
        if (r.ok) content = await r.text();
    }
    return content || null;
}

// ==== PHOTOS ====
// photoData wird NICHT mehr persistiert. Es ist eine abgeleitete Ansicht aus
//   (a) dem Repo-Listing  -> welche Bilder existieren  (Wahrheit)
//   (b) _galleryMeta      -> Caption/Zeit/Reihenfolge/Hero/YouTube (Beiwerk)
let photoData = {};

// ==== GALERIE: REPO = WAHRHEIT ====
// Schema v2. Alles per Key adressiert, niemals per Array-Index - damit ein
// Merge zwischen zwei Geraeten nichts verlieren kann.
//   meta['<group>/<datei>.jpg'] = { caption, time, order, m }
//   videos['<group>']['<ytid>'] = { caption, time, order, m, del? }
//   hero['<group>']             = { type:'user', key } | { type:'default', idx } (+ m)
var _galleryMeta = { version: 2, meta: {}, videos: {}, hero: {} };
var _repoFiles = {};          // { group: [filename, ...] }
var _treeEtag = '';
var _treeFetchedAt = 0;
var _gistOk = false;
var _gistError = '';
var _treeInFlight = null;   // parallele Aufrufe teilen sich einen Request
var _treeHeadersBlocked = false;  // Preflight unterwegs geblockt? dann gar nicht erst senden
// Eventual consistency: das Repo-Listing hinkt einem frischen Commit kurz hinterher.
var PENDING_TTL_MS = 180 * 1000;
var _pendingAdds = {};        // key -> { url, time, until }
var _pendingDeletes = {};     // key -> until

function _nowMs() { return Date.now(); }

function _normalizeMeta(raw) {
    var out = { version: 2, meta: {}, videos: {}, hero: {} };
    if (!raw || typeof raw !== 'object') return out;
    if (raw.version === 2) {
        out.meta = raw.meta || {};
        out.videos = raw.videos || {};
        out.hero = raw.hero || {};
        if (raw.savedAt) out.savedAt = raw.savedAt;
        return out;
    }
    // --- Migration aus Schema v1 ---
    // v1: { photos: { group: [{data,caption,time,type}] }, heroSelection: { group:{type,idx} } }
    var stamp = 1; // aelter als alles Neue: v2-Eintraege gewinnen bei Konflikt
    var photos = raw.photos || {};
    for (var g in photos) {
        var arr = photos[g] || [];
        for (var i = 0; i < arr.length; i++) {
            var p = arr[i] || {};
            if (p.type === 'youtube') {
                if (!p.data) continue;
                if (!out.videos[g]) out.videos[g] = {};
                out.videos[g][p.data] = { caption: p.caption || '', time: p.time || '', order: i, m: stamp };
            } else {
                var k = _keyFromUrl(p.data);
                if (!k) continue;
                out.meta[k] = { caption: p.caption || '', time: p.time || '', order: i, m: stamp };
            }
        }
    }
    var hs = raw.heroSelection || {};
    for (var g2 in hs) {
        var h = hs[g2] || {};
        if (h.type === 'default') { out.hero[g2] = { type: 'default', idx: h.idx || 0, m: stamp }; }
        else if (h.type === 'user') {
            var list = photos[g2] || [];
            var hp = list[h.idx];
            var hk = hp ? (hp.type === 'youtube' ? 'yt:' + hp.data : _keyFromUrl(hp.data)) : null;
            if (hk) out.hero[g2] = { type: 'user', key: hk, m: stamp };
        }
    }
    return out;
}

// 'https://raw.githubusercontent.com/owner/repo/main/img/user/shortblock/x.jpg' -> 'shortblock/x.jpg'
function _keyFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    var i = url.indexOf(GALLERY_DIR);
    if (i === -1) return null;
    var rest = url.substring(i + GALLERY_DIR.length).split('?')[0];
    return rest.indexOf('/') === -1 ? null : rest;
}
function _urlFromKey(key) {
    return 'https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/' + REPO_BRANCH + '/' + GALLERY_DIR + key;
}

// Per-Key-Merge: der juengere Eintrag gewinnt. Ein fehlender Key bedeutet
// "keine Caption", niemals "Foto weg".
function _mergeEntryMap(a, b) {
    var out = {};
    var k;
    for (k in a) out[k] = a[k];
    for (k in b) {
        if (!out[k] || (b[k].m || 0) >= (out[k].m || 0)) out[k] = b[k];
    }
    return out;
}
function _mergeMeta(a, b) {
    var out = { version: 2, meta: {}, videos: {}, hero: {} };
    out.meta = _mergeEntryMap(a.meta || {}, b.meta || {});
    var groups = {}, g;
    for (g in (a.videos || {})) groups[g] = 1;
    for (g in (b.videos || {})) groups[g] = 1;
    for (g in groups) out.videos[g] = _mergeEntryMap((a.videos || {})[g] || {}, (b.videos || {})[g] || {});
    out.hero = _mergeEntryMap(a.hero || {}, b.hero || {});
    out.savedAt = Math.max(a.savedAt || 0, b.savedAt || 0) || undefined;
    return out;
}

function loadGalleryMeta() {
    try {
        var d = localStorage.getItem(GALLERY_META_KEY);
        if (d) { _galleryMeta = _normalizeMeta(JSON.parse(d)); return; }
    } catch(e) {}
    // Einmalige Uebernahme der alten, index-basierten Daten
    try {
        var legacy = { photos: {}, heroSelection: {} };
        var op = localStorage.getItem('engineBuildPhotos');
        if (op) legacy.photos = JSON.parse(op);
        var oh = localStorage.getItem('engineBuildHeroSelection');
        if (oh) legacy.heroSelection = JSON.parse(oh);
        _galleryMeta = _normalizeMeta(legacy);
        if (Object.keys(_galleryMeta.meta).length) console.log('[Galerie] Alt-Metadaten uebernommen:', Object.keys(_galleryMeta.meta).length);
    } catch(e) { _galleryMeta = { version: 2, meta: {}, videos: {}, hero: {} }; }
}
function saveGalleryMeta() {
    try { localStorage.setItem(GALLERY_META_KEY, JSON.stringify(_galleryMeta)); }
    catch(e) { console.error('[Galerie] Metadaten nicht speicherbar:', e); }
}

// Schreibt die Metadaten in den Gist - vorher immer gegen den Cloud-Stand mergen,
// damit parallele Aenderungen auf zwei Geraeten sich nicht gegenseitig loeschen.
var _metaPushTimer = null;
function scheduleMetaPush() {
    _galleryMeta.savedAt = _nowMs();
    saveGalleryMeta();
    updateSaveStatus();          // sonst bliebe das Datum im Header beim Foto-Speichern stehen
    clearTimeout(_metaPushTimer);
    _metaPushTimer = setTimeout(function() { pushGalleryMeta(); }, 800);
}
async function pushGalleryMeta() {
    var t = getGistConfig().token;
    if (!t) { console.warn('[Galerie] Kein Token - Metadaten bleiben lokal'); return false; }
    try {
        var res = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID, { headers: { 'Authorization': 'Bearer ' + t } });
        if (res.ok) {
            var gist = await res.json();
            var content = await _readGistFile(gist, GIST_PHOTOS_FILE, t);
            if (content) _galleryMeta = _mergeMeta(_normalizeMeta(JSON.parse(content)), _galleryMeta);
        }
    } catch(e) { console.warn('[Galerie] Cloud-Stand nicht lesbar, schreibe lokalen Stand:', e.message); }
    _pruneOrphanMeta();
    _galleryMeta.version = 2;
    saveGalleryMeta();
    try {
        var payload = {};
        payload[GIST_PHOTOS_FILE] = { content: JSON.stringify(_galleryMeta) };
        var wr = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID, {
            method: 'PATCH',
            headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: payload })
        });
        if (!wr.ok) { console.error('[Galerie] Metadaten-Sync fehlgeschlagen:', wr.status); return false; }
        console.log('[Galerie] Metadaten-Sync OK');
        return true;
    } catch(e) { console.error('[Galerie] Metadaten-Sync-Fehler:', e.message); return false; }
}

// Metadaten zu Dateien, die es im Repo nicht mehr gibt, wegwerfen.
// Bewusst vorsichtig: ein frischer Upload von einem anderen Geraet darf hier
// nicht mit weggeraeumt werden, nur weil unser Listing ihn noch nicht kennt.
var PRUNE_GRACE_MS = 10 * 60 * 1000;
function _pruneOrphanMeta() {
    // Nur mit einem wirklich aktuellen Listing aufraeumen
    if (!_treeFetchedAt || (_nowMs() - _treeFetchedAt) > TREE_MAX_AGE_MS) return;
    if (!Object.keys(_repoFiles).length) return;
    var cutoff = _nowMs() - PRUNE_GRACE_MS;
    var removed = 0;
    for (var key in _galleryMeta.meta) {
        var e = _galleryMeta.meta[key];
        if (!e || (e.m || 0) > cutoff) continue;    // zu jung -> Schonfrist
        if (e.ref) {
            // Verweis auf eine fremde Datei: nur wegraeumen, wenn die weg ist.
            var rs = e.ref.indexOf('/');
            var rg = e.ref.slice(0, rs), rf = e.ref.slice(rs + 1);
            if (_repoFiles[rg] && _repoFiles[rg].indexOf(rf) === -1) {
                delete _galleryMeta.meta[key]; removed++;
            }
            continue;
        }
        var slash = key.indexOf('/');
        if (slash <= 0) continue;
        var g = key.substring(0, slash), f = key.substring(slash + 1);
        if (!_repoFiles[g]) continue;               // Gruppe unbekannt -> Finger weg
        if (_pendingAdds[key]) continue;            // Upload noch nicht im Listing
        if (_repoFiles[g].indexOf(f) === -1) { delete _galleryMeta.meta[key]; removed++; }
    }
    if (removed) console.log('[Galerie] Verwaiste Metadaten entfernt:', removed);
}

// Ein einziger Request liefert das komplette Repo-Listing aller Gruppen.
// Funktioniert auch ohne Token (oeffentliches Repo); mit Token hoeheres Rate-Limit.
async function fetchRepoTree(force) {
    var age = _treeFetchedAt ? (_nowMs() - _treeFetchedAt) : Infinity;
    var haveData = Object.keys(_repoFiles).length > 0;
    // Ohne Token sind nur 60 Requests/Stunde erlaubt -> auch ein erzwungener
    // Refresh haelt einen Mindestabstand ein.
    if (haveData && age < (force ? 10000 : TREE_MAX_AGE_MS)) return _repoFiles;
    if (_treeInFlight) return _treeInFlight;
    _treeInFlight = _fetchRepoTreeInner();
    try { return await _treeInFlight; } finally { _treeInFlight = null; }
}
async function _fetchRepoTreeInner() {
    var cached = null;
    try { var c = localStorage.getItem(GALLERY_TREE_KEY); if (c) cached = JSON.parse(c); } catch(e) {}
    if (cached && cached.etag && !_treeEtag) _treeEtag = cached.etag;

    var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/git/trees/' + REPO_BRANCH + '?recursive=1';
    var headers = {};
    if (!_treeHeadersBlocked) {
        var tok = getGistConfig().token;
        if (tok) headers['Authorization'] = 'Bearer ' + tok;   // nur fuers Rate-Limit, Repo ist oeffentlich
        if (_treeEtag) headers['If-None-Match'] = _treeEtag;   // 304 zaehlt nicht aufs Rate-Limit
    }
    try {
        var res;
        try {
            res = await fetch(url, { headers: headers });
        } catch (headerErr) {
            // Authorization und If-None-Match loesen einen CORS-Preflight aus.
            // Wird der irgendwo unterwegs geblockt, lieber ohne Zusatz-Header
            // erneut fragen als die Galerie auf dem Cache einfrieren zu lassen.
            if (!Object.keys(headers).length) throw headerErr;
            console.warn('[Galerie] Request mit Zusatz-Headern blockiert - erneuter Versuch ohne');
            _treeHeadersBlocked = true; _treeEtag = '';
            res = await fetch(url);
        }
        if (res.status === 304 && cached && cached.files) {
            _repoFiles = cached.files; _treeFetchedAt = _nowMs();
            return _repoFiles;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var et = res.headers.get('ETag'); if (et) _treeEtag = et;
        var data = await res.json();
        if (data.truncated) console.warn('[Galerie] Repo-Listing gekuerzt - Galerie evtl. unvollstaendig');
        var files = {};
        (data.tree || []).forEach(function(e) {
            if (e.type !== 'blob' || e.path.indexOf(GALLERY_DIR) !== 0) return;
            var rest = e.path.substring(GALLERY_DIR.length);
            var slash = rest.indexOf('/');
            if (slash <= 0) return;
            var g = rest.substring(0, slash), f = rest.substring(slash + 1);
            if (!f || f.indexOf('/') !== -1) return;   // keine Unterordner
            if (!files[g]) files[g] = [];
            files[g].push(f);
        });
        _repoFiles = files; _treeFetchedAt = _nowMs();
        try { localStorage.setItem(GALLERY_TREE_KEY, JSON.stringify({ etag: _treeEtag, files: files, ts: _treeFetchedAt })); } catch(e) {}
        return _repoFiles;
    } catch (err) {
        console.warn('[Galerie] Repo-Listing nicht erreichbar (' + err.message + ') - nutze Cache');
        if (cached && cached.files) { _repoFiles = cached.files; return _repoFiles; }
        return _repoFiles;
    }
}

function _prunePending() {
    var now = _nowMs(), k;
    for (k in _pendingAdds) if (_pendingAdds[k].until < now) delete _pendingAdds[k];
    for (k in _pendingDeletes) if (_pendingDeletes[k] < now) delete _pendingDeletes[k];
}

// Dateinamen fuer das Repo: Zeitstempel gegen Kollisionen, danach der
// Originalname. So steht er auch dann noch da, wenn die Metadaten fehlen.
function _safeFileName(orig) {
    var base = String(orig || '').replace(/\.[^.]*$/, '');
    base = base.normalize ? base.normalize('NFKD') : base;
    base = base.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (base.length > 48) base = base.slice(0, 48);
    return base || 'foto';
}

// SHA-256 ueber die Bilddaten. Damit lassen sich Doubletten erkennen, statt
// dieselbe Datei mehrfach im Repo abzulegen.
async function _sha256OfDataUrl(dataUrl) {
    try {
        if (!global_crypto_subtle()) return null;
        var b64 = String(dataUrl).split(',')[1] || '';
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var buf = await global_crypto_subtle().digest('SHA-256', bytes);
        return Array.from(new Uint8Array(buf))
            .map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
    } catch (e) { console.warn('[Galerie] Pruefsumme nicht berechenbar:', e.message); return null; }
}
function global_crypto_subtle() {
    return (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle : null;
}

// Alle Metadaten-Eintraege mit dieser Pruefsumme - gruppenuebergreifend.
function _findBySha(sha) {
    var out = [];
    if (!sha) return out;
    for (var key in _galleryMeta.meta) {
        var e = _galleryMeta.meta[key];
        if (e && !e.del && e.sha === sha) out.push({ key: key, entry: e });
    }
    return out;
}

// Auf welche Repo-Datei zeigt ein Eintrag? Ein Verweis zeigt auf eine fremde.
function _targetOf(key) {
    var e = _galleryMeta.meta[key];
    return (e && e.ref) ? e.ref : key;
}

// Verweise, die auf diese Repo-Datei zeigen.
function _refsTo(target) {
    var out = [];
    for (var key in _galleryMeta.meta) {
        var e = _galleryMeta.meta[key];
        if (!e || e.del || !e.ref) continue;
        if (e.ref === target) out.push(key);
    }
    return out;
}

// Wie viele Galerie-Eintraege zeigen auf diese Datei? Die Datei selbst zaehlt
// mit, solange sie im Repo liegt. Erst bei 0 darf sie geloescht werden.
function _refCount(target) {
    var slash = target.indexOf('/');
    var g = target.slice(0, slash), f = target.slice(slash + 1);
    var selbst = (_repoFiles[g] && _repoFiles[g].indexOf(f) !== -1 && !_pendingDeletes[target]) ? 1 : 0;
    return selbst + _refsTo(target).length;
}

// Aus Datei 'annotated_1789838216411.jpg' oder '1789838216411_3.jpg' den Zeitstempel ziehen
function _tsFromFilename(f) {
    var m = String(f).match(/(\d{10,16})/);
    return m ? parseInt(m[1], 10) : 0;
}

// Baut photoData neu auf: Repo-Dateien + Metadaten + YouTube. Verliert nichts,
// weil nichts aus einer gespeicherten Liste kommt.
function rebuildPhotoData() {
    _prunePending();
    var result = {};
    var groups = {}, g;
    for (g in _repoFiles) groups[g] = 1;
    for (g in (_galleryMeta.videos || {})) groups[g] = 1;
    document.querySelectorAll('[data-comp-gallery]').forEach(function(st) { groups[st.dataset.compGallery] = 1; });
    for (var k in _pendingAdds) groups[k.split('/')[0]] = 1;

    Object.keys(groups).forEach(function(group) {
        var seen = {};
        var items = [];
        var files = (_repoFiles[group] || []).slice();
        // Uploads, die das Listing noch nicht kennt
        for (var pk in _pendingAdds) {
            if (pk.indexOf(group + '/') === 0) {
                var pf = pk.substring(group.length + 1);
                if (files.indexOf(pf) === -1) files.push(pf);
            }
        }
        files.forEach(function(f) {
            var key = group + '/' + f;
            if (_pendingDeletes[key]) return;       // gerade geloescht, Listing hinkt nach
            if (seen[key]) return;
            seen[key] = 1;
            var md = _galleryMeta.meta[key] || {};
            if (md.ref) return;              // Verweise kommen weiter unten
            items.push({
                key: key,
                data: _urlFromKey(key),
                caption: md.caption || '',
                time: md.time || '',
                orig: md.orig || '',
                sha: md.sha || '',
                order: (md.order === undefined ? null : md.order),
                sort: _tsFromFilename(f),
                name: f,
                type: 'photo'
            });
        });

        // Verweise auf Dateien anderer Gruppen: haben keine eigene Repo-Datei,
        // stehen aber genauso in der Galerie.
        for (var mk in _galleryMeta.meta) {
            var me2 = _galleryMeta.meta[mk];
            if (!me2 || me2.del || !me2.ref) continue;
            if (mk.indexOf(group + '/') !== 0) continue;
            if (seen[mk] || _pendingDeletes[mk]) continue;
            seen[mk] = 1;
            items.push({
                key: mk,
                data: _urlFromKey(me2.ref),
                caption: me2.caption || '',
                time: me2.time || '',
                orig: me2.orig || '',
                sha: me2.sha || '',
                ref: me2.ref,
                order: (me2.order === undefined ? null : me2.order),
                sort: _tsFromFilename(me2.ref.split('/').pop()),
                name: me2.ref.split('/').pop(),
                type: 'photo'
            });
        }

        var vids = (_galleryMeta.videos || {})[group] || {};
        Object.keys(vids).forEach(function(id) {
            var v = vids[id];
            if (!v || v.del) return;
            items.push({
                key: 'yt:' + id,
                data: id,
                caption: v.caption || '',
                time: v.time || '',
                order: (v.order === undefined ? null : v.order),
                sort: v.m || 0,
                name: id,
                type: 'youtube'
            });
        });
        items.sort(function(a, b) {
            var ao = a.order, bo = b.order;
            if (ao !== null && bo !== null && ao !== bo) return ao - bo;
            if (ao !== null && bo === null) return -1;
            if (ao === null && bo !== null) return 1;
            if (a.sort !== b.sort) return a.sort - b.sort;
            return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
        });
        if (items.length) result[group] = items;
    });
    photoData = result;
    return photoData;
}

// Einstiegspunkt: Repo lesen, neu aufbauen, alles neu zeichnen.
async function refreshGallery(force) {
    try {
        await fetchRepoTree(force);
        rebuildPhotoData();
        _renderAllGalleries();
        var n = 0;
        for (var g in photoData) n += photoData[g].length;
        console.log('[Galerie] Aufgebaut:', n, 'Eintraege in', Object.keys(photoData).length, 'Gruppen');
        return n;
    } catch (e) { console.error('[Galerie] Refresh-Fehler:', e); return -1; }
}
function _renderAllGalleries() {
    document.querySelectorAll('[data-comp-gallery]').forEach(function(strip) {
        try { updateCompStrip(strip.dataset.compGallery); } catch(e) {}
    });
    var ov = document.getElementById('galleryOverlay');
    if (ov && ov.classList.contains('show') && ov.dataset.group) {
        try { renderGallery(ov.dataset.group); } catch(e) {}
    }
}
function _indexOfKey(group, key) {
    var arr = photoData[group] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].key === key) return i;
    return -1;
}

// ==== COMPONENT PHOTO GALLERY SYSTEM ====

// Map group -> array of default manufacturer images
var _defaultImages = {};
function _collectDefaults() {
    document.querySelectorAll('[data-comp-gallery]').forEach(function(strip) {
        var gid = strip.dataset.compGallery;
        _defaultImages[gid] = [];
        // Primary default from comp-hero
        var img = strip.querySelector('.comp-hero[data-default-src]');
        if (img) _defaultImages[gid].push(img.dataset.defaultSrc);
        // Additional defaults from data-extra-images attribute
        var extra = strip.dataset.extraImages;
        if (extra) {
            extra.split(',').forEach(function(src) {
                if (src.trim()) _defaultImages[gid].push(src.trim());
            });
        }
    });
}

// Get all photos for gallery: manufacturer defaults + user photos
function _getAllPhotos(group) {
    var all = [];
    var defaults = _defaultImages[group] || [];
    for (var d = 0; d < defaults.length; d++) {
        all.push({ data: defaults[d], caption: 'Herstellerbild', time: '', isHero: false, isDefault: true, defaultIdx: d });
    }
    var user = photoData[group] || [];
    for (var i = 0; i < user.length; i++) {
        var p = Object.assign({}, user[i]);
        p.isDefault = false;
        p.userIdx = i;
        all.push(p);
    }
    return all;
}

// Extract EXIF DateTimeOriginal from JPEG ArrayBuffer
function _getExifDate(buf) {
    try {
        var view = new DataView(buf);
        if (view.getUint16(0) !== 0xFFD8) return null; // not JPEG
        var off = 2;
        while (off < view.byteLength - 1) {
            var marker = view.getUint16(off);
            if (marker === 0xFFE1) { // APP1 = EXIF
                var len = view.getUint16(off + 2);
                // Check "Exif\0\0"
                if (view.getUint32(off + 4) !== 0x45786966) return null;
                var tiffOff = off + 10;
                var le = view.getUint16(tiffOff) === 0x4949; // little-endian?
                var g16 = function(o) { return le ? view.getUint16(o, true) : view.getUint16(o); };
                var g32 = function(o) { return le ? view.getUint32(o, true) : view.getUint32(o); };
                // IFD0
                var ifdOff = tiffOff + g32(tiffOff + 4);
                var cnt = g16(ifdOff); var exifIfdOff = 0;
                for (var i = 0; i < cnt; i++) {
                    var tag = g16(ifdOff + 2 + i * 12);
                    if (tag === 0x8769) { exifIfdOff = tiffOff + g32(ifdOff + 2 + i * 12 + 8); break; }
                }
                if (!exifIfdOff) return null;
                // Exif sub-IFD: find 0x9003 (DateTimeOriginal) or 0x9004 (DateTimeDigitized)
                cnt = g16(exifIfdOff);
                for (var i = 0; i < cnt; i++) {
                    var tag = g16(exifIfdOff + 2 + i * 12);
                    if (tag === 0x9003 || tag === 0x9004) {
                        var strOff = tiffOff + g32(exifIfdOff + 2 + i * 12 + 8);
                        var s = '';
                        for (var c = 0; c < 19; c++) s += String.fromCharCode(view.getUint8(strOff + c));
                        // "2024:03:15 14:30:22" -> "15.03.2024, 14:30:22"
                        var m = s.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
                        if (m) return m[3] + '.' + m[2] + '.' + m[1] + ', ' + m[4] + ':' + m[5] + ':' + m[6];
                        return null;
                    }
                }
                return null;
            }
            if ((marker & 0xFF00) !== 0xFF00) return null;
            off += 2 + view.getUint16(off + 2);
        }
    } catch(e) {}
    return null;
}

// Upload photo to GitHub repo and store URL
async function _uploadToGitHub(group, base64data, filename, retries) {
    if (retries === undefined) retries = 3;
    var token = getGistConfig().token;
    if (!token) throw new Error('Kein GitHub-Token konfiguriert');
    var pure = base64data.split(',')[1];
    var path = 'img/user/' + group + '/' + filename;
    var url = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path;
    var res = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Foto: ' + group + '/' + filename,
            content: pure,
            branch: 'main'
        })
    });
    if (!res.ok) {
        var errBody = await res.text().catch(function() { return ''; });
        var errMsg = '';
        try { errMsg = JSON.parse(errBody).message || ''; } catch(e) { errMsg = errBody.substring(0, 200); }
        console.error('GitHub Upload Error:', res.status, errMsg);
        // Retry on conflict or server error
        if ((res.status === 409 || res.status === 422 || res.status >= 500) && retries > 0) {
            await new Promise(function(r) { setTimeout(r, 2000); });
            return _uploadToGitHub(group, base64data, filename, retries - 1);
        }
        if (res.status === 403) throw new Error('403: Zugriff verweigert. ' + errMsg);
        if (res.status === 404) throw new Error('404: Token braucht "Contents: Read+Write"');
        throw new Error(res.status + ': ' + errMsg);
    }
    return 'https://raw.githubusercontent.com/' + REPO_OWNER + '/' + REPO_NAME + '/main/' + path;
}

async function addPhoto(group) {
    var lang = document.documentElement.lang || 'de';
    if (!getGistConfig().token) {
        showToast(lang === 'de' ? 'Bitte zuerst GitHub-Token in den Einstellungen konfigurieren' : 'Please configure GitHub token in settings first');
        return;
    }
    // Gegen den echten Repo-Stand pruefen, nicht gegen eine lokale Liste -
    // sonst entstehen verwaiste Dateien oberhalb des Limits.
    try { await fetchRepoTree(true); rebuildPhotoData(); } catch(e) {}
    var existing = (photoData[group] || []).filter(function(p) { return p.type !== 'youtube'; });
    if (existing.length >= PHOTO_MAX_PER_GROUP) {
        showToast(lang === 'de' ? 'Maximum ' + PHOTO_MAX_PER_GROUP + ' Fotos pro Komponente erreicht' : 'Maximum ' + PHOTO_MAX_PER_GROUP + ' photos per component reached');
        return;
    }
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = async function(e) {
        var files = e.target.files; if (!files.length) return;
        var maxFiles = PHOTO_MAX_PER_GROUP - existing.length;
        if (files.length > maxFiles) {
            showToast(lang === 'de' ? 'Nur ' + maxFiles + ' weitere Fotos moeglich' : 'Only ' + maxFiles + ' more photos allowed');
        }
        var toProcess = Math.min(files.length, maxFiles);
        showToast(lang === 'de' ? 'Lade ' + toProcess + ' Foto(s) hoch...' : 'Uploading ' + toProcess + ' photo(s)...');
        var uploaded = 0, linked = 0, dupes = 0;
        // Process files sequentially with delay to avoid GitHub commit conflicts
        for (var fi = 0; fi < toProcess; fi++) {
            try {
                if (fi > 0) await new Promise(function(r) { setTimeout(r, 1500); });
                showToast((fi+1) + '/' + toProcess + ' wird hochgeladen...');
                var result = await _processAndUpload(files[fi], group, fi);
                if (!result) continue;
                if (result.duplicate) { dupes++; }
                else if (result.linked) { linked++; uploaded++; }
                else { uploaded++; }
            } catch(err) {
                showToast('Fehler bei Foto ' + (fi+1) + ': ' + err.message);
            }
        }
        if (dupes > 0 && uploaded === 0) {
            showToast(lang === 'de'
                ? (dupes === 1 ? 'Dieses Foto ist hier schon vorhanden'
                               : dupes + ' Fotos sind hier schon vorhanden')
                : (dupes + ' photo(s) already here'));
        }
        if (linked > 0) {
            showToast(lang === 'de'
                ? (linked === 1 ? 'Foto lag schon im Repository - verknuepft statt doppelt abgelegt'
                                : linked + ' Fotos verknuepft statt doppelt abgelegt')
                : (linked + ' photo(s) linked instead of duplicated'));
        }
        if (uploaded > 0) {
            scheduleMetaPush();
            await refreshGallery(true);
            if (linked < uploaded) showToast(uploaded === 1
                ? (lang === 'de' ? 'Foto hochgeladen' : 'Photo uploaded')
                : uploaded + (lang === 'de' ? ' Fotos hochgeladen' : ' photos uploaded'));
        }
    };
    input.click();
}

function _processAndUpload(file, group, idx) {
    return new Promise(function(resolve, reject) {
        var exifReader = new FileReader();
        exifReader.onload = function(exifEv) {
            var exifDate = _getExifDate(exifEv.target.result);
            var photoTime = exifDate || '';
            if (!exifDate && file.lastModified) {
                var d = new Date(file.lastModified);
                if (d.getFullYear() > 2000) photoTime = d.toLocaleString('de-DE');
            }
            if (!photoTime) photoTime = new Date().toLocaleString('de-DE');
            var reader = new FileReader();
            reader.onload = function(ev) {
                var img = new Image();
                img.onload = async function() {
                    try {
                        var canvas = document.createElement('canvas');
                        var maxW = 1200, w = img.width, h = img.height;
                        if (w > maxW) { h = h * maxW / w; w = maxW; }
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        var quality = 0.8;
                        var dataUrl = canvas.toDataURL('image/jpeg', quality);
                        while (dataUrl.length * 0.75 > PHOTO_MAX_BYTES && quality > 0.3) {
                            quality -= 0.1;
                            dataUrl = canvas.toDataURL('image/jpeg', quality);
                        }
                        var sha = await _sha256OfDataUrl(dataUrl);
                        // Schon vorhanden? Dann nicht ein zweites Mal ablegen,
                        // sondern darauf verweisen - spart Platz und haelt die
                        // Beschreibung an einer Stelle.
                        var treffer = _findBySha(sha);
                        if (treffer.length) {
                            var ziel = _targetOf(treffer[0].key);
                            var schonHier = treffer.filter(function(t) { return t.key.indexOf(group + '/') === 0; });
                            if (schonHier.length) { resolve({ duplicate: true, group: group }); return; }
                            var refKey = group + '/ref-' + sha.slice(0, 12) + '.jpg';
                            _galleryMeta.meta[refKey] = {
                                ref: ziel, sha: sha, orig: file.name || '',
                                caption: '', time: photoTime, m: _nowMs()
                            };
                            resolve({ linked: true, target: ziel });
                            return;
                        }
                        var filename = Date.now() + '_' + idx + '_' + _safeFileName(file.name) + '.jpg';
                        await _uploadToGitHub(group, dataUrl, filename);
                        var key = group + '/' + filename;
                        // Datei liegt jetzt im Repo (= Wahrheit). Hier nur noch Beiwerk:
                        _galleryMeta.meta[key] = {
                            caption: '', time: photoTime, m: _nowMs(),
                            orig: file.name || '', sha: sha
                        };
                        // Das Repo-Listing hinkt dem Commit kurz nach - solange lokal vormerken.
                        _pendingAdds[key] = { until: _nowMs() + PENDING_TTL_MS };
                        resolve(true);
                    } catch(err) { reject(err); }
                };
                img.onerror = function() { reject(new Error('Bild konnte nicht geladen werden')); };
                img.src = ev.target.result;
            };
            reader.onerror = function() { reject(new Error('Datei konnte nicht gelesen werden')); };
            reader.readAsDataURL(file);
        };
        exifReader.onerror = function() { reject(new Error('EXIF-Lesefehler')); };
        exifReader.readAsArrayBuffer(file);
    });
}

// YouTube link embedding
function addYouTube(group) {
    var lang = document.documentElement.lang || 'de';
    var url = prompt(lang === 'de' ? 'YouTube-Link einfuegen:' : 'Paste YouTube link:');
    if (!url) return;
    // Extract video ID from various YouTube URL formats
    var vidId = null;
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (m) vidId = m[1];
    if (!vidId) { showToast(lang === 'de' ? 'Kein gueltiger YouTube-Link' : 'Invalid YouTube link'); return; }
    if (!_galleryMeta.videos[group]) _galleryMeta.videos[group] = {};
    _galleryMeta.videos[group][vidId] = { caption: '', time: new Date().toLocaleString('de-DE'), m: _nowMs() };
    scheduleMetaPush();
    rebuildPhotoData();
    _renderAllGalleries();
    showToast(lang === 'de' ? 'Video eingebettet' : 'Video embedded');
}

// Streifen mit hoechstens N Vorschaubildern. Alles darueber steckt hinter
// einem "+N" auf dem letzten Bild - so bleibt das Seitenformat erhalten.
function _renderThumbStrip(strip, group, maxThumbs) {
    var row = strip.querySelector('.thumb-row');
    if (!row) {
        row = document.createElement('div');
        row.className = 'thumb-row';
        strip.insertBefore(row, strip.firstChild);
    }
    var all = _getAllPhotos(group);
    var shown = all.slice(0, maxThumbs);
    var rest = all.length - shown.length;
    var lang = document.documentElement.lang || 'de';
    var html = '';
    for (var i = 0; i < shown.length; i++) {
        var p = shown[i];
        var isLast = (i === shown.length - 1) && rest > 0;
        html += '<div class="thumb" onclick="openGallery(\'' + group + '\')" title="'
             + _esc(_displayName(p, lang) + (_displayDate(p) ? ' - ' + _displayDate(p) : '')) + '">'
             + '<img src="' + _esc(_imgSrc(p)) + '" loading="lazy" decoding="async" alt="">'
             + (isLast ? '<span class="thumb-more">+' + rest + '</span>' : '')
             + '</div>';
    }
    row.innerHTML = html;
    row.style.display = shown.length ? '' : 'none';
}

function updateCompStrip(group) {
    var strip = document.querySelector('[data-comp-gallery="' + group + '"]');
    if (!strip) return;
    var countEl0 = document.getElementById(group + '-count');
    if (strip.dataset.thumbs) {
        if (countEl0) countEl0.textContent = _getAllPhotos(group).length;
        _renderThumbStrip(strip, group, parseInt(strip.dataset.thumbs, 10) || 4);
        return;
    }
    var userPhotos = photoData[group] || [];
    var allPhotos = _getAllPhotos(group);
    var countEl = document.getElementById(group + '-count');
    if (countEl) countEl.textContent = allPhotos.length;
    var heroImg = strip.querySelector('.comp-hero');
    var heroInfo = _getHeroInfo(group);
    var defaults = _defaultImages[group] || [];
    var heroSrc = null;
    if (heroInfo.type === 'user' && userPhotos[heroInfo.idx]) {
        heroSrc = userPhotos[heroInfo.idx].data;
    } else if (heroInfo.type === 'default' && defaults[heroInfo.idx]) {
        heroSrc = defaults[heroInfo.idx];
    } else if (defaults.length > 0) {
        heroSrc = defaults[0];
    } else if (heroImg && heroImg.dataset.defaultSrc) {
        heroSrc = heroImg.dataset.defaultSrc;
    } else if (userPhotos[0]) {
        heroSrc = userPhotos[0].data;
    }
    if (heroSrc && heroImg) {
        heroImg.src = heroSrc;
        heroImg.style.display = '';
    } else if (!heroImg && heroSrc) {
        var img = document.createElement('img');
        img.className = 'comp-hero';
        img.src = heroSrc;
        img.onclick = function() { openGallery(group); };
        var actions = strip.querySelector('.comp-photo-actions');
        if (actions) strip.insertBefore(img, actions);
    }
}

var _galleryScrollPos = 0;

// Scroll-Sperre fuer Vollbild-Overlays.
//
// body{overflow:hidden} allein reicht auf iOS/iPadOS nicht: Safari scrollt die
// Seite per Touch trotzdem weiter. Das Overlay ist position:fixed und bleibt am
// Viewport, waehrend das Dokument darunter wegwandert - sichtbar wurde das
// daran, dass Kopfzeile und Schliessen-Knopf der Galerie oberhalb des
// Bildschirms standen und erst beim Runterscrollen hereinkamen.
//
// Zuverlaessig ist nur, den body selbst festzusetzen und den Scrollstand zu
// merken. Ohne das negative top springt die Seite beim Oeffnen an den Anfang.
function sperreSeite() {
    _galleryScrollPos = window.scrollY || window.pageYOffset || 0;
    var b = document.body;
    b.style.position = 'fixed';
    b.style.top = '-' + _galleryScrollPos + 'px';
    b.style.left = '0';
    b.style.right = '0';
    b.style.width = '100%';
    b.style.overflow = 'hidden';
}

function gibSeiteFrei() {
    var b = document.body;
    b.style.position = '';
    b.style.top = '';
    b.style.left = '';
    b.style.right = '';
    b.style.width = '';
    b.style.overflow = '';
    window.scrollTo(0, _galleryScrollPos);
}

function seiteIstGesperrt() {
    return document.body.style.position === 'fixed';
}
// Ueberschrift der Galerie: data-gallery-title, sonst die naechste Ueberschrift
// oberhalb, sonst der Gruppenname. Frueher wurde hart .comp-body erwartet -
// das gibt es nur in specs.html.
function _galleryTitleFor(group, strip) {
    if (!strip) return group;
    if (strip.dataset.galleryTitle) return strip.dataset.galleryTitle;
    var body = strip.closest('.comp-body');
    if (body && body.previousElementSibling) return body.previousElementSibling.textContent.trim();
    var node = strip;
    while (node && node !== document.body) {
        var prev = node.previousElementSibling;
        while (prev) {
            if (/^H[1-6]$/.test(prev.tagName)) return prev.textContent.trim();
            var h = prev.querySelector && prev.querySelector('h1,h2,h3,h4,h5,h6');
            if (h) return h.textContent.trim();
            prev = prev.previousElementSibling;
        }
        node = node.parentElement;
    }
    return group;
}

function openGallery(group) {
    // Den Scrollstand merkt sperreSeite() selbst.
    var overlay = document.getElementById('galleryOverlay');
    ensureGalleryChrome();
    var title = document.getElementById('galleryTitle');
    overlay = document.getElementById('galleryOverlay');
    var strip = document.querySelector('[data-comp-gallery="' + group + '"]');
    title.textContent = _galleryTitleFor(group, strip);
    overlay.dataset.group = group;
    overlay.classList.add('show');
    sperreSeite();
    renderGallery(group);
}

// Anzeigename eines Bildes: eigene Beschreibung, sonst der Dateiname ohne
// den technischen Zeitstempel-Praefix.
function _displayName(p, lang) {
    if (p.isDefault) return lang === 'de' ? 'Herstellerbild' : 'Manufacturer';
    if (p.caption) return p.caption;
    if (p.type === 'youtube') return 'YouTube';
    // Originalname hat Vorrang - eine Nummerierung sagt nichts ueber das Bild.
    if (p.orig) return String(p.orig).replace(/\.[a-z0-9]+$/i, '');
    var f = p.name || (p.key || '').split('/').pop() || '';
    f = f.replace(/\.[a-z0-9]+$/i, '');
    // '<ts>_<idx>_<Originalname>' - den Originalteil herausloesen
    var mOrig = f.match(/^\d{10,16}_\d+_(.+)$/);
    if (mOrig) return mOrig[1];
    var m = f.match(/^(?:annotated_)?\d{10,16}(?:_(\d+))?$/);
    if (m) {
        var nr = m[1] !== undefined ? (parseInt(m[1], 10) + 1) : null;
        var pre = /^annotated_/.test(f) ? (lang === 'de' ? 'Zeichnung' : 'Drawing') : 'Foto';
        return nr !== null ? pre + ' ' + nr : pre;
    }
    return f;
}

// Aufnahmedatum: bevorzugt EXIF (in p.time), sonst aus dem Dateinamen
function _displayDate(p) {
    if (p.isDefault) return '';
    if (p.time) return p.time;
    var ts = _tsFromFilename(p.name || (p.key || '').split('/').pop() || '');
    if (!ts) return '';
    var d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('de-DE');
}

function _esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function _imgSrc(p) {
    if (p.type === 'youtube') return 'https://img.youtube.com/vi/' + p.data + '/hqdefault.jpg';
    return p.data;
}

function renderGallery(group) {
    var grid = document.getElementById('galleryGrid');
    var allPhotos = _getAllPhotos(group);
    var lang = document.documentElement.lang || 'de';
    var html = '';
    var heroInfo = _getHeroInfo(group);
    for (var i = 0; i < allPhotos.length; i++) {
        var p = allPhotos[i];
        var isActive = false;
        if (p.isDefault && heroInfo.type === 'default' && p.defaultIdx === heroInfo.idx) isActive = true;
        if (!p.isDefault && heroInfo.type === 'user' && p.userIdx === heroInfo.idx) isActive = true;
        if (heroInfo.type === 'none' && p.isDefault && p.defaultIdx === 0) isActive = true;
        var isYT = p.type === 'youtube';
        html += '<div class="gallery-card' + (isYT ? ' gallery-yt' : '') + '" data-gallery-idx="' + i + '" data-is-default="' + (p.isDefault ? '1' : '0') + '"' +
            (!p.isDefault && !isYT ? ' draggable="true" data-user-idx="' + p.userIdx + '"' : '') +
            (!p.isDefault && isYT ? ' data-user-idx="' + p.userIdx + '"' : '') +
            (p.isDefault ? ' data-default-idx="' + p.defaultIdx + '"' : '') + '>';
        if (isYT) {
            html += '<div style="position:relative;cursor:pointer" onclick="openLightbox(\'' + group + '\',' + i + ')">' +
                '<img src="' + _imgSrc(p) + '" loading="lazy" decoding="async" draggable="false">' +
                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:2.5rem;text-shadow:0 2px 8px rgba(0,0,0,0.7);">&#9654;</div></div>';
        } else {
            html += '<img src="' + _imgSrc(p) + '" loading="lazy" decoding="async" onclick="openLightbox(\'' + group + '\',' + i + ')" draggable="false">';
        }
        // Star button (not for YouTube)
        if (!isYT) {
            var starClick = p.isDefault
                ? 'setHeroDefault(\'' + group + '\',' + p.defaultIdx + ')'
                : 'setHero(\'' + group + '\',' + p.userIdx + ')';
            html += '<button class="gallery-star' + (isActive ? ' active' : '') + '" onclick="event.stopPropagation();' + starClick + '" title="' + (lang === 'de' ? 'Als Hauptbild setzen' : 'Set as main image') + '">&#9733;</button>';
        }
        var capName = _displayName(p, lang);
        var capDate = _displayDate(p);
        html += '<div class="gallery-caption" title="' + _esc(capName + (capDate ? ' - ' + capDate : '')) + '">'
            + '<span class="gc-name">' + _esc(capName) + '</span>'
            + (capDate ? '<span class="gc-date">' + _esc(capDate) + '</span>' : '')
            + '</div></div>';
    }
    html += '<div class="gallery-add-card" onclick="addPhoto(\'' + group + '\')">' + (lang === 'de' ? '&#128247; Fotos' : '&#128247; Photos') + '</div>';
    html += '<div class="gallery-add-card" onclick="addYouTube(\'' + group + '\')" style="background:rgba(255,0,0,0.15);border-color:rgba(255,0,0,0.3);">' + (lang === 'de' ? '&#9654; YouTube' : '&#9654; YouTube') + '</div>';
    grid.innerHTML = html;
    _initDragDrop(group, grid);
}

function closeGallery() {
    document.getElementById('galleryOverlay').classList.remove('show');
    gibSeiteFrei();
}

// ==== DRAG & DROP REORDER (desktop + touch) ====
function _initDragDrop(group, grid) {
    var cards = grid.querySelectorAll('.gallery-card[draggable="true"]');
    // Desktop drag events
    cards.forEach(function(card) {
        card.addEventListener('dragstart', function(e) {
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.userIdx);
        });
        card.addEventListener('dragend', function() { card.classList.remove('dragging'); _clearDragOver(grid); });
    });
    grid.querySelectorAll('.gallery-card').forEach(function(card) {
        card.addEventListener('dragover', function(e) {
            e.preventDefault(); e.dataTransfer.dropEffect = 'move';
            _clearDragOver(grid); card.classList.add('drag-over');
        });
        card.addEventListener('drop', function(e) {
            e.preventDefault(); _clearDragOver(grid);
            var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            var toCard = card.closest('.gallery-card');
            if (!toCard || toCard.dataset.isDefault === '1') return;
            var toIdx = parseInt(toCard.dataset.userIdx);
            if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) return;
            _reorderPhotos(group, fromIdx, toIdx);
        });
    });

    // Touch drag: long-press to start, then drag to reorder
    var _td = null; // touch drag state
    var _tdTimer = null;
    var _ghost = null;

    cards.forEach(function(card) {
        card.addEventListener('touchstart', function(e) {
            if (e.touches.length !== 1) return;
            var touch = e.touches[0];
            // Start long-press timer (500ms to enter drag mode)
            _tdTimer = setTimeout(function() {
                _td = { el: card, idx: parseInt(card.dataset.userIdx), startX: touch.clientX, startY: touch.clientY };
                card.classList.add('dragging');
                // Create floating ghost
                _ghost = card.cloneNode(true);
                _ghost.style.cssText = 'position:fixed;z-index:1200;pointer-events:none;opacity:0.85;width:' + card.offsetWidth + 'px;transform:scale(1.05);box-shadow:0 8px 24px rgba(0,0,0,0.5);';
                _ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
                _ghost.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
                document.body.appendChild(_ghost);
                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(30);
            }, 500);
        }, { passive: true });
    });

    grid.addEventListener('touchmove', function(e) {
        // Cancel long-press if moved before threshold
        if (_tdTimer && !_td) {
            var t = e.touches[0];
            // Allow small movement during long-press wait
            clearTimeout(_tdTimer); _tdTimer = null;
            return;
        }
        if (!_td) return;
        e.preventDefault(); // prevent scroll while dragging
        var touch = e.touches[0];
        // Move ghost
        if (_ghost) {
            _ghost.style.left = (touch.clientX - _ghost.offsetWidth / 2) + 'px';
            _ghost.style.top = (touch.clientY - _ghost.offsetHeight / 2) + 'px';
        }
        // Highlight drop target - hide ghost briefly to find element underneath
        _ghost.style.display = 'none';
        var elem = document.elementFromPoint(touch.clientX, touch.clientY);
        _ghost.style.display = '';
        _clearDragOver(grid);
        var overCard = elem ? elem.closest('.gallery-card') : null;
        if (overCard && overCard !== _td.el && overCard.dataset.isDefault !== '1') {
            overCard.classList.add('drag-over');
        }
    }, { passive: false });

    grid.addEventListener('touchend', function(e) {
        clearTimeout(_tdTimer); _tdTimer = null;
        if (!_td) return;
        _td.el.classList.remove('dragging');
        _clearDragOver(grid);
        if (_ghost) { _ghost.remove(); _ghost = null; }
        var last = e.changedTouches[0];
        var elem = document.elementFromPoint(last.clientX, last.clientY);
        var overCard = elem ? elem.closest('.gallery-card') : null;
        if (overCard && overCard.dataset.isDefault !== '1') {
            var toIdx = parseInt(overCard.dataset.userIdx);
            if (!isNaN(toIdx) && toIdx !== _td.idx) {
                _reorderPhotos(group, _td.idx, toIdx);
            }
        }
        _td = null;
    });

    grid.addEventListener('touchcancel', function() {
        clearTimeout(_tdTimer); _tdTimer = null;
        if (_td) { _td.el.classList.remove('dragging'); }
        _clearDragOver(grid);
        if (_ghost) { _ghost.remove(); _ghost = null; }
        _td = null;
    });
}
function _clearDragOver(grid) { grid.querySelectorAll('.drag-over').forEach(function(c) { c.classList.remove('drag-over'); }); }
function _reorderPhotos(group, fromIdx, toIdx) {
    var photos = photoData[group];
    if (!photos || fromIdx < 0 || fromIdx >= photos.length || toIdx < 0 || toIdx >= photos.length) return;
    var item = photos.splice(fromIdx, 1)[0];
    photos.splice(toIdx, 0, item);
    // Reihenfolge per Key festschreiben, damit sie einen Neuaufbau ueberlebt
    var now = _nowMs();
    for (var i = 0; i < photos.length; i++) {
        var pk = photos[i].key;
        photos[i].order = i;
        if (!pk) continue;
        if (photos[i].type === 'youtube') {
            var vid = pk.substring(3);
            if (!_galleryMeta.videos[group]) _galleryMeta.videos[group] = {};
            var ve = _galleryMeta.videos[group][vid] || {};
            ve.order = i; ve.m = now;
            _galleryMeta.videos[group][vid] = ve;
        } else {
            var me = _galleryMeta.meta[pk] || {};
            me.order = i; me.m = now;
            _galleryMeta.meta[pk] = me;
        }
    }
    scheduleMetaPush();
    updateCompStrip(group);
    renderGallery(group);
}

// Hero wird per Key gespeichert (_galleryMeta.hero), nicht per Array-Index -
// ein Index zeigt nach einem Neuaufbau sonst auf ein anderes Bild.
// _getHeroInfo loest den Key bei jedem Aufruf frisch in einen Index auf,
// damit der restliche UI-Code unveraendert weiterlaeuft.
function _getHeroInfo(group) {
    var h = (_galleryMeta.hero || {})[group];
    if (h && h.type === 'default') return { type: 'default', idx: h.idx || 0 };
    if (h && h.type === 'user' && h.key) {
        var i = _indexOfKey(group, h.key);
        if (i !== -1) return { type: 'user', idx: i, key: h.key };
        // Hero-Foto existiert nicht mehr (im Repo geloescht) -> auf Standard zurueck
    }
    return { type: 'none', idx: 0 };
}

function setHero(group, userIdx) {
    var photos = photoData[group] || [];
    var p = photos[userIdx];
    if (!p || !p.key) return;
    _galleryMeta.hero[group] = { type: 'user', key: p.key, m: _nowMs() };
    scheduleMetaPush();
    updateCompStrip(group);
    renderGallery(group);
}

function setHeroDefault(group, defaultIdx) {
    _galleryMeta.hero[group] = { type: 'default', idx: defaultIdx, m: _nowMs() };
    scheduleMetaPush();
    updateCompStrip(group);
    renderGallery(group);
}

async function deletePhoto(group, userIdx) {
    var lang = document.documentElement.lang || 'de';
    var photo = photoData[group] ? photoData[group][userIdx] : null;
    if (!photo) return;
    var msg = photo.type === 'youtube'
        ? (lang === 'de' ? 'YouTube-Video entfernen?' : 'Remove YouTube video?')
        : (lang === 'de' ? 'Foto wirklich l\u00f6schen?' : 'Delete this photo?');
    if (!confirm(msg)) return;
    var now = _nowMs();
    var hero = (_galleryMeta.hero || {})[group];
    if (hero && hero.type === 'user' && hero.key === photo.key) delete _galleryMeta.hero[group];

    if (photo.type === 'youtube') {
        // Videos haben keine Repo-Datei -> explizite Grabstein-Markierung,
        // sonst taucht das Video beim naechsten Merge wieder auf.
        var vid = photo.data;
        if (!_galleryMeta.videos[group]) _galleryMeta.videos[group] = {};
        _galleryMeta.videos[group][vid] = { del: true, m: now };
        scheduleMetaPush();
        rebuildPhotoData();
        _renderAllGalleries();
        return;
    }

    var ziel = _targetOf(photo.key);

    if (photo.ref) {
        // War selbst nur ein Verweis: die Datei gehoert einer anderen Galerie
        // und bleibt dort unberuehrt.
        delete _galleryMeta.meta[photo.key];
        scheduleMetaPush();
        rebuildPhotoData();
        _renderAllGalleries();
        showToast(lang === 'de'
            ? 'Aus dieser Galerie entfernt (Bild bleibt in der anderen)'
            : 'Removed from this gallery (image stays in the other)');
        return;
    }

    // Zeigen noch Verweise auf diese Datei? Dann darf sie nicht weg, sonst
    // fehlt das Bild in der anderen Galerie.
    var verweise = _refsTo(ziel);
    if (verweise.length) {
        var gruppen = verweise.map(function(k) { return k.split('/')[0]; }).join(', ');
        showToast(lang === 'de'
            ? 'Nicht geloescht - das Bild wird noch verwendet in: ' + gruppen
            : 'Not deleted - still used in: ' + gruppen);
        return;
    }

    if (!getGistConfig().token) {
        showToast(lang === 'de' ? 'Loeschen braucht einen GitHub-Token' : 'Deleting requires a GitHub token');
        return;
    }
    // Sofort ausblenden, danach im Repo loeschen.
    _pendingDeletes[photo.key] = now + PENDING_TTL_MS;
    delete _galleryMeta.meta[photo.key];
    scheduleMetaPush();
    rebuildPhotoData();
    _renderAllGalleries();
    var ok = await _deleteFromGitHub(photo.data);
    if (!ok) {
        delete _pendingDeletes[photo.key];
        rebuildPhotoData();
        _renderAllGalleries();
        showToast(lang === 'de' ? 'Loeschen fehlgeschlagen' : 'Delete failed');
        return;
    }
    await refreshGallery(true);
}

async function _deleteFromGitHub(rawUrl) {
    var token = getGistConfig().token;
    if (!token) return false;
    try {
        // Extract path from raw URL: https://raw.githubusercontent.com/owner/repo/main/path
        var parts = rawUrl.split('/' + REPO_NAME + '/' + REPO_BRANCH + '/');
        if (parts.length < 2) return false;
        var path = parts[1];
        // Get current file SHA first
        var apiUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path;
        var res = await fetch(apiUrl, { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 404) return true;   // schon weg
        if (!res.ok) return false;
        var fileInfo = await res.json();
        // Delete file
        var del = await fetch(apiUrl, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Foto geloescht: ' + path, sha: fileInfo.sha, branch: REPO_BRANCH })
        });
        if (!del.ok) console.error('[Galerie] Loeschen fehlgeschlagen:', del.status);
        return del.ok;
    } catch(e) { console.error('[Galerie] Loesch-Fehler:', e.message); return false; }
}

// ==== LIGHTBOX with Zoom, Toolbar, Drawing ====
var _lbZoom = { scale: 1, tx: 0, ty: 0, pinching: false, dist0: 0, scale0: 1, panStart: null };
var _lbDraw = { active: false, ctx: null, strokes: [], current: [], color: '#ff3333', colors: ['#ff3333','#33ff33','#3388ff','#ffff33','#ffffff'], colorIdx: 0, lineWidth: 3 };

function _lbCurPhoto() {
    var lb = document.getElementById('photoLightbox');
    var group = lb.dataset.group;
    var idx = parseInt(lb.dataset.idx);
    return { group: group, idx: idx, photo: _getAllPhotos(group)[idx] || null };
}

function openLightbox(group, allIdx) {
    var allPhotos = _getAllPhotos(group);
    if (!allPhotos[allIdx]) return;
    var p = allPhotos[allIdx];
    var lb = document.getElementById('photoLightbox');
    var img = document.getElementById('lbImg');
    var wrap = document.getElementById('lbImgWrap');
    // Remove any existing YouTube iframe
    var oldIframe = wrap.querySelector('iframe');
    if (oldIframe) oldIframe.remove();
    img.style.display = '';
    if (p.type === 'youtube') {
        // Show YouTube player instead of image
        img.style.display = 'none';
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + p.data + '?autoplay=1&rel=0';
        iframe.style.cssText = 'width:95%;max-width:800px;aspect-ratio:16/9;border:none;border-radius:8px;';
        iframe.allow = 'autoplay; encrypted-media; fullscreen';
        iframe.allowFullscreen = true;
        wrap.appendChild(iframe);
    } else {
        img.crossOrigin = 'anonymous';
        img.src = _imgSrc(p);
    }
    var lbLang = document.documentElement.lang || 'de';
    var cap = _displayName(p, lbLang);
    var t = _displayDate(p);
    lb.querySelector('.caption').textContent = cap + (cap && t ? ' \u2014 ' : '') + t;
    lb.dataset.group = group;
    lb.dataset.idx = allIdx;
    // Reset zoom
    _lbZoom.scale = 1; _lbZoom.tx = 0; _lbZoom.ty = 0;
    img.style.transform = '';
    _lbExitDraw();
    // Update toolbar
    var isYT = p.type === 'youtube';
    var btnDel = document.getElementById('lbBtnDel');
    var btnEdit = document.getElementById('lbBtnEdit');
    var btnStar = document.getElementById('lbBtnStar');
    var btnDraw = document.getElementById('lbBtnDraw');
    btnDel.style.display = p.isDefault ? 'none' : '';
    btnEdit.style.display = (p.isDefault || isYT) ? 'none' : '';
    btnStar.style.display = isYT ? 'none' : '';
    btnDraw.style.display = isYT ? 'none' : '';
    if (!isYT) {
        var heroInfo = _getHeroInfo(group);
        var isHero = (p.isDefault && heroInfo.type === 'default' && p.defaultIdx === heroInfo.idx)
            || (!p.isDefault && heroInfo.type === 'user' && p.userIdx === heroInfo.idx)
            || (heroInfo.type === 'none' && p.isDefault && p.defaultIdx === 0);
        btnStar.classList.toggle('active', isHero);
    }
    lb.classList.add('show');
}

function lightboxNav(dir) {
    var lb = document.getElementById('photoLightbox');
    var group = lb.dataset.group;
    var idx = parseInt(lb.dataset.idx);
    var allPhotos = _getAllPhotos(group);
    var newIdx = idx + dir;
    if (newIdx < 0) newIdx = allPhotos.length - 1;
    if (newIdx >= allPhotos.length) newIdx = 0;
    openLightbox(group, newIdx);
}
function closeLightbox() {
    _lbExitDraw();
    var lb = document.getElementById('photoLightbox');
    var iframe = lb.querySelector('iframe');
    if (iframe) iframe.remove();
    document.getElementById('lbImg').style.display = '';
    lb.classList.remove('show');
}

// -- Toolbar actions --
function lbSetHero() {
    var c = _lbCurPhoto(); if (!c.photo) return;
    if (c.photo.isDefault) { setHeroDefault(c.group, c.photo.defaultIdx); }
    else { setHero(c.group, c.photo.userIdx); }
    document.getElementById('lbBtnStar').classList.add('active');
    showToast(document.documentElement.lang === 'en' ? 'Set as main image' : 'Als Hauptbild gesetzt');
}
function lbEditCaption() {
    var c = _lbCurPhoto(); if (!c.photo || c.photo.isDefault) return;
    var entry = (photoData[c.group] || [])[c.photo.userIdx];
    if (!entry || !entry.key) return;
    var lang = document.documentElement.lang || 'de';
    var cap = prompt(lang === 'de' ? 'Bildbeschreibung:' : 'Caption:', entry.caption || '');
    if (cap === null) return;
    entry.caption = cap;
    var now = _nowMs();
    if (entry.type === 'youtube') {
        var vid = entry.data;
        if (!_galleryMeta.videos[c.group]) _galleryMeta.videos[c.group] = {};
        var ve = _galleryMeta.videos[c.group][vid] || {};
        ve.caption = cap; ve.m = now;
        _galleryMeta.videos[c.group][vid] = ve;
    } else {
        var me = _galleryMeta.meta[entry.key] || {};
        me.caption = cap; me.m = now;
        if (!me.time) me.time = entry.time || '';
        _galleryMeta.meta[entry.key] = me;
    }
    scheduleMetaPush();
    document.querySelector('#photoLightbox .caption').textContent =
        _displayName(entry, document.documentElement.lang || 'de')
        + (_displayDate(entry) ? ' \u2014 ' + _displayDate(entry) : '');
    renderGallery(c.group);
}
async function lbDeletePhoto() {
    var c = _lbCurPhoto(); if (!c.photo || c.photo.isDefault) return;
    await deletePhoto(c.group, c.photo.userIdx);
    // Navigate to next or close
    var allPhotos = _getAllPhotos(c.group);
    if (allPhotos.length === 0) { closeLightbox(); return; }
    var newIdx = c.idx >= allPhotos.length ? allPhotos.length - 1 : c.idx;
    openLightbox(c.group, newIdx);
}

// -- Pinch-to-zoom + pan + double-tap --
(function() {
    var wrap = null;
    function getWrap() { if (!wrap) wrap = document.getElementById('lbImgWrap'); return wrap; }
    function applyTransform() {
        var img = document.getElementById('lbImg');
        if (!img) return;
        var s = _lbZoom.scale, tx = _lbZoom.tx, ty = _lbZoom.ty;
        img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    }
    function pinchDist(t) { var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY; return Math.sqrt(dx*dx+dy*dy); }

    // Prevent iOS Safari page zoom on the lightbox
    var lbEl = document.getElementById('photoLightbox');
    if (lbEl) {
        lbEl.addEventListener('gesturestart', function(e) { e.preventDefault(); }, { passive: false });
        lbEl.addEventListener('gesturechange', function(e) {
            e.preventDefault();
            if (_lbDraw.active) return;
            _lbZoom.scale = Math.max(1, Math.min(8, _lbZoom.scale * e.scale));
            applyTransform();
        }, { passive: false });
        lbEl.addEventListener('gestureend', function(e) { e.preventDefault(); }, { passive: false });
    }

    // Touch: pinch-zoom + pan
    document.addEventListener('touchstart', function(e) {
        var w = getWrap(); if (!w || !w.closest('.photo-lightbox.show')) return;
        if (!e.target.closest('.lb-img-wrap')) return;
        if (_lbDraw.active) return;
        if (e.touches.length === 2) {
            e.preventDefault();
            _lbZoom.pinching = true;
            _lbZoom.dist0 = pinchDist(e.touches);
            _lbZoom.scale0 = _lbZoom.scale;
        } else if (e.touches.length === 1) {
            if (_lbZoom.scale > 1) {
                e.preventDefault();
                _lbZoom.panStart = { x: e.touches[0].clientX - _lbZoom.tx, y: e.touches[0].clientY - _lbZoom.ty };
            }
        }
    }, { passive: false });

    document.addEventListener('touchmove', function(e) {
        var w = getWrap(); if (!w || !w.closest('.photo-lightbox.show')) return;
        if (_lbDraw.active) return;
        if (_lbZoom.pinching && e.touches.length === 2) {
            e.preventDefault();
            var dist = pinchDist(e.touches);
            _lbZoom.scale = Math.max(1, Math.min(8, _lbZoom.scale0 * (dist / _lbZoom.dist0)));
            applyTransform();
        } else if (_lbZoom.panStart && e.touches.length === 1 && _lbZoom.scale > 1) {
            e.preventDefault();
            _lbZoom.tx = e.touches[0].clientX - _lbZoom.panStart.x;
            _lbZoom.ty = e.touches[0].clientY - _lbZoom.panStart.y;
            applyTransform();
        }
    }, { passive: false });

    document.addEventListener('touchend', function(e) {
        if (_lbDraw.active) return;
        _lbZoom.pinching = false;
        _lbZoom.panStart = null;
    });

    // Double-tap to zoom in/out
    var _lastTap = 0;
    document.addEventListener('touchend', function(e) {
        if (_lbDraw.active) return;
        var w = getWrap(); if (!w || !w.closest('.photo-lightbox.show')) return;
        if (!e.target.closest('.lb-img-wrap')) return;
        if (e.touches.length > 0) return; // still other fingers
        var now = Date.now();
        if (now - _lastTap < 300) {
            e.preventDefault();
            if (_lbZoom.scale > 1.5) {
                // Zoom out
                _lbZoom.scale = 1; _lbZoom.tx = 0; _lbZoom.ty = 0;
            } else {
                // Zoom in to 3x at tap position
                var touch = e.changedTouches[0];
                var img = document.getElementById('lbImg');
                var rect = img.getBoundingClientRect();
                var cx = touch.clientX - rect.left - rect.width / 2;
                var cy = touch.clientY - rect.top - rect.height / 2;
                _lbZoom.scale = 3;
                _lbZoom.tx = -cx * 2;
                _lbZoom.ty = -cy * 2;
            }
            applyTransform();
            _lastTap = 0;
        } else {
            _lastTap = now;
        }
    });

    // Mouse wheel zoom (desktop)
    document.addEventListener('wheel', function(e) {
        var w = getWrap(); if (!w || !w.closest('.photo-lightbox.show')) return;
        if (!e.target.closest('.lb-img-wrap')) return;
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        _lbZoom.scale = Math.max(1, Math.min(8, _lbZoom.scale * delta));
        if (_lbZoom.scale <= 1) { _lbZoom.tx = 0; _lbZoom.ty = 0; }
        applyTransform();
    }, { passive: false });
})();

// -- Drawing mode --
function lbToggleDraw() {
    if (_lbDraw.active) { _lbExitDraw(); } else { _lbEnterDraw(); }
}
function _lbEnterDraw() {
    var lb = document.getElementById('photoLightbox');
    var img = document.getElementById('lbImg');
    var canvas = document.getElementById('lbCanvas');
    if (!img.naturalWidth) return;
    // Reset zoom for drawing
    _lbZoom.scale = 1; _lbZoom.tx = 0; _lbZoom.ty = 0;
    img.style.transform = '';
    // Size canvas to match displayed image
    var rect = img.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
    canvas.style.left = (img.offsetLeft) + 'px'; canvas.style.top = (img.offsetTop) + 'px';
    _lbDraw.ctx = canvas.getContext('2d');
    _lbDraw.ctx.lineCap = 'round'; _lbDraw.ctx.lineJoin = 'round';
    _lbDraw.strokes = []; _lbDraw.current = [];
    _lbDraw.active = true;
    lb.classList.add('lb-drawing');
    document.getElementById('lbBtnDraw').classList.add('active');
    // Show drawing-only buttons
    document.querySelectorAll('.lb-draw-only').forEach(function(b) { b.style.display = ''; });
    // Hide nav
    lb.querySelectorAll('.nav-lb').forEach(function(b) { b.style.display = 'none'; });
}
function _lbExitDraw() {
    _lbDraw.active = false;
    var lb = document.getElementById('photoLightbox');
    lb.classList.remove('lb-drawing');
    var btn = document.getElementById('lbBtnDraw');
    if (btn) btn.classList.remove('active');
    document.querySelectorAll('.lb-draw-only').forEach(function(b) { b.style.display = 'none'; });
    lb.querySelectorAll('.nav-lb').forEach(function(b) { b.style.display = ''; });
    var canvas = document.getElementById('lbCanvas');
    if (canvas) { canvas.style.display = 'none'; }
}
function lbCycleColor() {
    _lbDraw.colorIdx = (_lbDraw.colorIdx + 1) % _lbDraw.colors.length;
    _lbDraw.color = _lbDraw.colors[_lbDraw.colorIdx];
    var dots = ['\uD83D\uDD34','\uD83D\uDFE2','\uD83D\uDD35','\uD83D\uDFE1','\u26AA'];
    document.getElementById('lbBtnColor').innerHTML = dots[_lbDraw.colorIdx];
}
function lbUndoStroke() {
    if (_lbDraw.strokes.length === 0) return;
    _lbDraw.strokes.pop();
    _lbRedraw();
}
function _lbRedraw() {
    var ctx = _lbDraw.ctx; if (!ctx) return;
    var canvas = document.getElementById('lbCanvas');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var s = 0; s < _lbDraw.strokes.length; s++) {
        var st = _lbDraw.strokes[s];
        ctx.strokeStyle = st.color; ctx.lineWidth = st.width;
        ctx.beginPath();
        for (var p = 0; p < st.points.length; p++) {
            if (p === 0) ctx.moveTo(st.points[p].x, st.points[p].y);
            else ctx.lineTo(st.points[p].x, st.points[p].y);
        }
        ctx.stroke();
    }
}
function lbSaveDrawing() {
    if (_lbDraw.strokes.length === 0) { _lbExitDraw(); return; }
    var c = _lbCurPhoto(); if (!c.photo || c.photo.isDefault) {
        showToast('Herstellerbild kann nicht bearbeitet werden');
        _lbExitDraw(); return;
    }
    try {
        // Merge drawing onto image
        var img = document.getElementById('lbImg');
        var merge = document.createElement('canvas');
        merge.width = img.naturalWidth; merge.height = img.naturalHeight;
        var mctx = merge.getContext('2d');
        mctx.drawImage(img, 0, 0);
        // Scale strokes from display to natural size
        var sx = img.naturalWidth / document.getElementById('lbCanvas').width;
        var sy = img.naturalHeight / document.getElementById('lbCanvas').height;
        for (var s = 0; s < _lbDraw.strokes.length; s++) {
            var st = _lbDraw.strokes[s];
            mctx.strokeStyle = st.color; mctx.lineWidth = st.width * sx; mctx.lineCap = 'round'; mctx.lineJoin = 'round';
            mctx.beginPath();
            for (var p = 0; p < st.points.length; p++) {
                if (p === 0) mctx.moveTo(st.points[p].x * sx, st.points[p].y * sy);
                else mctx.lineTo(st.points[p].x * sx, st.points[p].y * sy);
            }
            mctx.stroke();
        }
        var dataUrl = merge.toDataURL('image/jpeg', 0.85);
    } catch(canvasErr) {
        console.error('Canvas-Fehler:', canvasErr);
        showToast('Bild muss neu geladen werden...');
        // Reload image with crossOrigin and retry
        var imgReload = new Image();
        imgReload.crossOrigin = 'anonymous';
        imgReload.onload = function() {
            document.getElementById('lbImg').src = imgReload.src;
            showToast('Bitte Zeichnung nochmal speichern');
        };
        imgReload.src = _imgSrc(c.photo) + '?t=' + Date.now();
        return;
    }
    // Upload annotated image to GitHub (replaces original)
    var filename = 'annotated_' + Date.now() + '.jpg';
    showToast('Zeichnung wird hochgeladen...');
    var oldKey = c.photo.key;
    var oldUrl = c.photo.data;
    var oldMeta = _galleryMeta.meta[oldKey] || {};
    _uploadToGitHub(c.group, dataUrl, filename).then(async function(ghUrl) {
        var newKey = c.group + '/' + filename;
        var now = _nowMs();
        // Metadaten des Originals uebernehmen, Original aus dem Repo entfernen
        _galleryMeta.meta[newKey] = {
            caption: oldMeta.caption || c.photo.caption || '',
            time: oldMeta.time || c.photo.time || '',
            order: oldMeta.order,
            m: now
        };
        _pendingAdds[newKey] = { until: now + PENDING_TTL_MS };
        var hero = (_galleryMeta.hero || {})[c.group];
        if (hero && hero.type === 'user' && hero.key === oldKey) {
            _galleryMeta.hero[c.group] = { type: 'user', key: newKey, m: now };
        }
        if (oldKey) {
            _pendingDeletes[oldKey] = now + PENDING_TTL_MS;
            delete _galleryMeta.meta[oldKey];
            _deleteFromGitHub(oldUrl);
        }
        scheduleMetaPush();
        _lbExitDraw();
        await refreshGallery(true);
        var ni = _indexOfKey(c.group, newKey);
        var all = _getAllPhotos(c.group);
        for (var ai = 0; ai < all.length; ai++) {
            if (!all[ai].isDefault && all[ai].userIdx === ni) { openLightbox(c.group, ai); break; }
        }
        showToast('Zeichnung gespeichert');
    }).catch(function(err) {
        _lbExitDraw();
        showToast('Speichern fehlgeschlagen: ' + err.message);
    });
}

// Drawing touch/mouse handlers
(function() {
    var canvas;
    function getCanvas() { canvas = document.getElementById('lbCanvas'); return canvas; }
    function pos(e, c) {
        var r = c.getBoundingClientRect();
        var touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    }
    document.addEventListener('touchstart', function(e) {
        if (!_lbDraw.active) return;
        var c = getCanvas(); if (!c || !e.target.closest('#lbCanvas')) return;
        e.preventDefault();
        var p = pos(e, c);
        _lbDraw.current = [p];
        _lbDraw.ctx.beginPath(); _lbDraw.ctx.moveTo(p.x, p.y);
        _lbDraw.ctx.strokeStyle = _lbDraw.color; _lbDraw.ctx.lineWidth = _lbDraw.lineWidth;
    }, { passive: false });
    document.addEventListener('touchmove', function(e) {
        if (!_lbDraw.active || _lbDraw.current.length === 0) return;
        var c = getCanvas(); if (!c) return;
        e.preventDefault();
        var p = pos(e, c);
        _lbDraw.current.push(p);
        _lbDraw.ctx.lineTo(p.x, p.y); _lbDraw.ctx.stroke();
    }, { passive: false });
    document.addEventListener('touchend', function(e) {
        if (!_lbDraw.active || _lbDraw.current.length === 0) return;
        _lbDraw.strokes.push({ points: _lbDraw.current, color: _lbDraw.color, width: _lbDraw.lineWidth });
        _lbDraw.current = [];
    });
    // Mouse fallback (desktop)
    var mouseDown = false;
    document.addEventListener('mousedown', function(e) {
        if (!_lbDraw.active) return;
        var c = getCanvas(); if (!c || !e.target.closest('#lbCanvas')) return;
        e.preventDefault(); mouseDown = true;
        var p = pos(e, c);
        _lbDraw.current = [p];
        _lbDraw.ctx.beginPath(); _lbDraw.ctx.moveTo(p.x, p.y);
        _lbDraw.ctx.strokeStyle = _lbDraw.color; _lbDraw.ctx.lineWidth = _lbDraw.lineWidth;
    });
    document.addEventListener('mousemove', function(e) {
        if (!_lbDraw.active || !mouseDown) return;
        var c = getCanvas(); if (!c) return;
        var p = pos(e, c);
        _lbDraw.current.push(p);
        _lbDraw.ctx.lineTo(p.x, p.y); _lbDraw.ctx.stroke();
    });
    document.addEventListener('mouseup', function() {
        if (!_lbDraw.active || !mouseDown) return;
        mouseDown = false;
        if (_lbDraw.current.length > 0) {
            _lbDraw.strokes.push({ points: _lbDraw.current, color: _lbDraw.color, width: _lbDraw.lineWidth });
            _lbDraw.current = [];
        }
    });
})();

// Init: Herstellerbilder einsammeln, Metadaten laden, Galerie aus dem Repo aufbauen.
// Galerie-Overlay und Lightbox anlegen, falls die Seite sie nicht schon im
// Markup hat. So braucht eine neue Seite nur die [data-comp-gallery]-Container.
// Liegt gerade ein Overlay ueber der Seite? Pull-to-Refresh und der
// automatische Neustart nach einem Update duerfen dann nicht losgehen - sonst
// wird einem die Seite mitten in der Arbeit unter den Fingern weggezogen.
function anyOverlayOpen() {
    var sel = ['#galleryOverlay.show', '#photoLightbox.show', '#changelogOverlay.show',
               '.guide-overlay.show', '.settings-overlay.show'];
    for (var i = 0; i < sel.length; i++) {
        if (document.querySelector(sel[i])) return true;
    }
    return seiteIstGesperrt();
}

function ensureGalleryChrome() {
    if (!document.getElementById('galleryOverlay')) {
        var ov = document.createElement('div');
        ov.className = 'gallery-overlay';
        ov.id = 'galleryOverlay';
        ov.innerHTML =
            '<div class="gallery-header">'
          + '<h3 id="galleryTitle">Galerie</h3>'
          + '<button class="gallery-close" onclick="reloadGalleryFromRepo()" title="Galerie aus dem Repository neu laden" style="margin-left:auto;font-size:1.2rem;">&#8635;</button>'
          + '<button class="gallery-close" onclick="closeGallery()">&times;</button>'
          + '</div><div class="gallery-grid" id="galleryGrid"></div>';
        document.body.appendChild(ov);
    }
    if (!document.getElementById('photoLightbox')) {
        var lb = document.createElement('div');
        lb.className = 'photo-lightbox';
        lb.id = 'photoLightbox';
        lb.innerHTML =
            '<button class="close-lb" onclick="closeLightbox()">&times;</button>'
          + '<button class="nav-lb prev" onclick="lightboxNav(-1)">&#10094;</button>'
          + '<button class="nav-lb next" onclick="lightboxNav(1)">&#10095;</button>'
          + '<div class="lb-img-wrap" id="lbImgWrap">'
          + '<img src="" alt="Foto" id="lbImg">'
          + '<canvas id="lbCanvas" style="display:none;position:absolute;top:0;left:0;touch-action:none;"></canvas>'
          + '</div><div class="caption"></div>'
          + '<div class="lb-toolbar" id="lbToolbar">'
          + '<button class="lb-tool" id="lbBtnStar" onclick="lbSetHero()" title="Hauptbild">&#9733;</button>'
          + '<button class="lb-tool" id="lbBtnEdit" onclick="lbEditCaption()" title="Beschreibung">&#9998;</button>'
          + '<button class="lb-tool" id="lbBtnDraw" onclick="lbToggleDraw()" title="Zeichnen">&#128396;</button>'
          + '<button class="lb-tool lb-draw-only" id="lbBtnColor" onclick="lbCycleColor()" title="Farbe" style="display:none;">&#128308;</button>'
          + '<button class="lb-tool lb-draw-only" id="lbBtnUndo" onclick="lbUndoStroke()" title="Rueckgaengig" style="display:none;">&#8617;</button>'
          + '<button class="lb-tool lb-draw-only" id="lbBtnSaveDraw" onclick="lbSaveDrawing()" title="Zeichnung speichern" style="display:none;">&#10003;</button>'
          + '<button class="lb-tool lb-danger" id="lbBtnDel" onclick="lbDeletePhoto()" title="Loeschen">&#128465;</button>'
          + '</div>';
        document.body.appendChild(lb);
    }
}

function initCompPhotos() {
    ensureGalleryChrome();
    _collectDefaults();
    loadGalleryMeta();
    rebuildPhotoData();           // sofort aus dem Cache zeichnen (offline-tauglich)
    _renderAllGalleries();
    // Danach den echten Repo-Stand holen - braucht keinen Token.
    refreshGallery(false);
}

// Manuell ausloesbar, falls jemand auf einem anderen Geraet Fotos hinzugefuegt hat.
async function reloadGalleryFromRepo() {
    showToast('Galerie wird aus dem Repo geladen...');
    var n = await refreshGallery(true);
    if (n < 0) { showToast('Galerie-Update fehlgeschlagen'); return; }
    showToast(n + ' Fotos geladen');
}
