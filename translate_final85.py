#!/usr/bin/env python3
"""Third and final pass: translate the remaining 85 bilingual lines."""
import re
import sys

# Exact match: original HTML -> (DE version, EN version)
TRANSLATIONS = {
    '<strong>Bei 302-Blocks m&uuml;ssen die Zylinderk&ouml;pfe abgenommen werden, um die Lifter einzubauen!</strong> (On 302 blocks, cylinder heads must be removed to install lifters!)':
        ('<strong>Bei 302-Blocks muessen die Zylinderkoepfe abgenommen werden, um die Lifter einzubauen!</strong>',
         '<strong>On 302 blocks, cylinder heads must be removed to install lifters!</strong>'),
    '<strong>BOSS 302 Block:</strong> Hat 351W-Hauptlagergewinde, aber 302-Kopfgeometrie. Stehbolzenl&auml;nge pr&uuml;fen! (Has 351W main bearing threads but 302 head geometry. Check stud length!)':
        ('<strong>BOSS 302 Block:</strong> Hat 351W-Hauptlagergewinde, aber 302-Kopfgeometrie. Stehbolzenlaenge pruefen!',
         '<strong>BOSS 302 Block:</strong> Has 351W main bearing threads but 302 head geometry. Check stud length!'),
    '<strong>Verify free movement:</strong> Push lifter down and release &ndash; it should spring back up freely, no binding (frei auf und ab gleiten)':
        ('<strong>Freigaengigkeit pruefen:</strong> Stoessel herunter druecken und loslassen &ndash; muss frei zurueckfedern, kein Klemmen',
         '<strong>Verify free movement:</strong> Push lifter down and release &ndash; it should spring back up freely, no binding'),
    'Pointer (Zeiger), mounted to block':
        ('Zeiger, am Block montiert',
         'Pointer, mounted to block'),
    '<strong>Check alignment:</strong> Pushrod must be centered in guide plate slot &ndash; no contact with slot edges at rest (Pushrod muss mittig im Schlitz laufen)':
        ('<strong>Fluchtung pruefen:</strong> Stoesselstange muss mittig im Fuehrungsplatten-Schlitz laufen &ndash; kein Kontakt mit Schlitzkanten in Ruheposition',
         '<strong>Check alignment:</strong> Pushrod must be centered in guide plate slot &ndash; no contact with slot edges at rest'),
    '<strong>1.</strong> Rotate cam to base circle (Grundkreis) &ndash; lifter in valley':
        ('<strong>1.</strong> Nockenwelle auf Grundkreis drehen &ndash; Stoessel im Tal',
         '<strong>1.</strong> Rotate cam to base circle &ndash; lifter in valley'),
    '<strong>2.</strong> Insert checking pushrod at estimated length':
        ('<strong>2.</strong> Pruef-Stoesselstange auf geschaetzte Laenge einstecken',
         '<strong>2.</strong> Insert checking pushrod at estimated length'),
    '<strong>3.</strong> Install rocker, tighten adjusting nut to zero lash (Nullspiel)':
        ('<strong>3.</strong> Kipphebel montieren, Einstellmutter auf Nullspiel anziehen',
         '<strong>3.</strong> Install rocker, tighten adjusting nut to zero lash'),
    '<strong>4.</strong> Color valve stem tip with felt-tip marker':
        ('<strong>4.</strong> Ventilschaft-Ende mit Filzstift einfaerben',
         '<strong>4.</strong> Color valve stem tip with felt-tip marker'),
    '<strong>5.</strong> Cycle valve through full lift (rotate cam by hand)':
        ('<strong>5.</strong> Ventil durch vollen Hub fuehren (Nockenwelle von Hand drehen)',
         '<strong>5.</strong> Cycle valve through full lift (rotate cam by hand)'),
    '<strong>Narrow band centered</strong> = correct':
        ('<strong>Schmales Band mittig</strong> = korrekt',
         '<strong>Narrow band centered</strong> = correct'),
    '<strong>Band offset outward (exhaust)</strong> = pushrod too long':
        ('<strong>Band nach aussen versetzt (Auslass)</strong> = Stoesselstange zu lang',
         '<strong>Band offset outward (exhaust)</strong> = pushrod too long'),
    '<strong>Band offset inward (center)</strong> = pushrod too short':
        ('<strong>Band nach innen versetzt (Mitte)</strong> = Stoesselstange zu kurz',
         '<strong>Band offset inward (center)</strong> = pushrod too short'),
    '<strong>Wide band</strong> = wrong length &ndash; valve guide suffers!':
        ('<strong>Breites Band</strong> = falsche Laenge &ndash; Ventilfuehrung leidet!',
         '<strong>Wide band</strong> = wrong length &ndash; valve guide suffers!'),
    '<strong>7.</strong> Adjust checking pushrod and repeat steps 4&ndash;6':
        ('<strong>7.</strong> Pruef-Stoesselstange anpassen und Schritte 4&ndash;6 wiederholen',
         '<strong>7.</strong> Adjust checking pushrod and repeat steps 4&ndash;6'),
    '<strong>8.</strong> Read final checking pushrod length':
        ('<strong>8.</strong> Endgueltige Pruef-Stoesselstangen-Laenge ablesen',
         '<strong>8.</strong> Read final checking pushrod length'),
    '<strong>9.</strong> Measure intake and exhaust SEPARATELY &ndash; lengths may differ!':
        ('<strong>9.</strong> Einlass und Auslass GETRENNT messen &ndash; Laengen koennen abweichen!',
         '<strong>9.</strong> Measure intake and exhaust SEPARATELY &ndash; lengths may differ!'),
    'Intake and exhaust lengths documented':
        ('Einlass- und Auslass-Laengen dokumentiert',
         'Intake and exhaust lengths documented'),
    'Sweep check (next step) confirms the length':
        ('Sweep-Check (naechster Schritt) bestaetigt die Laenge',
         'Sweep check (next step) confirms the length'),
    '<strong>1. Shaft alignment:</strong> Insert intermediate shaft into block &ndash; hex end must engage camshaft gear (Sechskant muss in Nockenwellen-Antriebszahnrad greifen)':
        ('<strong>1. Wellenausrichtung:</strong> Zwischenwelle in Block einfuehren &ndash; Sechskant muss in Nockenwellen-Antriebszahnrad greifen',
         '<strong>1. Shaft alignment:</strong> Insert intermediate shaft into block &ndash; hex end must engage camshaft gear'),
    '<strong>2. Drive shaft length:</strong> Shaft must extend below block far enough to engage pump rotor &ndash; verify ~0.5&quot; (12.7 mm) protrusion below pump mounting pad':
        ('<strong>2. Wellenlaenge:</strong> Welle muss weit genug unter den Block reichen um in Pumpen-Rotor zu greifen &ndash; ~0,5&quot; (12,7 mm) Ueberstand unter Pumpen-Montageflansch pruefen',
         '<strong>2. Drive shaft length:</strong> Shaft must extend below block far enough to engage pump rotor &ndash; verify ~0.5&quot; (12.7 mm) protrusion below pump mounting pad'),
    '<strong>3. Pump mounting:</strong> Set pump on rear main cap mounting pad &ndash; bolt finger-tight only':
        ('<strong>3. Pumpenmontage:</strong> Pumpe auf hintere Hauptlagerdeckel-Montageflansch setzen &ndash; nur handfest anziehen',
         '<strong>3. Pump mounting:</strong> Set pump on rear main cap mounting pad &ndash; bolt finger-tight only'),
    '<strong>4. Rotation check:</strong> Turn shaft by hand (screwdriver in hex) &ndash; must rotate freely without binding':
        ('<strong>4. Drehpruefung:</strong> Welle von Hand drehen (Schraubendreher in Sechskant) &ndash; muss frei drehen ohne Klemmen',
         '<strong>4. Rotation check:</strong> Turn shaft by hand (screwdriver in hex) &ndash; must rotate freely without binding'),
    '<strong>5. Pickup alignment:</strong> Verify pickup tube direction points toward pan sump area':
        ('<strong>5. Pickup-Ausrichtung:</strong> Pruefen ob Saugrohr-Richtung zum Wannen-Sumpfbereich zeigt',
         '<strong>5. Pickup alignment:</strong> Verify pickup tube direction points toward pan sump area'),
    '<strong>2.</strong> Remove valve covers (Ventildeckel)':
        ('<strong>2.</strong> Ventildeckel abnehmen',
         '<strong>2.</strong> Remove valve covers'),
    '<strong>3.</strong> Remove rockers, polylocks, pushrods &ndash; bag per cylinder! (pro Zylinder einpacken!)':
        ('<strong>3.</strong> Kipphebel, Polylocks, Stoesselstangen ausbauen &ndash; pro Zylinder einpacken!',
         '<strong>3.</strong> Remove rockers, polylocks, pushrods &ndash; bag per cylinder!'),
    'Remove and discard mock-up gasket (Fel-Pro 1011) &ndash; NOT reusable (Probedichtung NICHT wiederverwendbar)':
        ('Probedichtung (Fel-Pro 1011) entfernen und entsorgen &ndash; NICHT wiederverwendbar',
         'Remove and discard mock-up gasket (Fel-Pro 1011) &ndash; NOT reusable'),
    '<strong>All 5 journals:</strong> Apply lube to all cam bearing journals (alle 5 Lagerzapfen einschmieren)':
        ('<strong>Alle 5 Lagerzapfen:</strong> Alle Nockenwellen-Lagerzapfen einschmieren',
         '<strong>All 5 journals:</strong> Apply lube to all cam bearing journals'),
    '<strong>Distributor gear:</strong> Apply lube to the distributor drive gear at rear of cam (Verteiler-Antriebszahnrad am Nockenende)':
        ('<strong>Verteiler-Zahnrad:</strong> Verteiler-Antriebszahnrad am hinteren Nockenende einschmieren',
         '<strong>Distributor gear:</strong> Apply lube to the distributor drive gear at rear of cam'),
    '<strong>Fuel pump eccentric:</strong> Lube the fuel pump eccentric lobe if applicable (Benzinpumpen-Exzenter)':
        ('<strong>Benzinpumpen-Exzenter:</strong> Benzinpumpen-Exzenternocken schmieren falls vorhanden',
         '<strong>Fuel pump eccentric:</strong> Lube the fuel pump eccentric lobe if applicable'),
    '<strong>Insert slowly:</strong> Carefully slide cam into block, rotating very slowly as needed to clear each bearing journal (langsam einschieben, leicht drehen)':
        ('<strong>Langsam einschieben:</strong> Nockenwelle vorsichtig in Block schieben, sehr langsam drehen um jedes Lager zu passieren',
         '<strong>Insert slowly:</strong> Carefully slide cam into block, rotating very slowly as needed to clear each bearing journal'),
    'Timing marks must point toward each other (dot-to-dot) at TDC #1 (Steuermarken Punkt-zu-Punkt bei OT #1)':
        ('Steuermarken muessen bei OT #1 aufeinander zeigen (Punkt-zu-Punkt)',
         'Timing marks must point toward each other (dot-to-dot) at TDC #1'),
    '<strong>Clean all bores:</strong> Wipe each of the 16 lifter bores with clean cloth &ndash; remove any preservative or debris (alle 16 Bohrungen reinigen)':
        ('<strong>Alle Bohrungen reinigen:</strong> Alle 16 Stoesselbohrungen mit sauberem Tuch auswischen &ndash; Konservierung und Schmutz entfernen',
         '<strong>Clean all bores:</strong> Wipe each of the 16 lifter bores with clean cloth &ndash; remove any preservative or debris'),
    'Label or note lifter positions &ndash; if removed later, reinstall in same bore (Positionen markieren)':
        ('Stoessel-Positionen beschriften oder notieren &ndash; bei spaeterem Ausbau in gleicher Bohrung wieder einbauen',
         'Label or note lifter positions &ndash; if removed later, reinstall in same bore'),
    'Lifter-to-bore clearance: 0.0010"&ndash;0.0025" (0.025&ndash;0.064 mm) &ndash; too tight = binding, too loose = oil leak and noise':
        ('Stoessel-zu-Bohrung-Spiel: 0,0010"&ndash;0,0025" (0,025&ndash;0,064 mm) &ndash; zu eng = Klemmen, zu lose = Oelleck und Geraeusch',
         'Lifter-to-bore clearance: 0.0010"&ndash;0.0025" (0.025&ndash;0.064 mm) &ndash; too tight = binding, too loose = oil leak and noise'),
    '<strong>3.</strong> Insert intermediate shaft &ndash; must engage cam gear (Zwischenwelle einsetzen &ndash; muss in Cam-Antriebszahnrad greifen)':
        ('<strong>3.</strong> Zwischenwelle einsetzen &ndash; muss in Nockenwellen-Antriebszahnrad greifen',
         '<strong>3.</strong> Insert intermediate shaft &ndash; must engage cam gear'),
    '<strong>4.</strong> Torque mounting bolt (Befestigungsschraube anziehen)':
        ('<strong>4.</strong> Befestigungsschraube anziehen',
         '<strong>4.</strong> Torque mounting bolt'),
    'Too far from pan bottom = air ingestion under acceleration (zu weit = Luft ansaugen bei Beschleunigung)':
        ('Zu weit vom Wannenboden = Luftansaugung bei Beschleunigung',
         'Too far from pan bottom = air ingestion under acceleration'),
    'Too close to pan bottom = cavitation (zu nah = Kavitation)':
        ('Zu nah am Wannenboden = Kavitation',
         'Too close to pan bottom = cavitation'),
    '<strong>Pickup verschrauben, nicht nur stecken!</strong> Unter Vibration kann er sich l&ouml;sen. (Bolt the pickup &ndash; do not just press-fit! Vibration can loosen it.)':
        ('<strong>Pickup verschrauben, nicht nur stecken!</strong> Unter Vibration kann er sich loesen.',
         '<strong>Bolt the pickup &ndash; do not just press-fit!</strong> Vibration can loosen it.'),
    'Lay gasket <strong>dry</strong> (no sealant! / ohne Dichtmittel!)':
        ('Dichtung <strong>trocken</strong> auflegen (ohne Dichtmittel!)',
         'Lay gasket <strong>dry</strong> (no sealant!)'),
    'Correct side up: &quot;TOP&quot; or &quot;FRONT&quot; must face upward/forward (richtige Seite oben: &quot;TOP&quot; oder &quot;FRONT&quot;)':
        ('Richtige Seite oben: &quot;TOP&quot; oder &quot;FRONT&quot; muss nach oben/vorne zeigen',
         'Correct side up: &quot;TOP&quot; or &quot;FRONT&quot; must face upward/forward'),
    '<strong>Head Gasket hat &quot;FRONT&quot; aufgedruckt</strong> &ndash; r&uuml;ckw&auml;rts montiert = K&uuml;hlung unterbrochen':
        ('<strong>Kopfdichtung hat &quot;FRONT&quot; aufgedruckt</strong> &ndash; rueckwaerts montiert = Kuehlung unterbrochen',
         '<strong>Head gasket has &quot;FRONT&quot; printed on it</strong> &ndash; installed backwards = cooling interrupted'),
    '<strong>Keine Stahldichtung auf Alu-K&ouml;pfen final!</strong> Die CP331 ist f&uuml;r Alu ausgelegt. (No steel gasket on aluminum heads! The CP331 is designed for aluminum.)':
        ('<strong>Keine Stahldichtung auf Alu-Koepfen!</strong> Die CP331 ist fuer Aluminium ausgelegt.',
         '<strong>No steel gasket on aluminum heads!</strong> The CP331 is designed for aluminum.'),
    'Photograph &quot;FRONT&quot; marking visible (proof of correct installation / Nachweis korrekte Einbaulage)':
        ('&quot;FRONT&quot;-Markierung fotografieren (Nachweis korrekte Einbaulage)',
         'Photograph &quot;FRONT&quot; marking visible (proof of correct installation)'),
    '<strong>BOSS-Block + AFR #1399</strong> use 1/2" (12.7 mm) head bolts (verwenden 1/2"-Kopfschrauben)':
        ('<strong>BOSS-Block + AFR #1399</strong> verwenden 1/2" (12,7 mm) Kopfschrauben',
         '<strong>BOSS Block + AFR #1399</strong> use 1/2" (12.7 mm) head bolts'),
    '<strong>Lower bolts (position 6&ndash;10)</strong> go into water jacket (gehen in den Wassermantel) &rarr; use <strong>ARP Thread Sealant</strong> or <strong>Loctite 567</strong> on threads!':
        ('<strong>Untere Bolzen (Position 6&ndash;10)</strong> gehen in den Wassermantel &rarr; <strong>ARP Gewindedichtmittel</strong> oder <strong>Loctite 567</strong> auf Gewinde!',
         '<strong>Lower bolts (position 6&ndash;10)</strong> go into water jacket &rarr; use <strong>ARP Thread Sealant</strong> or <strong>Loctite 567</strong> on threads!'),
    '<strong>Upper bolts (position 1&ndash;5)</strong> go into blind holes (gehen in Sacklochbohrungen) + washers with <strong>ARP Moly Lube</strong> on threads + under nut face':
        ('<strong>Obere Bolzen (Position 1&ndash;5)</strong> gehen in Sacklochbohrungen + Scheiben mit <strong>ARP Moly Lube</strong> auf Gewinde + unter Mutterauflage',
         '<strong>Upper bolts (position 1&ndash;5)</strong> go into blind holes + washers with <strong>ARP Moly Lube</strong> on threads + under nut face'),
    '<strong>Apply to washers:</strong> Both sides of each ARP hardened washer get a thin film of Ultra-Torque (beide Seiten der Scheiben)':
        ('<strong>Auf Scheiben auftragen:</strong> Beide Seiten jeder ARP-gehaerteten Scheibe duenn mit Ultra-Torque benetzen',
         '<strong>Apply to washers:</strong> Both sides of each ARP hardened washer get a thin film of Ultra-Torque'),
    '<strong>Hand-start all nuts:</strong> Place ARP washers and hand-start all ARP nuts on studs &ndash; do NOT torque yet (alle Muttern handfest aufdrehen &ndash; noch NICHT anziehen)':
        ('<strong>Alle Muttern handfest:</strong> ARP-Scheiben auflegen und alle ARP-Muttern handfest auf Stehbolzen drehen &ndash; noch NICHT anziehen',
         '<strong>Hand-start all nuts:</strong> Place ARP washers and hand-start all ARP nuts on studs &ndash; do NOT torque yet'),
    'Copper gaskets (CP331) are installed DRY &ndash; no sealant! (Kupferdichtung TROCKEN &ndash; kein Dichtmittel!)':
        ('Kupferdichtungen (CP331) werden TROCKEN montiert &ndash; kein Dichtmittel!',
         'Copper gaskets (CP331) are installed DRY &ndash; no sealant!'),
    '<strong>Slide onto studs:</strong> Place guide plate over rocker arm studs for each pair of intake/exhaust positions (auf Kipphebel-Stehbolzen schieben)':
        ('<strong>Auf Stehbolzen schieben:</strong> Fuehrungsplatte ueber Kipphebel-Stehbolzen fuer jedes Einlass/Auslass-Paar schieben',
         '<strong>Slide onto studs:</strong> Place guide plate over rocker arm studs for each pair of intake/exhaust positions'),
    '<strong>Verify centering:</strong> Each pushrod must be centered in its guide plate slot &ndash; no contact with slot edges (Pushrod muss mittig im Schlitz laufen)':
        ('<strong>Zentrierung pruefen:</strong> Jede Stoesselstange muss mittig im Fuehrungsplatten-Schlitz laufen &ndash; kein Kontakt mit Schlitzkanten',
         '<strong>Verify centering:</strong> Each pushrod must be centered in its guide plate slot &ndash; no contact with slot edges'),
    '<strong>2.</strong> Thread polylock onto rocker stud by hand (Polylock handfest auf Kipphebel-Stehbolzen drehen)':
        ('<strong>2.</strong> Polylock handfest auf Kipphebel-Stehbolzen drehen',
         '<strong>2.</strong> Thread polylock onto rocker stud by hand'),
    '<strong>4.</strong> Zero lash = pushrod just stops spinning (Nullspiel = Pushrod stoppt gerade)':
        ('<strong>4.</strong> Nullspiel = Stoesselstange hoert gerade auf zu drehen',
         '<strong>4.</strong> Zero lash = pushrod just stops spinning'),
    '<strong>5.</strong> From zero lash: <strong>1/4 to 1/2 turn further = preload</strong> (Ab Nullspiel: 1/4 bis 1/2 Umdrehung weiter = Vorspannung)':
        ('<strong>5.</strong> Ab Nullspiel: <strong>1/4 bis 1/2 Umdrehung weiter = Vorspannung</strong>',
         '<strong>5.</strong> From zero lash: <strong>1/4 to 1/2 turn further = preload</strong>'),
    '<strong>Wire-Mesh-Sieb bevorzugen</strong> &ndash; perforiertes Blech kann bis zu 75% Durchfluss kosten (Prefer wire mesh screen &ndash; perforated sheet can cost up to 75% flow)':
        ('<strong>Wire-Mesh-Sieb bevorzugen</strong> &ndash; perforiertes Blech kann bis zu 75% Durchfluss kosten',
         '<strong>Prefer wire mesh screen</strong> &ndash; perforated sheet can cost up to 75% flow'),
    '<strong>18 ft-lbs NICHT &uuml;berschreiten!</strong> (DO NOT exceed 18 ft-lbs!)':
        ('<strong>18 ft-lbs NICHT ueberschreiten!</strong>',
         '<strong>DO NOT exceed 18 ft-lbs!</strong>'),
    '<strong>RTV nur an den 4 Ecken</strong> (RTV only at the 4 corners)':
        ('<strong>RTV nur an den 4 Ecken</strong>',
         '<strong>RTV only at the 4 corners</strong>'),
    '<strong>Intake Gasket nicht port-matchen</strong> &ndash; Fel-Pro 1250 passt ab Werk (Do not port-match the intake gasket &ndash; Fel-Pro 1250 fits as delivered)':
        ('<strong>Ansaugdichtung nicht port-matchen</strong> &ndash; Fel-Pro 1250 passt ab Werk',
         '<strong>Do not port-match the intake gasket</strong> &ndash; Fel-Pro 1250 fits as delivered'),
    '<strong>Find TDC #1 compression:</strong> Rotate crank until TDC mark on damper aligns with pointer AND both valves on #1 cylinder are fully closed &ndash; this is compression stroke TDC (OT #1 Kompressionstakt &ndash; beide Ventile geschlossen)':
        ('<strong>OT #1 Kompression finden:</strong> Kurbelwelle drehen bis OT-Markierung am Schwingungsdaempfer mit Zeiger fluchtet UND beide Ventile am Zylinder #1 vollstaendig geschlossen sind &ndash; dies ist der Kompressionstakt-OT',
         '<strong>Find TDC #1 compression:</strong> Rotate crank until TDC mark on damper aligns with pointer AND both valves on #1 cylinder are fully closed &ndash; this is compression stroke TDC'),
    '<strong>Set rotor direction:</strong> Orient rotor to point toward #1 terminal position as you lower distributor into block (Verteilerfinger auf #1 ausrichten)':
        ('<strong>Verteilerfinger-Richtung:</strong> Verteilerfinger auf #1 Anschlussposition ausrichten beim Einsetzen des Verteilers in den Block',
         '<strong>Set rotor direction:</strong> Orient rotor to point toward #1 terminal position as you lower distributor into block'),
    '<strong>Insert distributor:</strong> Lower distributor into bore &ndash; the gear will mesh with cam gear and rotor may rotate slightly as gears engage. Compensate by offsetting rotor one tooth in advance (Zahnrad greift in Nockenrad &ndash; Finger dreht sich leicht beim Einsetzen)':
        ('<strong>Verteiler einsetzen:</strong> Verteiler in Bohrung absenken &ndash; Zahnrad greift in Nockenrad und Verteilerfinger dreht sich leicht beim Eingreifen. Durch Vorhalten um einen Zahn kompensieren',
         '<strong>Insert distributor:</strong> Lower distributor into bore &ndash; the gear will mesh with cam gear and rotor may rotate slightly as gears engage. Compensate by offsetting rotor one tooth in advance'),
    '<strong>Verify rotor position:</strong> With distributor fully seated, rotor must point at #1 terminal position (Verteilerfinger muss auf #1 zeigen)':
        ('<strong>Verteilerfinger-Position pruefen:</strong> Bei vollstaendig eingesetztem Verteiler muss Verteilerfinger auf #1 Anschlussposition zeigen',
         '<strong>Verify rotor position:</strong> With distributor fully seated, rotor must point at #1 terminal position'),
    'Rotate crank so fuel pump eccentric on cam is on base circle &ndash; easier to mount (Kurbelwelle drehen, damit Exzenter auf Grundkreis steht &ndash; erleichtert Montage)':
        ('Kurbelwelle drehen, damit Benzinpumpen-Exzenter auf Grundkreis steht &ndash; erleichtert Montage',
         'Rotate crank so fuel pump eccentric on cam is on base circle &ndash; easier to mount'),
    '<strong>IMMER vor&ouml;len vor dem Erststart!</strong> Melling PT11 + Bohrmaschine, bis &Ouml;l an allen Rockern austritt. (ALWAYS pre-oil before first start! Melling PT11 + drill until oil appears at all rockers.)':
        ('<strong>IMMER voroelen vor dem Erststart!</strong> Melling PT11 + Bohrmaschine, bis Oel an allen Kipphebeln austritt.',
         '<strong>ALWAYS pre-oil before first start!</strong> Melling PT11 + drill until oil appears at all rockers.'),
    '<strong>First 90&deg; rotation:</strong> While drill is running, slowly rotate crankshaft 90&deg; clockwise with wrench on damper bolt (Kurbel 90&deg; im Uhrzeigersinn drehen)':
        ('<strong>Erste 90&deg; Drehung:</strong> Bei laufender Bohrmaschine Kurbelwelle langsam 90&deg; im Uhrzeigersinn drehen (Schluessel auf Schwingungsdaempfer-Schraube)',
         '<strong>First 90&deg; rotation:</strong> While drill is running, slowly rotate crankshaft 90&deg; clockwise with wrench on damper bolt'),
    '<strong>Pause 15&ndash;20 seconds:</strong> Hold position and let oil flow reach the newly-positioned bearings (15&ndash;20 Sekunden warten)':
        ('<strong>15&ndash;20 Sekunden Pause:</strong> Position halten und Oel zu den neu positionierten Lagern fliessen lassen',
         '<strong>Pause 15&ndash;20 seconds:</strong> Hold position and let oil flow reach the newly-positioned bearings'),
    '<strong>Second 90&deg; rotation:</strong> Rotate another 90&deg; (total 180&deg;) &ndash; pause again (weitere 90&deg; drehen)':
        ('<strong>Zweite 90&deg; Drehung:</strong> Weitere 90&deg; drehen (gesamt 180&deg;) &ndash; wieder pausieren',
         '<strong>Second 90&deg; rotation:</strong> Rotate another 90&deg; (total 180&deg;) &ndash; pause again'),
    '<strong>Third 90&deg; rotation:</strong> Rotate another 90&deg; (total 270&deg;) &ndash; pause (weitere 90&deg;)':
        ('<strong>Dritte 90&deg; Drehung:</strong> Weitere 90&deg; drehen (gesamt 270&deg;) &ndash; pausieren',
         '<strong>Third 90&deg; rotation:</strong> Rotate another 90&deg; (total 270&deg;) &ndash; pause'),
    '<strong>Start drill:</strong> Run priming tool at moderate speed (not full RPM) and watch gauge immediately (Bohrmaschine starten, Manometer beobachten)':
        ('<strong>Bohrmaschine starten:</strong> Priming-Werkzeug bei mittlerer Drehzahl laufen lassen (nicht Vollgas) und Manometer sofort beobachten',
         '<strong>Start drill:</strong> Run priming tool at moderate speed (not full RPM) and watch gauge immediately'),
    '<strong>Pressure within 30 seconds:</strong> Gauge should show 15+ psi within 30 seconds of priming. If YES: continue priming with crank rotation (Druck innerhalb 30 Sek.)':
        ('<strong>Druck innerhalb 30 Sekunden:</strong> Manometer sollte 15+ psi innerhalb 30 Sekunden zeigen. Wenn JA: Priming mit Kurbeldrehen fortsetzen',
         '<strong>Pressure within 30 seconds:</strong> Gauge should show 15+ psi within 30 seconds of priming. If YES: continue priming with crank rotation'),
    '<strong>No pressure after 30 seconds: STOP!</strong> Investigate immediately: primer shaft not engaging pump, oil pump not primed (empty), pickup tube seal leaking, or wrong shaft length (STOPP falls kein Druck!)':
        ('<strong>Kein Druck nach 30 Sekunden: STOPP!</strong> Sofort untersuchen: Priming-Welle greift nicht in Pumpe, Oelpumpe nicht gefuellt (leer), Saugrohr-Dichtung undicht oder falsche Wellenlaenge',
         '<strong>No pressure after 30 seconds: STOP!</strong> Investigate immediately: primer shaft not engaging pump, oil pump not primed (empty), pickup tube seal leaking, or wrong shaft length'),
    '<strong>1.</strong> Verify all drain petcocks closed (alle Ablass-Hahne geschlossen)':
        ('<strong>1.</strong> Pruefen ob alle Ablasshaehne geschlossen sind',
         '<strong>1.</strong> Verify all drain petcocks are closed'),
    '<strong>1.</strong> Rotate crank to TDC #1 compression stroke &ndash; both valves closed, TDC mark aligned (Kurbelwelle auf OT #1 Kompressionstakt drehen)':
        ('<strong>1.</strong> Kurbelwelle auf OT #1 Kompressionstakt drehen &ndash; beide Ventile geschlossen, OT-Markierung ausgerichtet',
         '<strong>1.</strong> Rotate crank to TDC #1 compression stroke &ndash; both valves closed, TDC mark aligned'),
    '<strong>2.</strong> Verify rotor points toward #1 terminal on cap (Verteilerfinger zeigt auf Zyl. 1 Anschluss)':
        ('<strong>2.</strong> Pruefen ob Verteilerfinger auf #1 Anschluss an der Kappe zeigt',
         '<strong>2.</strong> Verify rotor points toward #1 terminal on cap'),
    '<strong>Prime carburetor:</strong> Pump throttle 2&ndash;3 times to squirt accelerator pump fuel into intake (Vergaser pumpen)':
        ('<strong>Vergaser befuellen:</strong> Gasgestaeenge 2&ndash;3 mal pumpen um Beschleunigerpumpen-Kraftstoff in Ansaugtrakt zu spritzen',
         '<strong>Prime carburetor:</strong> Pump throttle 2&ndash;3 times to squirt accelerator pump fuel into intake'),
    '<strong>Crank engine:</strong> Turn key / hit starter &ndash; engine should fire within 5&ndash;10 seconds if timing and fuel are correct (Motor starten)':
        ('<strong>Motor anlassen:</strong> Schluessel drehen / Anlasser betaetigen &ndash; Motor sollte innerhalb 5&ndash;10 Sekunden anspringen wenn Zuendung und Kraftstoff stimmen',
         '<strong>Crank engine:</strong> Turn key / hit starter &ndash; engine should fire within 5&ndash;10 seconds if timing and fuel are correct'),
    '<strong>IMMEDIATELY go to 2,000&ndash;2,500 RPM:</strong> As soon as engine fires, bring RPM up to 2,000&ndash;2,500 and HOLD IT THERE. Do NOT let it idle! (SOFORT auf 2.000&ndash;2.500 U/min &ndash; NICHT im Leerlauf lassen!)':
        ('<strong>SOFORT auf 2.000&ndash;2.500 U/min:</strong> Sobald Motor anspringt, Drehzahl auf 2.000&ndash;2.500 bringen und HALTEN. NICHT im Leerlauf lassen!',
         '<strong>IMMEDIATELY go to 2,000&ndash;2,500 RPM:</strong> As soon as engine fires, bring RPM up to 2,000&ndash;2,500 and HOLD IT THERE. Do NOT let it idle!'),
    '<strong>Hold 2,000&ndash;2,500 RPM for 20&ndash;30 minutes:</strong> This is the cam/distributor gear break-in period. Vary RPM between 2,000&ndash;3,000 every few minutes (20&ndash;30 Min. halten, Drehzahl variieren)':
        ('<strong>2.000&ndash;2.500 U/min 20&ndash;30 Minuten halten:</strong> Dies ist die Nocken-/Verteiler-Zahnrad-Einlaufphase. Drehzahl alle paar Minuten zwischen 2.000&ndash;3.000 variieren',
         '<strong>Hold 2,000&ndash;2,500 RPM for 20&ndash;30 minutes:</strong> This is the cam/distributor gear break-in period. Vary RPM between 2,000&ndash;3,000 every few minutes'),
    '<strong>Read at steady 2,000 RPM:</strong> With engine at operating temperature (180&deg;F+ coolant), hold steady 2,000 RPM and read oil pressure gauge (bei Betriebstemperatur ablesen)':
        ('<strong>Bei konstanten 2.000 U/min ablesen:</strong> Bei Betriebstemperatur (180&deg;F+ Kuehlmittel) konstant 2.000 U/min halten und Oeldruck-Manometer ablesen',
         '<strong>Read at steady 2,000 RPM:</strong> With engine at operating temperature (180&deg;F+ coolant), hold steady 2,000 RPM and read oil pressure gauge'),
    '<strong>Compare to spec:</strong> Melling M-68 high-volume pump should provide 40&ndash;55 psi at 2,000 RPM with standard bearing clearances (mit Soll vergleichen)':
        ('<strong>Mit Soll vergleichen:</strong> Melling M-68 Hochvolumen-Pumpe sollte 40&ndash;55 psi bei 2.000 U/min mit Standard-Lagerspielen liefern',
         '<strong>Compare to spec:</strong> Melling M-68 high-volume pump should provide 40&ndash;55 psi at 2,000 RPM with standard bearing clearances'),
    '<strong>Record readings:</strong> Document oil pressure at 2,000 RPM warm as baseline for future comparison (Werte dokumentieren)':
        ('<strong>Werte dokumentieren:</strong> Oeldruck bei 2.000 U/min warm als Referenzwert fuer kuenftige Vergleiche festhalten',
         '<strong>Record readings:</strong> Document oil pressure at 2,000 RPM warm as baseline for future comparison'),
    '<strong>Fuel (Kraftstoff):</strong> Carburetor base, fuel line fittings, fuel pump connections, fuel filter':
        ('<strong>Kraftstoff:</strong> Vergaserflansch, Kraftstoffleitungs-Anschluesse, Benzinpumpen-Verbindungen, Kraftstofffilter',
         '<strong>Fuel:</strong> Carburetor base, fuel line fittings, fuel pump connections, fuel filter'),
    '<strong>Exhaust (Abgas):</strong> Header/manifold flange gaskets &ndash; listen for ticking sound = exhaust leak':
        ('<strong>Abgas:</strong> Faecherkruemmer-/Kruemmerflansch-Dichtungen &ndash; auf tickendes Geraeusch achten = Abgasleck',
         '<strong>Exhaust:</strong> Header/manifold flange gaskets &ndash; listen for ticking sound = exhaust leak'),
}


def process_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    in_guide = False
    guide_depth = 0
    stats = {'translated': 0, 'skipped': 0}
    
    for i, line in enumerate(lines):
        if 'class="step-guide"' in line:
            in_guide = True
            guide_depth = 0
        if in_guide:
            guide_depth += line.count('<div') - line.count('</div')
            if guide_depth <= 0 and '</div>' in line:
                in_guide = False
            
            if 'class="de"' in line and 'class="en"' in line:
                continue
            
            m = re.match(r'^(\s*<li>)(.*?)(</li>\s*)$', line)
            if not m:
                continue
            
            prefix, inner, suffix = m.groups()
            inner = inner.strip()
            if not inner:
                continue
            
            if inner in TRANSLATIONS:
                de_text, en_text = TRANSLATIONS[inner]
                lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{en_text}</span>{suffix}'
                stats['translated'] += 1
            else:
                stats['skipped'] += 1
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"Stats: {stats}")
    return stats


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'build-log.html'
    print(f'Processing {path}...')
    process_html(path)
