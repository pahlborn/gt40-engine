#!/usr/bin/env python3
"""
Comprehensive guide translation for build-log.html.
Adds <span class="de">...</span><span class="en">...</span> to ALL <li> elements in guide sections.
CSS toggles visibility based on html[lang].

Categories:
1. Already done (has dual spans) -> skip
2. Bilingual (EN + DE in parens) -> auto-split
3. Pure German -> add EN span
4. Pure English -> add DE span from dictionary
"""
import re
import html as htmlmod
import sys

# ============================================================
# COMPREHENSIVE EN -> DE DICTIONARY
# For pure English lines that need German translation
# ============================================================
EN_DE = {
    # ---- Phase 1 Steps ----
    # Step 1
    '<strong>Sealing Surfaces (Dichtfl&auml;chen):</strong> Deck, intake rails, timing cover face &ndash; no nicks or burrs':
        '<strong>Dichtfl&auml;chen:</strong> Deck, Ansaugschienen, Steuerkettendeckel &ndash; keine Kerben oder Grate',
    '~30 min. incl. unpacking &amp; mounting':
        '~30 Min. inkl. Auspacken &amp; Aufbauen',
    # Step 2
    '~45 min.': '~45 Min.',
    '~15 min.': '~15 Min.',
    '~20 min.': '~20 Min.',
    '~30 min.': '~30 Min.',
    '~60 min.': '~60 Min.',
    '~90 min.': '~90 Min.',
    '~2 hours': '~2 Stunden',
    '~1 hour': '~1 Stunde',
    # Step 4
    'Dial indicator on straightedge over bore (method documentation)':
        'Messuhr auf Haarlineal ueber Bohrung (Dokumentation der Methode)',
    'Reading at Cyl 1 and Cyl 5':
        'Messwert bei Zyl. 1 und Zyl. 5',
    # Step 5
    'Crankshaft turns smoothly through full 720&deg;':
        'Kurbelwelle dreht gleichmaessig ueber volle 720&deg;',
    'No sudden resistance or binding':
        'Keine ploetzlichen Widerstandsaenderungen oder Klemmen',
    'No noises (scraping, clicking)':
        'Keine Geraeusche (Schleifen, Klicken)',
    'Turn at flywheel end by hand (more leverage)':
        'Am Schwungrad-Ende von Hand drehen (mehr Hebelwirkung)',
    'Binding = bearing issue or debris in oil gallery':
        'Klemmen = Lagerproblem oder Fremdkoerper im Oelkanal',
    # Step 7
    '<strong>R351:</strong> Oil holes on camshaft side (standard for BOSS block)':
        '<strong>R351:</strong> Oelbohrungen auf Nockenwellenseite (Standard fuer BOSS-Block)',
    '<strong>J351:</strong> Offset oil holes (rare, older blocks)':
        '<strong>J351:</strong> Versetzte Oelbohrungen (selten, aeltere Bloecke)',
    'BOSS 302 block has factory-installed R351 bearings':
        'BOSS-302-Block hat werkseitig R351-Lager eingebaut',
    'Compare cam journal measurement (next step) against bearing I.D. for actual clearance':
        'Nockenwellen-Zapfenmass (naechster Schritt) mit Lager-Innendurchmesser vergleichen fuer tatsaechliches Lagerspiel',
    'Oil holes MUST align with block galleries after installation!':
        'Oelbohrungen MUESSEN nach Einbau mit Block-Kanaelen fluchten!',
    # Step 8
    'Lower bearing shells into main caps (tab in notch, <strong>NO oil</strong> on bearing surface)':
        'Untere Lagerschalen in Hauptlagerdeckel einlegen (Nase in Nut, <strong>KEIN Oel</strong> auf Lagerflaeche)',
    'Upper shells into block saddles':
        'Obere Schalen in Blocksattel einlegen',
    'Crankshaft onto upper shells':
        'Kurbelwelle auf obere Schalen auflegen',
    'Plastigage strip on main journal &ndash; across full width, <strong>NOT on oil channel</strong>':
        'Plastigage-Streifen auf Hauptlagerzapfen &ndash; ueber gesamte Breite, <strong>NICHT auf Oelkanal</strong>',
    'Main cap on, torque to spec. <strong>DO NOT ROTATE CRANK!</strong>':
        'Lagerdeckel aufsetzen, auf Drehmoment anziehen. <strong>KURBELWELLE NICHT DREHEN!</strong>',
    'Remove cap, compare crushed width to scale &rarr; bearing clearance':
        'Deckel abnehmen, Quetschbreite mit Skala vergleichen &rarr; Lagerspiel',
    'Record value, remove all Plastigage residue':
        'Wert notieren, alle Plastigage-Rueckstaende entfernen',
    'Repeat for all 5 main bearings':
        'Fuer alle 5 Hauptlager wiederholen',
    # Step 9
    'Mount dial indicator axially against crank snout or flywheel flange':
        'Messuhr axial an Kurbelwellenstumpf oder Schwungradflansch montieren',
    'Push crank fully forward, zero the gauge':
        'Kurbelwelle ganz nach vorne druecken, Messuhr auf Null',
    'Push crank fully rearward, read value':
        'Kurbelwelle ganz nach hinten druecken, Wert ablesen',
    'That reading = crankshaft endplay':
        'Dieser Wert = Kurbelwellen-Axialspiel',
    'Too much play = thrust bearing worn or wrong':
        'Zu viel Spiel = Drucklager verschlissen oder falsch',
    'Too little play = crank binds when hot (thermal expansion)':
        'Zu wenig Spiel = Kurbelwelle klemmt bei Betriebstemperatur (Waermeausdehnung)',
    # Step 10
    'Cam card included? (Intake Centerline for degreeing)':
        'Cam-Card dabei? (Intake Centerline fuer Degreeing)',
    '<strong>NEVER</strong> use abrasives on lobe surfaces!':
        '<strong>NIEMALS</strong> Schleifmittel auf Nockenflaechen verwenden!',
    # Step 11
    'Measure at 2 positions per journal (0&deg; and 90&deg;)':
        'Jeden Zapfen an 2 Positionen messen (0&deg; und 90&deg;)',
    # Step 12
    'Count: 16 pcs':
        'Anzahl: 16 Stueck',
    'Rollers spin freely (check each one individually)':
        'Rollen drehen frei (jede einzeln pruefen)',
    'Link-bar mechanism functions correctly':
        'Link-Bar-Mechanismus funktioniert einwandfrei',
    # Step 13
    '16 pcs, trunnion (pivot pin) with no axial play':
        '16 Stueck, Drehpunkt (Achsbolzen) ohne Axialspiel',
    'Roller tip spins freely':
        'Rollenspitze dreht frei',
    'Ratio 1.6:1 confirmed on packaging':
        'Uebersetzung 1,6:1 auf Verpackung bestaetigt',
    # Step 14
    'Polylocks replace standard adjusting nuts &ndash; they lock the rocker adjustment permanently':
        'Polylocks ersetzen Standard-Einstellmuttern &ndash; fixieren die Kipphebel-Einstellung dauerhaft',
    'Set screw tightens against stud threads to prevent rotation &ndash; critical for maintaining valve preload':
        'Madenschraube klemmt gegen Bolzengewinde &ndash; kritisch fuer Ventilvorspannung',
    'Keep 1&ndash;2 spares in toolbox for Phase 3 assembly':
        '1&ndash;2 Ersatz im Werkzeugkasten fuer Phase 3 bereithalten',
    # Step 15
    # Step 16
    'Grease/vaseline for sealing':
        'Fett/Vaseline zum Abdichten',
    'Measuring fluid (isopropanol + food coloring)':
        'Messfluessigkeit (Isopropanol + Lebensmittelfarbe)',
    'Valves must be closed for measurement (springs hold them shut)':
        'Ventile muessen fuer die Messung geschlossen sein (Federn halten sie zu)',
    'Seal spark plug hole with old plug':
        'Zuendkerzenloch mit alter Kerze abdichten',
    'Air escapes through the hole in the CC plate':
        'Luft entweicht durch die Bohrung in der CC-Platte',
    'Spread &gt; 1 cc between chambers = head needs resurfacing':
        'Spreizung &gt; 1 cc zwischen Brennraeumen = Kopf muss geplant werden',
    # Step 17
    'AFR 1399 heads come with #6411 studs pre-installed &ndash; verify they were not removed during shipping':
        'AFR 1399 Koepfe werden mit #6411 Stehbolzen geliefert &ndash; pruefen ob beim Versand nicht entfernt',
    'Studs must be compatible with COMP 1632-16 rockers (7/16&quot; stud mount confirmed)':
        'Stehbolzen muessen mit COMP 1632-16 Kipphebeln kompatibel sein (7/16&quot; Bolzenmontage bestaetigt)',
    'Screw-in studs are mandatory for high-lift cams &ndash; press-in studs pull out under spring pressure':
        'Schraubbolzen sind Pflicht bei High-Lift-Nocken &ndash; Pressbolzen ziehen sich unter Federdruck heraus',
    # Step 18
    'AFR 1399 heads ship with springs and retainers pre-installed &ndash; confirm correct parts':
        'AFR 1399 Koepfe werden mit vorinstallierten Federn und Federtellern geliefert &ndash; korrekte Teile bestaetigen',
    'Titanium retainers are ~40% lighter than steel = less valvetrain mass = higher RPM capability':
        'Titan-Federteller sind ~40% leichter als Stahl = weniger Ventiltriebmasse = hoehere Drehzahlfaehigkeit',
    'Verify spring and retainer combination matches cam specifications (installed height + seat/open pressure)':
        'Feder-Federteller-Kombination muss zu Nockenwellenspezifikation passen (Einbauhoehe + Sitz-/Oeffnungsdruck)',
    '7&deg; keepers required for titanium retainers &ndash; check next step (#22)':
        '7&deg;-Ventilkeile erforderlich fuer Titan-Federteller &ndash; naechster Schritt (#22) pruefen',
    # Step 19
    'Measure without spring: install retainer + keepers, measure gap from spring seat to retainer underside':
        'Ohne Feder messen: Federteller + Keile einbauen, Abstand Federsitz bis Federteller-Unterseite messen',
    'Spread &gt; 0.030&quot; (0.76 mm) between valves = rework valve seats or use shims':
        'Spreizung &gt; 0,030&quot; (0,76 mm) zwischen Ventilen = Ventilsitze nacharbeiten oder Shims verwenden',
    # Step 20
    '<strong>Max. Valve Lift (exhaust):</strong> 0.565&quot; (14.35 mm) &ndash; this IS the valve lift (at-the-valve, not lobe lift)':
        '<strong>Max. Ventilhub (Auslass):</strong> 0,565&quot; (14,35 mm) &ndash; dies IST der Ventilhub (am Ventil, nicht Nockenhub)',
    '<strong>Formula:</strong> Installed Height &minus; Max Lift &minus; Coil Bind Height = Clearance':
        '<strong>Formel:</strong> Einbauhoehe &minus; Max. Hub &minus; Blocklhoehe = Freigang',
    'Clearance must be &ge; 0.060&quot; (1.52 mm), otherwise spring or retainer failure':
        'Freigang muss &ge; 0,060&quot; (1,52 mm) betragen, sonst Feder- oder Federteller-Bruch',
    'Coil bind height is on the spring data sheet (PAC/AFR #8605)':
        'Blockhoehe steht auf dem Feder-Datenblatt (PAC/AFR #8605)',
    # Step 21
    'Excessive open pressure overloads Morel 5327 link-bars':
        'Zu hoher Oeffnungsdruck ueberlastet Morel 5327 Link-Bars',
    'Morel recommendation: max. ~400 lbs open for hydraulic roller':
        'Morel-Empfehlung: max. ~400 lbs Oeffnungsdruck fuer Hydraulik-Roller',
    # Step 22
    '7&deg; keepers are standard for titanium retainers &ndash; 10&deg; keepers will NOT lock properly':
        '7&deg;-Keile sind Standard fuer Titan-Federteller &ndash; 10&deg;-Keile halten NICHT korrekt',
    'Mix-up between 7&deg; and 10&deg; = valve drops into cylinder = catastrophic engine failure':
        'Verwechslung zwischen 7&deg; und 10&deg; = Ventil faellt in Zylinder = katastrophaler Motorschaden',
    'Keep 2&ndash;4 spare keepers in toolbox &ndash; tiny parts that easily get lost during assembly':
        '2&ndash;4 Ersatzkeile im Werkzeugkasten &ndash; winzige Teile die bei der Montage leicht verloren gehen',
    'AFR ships correct keepers pre-installed &ndash; verify they match retainer spec sheet':
        'AFR liefert korrekte Keile vorinstalliert &ndash; pruefen ob sie zum Federteller-Datenblatt passen',
    # Step 23 (Rod Bearing)
    'Torque wrench for rod bolts: 35&ndash;45 ft-lbs (47&ndash;61 Nm)':
        'Drehmomentschluessel fuer Pleuelschrauben: 35&ndash;45 ft-lbs (47&ndash;61 Nm)',
    'Rod bores clean, dry &amp; grease-free':
        'Pleuelbohrungen sauber, trocken &amp; fettfrei',
    'Crank rod journals clean':
        'Kurbelwellen-Pleuelzapfen sauber',
    'Insert bearing shell in rod (tab in notch, <strong>NO oil</strong> on bearing surface)':
        'Lagerschale in Pleuel einlegen (Nase in Nut, <strong>KEIN Oel</strong> auf Lagerflaeche)',
    'Insert bearing shell in cap':
        'Lagerschale in Deckel einlegen',
    'Place Plastigage strip on rod journal &ndash; across full width':
        'Plastigage-Streifen auf Pleuelzapfen legen &ndash; ueber gesamte Breite',
    'Install cap, torque to 35&ndash;45 ft-lbs (47&ndash;61 Nm). <strong>DO NOT ROTATE CRANK!</strong>':
        'Deckel montieren, auf 35&ndash;45 ft-lbs (47&ndash;61 Nm) anziehen. <strong>KURBELWELLE NICHT DREHEN!</strong>',
    'Remove cap, compare crushed width to scale &rarr; bearing clearance':
        'Deckel abnehmen, Quetschbreite mit Skala vergleichen &rarr; Lagerspiel',
    'Record value, remove all Plastigage residue. Repeat for all 8 rods':
        'Wert notieren, Plastigage-Rueckstaende entfernen. Fuer alle 8 Pleuel wiederholen',
    # Step 24 (Ring End Gap)
    'Feeler gauge 0.010&quot;&ndash;0.035&quot; (0.25&ndash;0.89 mm)':
        'Fuehlerlehre 0,010&quot;&ndash;0,035&quot; (0,25&ndash;0,89 mm)',
    'Piston ring file (if adjustment needed)':
        'Kolbenring-Feile (falls Anpassung noetig)',
    'Ring compressor 4.000&quot; (101.6 mm) bore':
        'Ringspannband 4,000&quot; (101,6 mm) Bohrung',
    'Place ring into cylinder without piston':
        'Ring ohne Kolben in Zylinder einsetzen',
    'Push square with inverted piston ~1&quot; (25 mm) below deck':
        'Mit umgedrehtem Kolben rechtwinklig ~1&quot; (25 mm) unter Deck schieben',
    'Measure gap with feeler gauge':
        'Spalt mit Fuehlerlehre messen',
    'Repeat for each cylinder with its assigned ring':
        'Fuer jeden Zylinder mit zugeordnetem Ring wiederholen',
    '<strong>Always measure in the actual cylinder</strong> &ndash; bore diameters vary between cylinders':
        '<strong>Immer im tatsaechlichen Zylinder messen</strong> &ndash; Bohrungsdurchmesser variieren',
    'Too small gap = ring breaks at temperature (thermal expansion). Too large gap = increased blowby':
        'Zu kleiner Spalt = Ring bricht bei Temperatur (Waermeausdehnung). Zu grosser Spalt = erhoehter Blowby',
    '<strong>Ring End Gap Adjustment:</strong> File from both ends equally, deburr with 400 grit':
        '<strong>Ringstoß-Anpassung:</strong> Von beiden Enden gleichmaessig feilen, mit 400er Korn entgraten',
    '<strong>Ring Clocking:</strong> Top ring gap ~1 o&rsquo;clock, 2nd ring gap ~11 o&rsquo;clock, oil ring rails &amp; expander offset from each other':
        '<strong>Ring-Versatz:</strong> Erster Ringstoss ~1 Uhr, zweiter Ringstoss ~11 Uhr, Oelring-Schienen &amp; Expander zueinander versetzt',
    # Step 25 (ARP Head Studs) - mostly German already
    'ARP spec sheet (included in kit)':
        'ARP-Datenblatt (im Kit enthalten)',
    # Step 26 (Cam Bolt)
    'Thread condition: no damage, clean threads':
        'Gewindezustand: kein Schaden, saubere Gewinde',
    'Hardened washer present (flat, not spring washer)':
        'Gehaertete Scheibe vorhanden (flach, keine Federring)',
    'ARP lube sachet included':
        'ARP-Schmiermittel-Beutel enthalten',
    'Compare thread length vs. cam snout depth &ndash; bolt must not bottom out':
        'Gewindelaenge mit Nockenwellennase-Tiefe vergleichen &ndash; Schraube darf nicht auf Block stossen',
    # Step 27 (Timing Set)
    'Ford M-6268-A302 is a double-roller set &ndash; superior to single-roller OEM':
        'Ford M-6268-A302 ist ein Doppelrollen-Satz &ndash; ueberlegen gegenueber Einfachrollen-OEM',
    'Verify keyway position before Phase 3: &quot;0&quot; / STD for initial build':
        'Passfeder-Position vor Phase 3 pruefen: &quot;0&quot; / STD fuer Erstaufbau',
    'Timing marks must point toward each other (dot-to-dot) at TDC #1':
        'Steuermarken muessen bei OT #1 aufeinander zeigen (Punkt-zu-Punkt)',

    # ---- Phase 2 Steps ----
    # Step 1 (Cam Bearings)
    'Phase 1: cam bearing type (R351/J351) identified':
        'Phase 1: Nockenwellen-Lagertyp (R351/J351) bestimmt',
    'Phase 1: cam journal diameters measured':
        'Phase 1: Nockenwellen-Zapfendurchmesser gemessen',
    'Calculate actual clearance: Bearing I.D. &minus; Journal &oslash;':
        'Tatsaechliches Lagerspiel berechnen: Lager-I.D. &minus; Zapfen-&oslash;',
    'Brass or plastic hammer':
        'Messing- oder Kunststoffhammer',
    # Step 2 (Cam Install)
    'Long bolt 5/16"-18 &times; 4" (7.94 mm &times; 102 mm) as guide handle (in cam nose thread)':
        'Langer Bolzen 5/16"-18 &times; 4" (7,94 mm &times; 102 mm) als Fuehrungsgriff (in Nockenwellennase-Gewinde)',
    '<strong>Assembly lube</strong> (COMP 159 or equivalent) on ALL lobes':
        '<strong>Montagepaste</strong> (COMP 159 oder gleichwertig) auf ALLE Nocken',
    '<strong>Engine oil</strong> on all 5 journals':
        '<strong>Motoroel</strong> auf alle 5 Lagerzapfen',
    'Insert cam straight and slowly &ndash; lobes must NEVER touch bearing shells':
        'Nockenwelle gerade und langsam einschieben &ndash; Nocken duerfen NIEMALS Lagerschalen beruehren',
    'The long bolt as handle gives control &ndash; without it the cam slides in uncontrolled':
        'Der lange Bolzen als Griff gibt Kontrolle &ndash; ohne ihn gleitet die Nockenwelle unkontrolliert',
    'Tilt block slightly rearward (rear end lower) &ndash; gravity helps':
        'Block leicht nach hinten kippen (Hinterseite tiefer) &ndash; Schwerkraft hilft',
    # Step 3 (Timing Set Install)
    'Install thrust plate (retaining plate) with bolts finger-tight':
        'Anlaufscheibe (Halteplatte) mit Schrauben handfest montieren',
    'Install crank sprocket on crankshaft keyway':
        'Kurbelwellen-Zahnrad auf Passfeder montieren',
    'Install cam sprocket &ndash; use &ldquo;0&rdquo;/STD keyway position':
        'Nockenwellenrad montieren &ndash; Passfeder-Position &bdquo;0&ldquo;/STD verwenden',
    'Route chain over both sprockets &ndash; timing marks dot-to-dot':
        'Kette ueber beide Zahnraeder fuehren &ndash; Steuermarken Punkt-zu-Punkt',
    # Step 4 (Cam Endplay)
    'Screwdriver for prying (carefully!)':
        'Schraubendreher zum Hebeln (vorsichtig!)',
    # Step 5 (Test Lifter)
    'Camshaft installed and timing set in place':
        'Nockenwelle eingebaut und Steuertrieb montiert',
    'One COMP hydraulic roller lifter (from set of 16) ready':
        'Ein COMP Hydraulik-Roller-Stoessel (aus 16er-Set) bereit',
    'Rotate crank so #1 intake lobe is on base circle (Grundkreis)':
        'Kurbelwelle drehen bis #1 Einlassnocken auf Grundkreis steht',
    'Identify #1 intake lifter bore (passenger side, front)':
        '#1 Einlass-Stoesselbohrung identifizieren (Beifahrerseite, vorne)',
    'Assembly lube (COMP #106 or equivalent)':
        'Montagepaste (COMP #106 oder gleichwertig)',
    'Clean lint-free cloth':
        'Sauberes fusselfreies Tuch',
    'Flashlight for bore inspection':
        'Taschenlampe zur Bohrungsinspektion',
    'Long screwdriver or pushrod to check lifter rotation':
        'Langer Schraubendreher oder Stoeselstange zum Pruefen der Stoessel-Drehung',
    'This is a test lifter only &ndash; used for degreeing cam and checking pushrod length':
        'Dies ist nur ein Test-Stoessel &ndash; zum Degreeing und Stoeselstangen-Laenge pruefen',
    'If lifter binds in bore: check for burrs, debris, or wrong lifter diameter':
        'Bei Klemmen: auf Grate, Schmutz oder falschen Stoessel-Durchmesser pruefen',
    'Hydraulic roller lifters use link bars to prevent rotation &ndash; link bar not needed for single test lifter, but verify roller alignment manually':
        'Hydraulik-Roller-Stoessel verwenden Link-Bars gegen Drehung &ndash; Link-Bar nicht noetig fuer einzelnen Teststoessel, Rollenausrichtung manuell pruefen',
    'Lifter-to-bore clearance: 0.0010"&ndash;0.0025" (0.025&ndash;0.064 mm) typical':
        'Stoessel-zu-Bohrung-Spiel: 0,0010"&ndash;0,0025" (0,025&ndash;0,064 mm) typisch',
    # Step 6 (Degreeing)
    'Degree wheel &ge; 9" (229 mm) diameter':
        'Gradscheibe &ge; 9" (229 mm) Durchmesser',
    'Dial indicator with lifter adapter':
        'Messuhr mit Stoessel-Adapter',
    'Piston stop (steel or rubber)':
        'Kolbenstopp (Stahl oder Gummi)',
    'Checking spring (light spring, replaces valve spring)':
        'Prueffeder (leichte Feder, ersetzt Ventilfeder)',
    '<strong>1.</strong> Mount degree wheel on crank snout, pointer on block':
        '<strong>1.</strong> Gradscheibe auf Kurbelwellenstumpf montieren, Zeiger am Block',
    '<strong>2.</strong> Find true TDC: install piston stop, rotate crank against stop (both directions), split the difference = TDC':
        '<strong>2.</strong> Echten OT finden: Kolbenstopp einbauen, Kurbel gegen Stopp drehen (beide Richtungen), Mitte = OT',
    '<strong>3.</strong> Place dial indicator on #1 intake lifter':
        '<strong>3.</strong> Messuhr auf #1 Einlass-Stoessel setzen',
    '<strong>4.</strong> Slowly rotate crank, find max lift point':
        '<strong>4.</strong> Kurbel langsam drehen, maximalen Hubpunkt finden',
    '<strong>5.</strong> Read degree wheel at .050" (1.27 mm) lifter rise on each side of max lift':
        '<strong>5.</strong> Gradscheibe bei 0,050" (1,27 mm) Stoesselerhebung auf jeder Seite des Max-Hubs ablesen',
    '<strong>6.</strong> Midpoint = Intake Centerline (ICL)':
        '<strong>6.</strong> Mittelpunkt = Intake Centerline (ICL)',
    'Degree wheel with pointer at TDC':
        'Gradscheibe mit Zeiger bei OT',
    'Dial indicator reading at .050" opening and closing':
        'Messuhr-Ablesung bei 0,050" Oeffnen und Schliessen',
    # Step 7 (Lifter Install All)
    'Align link-bars parallel to cam, flat side facing valley':
        'Link-Bars parallel zur Nocke ausrichten, flache Seite zum Tal',
    'Note positions or label &ndash; reinstall in same position if removed!':
        'Positionen notieren oder beschriften &ndash; bei Ausbau in gleicher Position wieder einbauen!',
    'Lifters must slide freely in their bores':
        'Stoessel muessen frei in ihren Bohrungen gleiten',
    # Step 8 (Mock-up Head)
    'Finger-tight with a few nuts only &ndash; no torque needed':
        'Nur mit wenigen Muttern handfest &ndash; kein Drehmoment noetig',
    'Head must sit on dowel pins &ndash; must not shift':
        'Kopf muss auf Passhuelsen sitzen &ndash; darf nicht verrutschen',
    # Step 9 (Guide Plates)
    'COMP Cams flat-style guide plates (for AFR 1399 heads)':
        'COMP Cams Fuehrungsplatten, flache Bauform (fuer AFR 1399 Koepfe)',
    'Cylinder head(s) mock-installed with gasket and finger-tight nuts':
        'Zylinderkopf/-koepfe probehalber mit Dichtung und handfest montiert',
    'Lifters installed in bores':
        'Stoessel in Bohrungen eingebaut',
    'Checking pushrod or final pushrods available':
        'Pruef-Stoeselstange oder finale Stoeselstangen bereit',
    '3/8" socket or wrench for guide plate bolts':
        '3/8"-Nuss oder Schluessel fuer Fuehrungsplatten-Schrauben',
    'Rocker arm studs installed in head':
        'Kipphebel-Stehbolzen im Kopf montiert',
    'Straightedge or pushrod for alignment check':
        'Haarlineal oder Stoeselstange zur Fluchtpruefung',
    'Flashlight for visual inspection':
        'Taschenlampe zur Sichtpruefung',
    'AFR 1399 heads use pedestal-mount rockers &ndash; verify guide plate is compatible with stud spacing':
        'AFR 1399 verwenden Sockel-Kipphebel &ndash; Kompatibilitaet Fuehrungsplatte mit Bolzenabstand pruefen',
    'If pushrod contacts slot edge: wrong guide plate type, incorrect pushrod length, or misaligned rocker stud':
        'Bei Kontakt Stoeselstange-Schlitzkante: falscher Fuehrungsplatten-Typ, falsche Stoeselstangenlaenge oder schiefer Stehbolzen',
    'Do NOT fully torque guide plates during mock-up &ndash; finger-tight only, final torque in Phase 3':
        'Fuehrungsplatten beim Probeaufbau NICHT fest anziehen &ndash; nur handfest, finales Drehmoment in Phase 3',
    'Some builders lightly scuff pushrod with marker to check for guide plate contact marks':
        'Manche Motorenbauer markieren die Stoeselstange leicht mit Filzstift um Fuehrungsplatten-Kontaktspuren zu pruefen',
    # Step 10 (Pushrod Length)
    'CNC-TC6878 Checking Pushrod (adjustable)':
        'CNC-TC6878 Pruef-Stoeselstange (verstellbar)',
    # Step 12 (PTV)
    'Razor blade / scalpel for cutting':
        'Rasiermesser / Skalpell zum Schneiden',
    'If clearance too small: deepen valve pockets, use thicker gasket, or adjust cam timing':
        'Bei zu wenig Freigang: Ventiltaschen vertiefen, dickere Dichtung verwenden oder Steuerzeiten anpassen',
    'Always measure on the tightest cylinder (highest piston deck, smallest valve pocket)':
        'Immer am engsten Zylinder messen (hoechste Kolbenposition, kleinste Ventiltasche)',
    'Clay before measurement (mark thinnest point)':
        'Knetmasse vor Messung (duennste Stelle markieren)',
    'Caliper on clay cross-section':
        'Messschieber auf Knetmasse-Querschnitt',
    # Step 13 (Quench)
    'Solder wire ~0.060"&ndash;0.090" (1.52&ndash;2.29 mm) diameter (lead-free)':
        'Loetdraht ~0,060"&ndash;0,090" (1,52&ndash;2,29 mm) Durchmesser (bleifrei)',
    'Grease (to hold solder in place)':
        'Fett (zum Fixieren des Loetdrahts)',
    '<strong>Alternative method:</strong> Measure piston-to-deck with dial indicator (without head) and add compressed gasket thickness. Less accurate but non-destructive.':
        '<strong>Alternative Methode:</strong> Kolbenstand mit Messuhr messen (ohne Kopf) und komprimierte Dichtungsdicke addieren. Weniger genau aber zerstoerungsfrei.',
    'Quench too large = less detonation resistance, less efficient combustion':
        'Quench zu gross = weniger Klopffestigkeit, weniger effiziente Verbrennung',
    'Quench too small = piston may contact head (thermal expansion at operating temp)':
        'Quench zu klein = Kolben kann Kopf beruehren (Waermeausdehnung bei Betriebstemperatur)',
    # Step 15 (Intake Gasket)
    'Port alignment: intake port must align with head port (witness marks)':
        'Port-Fluchtung: Ansaugkanal muss mit Kopf-Kanal fluchten (Markierungen)',
    'Max. mismatch: &lt; 1/16" (1.59 mm) &ndash; otherwise flow loss':
        'Max. Versatz: &lt; 1/16" (1,59 mm) &ndash; sonst Stroemungsverlust',
    'Check 4 corner fitment (block-to-pan rail area)':
        '4-Ecken-Passung pruefen (Block-zu-Wannenschiene)',
    # Step 16 (Oil Pump dry-fit)
    'Melling M-68 oil pump ready (or Ford M-6600-D2)':
        'Melling M-68 Oelpumpe bereit (oder Ford M-6600-D2)',
    'Oil pump intermediate drive shaft (ARP or OEM)':
        'Oelpumpen-Zwischenwelle (ARP oder OEM)',
    'Block rear main area accessible':
        'Block-Bereich hinteres Hauptlager zugaenglich',
    '3/4&quot; combination wrench (19 mm)':
        '3/4&quot; Maulschluessel (19 mm)',
    'Long screwdriver for alignment':
        'Langer Schraubendreher zur Ausrichtung',
    'Inspection mirror':
        'Inspektionsspiegel',
    'If shaft won&rsquo;t engage cam gear: rotate crank slightly to align gears':
        'Wenn Welle nicht in Nockenwellen-Zahnrad greift: Kurbel leicht drehen fuer Zahnrad-Ausrichtung',
    'Shaft must NOT bottom out against cam gear &ndash; verify 0.010&quot;&ndash;0.030&quot; (0.25&ndash;0.76 mm) clearance':
        'Welle darf NICHT gegen Nockenwellen-Zahnrad aufsetzen &ndash; 0,010&quot;&ndash;0,030&quot; (0,25&ndash;0,76 mm) Freigang pruefen',
    'Mark orientation of pump body for Phase 3 reinstall':
        'Ausrichtung des Pumpenkoerpers fuer Phase-3-Wiedereinbau markieren',
    # Step 17 (Timing Cover dry-fit)
    'Timing chain and sprockets installed from degreeing step':
        'Steuerkette und Zahnraeder vom Degreeing-Schritt montiert',
    'Ford timing cover + gasket ready':
        'Ford Steuerkettendeckel + Dichtung bereit',
    'Front crank seal ready (do NOT install yet &ndash; dry fit only)':
        'Vorderer Kurbelwellendichtring bereit (noch NICHT einbauen &ndash; nur Probepassung)',
    'Straightedge for gasket alignment check':
        'Haarlineal zur Dichtungs-Fluchtpruefung',
    'Cover goes on BEFORE oil pan &ndash; pan seals against cover bottom edge':
        'Deckel kommt VOR der Oelwanne &ndash; Wanne dichtet gegen Deckel-Unterkante ab',
    'Aftermarket covers may need trimming at pan rail &ndash; check now, not during final assembly':
        'Nachmarkt-Deckel brauchen evtl. Nacharbeit an der Wannenschiene &ndash; jetzt pruefen, nicht bei Endmontage',
    'Note bolt lengths &ndash; Ford covers often use 2&ndash;3 different lengths':
        'Schraubenlaengen notieren &ndash; Ford-Deckel verwenden oft 2&ndash;3 verschiedene Laengen',
    # Step 18 (Oil Pan dry-fit)
    'Canton Road Race pan #15-644 (or selected pan) ready':
        'Canton Road Race Wanne #15-644 (oder gewaehlte Wanne) bereit',
    'Oil pump + pickup installed from previous step':
        'Oelpumpe + Saugrohr vom vorherigen Schritt montiert',
    'Pan gaskets (side rails + end seals) ready for dry check':
        'Wannen-Dichtungen (Seitenschienen + Enddichtungen) fuer Trockentest bereit',
    'Ruler or caliper for pickup clearance measurement':
        'Lineal oder Messschieber zur Pickup-Freigang-Messung',
    'Flashlight for internal inspection':
        'Taschenlampe zur Inneninspektion',
    'Canton Road Race pans are deeper in rear &ndash; verify chassis ground clearance for mid-engine applications':
        'Canton Road Race Wannen sind hinten tiefer &ndash; Bodenfreiheit fuer Mittelmotor-Anwendungen pruefen',
    'Mark pickup-to-pan measurement for Phase 3 verification':
        'Pickup-zu-Wanne-Mass fuer Phase-3-Pruefung markieren',
    'Check for interference with steering rack, crossmember, or frame rails if applicable':
        'Auf Kollision mit Lenkgetriebe, Quertraeger oder Laengsholm pruefen falls zutreffend',
    # Step 19 (Pickup-to-Pan)
    'Ruler, caliper, or bent wire gauge':
        'Lineal, Messschieber oder gebogene Drahtlehre',
    'If clearance is wrong, bend pickup tube carefully (small adjustments only!) or use a different pickup':
        'Bei falschem Abstand: Saugrohr vorsichtig biegen (nur kleine Anpassungen!) oder anderen Pickup verwenden',
    'This is the MOST critical oil system dimension &ndash; recheck in Phase 3 before final pan installation':
        'Dies ist das KRITISCHSTE Oelsystem-Mass &ndash; in Phase 3 vor endgueltiger Wannenmontage nochmals pruefen',
    'Mid-engine/track cars: err toward closer (1/4&quot;) to prevent uncovering under G-loads':
        'Mittelmotor/Rennwagen: eher naeher (1/4&quot;) um Freilegen unter G-Kraeften zu vermeiden',
    # Step 20 (Valve Cover Clearance)
    'Rockers + polylocks installed on at least test cylinder':
        'Kipphebel + Polylocks auf mindestens einem Testzylinder montiert',
    'Valve covers + gaskets ready':
        'Ventildeckel + Dichtungen bereit',
    # Step 21 (Distributor Clearance)
    'MSD distributor ready (Pro-Billet or Ready-to-Run)':
        'MSD-Verteiler bereit (Pro-Billet oder Ready-to-Run)',
    'Intake manifold dry-fitted or in place from step 15':
        'Ansaugspinne trocken eingebaut oder von Schritt 15 vorhanden',
    'Crank at TDC #1 compression stroke':
        'Kurbelwelle bei OT #1 Kompressionstakt',
    '1/2&quot; open-end wrench for hold-down clamp':
        '1/2&quot; Maulschluessel fuer Halteklemme',
    'Flashlight for gear mesh inspection':
        'Taschenlampe zur Zahneingriff-Pruefung',
    'MSD distributors are slightly larger than stock Ford &ndash; verify clearance to intake plenum, A/C compressor, etc.':
        'MSD-Verteiler sind etwas groesser als Ford-Serie &ndash; Freigang zu Ansaugkammer, Klimakompressor etc. pruefen',
    'Note the number of teeth offset during insertion (gear helix causes ~1 tooth rotation)':
        'Zahnversatz beim Einsetzen notieren (Schraegverzahnung verursacht ~1 Zahn Drehung)',
    'If distributor won&rsquo;t seat fully: oil pump shaft may not be aligned &ndash; wiggle or rotate slightly':
        'Wenn Verteiler nicht ganz sitzt: Oelpumpenwelle evtl. nicht ausgerichtet &ndash; leicht wackeln oder drehen',
    'Mark distributor body position relative to block for Phase 3 reference':
        'Verteiler-Position relativ zum Block fuer Phase-3-Referenz markieren',
    # Step 22 (Pushrod Order)
    'Pushrod length determined in step 10 (checking pushrod)':
        'Stoesselstangenlaenge in Schritt 10 bestimmt (Pruef-Stoesselstange)',
    'Sweep check confirmed in step 11':
        'Sweep-Check in Schritt 11 bestaetigt',
    'Both intake and exhaust lengths documented':
        'Einlass- und Auslass-Laengen dokumentiert',
    'Order 1&ndash;2 extras per length in case of damage during assembly':
        '1&ndash;2 Stueck extra pro Laenge bestellen fuer den Fall von Montageschaeden',
    'Heat-treated chromoly is stronger than standard; recommended for hydraulic roller with high spring pressures':
        'Vergueteter Chromoly ist staerker als Standard; empfohlen fuer Hydraulik-Roller mit hohen Federdruecken',
    'Typical lead time: 1&ndash;3 weeks for custom lengths (Lieferzeit: 1&ndash;3 Wochen)':
        'Typische Lieferzeit: 1&ndash;3 Wochen fuer Sonderlaengen',
    # Step 23 (Disassembly)
    'Parts organizer trays':
        'Teile-Sortierkaesten',
    'Assembly lube (for coating bare surfaces)':
        'Montagepaste (zum Beschichten blanker Flaechen)',
    'Coat all bare metal surfaces (crank journals, cam lobes) with oil or assembly lube to prevent surface rust':
        'Alle blanken Metallflaechen (Kurbelwellenzapfen, Nocken) mit Oel oder Montagepaste gegen Oberflaechenrost schuetzen',
    'Store parts clean and dry in a dust-free area until Phase 3':
        'Teile sauber und trocken in staubfreier Umgebung bis Phase 3 lagern',

    # ---- Phase 3 ----
    # Blowout
    'Block on engine stand, deck surface accessible':
        'Block auf Motorstaender, Deckflaeche zugaenglich',
    'All head bolt holes visible (10 per side, 20 total)':
        'Alle Kopfschraubenbohrungen sichtbar (10 pro Seite, 20 gesamt)',
    'Flashlight for hole inspection':
        'Taschenlampe zur Bohrungskontrolle',
    'Flashlight to verify gasket alignment':
        'Taschenlampe zur Dichtungsfluchtung-Pruefung',
    'Water-jacket holes (lower positions 6&ndash;10) may have coolant residue &ndash; extra attention needed':
        'Wassermantel-Bohrungen (Positionen 6&ndash;10 unten) koennen Kuehlmittelrueckstaende haben &ndash; besonders sorgfaeltig',
    'Blind holes (upper positions 1&ndash;5) trap oil at the bottom &ndash; blow thoroughly':
        'Sacklochbohrungen (Positionen 1&ndash;5 oben) halten Oel am Boden &ndash; gruendlich ausblasen',
    'Run a thread chaser (NOT a tap!) through each hole if threads look dirty or damaged':
        'Gewindenachschneider (KEIN Gewindebohrer!) durch jede Bohrung laufen lassen bei verschmutzten oder beschaedigten Gewinden',
    'This step takes only 10&ndash;15 minutes but prevents catastrophic assembly errors':
        'Dieser Schritt dauert nur 10&ndash;15 Minuten, verhindert aber katastrophale Montagefehler',
    # ARP Lube
    'ARP 154-4003 head studs installed hand-tight in block':
        'ARP 154-4003 Kopfstehbolzen handfest im Block eingedreht',
    'ARP Ultra-Torque lubricant packet (included in stud kit)':
        'ARP Ultra-Torque Schmiermittel-Paeckchen (im Stehbolzen-Kit enthalten)',
    'ARP hardened washers (included in kit)':
        'ARP gehaertete Scheiben (im Kit enthalten)',
    '12-point ARP nuts (included in kit)':
        '12-Kant ARP-Muttern (im Kit enthalten)',
    'Clean cloth for wiping excess':
        'Sauberes Tuch zum Abwischen von Ueberschuss',
    'Small brush or finger for application':
        'Kleiner Pinsel oder Finger zum Auftragen',
    'One packet of Ultra-Torque from the ARP kit is usually enough for one engine &ndash; use it all':
        'Ein Paeckchen Ultra-Torque aus dem ARP-Kit reicht normalerweise fuer einen Motor &ndash; komplett aufbrauchen',
    'If you run out: ARP sells Ultra-Torque separately (ARP 100-9908)':
        'Bei Bedarf: ARP verkauft Ultra-Torque einzeln (ARP 100-9908)',
    'Apply lube just before torquing &ndash; do not let it sit overnight exposed to dust':
        'Schmiermittel direkt vor dem Anziehen auftragen &ndash; nicht ueber Nacht Staub ausgesetzt lassen',
    'Re-apply if studs are loosened and re-torqued (during re-torque after first heat cycle)':
        'Erneut auftragen wenn Bolzen geloest und nachgezogen werden (beim Nachziehen nach erstem Waermezyklus)',
    # Heads On
    'Helper recommended &ndash; AFR aluminum heads weigh ~25 lbs (11 kg) each':
        'Helfer empfohlen &ndash; AFR Aluminium-Koepfe wiegen ~11 kg pro Stueck',
    'ARP 12-point nuts + hardened washers (from stud kit)':
        'ARP 12-Kant-Muttern + gehaertete Scheiben (aus Stehbolzen-Kit)',
    'AFR aluminum heads are lighter than cast iron &ndash; easier to handle but still use a helper':
        'AFR Aluminium-Koepfe sind leichter als Gusseisen &ndash; einfacher zu handhaben, trotzdem Helfer einsetzen',
    'Verify the gasket did not shift after setting the head &ndash; peek through bolt holes with flashlight':
        'Pruefen ob Dichtung nach Kopfauflage nicht verrutscht ist &ndash; durch Schraubenbohrungen mit Taschenlampe blicken',
    'If a dowel pin is missing or damaged, do NOT proceed &ndash; head will shift under torque':
        'Wenn Passhuelse fehlt oder beschaedigt: NICHT weitermachen &ndash; Kopf verrutscht unter Drehmoment',
    # Cam Lube
    'COMP Cams XE274HR camshaft out of packaging, inspected for damage':
        'COMP Cams XE274HR Nockenwelle ausgepackt, auf Schaeden geprueft',
    'COMP Cams assembly lube #106 (included with cam or purchased separately)':
        'COMP Cams Montagepaste #106 (bei Nockenwelle dabei oder separat erhaeltlich)',
    'COMP Cams cam lube #106 &ndash; generous amount (gro&szlig;z&uuml;gig auftragen)':
        'COMP Cams Nocken-Paste #106 &ndash; grosszuegig auftragen',
    'Clean engine oil for journals as backup lubricant':
        'Sauberes Motoroel fuer Lagerzapfen als Reserve-Schmiermittel',
    'Latex gloves to keep contaminants off cam surfaces':
        'Latexhandschuhe um Verunreinigungen von Nockenflaechen fernzuhalten',
    'Hydraulic roller cams are less critical than flat tappet for break-in, but the distributor gear and journals still need protection during initial startup':
        'Hydraulik-Roller-Nocken sind beim Einlaufen weniger kritisch als Flachstoessel, aber Verteiler-Zahnrad und Lagerzapfen brauchen dennoch Schutz beim Erststart',
    'Work quickly after lubing &ndash; install cam promptly to minimize exposure to air/dust':
        'Nach dem Schmieren zuegig arbeiten &ndash; Nockenwelle zuegig einbauen um Staub-/Luftkontakt zu minimieren',
    # Cam Install
    'Cam bearings verified in correct position (oil holes aligned)':
        'Nockenwellenlager in korrekter Position bestaetigt (Oelbohrungen ausgerichtet)',
    'All cam lobes and journals lubed with COMP #106 (previous step)':
        'Alle Nocken und Lagerzapfen mit COMP #106 geschmiert (vorheriger Schritt)',
    'Block tilted slightly rearward if possible (gravity assists)':
        'Block wenn moeglich leicht nach hinten geneigt (Schwerkraft hilft)',
    '5/16"-18 &times; 6" long bolt as installation handle':
        '5/16"-18 &times; 6" langer Bolzen als Montage-Griff',
    'Additional COMP #106 lube for touch-up':
        'Zusaetzliche COMP #106 Paste zum Nachschmieren',
    'Clean gloves (saubere Handschuhe)':
        'Saubere Handschuhe',
    'Flashlight to watch bearing alignment during insertion':
        'Taschenlampe zur Ueberwachung der Lagerausrichtung beim Einschieben',
    'The long bolt as handle is essential &ndash; without it, the cam slides in uncontrolled and can damage bearings (ohne Griff gleitet die Nocke unkontrolliert)':
        'Der lange Bolzen als Griff ist unverzichtbar &ndash; ohne ihn gleitet die Nocke unkontrolliert und kann Lager beschaedigen',
    'Tilting the block rearward (rear lower) lets gravity help guide the cam in':
        'Block nach hinten kippen (Rueckseite tiefer) laesst die Schwerkraft beim Einfuehren helfen',
    'Ford 302 has 5 cam bearings &ndash; each one is a potential snag point for lobe edges':
        'Ford 302 hat 5 Nockenwellenlager &ndash; jedes ist ein potenzieller Haltepunkt fuer Nockenkanten',
    'If you feel a lobe catch on a bearing edge, the cam is not centered &ndash; never force it through':
        'Wenn eine Nocke an einer Lagerkante haengt, ist die Nockenwelle nicht zentriert &ndash; niemals mit Gewalt durchschieben',
    'Estimated time: ~15 min. with care':
        'Geschaetzte Dauer: ~15 Min. bei sorgfaeltigem Arbeiten',
    # Lifters (Phase 3)
    'All 16 COMP hydraulic roller lifters inspected (no damage, rollers spin freely)':
        'Alle 16 COMP Hydraulik-Roller-Stoessel geprueft (kein Schaden, Rollen drehen frei)',
    'Lifter bores clean and free of debris':
        'Stoesselbohrungen sauber und frei von Schmutz',
    'Link bar pairs identified (lifters must be installed in matched pairs)':
        'Link-Bar-Paare identifiziert (Stoessel muessen paarweise eingebaut werden)',
    'COMP Cams assembly lube #106 &ndash; for lifter bodies and bores':
        'COMP Cams Montagepaste #106 &ndash; fuer Stoesselkoerper und Bohrungen',
    'Clean engine oil as secondary lubricant':
        'Sauberes Motoroel als Zweit-Schmiermittel',
    'Clean lint-free cloths':
        'Saubere fusselfreie Tuecher',
    'Link bars prevent rotation &ndash; a rotated roller lifter will be destroyed by the cam lobe within seconds of engine start':
        'Link-Bars verhindern Drehung &ndash; ein gedrehter Roller-Stoessel wird beim Motorstart innerhalb von Sekunden durch den Nocken zerstoert',
    'If any lifter does not slide freely: check for burr in bore, wrong lifter diameter, or debris':
        'Wenn ein Stoessel nicht frei gleitet: auf Grat in Bohrung, falschen Stoesseldurchmesser oder Schmutz pruefen',
    'Install all lifters BEFORE the oil pump &ndash; easier access to valley area':
        'Alle Stoessel VOR der Oelpumpe einbauen &ndash; leichterer Zugang zum Tal-Bereich',
    # Oil Pump (Phase 3)
    # Oil Shaft
    'Oil pump mounted on rear main cap':
        'Oelpumpe auf hinterem Hauptlagerdeckel montiert',
    'Ford M-6605-B302 or ARP drive shaft ready':
        'Ford M-6605-B302 oder ARP Antriebswelle bereit',
    'ARP shaft is one-piece hardened steel &ndash; stronger than stock stamped shaft':
        'ARP-Welle ist einteilig gehaertet &ndash; staerker als serienmassig gestanzter Schaft',
    'This shaft also drives the distributor &ndash; alignment is critical for oil pressure AND ignition':
        'Diese Welle treibt auch den Verteiler &ndash; Ausrichtung kritisch fuer Oeldruck UND Zuendung',
    # Pickup
    # Head Gasket
    # Head Studs/ARP
    # Heads Torque - will get bilingual treatment
    # Intake - will get bilingual treatment
    # Distributor
    # Spark Plugs
    # Valve Covers
    # Water Pump
    # Timing Cover
    # Oil Pan
    # Balancer

    # ---- Phase 4 ----
    # (These tend to be bilingual already, handled by auto-split)
}

