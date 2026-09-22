/**
 * version.js - eine einzige Quelle fuer die App-Version.
 *
 * Muss zur Cache-Version in sw.js passen ('boss302-v<N>'). tests/ui.test.mjs
 * prueft das, damit beide nicht auseinanderlaufen.
 *
 * Bei jeder Aenderung an den ausgelieferten Dateien hochzaehlen - sonst holen
 * sich die Geraete den neuen Stand nicht.
 *
 * APP_BUILT ist der Freigabezeitpunkt. Die Seite hat keinen Build-Schritt, der
 * ihn stempeln koennte, also wird er beim Release mitgepflegt. Damit er nicht
 * vergessen wird, prueft tests/ui.test.mjs, dass sein Datum zum obersten
 * Eintrag in changelog.js passt.
 */
(function (global) {
  'use strict';
  global.APP_VERSION = 'v57';
  global.APP_BUILT = '2026-09-22T15:46:00+02:00';

  // Liefert "TT.MM.JJJJ, hh:mm" - ohne Sekunden, die helfen hier niemandem. Bewusst
  // ohne new Date(): der Zeitstempel soll ueberall gleich aussehen und nicht
  // in die Zeitzone des Betrachters rutschen.
  var ISO = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;
  global.formatBuilt = function (iso) {
    var m = ISO.exec(iso || global.APP_BUILT || '');
    if (!m) return '';
    var d = m[3] + '.' + m[2] + '.' + m[1];
    return m[4] ? d + ', ' + m[4] + ':' + m[5] : d;
  };
})(typeof window !== 'undefined' ? window : globalThis);
