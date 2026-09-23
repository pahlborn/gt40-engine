/**
 * reference.js - Betriebsmittel, Anzugswerte und Service als Nachschlagekarte.
 *
 * Erreichbar auf jeder Seite ueber den Knopf rechts. Aufgebaut wie das
 * Glossar - ein Overlay, keine eigene Seite: wer an der Werkbank einen
 * Drehmomentwert sucht, soll seinen Schritt im Build Log nicht verlieren.
 *
 * Loest die fruehere Karte "guide-torque" ab. Die lag als fertiges Markup in
 * specs.html, war nur dort erreichbar und nur ueber das Werkzeugmenue. Ihre
 * Werte stehen jetzt hier als Daten; die Karte wird daraus gebaut und liegt
 * auf allen drei Seiten.
 *
 * Warum Daten und nicht HTML: dieselben Werte stehen auch an den
 * Arbeitsschritten. Steht eine Zahl zweimal im Markup, laufen die beiden
 * Fassungen irgendwann auseinander - im Jerico-Repo ist das diese Woche
 * zweimal passiert. Hier steht jede Zeile einmal.
 *
 * Regel 5 gilt auch hier: kein Sollwert ohne Quelle. Was nicht belegt ist,
 * steht als offen drin und wird nicht geraten.
 */
