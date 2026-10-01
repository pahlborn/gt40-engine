/**
 * errorlog.js - Fehlerprotokoll, das auch dann schreibt, wenn der Sync klemmt.
 *
 * Vorgaenger war logErrorToGist(), dreimal gleichlautend in die Seiten kopiert.
 * Es schrieb den Fehler in denselben Gist, der gerade nicht beschreibbar war -
 * ausgerechnet beim Sync-Fehler, dem haeufigsten Fall, protokollierte es nichts.
 * Dazu verwarf es Statuscode und Antworttext der API und behielt nur den Satz
 * aus dem Toast. Genau die beiden Angaben braucht man aber zur Analyse.
 *
 * Jetzt: erst localStorage, dann - wenn es geht - der Gist. Der Gist ist die
 * Kuer, nicht die Pflicht. Ein Protokoll, das mit dem Fehler ausfaellt, ist
 * keins.
 *
 * Erfasst wird ausserdem, was sonst niemand sieht: window.onerror und
 * abgewiesene Promises. Die laufen bisher stumm in die Konsole.
 *
 * Oeffentlich:
 *   ErrorLog.add(nachricht, detail)  Eintrag schreiben (detail optional)
 *   ErrorLog.alle()                  alle Eintraege, aelteste zuerst
 *   ErrorLog.leeren()                Protokoll loeschen
 *   ErrorLog.alsText()               zum Kopieren und Verschicken
 *   ErrorLog.spiegelSetzen(fn)       optionaler Gist-Spiegel, siehe unten
 */
