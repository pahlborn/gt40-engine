/**
 * field-sync.js - Speichern und Zusammenfuehren der Messwert-Felder.
 *
 * Wird von index.html, specs.html und build-log.html gemeinsam genutzt.
 * Muss VOR dem Inline-Script der Seite geladen werden (im <head>).
 *
 * Hintergrund
 * -----------
 * Frueher galt an beiden Stellen die Regel "leer gewinnt nie":
 *
 *     if (current[key] === '' ...) { if (existing[key]) continue; }   // Speichern
 *     if (wVal !== '' ) merged[k] = wVal; else merged[k] = lVal;      // Merge
 *
 * Damit war das Leeren eines Feldes schlicht nicht ausdrueckbar. Wer einen
 * Messwert loeschen wollte, bekam ihn beim naechsten Laden zurueck - lokal
 * schon beim Speichern, spaetestens aber aus der Cloud.
 *
 * Stattdessen bekommt jedes Feld einen eigenen Zeitstempel (_fieldTimes).
 * Beim Merge gewinnt der juengere Eintrag - auch wenn er leer ist. Ein
 * geloeschter Wert ist damit eine ganz normale Aenderung.
 *
 * Altbestand ohne _fieldTimes: fuer Felder, zu denen keine Seite einen
 * Zeitstempel hat, gilt weiter die alte Heuristik (nicht-leer gewinnt).
 * Sonst wuerden beim ersten Sync nach dem Update Werte verschwinden.
 */
(function (global) {
  'use strict';

  var TIMES_KEY = '_fieldTimes';

  function isBlank(v) { return v === undefined || v === '' || v === null; }

  /** Zeitstempel eines Feldes, mit Rueckfall auf den Zeitstempel des ganzen Datensatzes. */
  function fieldTime(data, times, key, fallback) {
    if (times && times[key] !== undefined) return times[key];
    return Object.prototype.hasOwnProperty.call(data, key) ? fallback : -1;
  }

  /**
   * Aktuelle Feldwerte in den bestehenden Datensatz uebernehmen.
   *
   * @param {object} existing  bisheriger Datensatz (aus localStorage)
   * @param {object} current   Werte der Felder, die DIESE Seite anzeigt
   * @param {object} opts      opts.recordClears = false -> Leeren nicht als
   *                           Aenderung werten (waehrend die Seite noch laedt)
   * @returns {object} neuer Datensatz inklusive _fieldTimes und _savedAt
   */
  function mergeIntoExisting(existing, current, opts) {
    existing = existing || {};
    opts = opts || {};
    var recordClears = opts.recordClears !== false;
    var now = opts.now || Date.now();

    var data = Object.assign({}, existing);
    var times = Object.assign({}, existing[TIMES_KEY] || {});

    for (var key in current) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
      if (key.charAt(0) === '_') continue;

      var next = current[key];
      var prev = existing[key];
      var clearing = isBlank(next) || next === false;

      // Solange die Seite noch laedt, stehen alle Felder auf leer. Ein Save in
      // diesem Moment darf nichts loeschen.
      if (clearing && !recordClears && !isBlank(prev) && prev !== false) continue;

      if (next !== prev) times[key] = now;
      data[key] = next;
    }

    data[TIMES_KEY] = times;
    data._savedAt = new Date(now).toISOString();
    return data;
  }

  /**
   * Cloud- und lokalen Datensatz zusammenfuehren. Pro Feld gewinnt der
   * juengere Zeitstempel - ein geloeschter Wert also auch.
   */
  function mergeRecords(cloudData, localData) {
    cloudData = cloudData || {};
    localData = localData || {};

    var cloudTimes = cloudData[TIMES_KEY] || {};
    var localTimes = localData[TIMES_KEY] || {};
    var cloudFallback = new Date(cloudData._savedAt || 0).getTime();
    var localFallback = new Date(localData._savedAt || 0).getTime();

    var merged = {};
    var mergedTimes = {};
    var keys = Object.keys(localData).concat(Object.keys(cloudData));
    var seen = {};

    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (seen[k]) continue;
      seen[k] = 1;
      if (k.charAt(0) === '_') continue;

      var hasC = cloudTimes[k] !== undefined;
      var hasL = localTimes[k] !== undefined;
      var cVal = cloudData[k], lVal = localData[k];

      if (!hasC && !hasL) {
        // Altbestand: keine Seite kennt einen Zeitstempel fuer dieses Feld.
        // Alte Heuristik beibehalten, damit nichts verloren geht.
        if (!isBlank(cVal) && !isBlank(lVal)) {
          merged[k] = cloudFallback >= localFallback ? cVal : lVal;
        } else if (!isBlank(cVal)) { merged[k] = cVal; }
        else if (!isBlank(lVal)) { merged[k] = lVal; }
        else { merged[k] = cVal !== undefined ? cVal : lVal; }
        continue;
      }

      var ct = fieldTime(cloudData, cloudTimes, k, cloudFallback);
      var lt = fieldTime(localData, localTimes, k, localFallback);
      if (ct >= lt) { merged[k] = cVal; mergedTimes[k] = ct; }
      else { merged[k] = lVal; mergedTimes[k] = lt; }
      if (merged[k] === undefined) delete merged[k];
    }

    merged[TIMES_KEY] = mergedTimes;
    merged._savedAt = new Date(Math.max(cloudFallback, localFallback) || Date.now()).toISOString();
    return merged;
  }

  /** Feldwerte der aktuellen Seite einsammeln. */
  function collectFields(root) {
    var out = {};
    (root || document).querySelectorAll('[data-field]').forEach(function (el) {
      out[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return out;
  }

  global.FieldSync = {
    TIMES_KEY: TIMES_KEY,
    isBlank: isBlank,
    collectFields: collectFields,
    mergeIntoExisting: mergeIntoExisting,
    mergeRecords: mergeRecords
  };
})(typeof window !== 'undefined' ? window : globalThis);
