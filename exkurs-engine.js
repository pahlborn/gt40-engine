/**
 * exkurs-engine.js - Exkurs: Verdichtung, Zuendung, Leistung & Oktanzahl.
 *
 * Erreichbar ueber den neuen Button am rechten Rand (Flammen-Symbol).
 * Baut wie reference.js ein Overlay beim ersten Oeffnen; liegt auf allen Seiten.
 *
 * Inhalt:
 *  1. Historischer Kontext (High-Compression-Aera, bleiversetzter Kraftstoff)
 *  2. Das Dreieck: Verdichtung - Zuendung - Oktanzahl
 *  3. AKI vs. ROZ (USA vs. Europa)
 *  4. Warum kein Klopfsensor = kein Sicherheitsnetz
 *  5. Praxis fuer den GT40 Boss 302 Build
 *  6. Leistung & Drehmoment - was beeinflusst was
 *
 * Wichtig: Die tatsaechliche Verdichtung kommt NUR aus dem CR-Rechner.
 * Jeder Hardcoded-Wert auf anderen Seiten ist nur eine Schaetzung.
 */
(function (global) {
  'use strict';

  var EXKURS = {
    titel: 'Exkurs: Verdichtung, Z&uuml;ndung, Leistung &amp; Oktanzahl',
    abschnitte: [
      {
        id: 'exk-history',
        titel: '1. Historischer Kontext: Die High-Compression-&Auml;ra',
        inhalt:
          '<p>In den 1950er bis 1970er Jahren bauten US-Hersteller (Ford, Chevrolet, Dodge) V8-Motoren mit '
        + 'sehr hoher Verdichtung &ndash; oft <strong>10:1 bis &uuml;ber 11:1</strong>. Das war m&ouml;glich, weil '
        + 'damals <strong>stark verbleiter Kraftstoff</strong> (Tetraethylblei) mit sehr hoher Klopffestigkeit '
        + 'verf&uuml;gbar war.</p>'
        + '<div class="exk-box warn">'
        + '<strong>Blei hatte zwei Funktionen:</strong>'
        + '<ol style="margin:0.3rem 0 0;padding-left:1.2rem;">'
        + '<li>Erh&ouml;hung der Oktanzahl (Klopffestigkeit)</li>'
        + '<li>Schmierung der Ventilsitze (d&auml;mpft den Aufprall der Ventile)</li>'
        + '</ol></div>'
        + '<p>Mit den Abgasgesetzen Anfang der 1970er fiel das Blei weg. Die Hersteller mussten die '
        + 'Verdichtung auf 8.0&ndash;8.5:1 absenken, um mit bleifreiem Kraftstoff klarzukommen. '
        + 'Gleichzeitig wurden geh&auml;rtete Ventilsitze (hardened valve seats) eingef&uuml;hrt.</p>'
        + '<div class="exk-box info">'
        + '<strong>Unser BOSS 302 Block (M-6010-BOSS302):</strong> Moderner Guss mit '
        + 'geh&auml;rteten Ventilsitzen in den AFR-1399-K&ouml;pfen. Kein Bleiersatz-Additiv erforderlich. '
        + 'Die Motorentechnik ist zeitlos &ndash; die Thermodynamik eines Ottomotors gilt f&uuml;r einen '
        + '1969er Mustang genauso wie f&uuml;r unseren 2026er Build.'
        + '</div>'
      },
      {
        id: 'exk-triangle',
        titel: '2. Das Dreieck: Verdichtung &ndash; Z&uuml;ndung &ndash; Oktanzahl',
        inhalt:
          '<p>Diese drei Gr&ouml;&szlig;en h&auml;ngen <strong>untrennbar</strong> zusammen. '
        + '&Auml;ndern Sie eine, m&uuml;ssen Sie die anderen anpassen:</p>'
        + '<table class="exk-table">'
        + '<tr><th>Gr&ouml;&szlig;e</th><th>Eigenschaft</th><th>In unserem Build</th></tr>'
        + '<tr><td><strong>Verdichtung (CR)</strong></td><td>Fest, durch den Build definiert (Kolben, K&ouml;pfe, Dichtung, Deck Height)</td>'
        + '<td><strong>Ergebnis aus dem CR-Rechner</strong> &ndash; keine Sch&auml;tzung verwenden!</td></tr>'
        + '<tr><td><strong>Z&uuml;ndzeitpunkt</strong></td><td>Einstellbar (Initial + Centrifugal + Vacuum Advance)</td>'
        + '<td>MSD 8479 Verteiler + MSD 6AL CDI Box</td></tr>'
        + '<tr><td><strong>Oktanzahl (ROZ)</strong></td><td>Bestimmt die max. Klopffestigkeit des Kraftstoffs</td>'
        + '<td>Min. 98 ROZ (Super Plus), ideal 100+ ROZ</td></tr>'
        + '</table>'

        + '<h4>Wie funktioniert das Zusammenspiel?</h4>'
        + '<p><strong>Verdichtung erh&ouml;hen</strong> &rarr; h&ouml;herer Spitzendruck im Brennraum '
        + '&rarr; mehr Leistung und Wirkungsgrad, ABER auch h&ouml;here Klopfneigung.</p>'
        + '<p><strong>Z&uuml;ndung fr&uuml;her</strong> (mehr Advance) &rarr; Gemisch z&uuml;ndet fr&uuml;her '
        + 'vor OT &rarr; optimaler Druckaufbau &rarr; mehr Leistung, ABER Klopfgefahr steigt.</p>'
        + '<p><strong>H&ouml;here Oktanzahl</strong> &rarr; Kraftstoff widersteht h&ouml;herem Druck ohne '
        + 'Selbstz&uuml;ndung &rarr; erlaubt mehr Verdichtung und/oder mehr Advance.</p>'

        + '<div class="exk-box danger">'
        + '<strong>&#9888; Klopfen (Detonation):</strong> Unkontrollierte Selbstz&uuml;ndung des Restgemischs. '
        + 'Erzeugt Druckspitzen bis 10&times; h&ouml;her als normale Verbrennung. '
        + 'Kann in Sekunden L&ouml;cher in Kolben brennen, Lager zerst&ouml;ren, Dichtungen durchschlagen. '
        + '<strong>Hochgeschwindigkeitsklopfen ist nicht h&ouml;rbar!</strong> Es tritt unter Volllast bei '
        + 'hoher Drehzahl auf, wo Motorger&auml;usche und Abgaslautst&auml;rke es &uuml;berdecken.'
        + '</div>'
      },
      {
        id: 'exk-octane',
        titel: '3. AKI vs. ROZ &ndash; Die Oktan-Falle (USA vs. Europa)',
        inhalt:
          '<p>In alten US-Handb&uuml;chern steht oft &bdquo;91 Octane&ldquo; oder &bdquo;93 Octane&ldquo;. '
        + '<strong>Vorsicht:</strong> Die USA messen in <strong>AKI</strong> (Anti-Knock Index = Mittelwert aus ROZ und MOZ), '
        + 'Europa misst in <strong>ROZ</strong> (Research-Oktanzahl).</p>'

        + '<table class="exk-table">'
        + '<tr><th>USA (AKI)</th><th>Europa (ROZ)</th><th>Bezeichnung</th></tr>'
        + '<tr><td>87</td><td>~91&ndash;92</td><td>Regular</td></tr>'
        + '<tr><td>89</td><td>~93&ndash;94</td><td>Mid-Grade / Plus</td></tr>'
        + '<tr><td>91</td><td>~95&ndash;96</td><td>Premium</td></tr>'
        + '<tr><td>93</td><td>~98</td><td>Super Premium</td></tr>'
        + '<tr><td>94+</td><td>~100+</td><td>Racing Fuel</td></tr>'
        + '</table>'

        + '<div class="exk-box info">'
        + '<strong>Faustregel:</strong> AKI &asymp; ROZ &minus; 4 bis 5. '
        + 'Wenn ein US-Handbuch &bdquo;93 Octane&ldquo; fordert, brauchen Sie in Europa mindestens '
        + '<strong>98 ROZ (Super Plus)</strong>.'
        + '</div>'
      },
      {
        id: 'exk-nosensor',
        titel: '4. Kein Klopfsensor = kein Sicherheitsnetz',
        inhalt:
          '<p>Moderne Motoren haben <strong>Klopfsensoren</strong>, die bei beginnender Detonation '
        + 'automatisch den Z&uuml;ndzeitpunkt zur&uuml;cknehmen. Unser V8 hat das nicht.</p>'

        + '<div class="exk-box danger">'
        + '<strong>Das bedeutet:</strong>'
        + '<ul style="margin:0.3rem 0 0;padding-left:1.2rem;">'
        + '<li>Der Motor verzeiht <strong>keine Fehler</strong> bei Oktanzahl oder Timing</li>'
        + '<li>Zu niedrige Oktanzahl + aggressive Fr&uuml;hz&uuml;ndung = Klopfen unter Last</li>'
        + '<li>Hochgeschwindigkeitsklopfen ist <strong>nicht h&ouml;rbar</strong> &ndash; man bemerkt es erst am Motorschaden</li>'
        + '<li>Die manuelle Einstellung am Verteiler ist &bdquo;&uuml;berlebenswichtig&ldquo;</li>'
        + '</ul></div>'

        + '<h4>Notfall-Szenario: Schlechter Kraftstoff im Ausland</h4>'
        + '<p>Wenn nur 95 ROZ verf&uuml;gbar ist (z.B. l&auml;ndliche Tankstelle):</p>'
        + '<ol>'
        + '<li>Z&uuml;ndzeitpunkt <strong>2&ndash;4&deg; nach sp&auml;t</strong> drehen (am Verteiler)</li>'
        + '<li>Volllast <strong>vermeiden</strong></li>'
        + '<li>Bei n&auml;chster Gelegenheit 98+ ROZ tanken und Timing zur&uuml;cksetzen</li>'
        + '</ol>'
        + '<p style="color:#718096;font-size:0.78rem;">Daf&uuml;r hat der MSD 8479 eine Vakuumdose und mechanische '
        + 'Fliehgewichte &ndash; kein elektronisches Kennfeld, sondern rein mechanisch. Das ist robust, '
        + 'aber Fehleinstellungen werden nicht kompensiert.</p>'
      },
      {
        id: 'exk-cr-truth',
        titel: '5. Verdichtung: Nur der CR-Rechner z&auml;hlt',
        inhalt:
          '<div class="exk-box warn">'
        + '<strong>&#9888; Wichtig:</strong> Auf den verschiedenen Seiten stehen unterschiedliche CR-Annahmen '
        + '(9.0:1 nominal, ~9.2:1 berechnet, ~9.7:1 gesch&auml;tzt, 9.8:1 in Empfehlungen). '
        + '<strong>Nur der Wert aus dem CR-Rechner (specs.html) ist verbindlich.</strong> '
        + 'Alle anderen Angaben sind N&auml;herungen, die sich &auml;ndern, sobald Sie die Kolbenmulde, '
        + 'Deck Height oder Dichtungsst&auml;rke messen und eintragen.'
        + '</div>'

        + '<h4>Was beeinflusst die tats&auml;chliche Verdichtung?</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Parameter</th><th>Einfluss auf CR</th><th>Wert kommt aus</th></tr>'
        + '<tr><td>Bohrung &amp; Hub</td><td>Bestimmt Hubvolumen (Swept Volume)</td><td>M-6009-302 Specs (fest)</td></tr>'
        + '<tr><td>Brennraumvolumen</td><td>Kleinerer Brennraum = h&ouml;here CR</td><td>AFR-1399: 58cc (messen!)</td></tr>'
        + '<tr><td>Kopfdichtung</td><td>D&uuml;nnere Dichtung = h&ouml;here CR</td><td>Ford M-6051-CP331 (Bore &amp; Thickness)</td></tr>'
        + '<tr><td>Deck Height (PTD)</td><td>Kolben tiefer = niedrigere CR</td><td>Am Block messen (Phase 1)</td></tr>'
        + '<tr><td>Kolbenmulde (Dish)</td><td>Gr&ouml;&szlig;ere Mulde = niedrigere CR</td><td>Mahle Kolben (messen oder Datenblatt)</td></tr>'
        + '</table>'

        + '<p>Die Formel: <strong>CR = (Hubvolumen + Totvolumen) / Totvolumen</strong><br>'
        + 'Totvolumen = Brennraum + Kopfdichtungsvolumen + Deck-Volumen + Kolbenmulde</p>'

        + '<div class="exk-box info">'
        + '<strong>Kette:</strong> CR-Rechner &rarr; Simulator (Leistung) &rarr; Oktanempfehlung &rarr; Timing-Empfehlung. '
        + 'Alle nachfolgenden Berechnungen ziehen automatisch den CR-Wert aus dem Rechner. '
        + '&Auml;ndern Sie dort einen Messwert, aktualisieren sich Simulator und Empfehlungen sofort.'
        + '</div>'
      },
      {
        id: 'exk-power',
        titel: '6. Leistung &amp; Drehmoment &ndash; was beeinflusst was',
        inhalt:
          '<h4>Leistung (PS / HP)</h4>'
        + '<p>Leistung = Drehmoment &times; Drehzahl. Mehr Leistung kommt entweder aus mehr '
        + 'Drehmoment oder h&ouml;herer Drehzahl &ndash; oder beidem.</p>'

        + '<table class="exk-table">'
        + '<tr><th>Faktor</th><th>Einfluss auf Leistung</th><th>Einfluss auf Drehmoment</th></tr>'
        + '<tr><td>Verdichtung erh&ouml;hen</td><td>+3&ndash;4% pro 1 CR-Punkt</td><td>+3&ndash;4% (thermischer Wirkungsgrad)</td></tr>'
        + '<tr><td>Aggressivere Nockenwelle</td><td>Mehr Leistung oben</td><td>Weniger unten, Powerband verschiebt sich</td></tr>'
        + '<tr><td>Gr&ouml;&szlig;ere Ventile / Kan&auml;le</td><td>Mehr Durchsatz = mehr Spitzenleistung</td><td>Wenig Effekt bei niedrigen Drehzahlen</td></tr>'
        + '<tr><td>Z&uuml;nd-Timing optimieren</td><td>+5&ndash;15 HP m&ouml;glich</td><td>Peak Torque verschiebt sich</td></tr>'
        + '<tr><td>Vergaser-Jetting</td><td>Optimales A/F-Ratio = maximale Effizienz</td><td>Fettes Gemisch = mehr Sicherheit, weniger Leistung</td></tr>'
        + '</table>'

        + '<h4>Drehmoment &ndash; warum es f&uuml;r den GT40 wichtiger ist</h4>'
        + '<p>Der GT40 ist schwer (~1.100 kg) und hat ein relativ kurz &uuml;bersetztes Getriebe. '
        + '<strong>Drehmoment im mittleren Drehzahlbereich</strong> (3.000&ndash;5.000 RPM) ist wichtiger '
        + 'als Spitzenleistung bei 6.000+ RPM. Deshalb ist die XE274HR-Nockenwelle mit ihrem '
        + 'breiten Drehmomentplateau die richtige Wahl &ndash; auch wenn sie bei 6.200 RPM am Ende ist.</p>'

        + '<h4>Thermischer Wirkungsgrad</h4>'
        + '<p>Die Verdichtung bestimmt den <strong>Otto-Wirkungsgrad</strong>:<br>'
        + '<code>&eta; = 1 &minus; (1/CR)<sup>&gamma;&minus;1</sup></code> (mit &gamma; &asymp; 1.3 f&uuml;r Benzin-Luft-Gemisch)</p>'
        + '<table class="exk-table">'
        + '<tr><th>CR</th><th>Theor. Wirkungsgrad</th><th>Praxis-Bemerkung</th></tr>'
        + '<tr><td>8.0:1</td><td>~46%</td><td>Oldtimer-Standard (bleifreie &Auml;ra)</td></tr>'
        + '<tr><td>9.0:1</td><td>~49%</td><td>M-6009-302 nominal (64cc Heads)</td></tr>'
        + '<tr><td>9.5:1</td><td>~50%</td><td>Sweet Spot f&uuml;r Super Plus (98 ROZ)</td></tr>'
        + '<tr><td>10.0:1</td><td>~52%</td><td>Erfordert 98+ ROZ, konservatives Timing</td></tr>'
        + '<tr><td>10.5:1</td><td>~53%</td><td>Grenzbereich &ndash; 100+ ROZ empfohlen</td></tr>'
        + '<tr><td>11.0:1+</td><td>~54%+</td><td>Rennkraftstoff erforderlich</td></tr>'
        + '</table>'

        + '<div class="exk-box info">'
        + '<strong>CNC-Brennraum-Bonus:</strong> Die AFR-1399-K&ouml;pfe haben CNC-bearbeitete '
        + 'Brennr&auml;ume mit optimaler Quench-Geometrie. Das reduziert die Klopfneigung '
        + 'um ca. 2&ndash;3 ROZ gegen&uuml;ber offenen Guss-Kammern. Deshalb k&ouml;nnen wir mit '
        + '~9.7:1 CR und 34&deg; Total Timing problemlos Super Plus (98 ROZ) verwenden.'
        + '</div>'
      },
      {
        id: 'exk-timing',
        titel: '7. Z&uuml;ndung in der Praxis &ndash; Einstellung am MSD 8479',
        inhalt:
          '<h4>Drei Timing-Komponenten</h4>'
        + '<table class="exk-table">'
        + '<tr><th>Komponente</th><th>Was es macht</th><th>Wann aktiv</th></tr>'
        + '<tr><td><strong>Initial Advance</strong></td><td>Grundeinstellung am Verteiler (Motorklopfen bei Leerlauf beobachten)</td><td>Immer (konstant)</td></tr>'
        + '<tr><td><strong>Centrifugal Advance</strong></td><td>Fliehgewichte im Verteiler addieren Timing mit steigender Drehzahl</td><td>Ab ~1.200 RPM bis ~3.500 RPM (je nach Springs)</td></tr>'
        + '<tr><td><strong>Vacuum Advance</strong></td><td>Unterdruck-Dose addiert Timing bei Teillast</td><td>Nur bei Teillast (bei WOT = 0&deg;)</td></tr>'
        + '</table>'

        + '<p><strong>Total Timing = Initial + Centrifugal</strong> (bei Volllast, Vacuum = 0)<br>'
        + 'Das ist der kritische Wert f&uuml;r die Klopfgrenze.</p>'

        + '<h4>Empfehlung nach CR</h4>'
        + '<table class="exk-table">'
        + '<tr><th>CR</th><th>Max. Total mit 95 ROZ</th><th>Max. Total mit 98 ROZ</th><th>Max. Total mit 100+ ROZ</th></tr>'
        + '<tr><td>9.0:1</td><td>36&ndash;38&deg;</td><td>38&ndash;40&deg;</td><td>40&ndash;42&deg;</td></tr>'
        + '<tr><td>9.5&ndash;9.8:1</td><td>32&ndash;34&deg;</td><td>34&ndash;36&deg;</td><td>36&ndash;38&deg;</td></tr>'
        + '<tr><td>10.0:1</td><td>30&ndash;32&deg;</td><td>32&ndash;34&deg;</td><td>34&ndash;36&deg;</td></tr>'
        + '<tr><td>10.5:1+</td><td style="color:#c53030;">Kritisch!</td><td>28&ndash;32&deg;</td><td>32&ndash;34&deg;</td></tr>'
        + '</table>'

        + '<div class="exk-box warn">'
        + '<strong>Z&uuml;ndung fr&uuml;h = mehr Leistung, ABER:</strong> Jedes Grad mehr Advance '
        + 'erh&ouml;ht den Spitzendruck. Bei unserem Motor ohne Klopfsensor ist die Grenze '
        + '<strong>am Pr&uuml;fstand oder durch vorsichtiges Herantasten</strong> zu finden. '
        + 'Immer mit Stroboskop (Hella 8PD 004 835-001, keine Digital-Modelle!) pr&uuml;fen.'
        + '</div>'

        + '<h4>Vacuum Advance &amp; Oktanzahl</h4>'
        + '<p>Der Vacuum Advance (MSD 8479) addiert bei Teillast zus&auml;tzliches Timing. '
        + 'Das ist <strong>kein Klopfrisiko</strong>, da Teillast = weniger Brennraumdruck. '
        + 'Vacuum Advance verbessert Verbrauch und Gasannahme erheblich. '
        + 'Bei Volllast (WOT) ist kein Unterdruck vorhanden &rarr; Vacuum Advance = 0&deg;.</p>'
      },
      {
        id: 'exk-practice',
        titel: '8. Praxis-Vorgehensweise f&uuml;r den GT40',
        inhalt:
          '<ol>'
        + '<li><strong>Verdichtung messen/berechnen</strong> (CR-Rechner in specs.html) &ndash; '
        + 'Brennraumvolumen, Kolbenmulde, Deck Height und Dichtung eintragen</li>'
        + '<li><strong>Kraftstoff bestimmen</strong> &ndash; Min. 98 ROZ (Super Plus), '
        + 'ideal: MOL EVO 100 (ETBE, 0% Ethanol) oder Shell V-Power 100</li>'
        + '<li><strong>Initial Advance einstellen</strong> &ndash; Start mit 10&ndash;14&deg; '
        + '(so viel wie m&ouml;glich, ohne dass der Anlasser &uuml;berm&auml;&szlig;ig belastet wird)</li>'
        + '<li><strong>Centrifugal-Kurve pr&uuml;fen</strong> &ndash; Werks-Springs (2&times; Heavy Silver) '
        + 'ergeben ~21&deg; Centrifugal &rarr; 31&ndash;35&deg; Total</li>'
        + '<li><strong>Testlauf</strong> &ndash; Unter Last (Bergauffahrt im 3. Gang, 2.500&ndash;4.000 RPM) '
        + 'auf Klopfen h&ouml;ren. Wenn klopft: 2&deg; zur&uuml;ck.</li>'
        + '<li><strong>Z&uuml;ndkerzen lesen</strong> (nach 50&ndash;100 km Fahrt): '
        + 'Isolatorfuss hellbraun/rehbraun = ideal, wei&szlig; = zu mager, schwarz = zu fett</li>'
        + '</ol>'

        + '<div class="exk-box info">'
        + '<strong>Zusammenfassung f&uuml;r unseren Build:</strong><br>'
        + 'CR &rarr; siehe CR-Rechner (aktuell ca. 9.7:1 gesch&auml;tzt, Messwerte ausstehend)<br>'
        + 'Kraftstoff &rarr; 98+ ROZ (Super Plus / V-Power)<br>'
        + 'Total Timing &rarr; 32&ndash;36&deg; (abh&auml;ngig von gemessener CR)<br>'
        + 'Rev Limiter &rarr; 6.500 RPM (NW-Limit 6.200 RPM + Sicherheitsmarge)<br>'
        + 'Die Werte h&auml;ngen zusammen &ndash; &auml;ndern Sie die CR, m&uuml;ssen Timing und Oktanzahl folgen!'
        + '</div>'
      }
    ]
  };

  global.EXKURS_ENGINE = EXKURS;

  function baueExkursOverlay() {
    if (document.getElementById('guide-exkurs-engine')) return;

    var t = [];
    t.push('<div class="guide-overlay" id="guide-exkurs-engine">');
    t.push('<div class="glossary-search">');
    t.push('  <div class="glossary-search-row">');
    t.push('    <button class="guide-back" onclick="hideGuide(\'guide-exkurs-engine\')">&larr;</button>');
    t.push('    <span style="font-weight:700;font-size:0.9rem;color:#fff;flex:1;text-align:center;">' + EXKURS.titel + '</span>');
    t.push('  </div>');
    t.push('</div>');
    t.push('<div class="guide-content" id="exkursBody">');

    EXKURS.abschnitte.forEach(function (a) {
      t.push('<div class="exk-section" id="' + a.id + '">');
      t.push('  <h3>' + a.titel + '</h3>');
      t.push('  ' + a.inhalt);
      t.push('</div>');
    });

    t.push('</div>');
    t.push('</div>');

    var h = document.createElement('div');
    h.innerHTML = t.join('\n');
    document.body.appendChild(h.firstChild);
  }

  global.showExkursEngine = function () {
    baueExkursOverlay();
    showGuide('guide-exkurs-engine');
  };

})(typeof window !== 'undefined' ? window : this);
