/**
 * github-zugang.js - GitHub-Token pruefen und mit dem Datenspeicher (Gist)
 * verbinden.
 *
 * WORTGLEICH in gt40-engine, jerico-dog-box-assembly-manual und
 * Mustang-Car-Alignment (verglichen wird der Inhalt ohne Zeilenenden). Wer
 * hier etwas aendert, aendert es in allen drei. Was je App verschieden ist,
 * steht in ihrem Aufruf von GithubZugang.einrichten().
 *
 * Anlass (2026-10-30): alignment meldete beim Verbinden nur einen 403. Erst
 * hinterher liess sich ermitteln, dass ein anderer Token drinsteckte als in
 * gt40 und jerico. Peters Vorgabe: Was ein Token koennen muss, steht fest,
 * bevor eine App auf einen Fehler stoesst. Darum, in dieser Reihenfolge:
 *
 *   1. Der Dialog nennt vorher Token-Art und Haken ([data-token-vorgabe]).
 *   2. Beim Verbinden zuerst Konto, Token-Art und Haken lesen. Fehlt einem
 *      klassischen Token ein Pflicht-Haken, wird nichts weiter versucht.
 *   3. Eine bekannte Datenspeicher-ID zuerst pruefen, dann die Liste. Eine
 *      gescheiterte Suche ist kein "nicht gefunden" - daraus entstand frueher
 *      ein zweiter Gist, und die Geraete schrieben in getrennte Speicher.
 *   4. Neu anlegen nur nach Rueckfrage.
 *   5. Token und ID erst speichern, wenn alles steht. In Safari teilen sich
 *      die drei Apps den Token (gh_token); ein falscher Token in einer App
 *      nahm sonst allen den Abgleich.
 *   6. Jede Meldung nennt Konto, Status und GitHubs Antwort; Fehler gehen
 *      mit `detail` ins Fehlerprotokoll der App.
 *
 * Konzept: Vault, Projects/Bastelbude-Apps/
 *   "GitHub-Token - Bestandsaufnahme und Konzept (2026-10-30)".
 */
