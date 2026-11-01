# Konzept – Visuelle Werkstattanleitung Ventiltrieb (GT40 BOSS 302)

**Status:** Zwei visuelle Exkurse implementiert (v133-Kandidat); unabhängige Prüfung noch offen. Keine geänderte Messlogik. Bauteilspezifische Restlücken sind vor den jeweiligen Aktionen sichtbar gesperrt.  
**Baseline:** GT40 Build-Log v128, Ford Performance M-6009-302 / AFR 1399 + Upgrade 8605/6411/8600 / COMP 35-518-8 + 1632-16 / Morel 5327 / CNC-TC6878.  
**Geltungsbereich:** ausschließlich GT40, Phase 2 Schritte 10–12 und Phase 3 Schritt 17; Querverweise auf Phase 1 Ventilfedern und Phase 4 Erststart. Kein Eingriff in andere Repositories.

## 1. Aufgabe und Ergebnis

Aus dem Arbeitsvorfall (verstellbare Prüfstößelstange beim Ermitteln der Länge verbogen, unklarer Montagezustand des Kipphebels und der Polylocks) entsteht ein **geschlossener, bebilderter Arbeitsablauf**. Ziel ist eine Anleitung, die ohne implizites Mechanikerwissen von „Prüfaufbau herstellen“ bis „richtige Stößelstangen bestellen, Ventiltrieb final montieren und dokumentieren“ führt. Keine Bestellung auf Basis bloßer Vermutungen.

Die Dokumentation soll das bestehende GT40-Konzept *Wissen/Physik → konkrete Konsequenz → Messverfahren → Einstellung → Validierung → Aufzeichnung* umsetzen. Visueller Stil wie `docs/cam-degreeing.html`, aber kompakter: Handlung sichtbar; Hintergründe in einklappbaren Details. **Keine globalen Typografieänderungen**.

## 2. Zwei Exkurse – ein durchgehender Werkstattprozess

### A. „Stößelstangenlänge und Rocker-Geometrie“ (Phase 2 / Schritte 10 und 11)

1. **Vorbereitung und Sicherheitsprüfung:** Zylinderkopf, Ventile, Ventilschaftlängen, Führungsplatten, AFR 6411 Stehbolzen und COMP 1632-16 kontrollieren. **AFR 1399 ist Stud-Mount**, nicht Pedestal-Mount (AFR Originaldaten; diesbezügliche alte Aussage in Phase 2 Schritt 9 wurde im kleinen Korrektur-PR berichtigt). Genauen Zustand und Teilenummer des Prüfstößels dokumentieren; den verbogenen CNC-TC6878 nicht weiter einsetzen. **Ursache der Biegung noch ungeklärt:** hohe Federlast, Verkanten, unvollständig sitzende Enden, Kontakt in Führungsplatte oder falsche Einstellung getrennt prüfen.
2. **Prüffedern montieren:** Nach Herstelleranleitung geeignete leichte Checking Springs an den zu prüfenden Ventilen verwenden, statt die 8605-Doppelfedern gegen eine verstellbare Prüfstößelstange zu belasten. Sicherung von Ventil, Federteller und Keilen prüfen. Das probeweise Weglassen der inneren *Betriebsfeder* wird nicht pauschal als gleichwertige Lösung deklariert; nur nach Prüfung von Restfederkraft, Retainer und Freigängigkeiten.
3. **Hydraulikstößel beim Messen:** Definierter Hub- und Stößelstangensitz-Bezug erforderlich. Ein zusammengedrückter Morel-5327-Kolben verschiebt den Längenbezug. Mit leichtem Prüffedersatz ist die Messung schonender; dennoch wird die Messmethode vor Ausführung gegen die konkrete 5327-Konstruktion abgeglichen (ggf. mechanisch fixierter Prüf-Lifter mit identischer Sitzhöhe). Keine Schätzung.
4. **Rocker korrekt aufsetzen:** Korrekt passende Stößelstangenenden in Lifter und Kipphebelpfanne, Führungsplatte ohne Berührung, flache Trunnion-Seite um die Studbohrung nach oben gemäß COMP-Herstellerkatalog 2011, Druckseite 410 (PDF-Seite 412); diese Anweisung steht nicht in PN151, Polylock lose mit zurückgedrehter Madenschraube. Für die Geometriemessung nur soweit verspannen, dass der Prüfaufbau definiert bleibt; keine finale Preload an dieser Stelle.
5. **Geometrie ermitteln:** Einlass und Auslass getrennt bei geschlossenem Ventil, mittlerem Hub und maximalem Hub prüfen. Eine mit Filzstift markierte Ventilschaftspitze gibt das Kontaktbild; zusätzlich Sweep-Breite, Lage, Freigang und mögliche Side-Loading-Effekte dokumentieren. Ein schmaler Verlauf allein ist **kein pauschales Alleinkriterium**, die reale Rollengeometrie am Ventil ist maßgeblich.
6. **Länge iterativ verändern:** Verstellbare Prüfstößelstange nur bei entlastetem Aufbau verstellen, erneut drehen/prüfen und den passenden Wert nachvollziehbar ermitteln. Drei wiederholte Kontrollen je Ventiltyp als Qualitätsmaß, keine erfundene Toleranz.
7. **Bestelllänge bestimmen:** Theoretical vs Actual vs Gauge Length sauber unterscheiden. COMP nennt für sein eigenes Messsystem .140-Zoll-Gauge-Kugeldurchmesser; **nicht** blind auf den CNC-TC6878 oder Lieferanten übertragen. Messmethode und bestellte Längenkonvention ausweisen. Geprüfte Daten getrennt für Einlass und Auslass im Build-Log speichern.
8. **Freigabe:** Längen bei finalen Köpfen/gedichteter Einbausituation plausibilisieren, Kontaktbild dokumentieren, Pushrod-zu-Guideplate, Rocker-zu-Retainer, Ventilhub und Piston-to-Valve separat kontrollieren. Danach erst endgültige Pushrods bestellen (Phase 2 Schritt 22).

