/**
 * kapitel.js - die Kapitelstruktur als Daten.
 *
 * Warum es diese Datei gibt
 * -------------------------
 * Die Struktur der Seiten stand bisher nirgends als Daten. Sie steckte in der
 * Reihenfolge des HTML und in Ueberschriftentexten. gallery.js hat den Titel
 * einer Fotogruppe ermittelt, indem es im DOM rueckwaerts nach der naechsten
 * Ueberschrift lief - eine Heuristik, die bei 13 der 15 Build-Log-Gruppen
 * "Photo Documentation" ergab, weil genau das dort als Zwischenueberschrift
 * ueber dem Fotostreifen steht.
 *
 * Eine seitenuebergreifende Galerie kann diese Heuristik ohnehin nicht
 * benutzen: sie zeigt Gruppen an, deren Markup auf einer anderen Seite liegt.
 *
 * Was hier NICHT passiert
 * -----------------------
 * Die Gruppennamen sind die Primaerschluessel der Foto-Metadaten im Gist
 * (meta['<gruppe>/<datei>.jpg'], hero['<gruppe>'], videos['<gruppe>']). Eine
 * Umbenennung verwaist auf allen Geraeten still die Beschreibungen, die
 * Reihenfolge, das Hauptbild und die Videos. Diese Datei ordnet die Gruppen
 * darum nur, sie benennt sie nicht um.
 *
 * Bereiche statt Seiten
 * ---------------------
 * Die Gesamtgalerie gruppiert nach Bauteil, nicht nach Herkunftsseite. Ein
 * Bereich fasst deshalb zusammen, was am selben Teil fotografiert wurde -
 * das Datenblattkapitel aus specs.html und die Montageschritte aus
 * build-log.html. Die Herkunft bleibt je Gruppe sichtbar, damit der
 * Ruecksprung eindeutig bleibt.
 */