(function (global) {
  'use strict';

  var API = 'https://api.github.com';
  var TOKEN_KEY = 'gh_token';
  var ANLEGEN = 'https://github.com/settings/tokens/new';
  // Die Vorgabe fuer alle drei Apps: ein klassischer Token mit diesen Haken.
  var STANDARD = ['gist', 'public_repo'];
  var ART_TEXT = {
    klassisch: 'klassischer Token', fein: 'fine-grained Token',
    oauth: 'OAuth-Token', unbekannt: 'Token'
  };

  var _cfg = null;

  function tokenArt(token) {
    if (/^ghp_/.test(token)) return 'klassisch';
    if (/^github_pat_/.test(token)) return 'fein';
    if (/^gho_/.test(token)) return 'oauth';
    return 'unbekannt';
  }

  /** Welche der verlangten Haken fehlen? `repo` deckt `public_repo` ab. */
  function fehlt(haken, verlangt) {
    return verlangt.filter(function (h) {
      return haken.indexOf(h) < 0 && !(h === 'public_repo' && haken.indexOf('repo') > -1);
    });
  }

  function code(h) { return '<code>' + h + '</code>'; }

  /** Der Text fuer den Dialog - was dieser Token koennen muss, vor der Eingabe. */
  function vorgabeHtml(cfg) {
    var zusatz = cfg.zusatz || {};
    var teile = cfg.pflicht.map(function (h) { return code(h) + ' (Cloud-Sync, Pflicht)'; })
      .concat(Object.keys(zusatz).map(function (h) { return code(h) + ' (' + zusatz[h] + ')'; }));
    return 'Klassischer Token (' + code('ghp_&hellip;') + '). Diese App braucht: ' + teile.join(', ') + '. '
      + 'Derselbe Token gilt f&uuml;r gt40, jerico und alignment, mit genau den Haken '
      + STANDARD.map(code).join(' und ') + '. Anlegen: <a href="' + ANLEGEN + '" target="_blank" rel="noopener">'
      + 'github.com/settings/tokens/new</a>. Beim Verbinden nennt die App Konto und Haken, bevor sie etwas versucht. '
      + 'Gespeichert wird der Token erst, wenn die Verbindung steht.';
  }

  function vorgabeEinsetzen() {
    if (!_cfg || typeof document === 'undefined') return;
    var els = document.querySelectorAll('[data-token-vorgabe]');
    for (var i = 0; i < els.length; i++) els[i].innerHTML = vorgabeHtml(_cfg);
  }

  async function fehlerAus(res) {
    var roh = ''; try { roh = await res.text(); } catch (e) {}
    var meldung = ''; try { meldung = (JSON.parse(roh).message) || ''; } catch (e) {}
    return { status: res.status, statusText: res.statusText, antwort: roh.slice(0, 2000), meldung: meldung, url: res.url };
  }

  function holen(pfad, token, opts) {
    opts = opts || {};
    var kopf = { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' };
    if (opts.body) kopf['Content-Type'] = 'application/json';
    return fetch(API + pfad, { method: opts.method || 'GET', headers: kopf, body: opts.body });
  }

  /** Konto, Token-Art und Haken. Klassische und OAuth-Tokens nennen ihre Haken im Kopf. */
  function bildVon(token, res, user) {
    var kopf = res.headers.get('X-OAuth-Scopes');
    var haken = kopf === null ? null
      : kopf.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var art = tokenArt(token);
    var konto = (user && user.login) || '?';
    return {
      konto: konto, art: art, haken: haken,
      text: 'Konto ' + konto + ', ' + ART_TEXT[art] + (haken ? ', Haken: ' + (haken.join(', ') || 'keine') : '')
    };
  }

  /** Was bei 401/403/404 auf einem Gist-Aufruf zu tun ist - je nach Token-Art. */
  function zugriffHinweis(b, f) {
    if (f.status !== 401 && f.status !== 403 && f.status !== 404) return '';
    if (b.art === 'fein') {
      return ' Bei einem fine-grained Token: unter "Account permissions" bei "Gists" "Read and write" setzen.'
        + ' Einfacher ist ein klassischer Token mit den Haken ' + STANDARD.join(' und ') + '.';
    }
    return ' Der Token braucht den Haken "gist". Die genaue Antwort steht im Fehlerprotokoll.';
  }

  function fehlerText(text, f) {
    return text + ' (' + f.status + (f.meldung ? ': ' + f.meldung : '') + ').';
  }

  /** Bekannte ID zuerst, dann die Liste. { id } | {} | { fehler } | { fremd } */
  async function suchen(token, b) {
    var ids = [];
    try { var s = localStorage.getItem(_cfg.gistIdKey); if (s) ids.push(s); } catch (e) {}
    if (_cfg.bekannteId && ids.indexOf(_cfg.bekannteId) < 0) ids.push(_cfg.bekannteId);

    for (var k = 0; k < ids.length; k++) {
      var r = await holen('/gists/' + ids[k], token);
      if (r.status === 404) continue;                 // geloescht - weiter suchen
      if (!r.ok) return { fehler: await fehlerAus(r), quelle: 'gist ' + ids[k] };
      var g = await r.json();
      if (!g.files || !g.files[_cfg.datei]) continue;
      // Ein geheimer Gist ist fuer jeden mit der ID lesbar. Schreiben darf nur
      // sein Konto - ein fremder Token wuerde hier erst beim Speichern scheitern.
      if (g.owner && g.owner.login && g.owner.login !== b.konto) return { fremd: g.owner.login };
      return { id: g.id || ids[k] };
    }

    for (var page = 1; page <= 5; page++) {
      var l = await holen('/gists?per_page=100&page=' + page, token);
      if (!l.ok) return { fehler: await fehlerAus(l), quelle: 'liste' };
      var liste = await l.json();
      if (!liste.length) break;
      for (var i = 0; i < liste.length; i++) {
        if (liste[i].files && liste[i].files[_cfg.datei]) return { id: liste[i].id };
      }
    }
    return {};                                         // durchgesucht, nichts da
  }

  async function anlegen(token) {
    var files = {};
    files[_cfg.datei] = { content: (_cfg.startInhalt && _cfg.startInhalt()) || '{}' };
    var r = await holen('/gists', token, {
      method: 'POST',
      body: JSON.stringify({ description: _cfg.beschreibung, public: false, files: files })
    });
    if (!r.ok) return { fehler: await fehlerAus(r) };
    return { id: (await r.json()).id };
  }

  /**
   * Verbinden. ui.melden(text, opts) ist das showToast der App, ui.fragen(text)
   * eine Rueckfrage (Standard: confirm). Gibt { ok, gistId, bild, hinweise }.
   */
  async function verbinden(token, ui) {
    var melden = ui.melden;
    var fragen = ui.fragen || function (t) { return global.confirm(t); };
    var FEHLER = function (detail) { return { sticky: true, isError: true, detail: detail }; };
    token = String(token || '').trim();
    if (!_cfg) throw new Error('GithubZugang.einrichten() fehlt');
    if (!token) { melden('Bitte Token eingeben.', FEHLER()); return { ok: false }; }

    try {
      melden('Prüfe Token …');
      var res = await holen('/user', token);
      if (!res.ok) {
        var f0 = await fehlerAus(res);
        melden(fehlerText(f0.status === 401 ? 'Token ungültig, abgelaufen oder widerrufen'
          : 'GitHub hat den Token nicht angenommen', f0), FEHLER({ quelle: 'user', status: f0.status, antwort: f0.antwort, url: f0.url }));
        return { ok: false };
      }
      var b = bildVon(token, res, await res.json());

      if (b.haken) {
        var fehlen = fehlt(b.haken, _cfg.pflicht);
        if (fehlen.length) {
          melden(b.text + '. Für den Cloud-Sync fehlt der Haken "' + fehlen.join('", "') + '". '
            + 'GitHub: Settings > Developer settings > Personal access tokens > Tokens (classic) > Token öffnen > '
            + 'Haken setzen > Update token. Der Token bleibt dabei derselbe.',
            FEHLER({ quelle: 'haken', konto: b.konto, art: b.art, haken: b.haken, fehlt: fehlen }));
          return { ok: false, bild: b };
        }
      }
      var hinweise = [];
      var zusatz = _cfg.zusatz || {};
      Object.keys(zusatz).forEach(function (h) {
        if (b.haken && fehlt(b.haken, [h]).length) {
          hinweise.push(zusatz[h] + ' geht mit diesem Token nicht: Haken "' + h + '" fehlt.');
        } else if (!b.haken) {
          hinweise.push(zusatz[h] + ': bei diesem Token nicht prüfbar (braucht "Contents: Read and write").');
        }
      });

      melden(b.text + '. Suche Datenspeicher...');
      var s = await suchen(token, b);
      if (s.fehler) {
        melden(fehlerText('Datenspeicher nicht lesbar', s.fehler) + zugriffHinweis(b, s.fehler),
          FEHLER({ quelle: 'suchen ' + s.quelle, konto: b.konto, art: b.art, haken: b.haken,
                   status: s.fehler.status, antwort: s.fehler.antwort, url: s.fehler.url }));
        return { ok: false, bild: b };
      }
      if (s.fremd) {
        melden('Der Datenspeicher dieser App gehört Konto ' + s.fremd + ', der Token aber ' + b.text
          + '. Bitte einen Token von ' + s.fremd + ' verwenden.', FEHLER({ quelle: 'fremd', konto: b.konto, besitzer: s.fremd }));
        return { ok: false, bild: b };
      }

      var id = s.id;
      if (!id) {
        if (!fragen(b.text + '.\n\nUnter diesem Konto ist kein Datenspeicher für ' + _cfg.app + ' zu sehen. '
          + 'Neu anlegen ist nur beim allerersten Gerät richtig. Ist ein anderes Gerät schon verbunden, '
          + 'hier abbrechen und dort den Token vergleichen.'
          + (b.art === 'fein' ? ' Bei einem fine-grained Token ohne die Berechtigung "Gists" sieht die Liste immer leer aus.' : '')
          + '\n\nNeu anlegen?')) {
          melden('Nicht verbunden: ' + b.text + ', kein Datenspeicher zu sehen.', FEHLER({ quelle: 'abgebrochen', konto: b.konto }));
          return { ok: false, bild: b };
        }
        var a = await anlegen(token);
        if (a.fehler) {
          melden(fehlerText('Datenspeicher konnte nicht angelegt werden', a.fehler) + zugriffHinweis(b, a.fehler),
            FEHLER({ quelle: 'anlegen', konto: b.konto, art: b.art, haken: b.haken,
                     status: a.fehler.status, antwort: a.fehler.antwort, url: a.fehler.url }));
          return { ok: false, bild: b };
        }
        id = a.id;
      }

      // Erst jetzt speichern - alles steht.
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(_cfg.gistIdKey, id);
      melden('Verbunden: ' + b.text + '.' + (hinweise.length ? ' ' + hinweise.join(' ') : ''),
        hinweise.length ? { sticky: true } : undefined);
      return { ok: true, gistId: id, bild: b, hinweise: hinweise };
    } catch (err) {
      melden('Keine Verbindung zu GitHub: ' + err.message, FEHLER({ quelle: 'netz', antwort: String(err.stack || err) }));
      return { ok: false };
    }
  }

  /**
   * Je App einmal beim Laden:
   *   app          Name in Meldungen ('alignment')
   *   datei        Dateiname im Gist, an dem der Datenspeicher erkannt wird
   *   beschreibung Beschreibung beim Neuanlegen
   *   gistIdKey    localStorage-Schluessel der Gist-ID
   *   pflicht      Haken, ohne die nichts geht (['gist'])
   *   zusatz       { haken: 'wofuer' } - fehlt einer, wird verbunden und gewarnt
   *   bekannteId   optional: ID, die vor der Liste geprueft wird
   *   startInhalt  optional: function () -> Inhalt beim Neuanlegen
   */
  function einrichten(cfg) {
    _cfg = cfg;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vorgabeEinsetzen);
      else vorgabeEinsetzen();
    }
  }

  global.GithubZugang = {
    einrichten: einrichten,
    verbinden: verbinden,
    vorgabeHtml: vorgabeHtml,
    tokenArt: tokenArt,
    fehlt: fehlt,
    STANDARD: STANDARD,
    TOKEN_KEY: TOKEN_KEY,
    konfiguration: function () { return _cfg; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
