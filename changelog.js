/**
 * changelog.js - Release-Dokumentation.
 *
 * Erreichbar ueber die Versionsnummer im Werkzeugmenue und im Header.
 * Wird von index.html, specs.html und build-log.html geladen.
 *
 * Neuer Eintrag: oben einfuegen und version.js plus die Cache-Version in
 * sw.js hochzaehlen. tests/ui.test.mjs prueft, dass alle drei zusammenpassen.
 */
(function (global) {
  'use strict';

  // Neueste Version zuerst.
  var RELEASES = [
    {
      version: 'v33',
      date: '2026-09-20',
      title: 'Kapitel 22 macht endlich das, was sein Titel sagt',
      changes: [
        { type: 'neu', text: 'Leitprinzip Baseline konservieren: die vier Vergaser stammen vom alten 1968er 302, wurden in England professionell mit zwei Lambdasonden abgestimmt und liefen im Trackbetrieb einwandfrei. Seitdem nur gereinigt, keine Einstellaenderung. Die verbaute Bedueusung ist damit kein unbekannter Zustand, sondern ein Ergebnis - Kapitel 27 erfasst und reinigt sie, ohne sie zu veraendern.' },
        { type: 'neu', text: 'STOPP-Punkte im Kapitel: keine Einstellschraube verdrehen, keine Duese zwischen Laeufen vertauschen, keine Reibahle in eine kalibrierte Bohrung, Schwimmerstand nicht auf einen Sollwert biegen, Reglerdruck nicht auf einen Tabellenwert umstellen.' },
        { type: 'neu', text: 'Diagnosebaum in Kapitel 22: Befund, was zuerst zu pruefen ist und was man gerade nicht tun soll. Schlechter Leerlauf ist kein Hauptduesen-Problem, und aus einem einzelnen Lambda-Punkt folgt keine neue Gesamtbedueusung.' },
        { type: 'fix', text: 'Die externen Zahlenreihen sind als reine Referenz gekennzeichnet. Das Integrationsreview verwirft seine eigenen Werte ausdruecklich als nicht validiert - das steht jetzt dabei. Massgeblich ist die verbaute Ist-Bestueckung.' },
        { type: 'fix', text: 'Kapitel 22 hiess "Synchronize DellOrto, Log Lambda" und enthielt ausschliesslich Vergaser-Montage. Die Montage steht jetzt in Phase 3 als Kapitel 28 - also vor dem Start, wo sie hingehoert, statt zehn Schritte danach.' },
        { type: 'neu', text: 'Falschluft-Test als Anleitung: Propan-Methode am laufenden Motor, Pruefpunkte je Vergaser (Fussdichtung, beide Wellenenden) und die Ansaugbruecke zum Kopf. Ausdruecklich nicht mit Bremsenreiniger - das liefert Fehlanzeigen, greift die Dichtungen an und spruekt brennbare Fluessigkeit auf einen heissen Motor mit offenen Trichtern.' },
        { type: 'neu', text: 'Kapitel 22 ist neu aufgebaut: Synchronisation in zwei Ebenen (erst die beiden Drosselklappen innerhalb eines Vergasers, dann die Vergaser untereinander), Gemischschrauben, Lambda-Logging und die Reihenfolge des Abstimmens.' },
        { type: 'neu', text: 'Bedueusungs-Entscheidungstabelle: Ist, Soll und Begruendung je Duesenart, dazu eine Spalte, wofuer die jeweilige Duese ueberhaupt zustaendig ist. Wer die falsche Duese anfasst, verstellt den falschen Betriebsbereich.' },
        { type: 'neu', text: 'Bezugsgroessen, von denen die Bedueusung abhaengt: Verdichtung, Nockenprofil, Auspuff, Zuendung, Kraftstoff, Hoehenlage - mit der jeweiligen Wirkungsrichtung. Eine Bedueusung gilt nicht fuer "einen 302", sondern fuer diesen Motor in dieser Konfiguration.' },
        { type: 'neu', text: 'Phase 3, Kapitel 27: Vergaser zerlegen, reinigen und die verbaute Bedueusung je Vergaser erfassen - inklusive Hauptventuri, die in der bisherigen Dokumentation komplett fehlte, obwohl die Hauptduese von ihr abhaengt.' },
        { type: 'neu', text: 'Plausibilitaetsrechnung: Faustformeln aus einem Dellorto-Leitfaden leiten Venturi, Hauptduese und Luftkorrektur aus Hubraum und Barrelgroesse her, statt Zahlen zu behaupten. Fuer den 302 mit 619 cm3 je Zylinder ergibt das 36 mm Venturi, Hauptduese 144, Luftkorrektur 194 - und zeigt, dass beide kursierenden Vorschlaege bei der Leerlaufduese am unteren Rand liegen. Die Herkunft der Formeln (DHLA statt DRLA) ist als Einschraenkung vermerkt.' },
        { type: 'neu', text: 'Die beiden kursierenden Duesenvorschlaege stehen nebeneinander und sind als unbelegt gekennzeichnet. Die Messung beim Zerlegen entscheidet, welches Dokument diesen Motor ueberhaupt beschreibt.' },
        { type: 'fix', text: 'Zwei Lambdasonden liefern Bank-Mittelwerte, keine Einzelzylinderwerte - ein fetter und ein magerer Zylinder derselben Bank heben sich auf. Das steht jetzt im Kapitel, statt stillschweigend angenommen zu werden.' },
        { type: 'fix', text: 'Die Stilregeln fuer Tabellen in den Kapitel-Anleitungen fehlten in build-log.html und standen nur in einer verwaisten Datei. Vier bereits vorhandene Tabellen wurden dadurch ohne Rahmen und Kopfzeile dargestellt.' }
      ]
    },
    {
      version: 'v32',
      date: '2026-09-20',
      title: 'Kraftstoffsystem: echter Aufbau statt mechanischer Pumpe',
      changes: [
        { type: 'fix', text: 'Kapitel 6 "Kraftstoffsystem pruefen" beschrieb durchgehend eine mechanische Pumpe, inklusive Handhebel - den es an diesem Auto nicht gibt. Die Karte bildet jetzt den tatsaechlichen Aufbau ab: zwei elektrische Facet-Pumpen, je Tank eine, mit eigenem Schalter, eigenem Vorfilter, eigenem Filter King und eigener Cockpit-Anzeige.' },
        { type: 'fix', text: 'Der dort geforderte Druck von 5.5-7.0 psi stammte vom nicht verbauten Holley-Alternativvergaser. Sollwert ist jetzt 3.0 psi, Maximum 3.5 psi.' },
        { type: 'neu', text: 'Tankbilanz-Test als Pruefschritt: der Filter King ist ein Bypass-Regler, es laeuft weit mehr Kraftstoff in den Ruecklauf zurueck als der Motor verbraucht. Fuehrt der gemeinsame Ruecklauf in den anderen Tank, wandert der Inhalt beim Fahren auf einer Pumpe hinueber. Messfelder fuer beide Pumpen und beide Tanks.' },
        { type: 'neu', text: 'Pruefschritt, dass beide Regler auf denselben Druck stehen. Weichen sie ab, ist der hoeher eingestellte fuehrend und der andere Kreis foerdert nichts zu den Vergasern.' },
        { type: 'fix', text: 'Zylinderzuordnung der DellOrto war falsch: ein Vergaser versorgt zwei Zylinder, eine Drosselklappe genau einen. Es stand "jeder Vergaser versorgt 4 Zylinder" (deutsch) bzw. "each barrel feeds 4 cylinders" (englisch).' },
        { type: 'fix', text: 'Specs nannten den Vergaser einmal DHLA statt DRLA und gaben die Facet-Pumpe mit 7.5 psi an - belegt sind 6-8 psi.' }
      ]
    },
    {
      version: 'v31',
      date: '2026-09-20',
      title: 'Bildnamen, Doubletten, Feld-Leeren',
      changes: [
        { type: 'fix', text: 'Ein geleertes Messwert-Feld kam zurueck, sobald es im Build Log noch einen Wert gab: die Uebernahme von dort hat es wieder nachgefuellt. Sie greift jetzt nur noch bei Feldern, die nie gesetzt waren.' },
        { type: 'neu', text: 'Galerie-Bilder tragen ihren Originalnamen statt einer Nummerierung. Der Name steht auch im Dateinamen im Repository.' },
        { type: 'neu', text: 'Doubletten werden ueber die Pruefsumme der Bilddaten erkannt. Dasselbe Foto in einer zweiten Galerie wird verknuepft statt ein zweites Mal abgelegt.' },
        { type: 'neu', text: 'Ein Bild, auf das noch verwiesen wird, laesst sich nicht loeschen - sonst fehlt es in der anderen Galerie.' },
        { type: 'fix', text: 'Pull-to-Refresh loest bei offener Galerie nicht mehr aus, und ein Update laedt die Seite nicht mehr mitten in der Arbeit neu.' },
        { type: 'fix', text: 'Englische Uebersetzung der Praxis-Tipps-Ueberschrift im Build Log ergaenzt.' }
      ]
    },
    {
      version: 'v30',
      date: '2026-09-20',
      title: 'Kapitelstatus und Befunde im Build Log',
      changes: [
        { type: 'neu', text: 'Kapitel haben drei Stufen statt an/aus: offen, in Arbeit, erledigt. Der Knopf im Kapitelkopf schaltet bei jedem Klick weiter.' },
        { type: 'neu', text: 'Befunde: beliebig viele pro Kapitel, jeder mit eigenem Status. Ein- und ausklappbar, das Abzeichen zeigt die Zaehlung auch im eingeklappten Zustand.' },
        { type: 'neu', text: 'Uebersicht aller offenen Befunde ueber alle Phasen hinweg, mit Sprung zum jeweiligen Kapitel.' },
        { type: 'fix', text: 'Der Fortschrittsbalken zaehlt "in Arbeit" halb - sonst steht er tagelang still, obwohl gearbeitet wird.' },
        { type: 'fix', text: 'Alte Notizzeilen werden einmalig in die Befundliste uebernommen.' },
        { type: 'fix', text: 'Die Foto-Galerie in index.html war toter Code ohne Container, Lightbox oder Aufrufer und wurde entfernt.' }
      ]
    },
    {
      version: 'v29',
      date: '2026-09-20',
      title: 'Build Log benutzt dieselbe Galerie wie Specs',
      changes: [
        { type: 'fix', text: 'Fotos im Build Log lagen als Base64 nur im Browser des aufnehmenden Geraets und waren nirgends sonst sichtbar. Sie liegen jetzt im Repository.' },
        { type: 'neu', text: 'Bis zu vier Vorschaubilder je Abschnitt, der Rest hinter einem "+N". Ein Klick oeffnet die volle Galerie.' },
        { type: 'neu', text: 'Damit auch dort: Mehrfach-Upload, EXIF-Datum, Beschreibung, Hauptbild, Reihenfolge, Zeichnen, YouTube.' },
        { type: 'neu', text: 'Vorhandene Fotos aus dem alten Format werden gemeldet und lassen sich auf Knopfdruck uebertragen.' },
        { type: 'intern', text: 'Galerie-Motor in gallery.js und gallery.css herausgeloest, gemeinsam genutzt von beiden Seiten.' }
      ]
    },
    {
      version: 'v28',
      date: '2026-09-20',
      title: 'Versionsanzeige, Sync-Datum, Bildbeschriftung',
      changes: [
        { type: 'neu', text: 'Versionsnummer unter dem Titel und im Menue - und diese Release-Dokumentation dahinter.' },
        { type: 'fix', text: 'Das Sync-Datum in der Kopfzeile blieb beim Speichern von Fotos stehen. Es beruecksichtigt jetzt beides und nennt, was zuletzt gespeichert wurde.' },
        { type: 'neu', text: 'Galerie-Karten zeigen wieder Name und Aufnahmedatum.' },
        { type: 'fix', text: 'Die Datumszeile wurde von der Kartenhoehe abgeschnitten, obwohl sie im DOM stand.' },
        { type: 'fix', text: 'Menuepunkt "Galerie neu laden" entfernt - Cloud Sync laedt die Galerie ohnehin mit.' }
      ]
    },
    {
      version: 'v27',
      date: '2026-09-20',
      title: 'Messwert-Felder lassen sich leeren',
      changes: [
        { type: 'fix', text: 'Ein Messwert-Feld zu leeren wurde nicht gespeichert: "leer gewinnt nie" galt beim Speichern und beim Zusammenfuehren. Jedes Feld hat jetzt einen eigenen Zeitstempel, der juengere Stand gewinnt - auch ein leerer.' },
        { type: 'fix', text: 'Checkboxen liessen sich aus demselben Grund nicht abwaehlen.' },
        { type: 'fix', text: 'initUnifiedSearch() wurde aufgerufen, bevor search.js geladen war. Die Exception hat den Rest der Initialisierung mit abgeraeumt.' },
        { type: 'intern', text: 'Automatische Tests bei jedem Push (GitHub Actions), dazu ein Smoke-Test gegen die Live-Seite.' }
      ]
    },
    {
      version: 'v26',
      date: '2026-09-20',
      title: 'Galerie: das Repository ist die Wahrheit',
      changes: [
        { type: 'fix', text: 'Fotos erschienen nur auf dem Geraet, das sie hochgeladen hat. Der Foto-Index wurde bei jedem Tastendruck mit dem lokalen Stand ueberschrieben - ein Geraet mit leerer Galerie hat damit die Cloud geleert.' },
        { type: 'fix', text: 'Welche Bilder existieren, kommt jetzt aus dem Repository und braucht keinen Token. Der Gist traegt nur noch Beschreibung, Zeit, Reihenfolge und Hauptbild.' },
        { type: 'fix', text: 'Zusammengefuehrt wird pro Eintrag statt pro Liste - parallele Aenderungen auf zwei Geraeten verlieren nichts mehr.' },
        { type: 'fix', text: 'Ein Fehler beim Anwenden der Messwerte hat den gesamten Sync lautlos abgebrochen, wodurch die Fotos nie geladen wurden.' }
      ]
    }
  ];

  var TYPE_LABEL = { neu: 'Neu', fix: 'Behoben', intern: 'Intern' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function ensureChrome() {
    if (document.getElementById('changelogOverlay')) return;
    var ov = document.createElement('div');
    ov.className = 'changelog-overlay';
    ov.id = 'changelogOverlay';
    ov.innerHTML =
        '<div class="cl-panel" role="dialog" aria-label="Release-Dokumentation">'
      + '<div class="cl-head">'
      + '<h3>Release-Dokumentation</h3>'
      + '<button type="button" class="cl-close" onclick="closeChangelog()" aria-label="Schliessen">&times;</button>'
      + '</div><div class="cl-body" id="changelogBody"></div></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) closeChangelog(); });
    document.body.appendChild(ov);
  }

  function render() {
    var current = (typeof APP_VERSION === 'string') ? APP_VERSION : '';
    document.getElementById('changelogBody').innerHTML = RELEASES.map(function (r) {
      var istAktuell = r.version === current;
      return '<section class="cl-rel' + (istAktuell ? ' current' : '') + '">'
        + '<h4><span class="cl-ver">' + esc(r.version) + '</span>'
        + (istAktuell ? '<span class="cl-badge">aktuell</span>' : '')
        + '<span class="cl-date">' + esc(r.date) + '</span></h4>'
        + '<p class="cl-title">' + esc(r.title) + '</p>'
        + '<ul>' + r.changes.map(function (c) {
            return '<li><span class="cl-type ' + esc(c.type) + '">'
                 + esc(TYPE_LABEL[c.type] || c.type) + '</span>' + esc(c.text) + '</li>';
          }).join('') + '</ul></section>';
    }).join('');
  }

  function openChangelog() {
    ensureChrome();
    render();
    document.getElementById('changelogOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeChangelog() {
    var ov = document.getElementById('changelogOverlay');
    if (ov) ov.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var ov = document.getElementById('changelogOverlay');
    if (ov && ov.classList.contains('show')) closeChangelog();
  });

  global.RELEASES = RELEASES;
  global.openChangelog = openChangelog;
  global.closeChangelog = closeChangelog;
})(typeof window !== 'undefined' ? window : globalThis);
