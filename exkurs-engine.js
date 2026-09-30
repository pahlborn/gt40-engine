/**
 * exkurs-engine.js - Exkurs: Verdichtung, Zuendung, Leistung & Oktanzahl.
 *
 * Das vollstaendige Nachschlagewerk. Auf den Hauptseiten (index, specs,
 * build-log) stehen nur Kurzinfos mit Verweis hierher. Das vermeidet
 * doppelte Inhalte und Inkonsistenzen.
 *
 * Aufbau orientiert sich an reference.js: Daten-Objekt -> Overlay mit
 * Suchfunktion -> Erst beim ersten Oeffnen ins DOM.
 *
 * Kapitel:
 *  1. Historischer Kontext
 *  2. Das Dreieck: Verdichtung - Zuendung - Oktanzahl
 *  3. AKI vs. ROZ
 *  4. Kein Klopfsensor
 *  5. Verdichtung: Nur der CR-Rechner zaehlt
 *  6. Zuendung: Initial, Centrifugal, Vacuum
 *  7. MSD 8479 Advance-Praxis
 *  8. Leistung & Drehmoment
 *  9. Praxis-Vorgehensweise
 */
(function (global) {
  'use strict';

  var EXKURS = {
    titel: 'Exkurs: Verdichtung, Z\u00fcndung, Leistung & Oktanzahl',
    abschnitte: [
      /* ---- 1. HISTORISCHER KONTEXT ---- */
      {
        id: 'exk-history',
        titel: '1. Historischer Kontext: Die High-Compression-\u00c4ra',
        stichworte: 'Blei Tetraethylblei Ventilsitz Abgasgesetz history compression',
        inhalt:
          '<p>In den 1950er bis 1970er Jahren bauten US-Hersteller (Ford, Chevrolet, Dodge) '
        + 'V8-Motoren mit sehr hoher Verdichtung \u2013 oft <strong>10:1 bis \u00fcber 11:1</strong>. '
        + 'Das war m\u00f6glich, weil damals <strong>stark verbleiter Kraftstoff</strong> '
        + '(Tetraethylblei) mit sehr hoher Klopffestigkeit verf\u00fcgbar war.</p>'

        + '<div class="exk-box warn"><strong>Blei hatte zwei Funktionen:</strong>'
        + '<ol style="margin:0.3rem 0 0;padding-left:1.2rem;">'
        + '<li><strong>Erh\u00f6hung der Oktanzahl</strong> (Klopffestigkeit) \u2013 '
        + 'Blei-Kraftstoff erreichte effektiv 100+ Oktan</li>'
        + '<li><strong>Schmierung der Ventilsitze</strong> \u2013 d\u00e4mpft den Aufprall der '
        + 'Ventile auf die Sitzringe, verhindert Einschlagen (Valve Seat Recession)</li>'
        + '</ol></div>'

        + '<p>Mit den Abgasgesetzen Anfang der 1970er (Clean Air Act, USA; TA-Luft, DE) '
        + 'fiel das Blei weg. Die Folgen:</p>'
        + '<ul>'
        + '<li>Verdichtung abgesenkt auf 8.0\u20138.5:1 (bleifreier Kraftstoff hat weniger '
        + 'Klopffestigkeit)</li>'
        + '<li>Geh\u00e4rtete Ventilsitze (Hardened Valve Seats) eingef\u00fchrt \u2013 die '
        + 'Blei-Schmierfunktion wurde durch hartes Material ersetzt</li>'
        + '<li>Bleierzatz-Additive (z.B. VSR, Lead Substitute) f\u00fcr \u00e4ltere K\u00f6pfe '
        + 'ohne geh\u00e4rtete Sitze n\u00f6tig</li>'
        + '</ul>'

        + '<div class="exk-box info"><strong>Unser BOSS 302 Block (M-6010-BOSS302):</strong> '
        + 'Moderner Guss (2020er Produktion). Die AFR-1399-K\u00f6pfe haben ab Werk '
        + '<strong>geh\u00e4rtete Ventilsitze</strong> und CNC-bearbeitete Brennr\u00e4ume. '
        + 'Kein Bleiersatz-Additiv erforderlich. Die Thermodynamik eines Ottomotors ist '
        + 'zeitlos \u2013 die Physik gilt f\u00fcr einen 1969er Mustang genauso wie f\u00fcr '
        + 'unseren 2026er Build. Nur die Materialien und Fertigungstoleranzen sind besser.</div>'
      },

      /* ---- 2. DAS DREIECK ---- */
      {
        id: 'exk-triangle',
        titel: '2. Das Dreieck: Verdichtung \u2013 Z\u00fcndung \u2013 Oktanzahl',
        stichworte: 'Dreieck Zusammenspiel Klopfen Detonation Spitzendruck',
        inhalt:
          '<p>Diese drei Gr\u00f6\u00dfen h\u00e4ngen <strong>untrennbar</strong> zusammen. '
        + '\u00c4ndert sich eine, m\u00fcssen die anderen folgen:</p>'
        + '<table class="exk-table">'
        + '<tr><th>Gr\u00f6\u00dfe</th><th>Eigenschaft</th><th>In unserem Build</th></tr>'
        + '<tr><td><strong>Verdichtung (CR)</strong></td>'
        + '<td>Fest \u2013 durch Kolben, K\u00f6pfe, Dichtung, Deck Height definiert</td>'
        + '<td>Ergebnis aus dem CR-Rechner (einzige Wahrheit)</td></tr>'
        + '<tr><td><strong>Z\u00fcndzeitpunkt</strong></td>'
        + '<td>Einstellbar (Initial + Centrifugal + Vacuum Advance)</td>'
        + '<td>MSD 8479 Verteiler + MSD 6AL CDI</td></tr>'
        + '<tr><td><strong>Oktanzahl (ROZ)</strong></td>'
        + '<td>Max. Klopffestigkeit des Kraftstoffs</td>'
        + '<td>Min. 98 ROZ (Super Plus), ideal 100+ ROZ</td></tr>'
        + '</table>'

        + '<h4>Wie funktioniert das Zusammenspiel?</h4>'
        + '<table class="exk-table">'
        + '<tr><th>\u00c4nderung</th><th>Wirkung</th><th>Risiko</th></tr>'
        + '<tr><td><strong>Verdichtung erh\u00f6hen</strong></td>'
        + '<td>H\u00f6herer Spitzendruck = mehr Leistung + Wirkungsgrad</td>'
        + '<td>H\u00f6here Klopfneigung \u2192 h\u00f6here Oktanzahl n\u00f6tig</td></tr>'
        + '<tr><td><strong>Z\u00fcndung fr\u00fcher</strong> (mehr Advance)</td>'
        + '<td>Gemisch z\u00fcndet fr\u00fcher vor OT = optimaler Druckaufbau = mehr Leistung</td>'
        + '<td>Klopfgefahr steigt \u2192 h\u00f6here Oktanzahl oder weniger CR n\u00f6tig</td></tr>'
        + '<tr><td><strong>H\u00f6here Oktanzahl</strong></td>'
        + '<td>Kraftstoff widersteht h\u00f6herem Druck ohne Selbstz\u00fcndung</td>'
        + '<td>Kein Risiko \u2013 erlaubt mehr CR und/oder mehr Advance</td></tr>'
        + '</table>'

        + '<div class="exk-box danger">'
        + '<strong>\u26a0 Klopfen (Detonation):</strong> Unkontrollierte Selbstz\u00fcndung des '
        + 'Restgemischs. Erzeugt Druckspitzen bis <strong>10\u00d7 h\u00f6her</strong> als normale '
        + 'Verbrennung. Kann in Sekunden L\u00f6cher in Kolben brennen, Lager zerst\u00f6ren, '
        + 'Dichtungen durchschlagen. <strong>Hochgeschwindigkeitsklopfen ist nicht '
        + 'h\u00f6rbar!</strong> Es tritt unter Volllast bei hoher Drehzahl auf, wo '
        + 'Motorger\u00e4usche und Abgaslautst\u00e4rke es \u00fcberdecken. Man bemerkt es '
        + 'erst am Motorschaden.</div>'
      },

      /* ---- 3. AKI vs ROZ ---- */
      {
        id: 'exk-octane',
        titel: '3. AKI vs. ROZ \u2013 Die Oktan-Falle (USA vs. Europa)',
        stichworte: 'AKI ROZ MOZ Umrechnung Faustregel Regular Premium Super',
        inhalt:
          '<p>In US-Handb\u00fcchern steht oft \u201e91 Octane\u201c oder \u201e93 Octane\u201c. '
        + '<strong>Vorsicht:</strong> Die USA messen in <strong>AKI</strong> (Anti-Knock Index '
        + '= Mittelwert aus ROZ und MOZ), Europa misst in <strong>ROZ</strong> '
        + '(Research-Oktanzahl).</p>'

        + '<table class="exk-table">'
        + '<tr><th>USA (AKI)</th><th>Europa (ROZ)</th><th>Bezeichnung</th><th>Verf\u00fcgbarkeit DE</th></tr>'
        + '<tr><td>87</td><td>~91\u201392</td><td>Regular</td><td>\u2013 (nicht verf\u00fcgbar)</td></tr>'
        + '<tr><td>89</td><td>~93\u201394</td><td>Mid-Grade / Plus</td><td>\u2013</td></tr>'
        + '<tr><td>91</td><td>~95\u201396</td><td>Premium</td><td>Super E10 / Super E5</td></tr>'
        + '<tr><td>93</td><td>~98</td><td>Super Premium</td><td><strong>Super Plus</strong></td></tr>'
        + '<tr><td>94+</td><td>~100+</td><td>Racing Fuel</td><td>Shell V-Power 100, MOL EVO 100</td></tr>'
        + '</table>'

        + '<div class="exk-box info">'
        + '<strong>Faustregel:</strong> AKI \u2248 ROZ \u2212 4 bis 5. '
        + 'Wenn ein US-Handbuch \u201e93 Octane\u201c fordert, brauchen Sie in Europa '
        + 'mindestens <strong>98 ROZ (Super Plus)</strong>.</div>'

        + '<div class="exk-box warn">'
        + '<strong>Ethanol-Warnung:</strong> Super E10 enth\u00e4lt bis 10% Ethanol. Ethanol '
        + 'greift Kork-Dichtungen, alte Gummi-Leitungen und Vergaser-Schwimmernadelventile '
        + 'an. F\u00fcr den DellOrto-Vergaser und klassische Kraftstoff-Schl\u00e4uche '
        + '<strong>ethanol-freien Kraftstoff bevorzugen</strong> (Shell V-Power 100, MOL EVO 100 '
        + '= ETBE statt Ethanol).</div>'
      },

      /* ---- 4. KEIN KLOPFSENSOR ---- */
      {
        id: 'exk-nosensor',
        titel: '4. Kein Klopfsensor = kein Sicherheitsnetz',
        stichworte: 'Klopfsensor Knock Sensor Motorschaden Notfall Ausland',
        inhalt:
          '<p>Moderne Motoren haben <strong>Klopfsensoren</strong>, die bei beginnender '
        + 'Detonation automatisch den Z\u00fcndzeitpunkt zur\u00fccknehmen (bis zu 10\u00b0). '
        + 'Unser V8 hat das nicht \u2013 er hat eine rein mechanische Z\u00fcndung ohne '
        + 'elektronische R\u00fcckkopplung.</p>'

        + '<div class="exk-box danger"><strong>Das bedeutet:</strong>'
        + '<ul style="margin:0.3rem 0 0;padding-left:1.2rem;">'
        + '<li>Der Motor verzeiht <strong>keine Fehler</strong> bei Oktanzahl oder Timing</li>'
        + '<li>Zu niedrige Oktanzahl + aggressive Fr\u00fchz\u00fcndung = Klopfen unter Last</li>'
        + '<li>Hochgeschwindigkeitsklopfen ist <strong>nicht h\u00f6rbar</strong> \u2013 man '
        + 'bemerkt es erst am Motorschaden (Kolben, Lager, Dichtungen)</li>'
        + '<li>Die manuelle Einstellung am Verteiler ist \u201e\u00fcberlebenswichtig\u201c</li>'
        + '</ul></div>'

        + '<h4>Notfall-Szenario: Schlechter Kraftstoff im Ausland</h4>'
        + '<p>Wenn nur 95 ROZ verf\u00fcgbar ist (z.B. l\u00e4ndliche Tankstelle in '
        + 'S\u00fcdeuropa):</p>'
        + '<ol>'
        + '<li><strong>Z\u00fcndzeitpunkt 2\u20134\u00b0 nach sp\u00e4t</strong> drehen '
        + '(Verteiler-Klemmschraube l\u00f6sen, Verteiler gegen Drehrichtung drehen)</li>'
        + '<li><strong>Volllast vermeiden</strong> \u2013 besonders im 4./5. Gang unter Last</li>'
        + '<li>Bei n\u00e4chster Gelegenheit 98+ ROZ tanken und Timing zur\u00fccksetzen</li>'
        + '<li>Stroboskop-Kontrolle nach R\u00fcckkehr auf Original-Timing</li>'
        + '</ol>'

        + '<div class="exk-box info">'
        + '<strong>Warum mechanisch?</strong> Der MSD 8479 arbeitet mit Vakuumdose und '
        + 'Fliehgewichten \u2013 kein elektronisches Kennfeld. Das ist extrem robust '
        + '(keine Software, keine Sensoren, die ausfallen), aber Fehleinstellungen werden '
        + 'nicht kompensiert. Der Vorteil: Man versteht jedes Bauteil, und die Einstellung '
        + 'ist mit einem Stroboskop jederzeit pr\u00fcfbar.</div>'
      },

      /* ---- 5. CR-RECHNER ALS WAHRHEIT ---- */
      {
        id: 'exk-cr-truth',
        titel: '5. Verdichtung: Nur der CR-Rechner z\u00e4hlt',
        stichworte: 'CR Rechner Verdichtungsverhaeltnis Brennraum Kolbenmulde Deck',
        inhalt:
          '<div class="exk-box warn">'
        + '<strong>\u26a0 Einzige Wahrheit:</strong> Nur der Wert aus dem '
        + '<strong>CR-Rechner</strong> (Spezifikationen-Seite) ist verbindlich. Alle '
        + 'anderen CR-Angaben auf den Seiten sind Sch\u00e4tzungen oder Nominal-Werte, '
        + 'die sich \u00e4ndern, sobald Sie Kolbenmulde, Deck Height oder '
        + 'Dichtungsst\u00e4rke messen und eintragen.</div>'

        + '<h4>Was beeinflusst die tats\u00e4chliche Verdichtung?</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Parameter</th><th>Einfluss auf CR</th><th>Wert kommt aus</th></tr>'
        + '<tr><td>Bohrung & Hub</td><td>Bestimmt Hubvolumen</td>'
        + '<td>M-6009-302: 4.000" \u00d7 3.000" (fest)</td></tr>'
        + '<tr><td>Brennraumvolumen</td><td>Kleinerer Brennraum = h\u00f6here CR</td>'
        + '<td>AFR-1399: 58cc nominal (messen!)</td></tr>'
        + '<tr><td>Kopfdichtung</td><td>D\u00fcnnere Dichtung = h\u00f6here CR</td>'
        + '<td>Ford M-6051-CP331 (Bore & Thickness)</td></tr>'
        + '<tr><td>Deck Height (PTD)</td><td>Kolben tiefer = niedrigere CR</td>'
        + '<td>Am Block messen (Phase 1)</td></tr>'
        + '<tr><td>Kolbenmulde (Dish)</td><td>Gr\u00f6\u00dfere Mulde = niedrigere CR</td>'
        + '<td>Mahle Kolben (messen oder Datenblatt)</td></tr>'
        + '</table>'

        + '<h4>Die Formel</h4>'
        + '<p><strong>CR = (Hubvolumen + Totvolumen) / Totvolumen</strong></p>'
        + '<p>Totvolumen = Brennraum + Kopfdichtungsvolumen + Deck-Volumen + Kolbenmulde</p>'

        + '<h4>Die Kette</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Schritt</th><th>Quelle</th><th>Ziel</th></tr>'
        + '<tr><td>1. CR berechnen</td><td>Messwerte (Bore, Stroke, Chamber, Gasket, Deck, Dish)</td>'
        + '<td>CR-Rechner \u2192 berechnete CR</td></tr>'
        + '<tr><td>2. Leistung simulieren</td><td>CR + Cam + Heads + Intake</td>'
        + '<td>Motor-Simulator \u2192 HP, TQ, RPM</td></tr>'
        + '<tr><td>3. Kraftstoff bestimmen</td><td>Berechnete CR</td>'
        + '<td>Oktanempfehlung (automatisch)</td></tr>'
        + '<tr><td>4. Timing ableiten</td><td>CR + Oktanzahl</td>'
        + '<td>Max. Total Timing (siehe Kap. 7)</td></tr>'
        + '<tr><td>5. Geschwindigkeit</td><td>HP/TQ + Getriebe + Reifen</td>'
        + '<td>Geschwindigkeits-Simulator \u2192 V-max</td></tr>'
        + '</table>'

        + '<div class="exk-box info">'
        + '<strong>Automatik:</strong> Der CR-Rechner f\u00fcttert den Motor-Simulator, '
        + 'der Motor-Simulator f\u00fcttert den Geschwindigkeits-Simulator. \u00c4ndern '
        + 'Sie einen Messwert im CR-Rechner, aktualisieren sich alle nachfolgenden '
        + 'Berechnungen automatisch.</div>'
      },

      /* ---- 6. ZUENDUNG: DIE DREI KOMPONENTEN ---- */
      {
        id: 'exk-ignition',
        titel: '6. Z\u00fcndung: Initial, Centrifugal, Vacuum',
        stichworte: 'Initial Centrifugal Vacuum Advance Total Timing Verteiler OT BTDC',
        inhalt:
          '<p>Der Z\u00fcndzeitpunkt bestimmt, <strong>wann</strong> der Funke den '
        + 'Kraftstoff z\u00fcndet. Gemessen in Grad vor dem oberen Totpunkt (\u00b0 BTDC).</p>'

        + '<table class="exk-table">'
        + '<tr><th>Komponente</th><th>Was es macht</th><th>Wann aktiv</th><th>Einstellung</th></tr>'
        + '<tr><td><strong>Initial Advance</strong></td>'
        + '<td>Grundeinstellung am Verteiler</td>'
        + '<td>Immer (konstant)</td>'
        + '<td>Verteiler drehen, mit Stroboskop pr\u00fcfen</td></tr>'
        + '<tr><td><strong>Centrifugal Advance</strong></td>'
        + '<td>Fliehgewichte addieren Timing mit steigender Drehzahl</td>'
        + '<td>~1.200 RPM bis ~3.500 RPM</td>'
        + '<td>Springs + Bushings im Verteiler</td></tr>'
        + '<tr><td><strong>Vacuum Advance</strong></td>'
        + '<td>Unterdruck-Dose addiert Timing bei Teillast</td>'
        + '<td>Nur bei Teillast (bei WOT = 0\u00b0)</td>'
        + '<td>Dose verstellbar (Inbusschraube)</td></tr>'
        + '</table>'

        + '<div class="exk-box info">'
        + '<strong>Total Timing = Initial + Centrifugal</strong> (bei Volllast, Vacuum = 0).<br>'
        + 'Das ist der <strong>kritische Wert</strong> f\u00fcr die Klopfgrenze. '
        + 'Vacuum Advance kommt nur bei Teillast dazu und ist <strong>kein Klopfrisiko</strong>, '
        + 'weil bei Teillast der Brennraumdruck niedrig ist.</div>'

        + '<h4>Warum Vacuum Advance wichtig ist</h4>'
        + '<p>Der Vacuum Advance verbessert bei Teillast (Stadtverkehr, Autobahn-Cruising) '
        + 'den Verbrauch und die Gasannahme erheblich. Bei Volllast (WOT = Wide Open '
        + 'Throttle) ist kein Unterdruck vorhanden \u2192 Vacuum Advance = 0\u00b0. '
        + 'Das hei\u00dft: Bei Volllast z\u00e4hlt nur Total Timing (Initial + Centrifugal).</p>'

        + '<h4>Stroboskop-Pflicht</h4>'
        + '<p><strong>Hella 8PD 004 835-001</strong> (oder gleichwertig). Keine '
        + 'Digital-Stroboskope \u2013 die k\u00f6nnen bei CDI-Z\u00fcndungen (MSD 6AL) '
        + 'Fehlz\u00fcndungen als Trigger interpretieren und falsche Werte anzeigen. '
        + 'Klassisches Xenon-Stroboskop mit induktiver Klemme.</p>'
      },

      /* ---- 7. MSD 8479 ADVANCE-PRAXIS ---- */
      {
        id: 'exk-msd-advance',
        titel: '7. MSD 8479 \u2013 Advance-Kurve einstellen',
        stichworte: 'MSD 8479 Springs Bushings Silber Blau Heavy Light Advance Kurve',
        inhalt:
          '<h4>Advance Springs (Geschwindigkeit der Verstellung)</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Kombi</th><th>Federn</th><th>Kurve</th><th>Empfehlung</th></tr>'
        + '<tr><td><strong>A (Werks)</strong></td><td>2\u00d7 Heavy Silver</td>'
        + '<td>Langsamste</td><td style="color:#276749;"><strong>\u2190 Start hier</strong></td></tr>'
        + '<tr><td>B</td><td>1\u00d7 Heavy Silver + 1\u00d7 Light Blue</td>'
        + '<td>Mittel-langsam</td><td>\u2013</td></tr>'
        + '<tr><td>C</td><td>1\u00d7 Heavy Silver + 1\u00d7 Light Silver</td>'
        + '<td>Mittel</td><td>\u2013</td></tr>'
        + '<tr><td>D</td><td>2\u00d7 Light Blue</td>'
        + '<td>Mittel-schnell</td><td>\u2013</td></tr>'
        + '<tr><td>E</td><td>1\u00d7 Light Silver + 1\u00d7 Light Blue</td>'
        + '<td>Schnell</td><td>\u2013</td></tr>'
        + '<tr><td>F</td><td>2\u00d7 Light Silver</td>'
        + '<td>Schnellste</td><td>Nur Rennbetrieb</td></tr>'
        + '</table>'

        + '<h4>Advance Stop Bushings (Maximaler Verstellwinkel)</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Bushing-Farbe</th><th>Mech. Advance</th><th>Bei 12\u00b0 Initial = Total</th></tr>'
        + '<tr><td>Silber (Werks)</td><td>21\u00b0</td><td><strong>33\u00b0</strong></td></tr>'
        + '<tr><td>Blau</td><td>25\u00b0</td><td>37\u00b0</td></tr>'
        + '<tr><td>Schwarz (kein)</td><td>28\u00b0</td><td>40\u00b0</td></tr>'
        + '</table>'

        + '<h4>Timing-Empfehlung nach Verdichtung</h4>'
        + '<table class="exk-table">'
        + '<tr><th>CR</th><th>Max. Total mit 95 ROZ</th><th>Max. Total mit 98 ROZ</th>'
        + '<th>Max. Total mit 100+ ROZ</th></tr>'
        + '<tr><td>9.0:1</td><td>36\u201338\u00b0</td><td>38\u201340\u00b0</td>'
        + '<td>40\u201342\u00b0</td></tr>'
        + '<tr><td>9.5\u20139.8:1</td><td>32\u201334\u00b0</td><td>34\u201336\u00b0</td>'
        + '<td>36\u201338\u00b0</td></tr>'
        + '<tr><td>10.0:1</td><td>30\u201332\u00b0</td><td>32\u201334\u00b0</td>'
        + '<td>34\u201336\u00b0</td></tr>'
        + '<tr><td>10.5:1+</td><td style="color:#c53030;">Kritisch!</td><td>28\u201332\u00b0</td>'
        + '<td>32\u201334\u00b0</td></tr>'
        + '</table>'

        + '<div class="exk-box warn">'
        + '<strong>MSD-Hinweis:</strong> \u201eUse as much initial advance as possible without '
        + 'encountering excessive starter load. Start the centrifugal advance just above '
        + 'idle RPM.\u201c<br><br>'
        + '<strong>Empfehlung f\u00fcr diesen Build:</strong> Start mit Werks-Kurve '
        + '(2\u00d7 Heavy Silver, Silber-Bushing = 21\u00b0). Initial: 10\u201314\u00b0. '
        + 'Ergibt 31\u201335\u00b0 Total. Erst nach Testlauf auf Klopfneigung optimieren.</div>'

        + '<div class="exk-box info">'
        + '<strong>Detaillierte Anleitung:</strong> Siehe '
        + '<a href="docs/msd-advance-tuning.html" style="color:#2b6cb0;">'
        + 'MSD 8479 Advance-Kurve einstellen</a> \u2013 Schritt-f\u00fcr-Schritt mit '
        + 'Federn-Kombinationen, Vacuum-Advance, Troubleshooting.</div>'
      },

      /* ---- 8. LEISTUNG & DREHMOMENT ---- */
      {
        id: 'exk-power',
        titel: '8. Leistung & Drehmoment \u2013 was beeinflusst was',
        stichworte: 'Leistung PS HP Drehmoment Torque Wirkungsgrad Otto CNC Brennraum',
        inhalt:
          '<h4>Grundformel</h4>'
        + '<p><strong>Leistung = Drehmoment \u00d7 Drehzahl / 5252</strong> (in HP/ft-lbs/RPM).<br>'
        + 'Mehr Leistung kommt aus mehr Drehmoment, h\u00f6herer Drehzahl, oder beidem.</p>'

        + '<table class="exk-table">'
        + '<tr><th>Faktor</th><th>Einfluss auf Leistung</th><th>Einfluss auf Drehmoment</th></tr>'
        + '<tr><td>Verdichtung erh\u00f6hen</td><td>+3\u20134% pro 1 CR-Punkt</td>'
        + '<td>+3\u20134% (thermischer Wirkungsgrad)</td></tr>'
        + '<tr><td>Aggressivere Nockenwelle</td><td>Mehr Leistung oben</td>'
        + '<td>Weniger unten, Powerband verschiebt sich hoch</td></tr>'
        + '<tr><td>Gr\u00f6\u00dfere Ventile / Kan\u00e4le</td>'
        + '<td>Mehr Durchsatz = mehr Spitzenleistung</td>'
        + '<td>Wenig Effekt bei niedrigen Drehzahlen</td></tr>'
        + '<tr><td>Z\u00fcnd-Timing optimieren</td><td>+5\u201315 HP m\u00f6glich</td>'
        + '<td>Peak Torque verschiebt sich</td></tr>'
        + '<tr><td>Vergaser-Jetting</td><td>Optimales A/F-Ratio = max. Effizienz</td>'
        + '<td>Fettes Gemisch = Sicherheit auf Kosten von Leistung</td></tr>'
        + '</table>'

        + '<h4>Warum Drehmoment f\u00fcr den GT40 wichtiger ist</h4>'
        + '<p>Der GT40 wiegt ca. 1.050\u20131.100 kg und hat ein relativ kurz \u00fcbersetztes '
        + 'Getriebe (UN1-13). <strong>Drehmoment im mittleren Drehzahlbereich</strong> '
        + '(3.000\u20135.000 RPM) bestimmt die Beschleunigung und das Fahrverhalten. '
        + 'Spitzenleistung bei 6.000+ RPM ist weniger relevant. Deshalb ist die XE274HR '
        + 'mit ihrem breiten Drehmomentplateau die richtige Wahl.</p>'

        + '<h4>Thermischer Wirkungsgrad (Otto-Prozess)</h4>'
        + '<p>Die Verdichtung bestimmt den theoretischen Wirkungsgrad:<br>'
        + '<code>\u03b7 = 1 \u2212 (1/CR)^(\u03b3\u22121)</code> '
        + 'mit \u03b3 \u2248 1.3 (Benzin-Luft-Gemisch)</p>'
        + '<table class="exk-table">'
        + '<tr><th>CR</th><th>Theor. Wirkungsgrad</th><th>Praxis</th></tr>'
        + '<tr><td>8.0:1</td><td>~46%</td><td>Oldtimer-Standard (bleifreie \u00c4ra)</td></tr>'
        + '<tr><td>9.0:1</td><td>~49%</td><td>M-6009-302 nominal (64cc Heads)</td></tr>'
        + '<tr><td>9.5:1</td><td>~50%</td><td>Sweet Spot f\u00fcr 98 ROZ</td></tr>'
        + '<tr><td>10.0:1</td><td>~52%</td><td>98+ ROZ, konservatives Timing</td></tr>'
        + '<tr><td>10.5:1</td><td>~53%</td><td>Grenzbereich \u2013 100+ ROZ empfohlen</td></tr>'
        + '<tr><td>11.0:1+</td><td>~54%+</td><td>Rennkraftstoff erforderlich</td></tr>'
        + '</table>'

        + '<h4>CNC-Brennraum-Bonus</h4>'
        + '<p>Die AFR-1399-K\u00f6pfe haben <strong>CNC-bearbeitete Brennr\u00e4ume</strong> '
        + 'mit optimaler Quench-Geometrie. Das reduziert die Klopfneigung um ca. '
        + '<strong>2\u20133 ROZ</strong> gegen\u00fcber offenen Guss-Kammern. Warum?</p>'
        + '<ul>'
        + '<li><strong>Gleichm\u00e4\u00dfige Brennraumform</strong> \u2013 homogene '
        + 'Flammenfront, weniger Hotspots</li>'
        + '<li><strong>Optimaler Quench-Bereich</strong> \u2013 Turbulenz im Brennraum '
        + 'beschleunigt die Verbrennung, reduziert Restgas-Temperatur</li>'
        + '<li><strong>Konsistentes Volumen</strong> \u2013 alle 8 Zylinder haben '
        + 'dieselbe CR (bei Guss-K\u00f6pfen k\u00f6nnen die Brennr\u00e4ume 2\u20133cc '
        + 'voneinander abweichen)</li>'
        + '</ul>'
      },

      /* ---- 9. PRAXIS-VORGEHENSWEISE ---- */
      {
        id: 'exk-practice',
        titel: '9. Praxis-Vorgehensweise f\u00fcr den GT40',
        stichworte: 'Vorgehensweise Praxis Anleitung Schritt Zuendkerze',
        inhalt:
          '<ol>'
        + '<li><strong>Verdichtung messen/berechnen</strong> \u2013 CR-Rechner auf der '
        + 'Spezifikationen-Seite: Brennraumvolumen, Kolbenmulde, Deck Height und '
        + 'Dichtung eintragen. <strong>Nur dieser Wert ist verbindlich.</strong></li>'
        + '<li><strong>Kraftstoff bestimmen</strong> \u2013 Min. 98 ROZ (Super Plus). '
        + 'Ideal: MOL EVO 100 (ETBE, 0% Ethanol) oder Shell V-Power 100</li>'
        + '<li><strong>Initial Advance einstellen</strong> \u2013 Start mit 10\u201314\u00b0 '
        + '(so viel wie m\u00f6glich, ohne \u00fcberm\u00e4\u00dfige Anlasser-Belastung)</li>'
        + '<li><strong>Centrifugal-Kurve pr\u00fcfen</strong> \u2013 Werks-Springs '
        + '(2\u00d7 Heavy Silver) + Silber-Bushing = max. 21\u00b0 Centrifugal '
        + '\u2192 31\u201335\u00b0 Total</li>'
        + '<li><strong>Erststart &amp; Einfahren</strong> \u2013 20 Minuten bei 2.000\u20132.500 RPM '
        + '(Nockenwelle einlaufen). Kein Leerlauf!</li>'
        + '<li><strong>Testlauf unter Last</strong> \u2013 Bergauffahrt im 3. Gang, '
        + '2.500\u20134.000 RPM. Auf Klopfen h\u00f6ren. Wenn klopft: 2\u00b0 '
        + 'zur\u00fcck.</li>'
        + '<li><strong>Z\u00fcndkerzen lesen</strong> (nach 50\u2013100 km Fahrt): '
        + 'Isolatorfu\u00df hellbraun/rehbraun = ideal. Wei\u00df = zu mager '
        + '(Hauptd\u00fcse vergr\u00f6\u00dfern). Schwarz/ru\u00dfig = zu fett '
        + '(Hauptd\u00fcse verkleinern).</li>'
        + '<li><strong>Feintuning</strong> \u2013 Total Timing in 1\u00b0-Schritten '
        + 'erh\u00f6hen bis Klopfgrenze oder Leistungsmaximum. Immer mit Stroboskop.</li>'
        + '</ol>'

        + '<div class="exk-box info">'
        + '<strong>Zusammenfassung f\u00fcr unseren Build:</strong>'
        + '<table class="exk-table" style="margin-top:0.3rem;">'
        + '<tr><td style="width:35%;"><strong>Verdichtung</strong></td>'
        + '<td>\u2192 siehe CR-Rechner (Spezifikationen)</td></tr>'
        + '<tr><td><strong>Kraftstoff</strong></td>'
        + '<td>98+ ROZ (Super Plus / V-Power 100)</td></tr>'
        + '<tr><td><strong>Total Timing</strong></td>'
        + '<td>32\u201336\u00b0 (abh\u00e4ngig von gemessener CR)</td></tr>'
        + '<tr><td><strong>Rev Limiter</strong></td>'
        + '<td>6.500 RPM (Performance-Limit NW: 6.200 RPM + 300 Marge)</td></tr>'
        + '<tr><td><strong>Advance-Kurve</strong></td>'
        + '<td>Start: Kombi A (2\u00d7 Heavy Silver, Silber-Bushing)</td></tr>'
        + '</table>'
        + '<br><strong>Alles h\u00e4ngt zusammen</strong> \u2013 \u00e4ndern Sie die CR, '
        + 'm\u00fcssen Timing, Oktanzahl und Jetting folgen!</div>'
      }
    ]
  };

  global.EXKURS_ENGINE = EXKURS;

  /* ---- Overlay bauen. Erst beim ersten Oeffnen, nicht beim Laden. ---- */
  function baueExkursOverlay() {
    if (document.getElementById('guide-exkurs-engine')) return;

    var t = [];
    t.push('<div class="guide-overlay" id="guide-exkurs-engine">');

    // Header mit Suchfeld (wie reference.js und Glossar)
    t.push('<div class="glossary-search">');
    t.push('  <div class="glossary-search-row">');
    t.push('    <button class="guide-back" onclick="hideGuide(\'guide-exkurs-engine\')">&larr;</button>');
    t.push('    <input type="search" id="exkursSearch" placeholder="Suchen im Exkurs\u2026" oninput="filterExkurs()">');
    t.push('    <span class="glossary-count" id="exkursCount"></span>');
    t.push('  </div>');
    t.push('</div>');

    t.push('<div class="guide-content" id="exkursBody">');

    // Titel
    t.push('<h2 class="guide-title">' + EXKURS.titel + '</h2>');

    // Inhaltsverzeichnis
    t.push('<div class="exk-toc" id="exkursToc">');
    t.push('  <div style="font-weight:700;font-size:0.82rem;color:#2c5282;margin-bottom:0.3rem;">Inhalt</div>');
    EXKURS.abschnitte.forEach(function (a) {
      t.push('  <a href="#' + a.id + '" class="exk-toc-link" onclick="scrollToExkurs(\'' + a.id + '\');return false;">'
           + a.titel + '</a>');
    });
    t.push('</div>');

    // Abschnitte
    EXKURS.abschnitte.forEach(function (a) {
      t.push('<div class="exk-section" id="' + a.id + '" data-stichworte="' + (a.stichworte || '') + '">');
      t.push('  <h3>' + a.titel + '</h3>');
      t.push('  ' + a.inhalt);
      t.push('</div>');
    });

    t.push('  <div class="ref-leer" id="exkursLeer" style="display:none;">Kein Treffer.</div>');
    t.push('</div>');
    t.push('</div>');

    var h = document.createElement('div');
    h.innerHTML = t.join('\n');
    document.body.appendChild(h.firstChild);
  }

  /* ---- Suche ueber alle Abschnitte ---- */
  function filterExkurs() {
    var feld = document.getElementById('exkursSearch');
    var q = (feld ? feld.value : '').trim().toLowerCase();
    var treffer = 0;
    var toc = document.getElementById('exkursToc');

    EXKURS.abschnitte.forEach(function (a) {
      var el = document.getElementById(a.id);
      if (!el) return;
      var text = el.textContent.toLowerCase() + ' ' + (a.stichworte || '').toLowerCase();
      var passt = !q || text.indexOf(q) !== -1;
      el.style.display = passt ? '' : 'none';
      if (passt) treffer++;
    });

    // Inhaltsverzeichnis ausblenden wenn Suche aktiv
    if (toc) toc.style.display = q ? 'none' : '';

    var zaehler = document.getElementById('exkursCount');
    if (zaehler) zaehler.textContent = q ? (treffer + ' Treffer') : '';
    var leer = document.getElementById('exkursLeer');
    if (leer) leer.style.display = (q && !treffer) ? '' : 'none';
  }

  function scrollToExkurs(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  global.showExkursEngine = function () {
    baueExkursOverlay();
    showGuide('guide-exkurs-engine');
    var feld = document.getElementById('exkursSearch');
    if (feld) { feld.value = ''; filterExkurs(); }
  };
  global.filterExkurs = filterExkurs;
  global.scrollToExkurs = scrollToExkurs;

})(typeof window !== 'undefined' ? window : globalThis);
