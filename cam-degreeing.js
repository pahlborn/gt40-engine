/**
 * Cam Degreeing — drei unabhängige Durchgänge direkt am Einlassnocken #1.
 * Berechnung auf identischen Hubpunkten 0,050" UNTER dem Maximum.
 * Werte aus dem bestehenden Gist bleiben in den bisherigen Feldnamen:
 * p2_open050 / p2_close050 (Durchgang 1), p2_icl_actual (Mittel).
 */
(function (global) {
  'use strict';
  function zahl(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    var s = String(v == null ? '' : v).trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function lauf(vor, nach) {
    var a = zahl(vor), b = zahl(nach);
    if (a === null || b === null || a < 0 || a >= 360 || b < 0 || b >= 360) return null;
    // Die Gradscheibe wird als voller 360-Grad-Kreis betrachtet (COMP Cams #145).
    if (b < a) b += 360;
    var weg = b - a;
    if (weg <= 0 || weg >= 180) return null; // falsche Ableserichtung/Skala prüfen
    return (a + weg / 2) % 360;
  }
  function auswerten(messungen, soll) {
    var werte = messungen.map(function (paar) { return lauf(paar[0], paar[1]); });
    var gueltig = werte.filter(function (v) { return v !== null; });
    var mittel = gueltig.length ? gueltig.reduce(function (a, b) { return a + b; }, 0) / gueltig.length : null;
    var ziel = zahl(soll);
    return {
      werte: werte,
      anzahl: gueltig.length,
      komplett: gueltig.length === 3,
      mittel: mittel,
      abweichung: mittel !== null && ziel !== null ? mittel - ziel : null,
      spannweite: gueltig.length >= 2 ? Math.max.apply(null, gueltig) - Math.min.apply(null, gueltig) : null
    };
  }
  function fmt(v) { return v === null ? '—' : v.toFixed(2).replace('.', ',').replace(/0$/, '').replace(/,$/, ''); }
  function feld(name) { return global.document && global.document.querySelector('[data-field="' + name + '"]'); }
  function eingabe(name) { var el = feld(name); return el ? el.value : ''; }
  function text(id, wert) { var el = global.document && global.document.getElementById(id); if (el) el.textContent = wert; }

  function render() {
    if (!global.document || !global.document.getElementById('cam-degreeing-repetitions')) return null;
    var liste = [
      [eingabe('p2_open050'), eingabe('p2_close050')],
      [eingabe('p2_degree_r2_vor'), eingabe('p2_degree_r2_nach')],
      [eingabe('p2_degree_r3_vor'), eingabe('p2_degree_r3_nach')]
    ];
    var res = auswerten(liste, eingabe('p2_icl_target'));
    res.werte.forEach(function (v, i) { text('cam-icl-run-' + (i + 1), fmt(v)); });
    text('cam-runs-count', res.anzahl + ' / 3 Messungen vollständig');
    text('cam-icl-average', fmt(res.mittel) + (res.mittel === null ? '' : '° ATDC'));
    text('cam-icl-spread', res.spannweite === null ? '— (mindestens 2 Messungen nötig)' : fmt(res.spannweite) + '°');
    var abwText = '—';
    if (res.abweichung !== null) {
      var d = res.abweichung;
      abwText = (d > 0 ? '+' : '') + fmt(d) + '°' +
        (d > 0 ? ' (später / retardiert)' : d < 0 ? ' (früher / vorverlegt)' : ' (entspricht dem Soll)');
    }
    text('cam-icl-deviation', abwText);
    text('cam-measure-state', res.komplett
      ? '3/3 vollständig — OT-Bezug und Rollennocken-Taster müssen separat geprüft sein.'
      : 'Unvollständige Messreihe. Mittelwert ist vorläufig; kein Freigabekriterium.');
    var ist = feld('p2_icl_actual');
    if (ist && res.mittel !== null) ist.value = fmt(res.mittel);
    return res;
  }
  function onInput() {
    render();
    if (typeof global.autoSave === 'function') global.autoSave();
  }
  global.CamDegreeing = { zahl: zahl, lauf: lauf, auswerten: auswerten, render: render, onInput: onInput };
  if (global.document && global.document.addEventListener) global.document.addEventListener('DOMContentLoaded', render);
})(typeof window !== 'undefined' ? window : globalThis);