# ============================================================
# DE -> EN dictionary for pure German lines
# ============================================================
DE_EN = {
    # Step 3 (Deck Height) - procedure steps
    'Block sauber und frei von Dichtungsresten auf der Deckfl&auml;che.':
        'Block clean and free of gasket residue on deck surface.',
    'Tiefenmikrometer auf Null kalibrieren (auf Pr&uuml;fplatte oder Referenzfl&auml;che).':
        'Zero depth micrometer (on surface plate or reference surface).',
    'Tiefenmikrometer auf Deckfl&auml;che aufsetzen, Messstab in die Zylinderbohrung absenken bis zur Hauptlagergasse (Centerline).':
        'Place depth micrometer on deck surface, lower probe into cylinder bore to main bearing centerline.',
    'Alternativ: Hersteller-Angabe (Ford 302: 8.206&quot;) mit gemessenem Piston-to-Deck und Bauteil-Ma&szlig;en gegenpr&uuml;fen.':
        'Alternative: Cross-check manufacturer spec (Ford 302: 8.206&quot;) with measured piston-to-deck and component dimensions.',
    'Mindestens 4 Stellen pro Bank messen (vorne, hinten, links, rechts) &ndash; Abweichungen zeigen Verzug.':
        'Measure at least 4 positions per bank (front, rear, left, right) &ndash; deviations indicate warpage.',
    'Deck Height + Piston-to-Deck = Quench Distance (bestimmt Verdichtung &amp; Klopfneigung)':
        'Deck Height + Piston-to-Deck = Quench Distance (determines compression &amp; knock tendency)',
    'Abweichung &gt; 0.005&quot;: Block muss plangefr&auml;st werden (&quot;Deck the Block&quot;)':
        'Deviation &gt; 0.005&quot;: Block must be resurfaced (&quot;Deck the Block&quot;)',
    'Nach dem Planfr&auml;sen Deck Height erneut messen und dokumentieren':
        'After resurfacing, re-measure and document Deck Height',
    # Step 4 (Piston-to-Deck)
    'Kurbelwelle, Pleuel und Kolben (ohne Ringe!) einbauen.':
        'Install crankshaft, connecting rods, and pistons (without rings!).',
    'Kolben auf OT drehen: Kurbel langsam im Uhrzeigersinn drehen und den h&ouml;chsten Punkt des Kolbens finden.':
        'Rotate piston to TDC: Turn crank slowly clockwise and find highest piston point.',
    'Pr&auml;zisions-Haarlineal (Straightedge) quer &uuml;ber die Zylinderbohrung legen &ndash; es muss plan auf der Deckfl&auml;che aufliegen.':
        'Place precision straightedge across the cylinder bore &ndash; it must sit flat on the deck surface.',
    'Messuhr (Dial Indicator) mit Magnetstativ auf dem Haarlineal fixieren, Taster nach unten auf die Kolbenoberseite absenken.':
        'Mount dial indicator with magnetic base on straightedge, lower plunger down onto piston crown.',
    'Messuhr auf Null stellen. Kurbel minimal vor und zur&uuml;ck drehen, um den exakten OT (h&ouml;chster Ausschlag) zu best&auml;tigen.':
        'Zero the dial indicator. Rock crank slightly to confirm exact TDC (highest reading).',
    'Wert ablesen: Positiv = Kolben steht unter dem Deck (&quot;in the hole&quot;).':
        'Read value: Positive = piston sits below deck (&quot;in the hole&quot;).',
    'Jeden Zylinder an Druck- und Gegenseite (Thrust &amp; Anti-Thrust) messen und Durchschnitt bilden.':
        'Measure each cylinder at thrust and anti-thrust side and average.',
    'Alle 8 Zylinder durchmessen &ndash; Zyl. 1 + 5 zuerst (zeigt Block-Pr&auml;zision).':
        'Measure all 8 cylinders &ndash; Cyl. 1 + 5 first (shows block precision).',
    '<strong>Wichtigste Messung des gesamten Builds!</strong> Piston-to-Deck bestimmt Verdichtung, Quench und Kopfdichtungswahl.':
        '<strong>Most important measurement of the entire build!</strong> Piston-to-Deck determines compression, quench, and head gasket selection.',
    'Spreizung Zyl. 1 vs. 5 zeigt die Pr&auml;zision der Block-Bearbeitung':
        'Spread between Cyl. 1 vs. 5 shows block machining precision',
    'Kurbel auf exakten OT drehen (h&ouml;chster Punkt), nicht leicht daneben':
        'Rotate crank to exact TDC (highest point), not slightly off',
    'Jede Bohrung an Thrust- UND Anti-Thrust-Seite messen':
        'Measure each bore at thrust AND anti-thrust side',
    'Quench Distance = Piston-to-Deck + komprimierte Kopfdichtungs-Dicke (Ziel: 0.035&quot;&ndash;0.045&quot;)':
        'Quench Distance = Piston-to-Deck + compressed head gasket thickness (target: 0.035&quot;&ndash;0.045&quot;)',
    # Step 6 (Oil Gallery Plugs)
    'Alle &Ouml;lkanalstopfen lokalisieren: 2 an der R&uuml;ckseite des Blocks (hinter Verteilerbohrung), 2 an der Vorderseite, weitere seitlich.':
        'Locate all oil gallery plugs: 2 at rear of block (behind distributor bore), 2 at front, additional ones on sides.',
    'Jeden Stopfen mit Steckschl&uuml;ssel oder Inbus auf festen Sitz pr&uuml;fen.':
        'Check each plug with socket or Allen key for tight fit.',
    'Lose Stopfen herausdrehen, Gewinde reinigen, Teflonband oder Rohr-Dichtmittel auftragen.':
        'Remove loose plugs, clean threads, apply Teflon tape or pipe sealant.',
    'Stopfen mit 8&ndash;10 ft-lbs (11&ndash;14 Nm) anziehen.':
        'Tighten plugs to 8&ndash;10 ft-lbs (11&ndash;14 Nm).',
    'Bei Rebuild: Alle Stopfen generell erneuern (sie k&ouml;nnen mit der Zeit undicht werden).':
        'During rebuild: Replace all plugs as a rule (they can become leaky over time).',
    'Hinter der Verteilerbohrung leicht zu &uuml;bersehen!':
        'Easy to miss behind the distributor bore!',
    'Lose Stopfen = kein &Ouml;ldruck beim Erststart = Motorschaden':
        'Loose plugs = no oil pressure at first start = engine damage',
    # Step 11 (Cam Journals)
    'Nockenwelle auf V-Block oder Prismen legen (oder im Block belassen).':
        'Place camshaft on V-blocks or prisms (or leave in block).',
    'Au&szlig;enmikrometer (1.5&quot;&ndash;2.5&quot;) auf den Zapfen ansetzen.':
        'Place outside micrometer (1.5&quot;&ndash;2.5&quot;) on journal.',
    'Jeden Zapfen an 2 Positionen messen: 0&deg; und 90&deg; gedreht (Ovalit&auml;t pr&uuml;fen).':
        'Measure each journal at 2 positions: 0&deg; and 90&deg; rotated (check ovality).',
    'Alle 5 Zapfen durchmessen und Werte dokumentieren.':
        'Measure all 5 journals and document values.',
    'Ovalit&auml;t &gt; 0.001&quot;: Nockenwelle verschlissen &ndash; ersetzen.':
        'Ovality &gt; 0.001&quot;: Camshaft worn &ndash; replace.',
    'Lagerspiel berechnen: Bearing I.D. &minus; Journal &oslash; = Clearance (Soll: 0.001&quot;&ndash;0.003&quot;).':
        'Calculate bearing clearance: Bearing I.D. &minus; Journal &oslash; = Clearance (target: 0.001&quot;&ndash;0.003&quot;).',
    # Phase 2 Steps (German procedure steps)
    'Lagertyp bestimmen: R351 (Standard) oder J351 (Boss). Cam-Journal-Durchmesser aus Phase 1, Step 11 verwenden.':
        'Identify bearing type: R351 (standard) or J351 (Boss). Use cam journal diameter from Phase 1, Step 11.',
    'Lagerspiel berechnen: Bearing I.D. &minus; Journal &oslash;. Soll: 0.001&quot;&ndash;0.003&quot;.':
        'Calculate bearing clearance: Bearing I.D. &minus; Journal &oslash;. Target: 0.001&quot;&ndash;0.003&quot;.',
    'Visuelle Pr&uuml;fung: Riefen, Pitting, Verschlei&szlig;? Wenn ja &rarr; ersetzen.':
        'Visual inspection: scoring, pitting, wear? If yes &rarr; replace.',
    'Falls Austausch n&ouml;tig: Alte Lager mit Einpresswerkzeug heraustreiben (von au&szlig;en nach innen).':
        'If replacement needed: drive out old bearings with installation tool (from outside to inside).',
    'Neue Lager ein&ouml;len und mit Spezialwerkzeug einpressen (Hammer + Treibdorn, nicht schief ansetzen!).':
        'Oil new bearings and press in with special tool (hammer + drift, do not install crooked!).',
    '<strong>Kritisch:</strong> &Ouml;lbohrungen im Lager MUESSEN exakt mit den Block-&Ouml;lkan&auml;len fluchten. Lager mit Markierung zur &Ouml;lbohrung ausrichten.':
        '<strong>Critical:</strong> Oil holes in bearing MUST align exactly with block oil galleries. Align bearing markings with oil holes.',
    'Nach dem Einpressen nochmals Lagerspiel pr&uuml;fen.':
        'After pressing in, recheck bearing clearance.',
    'Nur austauschen bei Typkonflikt oder sichtbarem Verschlei&szlig;':
        'Only replace if type conflict or visible wear',
    '&Ouml;lbohrungen MUESSEN mit Block-Kan&auml;len fluchten &ndash; sonst kein &Ouml;l an der Nocke!':
        'Oil holes MUST align with block galleries &ndash; otherwise no oil to the cam!',
    'Immer ge&ouml;lt einpressen &ndash; nie trocken':
        'Always press in oiled &ndash; never dry',
    # Cam Endplay
    'Nockenwelle mit Anlaufscheibe (Thrust Plate) eingebaut, Nockenwellenrad montiert.':
        'Camshaft installed with thrust plate, cam sprocket mounted.',
    'Messuhr (Dial Indicator) axial auf das vordere Nockenwellenende oder die Nockenwellenrad-Stirnfl&auml;che ansetzen.':
        'Mount dial indicator axially on front cam end or cam sprocket face.',
    'Nockenwelle mit Schraubendreher vorsichtig ganz nach vorne dr&uuml;cken. Messuhr auf Null.':
        'Carefully push camshaft fully forward with screwdriver. Zero the gauge.',
    'Nockenwelle ganz nach hinten dr&uuml;cken. Messuhr ablesen = Endplay.':
        'Push camshaft fully rearward. Read gauge = endplay.',
    'Soll: 0.001&quot;&ndash;0.007&quot;. &Uuml;ber 0.009&quot;: Anlaufscheibe verschlissen &ndash; ersetzen.':
        'Target: 0.001&quot;&ndash;0.007&quot;. Over 0.009&quot;: thrust plate worn &ndash; replace.',
    'Zu viel Spiel = Anlaufscheibe verschlissen oder falsche Dicke':
        'Too much play = thrust plate worn or wrong thickness',
    'Zu wenig Spiel = Nocke kann bei Betriebstemperatur klemmen (W&auml;rmeausdehnung)':
        'Too little play = cam may bind at operating temp (thermal expansion)',
    # Sweep Check (Step 11)
    'Ventilschaft-Ende komplett mit Filzstift (Edding/Sharpie) einf&auml;rben.':
        'Color entire valve stem tip with felt-tip marker (Sharpie).',
    'Kipphebel montieren und Preload einstellen.':
        'Install rocker and set preload.',
    'Nockenwelle eine volle Umdrehung von Hand drehen (Ventil durchl&auml;uft vollen Hub).':
        'Rotate camshaft one full revolution by hand (valve goes through full lift).',
    'Kontaktmuster auf dem Ventilschaft ablesen:':
        'Read contact pattern on valve stem:',
    '<strong>Schmales Band, mittig</strong> = St&ouml;&szlig;elstangenl&auml;nge korrekt':
        '<strong>Narrow band, centered</strong> = pushrod length correct',
    '<strong>Band nach au&szlig;en versetzt</strong> = St&ouml;&szlig;elstange zu lang':
        '<strong>Band offset outward</strong> = pushrod too long',
    '<strong>Band nach innen versetzt</strong> = St&ouml;&szlig;elstange zu kurz':
        '<strong>Band offset inward</strong> = pushrod too short',
    '<strong>Breites Band</strong> = falsche L&auml;nge &ndash; Ventilf&uuml;hrung leidet!':
        '<strong>Wide band</strong> = wrong length &ndash; valve guide suffers!',
    'Sweep pattern on valve stem (document both good and bad patterns)':
        'Sweep pattern on valve stem (document both good and bad patterns)',
    # PTV
    'Modelliermasse (Knetmasse / Clay) ca. 3 mm dick auf die Ventiltaschen im Kolben dr&uuml;cken.':
        'Press modeling clay ~3 mm thick into valve pockets on piston crown.',
    'Pr&uuml;ffedern (Checking Springs) einbauen &ndash; NICHT die echten #8605 Ventilfedern!':
        'Install checking springs &ndash; NOT the actual #8605 valve springs!',
    'Kopf mit Probekopfdichtung (Mock-up Gasket) auflegen, handfest anziehen.':
        'Place head with mock-up gasket, hand-tighten.',
    'Kurbelwelle mindestens 2 volle Umdrehungen drehen.':
        'Rotate crankshaft at least 2 full revolutions.',
    'Kopf abnehmen, Knetmasse vorsichtig vom Kolben l&ouml;sen.':
        'Remove head, carefully detach clay from piston.',
    'Knetmasse an der d&uuml;nnsten Stelle aufschneiden und mit Messschieber messen.':
        'Cut clay at thinnest point and measure with caliper.',
    'Einlass- und Auslass-Ventilfreigang getrennt dokumentieren.':
        'Document intake and exhaust valve clearance separately.',
    # Retainer-to-Seal
    'Ventil bei installierter Feder auf maximalen Hub bringen (Kurbel drehen oder Feder mit Werkzeug komprimieren).':
        'Bring valve to maximum lift with spring installed (rotate crank or compress spring with tool).',
    'Abstand zwischen Unterseite des Federtellers (Retainer) und Oberkante der Ventilschaftdichtung (Valve Seal) messen.':
        'Measure gap between retainer underside and valve seal top edge.',
    'Methode 1: F&uuml;hlerlehre zwischen Retainer und Seal einf&uuml;hren.':
        'Method 1: Insert feeler gauge between retainer and seal.',
    'Methode 2: Plastigage-Streifen zwischen Retainer und Seal legen, Ventil auf max. Hub, Plastigage ablesen.':
        'Method 2: Place Plastigage strip between retainer and seal, valve at max lift, read Plastigage.',
    'Mindestens 0.060&quot; (1.52 mm) Clearance erforderlich.':
        'Minimum 0.060&quot; (1.52 mm) clearance required.',
    'Bei zu wenig Abstand: Andere Dichtung (k&uuml;rzere Bauform) oder andere Retainer verwenden.':
        'If clearance too small: Use different seal (shorter type) or different retainers.',
    'Bei maximalem Hub messen &ndash; Retainer darf Dichtung nicht ber&uuml;hren':
        'Measure at maximum lift &ndash; retainer must not contact seal',
    'Kontakt = Dichtung zerst&ouml;rt = &Ouml;lverbrauch und Rauchentwicklung':
        'Contact = seal destroyed = oil consumption and smoke',
    # Coil Bind
    'Installierte Federl&auml;nge (Installed Height) aus Step 19 &uuml;bernehmen oder messen.':
        'Use installed spring height from Step 19 or measure.',
    'Coil-Bind-H&ouml;he vom Feder-Datenblatt ablesen (PAC/AFR #8605).':
        'Read coil bind height from spring data sheet (PAC/AFR #8605).',
    'Maximalen Ventilhub bestimmen (Auslass: 0.565&quot; bei 1.7:1 Rocker Ratio).':
        'Determine max valve lift (exhaust: 0.565&quot; at 1.7:1 rocker ratio).',
    'Rechnung: Installed Height &minus; Max. Valve Lift = L&auml;nge bei maximalem Hub.':
        'Calculate: Installed Height &minus; Max. Valve Lift = length at max lift.',
    'Clearance = L&auml;nge bei max. Hub &minus; Coil-Bind-H&ouml;he.':
        'Clearance = length at max lift &minus; coil bind height.',
    'Ergebnis muss &ge; 0.060&quot; (1.52 mm) sein. Weniger = Feder- oder Retainer-Bruch!':
        'Result must be &ge; 0.060&quot; (1.52 mm). Less = spring or retainer failure!',
    'Bei zu wenig Clearance: Andere Feder oder Shims unter dem Retainer entfernen.':
        'If clearance too small: Use different spring or remove shims under retainer.',
    # ARP Head Studs (Phase 1 Step 25)
    'Alle 20 Stehbolzen (10 pro Kopf) mit Messschieber messen und nach lang/kurz sortieren.':
        'Measure all 20 studs (10 per head) with caliper and sort by long/short.',
    'Lange Bolzen (4 St&uuml;ck pro Kopf): Soll 6.800&quot; &plusmn; 0.010&quot;. Kommen in die Sacklochbohrungen (Blind Holes).':
        'Long studs (4 pcs per head): Target 6.800&quot; &plusmn; 0.010&quot;. Go into blind holes.',
    'Kurze Bolzen (6 St&uuml;ck pro Kopf): Soll 5.750&quot; &plusmn; 0.010&quot;. Kommen in die Wasserbohrungen (Water Holes &ndash; Dichtmittel auf Gewinde!).':
        'Short studs (6 pcs per head): Target 5.750&quot; &plusmn; 0.010&quot;. Go into water jacket holes (sealant on threads!).',
    'Gewindetiefe im Block pr&uuml;fen: Bolzen darf NICHT am Grund aufsetzen (hydraulische Blockade &rarr; Blockriss!).':
        'Check thread depth in block: Stud must NOT bottom out (hydraulic lock &rarr; block crack!).',
    'Bolzen handfest eindrehen, Gewindeg&auml;ngigkeit pr&uuml;fen. 2&ndash;3 Gewinde m&uuml;ssen &uuml;ber die Mutter hinausragen.':
        'Thread studs in hand-tight, check thread condition. 2&ndash;3 threads must protrude above the nut.',
}