(function (global) {
  'use strict';

  var SCHLUESSEL = 'engineErrorLog';
  var MAX = 100;              // Ringpuffer. Aeltere fallen hinten raus.
  var MAX_TEXT = 2000;        // Antworttexte koennen lang sein; gekuerzt reicht.
  var spiegel = null;         // Funktion(eintraege) -> Promise, vom Aufrufer gesetzt

  function lies() {
    try {
      var roh = localStorage.getItem(SCHLUESSEL);
      var arr = roh ? JSON.parse(roh) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function schreibe(arr) {
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify(arr));
      return true;
    } catch (e) {
      // Speicher voll oder gesperrt: lieber die Haelfte opfern als gar nichts
      // behalten. Der juengste Eintrag ist der interessanteste.
      try {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(arr.slice(-Math.floor(MAX / 4))));
        return true;
      } catch (e2) { return false; }
    }
  }

  function kuerze(s) {
    s = String(s == null ? '' : s);
    return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) + ' […' + (s.length - MAX_TEXT) + ' Zeichen gekuerzt]' : s;
  }

  function seite() {
    try {
      var p = location.pathname.split('/').pop();
      return p || 'index.html';
    } catch (e) { return 'unbekannt'; }
  }

  function geraet() {
    try {
      return (typeof FieldSync !== 'undefined' && FieldSync.getDeviceId)
        ? FieldSync.getDeviceId() : 'unbekannt';
    } catch (e) { return 'unbekannt'; }
  }

  /**
   * Einen Eintrag schreiben. Wirft nie - ein Protokoll darf die Seite nicht
   * mit in den Abgrund ziehen.
   *
   * detail darf enthalten: status, statusText, antwort (Rohtext der API),
   * stack, quelle, url. Alles optional.
   */
  function add(nachricht, detail) {
    try {
      var e = {
        zeit: new Date().toISOString(),
        seite: seite(),
        version: typeof APP_VERSION === 'string' ? APP_VERSION : '',
        geraet: geraet(),
        online: typeof navigator !== 'undefined' ? !!navigator.onLine : null,
        nachricht: kuerze(nachricht)
      };
      if (detail && typeof detail === 'object') {
        ['quelle', 'status', 'statusText', 'antwort', 'stack', 'url'].forEach(function (k) {
          if (detail[k] !== undefined && detail[k] !== null && detail[k] !== '') {
            e[k] = (k === 'status') ? detail[k] : kuerze(detail[k]);
          }
        });
      }
      var arr = lies();
      arr.push(e);
      if (arr.length > MAX) arr = arr.slice(-MAX);
      schreibe(arr);
      // Der Gist ist die Kuer. Schlaegt er fehl, bleibt der Eintrag lokal.
      if (spiegel) { try { Promise.resolve(spiegel(arr)).catch(function () {}); } catch (e2) {} }
      return e;
    } catch (e) {
      try { console.error('[Fehlerprotokoll] konnte nicht schreiben:', e && e.message); } catch (e2) {}
      return null;
    }
  }

  function alle() { return lies(); }

  function leeren() {
    try { localStorage.removeItem(SCHLUESSEL); return true; } catch (e) { return false; }
  }

  /** Eine Fassung zum Kopieren in eine Nachricht oder ein Ticket. */
  function alsText() {
    var arr = lies();
    if (!arr.length) return 'Fehlerprotokoll leer.';
    return arr.map(function (e) {
      var zeilen = [
        e.zeit + '  ' + (e.seite || '') + '  ' + (e.version || '') +
        '  Geraet ' + (e.geraet || '') + (e.online === false ? '  [offline]' : ''),
        '  ' + e.nachricht
      ];
      if (e.quelle) zeilen.push('  Quelle:  ' + e.quelle);
      if (e.status !== undefined) zeilen.push('  Status:  ' + e.status + ' ' + (e.statusText || ''));
      if (e.url) zeilen.push('  URL:     ' + e.url);
      if (e.antwort) zeilen.push('  Antwort: ' + e.antwort);
      if (e.stack) zeilen.push('  Stack:   ' + e.stack);
      return zeilen.join('\n');
    }).join('\n\n');
  }

  /**
   * Optionalen Gist-Spiegel setzen. Die Seiten reichen hier eine Funktion
   * herein, die den Puffer hochlaedt - das Modul selbst kennt weder Token
   * noch Gist-Id.
   */
  function spiegelSetzen(fn) { spiegel = typeof fn === 'function' ? fn : null; }

  // --- Was sonst niemand sieht ---------------------------------------------
  // Ein Tippfehler in einer Funktion, die nur selten laeuft, landet heute
  // stumm in der Konsole. Auf einem Telefon sieht die niemand.
  function hooksSetzen() {
    if (typeof window === 'undefined' || window.__errorlogHooks) return;
    window.__errorlogHooks = true;
    window.addEventListener('error', function (ev) {
      if (!ev) return;
      add(ev.message || 'Unbehandelter Fehler', {
        quelle: 'window.onerror',
        url: (ev.filename || '') + (ev.lineno ? ':' + ev.lineno : ''),
        stack: ev.error && ev.error.stack
      });
    });
    window.addEventListener('unhandledrejection', function (ev) {
      var g = ev && ev.reason;
      add((g && g.message) || String(g) || 'Abgewiesenes Promise', {
        quelle: 'unhandledrejection',
        stack: g && g.stack
      });
    });
  }

  // --- Ansicht ------------------------------------------------------------
  // Gleiche Bauart wie reference.js und der Exkurs: ein Overlay, keine eigene
  // Seite. Wer an der Werkbank einen Fehler nachsieht, verliert seinen Schritt
  // nicht.

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function baueOverlay() {
    if (document.getElementById('guide-errorlog')) return;
    var t = [];
    t.push('<div class="guide-overlay" id="guide-errorlog">');
    t.push('<div class="glossary-search"><div class="glossary-search-row">');
    t.push('<button class="guide-back" onclick="hideGuide(\'guide-errorlog\')">&larr;</button>');
    t.push('<span style="font-weight:700;">Fehlerprotokoll</span>');
    t.push('<span class="glossary-count" id="errorlogCount"></span>');
    t.push('</div></div>');
    t.push('<div class="guide-content" id="errorlogBody"></div>');
    t.push('</div>');
    var h = document.createElement('div');
    h.innerHTML = t.join('');
    document.body.appendChild(h.firstChild);
  }

  function zeichne() {
    var koerper = document.getElementById('errorlogBody');
    var zaehler = document.getElementById('errorlogCount');
    if (!koerper) return;
    var arr = alle();
    if (zaehler) zaehler.textContent = arr.length ? arr.length + ' Eintraege' : '';

    var kopf = '<div class="info-box" style="margin-bottom:0.8rem;">'
      + 'Fehler landen hier automatisch - auch wenn der Cloud-Sync gerade nicht '
      + 'funktioniert, denn das Protokoll liegt auf diesem Geraet. Es haelt die '
      + 'letzten ' + MAX + ' Eintraege.'
      + '<div style="margin-top:0.5rem;display:flex;gap:0.4rem;flex-wrap:wrap;">'
      + '<button type="button" onclick="ErrorLog.kopieren()" style="padding:0.3rem 0.7rem;border:1px solid #cbd5e0;border-radius:6px;background:#fff;cursor:pointer;font-size:0.76rem;">Kopieren</button>'
      + '<button type="button" onclick="ErrorLog.herunterladen()" style="padding:0.3rem 0.7rem;border:1px solid #cbd5e0;border-radius:6px;background:#fff;cursor:pointer;font-size:0.76rem;">Als Datei speichern</button>'
      + '<button type="button" onclick="ErrorLog.leerenMitRueckfrage()" style="padding:0.3rem 0.7rem;border:1px solid #fc8181;border-radius:6px;background:#fff;color:#c53030;cursor:pointer;font-size:0.76rem;">Leeren</button>'
      + '</div></div>';

    if (!arr.length) {
      koerper.innerHTML = kopf + '<div class="ref-leer">Keine Fehler aufgezeichnet.</div>';
      return;
    }

    // Juengste zuerst - danach sucht man.
    var zeilen = arr.slice().reverse().map(function (e) {
      var z = ['<div class="el-eintrag" style="border-top:1px solid #e2e8f0;padding:0.6rem 0;">'];
      z.push('<div style="font-size:0.7rem;color:#718096;">' + esc(e.zeit)
           + ' &middot; ' + esc(e.seite) + ' &middot; ' + esc(e.version)
           + ' &middot; Geraet ' + esc(e.geraet)
           + (e.online === false ? ' &middot; <strong>offline</strong>' : '') + '</div>');
      z.push('<div style="font-weight:600;margin:0.2rem 0;">' + esc(e.nachricht) + '</div>');
      var zusatz = [];
      if (e.quelle) zusatz.push('Quelle: ' + esc(e.quelle));
      if (e.status !== undefined) zusatz.push('Status: ' + esc(e.status) + ' ' + esc(e.statusText || ''));
      if (e.url) zusatz.push('URL: ' + esc(e.url));
      if (zusatz.length) z.push('<div style="font-size:0.74rem;color:#4a5568;">' + zusatz.join(' &middot; ') + '</div>');
      if (e.antwort) z.push('<pre style="font-size:0.7rem;background:#f7fafc;padding:0.4rem;border-radius:4px;overflow-x:auto;margin:0.3rem 0 0;">' + esc(e.antwort) + '</pre>');
      if (e.stack) z.push('<details style="margin-top:0.3rem;"><summary style="font-size:0.72rem;">Stack</summary><pre style="font-size:0.68rem;overflow-x:auto;">' + esc(e.stack) + '</pre></details>');
      z.push('</div>');
      return z.join('');
    });
    koerper.innerHTML = kopf + zeilen.join('');
  }

  function zeigen() {
    baueOverlay();
    zeichne();
    if (typeof showGuide === 'function') showGuide('guide-errorlog');
    else document.getElementById('guide-errorlog').classList.add('show');
  }

  function kopieren() {
    var text = alsText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (typeof showToast === 'function') showToast('Protokoll kopiert');
      }, function () { fensterFallback(text); });
    } else { fensterFallback(text); }
  }

  // Ohne Zwischenablage-Recht: Text sichtbar machen, damit er von Hand
  // markiert werden kann. Lieber umstaendlich als verloren.
  function fensterFallback(text) {
    var f = document.createElement('textarea');
    f.value = text;
    f.style.cssText = 'position:fixed;inset:5%;width:90%;height:80%;z-index:9999;font-size:0.7rem;';
    document.body.appendChild(f);
    f.select();
    f.addEventListener('blur', function () { f.remove(); });
  }

  function herunterladen() {
    try {
      var blob = new Blob([alsText()], { type: 'text/plain' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fehlerprotokoll-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) { fensterFallback(alsText()); }
  }

  function leerenMitRueckfrage() {
    if (!confirm('Fehlerprotokoll loeschen? Das laesst sich nicht rueckgaengig machen.')) return;
    leeren();
    zeichne();
  }

  global.showErrorLog = function () { if (typeof document !== 'undefined') zeigen(); };

  global.ErrorLog = {
    add: add, alle: alle, leeren: leeren, alsText: alsText,
    spiegelSetzen: spiegelSetzen, hooksSetzen: hooksSetzen,
    zeigen: zeigen, kopieren: kopieren, herunterladen: herunterladen,
    leerenMitRueckfrage: leerenMitRueckfrage,
    SCHLUESSEL: SCHLUESSEL, MAX: MAX
  };
  hooksSetzen();
})(typeof window !== 'undefined' ? window : globalThis);