(function (global) {
  'use strict';

  // Reihenfolge der Bereiche = Reihenfolge des Zusammenbaus.
  var BEREICHE = [
    { id: 'block',       titel: 'Motorblock & Short Block' },
    { id: 'kolben',      titel: 'Kolben & Pleuel' },
    { id: 'nockenwelle', titel: 'Nockenwelle & Ventiltrieb' },
    { id: 'koepfe',      titel: 'Zylinderkoepfe' },
    { id: 'dichtung',    titel: 'Kopfdichtung & Verschraubung' },
    { id: 'steuertrieb', titel: 'Steuertrieb & Front' },
    { id: 'schmierung',  titel: 'Schmierung & Kuehlung' },
    { id: 'gemisch',     titel: 'Gemischaufbereitung' },
    { id: 'zuendung',    titel: 'Zuendung' },
    { id: 'inbetrieb',   titel: 'Inbetriebnahme' },
    // Die phasenweiten Sammelgalerien gehoeren zu keinem einzelnen Bauteil.
    { id: 'phasen',      titel: 'Bauphasen (uebergreifend)' }
  ];

  // Eine Zeile je Fotogruppe. 'standard' sind die Herstellerbilder, die bisher
  // nur als data-default-src im Markup von specs.html standen - eine Seite, die
  // dieses Markup nicht hat, konnte sie nicht kennen.
  // Eine Zeile je Fotogruppe. 'gruppe' muss exakt dem data-comp-gallery im
  // Markup entsprechen - tests/kapitel.test.mjs prueft beide Richtungen.
  var GRUPPEN = [
    // ---- specs.html: Bauteile und Datenblaetter ----
    { gruppe: 'block',        seite: 'specs.html', bereich: 'block',       titel: 'Motorblock – Ford Performance M-6010-BOSS302', standard: ['img/ford-m6010-boss302.jpg', 'boss302-block.jpg'] },
    { gruppe: 'shortblock',   seite: 'specs.html', bereich: 'block',       titel: 'Short Block – Ford Performance M-6009-302', standard: ['img/ford-m6009-302.jpg', 'm6009-302.jpg'] },
    { gruppe: 'pistons',      seite: 'specs.html', bereich: 'kolben',      titel: 'Kolben & Pleuel – Mahle SBF600000FPF' },
    { gruppe: 'camshaft',     seite: 'specs.html', bereich: 'nockenwelle', titel: 'Nockenwelle – COMP Cams XE274HR-12', standard: ['img/comp-35-518-8.jpg'] },
    { gruppe: 'lifters',      seite: 'specs.html', bereich: 'nockenwelle', titel: 'Lifter – Morel 5327 HLT', standard: ['img/morel-5327.jpg'] },
    { gruppe: 'rockers',      seite: 'specs.html', bereich: 'nockenwelle', titel: 'Kipphebel – COMP Cams 1632-16 Ultra Pro Magnum' },
    { gruppe: 'polylocks',    seite: 'specs.html', bereich: 'nockenwelle', titel: 'Polylocks – COMP Cams 4600-16' },
    { gruppe: 'heads',        seite: 'specs.html', bereich: 'koepfe',      titel: 'Zylinderkoepfe – AFR 1399 165cc Renegade', standard: ['img/afr-1399.jpg'] },
    { gruppe: 'valvesprings', seite: 'specs.html', bereich: 'koepfe',      titel: 'Ventilfedern – AFR 8605', standard: ['img/afr-8605.png'] },
    { gruppe: 'headgasket',   seite: 'specs.html', bereich: 'dichtung',    titel: 'Zylinderkopfdichtung – Ford M-6051-CP331', standard: ['img/ford-m6051-cp331.jpg'] },
    { gruppe: 'headbolts',    seite: 'specs.html', bereich: 'dichtung',    titel: 'Kopfschrauben – ARP 154-4003', standard: ['img/arp-154-4003.jpg'] },
    { gruppe: 'timingchain',  seite: 'specs.html', bereich: 'steuertrieb', titel: 'Steuerkette – Ford Perf. M-6268-A302 Double Roller', standard: ['img/ford-m6268-a302.jpg'] },
    { gruppe: 'balancer',     seite: 'specs.html', bereich: 'steuertrieb', titel: 'Harmonic Balancer – Ford Perf. M-6316-D302', standard: ['img/ford-m6316-d302.jpg'] },
    { gruppe: 'oilpump',      seite: 'specs.html', bereich: 'schmierung',  titel: 'Oelpumpe – Ford Performance M-6600-D2 High Volume', standard: ['img/ford-m6600-d2.jpg'] },
    { gruppe: 'waterpump',    seite: 'specs.html', bereich: 'schmierung',  titel: 'Wasserpumpe – Milodon 16230 High Volume', standard: ['img/milodon-16230.jpg'] },
    { gruppe: 'carbs',        seite: 'specs.html', bereich: 'gemisch',     titel: 'Vergaser – DellOrto DRLA 45 (4 Stueck)', standard: ['img/dellorto-drla-45.jpg'] },
    { gruppe: 'fuelpump',     seite: 'specs.html', bereich: 'gemisch',     titel: 'Kraftstoffpumpe – Facet Red Top (2 Stueck)', standard: ['img/facet-480532.jpg'] },
    { gruppe: 'msd6al',       seite: 'specs.html', bereich: 'zuendung',    titel: 'MSD 6AL Zuendbox' },
    { gruppe: 'distributor',  seite: 'specs.html', bereich: 'zuendung',    titel: 'Zuendverteiler – MSD 8479 Street Pro-Billet' },

    // ---- build-log.html: Montageschritte ----
    { gruppe: 'p1_block_photos',     seite: 'build-log.html', bereich: 'block',       titel: 'Phase 1 · Schritt 1: Block-Sichtpruefung' },
    { gruppe: 'p1_mainbrg_photos',   seite: 'build-log.html', bereich: 'block',       titel: 'Phase 1 · Schritt 8: Hauptlagerspiel (Plastigage)' },
    { gruppe: 'p1_pdeck_photos',     seite: 'build-log.html', bereich: 'kolben',      titel: 'Phase 1 · Schritt 4: Kolbenstand (Piston Deck Clearance)' },
    { gruppe: 'p2_degree_photos',    seite: 'build-log.html', bereich: 'nockenwelle', titel: 'Phase 2 · Schritt 6: Nockenwelle degreen (ICL)' },
    { gruppe: 'p2_sweep_photos',     seite: 'build-log.html', bereich: 'nockenwelle', titel: 'Phase 2 · Schritt 11: Rocker Sweep (Filzstift-Methode)' },
    { gruppe: 'p2_ptv_photos',       seite: 'build-log.html', bereich: 'nockenwelle', titel: 'Phase 2 · Schritt 12: Ventilfreiraum (P-V, Knetmasse)' },
    { gruppe: 'p3_gasket_photos',    seite: 'build-log.html', bereich: 'dichtung',    titel: 'Phase 3 · Schritt 11: Kopfdichtung CP331 (FRONT nach vorn)' },
    { gruppe: 'p4_filter_photos',    seite: 'build-log.html', bereich: 'schmierung',  titel: 'Phase 4 · Schritt 20: Oelwechsel, Filter aufschneiden' },
    { gruppe: 'p4_sparkread_photos', seite: 'build-log.html', bereich: 'zuendung',    titel: 'Phase 4 · Schritt 21: Kerzenbild lesen' },
    { gruppe: 'p4_leaks_photos',     seite: 'build-log.html', bereich: 'inbetrieb',   titel: 'Phase 4 · Schritt 14: Sichtkontrolle auf Leckagen' },
    { gruppe: 'phase1',              seite: 'build-log.html', bereich: 'phasen',      titel: 'Phase 1: Eingangskontrolle' },
    { gruppe: 'phase2',              seite: 'build-log.html', bereich: 'phasen',      titel: 'Phase 2: Mock-up & Degree' },
    { gruppe: 'phase3',              seite: 'build-log.html', bereich: 'phasen',      titel: 'Phase 3: Endmontage' },
    { gruppe: 'phase4',              seite: 'build-log.html', bereich: 'phasen',      titel: 'Phase 4: Erststart & Einfahren' },
    { gruppe: 'phase5',              seite: 'build-log.html', bereich: 'phasen',      titel: 'Phase 5: Abstimmung & Feuertaufe' }
  ];

  var _nachId = {};
  GRUPPEN.forEach(function (e, i) { e.reihenfolge = i; _nachId[e.gruppe] = e; });

  // Bereiche in der oben festgelegten Reihenfolge, je mit ihren Gruppen in
  // der Reihenfolge von GRUPPEN. Bereiche ohne Gruppen entfallen.
  function nachBereich() {
    return BEREICHE.map(function (b) {
      return {
        id: b.id,
        titel: b.titel,
        gruppen: GRUPPEN.filter(function (e) { return e.bereich === b.id; })
      };
    }).filter(function (b) { return b.gruppen.length > 0; });
  }

  global.KAPITEL = {
    BEREICHE: BEREICHE,
    GRUPPEN: GRUPPEN,
    /** Eintrag einer Gruppe, oder null wenn unbekannt. */
    gruppe: function (id) { return _nachId[id] || null; },
    /** Titel einer Gruppe, oder null - der Aufrufer entscheidet ueber den Ersatz. */
    titel: function (id) { return _nachId[id] ? _nachId[id].titel : null; },
    /** Seite, auf der das Markup dieser Gruppe liegt. */
    seite: function (id) { return _nachId[id] ? _nachId[id].seite : null; },
    nachBereich: nachBereich
  };
})(typeof window !== 'undefined' ? window : globalThis);