def is_german(text):
    """Heuristic: is this text primarily German?"""
    decoded = htmlmod.unescape(text)
    clean = re.sub(r'<[^>]+>', '', decoded)
    # Check umlauts/eszett
    if re.search(r'[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]', clean):
        return True
    # Check common German words
    words = [w.strip('.,;:!?()"\'"') for w in clean.split()]
    german_markers = {'und','auf','der','die','das','den','dem','nicht','alle','nach',
                      'vor','bei','muss','kann','messen','mit','ein','eine','vom','zum',
                      'zur','oder','sich','dieser','diese','noch','nur','wenn','auch',
                      'dann','kein','keine','ohne','gegen','immer','wieder','bereits',
                      'jetzt','hier','dort','Wert','Zylinder','Bohrung','Block','Kolben',
                      'Kurbel','Messuhr','Ventil','Schritt','messen','drehen','Gewinde',
                      'Stopfen','Lager','Drehmoment','mindestens','Alternativ'}
    cnt = sum(1 for w in words if w in german_markers or w.lower() in german_markers)
    return cnt >= 2


def has_german_parens(text):
    """Check if text has German translations in parentheses."""
    decoded = htmlmod.unescape(text)
    clean = re.sub(r'<[^>]+>', '', decoded)
    parens = re.findall(r'\(([^)]+)\)', clean)
    for p in parens:
        if re.search(r'[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]', p):
            return True
        german_words = {'Bohrung','Montagepaste','Schrauben','Dichtung','Wanne','Ventil',
                       'Kipphebel','Nockenwelle','Steuerkette','Pumpe','Lifter','Verteiler',
                       'Stopfen','Zapfen','Lager','Scheibe','Gewinde','Feder','Kette',
                       'Block','Kolben','Motor','Deckel','Platte','Bolzen','Masse',
                       'Saugrohr','acetonbasiert','fusselfreie','Messschieber',
                       'Kunststoffschaber','Schutzbrille','Druckluft','Bremsenreiniger',
                       'Handschuhe','Taschenlampe','grosszuegig','Einlass','Auslass',
                       'Nocken','Nocke','Drehmomentschluessel','Haarlineal',
                       'Ausblaspistole','Tiefenmikrometer'}
        words_in_p = set(w.strip('.,;:!?') for w in p.split())
        if words_in_p & german_words:
            return True
    return False


