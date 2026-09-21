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
      version: 'v43',
      date: '2026-09-21',
      title: 'Ethanol: die Zahl kommt zurueck, diesmal mit Herleitung',
      changes: [
        { type: 'neu', text: 'Der Ethanol-Exkurs hat einen neuen Abschnitt "Wie viel genau". Er rechnet die Mehrmenge her, statt sie zu behaupten: Benzin braucht stoechiometrisch rund 14,7 Teile Luft je Teil Kraftstoff, Ethanol nur rund 9,0, weil es Sauerstoff im Molekuel traegt. Ueber die Massenanteile gemischt ergibt E10 rund 14,1 : 1 - das sind rund 4 % mehr Kraftstoff bei gleicher Luftmenge.' },
        { type: 'neu', text: 'Wichtiger als die 4 % ist ihre Einordnung: sie liegen unterhalb eines Duesenschritts. Der Durchfluss einer Duese geht naeherungsweise mit dem Quadrat des Durchmessers, 4 % mehr Durchfluss heisst also nur rund 2 % mehr Durchmesser - von Hauptduese 135 aus rechnerisch eine 138. Die naechste lieferbare Groesse ist 140, und der Schritt 135 auf 140 bringt bereits rund 7,5 %. Wer beim Wechsel auf E10 reflexhaft eine Duese groesser geht, ueberfettet den Motor staerker, als Ethanol ihn abmagert.' },
        { type: 'fix', text: 'Die Zeile im Abstimmungsblatt fuehrt jetzt wieder eine Groessenordnung, aber mit der richtigen Bezugsgroesse und mit der Handlungsanweisung dahinter: nicht umduesen, sondern am Lambda entscheiden. Die in v42 gestrichene Angabe war nicht falsch berechnet, sondern falsch bezogen - gemeint war die Gesamtdifferenz bei E10, nicht ein Wert je Prozentpunkt.' },
        { type: 'fix', text: 'Zwei Gegenproben zum neuen Test blieben zunaechst gruen und haben ihn entlarvt: eine Suche nach "14,7" fand den Wert noch in der Tabelle darueber, obwohl die Rechnung entfernt war, und die Duesenschritt-Pruefung wurde vom englischen Text getragen, obwohl der deutsche fehlte. Beides ist derselbe Fehler wie bei der dial-back-Pruefung in v42. Der Test prueft jetzt die Rechenzeile woertlich und beide Sprachfassungen getrennt.' }
      ]
    },
    {
      version: 'v42',
      date: '2026-09-21',
      title: 'Anschlagbuechsen aus der MSD-Primaerquelle, Digital 6AL bestimmt',
      changes: [
        { type: 'fix', text: 'Die Farb-/Gradzuordnung der Anschlagbuechsen ist geklaert. Das MSD-Beiblatt zum Centrifugal Advance Kit PN 8464 fuehrt sechs Buechsen: Rot 28 Grad (ausdruecklich als "smallest" bezeichnet), Silber 25, Gruen 23, Blau 21, Lila 19, Schwarz 18. Beide bisherigen Projekttabellen waren falsch - einen Gold-Wert gibt es in der MSD-Reihe nicht, und die frueheren 15 und 11 Grad ebenso wenig.' },
        { type: 'fix', text: 'Die Wirkrichtung steht jetzt ausgeschrieben da: die kleinste Buechse gibt die groesste Verstellung, weil sie den Fliehgewichten am meisten Weg laesst. Wer das umgekehrt annimmt, verstellt die Kurve in die falsche Richtung und glaubt, er haette zurueckgenommen.' },
        { type: 'fix', text: 'Die Federtabelle nannte "heavy/medium/light". MSD liefert drei benannte Typen - Heavy Silver (haerteste, Werksbestueckung), Light Blue und Light Silver (weichste) - und bildet daraus sechs Kombinationen A bis F. Die Federn bestimmen, wann die Verstellung kommt, die Buechse wie viel: zwei unabhaengige Stellschrauben, nie beide gleichzeitig aendern.' },
        { type: 'neu', text: 'Zwei Vorgaben aus dem MSD-Beiblatt zur Digital 6A/6AL, die im Projekt fehlten und beide die Messung betreffen: kein digitales und kein Rueckstell-Stroboskop (dial-back), weil die CD-Box unterhalb etwa 3000 rpm mehrfach feuert und eine zaehlende Lampe einen falschen Winkel zeigt - damit waeren alle Ist-Werte unbrauchbar. Und: der Einbau der Digital-Box verschiebt den Zuendzeitpunkt, er ist danach neu einzustellen.' },
        { type: 'neu', text: 'Die Zuendbox ist bestimmt: zwei Drehschalter am Gehaeuse schliessen die analoge 6AL (Steckmodule) und die 6AL-2 (vier Drehschalter) aus - es ist eine Digital 6AL. Linker Schalter Tausender, rechter Hunderter. Die Zylinderzahl wird ueber Kabelschlaufen gewaehlt: acht Zylinder heisst keine Schlaufe geschnitten, und eine geschnittene Schlaufe laesst sich nicht rueckgaengig machen.' },
        { type: 'fix', text: 'Das Advance Kit 8464 ist richtig eingeordnet: es ist derselbe Satz aus sechs Buechsen und sechs Federn, der dem Verteiler ohnehin beiliegt. Es erweitert den Einstellbereich nicht - es ersetzt fehlende Teile und bringt das gedruckte Beiblatt mit.' },
        { type: 'fix', text: 'Zwei verbliebene Sollwerte entfernt: "12 Grad Initial + 22 Grad Centrifugal = 34 Grad Total" unter der Buechsentabelle und der Platzhalter "34-36" im Abstimmungsblatt. Solange die Kurve fuer AFR 165 / XE274HR / 98-100 ROZ nicht festgelegt ist, steht dort keine Gradzahl.' },
        { type: 'fix', text: 'Der Ethanol-Exkurs behauptete "grob 3 % mehr je Prozent Ethanolanteil", und derselbe Satz war ins Build-Log gewandert. Das ist rechnerisch um etwa den Faktor zehn daneben - hochgerechnet auf E10 waere es eine absurd hohe Mehrmenge. Beide Stellen fuehren jetzt nur noch das Prinzip: E5 und E10 unterscheiden sich im erforderlichen Kraftstoff/Luft-Verhaeltnis, und bei Vergaserbetrieb kann das eine Kalibrierungsaenderung erfordern.' },
        { type: 'neu', text: 'tests/zuendung.test.mjs auf 27 Pruefungen, tests/altlasten.test.mjs auf 16. Neu darunter: alle sechs Buechsenwerte muessen in Guide und Build-Log uebereinstimmen, die Wirkrichtung muss ausgeschrieben sein, und die deutsche dial-back-Warnung wird namentlich geprueft - eine Suche nur nach "dial-back" waere auch dann gruen geblieben, wenn nur noch der englische Text dasteht.' }
      ]
    },
    {
      version: 'v41',
      date: '2026-09-21',
      title: 'Zuendung: MSD 8479 mit Unterdruckdose, 6AL nur Drehzahlbegrenzer',
      changes: [
        { type: 'fix', text: 'Gestrichen: "MSD-Verteiler haben keine Unterdruckverstellung" und "die gesamte Verstellung laeuft elektronisch ueber die MSD 6AL Box". Beides war falsch. Der verbaute MSD 8479 hat eine Unterdruckdose, und die Verstellung sitzt im Verteiler: Grundzuendung plus Fliehkraftverstellung ueber Federn und Anschlagbuechse plus Unterdruckdose. Die 6AL setzt ausschliesslich den Drehzahlbegrenzer. Wer der alten Aussage folgte, suchte die Zuendkurve an der falschen Komponente.' },
        { type: 'neu', text: 'Neuer Block "Ist-Aufnahme vor dem Einbau" im Verteiler-Kapitel: Teilenummer, Antriebszahnrad, Anschlagbuechse, beide Federn, Unterdruckdose vorhanden oder gesperrt. Ausdruecklich mit dem Hinweis, die vorhandene Feder- und Buechsenkombination zunaechst nicht zu veraendern - dieselbe Logik wie bei den Vergasern: erst aufnehmen, was verbaut ist.' },
        { type: 'fix', text: '"Total Timing" ist jetzt eindeutig definiert. Gemeint ist immer das Total Mechanical Timing, gemessen mit abgezogenem und verschlossenem Unterdruckschlauch. Der Unterdruckanteil kommt bei Teillast obendrauf und zaehlt nicht dazu - genau hier entsteht die haeufigste Verwechslung.' },
        { type: 'neu', text: 'Zwei Ist-Datenbloecke im Kapitel Zuendzeitpunkt: einer fuer die mechanische Kurve (Grundzuendung, Anschlagbuechse, mechanischer Vorlauf, beide Federn, Beginn und Ende der Verstellung in rpm, Total Mechanical Timing), einer fuer die Unterdruckverstellung (Anschlussart, Beginn und Ende in inHg, maximale Zusatzverstellung, Status). Bewusst ohne Sollwerte: die endgueltige Kurve fuer AFR 165, XE274HR und 98-100 ROZ wird separat festgelegt.' },
        { type: 'fix', text: 'Die generische Angabe "Vacuum Advance bringt 8-12 Grad bei Teillast" stand da, als waere es unser Wert. Das ist ein Marktumfang ueber verschiedene Dosen hinweg. Gemessen wird am Fahrzeug.' },
        { type: 'fix', text: 'Die Farb-/Gradzuordnung der MSD-Anschlagbuechsen war im Projekt dreimal unterschiedlich dokumentiert, und die externen Quellen beschreiben die Wirkrichtung zusaetzlich umgekehrt. Keine der Zuordnungen ist belegt. Der Zuendungs-Guide fuehrt die Widersprueche jetzt offen auf und verweist auf das dem Verteiler beiliegende MSD-Datenblatt als einzige verbindliche Quelle.' },
        { type: 'fix', text: 'Aus dem Zuendungs-Guide entfernt: die Bloecke "Empfehlung START" und "Empfehlung NACH EINFAHREN" mit konkreten Gradzahlen. Sie beruhten auf der ungeklaerten Buechsenzuordnung und widersprachen sich selbst - 37 Grad Total gegen eine Obergrenze von 36 Grad im selben Dokument. An ihre Stelle tritt die Reihenfolge: Ist-Zustand dokumentieren, messen, eintragen, dann erst die Sollkurve festlegen.' },
        { type: 'fix', text: 'Der Ported-Vacuum-Abgriff an der Vierfach-DRLA-Anlage galt als geklaert. Er ist es nicht. Welcher Anschluss tatsaechlich Ported Vacuum fuehrt, ist noch zu verifizieren - im Leerlauf darf dort kein nennenswerter Unterdruck anliegen. Die Checkliste in den Specs steht entsprechend auf teilweise erledigt statt auf erledigt.' },
        { type: 'fix', text: 'Die Specs fuehrten die Zuendbox als "PN 6420" und beschrieben zugleich Drehschalter - das sind zwei verschiedene Geraete. Die analoge 6AL (6420) wird ueber Steckmodule eingestellt, die Digital 6AL (6425) ueber zwei Drehschalter in 100-rpm-Schritten. Welche verbaut ist, wird am Gehaeuse abgelesen. Das Kapitel Drehzahlbegrenzer beschreibt jetzt beide Wege.' },
        { type: 'fix', text: 'Gestrichen: "MSD 6AL hat auch 2-Step Launch Control". Zwei Drehzahlstufen bietet erst die 6AL-2 (6421) beziehungsweise die 7er-Serie.' },
        { type: 'neu', text: 'Neue Testreihe tests/zuendung.test.mjs mit 18 Pruefungen: die widerlegten Saetze duerfen auf keiner Seite mehr stehen - auch nicht in den verwaisten Phasendateien, die per URL weiterhin erreichbar sind -, die Begriffsdefinition muss in Build-Log und Guide identisch sein, und jedes neue Ist-Feld muss ein echtes Eingabefeld sein. Ein contenteditable-Feld saehe bedienbar aus und wuerde nie gespeichert.' }
      ]
    },
    {
      version: 'v40',
      date: '2026-09-21',
      title: 'Altlasten aus einem frueheren Fahrzeugstand',
      changes: [
        { type: 'fix', text: 'Troubleshooting ging von zwei Vergasern aus: "jeder Vergaser versorgt 4 Zylinder" und "beide Vergaser muessen identischen Luftdurchsatz liefern". Es sind vier DRLA mit acht Laeufen, ein Lauf je Zylinder. Synchronisiert wird in zwei Ebenen.' },
        { type: 'fix', text: 'Die Anweisung "mechanische Benzinpumpe von Hand betaetigen" beim Erststart ist ersetzt: zwei elektrische Facet-Pumpen, je Tank eine, Ticken wird langsamer wenn die Schwimmerkammern voll sind. Der Druckwert 3-5 psi ist auf die DRLA-Obergrenze 3.5 psi korrigiert.' },
        { type: 'fix', text: 'Der Nockenwellen-Abschnitt beschrieb Lobe Wipe an einem Flat Tappet samt ZDDP-Einlaufoel und 20 Minuten bei 2000-2500 rpm. Dieser Motor hat einen Hydraulic Roller. Ein Roller faellt am Nadellager der Laufrolle aus, nicht durch abgeriebene Nocken - und er braucht kein Flat-Tappet-Einlaufverfahren. Auch die Oelempfehlung mit ZDDP-Zusatz ist korrigiert.' },
        { type: 'fix', text: 'Gestrichen: "Leerlaufkanal mit duennem Draht reinigen". Draht in einer kalibrierten Bohrung veraendert den Querschnitt unwiederbringlich. Jetzt Vergaserreiniger und Druckluft.' },
        { type: 'fix', text: 'Der Schwimmerstand 5.5-6 mm stand in zwei Dokumenten als fester Sollwert. Er traegt keine Primaerquelle, und die verbaute Einstellung stammt aus einer funktionierenden Abstimmung. Jetzt: Ist-Mass dokumentieren, nicht biegen.' },
        { type: 'fix', text: 'Die Nadelventilgroesse 200 galt als "typisch fuer 302 mit 4x DRLA 45". Welche verbaut ist, weiss niemand - sie bestimmt den vertraeglichen Kraftstoffdruck mit und wird beim Zerlegen abgelesen.' },
        { type: 'fix', text: 'Das pauschale E10-Verbot in den Specs widersprach der eigenen Ethanol-Unterseite. Jetzt derselbe Stand: der Mechanismus laeuft ueber die Standzeit, nicht ueber die Kilometer.' },
        { type: 'fix', text: 'Die Facet-Teilenummer 480532 ist als noch zu bestaetigen gekennzeichnet - sie wurde nie am Bauteil abgelesen. Und "2x Facet = 120 l/h total" widersprach dem eigenen Exkurs: eine Pumpe foerdert bereits rund 170 l/h, die Randbedingung ist der Druck, nicht die Menge.' }
      ]
    },
    {
      version: 'v39',
      date: '2026-09-21',
      title: 'Produktfotos fuer die neuen Komponenten',
      changes: [
        { type: 'neu', text: 'Produktfotos fuer Facet Red Top 480532, Malpassi Filter King, Sytec Bullet und DellOrto DRLA 45 - auf der Komponentenseite und als Titelbild bei Vergaser und Kraftstoffpumpe in den Specs. Damit sind diese Baugruppen so bebildert wie Koepfe, Stoessel, Nocke und Wanne es laengst waren.' },
        { type: 'fix', text: 'Ein Test hatte eingebundene Fremdbilder pauschal verboten. Das widersprach der Praxis dieses Projekts, in dem bereits dreizehn Herstellerfotos liegen. Er prueft jetzt das, worauf es ankommt: das Bild liegt lokal unter img/ statt von der Haendlerseite hotverlinkt zu sein - ein Hotlink bricht, sobald der Haendler es verschiebt.' },
        { type: 'neu', text: 'Neue Pruefung: die Bilder muessen im Browser tatsaechlich laden, nicht nur als Datei existieren. Ein falscher Pfad oder ein kaputtes JPEG faellt sonst erst dem Benutzer auf.' }
      ]
    },
    {
      version: 'v38',
      date: '2026-09-21',
      title: 'Komponenten-Referenz mit Herstellerquellen',
      changes: [
        { type: 'neu', text: 'Neue Seite docs/komponenten.html: jede verbaute Komponente mit Hersteller, Teilenummer, belegten Eckdaten und Link zur Originalquelle. Jede Zahl traegt einen Quellenvermerk - Hersteller, Haendler oder offen. Verlinkt aus Specs, Build Log und Uebersicht.' },
        { type: 'neu', text: 'Facet: Hersteller ist Motor Components LLC. Die Kataloge stehen dort. Malpassi Filter King direkt beim Hersteller verlinkt, DellOrto DRLA ueber Fachhaendler mit Explosionszeichnung und Kalibrierteilen - eine Werksseite von DellOrto mit DRLA-Unterlagen war nicht auffindbar, deshalb der Vermerk Sekundaerquelle an allen Grenzwerten.' },
        { type: 'neu', text: 'Fund zum Vorfilter: das serienmaessige 8-Mikrometer-Papierelement gilt laut Haendlerangabe bis etwa 350 PS, darueber ist ein 55-Mikrometer-Metallelement vorgesehen. Welches verbaut ist, gehoert beim ersten Oeffnen festgehalten - ein zu feines Element zeigt sich als Druckabfall unter Last, nicht im Leerlauf.' },
        { type: 'intern', text: 'Produktfotos und Datenblaetter werden verlinkt, nicht ins Repository kopiert: es ist oeffentlich, und das waere eine Veroeffentlichung fremder Inhalte. Ein Test wacht darueber, dass keine Fremdbilder eingebunden und keine fremden PDF-Datenblaetter abgelegt werden.' }
      ]
    },
    {
      version: 'v37',
      date: '2026-09-20',
      title: 'Phase 5: Abstimmung gehoert an die Strecke',
      changes: [
        { type: 'neu', text: 'Neue Phase 5 "Abstimmung & Feuertaufe". Phase 4 endet jetzt dort, wo der Motor nachweislich gesund ist. Abstimmen ist etwas anderes: iterativ, ueber Wochen, und zum groessten Teil nicht in der Werkstatt moeglich.' },
        { type: 'neu', text: 'Drei Unterphasen nach Arbeitsumgebung: 5a Werkstatt nur fuer Grundeinstellungen, 5b Strasse fuer Teillast, 5c Rennstrecke fuer Volllast. Der Hauptduesenkreis braucht weit geoeffnete Drosselklappe ueber mehrere Sekunden - das geht auf einer abgesperrten Strecke oder freien Autobahn, sonst nirgends.' },
        { type: 'neu', text: 'Die alte 35-KB-Karte von Kapitel 22 ist in acht Kapitel aufgeteilt: Falschluft-Test, Synchronisation, Lambda-Hardware, Bedueusungsentscheidung, Teillast auf der Strasse, Schraubverbindungen, Trackday, Oelwechsel danach.' },
        { type: 'neu', text: 'Neues Kapitel Schraubverbindungen als Sicherheitstor vor der Strecke - am kalten Motor, mit dem Hinweis auf das Losbrechmoment: ein Drehmomentschluessel auf einer bereits angezogenen Schraube klickt, bevor sich etwas bewegt, und eine lockere Verbindung liest sich als fest.' },
        { type: 'neu', text: 'Trackday Pannoniaring als erste Feuertaufe: erste Runden nur Systembeobachtung, Boxenstopp mit Tankbilanz, und erst danach ein kurzer Volllastzug - ausgewertet, bevor der naechste gefahren wird. Danach Oelwechsel mit Filterkontrolle und ein zweiter Schraubdurchgang.' },
        { type: 'fix', text: 'migrateData war definiert, wurde nie aufgerufen und griff dabei auf eine Variable zu, die es in dieser Datei gar nicht gab. Beim ersten Aufruf haette das geworfen - und ein Fehler beim Anwenden der Daten bricht den ganzen Sync ab, genau wie in v26. Die Tabelle ist jetzt definiert, die Funktion verdrahtet, und ein Test prueft, dass ein alter p4-Wert im neuen p5-Feld ankommt.' }
      ]
    },
    {
      version: 'v36',
      date: '2026-09-20',
      title: 'CI war 40 Minuten lang blind',
      changes: [
        { type: 'fix', text: 'Ein Schrittname im Workflow enthielt einen ungequoteten Doppelpunkt mit Leerzeichen. Das zerlegt das YAML, und der Workflow scheiterte beim Parsen - vor jedem Job. Seit v33 lief damit kein einziger Test mehr, auch nicht auf main.' },
        { type: 'fix', text: 'Der Fehler blieb unbemerkt, weil ein beim Parsen gescheiterter Lauf gar keine Check-Runs erzeugt. Eine leere Liste sieht aus wie \'noch nicht gestartet\'.' },
        { type: 'neu', text: 'tests/workflow.test.mjs prueft jetzt den Workflow selbst: keine ungequoteten Doppelpunkte in Werten, einheitliche Einrueckung der Schritte, jede Testdatei ist verdrahtet, und keine verdrahtete Datei fehlt. Laeuft als erster Schritt und braucht keinen Browser.' }
      ]
    },
    {
      version: 'v35',
      date: '2026-09-20',
      title: 'Tuning Guide: Quellenlage statt Behauptung',
      changes: [
        { type: 'fix', text: 'Abschnitt 9 hiess "Empfohlene Bedueusung als Startpunkt" und stand damit gegen das Baseline-Prinzip. Er heisst jetzt "Externe Bedueusungstabelle - nur Referenz" und sagt vorweg, dass die verbaute Bestueckung der Startpunkt ist, weil sie auf dem alten 302 funktioniert hat.' },
        { type: 'fix', text: 'Die AFR-Zielwerte fuer Leerlauf und Volllast sind als unbelegt gekennzeichnet. Beim Volllastwert steht dabei, warum die Richtung wichtiger ist als die Zahl: zu mager kostet Kolben.' },
        { type: 'fix', text: 'Kraftstoffdruck und Ethanol verweisen auf die Exkurs-Seiten, statt den Inhalt ein zweites Mal zu fuehren. Doppelte Wahrheiten driften auseinander - in diesem Repository bereits passiert.' },
        { type: 'fix', text: 'Das pauschale Ethanol-Verbot ist durch den tatsaechlichen Mechanismus ersetzt: das Risiko liegt in der Standzeit, nicht in den Kilometern.' },
        { type: 'fix', text: 'Das Inhaltsverzeichnis trug noch den alten Abschnittstitel.' }
      ]
    },
    {
      version: 'v34',
      date: '2026-09-20',
      title: 'Referenzhistorie der Vergaseranlage',
      changes: [
        { type: 'neu', text: 'Die Vergaser-Komponente in den Specs nennt jetzt ihre Herkunft: die vier DRLA stammen samt Ansaugbruecke, Gestaenge und Trichtern vom alten 1968er 302 dieses Fahrzeugs, wurden dort in England professionell mit zwei Lambdasonden abgestimmt und liefen einwandfrei. Seitdem nur gereinigt. Damit ist begruendet, warum die verbaute Bedueusung die Start-Baseline ist und nicht auf einen Tabellenwert korrigiert wird.' },
        { type: 'neu', text: 'Ausdruecklich als Owner-Historie gekennzeichnet, nicht als Herstellerfakt - das Abstimmprotokoll existiert nicht mehr. Belastbar als Begruendung fuers Konservieren, nicht als technischer Sollwert.' },
        { type: 'neu', text: 'Erfassungsfelder fuer die Vergaser-Identitaet: Gehaeusecode je Vergaser V1 bis V4, Trichtermasse, Schwimmer- und Nadelventilausfuehrung, Hersteller der Ansaugbruecke.' },
        { type: 'neu', text: 'Die vorhandenen Kennzeichnungen stehen mit ehrlichem Status: 8010 2 passt zur DRLA-45-Familie, erlaubt aber keine Variantenbestimmung; R 6205 P ist offen und wird dokumentiert, nicht interpretiert.' },
        { type: 'fix', text: 'Der Druckwert in den Specs verweist auf den Exkurs zur Quellenlage und nennt 0.24 Bar statt der falsch gerundeten 0.25.' }
      ]
    },
    {
      version: 'v33',
      date: '2026-09-20',
      title: 'Kapitel 22 macht endlich das, was sein Titel sagt',
      changes: [
        { type: 'neu', text: 'Exkurs-Seiten unter docs/: Wissen, das sich keinem Arbeitsschritt zuordnen laesst, bricht die Struktur des Build Logs nicht mehr auf, sondern steht als eigene Unterseite - verlinkt von der Stelle, an der die Frage auftaucht. Neu: Kraftstoffdruck am DellOrto DRLA und Ethanol/E10.' },
        { type: 'fix', text: 'Kraftstoffdruck wird abgelesen, nicht auf einen Sollwert verstellt. Die Anlage lief mit ihrer Einstellung. Eingegriffen wird nur, wenn der Wert ueber 3.5 psi liegt oder die beiden Kreise voneinander abweichen.' },
        { type: 'fix', text: 'Korrektur an v33: eine Ablesung bei stehendem Motor sei wertlos - das gilt fuer eine mechanische Pumpe, nicht fuer die verbauten elektrischen. Die bauen den Druck bereits bei Zuendung an auf. Vor-Start-Wert und Wert bei laufendem Motor werden jetzt getrennt erfasst.' },
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