### B. „Rocker / ARP-Stehbolzen / Polylocks / Morel-Preload“ (Phase 3 / Schritt 17)

1. **Befestigungsarten visuell trennen:** (a) in AFR-Kopf eingeschraubter 7/16-Zoll-Rocker-Stud (AFR Upgrade #6411; ARP-Herkunft/Einzelteilenummer am tatsächlichen Teil ermitteln), (b) aufgesetzter COMP 1632-16 Rocker, (c) aufgeschraubter Polylock mit Madenschraube. Ein Stud-Anzugsmoment ist **kein** Polylock-Anzugsmoment.
2. **Montagereihenfolge:** Führungsplatte montieren/ausrichten, Stud auf korrekten Sitz prüfen, Rocker samt korrekt aufliegender Trunnion und Pushrod einsetzen, Polylock erst lose und Madenschraube zunächst zurückdrehen. Finale Drehmomente nur aus Herstelleranweisung für tatsächlich verbauten Stud, Gewinde, Werkstoff und Schmierung/Sealer; kein allgemeiner ARP-Wert.
3. **Grundkreis mit EO/IC:** Pro Zylinder durch Kurbelwellenrotation in *normaler Laufrichtung* das Öffnen des Auslassventils beobachten → Einlass prüfen; auf schließender Einlassflanke nach Hubmaximum → Auslass prüfen. Grafik der beiden Nockenflanken, nicht nur statische „Zünd-OT“-Behauptung.
4. **HLT-spezifische Vorspannung:** Morel #5327 steht in der **revidierten** Herstelleranweisung *Adjusting Hydraulic Limited Travel (HLT) Lifters (REVISED)*. Vorgabe für Gusseisenblock und Aluminiumköpfe, kalt ca. 70°F: **0.006–0.010 Zoll Fühlerlehrenmaß** nach *Bottom-out*-Verfahren am Plunger. Das ist eine spezifische Methode vom **unteren** Endanschlag, nicht einfach „0.006 Zoll Ventilspiel“ und **nicht** „¼–½ Umdrehung ab Nullspiel“. Diese Messmethoden werden nicht gemischt. Der aktuelle pauschale ¼–½-Umdrehungs-Text im Build-Log ist vor praktischer Verwendung **zu korrigieren/fachlich freizugeben**.
5. **Polylock sichern:** COMP PN 151 verlangt Polylock während der korrekten Lifterjustierung einstellen; anschließend Madenschraube mit geeignetem Innensechskant/T-Griff gemäß Hersteller anziehen und Einstellung nachkontrollieren. **Kein Drehmoment erfinden**, wenn keine bauteilspezifische Angabe belegt ist. Kein Schraubenfestdrehen, während die Nocke noch auf der Hubflanke steht.
6. **Nachkontrolle:** Je Ventil Preload, Freigängigkeit, Taster-/Ventilschaftgeometrie, Führungsplattenkontakt und Ölversorgung prüfen. EO/IC für 16 Ventile wiederholen; die tatsächliche ARP/AFR-Hardware-Identität dokumentieren.

## 3. Visuelle Bausteine und Nutzerführung

| Reihenfolge | Darstellung | Was sie dem Schrauber erklärt |
|---|---|---|
| 1 | **Explosionsbild, originale Vektorgrafik** vom Ventil über Retainer, Feder, Rocker-Trunnion, Polylock bis zur Morel-Rolle | Bauteile, Einbaurichtung und drei getrennte Schraubverbindungen |
| 2 | **Gut/Falsch-Seitenvergleich** „Betriebsfeder gegen leichte Prüffeder“ mit verbogener Prüfstößelstange | Wann der Checker nicht belastet werden darf; Warnung zur Ursache als Verdacht kennzeichnen |
| 3 | **Dreistufige Bewegungszeichnung** geschlossene Position / halber Hub / voller Hub, dazu vergrößertes Kontaktbild am Ventilschaft | Geometrie physikalisch erklären, nicht allein mit „Band mittig“ vereinfachen |
| 4 | **Messlängen-Diagramm** Actual / Theoretical / Gauge Length mit Kalotten-/Ölbohrungsbezug | Verhindert Bestellung auf falscher Längendefinition |
| 5 | **EO/IC-Nockenlauf mit Playhead** als einfache, schrittweise SVG-Abfolge, zugänglich ohne Animation | Welches Ventil wann wirklich auf dem Grundkreis steht |
| 6 | **Morel-HLT-Plunger-Querschnitt** mit *Bottomed-Out*-Position, Fühlerlehre, Einstellbereich | Korrektes HLT-Verfahren unterscheidet sich von allgemeinem Hydraulikstößel-Preload |
| 7 | **Polylock-Vergrößerung** – Körper, Trunnion-Fläche, Madenschraube und Reihenfolge | Vermeidet Verwechslung von Stud-Drehmoment und Kontern |
| 8 | **Kompakte Ergebnis-/Freigabekarte** pro Einlass/Auslass oder je Zylinder, druckbar | Messungen, Photos und Abschluss in der Werkstatt dokumentieren |

**Bildquellen-Strategie:** Zuerst Herstellerunterlagen von COMP, Morel/John Callies, AFR und ARP als **technische Referenzen verlinken**. Schematische Details in eigener SVG-Grafik erstellen; keine unlizenzierte Übernahme von Fotografien oder geschützten Handbuch-Abbildungen. Falls eine Herstellerabbildung methodisch besser ist, **direkt zur Originalseite verlinken** oder eine ausdrücklich genehmigte/eigenständig lizenzierte Datei mit Quelle verwenden. Vorhandene im GT40-Repo vom Fahrzeughalter hochgeladene Fotos nur, wenn sie den exakten Montagezustand zeigen und technisch korrekt beschriftet werden können.

**Aufbau:** Ein gemeinsamer Navigations-Einstieg „Ventiltrieb prüfen“, daraus zwei kurze Exkurse mit gleichen fünf visuellen Schritten wie bei Cam Degreeing. Hauptaufgabe immer sofort sichtbar; Spezialfälle/Physik/Quellen einklappbar. Keine globale CSS-/Typografieänderung.

## 4. Datenfluss / Versionsdisziplin

- Bestehende Gist-Felder, Messungen, Photo-Upload, Checklisten und Zuordnung zu Phase 2/3 **nicht** überschreiben.
- Für geplante Messfelder (vorbehaltlich Datenmigration/Review): `pushrod_check_method`, `checker_spring_installed`, `intake_length`, `exhaust_length`, `length_convention`, `contact_width/position`, `rocker_stud_part_number`, `rocker_stud_torque_source`, `hlt_method_source`, `hlt_feeler_in`, `polylock_locked`. Konkrete Feldnamen werden im Implementierungs-PR gegen bestehende Namen geprüft; kein neuer Feldname ohne Migrationsstrategie.
- Source Register: Hersteller, Dokumenttitel, Ausgabe/Revision, konkretes Teil, Kapitel/Seite, angewandter Wert und offene Abweichung.
- Keine automatische Freigabe aus einem einzelnen idealen Kontaktbild. Vorhandene Testfälle für Feldmigration, Synchronisation und Rehydration erweitern.

## 5. Qualitätssicherung / Abnahmekriterien

- Tech-Review: Originaldokumentation Morel 5327 (**revidiert**) und COMP 151/Geometry bestätigt; Hersteller-/Bauteilzuordnung für AFR/ARP-Stehbolzen bekannt.
- Fachliche Abnahme je Abschnitt: **aufbauen → messen → beurteilen → ggf. korrigieren → nachmessen → protokollieren**; das Kapitel erklärt explizit, wann eine Prüffeder nötig ist.
- Ohne tatsächliche ARP-Teilenummer, Werksmethode und Schmierung kein erfundener Drehmomentwert; bei Unklarheit „noch zu prüfen“ statt Farbfeld „grün“.
- Testmodell: falsch belasteter Prüfstößel, lose Stößelstange, Morel-Plunger eingedrückt, Polylock-Madenschraube zu früh angezogen, Einlass/Auslass vertauscht, abweichende Bestell-Längenkonvention, 16 Ventile, Gist-Reload.
- Browser: Desktop/360–390px, Screenreader-Texte bei SVG, druckbare Kurzfassung.
- Keine produktive Montageanleitung als „fertig“ kennzeichnen, solange die hydraulische HLT-Einstellmethode oder der Stud-Torque nicht korrekt zugeordnet sind.

## 6. Priorisierter Umsetzungsplan

1. **Jetzt:** Warnung Flat-Tappet-Cam-Break-in vs Roller in Phase 4 und im gemeinsamen Glossar (separater kleiner Release innerhalb desselben Konzept-PR); vorhandene pauschale Preload-Stelle als offenen Prüfbedarf dokumentieren, bis Exkurs umgesetzt.
2. **Exkurs A:** Prüffeder → Geometrie → richtige Stößelstangenlänge und Bestellkonvention.
3. **Exkurs B:** ARP/AFR-Studs und COMP-Polylock mit Morel-HLT-Verfahren; damit erst der finale Zusammenbau.
4. **Danach:** Piston-to-Valve-Clearance (Messuhr/Clay) und Ventilfedern/Coil Bind als zwei weitere, gekoppelte visuelle Exkurse.
5. **Vor erstem Motorstart:** Phase-4-Erststartprozedur unabhängig von Flat-Tappet-30-Minuten-Anweisung für Hydraulic Roller technisch neu abnehmen. Dieser Konzept-PR schreibt noch **keine** unbestätigte Einlaufdrehzahl fest.

## 7. Quellen (Primärquellen zuerst)

1. **COMP Cams Part #145, Camshaft Installation and Degreeing Procedure (Rev. 05/2012), S. 4:** „Camshaft Break-in Procedure“ ausdrücklich für hydraulische/mechanische **Flat Tappet**; innere Federn für diese Anwendung vor Einlauf entfernen. https://compcams.com/pub/media/productattach/1/4/145.pdf
2. **COMP Cams Part #151, Ultra Pro Magnum / XD Roller Rocker Arms (Rev. 07/2014), S. 2–3:** lose Polylocks, zurückgedrehte Madenschraube, EO/IC-Positionen, separate spezifische Lifter-Preload-Vorgaben. https://www.compcams.com/pub/media/productattach/1/5/151_4_.pdf
3. **COMP Cams Valve Train Geometry (Herstellertechnik):** Pushrod-Länge, Kontaktverlauf und Gauge-/Actual-/Theoretical-Length. https://www.compcams.com/valve-train-geometry
4. **COMP Cams Low Tension Checking Springs 4758-2:** leichte Federn für Geometrie- und Freigängigkeitsprüfung. Herstellerkatalog: https://www.hprengines.com/uploads/2/7/4/5/2745655/comp_cams_master_reference.pdf
5. **John Callies / Morel, Adjusting Hydraulic Limited Travel (HLT) Lifters (REVISED), ©2023:** Nummer **5327**, ca. 0.030-Zoll Plunger-Travel; **Gusseisenblock + Aluminiumkopf 0.006–0.010 Zoll** Fühlerlehre beim *Bottom-out*-Verfahren (kalte Einstellung bei 70°F). https://johncalliesinc.com/pdf/Adjusting%20Hydraulic%20Limited%20Travel%20Lifters%28REV%29.pdf
6. **John Callies Morel Ford Product Listing:** 5327 ausdrücklich „Limited Travel (Race Only)“. https://johncalliesinc.com/morel_products_product_view.php?cat=Lifters&make=Ford
7. **AFR Installationsunterlagen / AFR 1399, AFR #6411 Upgrade:** Originalteile und tatsächliche Stud-Untergruppe vor einer Drehmomentvorgabe identifizieren. https://www.airflowresearch.com/customer-support-installation-instructions/
8. **ARP-Rocker-Stud-Anweisungen:** nur für tatsächlich identifizierte ARP-Teilenummer verwenden (generische ARP-Blätter sind kein Nachweis für AFR #6411). https://arp-bolts.com/

## 8. Implementierungsstand und explizit offen (nicht raten)

- `docs/pushrod-geometrie.html` und `docs/rocker-hlt-einstellung.html`: je fünf Schritte, acht eigene SVG-Schemata insgesamt, EO/IC-Umschaltung, druckbare Kontrollkarten; gemeinsame lokale CSS-Datei. Querverweise aus Build-Log und Übersicht sowie Offline-Precache ergänzt.
- Keine neuen Gist-/Messfelder; vorhandene Felder, Status und Galerien bleiben erhalten. Druckkarte statt neuer Speicherung.
- Trunnion-Orientierung belegt: COMP-Herstellerkatalog 2011, Druckseiten 315 (1632-16) und 410 (Troubleshooting Rocker Arms 3), historische Originalkopie unter https://www.survivalmotorsports.com/files/COMP_Cat_2011-IW.pdf . Flache Fläche oben, Polylock plan/rechtwinklig, Freigang zum Rockerkörper prüfen. Quellenzuordnung PN151 oben korrigiert.
- Weiterhin nicht freigegeben: konkrete Morel-5327-Prüfsitzhöhe für die Längenmessung und genaue AFR6411/ARP-Stud-Montagezuordnung. Die jeweiligen Seiten zeigen die Grenze direkt vor der Aktion.


- Stimmt die genaue Kennzeichnung/ARP-Unterteilenummer der eingebauten AFR #6411 Stehbolzen? Welche zugehörige AFR-/ARP-Montageanweisung und welches Schmiermittel wurden geliefert?
- Welche Ventilfeder-Bauart / Federhälften und Retainer-Konfiguration sind am **tatsächlichen AFR-Kopf** montiert? Leichte Prüffedern für den Mock-up besorgen/prüfen, statt nur die innere 8605-Feder zu entfernen.
- Ist der beschädigte Prüfstößel noch unverformt an der Messspitze/Gewindeführung? Bei Verbiegung ersetzen.
- Welcher hydraulische Morel-5327-Messaufbau bildet die relevante Sitzhöhe des Lifters ohne unkontrollierte Plungerbewegung exakt ab?
- Sicherungsprinzip aus COMP PN151 dokumentiert; abweichende tatsächlich gelieferte Polylock-Ausführung gesondert prüfen. Kein numerisches Madenschrauben-Drehmoment aus einer allgemeinen Tabelle übernehmen.
- Vor Umbau des Erststart-Schritts ausdrücklich klären, ob separate Hersteller-Vorgaben für Verteilerzahnrad, Lager und Feder-Wärmezyklus bestehen; kein Flat-Tappet-Missverständnis.
