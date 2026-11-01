/**
 * hauptlager-mass.js - Laenge der aeusseren Hauptlagerschrauben bestimmen.
 *
 * Am Block fehlen die sechs aeusseren (schraegen) Schrauben der Deckel 2, 3
 * und 4. Ford nennt Gewinde und Guete (3/8"-16 UNC, Grade 8 HCS), aber keine
 * Laenge. Der Schritt 7a im Build Log erfasst die Messwerte; hier wird daraus
 * gerechnet - an genau einer Stelle (Regel 10), und nach jeder Eingabe und
 * jedem Abgleich neu (Regel 8).
 *
 *   T  Tiefe je Bohrung, entlang der schraegen Achse von der Auflageflaeche am
 *      Deckel bis zum Grund der Gewindebohrung im Block (Zoll)
 *   D  Dicke des Deckels an der Bohrung, entlang derselben Achse
 *   s  Dicke der vorgesehenen Scheibe (0, wenn ohne Scheibe)
 *   c  Abstand, den die Schraubenspitze zum Bohrungsgrund halten soll
 *   L  gewaehlte Laenge unter Kopf
 *
 *   groesste Laenge  = kleinstes T + s - c   (die Spitze darf nicht aufsitzen)
 *   Gewindeeingriff  = L - s - D             (wie weit die Schraube im Block traegt)
 *
 * Fuer c und fuer den noetigen Eingriff steht hier bewusst keine Zahl (Regel 5):
 * beides bestaetigen Ford oder ARP. Ohne c wird keine groesste Laenge genannt.
 */
(function (global) {
  'use strict';

  var BOHRUNGEN = ['p1_mo_t2rh', 'p1_mo_t2lh', 'p1_mo_t3rh', 'p1_mo_t3lh', 'p1_mo_t4rh', 'p1_mo_t4lh'];
  var MM = 25.4;

  function zahl(v) {
    var s = String(v == null ? '' : v).trim().replace(',', '.');
    if (!/^\d*\.?\d+$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  /** Reine Rechnung, ohne Seite - so in Node pruefbar. */
  function auswerten(w) {
    var t = (w.t || []).map(zahl).filter(function (x) { return x !== null && x > 0; });
    var s = zahl(w.s), c = zahl(w.c), d = zahl(w.d), l = zahl(w.l);
    var r = { gemessen: t.length, tmin: null, lmax: null, eingriff: null, zuLang: false, fehlt: [] };
    if (t.length) r.tmin = Math.min.apply(null, t);
    if (t.length < BOHRUNGEN.length) r.fehlt.push('tiefe');
    if (s === null) r.fehlt.push('scheibe');
    if (c === null) r.fehlt.push('abstand');
    if (r.tmin !== null && s !== null && c !== null) r.lmax = r.tmin + s - c;
    if (l !== null && s !== null && d !== null) r.eingriff = l - s - d;
    if (l !== null && r.lmax !== null && l > r.lmax + 1e-9) r.zuLang = true;
    return r;
  }

  function fmt(x) {
    return x === null ? '&ndash;' : x.toFixed(3) + '&quot; (' + (x * MM).toFixed(1) + ' mm)';
  }

  function feld(name) {
    return global.document ? global.document.querySelector('[data-field="' + name + '"]') : null;
  }
  function setze(id, html) {
    var el = global.document && global.document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function render() {
    if (!global.document || !feld('p1_mo_washer')) return null;
    var wert = function (n) { var e = feld(n); return e ? e.value : ''; };
    var r = auswerten({
      t: BOHRUNGEN.map(wert), s: wert('p1_mo_washer'), c: wert('p1_mo_clear'),
      d: wert('p1_mo_cap'), l: wert('p1_mo_len')
    });
    var en = global.document.documentElement.lang === 'en';
    setze('mo-gemessen', r.gemessen + ' / ' + BOHRUNGEN.length);
    setze('mo-tmin', fmt(r.tmin));
    setze('mo-lmax', r.lmax !== null ? '<strong>' + fmt(r.lmax) + '</strong>'
      : (r.fehlt.indexOf('abstand') >= 0
        ? (en ? 'open &ndash; enter the bottom clearance confirmed by Ford/ARP' : 'offen &ndash; Bodenabstand (von Ford/ARP best&auml;tigt) eintragen')
        : '&ndash;'));
    setze('mo-eingriff', fmt(r.eingriff));
    setze('mo-hinweis', r.zuLang
      ? '<span style="color:#c53030;font-weight:700;">' + (en ? 'Chosen length is longer than the maximum &ndash; the bolt would bottom out.' : 'Gew&auml;hlte L&auml;nge ist l&auml;nger als die gr&ouml;&szlig;te &ndash; die Schraube s&auml;&szlig;e auf.') + '</span>'
      : '');
    return r;
  }

  function onInput() {
    render();
    if (typeof global.autoSave === 'function') global.autoSave();
  }

  global.HauptlagerMass = { zahl: zahl, auswerten: auswerten, render: render, onInput: onInput, BOHRUNGEN: BOHRUNGEN };
  if (global.document && global.document.addEventListener) {
    global.document.addEventListener('DOMContentLoaded', function () { render(); });
  }
})(typeof window !== 'undefined' ? window : globalThis);
