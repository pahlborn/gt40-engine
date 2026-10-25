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
  var DEVICES_KEY = '_devices';
  var DEVICE_KEY = '_lastDevice';
  var LOCAL_DEVICE_KEY = 'device_id';
  var LOCAL_DEVICE_NAME_KEY = 'device_name';

  /** Geraete-ID: einmal generiert, bleibt im localStorage. */
  function getDeviceId() {
    var id = localStorage.getItem(LOCAL_DEVICE_KEY);
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem(LOCAL_DEVICE_KEY, id);
    }
    return id;
  }

  /** Geraetename: vom User benennbar, sonst aus User-Agent erraten. */
  function getDeviceName() {
    var name = localStorage.getItem(LOCAL_DEVICE_NAME_KEY);
    if (name) return name;
    var ua = navigator.userAgent || '';
    if (/iPad/.test(ua)) return 'iPad';
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/Android/.test(ua)) return 'Android';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Win/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unbekannt';
  }

  function setDeviceName(name) {
    localStorage.setItem(LOCAL_DEVICE_NAME_KEY, (name || '').trim());
  }

  /** Geraeteregister im Datensatz aktualisieren. */
  function stampDevice(data) {
    var devices = data[DEVICES_KEY] || {};
    var id = getDeviceId();
    devices[id] = { name: getDeviceName(), lastSeen: new Date().toISOString() };
    data[DEVICES_KEY] = devices;
    data[DEVICE_KEY] = id;
    return data;
  }

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
      var unbekannt = !Object.prototype.hasOwnProperty.call(existing, key);

      // Solange die Seite noch laedt, stehen alle Felder auf leer. Ein Save in
      // diesem Moment darf nichts loeschen.
      if (clearing && !recordClears && !isBlank(prev) && prev !== false) continue;

      // Ein leeres Feld, das hier noch nie etwas enthielt, ist kein Ereignis.
      //
      // Bis v100 bekam es trotzdem einen Zeitstempel von jetzt - allein weil
      // die Seite es anzeigt. Im Gist lagen dadurch 204 leere Felder mit
      // Zeitstempel, in Bloecken von 77 und 109 Feldern derselben Minute: je
      // ein Seitenaufruf. Beim Abgleich gewann je Feld der spaetere Stempel,
      // also schlug dieses Leer die echten Werte eines anderen Geraets.
      // Dieselbe Korrektur hat jerico in v30 gebraucht.
      if (clearing && unbekannt) continue;

      if (next !== prev) times[key] = now;
      data[key] = next;
    }

    data[TIMES_KEY] = times;
    data._savedAt = new Date(now).toISOString();
    stampDevice(data);
    return data;
  }

  /**
   * Ab wann ein leeres Feld mit Zeitstempel eine Aussage ist.
   *
   * Leere Felder, die VOR diesem Zeitpunkt gestempelt wurden, stammen
   * ueberwiegend aus dem Fehler, der jedes angezeigte Feld stempelte (siehe
   * mergeIntoExisting). Sie sind von einem bewussten Leeren nicht zu
   * unterscheiden - also zaehlen sie nicht, und der vorhandene Wert gewinnt.
   * Was nach dem Stichtag bewusst geleert wird, bleibt leer und wandert auf
   * die anderen Geraete (Entscheidung des Halters, 2026-10-25).
   *
   * Ein Tag nach der Auslieferung, damit ein noch offener Reiter mit altem
   * Code keine gueltigen Leerstellen mehr erzeugen kann. Dieselbe Regel und
   * derselbe Tag gelten in jerico.
   */
  var LEER_STICHTAG = Date.parse('2026-10-26T00:00:00Z');

  /**
   * Ob ein gestempeltes Leer ueberhaupt einen Wert schlagen darf.
   *
   * Ausgesetzt seit v103, bis die Stempel verlaesslich sind. Die Statusknoepfe
   * schreiben alte Werte ("false", "true") beim Anzeigen um; beim naechsten
   * Speichern - egal welches Feld - wurde daraus ein frisch gestempeltes Leer.
   * Ab dem Stichtag haette das "erledigt" eines anderen Geraets geloescht,
   * ohne dass jemand den Knopf beruehrt hat (nachgerechnet am 2026-10-25, im
   * Gist standen 109 solche Altwerte). Solange das nicht behoben ist, gewinnt
   * wie vor dem Stichtag immer der Wert. Der Preis ist derselbe wie bis
   * heute: ein bewusst geleertes Feld bekommt beim naechsten Abgleich seinen
   * Wert zurueck, wenn die Cloud noch einen hat. Dieselbe Massnahme in jerico v35.
   */
  var LEER_LOESCHT = false;

  /**
   * Cloud- und lokalen Datensatz zusammenfuehren. Pro Feld gewinnt der
   * juengere Zeitstempel - mit einer Ausnahme:
   *
   * Steht nur auf einer Seite ein Wert, gewinnt das Leer der anderen Seite
   * nur, wenn es nach dem Stichtag ausdruecklich gestempelt wurde und juenger
   * ist als der Wert. Sonst gewinnt der Wert.
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

      var cLeer = isBlank(cVal), lLeer = isBlank(lVal);
      if (cLeer !== lLeer) {
        // Nur ein ausdruecklicher Stempel zaehlt, kein Rueckfall auf _savedAt.
        var leerStempel = cLeer ? cloudTimes[k] : localTimes[k];
        var wertZeit = cLeer ? lt : ct;
        var leerZaehlt = LEER_LOESCHT && leerStempel !== undefined && leerStempel >= LEER_STICHTAG
          && leerStempel > wertZeit;
        var nimmCloud = cLeer ? leerZaehlt : !leerZaehlt;
        if (nimmCloud) { merged[k] = cVal; mergedTimes[k] = ct; }
        else { merged[k] = lVal; mergedTimes[k] = lt; }
        if (merged[k] === undefined) delete merged[k];
        continue;
      }

      if (ct >= lt) { merged[k] = cVal; mergedTimes[k] = ct; }
      else { merged[k] = lVal; mergedTimes[k] = lt; }
      if (merged[k] === undefined) delete merged[k];
    }

    merged[TIMES_KEY] = mergedTimes;
    merged._savedAt = new Date(Math.max(cloudFallback, localFallback) || Date.now()).toISOString();
    // Geraeteregister aus beiden Quellen zusammenfuehren
    var cDevices = cloudData[DEVICES_KEY] || {};
    var lDevices = localData[DEVICES_KEY] || {};
    var allDevices = {};
    var dk;
    for (dk in cDevices) { if (Object.prototype.hasOwnProperty.call(cDevices, dk)) allDevices[dk] = cDevices[dk]; }
    for (dk in lDevices) {
      if (!Object.prototype.hasOwnProperty.call(lDevices, dk)) continue;
      if (!allDevices[dk] || (lDevices[dk].lastSeen > (allDevices[dk].lastSeen || ''))) allDevices[dk] = lDevices[dk];
    }
    merged[DEVICES_KEY] = allDevices;
    stampDevice(merged);
    return merged;
  }

  /** Vergleichbarer Kern eines Datensatzes: ohne Verwaltungsangaben. */
  function kern(d) {
    var out = {};
    Object.keys(d || {}).sort().forEach(function (k) {
      if (k.charAt(0) !== '_') out[k] = d[k];
    });
    return JSON.stringify(out);
  }

  /**
   * Den Datensatz der Messwerte mit dem Gist abgleichen: lesen - mischen -
   * lokal speichern - nur wenn noetig schreiben.
   *
   * Steht an einer Stelle fuer alle drei Seiten (Regel 10). Bis v100 gab es
   * drei Fassungen: index und specs schrieben den lokalen Speicher in den
   * Gist, ohne ihn vorher zu lesen - Felder, die dieses Geraet nicht kannte,
   * waren danach aus der Cloud weg. build-log las zwar, mischte aber mit
   * Object.assign: die Seite gewann ganz, leere Felder ueberschrieben fremde
   * Werte, und bei einem Lesefehler wurde trotzdem geschrieben.
   *
   * Hier gilt: scheitert das Lesen, wird nicht geschrieben.
   *
   * @param {{token, gistId, datei, speicherKey}} o
   * @returns {Promise<{ok, gemischt, lokalGeaendert, fehler, detail}>}
   */
  async function cloudAbgleichen(o) {
    var api = 'https://api.github.com/gists/' + o.gistId;
    var auth = { 'Authorization': 'Bearer ' + o.token };
    function fehler(text, detail) { return { ok: false, fehler: text, detail: detail || null }; }
    async function rohtext(r) { try { return await r.text(); } catch (e) { return ''; } }

    var res, gist;
    try {
      res = await fetch(api, { headers: auth, cache: 'no-store' });
      if (!res.ok) {
        return fehler('Status ' + res.status + ' beim Lesen - nichts geschrieben',
          { quelle: 'cloudAbgleichen', status: res.status, antwort: await rohtext(res) });
      }
      gist = await res.json();
    } catch (e) {
      return fehler(e.message + ' - nichts geschrieben', { quelle: 'cloudAbgleichen', stack: e.stack });
    }

    var f = gist.files && gist.files[o.datei];
    var cloud = null;
    if (f) {
      var inhalt = f.content;
      if (f.truncated) {
        // Ab 1 MB liefert die API nur einen Anfang. Den zu mischen hiesse,
        // den Rest fuer geloescht zu halten.
        try {
          var rr = await fetch(f.raw_url, { headers: auth, cache: 'no-store' });
          if (!rr.ok) return fehler('Gekuerzte Cloud-Datei nicht nachladbar - nichts geschrieben',
            { quelle: 'cloudAbgleichen', status: rr.status });
          inhalt = await rr.text();
        } catch (e) {
          return fehler('Gekuerzte Cloud-Datei nicht nachladbar - nichts geschrieben', { quelle: 'cloudAbgleichen', stack: e.stack });
        }
      }
      try { cloud = JSON.parse(inhalt); }
      catch (e) {
        return fehler('Cloud-Datei unlesbar - nichts geschrieben',
          { quelle: 'cloudAbgleichen', antwort: String(inhalt).slice(0, 300) });
      }
    }

    // Zwischen Lesen des lokalen Stands und Zurueckschreiben liegt kein
    // await - eine Eingabe in dieser Zeit kann nicht verloren gehen.
    var lokal = JSON.parse(localStorage.getItem(o.speicherKey) || '{}');
    var gemischt = cloud ? mergeRecords(cloud, lokal) : lokal;
    var lokalGeaendert = kern(gemischt) !== kern(lokal);
    localStorage.setItem(o.speicherKey, JSON.stringify(gemischt));

    if (!cloud || kern(gemischt) !== kern(cloud)) {
      var files = {};
      files[o.datei] = { content: JSON.stringify(gemischt, null, 2) };
      try {
        var wr = await fetch(api, {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + o.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: files })
        });
        if (!wr.ok) {
          var roh = await rohtext(wr);
          var msg = ''; try { msg = JSON.parse(roh).message || ''; } catch (e) {}
          return fehler('Status ' + wr.status + (msg ? ': ' + msg : '') + ' beim Schreiben',
            { quelle: 'cloudAbgleichen', status: wr.status, antwort: roh });
        }
      } catch (e) {
        return fehler(e.message, { quelle: 'cloudAbgleichen', stack: e.stack });
      }
    }
    return { ok: true, gemischt: gemischt, lokalGeaendert: lokalGeaendert };
  }

  // ---- Hochladen: buendeln, nacheinander, nachholen (v105) ----
  //
  // Bis v104 loeste jede Eingabe 0,5 s spaeter ein eigenes Lesen-Mischen-
  // Schreiben aus, und die Vorgaenge liefen gleichzeitig. GitHub wies einen
  // davon ab (409 "Gist cannot be updated", 2026-10-24 und -25) oder bremste
  // das ganze Konto (403 "API rate limit exceeded", 2026-10-24 - von 20:47
  // bis 21:01 entstanden rund 70 Gist-Staende). Ein gescheitertes Hochladen
  // wurde nie wiederholt: die Werte blieben nur auf dem Geraet, die Anzeige
  // sagte trotzdem "Cloud Sync".
  //
  // Jetzt: Tippen speichert lokal und merkt das Hochladen vor; hochgeladen
  // wird nach BUENDELN_MS Ruhe. Es laeuft hoechstens ein Vorgang, was waehrend
  // eines Laufs dazukommt, geht im naechsten mit. Scheitert er, bleibt das
  // Merkzeichen "nicht hochgeladen" im Geraetespeicher stehen und der Vorgang
  // wird nach WIEDERHOLEN_MS wiederholt - bei 403/429 fruehestens nach
  // GEBREMST_MS. Geloescht wird das Merkzeichen erst, wenn ein Lauf gelungen
  // ist und seitdem nichts Neues vorgemerkt wurde.

  var BUENDELN_MS = 3000;
  var WIEDERHOLEN_MS = [5000, 15000, 60000, 120000, 300000];
  var GEBREMST_MS = 60000;

  var _hl = { timer: null, wiederTimer: null, lauf: null, nochmal: false, auftrag: null, versuch: 0 };

  function merkKey(speicherKey) { return speicherKey + '_ungesendet'; }

  /** Liegt auf diesem Geraet etwas, das noch nicht in der Cloud ist? */
  function ungesendet(speicherKey) {
    try { return !!localStorage.getItem(merkKey(speicherKey)); } catch (e) { return false; }
  }

  function standMelden() {
    try { global.dispatchEvent(new CustomEvent('fieldsync-stand')); } catch (e) {}
  }

  function markieren(o) {
    try { localStorage.setItem(merkKey(o.speicherKey), Date.now() + ':' + Math.random().toString(36).slice(2, 8)); }
    catch (e) {}
    standMelden();
  }

  function einstellung(name, standard) {
    var fs = global.FieldSync;
    return fs && fs[name] !== undefined ? fs[name] : standard;
  }

  async function einLauf(o) {
    var vorher = null;
    try { vorher = localStorage.getItem(merkKey(o.speicherKey)); } catch (e) {}
    var r = await cloudAbgleichen(o);
    if (r.ok) {
      _hl.versuch = 0;
      try {
        if (localStorage.getItem(merkKey(o.speicherKey)) === vorher) localStorage.removeItem(merkKey(o.speicherKey));
      } catch (e) {}
      if (o.nachher) { try { o.nachher(r); } catch (e) { console.warn('[Hochladen] nachher:', e.message); } }
    } else {
      _hl.versuch++;
      var stufen = einstellung('WIEDERHOLEN_MS', WIEDERHOLEN_MS);
      var warten = stufen[Math.min(_hl.versuch - 1, stufen.length - 1)];
      var status = r.detail && r.detail.status;
      if (status === 403 || status === 429) warten = Math.max(warten, einstellung('GEBREMST_MS', GEBREMST_MS));
      r.versuch = _hl.versuch;
      r.wiederholtIn = warten;
      clearTimeout(_hl.wiederTimer);
      _hl.wiederTimer = setTimeout(function () { _hl.wiederTimer = null; starten(); }, warten);
      try { (o.fehler || fehlerMelden)(r); } catch (e) { console.warn('[Hochladen] fehler:', e.message); }
    }
    standMelden();
    return r;
  }

  /**
   * Eine Meldung pro Fehlerserie, jeder Fehlversuch im Protokoll. Offline ist
   * kein Fehler - das Merkzeichen steht, und es wird nachgeholt.
   */
  function fehlerMelden(r) {
    if (global.navigator && global.navigator.onLine === false) return;
    var detail = Object.assign({}, r.detail || {}, { quelle: 'saveData', versuch: r.versuch });
    var text = 'Sync-Fehler: ' + r.fehler;
    if (r.versuch === 1 && typeof global.showToast === 'function') {
      global.showToast(text + ' - wird automatisch wiederholt', { sticky: true, isError: true, detail: detail });
    } else if (global.ErrorLog) {
      global.ErrorLog.add(text, detail);
    }
  }

  function starten() {
    clearTimeout(_hl.timer); _hl.timer = null;
    clearTimeout(_hl.wiederTimer); _hl.wiederTimer = null;
    if (_hl.lauf) { _hl.nochmal = true; return _hl.lauf; }
    _hl.lauf = (async function () {
      try {
        var r;
        do { _hl.nochmal = false; r = await einLauf(_hl.auftrag); } while (_hl.nochmal && r.ok);
        return r;
      } finally { _hl.lauf = null; }
    })();
    return _hl.lauf;
  }

  /**
   * Hochladen vormerken: nach BUENDELN_MS Ruhe wird hochgeladen. Fuer das
   * Tippen - jede weitere Eingabe schiebt den Zeitpunkt hinaus.
   * @param {{token, gistId, datei, speicherKey, nachher, fehler}} o
   */
  function vormerken(o) {
    markieren(o);
    _hl.auftrag = o;
    clearTimeout(_hl.timer);
    _hl.timer = setTimeout(function () { _hl.timer = null; starten(); },
      einstellung('BUENDELN_MS', BUENDELN_MS));
  }

  /** Sofort hochladen (Speichern-Knopf, Netz wieder da). Ergebnis wie cloudAbgleichen. */
  function jetztHochladen(o) {
    markieren(o);
    _hl.auftrag = o;
    return starten();
  }

  /** Liegengebliebenes hochladen - nur wenn das Merkzeichen steht. */
  function nachholen(o) {
    if (!ungesendet(o.speicherKey)) return Promise.resolve(null);
    _hl.auftrag = o;
    return starten();
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
    DEVICES_KEY: DEVICES_KEY,
    DEVICE_KEY: DEVICE_KEY,
    LEER_STICHTAG: LEER_STICHTAG,
    LEER_LOESCHT: LEER_LOESCHT,
    isBlank: isBlank,
    kern: kern,
    cloudAbgleichen: cloudAbgleichen,
    BUENDELN_MS: BUENDELN_MS,
    WIEDERHOLEN_MS: WIEDERHOLEN_MS,
    GEBREMST_MS: GEBREMST_MS,
    vormerken: vormerken,
    jetztHochladen: jetztHochladen,
    nachholen: nachholen,
    ungesendet: ungesendet,
    collectFields: collectFields,
    mergeIntoExisting: mergeIntoExisting,
    mergeRecords: mergeRecords,
    getDeviceId: getDeviceId,
    getDeviceName: getDeviceName,
    setDeviceName: setDeviceName,
    stampDevice: stampDevice
  };
})(typeof window !== 'undefined' ? window : globalThis);
