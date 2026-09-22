/**
 * version.js - eine einzige Quelle fuer die App-Version.
 *
 * Muss zur Cache-Version in sw.js passen ('boss302-v<N>'). tests/ui.test.mjs
 * prueft das, damit beide nicht auseinanderlaufen.
 *
 * Bei jeder Aenderung an den ausgelieferten Dateien hochzaehlen - sonst holen
 * sich die Geraete den neuen Stand nicht.
 */
(function (global) {
  'use strict';
  global.APP_VERSION = 'v47';
})(typeof window !== 'undefined' ? window : globalThis);