def extract_bilingual(text):
    """For bilingual text (EN + DE parens), create DE and EN versions.
    Returns (de_text, en_text) or None if can't parse."""
    decoded = htmlmod.unescape(text)
    clean_for_check = re.sub(r'<[^>]+>', '', decoded)
    
    # Find German parenthetical content
    # Pattern: "English text (German translation)" or "<strong>Label:</strong> English (German)"
    parens = list(re.finditer(r'\s*\(([^)]+)\)\s*', text))
    
    german_parens = []
    for m in parens:
        inner = m.group(1)
        inner_decoded = htmlmod.unescape(inner)
        if re.search(r'[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]', inner_decoded):
            german_parens.append(m)
            continue
        # Check for German words
        for gw in ['Bohrung','Montagepaste','Dichtung','Ventil','Nocke','Nocken',
                    'Kipphebel','Steuerkette','Pumpe','Lifter','Verteiler','Lager',
                    'Bolzen','Gewinde','Kunststoffschaber','fusselfreie','Schutzbrille',
                    'Druckluft','Bremsenreiniger','Taschenlampe','Handschuhe',
                    'Messschieber','acetonbasiert','Saugrohr','Ausblaspistole',
                    'Sacklochbohrungen','Passfeder','Steuermarken','Zahnrad','Dichtfl']:
            if gw.lower() in inner_decoded.lower():
                german_parens.append(m)
                break
    
    if not german_parens:
        return None
    
    # EN version: strip German parens
    en_text = text
    for m in reversed(german_parens):
        en_text = en_text[:m.start()] + en_text[m.end():]
    en_text = re.sub(r'\s{2,}', ' ', en_text).strip()
    
    # For DE version: we'd ideally extract just the German, but that loses context
    # Instead, for bilingual lines, we flip: show the German part prominently
    # For now, keep the original as DE (it contains both languages)
    de_text = text
    
    return (de_text, en_text)


