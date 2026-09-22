/**
 * validation.js - Eingabevalidierung fuer numerische Felder.
 *
 * Wird von allen Seiten geladen. Erkennt anhand des Platzhalters und des
 * Feldnamens, ob ein Feld numerisch ist, und verhindert unsinnige Eingaben.
 *
 * Validierungsregeln:
 *   data-validate="numeric"          -> nur Zahlen, Punkt, Komma, Minus
 *   data-validate="numeric:0.001:0.010" -> wie numeric, plus Bereichspruefung
 *   data-validate="integer"          -> nur Ganzzahlen
 *
 * Felder OHNE data-validate bleiben frei (Kommentare, Beschreibungen etc.).
 * Die Validierung greift on-blur (nach dem Verlassen), nicht on-input, damit
 * man in Ruhe tippen kann.
 */
(function (global) {
  'use strict';

  var NUMERIC_RE = /^-?\d*[.,]?\d*$/;
  var INTEGER_RE = /^-?\d*$/;

  /** Punkt und Komma normalisieren -> Punkt. */
  function norm(v) { return (v || '').replace(/,/g, '.').trim(); }

  /**
   * Wert setzen und die Seite davon in Kenntnis setzen.
   *
   * Die Messwertfelder haengen mit oninput="autoSave()" am input-Ereignis.
   * Eine Zuweisung an el.value loest das nicht aus - der normalisierte Wert
   * stuende dann nur in der Anzeige, waehrend gespeichert die Fassung mit
   * Komma bliebe. Beim naechsten Laden schreibt applyData() sie zurueck und
   * die Normalisierung ist wieder weg.
   */
  function setzeWert(el, wert) {
    if (el.value === wert) return;
    el.value = wert;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Visuelles Feedback: ok / warn / error. */
  function setStatus(el, status) {
    el.classList.remove('status-ok', 'status-warn', 'status-error');
    if (status) el.classList.add('status-' + status);
  }

  /** Ein einzelnes Feld pruefen. Gibt true zurueck wenn gueltig. */
  function validateField(el) {
    var rule = (el.dataset.validate || '').split(':');
    var type = rule[0];
    if (!type) return true;

    var raw = el.value.trim();
    if (raw === '') { setStatus(el, ''); return true; }  // Leer ist OK

    var n = norm(raw);

    if (type === 'integer') {
      if (!INTEGER_RE.test(n)) {
        setStatus(el, 'error');
        return false;
      }
      var iv = parseInt(n, 10);
      // '-' allein passt auf INTEGER_RE, ergibt aber NaN. Ohne diese Pruefung
      // landet der String "NaN" im Messwertfeld.
      if (isNaN(iv)) { setStatus(el, 'error'); return false; }
      if (rule[1] !== undefined && rule[2] !== undefined) {
        var imin = parseInt(rule[1], 10), imax = parseInt(rule[2], 10);
        setStatus(el, iv >= imin && iv <= imax ? 'ok' : 'error');
      } else { setStatus(el, 'ok'); }
      setzeWert(el, iv.toString());
      return true;
    }

    if (type === 'numeric') {
      if (!NUMERIC_RE.test(n)) {
        setStatus(el, 'error');
        return false;
      }
      var fv = parseFloat(n);
      if (isNaN(fv)) { setStatus(el, 'error'); return false; }
      if (rule[1] !== undefined && rule[2] !== undefined) {
        var fmin = parseFloat(rule[1]), fmax = parseFloat(rule[2]);
        if (fv >= fmin && fv <= fmax) setStatus(el, 'ok');
        else setStatus(el, 'error');
      } else { setStatus(el, 'ok'); }
      // Komma -> Punkt normalisieren
      if (raw.indexOf(',') !== -1) setzeWert(el, n);
      return true;
    }

    return true;
  }

  /** Alle Felder mit data-validate pruefen. */
  function validateAll(root) {
    var fields = (root || document).querySelectorAll('[data-validate]');
    var ok = true;
    fields.forEach(function (el) { if (!validateField(el)) ok = false; });
    return ok;
  }

  /** Automatisch blur-Handler an alle [data-validate]-Felder binden. */
  function init(root) {
    (root || document).querySelectorAll('[data-validate]').forEach(function (el) {
      el.addEventListener('blur', function () { validateField(el); });
      // Beim Tippen: nur rote Markierung entfernen wenn der Wert jetzt passt
      el.addEventListener('input', function () {
        if (el.classList.contains('status-error')) validateField(el);
      });
    });
  }

  global.Validation = {
    validateField: validateField,
    validateAll: validateAll,
    init: init
  };
})(typeof window !== 'undefined' ? window : globalThis);
