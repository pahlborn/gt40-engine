/**
 * messwerte.js - unterscheidet Herstellerangaben von gemessenen Werten.
 *
 * Das Problem, das diese Datei loest
 * ----------------------------------
 * Die Eingaben des Verdichtungsrechners waren Zahlen ohne Herkunft. Neben dem
 * Muldenfeld stand fest verdrahtet "6.5 cc angenommen - nicht gemessen". Traegt
 * jemand einen selbst ausgeliterten Wert ein, bleibt diese Beschriftung stehen
 * und wird damit zur Falschaussage. Umgekehrt haette ein Entfernen der
 * Kennzeichnung ungemessene Werte als gesichert dargestellt.
 *
 * Kennzeichnung und Wert muessen also demselben Speicher folgen. Je Eingabe
 * gibt es darum ein zweites Feld '<feld>_gemessen', das mitgespeichert und
 * mitsynchronisiert wird. Die Beschriftung wird daraus erzeugt, nicht
 * geschrieben.
 *
 * Zwei Zustaende, nicht drei
 * --------------------------
 * "gemessen" heisst: an DIESEM Motor ermittelt. Alles andere - Katalogwert,
 * Datenblatt, Haendlerangabe, Rueckrechnung - ist "nicht gemessen". Ob eine
 * Herstellerangabe serioeser ist als eine Schaetzung, aendert nichts daran,
 * dass sie nicht an diesem Motor geprueft wurde. Genau diese Unterscheidung
 * war bei der Kolbenmulde der ganze Streit.
 *
 * Die Seite muss bereitstellen: nichts. Lesen geht auch ohne Felder, damit
 * specs.html die Werte spiegeln kann, ohne sie zu wiederholen.
 */
(function (global) {
  'use strict';

  var SPEICHER = 'engineBuildLog';

  // Die Eingaben des Verdichtungsrechners, in der Reihenfolge der Seite.
  // 'einheit' nur fuer die Anzeige, 'wie' sagt, womit man misst.
  var EINGABEN = [
    { feld: 'cr_bore',        titel: 'Bohrung',          einheit: '"',  wie: 'Messuhr oder Innenmikrometer' },
    { feld: 'cr_stroke',      titel: 'Hub',              einheit: '"',  wie: 'Messuhr am OT/UT' },
    { feld: 'cr_chamber',     titel: 'Brennraum',        einheit: 'cc', wie: 'Auslitern mit Buerette' },
    { feld: 'cr_gasket',      titel: 'Dichtungsdicke',   einheit: '"',  wie: 'Herstellerangabe komprimiert' },
    { feld: 'cr_gasket_bore', titel: 'Dichtungsbohrung', einheit: '"',  wie: 'Messschieber an der Dichtung' },
    { feld: 'cr_deck',        titel: 'Piston-to-Deck',   einheit: '"',  wie: 'Messuhr auf Haarlineal' },
    { feld: 'cr_piston',      titel: 'Kolbenmulde',      einheit: 'cc', wie: 'Knetmasse oder Buerette' }
  ];

  function statusFeld(feld) { return feld + '_gemessen'; }

  /** Gespeicherter Stand, oder ein leeres Objekt. Wirft nie. */
  function gespeichert() {
    try { return JSON.parse(localStorage.getItem(SPEICHER) || '{}') || {}; }
    catch (e) { return {}; }
  }

  // Ein Wert gilt nur als gemessen, wenn das Statusfeld ausdruecklich true ist.
  // Fehlt es - etwa bei Altbestand -, ist er nicht gemessen. Das ist die
  // sichere Richtung: lieber eine Schaetzung als solche ausweisen, als eine
  // ungepruefte Zahl als Messwert.
  function istGemessen(feld, daten) {
    var d = daten || gespeichert();
    var el = (typeof document !== 'undefined')
      ? document.querySelector('[data-field="' + statusFeld(feld) + '"]') : null;
    if (el && el.type === 'checkbox') return !!el.checked;
    return d[statusFeld(feld)] === true;
  }

  /** Aktueller Wert eines Feldes: erst das Eingabefeld, sonst der Speicher. */
  function wert(feld, daten) {
    var el = (typeof document !== 'undefined')
      ? document.querySelector('[data-field="' + feld + '"]') : null;
    if (el && el.value !== '') return el.value;
    var d = daten || gespeichert();
    return d[feld] !== undefined ? String(d[feld]) : '';
  }

  /** Wie viele Eingaben des Verdichtungsrechners noch nicht gemessen sind. */
  function offeneEingaben() {
    var d = gespeichert();
    return EINGABEN.filter(function (e) { return !istGemessen(e.feld, d); });
  }

  var LABEL_GEMESSEN = 'gemessen';
  var LABEL_OFFEN = 'Herstellerangabe / nicht gemessen';

  /**
   * Fuellt alle Spiegelstellen einer Seite:
   *   [data-spiegel="<feld>"]        -> aktueller Wert
   *   [data-spiegel-status="<feld>"] -> "gemessen" oder "nicht gemessen"
   * Damit muss specs.html die Zahlen nicht mehr wiederholen.
   */
  function spiegeln(wurzel) {
    if (typeof document === 'undefined') return;
    var d = gespeichert();
    var r = wurzel || document;
    r.querySelectorAll('[data-spiegel]').forEach(function (el) {
      var v = wert(el.dataset.spiegel, d);
      if (v !== '') el.textContent = v;
    });
    r.querySelectorAll('[data-spiegel-status]').forEach(function (el) {
      var f = el.dataset.spiegelStatus;
      var g = istGemessen(f, d);
      el.textContent = g ? LABEL_GEMESSEN : LABEL_OFFEN;
      el.className = g ? 'mw-gemessen' : 'mw-offen';
    });
  }

  global.Messwerte = {
    EINGABEN: EINGABEN,
    LABEL_GEMESSEN: LABEL_GEMESSEN,
    LABEL_OFFEN: LABEL_OFFEN,
    statusFeld: statusFeld,
    istGemessen: istGemessen,
    wert: wert,
    offeneEingaben: offeneEingaben,
    spiegeln: spiegeln
  };
})(typeof window !== 'undefined' ? window : globalThis);
