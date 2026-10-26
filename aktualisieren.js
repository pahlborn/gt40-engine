/**
 * aktualisieren.js - eine neue Version erreicht jede offene Seite.
 *
 * Wortgleich in gt40-engine, jerico und alignment.
 *
 * Neu geoeffnet holt jede Seite ohnehin die neueste Fassung: der Service
 * Worker fragt zuerst das Netz. Eine offene Seite aber - am iPad die App, zu
 * der man nur zurueckwechselt - behielt ihren Code. In jerico und alignment
 * bis zum Neuladen von Hand; in gt40 stand die Pruefung in jeder Seite einzeln.
 *
 * Hier: alle 60 s und bei jeder Rueckkehr auf die Seite nach einer neuen
 * Fassung fragen. Uebernimmt der neue Service Worker die Seite, wird neu
 * geladen - aber nicht mitten in der Arbeit: nicht, solange ein Feld den
 * Fokus hat oder ein Overlay offen ist, spaetestens nach 10 Minuten. Beim
 * allerersten Besuch wird nicht neu geladen. Eingetragenes sichern die Seiten
 * beim Verlassen lokal; was noch nicht oben ist, geht nach dem Neuladen hoch.
 */
(function (global) {
  'use strict';

  var PRUEF_MS = 60000;
  var _geplant = false;

  function belegt() {
    var d = global.document;
    var a = d && d.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return true;
    if (typeof global.anyOverlayOpen === 'function') {
      try { return !!global.anyOverlayOpen(); } catch (e) {}
    }
    return false;
  }

  /** Neu laden, sobald nichts in Arbeit ist - spaetestens nach 10 Minuten. */
  function neueVersion() {
    if (_geplant) return;
    _geplant = true;
    if (typeof global.showToast === 'function') {
      try { global.showToast('Neue Version - die Seite wird neu geladen, sobald nichts eingegeben wird.'); } catch (e) {}
    }
    var versuche = 0;
    (function warte() {
      if (!belegt() || versuche > 600) {
        var laden = (global.Aktualisieren && global.Aktualisieren.neuLaden)
          || function () { global.location.reload(); };
        laden();
        return;
      }
      versuche++;
      setTimeout(warte, 1000);
    })();
  }

  function starten() {
    var nav = global.navigator;
    if (!nav || !nav.serviceWorker) return;
    var warSchonGesteuert = !!nav.serviceWorker.controller;
    nav.serviceWorker.addEventListener('controllerchange', function () {
      // Beim allerersten Besuch uebernimmt der Service Worker die Seite auch -
      // das ist keine neue Version.
      if (!warSchonGesteuert) { warSchonGesteuert = true; return; }
      neueVersion();
    });
    nav.serviceWorker.register('sw.js').then(function (reg) {
      function pruefen() { try { reg.update(); } catch (e) {} }
      setInterval(pruefen, PRUEF_MS);
      global.document.addEventListener('visibilitychange', function () {
        if (!global.document.hidden) pruefen();
      });
      global.addEventListener('pageshow', function (e) { if (e.persisted) pruefen(); });
    }).catch(function () {});
  }

  global.Aktualisieren = { neueVersion: neueVersion, starten: starten, neuLaden: null };

  if (global.document && global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', starten);
  } else {
    starten();
  }
})(typeof window !== 'undefined' ? window : globalThis);