(function (global) {
  'use strict';

  var REFERENCE = {
    titel: 'Betriebsmittel &amp; Anzugswerte',
    untertitel: 'Boss 302 &ndash; Drehmomente in Montagereihenfolge',
    gruppen: [
      {
        id: 'ref-torque',
        titel: '&#128295; Anzugsmomente',
        hinweis: 'Kopfstehbolzen und Ansaugspinne in <strong>Stufen</strong> anziehen, '
               + '&uuml;ber Kreuz von innen nach au&szlig;en. Die Endwerte stehen in der Tabelle, '
               + 'die Zwischenstufen in der Spalte davor.',
        spalten: ['Verbindung', 'Drehmoment', 'Betriebsmittel'],
        breiten: ['auto', '190px', '210px'],
        zeilen: [
          ['<em>Short Block</em> &ndash; Hauptlagerdeckel obere Reihe (1&ndash;5)', '80 ft-lbs (108 Nm)', '30wt &Ouml;l'],
          ['<em>Short Block</em> &ndash; Hauptlagerdeckel untere Reihe (6&ndash;10)', '70 ft-lbs (95 Nm)', '30wt &Ouml;l + Thread Sealant'],
          ['<em>Short Block</em> &ndash; &Ouml;lkanalstopfen -4 AN', '8&ndash;10 ft-lbs (11&ndash;14 Nm)', 'Teflonband'],
          ['<em>Short Block</em> &ndash; Thrust Plate', '9&ndash;12 ft-lbs (12&ndash;16 Nm)', 'trocken'],
          ['<em>Steuertrieb</em> &ndash; Nockenwellenschraube (ARP 254-1001)', '25&ndash;30 ft-lbs (34&ndash;41 Nm)', 'ARP Ultra-Torque'],
          ['<em>Steuertrieb</em> &ndash; &Ouml;lpumpe an Block', '22&ndash;25 ft-lbs (30&ndash;34 Nm)', 'Motor&ouml;l'],
          ['<em>Steuertrieb</em> &ndash; Steuergeh&auml;usedeckel', '12&ndash;18 ft-lbs (16&ndash;24 Nm)', 'trocken'],
          ['<em>Steuertrieb</em> &ndash; Schwingungsd&auml;mpfer-Zentralschraube', '70&ndash;90 ft-lbs (95&ndash;122 Nm)', 'trocken'],
          ['<em>Zylinderk&ouml;pfe</em> &ndash; Stehbolzen ARP 154-4003 oben (1&ndash;5, blind)<br><span style="color:#718096;">3 Stufen: 35 &rarr; 55 &rarr; 80 ft-lbs</span>', '80 ft-lbs (108 Nm)', 'ARP Ultra-Torque'],
          ['<em>Zylinderk&ouml;pfe</em> &ndash; Stehbolzen ARP 154-4003 unten (6&ndash;10, Wassermantel)<br><span style="color:#718096;">3 Stufen: 35 &rarr; 55 &rarr; 70 ft-lbs</span>', '70 ft-lbs (95 Nm)', 'ARP Ultra-Torque + Thread Sealant'],
          ['<em>Ansaugtrakt</em> &ndash; Ansaugspinne (Fel-Pro 1250)<br><span style="color:#718096;">3 Stufen: 5 &rarr; 12 &rarr; 18 ft-lbs</span>', '18 ft-lbs (24 Nm)', 'Motor&ouml;l'],
          ['<em>Ansaugtrakt</em> &ndash; Z&uuml;ndkerzen (Alu-Kopf)', '15&ndash;22 ft-lbs (20&ndash;30 Nm)', 'Anti-Seize, nur Gewinde'],
          ['<em>Ansaugtrakt</em> &ndash; Wasserpumpe', '15&ndash;22 ft-lbs (20&ndash;30 Nm)', 'trocken'],
          ['<em>Ansaugtrakt</em> &ndash; &Ouml;lwanne', '10&ndash;12 ft-lbs (14&ndash;16 Nm)', 'trocken'],
          ['<em>Ansaugtrakt</em> &ndash; &Ouml;lablassschraube', '15&ndash;25 ft-lbs (20&ndash;34 Nm)', 'trocken'],
          ['<em>Ansaugtrakt</em> &ndash; Ventildeckel', '4&ndash;6 ft-lbs (5&ndash;8 Nm)', 'trocken'],
          ['<em>Ansaugtrakt</em> &ndash; Kraftstoffpumpe', '18&ndash;22 ft-lbs (24&ndash;30 Nm)', 'trocken'],
          ['<em>Antriebsstrang</em> &ndash; Druckplatte / Kupplung', '12&ndash;24 ft-lbs (16&ndash;33 Nm)', 'trocken'],
          ['<em>Antriebsstrang</em> &ndash; Schwungradschrauben', '75&ndash;85 ft-lbs (102&ndash;115 Nm)', 'trocken']
        ]
      },
      {
        id: 'ref-lubes',
        titel: '&#128167; Betriebsmittel &ndash; wo was hingeh&ouml;rt',
        hinweis: 'Die Gegenrichtung zur Tabelle oben: nicht "was braucht diese Schraube", '
               + 'sondern "wo kommt dieses Mittel hin". Praktisch beim Einkauf und beim '
               + 'Bereitlegen vor der Montage.',
        spalten: ['Betriebsmittel', 'Verwendung'],
        breiten: ['34%', 'auto'],
        zeilen: [
          ['<strong>ARP Ultra-Torque</strong>', 'Nockenwellenschraube, Kopfstehbolzen (beide Reihen)'],
          ['<strong>Thread Sealant</strong>', 'Hauptlagerdeckel untere Reihe und Kopfstehbolzen untere Reihe &ndash; beide reichen in den Wassermantel'],
          ['<strong>30wt &Ouml;l</strong>', 'Hauptlagerdeckel, beide Reihen'],
          ['<strong>Motor&ouml;l</strong>', '&Ouml;lpumpe an Block, Ansaugspinne'],
          ['<strong>Teflonband</strong>', '&Ouml;lkanalstopfen -4 AN'],
          ['<strong>Anti-Seize</strong>', 'Z&uuml;ndkerzen &ndash; nur aufs Gewinde, nicht auf den Dichtsitz'],
          ['<strong>trocken</strong>', 'alles &Uuml;brige: Thrust Plate, Steuergeh&auml;usedeckel, D&auml;mpfer, Wasserpumpe, &Ouml;lwanne, Ablassschraube, Ventildeckel, Kraftstoffpumpe, Kupplung, Schwungrad']
        ]
      },
      {
        id: 'ref-service',
        titel: '&#128738; &Ouml;l, Erststart &amp; Service',
        hinweis: 'Regel 5: kein Sollwert ohne Quelle. Was hier als <strong>offen</strong> '
               + 'steht, ist nicht vergessen, sondern noch nicht belegt &ndash; und wird '
               + 'nicht geraten.',
        spalten: ['Punkt', 'Stand'],
        breiten: ['42%', 'auto'],
        zeilen: [
          ['Vor&ouml;len vor Erststart', '<strong>Pflicht</strong> &ndash; Melling PT11, &Ouml;l muss an allen 16 Kipphebeln erscheinen, Kurbelwelle 4&times; 90&deg; mitdrehen'],
          ['Einfahr&ouml;l', '<strong>mit ZDDP</strong> &ndash; Flachst&ouml;ssel-Nockentrieb braucht den Zusatz'],
          ['&Ouml;lwanne', 'mindestens 7 qt Kapazit&auml;t, Schwallbleche f&uuml;r Road Race &ndash; <span style="color:#975a16;">&#9888; Wanne noch zu spezifizieren</span>'],
          ['Pickup-Abstand', '.250&quot;&ndash;.375&quot; vom Wannenboden'],
          ['&Ouml;lk&uuml;hler', 'nie einen gebrauchten wiederverwenden; Durchflussrichtung beachten'],
          ['&Ouml;lwechselintervall', '<span style="color:#975a16;">&#9888; noch nicht dokumentiert</span>'],
          ['Ventilspiel-Kontrolle', '<span style="color:#975a16;">&#9888; noch nicht dokumentiert</span>'],
          ['Z&uuml;ndkerzen-Wechselintervall', '<span style="color:#975a16;">&#9888; noch nicht dokumentiert</span>']
        ]
      }
    ]
  };

  global.REFERENCE = REFERENCE;

  /* ---- Overlay bauen. Erst beim ersten Oeffnen, nicht beim Laden: die
     Karte liegt sonst auf jeder Seite im DOM, ohne je gebraucht zu werden. */
  function baueOverlay() {
    if (document.getElementById('guide-reference')) return;

    var teile = [];
    teile.push('<div class="guide-overlay" id="guide-reference">');
    teile.push('<div class="glossary-search">');
    teile.push('  <div class="glossary-search-row">');
    teile.push('    <button class="guide-back" onclick="hideGuide(\'guide-reference\')">&larr;</button>');
    teile.push('    <input type="search" id="referenceSearch" placeholder="Wert oder Bauteil suchen..." oninput="filterReference()">');
    teile.push('    <span class="glossary-count" id="referenceCount"></span>');
    teile.push('  </div>');
    teile.push('</div>');
    teile.push('<div class="guide-content" id="referenceBody">');
    teile.push('  <div class="info-box" style="margin-bottom:0.8rem;"><strong>' + REFERENCE.titel
             + '.</strong> ' + REFERENCE.untertitel
             + '. Zum Ausdrucken bei ge&ouml;ffneter Karte <strong>Strg+P</strong>.</div>');

    REFERENCE.gruppen.forEach(function (g) {
      teile.push('<div class="ref-group" id="' + g.id + '">');
      teile.push('  <h3 class="ref-group-titel">' + g.titel + '</h3>');
      teile.push('  <div class="table-wrapper"><table class="data-table"><thead><tr>');
      g.spalten.forEach(function (sp, k) {
        var w = (g.breiten && g.breiten[k] && g.breiten[k] !== 'auto')
              ? ' style="width:' + g.breiten[k] + ';"' : '';
        teile.push('<th' + w + '>' + sp + '</th>');
      });
      teile.push('  </tr></thead><tbody>');
      g.zeilen.forEach(function (z) {
        teile.push('<tr class="ref-row">' + z.map(function (c, k) {
          // Die Drehmomentspalte ist die, die man sucht - hervorheben.
          var stark = (z.length === 3 && k === 1) ? ' style="font-weight:700;"' : '';
          return '<td' + stark + '>' + c + '</td>';
        }).join('') + '</tr>');
      });
      teile.push('  </tbody></table></div>');
      if (g.hinweis) teile.push('  <div class="info-box">' + g.hinweis + '</div>');
      teile.push('</div>');
    });

    teile.push('  <div class="ref-leer" id="referenceLeer" style="display:none;">Kein Treffer.</div>');
    teile.push('</div>');
    teile.push('</div>');

    var huelle = document.createElement('div');
    huelle.innerHTML = teile.join('\n');
    document.body.appendChild(huelle.firstChild);
  }

  function showReference() {
    baueOverlay();
    showGuide('guide-reference');
    var feld = document.getElementById('referenceSearch');
    if (feld) { feld.value = ''; filterReference(); }
  }

  /* ---- Filter ueber alle Zeilen, wie im Glossar. Eine Gruppe ohne Treffer
     verschwindet mit, sonst bleiben leere Ueberschriften stehen. */
  function filterReference() {
    var feld = document.getElementById('referenceSearch');
    var q = (feld ? feld.value : '').trim().toLowerCase();
    var treffer = 0;

    REFERENCE.gruppen.forEach(function (g) {
      var block = document.getElementById(g.id);
      if (!block) return;
      var sichtbar = 0;
      block.querySelectorAll('tr.ref-row').forEach(function (tr) {
        var passt = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
        tr.style.display = passt ? '' : 'none';
        if (passt) sichtbar++;
      });
      block.style.display = sichtbar ? '' : 'none';
      treffer += sichtbar;
    });

    var zaehler = document.getElementById('referenceCount');
    if (zaehler) zaehler.textContent = q ? (treffer + ' Treffer') : '';
    var leer = document.getElementById('referenceLeer');
    if (leer) leer.style.display = (q && !treffer) ? '' : 'none';
  }

  global.showReference = showReference;
  global.filterReference = filterReference;
})(typeof window !== 'undefined' ? window : globalThis);