def process_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    in_guide = False
    guide_depth = 0
    stats = {'already': 0, 'bilingual': 0, 'en_de': 0, 'de_en': 0, 'untouched': 0}

    for i, line in enumerate(lines):
        if 'class="step-guide"' in line:
            in_guide = True
            guide_depth = 0
        if in_guide:
            guide_depth += line.count('<div') - line.count('</div')
            if guide_depth <= 0 and '</div>' in line:
                in_guide = False

            # Skip already processed
            if 'class="de"' in line and 'class="en"' in line:
                stats['already'] += 1
                continue

            # Match <li>...</li>
            m = re.match(r'^(\s*<li>)(.*?)(</li>\s*)$', line)
            if not m:
                continue

            prefix, inner, suffix = m.groups()
            inner = inner.strip()
            if not inner:
                continue

            # 1. Check EN_DE dictionary
            if inner in EN_DE:
                de_text = EN_DE[inner]
                lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{inner}</span>{suffix}'
                stats['en_de'] += 1
                continue

            # 2. Check DE_EN dictionary
            if inner in DE_EN:
                en_text = DE_EN[inner]
                lines[i] = f'{prefix}<span class="de">{inner}</span><span class="en">{en_text}</span>{suffix}'
                stats['de_en'] += 1
                continue

            # 3. Check for bilingual text (EN + DE parens)
            if has_german_parens(inner):
                result = extract_bilingual(inner)
                if result:
                    de_text, en_text = result
                    lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{en_text}</span>{suffix}'
                    stats['bilingual'] += 1
                    continue

            # 4. Check if text is already German (leave as-is for now)
            # These show correctly in DE mode, but not in EN mode
            # We'll add EN translations in a subsequent pass
            stats['untouched'] += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f"Stats: {stats}")
    total_done = stats['already'] + stats['bilingual'] + stats['en_de'] + stats['de_en']
    print(f"Total translated: {total_done} / {total_done + stats['untouched']}")
    return stats


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'build-log.html'
    print(f'Processing {path}...')
    process_html(path)
