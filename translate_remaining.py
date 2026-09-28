#!/usr/bin/env python3
"""Second pass: translate all 425 remaining untranslated guide lines."""
import re
import html as htmlmod
import sys

# All remaining EN->DE and DE->EN translations
EN_DE_2 = {
    # Bilingual lines where parenthetical German was not detected by first pass
    'Dial indicator (Messuhr) with magnetic base':
        'Messuhr mit Magnetstativ',
    'Straightedge (Haarlineal) across bore':
        'Haarlineal quer ueber Bohrung',
    'Crank turning tool or box wrench':
        'Kurbeldrehwerkzeug oder Ringschluessel',
    'Large screwdriver or lever for pushing crank':
        'Grosser Schraubendreher oder Hebel zum Kurbelwellen-Druecken',
    'Lobe surfaces (Nockenfl&auml;chen): no scoring, no pitting, no heat discoloration':
        'Nockenflaechen: keine Riefen, kein Pitting, keine Hitzeverfaerbung',
    'Journals (Lagerzapfen): polished surface, no rust':
        'Lagerzapfen: polierte Oberflaeche, kein Rost',
    'Distributor drive gear: teeth undamaged':
        'Verteiler-Antriebszahnrad: Zaehne unbeschaedigt',
    'Light rust on journals = shipping damage, remove with fine Scotch-Brite + oil':
        'Leichter Rost an Zapfen = Versandschaden, mit feinem Scotch-Brite + Oel entfernen',
    '<strong>Soak in oil now!</strong> Morel HLT lifters need min. 24h in clean engine oil before Phase 2':
        '<strong>Jetzt in Oel einlegen!</strong> Morel HLT Stoessel brauchen min. 24h in sauberem Motoroel vor Phase 2',
    'Establish numbering system (1E, 1A, 2E, 2A... = cylinder + intake/exhaust)':
        'Nummerierungssystem festlegen (1E, 1A, 2E, 2A... = Zylinder + Einlass/Auslass)',
    '7/16&quot; (11.11 mm) stud mount confirmed (fits AFR #6411 studs)':
        '7/16&quot; (11,11 mm) Bolzenmontage bestaetigt (passt auf AFR #6411 Stehbolzen)',
    'Ultra Pro Magnum = steel body &ndash; significantly stronger than aluminum rockers':
        'Ultra Pro Magnum = Stahlkoerper &ndash; deutlich staerker als Aluminium-Kipphebel',
    'Fulcrum design &ndash; no separate fulcrum bolt required':
        'Dreh-Lagerboeck-Design &ndash; kein separater Lagerboeck-Bolzen erforderlich',
    '<strong>Thread:</strong> 7/16&quot;-20 fine thread (11.11 mm Feingewinde) &ndash; must match AFR #6411 rocker studs':
        '<strong>Gewinde:</strong> 7/16&quot;-20 Feingewinde (11,11 mm) &ndash; muss zu AFR #6411 Kipphebel-Stehbolzen passen',
    '<strong>Set screw:</strong> Allen set screw present and functional on each polylock':
        '<strong>Madenschraube:</strong> Innensechskant-Madenschraube vorhanden und funktionsfaehig an jedem Polylock',
    '<strong>Thread condition:</strong> Clean threads, no damage or cross-threading':
        '<strong>Gewindezustand:</strong> Saubere Gewinde, kein Schaden oder Quetschen',
    'Precision straightedge (Haarlineal) min. 14&quot; (356 mm)':
        'Praezisions-Haarlineal min. 14&quot; (356 mm)',
    'Burette (B&uuml;rette) 100 ml, 0.1 ml graduation':
        'Buerette 100 ml, 0,1 ml Teilung',
    'CC plate (Plexiglas with hole)':
        'CC-Platte (Plexiglas mit Bohrung)',
    '<strong>Part Number:</strong> AFR #6411 screw-in rocker studs (Schraubstehbolzen)':
        '<strong>Teilenummer:</strong> AFR #6411 Schraub-Stehbolzen',
    '<strong>Thread (block side):</strong> 3/8&quot;-24 (9.53 mm) fine thread':
        '<strong>Gewinde (Blockseite):</strong> 3/8&quot;-24 (9,53 mm) Feingewinde',
    '<strong>Thread (rocker side):</strong> 7/16&quot;-20 (11.11 mm) fine thread':
        '<strong>Gewinde (Kipphebelseite):</strong> 7/16&quot;-20 (11,11 mm) Feingewinde',
    '<strong>Quantity:</strong> 16 pcs installed in heads &ndash; verify all present and tight':
        '<strong>Anzahl:</strong> 16 Stueck in Koepfen installiert &ndash; Vollstaendigkeit und festen Sitz pruefen',
    '<strong>Height:</strong> All studs same height above head surface &ndash; visual check across row':
        '<strong>Hoehe:</strong> Alle Bolzen gleiche Hoehe ueber Kopfflaeche &ndash; Sichtkontrolle ueber die Reihe',
    '<strong>Springs PAC #8605:</strong> 16 pcs, dual spring (Doppelfeder), beehive or conventional design':
        '<strong>Federn PAC #8605:</strong> 16 Stueck, Doppelfeder, Beehive- oder konventionelles Design',
    '<strong>Retainers AFR #8600:</strong> 16 pcs, titanium (Titan) &ndash; significantly lighter than steel':
        '<strong>Federteller AFR #8600:</strong> 16 Stueck, Titan &ndash; deutlich leichter als Stahl',
    '<strong>Visual check:</strong> No cracked or broken springs, retainers undamaged':
        '<strong>Sichtpruefung:</strong> Keine gerissenen oder gebrochenen Federn, Federteller unbeschaedigt',
    '<strong>Spring color coding:</strong> All springs should be identical (same color / markings)':
        '<strong>Feder-Farbkodierung:</strong> Alle Federn muessen identisch sein (gleiche Farbe/Markierungen)',
    'Spring height gauge (steel plate with hole)':
        'Federhoehen-Lehre (Stahlplatte mit Bohrung)',
    'Installed-height micrometer or caliper (Messschieber)':
        'Einbauhoehen-Mikrometer oder Messschieber',
    '<strong>Angle:</strong> 7&deg; keepers (Ventilkeile) &ndash; must match titanium retainers #8600':
        '<strong>Winkel:</strong> 7&deg; Ventilkeile &ndash; muessen zu Titan-Federtellern #8600 passen',
    '<strong>Quantity:</strong> 32 pcs (2 per valve &times; 16 valves)':
        '<strong>Anzahl:</strong> 32 Stueck (2 pro Ventil &times; 16 Ventile)',
    '<strong>Groove count:</strong> Verify single- or multi-groove matches valve stem groove':
        '<strong>Rillenanzahl:</strong> Pruefen ob Ein- oder Mehrrillen zur Ventilschaft-Nut passen',
    '<strong>Condition:</strong> No nicks, cracks, or wear on locking surfaces':
        '<strong>Zustand:</strong> Keine Kerben, Risse oder Verschleiss an Verriegelungsflaechen',
    '<strong>Crank sprocket:</strong> Keyway undamaged, teeth sharp (no wear)':
        '<strong>Kurbelwellen-Zahnrad:</strong> Passfedernut unbeschaedigt, Zaehne scharf (kein Verschleiss)',
    '<strong>Cam sprocket:</strong> Timing marks (dots) clearly visible, 3 keyway positions (Adv/Std/Ret)':
        '<strong>Nockenwellen-Zahnrad:</strong> Steuermarken (Punkte) deutlich sichtbar, 3 Passfeder-Positionen (Adv/Std/Ret)',
    '<strong>Chain (Kette):</strong> No stiff links, chain stretch &lt; 1/8&quot; (3.2 mm) over 12 links':
        '<strong>Kette:</strong> Keine steifen Glieder, Kettenlaengung &lt; 1/8&quot; (3,2 mm) ueber 12 Glieder',
    '<strong>Thrust plate:</strong> Surfaces smooth, thickness uniform':
        '<strong>Anlaufscheibe:</strong> Oberflaechen glatt, Dicke gleichmaessig',
    '<strong>Bolts:</strong> 2x cam-to-sprocket bolts (replaced by ARP 254-1001 for cam bolt)':
        '<strong>Schrauben:</strong> 2x Nocken-zu-Zahnrad-Schrauben (ersetzt durch ARP 254-1001 fuer Nockenschraube)',
    'Cam bearing installation tool (Einpresswerkzeug)':
        'Nockenwellenlager-Einpresswerkzeug',
    'Outside micrometer (Au&szlig;enmikrometer) 1.5&quot;&ndash;2.5&quot; (38&ndash;64 mm)':
        'Aussenmikrometer 1,5&quot;&ndash;2,5&quot; (38&ndash;64 mm)',
    'Feeler gauge (F&uuml;hlerlehre) 0.001&quot;&ndash;0.004&quot; (0.025&ndash;0.10 mm)':
        'Fuehlerlehre 0,001&quot;&ndash;0,004&quot; (0,025&ndash;0,10 mm)',
    'Caliper (Messschieber) 0&ndash;8&quot; (0&ndash;200 mm)':
        'Messschieber 0&ndash;8&quot; (0&ndash;200 mm)',
    'Caliper (Messschieber)':
        'Messschieber',
    'Micrometer or caliper (Messschieber)':
        'Mikrometer oder Messschieber',
    'Caliper (Messschieber) to read length':
        'Messschieber zum Laengen-Ablesen',
    'Caliper for measuring compressed clay':
        'Messschieber zum Messen der komprimierten Knetmasse',
    'Modeling clay (Knetmasse), ~0.120" / 3 mm thick':
        'Modelliermasse (Knetmasse), ~0,120" / 3 mm dick',
    'Checking springs (light springs) &ndash; NOT the #8605 valve springs!':
        'Prueffedern (leichte Federn) &ndash; NICHT die #8605 Ventilfedern!',
    'Modeling clay (Knetmasse) &ndash; alternative measurement method':
        'Knetmasse &ndash; alternative Messmethode',
    'Modeling clay (Knetmasse) ~3/16&quot; (5 mm) thick':
        'Knetmasse ~3/16&quot; (5 mm) dick',
    '<strong>1.</strong> Cut 2&ndash;3 short pieces of solder wire (~1" / 25 mm long)':
        '<strong>1.</strong> 2&ndash;3 kurze Stuecke Loetdraht abschneiden (~1" / 25 mm lang)',
    '<strong>2.</strong> Use grease to stick solder on quench area of piston crown (flat area, NOT in valve pocket)':
        '<strong>2.</strong> Loetdraht mit Fett auf Quench-Bereich des Kolbenbodens kleben (flacher Bereich, NICHT in Ventiltasche)',
    '<strong>3.</strong> Install head with mock-up gasket, finger-tight':
        '<strong>3.</strong> Kopf mit Probedichtung auflegen, handfest anziehen',
    '<strong>4.</strong> Rotate crankshaft slowly over TDC &ndash; wire gets crushed between piston and head':
        '<strong>4.</strong> Kurbelwelle langsam ueber OT drehen &ndash; Draht wird zwischen Kolben und Kopf gequetscht',
    '<strong>5.</strong> Remove head. Measure crushed wire thickness with micrometer':
        '<strong>5.</strong> Kopf abnehmen. Gequetschte Drahtdicke mit Mikrometer messen',
    '<strong>6.</strong> Repeat for all 8 cylinders':
        '<strong>6.</strong> Fuer alle 8 Zylinder wiederholen',
    '3/8&quot; socket set (Nusskasten)':
        '3/8&quot; Nusskasten',
    'Feeler gauge 0.010&quot; (0.25 mm)':
        'Fuehlerlehre 0,010&quot; (0,25 mm)',
    '3/8&quot; socket set':
        '3/8&quot; Nusskasten',
    '<strong>2. Cover fitment:</strong> Slide cover over crank snout &ndash; must clear timing chain sprocket':
        '<strong>2. Deckel-Passung:</strong> Deckel ueber Kurbelwellenstumpf schieben &ndash; muss Steuerkettenrad freigeben',
    '<strong>3. Seal bore check:</strong> Verify front seal bore is concentric with crank snout &ndash; no offset that would damage seal':
        '<strong>3. Dichtungssitz-Pruefung:</strong> Vordere Dichtungsbohrung muss konzentrisch zum Kurbelwellenstumpf sein &ndash; kein Versatz der den Simmerring beschaedigen wuerde',
    '<strong>5. Balancer clearance:</strong> With cover loosely in place, verify harmonic balancer can slide through seal bore without interference':
        '<strong>5. Schwingungsdaempfer-Freigang:</strong> Bei lose aufgesetztem Deckel pruefen ob Schwingungsdaempfer durch Dichtungsbohrung passt',
    '<strong>1. Gasket alignment:</strong> Lay side gaskets + end seals dry on block &ndash; verify all bolt holes align with pan':
        '<strong>1. Dichtungsausrichtung:</strong> Seitendichtungen + Enddichtungen trocken auf Block legen &ndash; alle Schraubenbohrungen muessen mit Wanne fluchten',
    '<strong>3. Pickup-to-pan bottom:</strong> Measure from bottom of pickup screen to inside bottom of pan &ndash; target 1/4&quot;&ndash;3/8&quot; (6.4&ndash;9.5 mm)':
        '<strong>3. Pickup-zu-Wannenboden:</strong> Von Saugrohr-Sieb-Unterseite bis Wannen-Innenboden messen &ndash; Ziel 1/4&quot;&ndash;3/8&quot; (6,4&ndash;9,5 mm)',
    '<strong>4. Dipstick tube:</strong> Verify dipstick tube boss aligns with block or pan provision':
        '<strong>4. Oelmessstab-Rohr:</strong> Pruefen ob Oelmessstab-Aufnahme mit Block oder Wanne fluchtet',
    '<strong>5. Windage tray:</strong> If Canton pan includes windage tray, check clearance to crank counterweights &ndash; min. 1/4&quot; (6.4 mm)':
        '<strong>5. Windage Tray:</strong> Falls Canton-Wanne Windage Tray enthaelt, Freigang zu Kurbel-Gegengewichten pruefen &ndash; min. 1/4&quot; (6,4 mm)',
    '<strong>6. Drain plug:</strong> Verify drain plug is accessible and in correct position for chassis':
        '<strong>6. Ablassschraube:</strong> Pruefen ob Ablassschraube zugaenglich und in korrekter Position fuers Chassis',
    '<strong>Method A (Direct):</strong> With pan loosely in place, measure from pickup screen bottom to pan floor with ruler through drain hole or bolt hole':
        '<strong>Methode A (Direkt):</strong> Bei lose aufgesetzter Wanne, Abstand von Saugrohr-Sieb bis Wannenboden mit Lineal durch Ablassbohrung messen',
    '<strong>Method B (Clay):</strong> Place modeling clay on pan floor, set pan on block, remove and measure compressed clay thickness':
        '<strong>Methode B (Knetmasse):</strong> Knetmasse auf Wannenboden legen, Wanne auf Block setzen, abnehmen und komprimierte Knetmasse messen',
    '<strong>Method C (Wire):</strong> Bend wire to known length, insert through drain hole to touch pickup &ndash; calculate distance':
        '<strong>Methode C (Draht):</strong> Draht auf bekannte Laenge biegen, durch Ablassbohrung bis zum Pickup einfuehren &ndash; Abstand berechnen',
    '<strong>1. Rocker clearance:</strong> Place modeling clay on highest points of rocker arms (adjusting nut / polylock area)':
        '<strong>1. Kipphebel-Freigang:</strong> Knetmasse auf hoechste Punkte der Kipphebel legen (Einstellmutter / Polylock-Bereich)',
    '<strong>2.</strong> Set valve cover on head with gasket, press down evenly':
        '<strong>2.</strong> Ventildeckel mit Dichtung auf Kopf setzen, gleichmaessig andruecken',
    '<strong>3.</strong> Remove cover, measure clay thickness &ndash; minimum clearance: 1/8&quot; (3.2 mm) to any rocker component':
        '<strong>3.</strong> Deckel abnehmen, Knetmasse-Dicke messen &ndash; Mindestfreigang: 1/8&quot; (3,2 mm) zu jedem Kipphebel-Teil',
    '<strong>4. Gasket seal:</strong> Check gasket rail seating &ndash; gasket must sit flat with no gaps':
        '<strong>4. Dichtungssitz:</strong> Dichtungsschiene pruefen &ndash; Dichtung muss plan ohne Spalte sitzen',
    '<strong>5. PCV/breather:</strong> Verify PCV valve and breather grommet positions match planned routing':
        '<strong>5. PCV/Entlueftung:</strong> PCV-Ventil und Entlueftungstuelle in geplanter Position pruefen',
    '<strong>6. Bolt holes:</strong> Verify all mounting holes align &ndash; aftermarket covers may differ from OEM pattern':
        '<strong>6. Schraubenbohrungen:</strong> Alle Befestigungsbohrungen muessen fluchten &ndash; Nachmarkt-Deckel koennen von OEM-Muster abweichen',
    'COMP 1632-16 rockers with polylocks are taller than stock &ndash; standard covers often don&rsquo;t clear!':
        'COMP 1632-16 Kipphebel mit Polylocks sind hoeher als Serie &ndash; Standard-Deckel passen oft nicht!',
    'If interference: use tall/fabricated covers, or spacers (Abstandshalter) under cover gasket rail':
        'Bei Kollision: Hohe/gefertigte Deckel verwenden, oder Abstandshalter unter Dichtungsschiene',
    'Note clearance issues now &ndash; order correct covers before Phase 3':
        'Freigang-Probleme jetzt notieren &ndash; korrekte Deckel vor Phase 3 bestellen',
    '<strong>2. Rotor alignment:</strong> At TDC #1 compression, rotor tip should point toward #1 spark plug wire tower on cap':
        '<strong>2. Verteilerfinger-Ausrichtung:</strong> Bei OT #1 Kompression muss Verteilerfinger auf #1 Zuendkabelanschluss am Verteilerkappe zeigen',
    '<strong>3. Intake clearance:</strong> With intake manifold in place, check clearance between distributor body/cap and intake manifold runners &ndash; minimum 1/4&quot; (6.4 mm)':
        '<strong>3. Ansaug-Freigang:</strong> Bei montierter Ansaugspinne Freigang zwischen Verteilerkoerper/-kappe und Ansaugkanaelen pruefen &ndash; min. 1/4&quot; (6,4 mm)',
    '<strong>4. Hold-down clamp:</strong> Verify clamp fits in block groove and can secure distributor':
        '<strong>4. Halteklemme:</strong> Pruefen ob Klemme in Block-Nut passt und Verteiler sichern kann',
    '<strong>5. Vacuum advance:</strong> Check vacuum canister clearance to firewall/bulkhead and accessories':
        '<strong>5. Unterdruckverstellung:</strong> Freigang Unterdruckdose zu Spritzwand und Nebenaggregaten pruefen',
    '<strong>COMP Cams, Smith Brothers, or Trend</strong> for custom lengths &ndash; specify to nearest 0.025&quot; increment':
        '<strong>COMP Cams, Smith Brothers oder Trend</strong> fuer Sonderlaengen &ndash; auf naechste 0,025&quot;-Stufe angeben',
    'Verify 5/16&quot; diameter clears COMP guideplate slots &ndash; if using 3/8&quot;, need matching guideplates':
        '5/16&quot; Durchmesser muss durch COMP-Fuehrungsplatten-Schlitze passen &ndash; bei 3/8&quot; passende Fuehrungsplatten verwenden',
    'Permanent marker + masking tape for labeling':
        'Permanentmarker + Klebeband zum Beschriften',
    'Zip-lock bags (verschiedene Gr&ouml;&szlig;en)':
        'Zip-Lock-Beutel (verschiedene Groessen)',
    'Bag hardware per location: &quot;LH Head Nuts&quot;, &quot;Timing Cover Bolts&quot;, etc.':
        'Hardware nach Position eintueten: &quot;LH Kopfmuttern&quot;, &quot;Steuerdeckel-Schrauben&quot; usw.',
    'Blind holes dry (Sacklochbohrungen trocken) &ndash; compressed air!':
        'Sacklochbohrungen trocken &ndash; Druckluft!',
    '&#9744; ARP Ultra-Torque lubricant (included in stud kit / im Stehbolzen-Kit enthalten)':
        '&#9744; ARP Ultra-Torque Schmiermittel (im Stehbolzen-Kit enthalten)',
    '&#9744; RTV silicone (Permatex Ultra Black or Grey)':
        '&#9744; RTV-Silikon (Permatex Ultra Black oder Grey)',
    '&#9744; Thread sealant / Teflon tape (for water-jacket bolts / Gewindedichtmittel)':
        '&#9744; Gewindedichtmittel / Teflonband (fuer Wasserkanal-Bolzen)',
    'ARP Ultra-Torque lubricant &ndash; from ARP stud kit (do NOT substitute!)':
        'ARP Ultra-Torque Schmiermittel &ndash; aus ARP-Stehbolzen-Kit (NICHT ersetzen!)',
    'Head gaskets (Fel-Pro 1011-2 or M-6051-CP331) ready &ndash; verify correct part number':
        'Kopfdichtungen (Fel-Pro 1011-2 oder M-6051-CP331) bereit &ndash; korrekte Teilenummer pruefen',
    'Block deck surface clean and dry (previous cleaning step completed)':
        'Block-Deckflaeche sauber und trocken (vorheriger Reinigungsschritt abgeschlossen)',
    'Dowel pins in block verified (2 per side, pressed into block)':
        'Passhuelsen im Block geprueft (2 pro Seite, eingepresst)',
    'ARP head studs installed and lubed (previous step completed)':
        'ARP-Kopfstehbolzen eingebaut und geschmiert (vorheriger Schritt abgeschlossen)',
    'AFR 1399 cylinder heads clean, ports free of debris':
        'AFR 1399 Zylinderkoepfe sauber, Kanaele frei von Schmutz',
    'Some builders use guide studs (long bolts without heads) in 2 corner holes to guide the head down &ndash; recommended for heavy iron heads':
        'Manche Motorenbauer verwenden Fuehrungsbolzen (lange Bolzen ohne Kopf) in 2 Eckbohrungen zum Fuehren des Kopfes &ndash; empfohlen fuer schwere Gusskoepfe',
    # Phase 3 remaining
    'Cylinder heads torqued to final spec (previous step completed)':
        'Zylinderkoepfe auf End-Drehmoment angezogen (vorheriger Schritt abgeschlossen)',
    'COMP Cams flat-style guide plates &ndash; correct type for AFR 1399 heads':
        'COMP Cams Fuehrungsplatten, flache Bauform &ndash; korrekter Typ fuer AFR 1399 Koepfe',
    'Final-length pushrods (intake and exhaust lengths determined in Phase 2)':
        'Stoesselstangen in Endlaenge (Einlass- und Auslass-Laengen in Phase 2 bestimmt)',
    'COMP #106 assembly lube for pushrod tips':
        'COMP #106 Montagepaste fuer Stoesselstangen-Enden',
    'Assembly lube (COMP #106) for pushrod tips':
        'Montagepaste (COMP #106) fuer Stoesselstangen-Enden',
    'Clean cloth':
        'Sauberes Tuch',
    'Flashlight for alignment inspection':
        'Taschenlampe zur Fluchtpruefung',
    'Guide plates prevent pushrod side-loading on valve stem tips &ndash; critical for valve guide life':
        'Fuehrungsplatten verhindern seitliche Belastung der Stoesselstangen auf Ventilschaft-Enden &ndash; kritisch fuer Ventlfuehrungs-Lebensdauer',
    'Double-check intake vs. exhaust pushrod lengths &ndash; mixing them up causes incorrect geometry':
        'Einlass- vs. Auslass-Stoesselstangenlaengen kontrollieren &ndash; Verwechslung verursacht falsche Geometrie',
    'If pushrod contacts guide plate edge at any point in the cam cycle: wrong pushrod length or wrong guide plate orientation':
        'Bei Kontakt Stoesselstange-Fuehrungsplattenkante an irgendeinem Punkt im Nockenzyklus: falsche Stoesselstangenlaenge oder falsche Fuehrungsplatten-Ausrichtung',
    'Do not fully tighten guide plates until rockers are installed and preload is set':
        'Fuehrungsplatten nicht fest anziehen bis Kipphebel montiert und Vorspannung eingestellt ist',
    'Cam lube on pushrod tips is critical &ndash; dry pushrod tips will gall rocker cups and lifter seats on first startup':
        'Montagepaste auf Stoesselstangen-Enden ist kritisch &ndash; trockene Enden fressen Kipphebel-Pfannen und Stoesselsitze beim Erststart',
    'Timing cover gasket (Steuerkettendeckel-Dichtung)':
        'Steuerkettendeckel-Dichtung',
    'RTV silicone (Permatex Ultra Black)':
        'RTV-Silikon (Permatex Ultra Black)',
    'Front crank seal (vorderer Kurbelwellen-Simmerring)':
        'Vorderer Kurbelwellen-Simmerring',
    'Seal installation tool (Simmerring-Einpresswerkzeug)':
        'Simmerring-Einpresswerkzeug',
    '<strong>5.</strong> Torque bolts (Schrauben anziehen)':
        '<strong>5.</strong> Schrauben anziehen',
    '<strong>2.</strong> Align Woodruff key (Passfeder ausrichten)':
        '<strong>2.</strong> Passfeder ausrichten',
    '<strong>3.</strong> Use press-on tool to pull evenly &ndash; threaded rod through crank (Aufpresswerkzeug verwenden &ndash; Gewindestange durch Kurbelwelle)':
        '<strong>3.</strong> Aufpresswerkzeug verwenden &ndash; Gewindestange durch Kurbelwelle gleichmaessig anziehen',
    '<strong>1.</strong> Install side gaskets (Seitendichtungen einlegen)':
        '<strong>1.</strong> Seitendichtungen einlegen',
    '<strong>3.</strong> Set pan on block, hand-start all bolts (Wanne aufsetzen, alle Schrauben handfest)':
        '<strong>3.</strong> Wanne aufsetzen, alle Schrauben handfest',
    '<strong>4.</strong> Cross-pattern torque (Kreuzweise anziehen)':
        '<strong>4.</strong> Kreuzweise anziehen',
    'Sealant: Permatex Aviation (Dichtmittel)':
        'Dichtmittel: Permatex Aviation',
    'Timing cover mounted (Steuerkettendeckel montiert)':
        'Steuerkettendeckel montiert',
    '<strong>3.</strong> Cross-pattern torque (Kreuzweise anziehen)':
        '<strong>3.</strong> Kreuzweise anziehen',
    'Milodon 16230 is a high-flow pump &ndash; verify rotation matches belt routing (Hochleistungspumpe &ndash; Drehrichtung muss zum Riementrieb passen)':
        'Milodon 16230 ist eine Hochleistungspumpe &ndash; Drehrichtung muss zum Riementrieb passen',
    'RTV silicone (Permatex Ultra Black)':
        'RTV-Silikon (Permatex Ultra Black)',
    'Port gaskets Fel-Pro 1250 (Portdichtungen)':
        'Port-Dichtungen Fel-Pro 1250',
    'Valvetrain set (Ventiltrieb eingestellt)':
        'Ventiltrieb eingestellt',
    '<strong>2.</strong> RTV at front/rear &ndash; <strong>NO cork end seals &ndash; RTV only!</strong> (RTV vorne/hinten &ndash; KEINE Kork-Enddichtungen &ndash; nur RTV!)':
        '<strong>2.</strong> RTV vorne/hinten &ndash; <strong>KEINE Kork-Enddichtungen &ndash; nur RTV!</strong>',
    # Distributor Phase 3
    'MSD Pro-Billet or Ready-to-Run distributor ready':
        'MSD Pro-Billet oder Ready-to-Run Verteiler bereit',
    'Oil pump drive shaft installed (engages distributor gear)':
        'Oelpumpen-Antriebswelle montiert (greift in Verteiler-Zahnrad)',
    'Intake manifold installed (distributor drops through intake on SBF)':
        'Ansaugspinne montiert (Verteiler wird durch Ansaugspinne bei SBF eingesetzt)',
    'Engine at TDC #1 compression stroke &ndash; BOTH valves on #1 must be closed':
        'Motor bei OT #1 Kompressionstakt &ndash; BEIDE Ventile an #1 muessen geschlossen sein',
    'Breaker bar or socket on crank bolt (to rotate engine to TDC)':
        'Knarre oder Nuss auf Kurbelwellenschraube (zum Drehen auf OT)',
    '1/2" wrench for distributor hold-down clamp':
        '1/2"-Schluessel fuer Verteiler-Halteklemme',
    'Distributor cap + rotor (for marking #1 position)':
        'Verteilerkappe + Verteilerfinger (zum Markieren der #1-Position)',
    'Marker or paint pen':
        'Marker oder Lackstift',
    'Ford 302 firing order: 1-5-4-2-6-3-7-8, distributor rotates counter-clockwise (gegen Uhrzeigersinn)':
        'Ford 302 Zuendfolge: 1-5-4-2-6-3-7-8, Verteiler dreht gegen den Uhrzeigersinn',
    'MSD distributors have no vacuum advance (no canister) &ndash; all advance is electronic via MSD 6AL box':
        'MSD-Verteiler haben keine Unterdruckverstellung (keine Dose) &ndash; gesamte Verstellung elektronisch ueber MSD 6AL Box',
    'The distributor gear meshes with the cam gear at a helical angle &ndash; rotor rotates ~15&deg; as it drops in. Pre-offset accordingly':
        'Das Verteiler-Zahnrad greift schraeg in das Nocken-Zahnrad &ndash; Verteilerfinger dreht sich ~15&deg; beim Einsetzen. Entsprechend vorhalten',
    'Mark the intake manifold at the distributor base so you can verify it hasn&rsquo;t rotated during transport/handling':
        'Ansaugspinne am Verteilerfuss markieren um zu pruefen ob er sich beim Transport nicht verdreht hat',
    '<strong>3.</strong> Torque to spec (auf Drehmoment anziehen)':
        '<strong>3.</strong> Auf Drehmoment anziehen',
    # Valve Covers Phase 3
    'All 16 rocker arms set with correct preload (previous step)':
        'Alle 16 Kipphebel mit korrekter Vorspannung eingestellt (vorheriger Schritt)',
    'Valve covers + gaskets (cork or rubber) ready':
        'Ventildeckel + Dichtungen (Kork oder Gummi) bereit',
    'PCV valve and breather grommets in correct positions':
        'PCV-Ventil und Entlueftungstuelpen in korrekter Position',
    'Gasket surfaces on heads clean and dry':
        'Dichtflaechen an Koepfen sauber und trocken',
    'Torque wrench (low-range, accurate at 4&ndash;6 ft-lbs)':
        'Drehmomentschluessel (Niedrig-Bereich, genau bei 4&ndash;6 ft-lbs)',
    '1/4" drive socket for valve cover bolts':
        '1/4"-Nuss fuer Ventildeckel-Schrauben',
    'Valve cover gaskets (cork or rubber, matched to covers)':
        'Ventildeckel-Dichtungen (Kork oder Gummi, passend zu Deckeln)',
    'RTV silicone (thin bead at corners if cork gaskets)':
        'RTV-Silikon (duenne Raupe an Ecken bei Kork-Dichtungen)',
    '<strong>Set covers:</strong> Place valve covers on heads, aligning all bolt holes (Ventildeckel aufsetzen)':
        '<strong>Deckel aufsetzen:</strong> Ventildeckel auf Koepfe legen, alle Schraubenbohrungen ausrichten',
    '<strong>Hand-start all bolts:</strong> Insert and hand-start ALL bolts before tightening any (alle Schrauben handfest eindrehen)':
        '<strong>Alle Schrauben handfest:</strong> ALLE Schrauben eindrehen bevor eine angezogen wird',
    'Cork gaskets compress over time &ndash; re-torque to 4&ndash;6 ft-lbs after first heat cycle':
        'Kork-Dichtungen setzen sich mit der Zeit &ndash; nach erstem Waermezyklus auf 4&ndash;6 ft-lbs nachziehen',
    'Rubber gaskets are reusable and provide a better seal long-term than cork':
        'Gummi-Dichtungen sind wiederverwendbar und dichten langfristig besser als Kork',
    'If using stamped steel covers with roller rockers: verify clearance with modeling clay first (Phase 2 step)':
        'Bei gestanzten Stahldeckeln mit Roller-Kipphebeln: Freigang zuerst mit Knetmasse pruefen (Phase 2 Schritt)',
    'Tall valve covers (fabricated aluminum) may be needed with stud-mount roller rockers &ndash; verify in Phase 2 mock-up':
        'Hohe Ventildeckel (gefertigtes Aluminium) koennen bei Bolzen-Roller-Kipphebeln noetig sein &ndash; in Phase 2 Probeaufbau pruefen',
    'PCV valve typically goes on one cover, open breather on the other &ndash; check your ventilation system routing':
        'PCV-Ventil kommt typisch auf einen Deckel, offener Entluefter auf den anderen &ndash; Entlueftungs-System-Verlegung pruefen',
    '<strong>4.</strong> Torque mounting bolts (Befestigungsschrauben anziehen)':
        '<strong>4.</strong> Befestigungsschrauben auf Drehmoment anziehen',
    '<strong>2.</strong> Lube hex ends with assembly lube, shaft body with engine oil':
        '<strong>2.</strong> Sechskant-Enden mit Montagepaste schmieren, Schaftkoerper mit Motoroel',
    '<strong>3.</strong> Insert shaft through distributor bore into block':
        '<strong>3.</strong> Welle durch Verteilerbohrung in Block einfuehren',
    '<strong>4.</strong> Lower end (hex) must engage oil pump rotor &ndash; may need to rotate shaft slightly for engagement':
        '<strong>4.</strong> Unteres Ende (Sechskant) muss in Oelpumpen-Rotor greifen &ndash; Welle ggf. leicht drehen',
    '<strong>5.</strong> Upper end (hex) will later engage distributor gear &ndash; verify shaft protrudes correctly above block surface':
        '<strong>5.</strong> Oberes Ende (Sechskant) greift spaeter in Verteiler-Zahnrad &ndash; korrekten Ueberstand ueber Block pruefen',
    '<strong>6.</strong> Spin shaft by hand (screwdriver in hex) &ndash; must rotate freely and smoothly':
        '<strong>6.</strong> Welle von Hand drehen (Schraubendreher in Sechskant) &ndash; muss frei und gleichmaessig drehen',
    'If shaft won&rsquo;t drop in: cam gear and pump may be misaligned &ndash; rotate crank slightly':
        'Wenn Welle nicht einfaellt: Nocken-Zahnrad und Pumpe evtl. nicht ausgerichtet &ndash; Kurbel leicht drehen',
    'Shaft should have ~0.010&quot;&ndash;0.030&quot; (0.25&ndash;0.76 mm) axial play when seated &ndash; must NOT be tight':
        'Welle soll ~0,010&quot;&ndash;0,030&quot; (0,25&ndash;0,76 mm) Axialspiel haben &ndash; darf NICHT fest sitzen',
    # Phase 4 complete translations
    'Priming tool (Melling PT11 or long hex bit in drill)':
        'Priming-Werkzeug (Melling PT11 oder langer Sechskant-Bit in Bohrmaschine)',
    'Drill (slow speed, clockwise rotation!)':
        'Bohrmaschine (langsame Drehzahl, Rechtslauf!)',
    '<strong>1.</strong> Remove distributor (access to oil pump drive)':
        '<strong>1.</strong> Verteiler ausbauen (Zugang zur Oelpumpen-Antriebswelle)',
    '<strong>2.</strong> Insert priming tool, spin with drill':
        '<strong>2.</strong> Priming-Werkzeug einsetzen, mit Bohrmaschine drehen',
    '<strong>3.</strong> Watch oil pressure gauge &ndash; must show pressure':
        '<strong>3.</strong> Oeldruck-Manometer beobachten &ndash; muss Druck anzeigen',
    '<strong>4.</strong> Rotate crankshaft 4&times; 90&deg; during priming (supply all bearings)':
        '<strong>4.</strong> Kurbelwelle 4&times; 90&deg; waehrend Priming drehen (alle Lager versorgen)',
    '<strong>5.</strong> Remove valve covers &ndash; oil must appear at all 16 rockers':
        '<strong>5.</strong> Ventildeckel abnehmen &ndash; Oel muss an allen 16 Kipphebeln erscheinen',
    'Pre-oiling in progress (priming tool spinning in drill)':
        'Voroelen laeuft (Priming-Werkzeug dreht in Bohrmaschine)',
    'Wrench or socket on harmonic balancer bolt for crank rotation':
        'Schluessel oder Nuss auf Schwingungsdaempfer-Schraube zum Kurbel-Drehen',
    'Oil pressure gauge connected and showing pressure':
        'Oeldruck-Manometer angeschlossen und zeigt Druck',
    'Large wrench or breaker bar on damper bolt (15/16" or 24 mm)':
        'Grosse Knarre auf Schwingungsdaempfer-Schraube (15/16" oder 24 mm)',
    'Priming tool (Melling PT11) still engaged in drill':
        'Priming-Werkzeug (Melling PT11) noch in Bohrmaschine',
    'Helper recommended: one person runs drill, other rotates crank':
        'Helfer empfohlen: eine Person bedient Bohrmaschine, andere dreht Kurbel',
    'Rotating the crank ensures ALL main bearings, rod bearings, and cam bearings receive oil &ndash; oil feed holes in bearings only align at certain crank positions':
        'Kurbeldrehen stellt sicher dass ALLE Hauptlager, Pleuellager und Nockenwellenlager Oel erhalten &ndash; Oelzufuehrbohrungen in Lagern fluchten nur bei bestimmten Kurbelpositionen',
    'Rotate SLOWLY &ndash; the priming tool cannot supply oil as fast as a running engine':
        'LANGSAM drehen &ndash; das Priming-Werkzeug kann nicht so schnell Oel liefern wie ein laufender Motor',
    'If oil pressure drops during rotation: this is normal &ndash; new bearings are being loaded with oil':
        'Wenn Oeldruck beim Drehen sinkt: das ist normal &ndash; neue Lager werden mit Oel befuellt',
    'Ideal to do 2&ndash;3 full revolutions total for thorough pre-oiling':
        'Ideal sind 2&ndash;3 volle Umdrehungen gesamt fuer gruendliches Voroelen',
    'Mechanical oil pressure gauge connected (do NOT rely on electric sender for pre-oil)':
        'Mechanisches Oeldruck-Manometer angeschlossen (NICHT auf elektrischen Geber beim Voroelen verlassen)',
    'Priming tool engaged and drill running':
        'Priming-Werkzeug eingesetzt und Bohrmaschine laeuft',
    'Oil level verified on dipstick before priming':
        'Oelstand vor Priming am Peilstab geprueft',
    'Melling M-68 high-volume pump should show strong pressure during priming if properly filled with assembly lube before installation':
        'Melling M-68 Hochvolumen-Pumpe sollte beim Priming kraeftigen Druck zeigen wenn vorher korrekt mit Montagepaste gefuellt',
    'Drill speed matters: too fast can aerate oil, too slow won&rsquo;t build pressure. Moderate speed is best':
        'Bohrdrehzahl ist wichtig: zu schnell belueftet das Oel, zu langsam baut keinen Druck auf. Mittlere Drehzahl ist optimal',
    'If oil never reaches one bank of rockers: suspect plugged oil gallery on that side':
        'Wenn Oel nie eine Kipphebelreihe erreicht: verstopfter Oelkanal auf dieser Seite vermuten',
    'Total priming time: typically 3&ndash;5 minutes with crank rotation to fully oil all bearings and push oil to rockers':
        'Gesamte Priming-Dauer: typisch 3&ndash;5 Minuten mit Kurbeldrehen um alle Lager zu oelen und Oel zu den Kipphebeln zu druecken',
    'After priming, reinstall valve covers and distributor before starting':
        'Nach dem Priming Ventildeckel und Verteiler wieder montieren vor dem Starten',
    # Break-in oil
    'Brad Penn 10W-30 (high ZDDP content)':
        'Brad Penn 10W-30 (hoher ZDDP-Gehalt)',
    'Driven BR30 Break-In Oil':
        'Driven BR30 Einlauf-Oel',
    'Lucas Hot Rod &amp; Classic':
        'Lucas Hot Rod &amp; Classic',
    'ZDDP (zinc dialkyldithiophosphate) protects cam lobes &amp; lifters during break-in':
        'ZDDP (Zinkdialkyldithiophosphat) schuetzt Nocken &amp; Stoessel beim Einlaufen',
    'Modern oil (API SN+) has reduced ZDDP &ndash; <strong>not suitable</strong> for break-in':
        'Modernes Oel (API SN+) hat reduzierten ZDDP-Gehalt &ndash; <strong>nicht geeignet</strong> fuer Einlaufen',
    # Coolant
    'Funnel with long neck (Trichter)':
        'Trichter mit langem Hals',
    'Drain pan (Auffangwanne)':
        'Auffangwanne',
    'Bleed valve wrench (if equipped)':
        'Entlueftungsventil-Schluessel (falls vorhanden)',
    'Mid-engine cars: fill system with engine tilted if possible &ndash; air pockets at highest point in hoses':
        'Mittelmotor-Fahrzeuge: System bei geneigtem Motor befuellen &ndash; Luftblasen am hoechsten Punkt in Schlaeuchen',
    'Run engine to operating temp with radiator cap off (carefully!) to self-bleed':
        'Motor mit offenem Kuehlerdeckel auf Betriebstemperatur bringen (vorsichtig!) zum Selbst-Entlueften',
    'Squeeze upper radiator hose to push trapped air through system':
        'Oberen Kuehlerschlauch druecken um eingeschlossene Luft durch System zu pressen',
    'Recheck level daily for first week &ndash; air pockets work out slowly':
        'Fuellstand taeglich in der ersten Woche pruefen &ndash; Luftblasen loesen sich langsam',
    # Static Timing
    'Crank turning socket or breaker bar on balancer bolt':
        'Kurbeldrehwerkzeug oder Knarre auf Schwingungsdaempfer-Schraube',
    '1/2&quot; wrench for distributor hold-down clamp':
        '1/2&quot; Schluessel fuer Verteiler-Halteklemme',
    'Test light or multimeter (for points/trigger verification)':
        'Prueflampe oder Multimeter (zur Kontakt-/Trigger-Pruefung)',
    '<strong>3.</strong> Rotate crank BACKWARDS to 10&ndash;12&deg; BTDC mark on balancer':
        '<strong>3.</strong> Kurbel RUECKWAERTS auf 10&ndash;12&deg; v. OT Markierung am Schwingungsdaempfer drehen',
    '<strong>4.</strong> Loosen distributor hold-down, rotate body until trigger/pickup just activates':
        '<strong>4.</strong> Verteiler-Klemme loesen, Verteilerkoerper drehen bis Trigger/Pickup gerade anspricht',
    '<strong>5.</strong> Tighten hold-down clamp &ndash; snug, not final (engine will need timing light adjustment at warm idle)':
        '<strong>5.</strong> Klemme anziehen &ndash; fest, aber nicht endgueltig (Motor braucht Blitzlampen-Einstellung bei warmem Leerlauf)',
    '10&ndash;12&deg; is a safe starting point &ndash; adjust with timing light after engine is running':
        '10&ndash;12&deg; ist ein sicherer Startwert &ndash; mit Blitzlampe nach Motorstart einstellen',
    'Verify firing order: 1-5-4-2-6-3-7-8 (Ford 302) &ndash; wires must be in correct cap terminals':
        'Zuendfolge pruefen: 1-5-4-2-6-3-7-8 (Ford 302) &ndash; Kabel muessen an korrekten Verteilerkappe-Anschluessen sitzen',
    'MSD magnetic pickup: no test light needed &ndash; just align rotor to #1 at static timing position':
        'MSD Magnetischer Pickup: keine Prueflampe noetig &ndash; Verteilerfinger einfach auf #1 bei statischer Zuendposition ausrichten',
    # Rev Limiter
    '<strong>1.</strong> Locate MSD 6AL box &ndash; find RPM module plug (2-pin connector)':
        '<strong>1.</strong> MSD 6AL Box finden &ndash; RPM-Modul-Stecker (2-Pin-Stecker) suchen',
    '<strong>2.</strong> Select appropriate RPM pill/chip: 6,200 RPM (conservative) or 6,500 RPM (matches cam)':
        '<strong>2.</strong> Passenden RPM-Chip waehlen: 6.200 U/min (konservativ) oder 6.500 U/min (passend zur Nockenwelle)',
    '<strong>3.</strong> Plug module firmly into connector &ndash; ensure positive click':
        '<strong>3.</strong> Modul fest in Stecker einklicken &ndash; hoerbares Klicken sicherstellen',
    '<strong>4.</strong> If no module installed: MSD defaults to ~9,000 RPM (no protection!)':
        '<strong>4.</strong> Ohne Modul: MSD laeuft auf ~9.000 U/min (kein Schutz!)',
    'For break-in: use 6,200 RPM chip &ndash; swap to 6,500 after break-in complete':
        'Zum Einlaufen: 6.200 U/min Chip verwenden &ndash; nach Einlaufen auf 6.500 wechseln',
    'Carry spare module chips of different RPM values in toolbox':
        'Ersatz-Modul-Chips mit verschiedenen Drehzahlwerten im Werkzeugkasten mitfuehren',
    'MSD 6AL also has 2-step launch control &ndash; optional for track use':
        'MSD 6AL hat auch 2-Step Launch Control &ndash; optional fuer Rennstrecke',
    # Preload Recheck
    '<strong>1.</strong> Rotate crank so valve&rsquo;s lifter is on base circle (Nocken-Grundkreis)':
        '<strong>1.</strong> Kurbel drehen bis Stoessel auf Nocken-Grundkreis steht',
    '<strong>2.</strong> Loosen polylock set screw, back off adjusting nut slightly':
        '<strong>2.</strong> Polylock-Madenschraube loesen, Einstellmutter leicht zurueckdrehen',
    '<strong>3.</strong> Spin pushrod while re-tightening adjusting nut':
        '<strong>3.</strong> Stoesselstange drehen waehrend Einstellmutter wieder angezogen wird',
    '<strong>4.</strong> Zero lash = pushrod just stops spinning freely':
        '<strong>4.</strong> Nullspiel = Stoesselstange hoert gerade auf frei zu drehen',
    '<strong>5.</strong> From zero lash: 1/2 turn further = preload':
        '<strong>5.</strong> Ab Nullspiel: 1/2 Umdrehung weiter = Vorspannung',
    '<strong>6.</strong> Lock polylock set screw &ndash; recheck that nut did not move':
        '<strong>6.</strong> Polylock-Madenschraube festziehen &ndash; pruefen dass Mutter sich nicht bewegt hat',
    '<strong>7.</strong> Repeat for ALL 16 valves using EO/IC method':
        '<strong>7.</strong> Fuer ALLE 16 Ventile wiederholen mit EO/IC-Methode',
    'Parts may have shifted since Phase 3 assembly &ndash; always recheck before first start':
        'Teile koennen sich seit Phase-3-Montage verschoben haben &ndash; vor Erststart immer nachpruefen',
    'Use EO/IC method: when exhaust opens &rarr; set intake; when intake closes &rarr; set exhaust':
        'EO/IC-Methode verwenden: wenn Auslass oeffnet &rarr; Einlass einstellen; wenn Einlass schliesst &rarr; Auslass einstellen',
    'If any pushrod feels loose or doesn&rsquo;t want to spin &ndash; investigate before starting!':
        'Wenn eine Stoesselstange locker sitzt oder sich nicht drehen will &ndash; vor dem Starten untersuchen!',
    # Wiring
    '&#9744; MSD 6AL box: heavy red wire to battery + (12V fused)':
        '&#9744; MSD 6AL Box: dickes rotes Kabel an Batterie + (12V abgesichert)',
    '&#9744; MSD 6AL box: heavy black wire to solid engine/chassis ground':
        '&#9744; MSD 6AL Box: dickes schwarzes Kabel an solide Motor-/Chassismasse',
    '&#9744; MSD white wire to ignition switch (12V key-on)':
        '&#9744; MSD weisses Kabel an Zuendschloss (12V bei Zuendung ein)',
    '&#9744; MSD coil wires: orange + dark green to MSD Blaster coil':
        '&#9744; MSD Spulenkabel: orange + dunkelgruen an MSD Blaster Spule',
    '&#9744; MSD magnetic pickup: violet &amp; green wires from distributor':
        '&#9744; MSD Magnetischer Pickup: violett &amp; gruen Kabel vom Verteiler',
    '&#9744; Tach signal: gray wire from MSD to tachometer':
        '&#9744; Drehzahlsignal: graues Kabel von MSD an Drehzahlmesser',
    '&#9744; Spark plug wires: correct firing order on distributor cap':
        '&#9744; Zuendkabel: korrekte Zuendfolge an Verteilerkappe',
    '&#9744; Starter solenoid: battery cable, ignition trigger wire':
        '&#9744; Anlasser-Magnetschalter: Batteriekabel, Zuend-Triggerkabel',
    '&#9744; Alternator: charge wire + field wire':
        '&#9744; Lichtmaschine: Ladekabel + Feldkabel',
    '&#9744; Oil pressure sender: wire to gauge':
        '&#9744; Oeldruck-Geber: Kabel zum Instrument',
    '&#9744; Water temperature sender: wire to gauge':
        '&#9744; Wassertemperatur-Geber: Kabel zum Instrument',
    'Trace each spark plug wire from cap to plug &ndash; verify firing order physically, not from memory':
        'Jedes Zuendkabel von Kappe bis Kerze nachverfolgen &ndash; Zuendfolge physisch pruefen, nicht aus dem Gedaechtnis',
    'MSD 6AL requires dedicated 12V hot (not shared with other accessories) &ndash; use 10 AWG wire':
        'MSD 6AL braucht eigene 12V-Dauerversorgung (nicht mit anderen Verbrauchern geteilt) &ndash; 10 AWG Kabel verwenden',
    'Ground strap from engine block to chassis is mandatory &ndash; poor ground = no start or weak spark':
        'Massekabel vom Motorblock zum Chassis ist Pflicht &ndash; schlechte Masse = kein Start oder schwacher Funke',
    # Safety
    '&#9744; <strong>Helper present</strong> &ndash; one person at the controls, one watching for leaks/fire (Helfer anwesend)':
        '&#9744; <strong>Helfer anwesend</strong> &ndash; eine Person an den Bedienelementen, eine beobachtet auf Lecks/Feuer',
    '&#9744; <strong>Exhaust ventilation</strong> &ndash; garage door open or exhaust extraction in place (Abgasabsaugung oder offenes Tor)':
        '&#9744; <strong>Abgasbelueftung</strong> &ndash; Garagentor offen oder Abgasabsaugung installiert',
    '&#9744; <strong>No fuel leaks</strong> &ndash; check all fittings, fuel line connections, carburetor base (keine Kraftstoffleckagen)':
        '&#9744; <strong>Keine Kraftstofflecks</strong> &ndash; alle Anschluesse, Kraftstoffleitungen, Vergaserflansch pruefen',
    '&#9744; <strong>All bolts torqued</strong> &ndash; visual inspection of all external fasteners (alle Schrauben angezogen)':
        '&#9744; <strong>Alle Schrauben angezogen</strong> &ndash; Sichtkontrolle aller aeusseren Befestigungselemente',
    '&#9744; <strong>Battery fully charged</strong> &ndash; 12.6V minimum (Batterie vollgeladen)':
        '&#9744; <strong>Batterie voll geladen</strong> &ndash; mindestens 12,6V',
    '&#9744; <strong>No loose wires</strong> near exhaust or moving parts (keine losen Kabel)':
        '&#9744; <strong>Keine losen Kabel</strong> in der Naehe von Abgas oder beweglichen Teilen',
    '&#9744; <strong>Kill switch accessible</strong> &ndash; know how to shut off ignition immediately (Notausschalter erreichbar)':
        '&#9744; <strong>Notausschalter erreichbar</strong> &ndash; wissen wie die Zuendung sofort abgeschaltet wird',
    # Start Card
    'ALL pre-start checklist items completed (Steps 1&ndash;11)':
        'ALLE Vorstartpunkte abgearbeitet (Schritte 1&ndash;11)',
    'Helper present with fire extinguisher':
        'Helfer mit Feuerloescher anwesend',
    'Exhaust ventilation in place (garage door open)':
        'Abgasbelueftung vorhanden (Garagentor offen)',
    'Throttle linkage verified &ndash; can hold 2,000&ndash;2,500 RPM':
        'Gasgestaeenge geprueft &ndash; kann 2.000&ndash;2.500 U/min halten',
    'Timing set to ~12&deg; BTDC (static)':
        'Zuendung auf ~12&deg; v. OT eingestellt (statisch)',
    'Tachometer connected and visible':
        'Drehzahlmesser angeschlossen und sichtbar',
    'Oil pressure gauge and temperature gauge visible from driver position':
        'Oeldruck- und Temperaturanzeige vom Fahrerplatz sichtbar',
    'Tachometer (via MSD 6AL gray tach wire)':
        'Drehzahlmesser (ueber MSD 6AL graues Tachokabel)',
    'Oil pressure gauge (mechanical preferred)':
        'Oeldruck-Manometer (mechanisch bevorzugt)',
    'Coolant temperature gauge':
        'Kuehlmittel-Temperaturanzeige',
    'Timing light (for adjustment after startup)':
        'Blitzlampe (zur Einstellung nach Motorstart)',
    'Wrench for distributor hold-down (timing adjustment)':
        'Schluessel fuer Verteiler-Klemme (Zuendungseinstellung)',
    'If engine won&rsquo;t start within 15 seconds of cranking: STOP. Check ignition timing, fuel delivery, firing order. Do not run starter continuously (nicht endlos orgeln)':
        'Wenn Motor innerhalb 15 Sekunden Anlassen nicht startet: STOPP. Zuendung, Kraftstoffzufuhr, Zuendfolge pruefen. Anlasser nicht dauerhaft betaetigen',
    'Vary RPM between 2,000&ndash;3,000 RPM every 2&ndash;3 minutes &ndash; constant RPM loads the same spots repeatedly':
        'Drehzahl alle 2&ndash;3 Minuten zwischen 2.000&ndash;3.000 U/min variieren &ndash; konstante Drehzahl belastet gleiche Stellen wiederholt',
    'Coolant temp should reach thermostat opening (~180&deg;F / 82&deg;C) within 10&ndash;15 minutes &ndash; this is normal':
        'Kuehlmitteltemperatur sollte Thermostat-Oeffnung (~82&deg;C / 180&deg;F) innerhalb 10&ndash;15 Minuten erreichen &ndash; das ist normal',
    'Minor exhaust smoke at first start is normal &ndash; assembly lube and oil residue burning off':
        'Leichter Abgasrauch beim Erststart ist normal &ndash; Montagepaste und Oelrueckstaende verbrennen',
    'Have a plan for what to do if something goes wrong: kill switch location, fire extinguisher location':
        'Plan fuer den Notfall haben: Notausschalter-Position, Feuerloescher-Position',
    'After 20&ndash;30 minutes: allow engine to idle briefly, then shut down. Break-in is complete':
        'Nach 20&ndash;30 Minuten: Motor kurz im Leerlauf laufen lassen, dann abstellen. Einlaufen ist abgeschlossen',
    # Oil Running
    '<strong>Normal:</strong> Pressure drops as oil warms up &ndash; thinner oil = lower pressure (normal)':
        '<strong>Normal:</strong> Druck sinkt wenn Oel warm wird &ndash; duenneres Oel = niedrigerer Druck (normal)',
    '<strong>Low pressure (&lt;30 psi at 2,000 RPM warm):</strong> Check bearing clearances, oil pump, pickup tube seal, oil level':
        '<strong>Niedriger Druck (&lt;30 psi bei 2.000 U/min warm):</strong> Lagerspiele, Oelpumpe, Saugrohr-Dichtung, Oelstand pruefen',
    '<strong>Very low (&lt;15 psi at any RPM):</strong> SHUT DOWN immediately &ndash; investigate before running again (SOFORT abstellen!)':
        '<strong>Sehr niedrig (&lt;15 psi bei jeder Drehzahl):</strong> SOFORT abstellen &ndash; vor erneutem Lauf untersuchen!',
    '<strong>High pressure (&gt;60 psi warm):</strong> Oil still cold, wrong viscosity, or relief valve stuck closed':
        '<strong>Hoher Druck (&gt;60 psi warm):</strong> Oel noch kalt, falsche Viskositaet oder Ueberdruckventil klemmt geschlossen',
    'Melling M-68 is a high-volume pump &ndash; expect slightly higher pressure than stock pump':
        'Melling M-68 ist eine Hochvolumen-Pumpe &ndash; etwas hoeherer Druck als Serienpumpe erwarten',
    'Oil pressure is a function of clearances + pump volume + relief valve setting &ndash; not just the pump':
        'Oeldruck ist eine Funktion aus Lagerspielen + Pumpenvolumen + Ueberdruckventil-Einstellung &ndash; nicht nur die Pumpe',
    '10W-30 break-in oil will show lower warm pressure than 15W-40 &ndash; both are normal for their viscosity':
        '10W-30 Einlauf-Oel zeigt niedrigeren Warmdruck als 15W-40 &ndash; beides ist normal fuer die jeweilige Viskositaet',
    'Pressure fluctuation of &plusmn;5 psi at steady RPM is normal &ndash; large swings indicate air in system or pickup uncovering':
        'Druckschwankungen von &plusmn;5 psi bei konstanter Drehzahl sind normal &ndash; grosse Schwankungen zeigen Luft im System oder Freilegen des Saugrohrs',
    'After break-in oil change: re-check pressure with new oil to establish true baseline':
        'Nach Einlauf-Oelwechsel: Druck mit neuem Oel erneut pruefen fuer echten Referenzwert',
    # Leaks
    'Use a flashlight and mirror to check underside and rear of engine':
        'Mit Taschenlampe und Spiegel Unterseite und Rueckseite des Motors pruefen',
    'A clean engine shows leaks immediately &ndash; wipe down before starting':
        'Ein sauberer Motor zeigt Lecks sofort &ndash; vor dem Start abwischen',
    'Small oil weeping at valve cover is common &ndash; re-torque to 4&ndash;6 ft-lbs after first heat cycle':
        'Leichtes Oelschwitzen am Ventildeckel ist normal &ndash; nach erstem Waermezyklus auf 4&ndash;6 ft-lbs nachziehen',
    'Any fuel leak = SHUT DOWN immediately! (Kraftstoffleck = SOFORT abstellen!)':
        'Jedes Kraftstoffleck = SOFORT abstellen!',
    'Photo of clean engine before first start (reference)':
        'Foto des sauberen Motors vor Erststart (Referenz)',
    'Photo of any leak location found':
        'Foto jeder gefundenen Leckstelle',
    # Temp
    'If temp keeps climbing past 210&deg;F: verify fan operation, check for air pockets in cooling system':
        'Wenn Temperatur ueber 210&deg;F (99&deg;C) weiter steigt: Luefterbetrieb pruefen, auf Luftblasen im Kuehlsystem pruefen',
    'Oil temp lags coolant by several minutes &ndash; normal':
        'Oeltemperatur hinkt Kuehlmittel um einige Minuten hinterher &ndash; normal',
    'Watch for temp spike = head gasket issue, air in cooling system, or electric fan not activating':
        'Auf Temperaturspitze achten = Kopfdichtungsproblem, Luft im Kuehlsystem oder Elektro-Luefter schaltet nicht ein',
    # Timing Warm
    'Wrench for distributor clamp (Verteiler-Klemmschraube)':
        'Schluessel fuer Verteiler-Klemme',
    '<strong>1.</strong> Engine at operating temperature (Betriebstemperatur)':
        '<strong>1.</strong> Motor auf Betriebstemperatur',
    '<strong>5.</strong> Loosen distributor clamp, rotate slowly to desired degree (e.g. 12&deg; BTDC)':
        '<strong>5.</strong> Verteiler-Klemme loesen, langsam auf gewuenschten Wert drehen (z.B. 12&deg; v. OT)',
    # Oil Idle
    'Oil pressure drops as oil heats up &ndash; this is normal (thinner oil = lower pressure)':
        'Oeldruck sinkt wenn Oel heiss wird &ndash; das ist normal (duenneres Oel = niedrigerer Druck)',
    'Below 15 psi at hot idle = investigate: bearing clearances, oil pump, pickup, oil level':
        'Unter 15 psi bei heissem Leerlauf = untersuchen: Lagerspiele, Oelpumpe, Saugrohr, Oelstand',
    'Melling M-68 high-volume pump should provide 50+ psi at 2,500 RPM with correct bearing clearances':
        'Melling M-68 Hochvolumen-Pumpe sollte 50+ psi bei 2.500 U/min mit korrekten Lagerspielen liefern',
    'Excessively high pressure (&gt;70 psi cold) may indicate blocked oil gallery or wrong relief spring':
        'Uebermassig hoher Druck (&gt;70 psi kalt) kann auf verstopften Oelkanal oder falsche Ueberdruckfeder hinweisen',
    # Timing Final
    '<strong>Centrifugal Advance (Fliehkraftverstellung):</strong> Mechanical advance via weights &amp; springs inside distributor &ndash; adds degrees as RPM rises':
        '<strong>Fliehkraftverstellung:</strong> Mechanische Verstellung ueber Gewichte &amp; Federn im Verteiler &ndash; fuegt Grade mit steigender Drehzahl hinzu',
    '<strong>Vacuum Advance (Unterdruckverstellung):</strong> Additional advance at part-load cruise for economy &amp; lower cylinder temps &ndash; +8&ndash;10&deg;':
        '<strong>Unterdruckverstellung:</strong> Zusaetzliche Verstellung bei Teillast-Fahrt fuer Verbrauch &amp; niedrigere Zylindertemperaturen &ndash; +8&ndash;10&deg;',
    'Run engine at 3,000&ndash;3,500 RPM':
        'Motor auf 3.000&ndash;3.500 U/min laufen lassen',
    'Read timing light &ndash; advance should stop increasing':
        'Blitzlampe ablesen &ndash; Verstellung sollte aufhoeren zu steigen',
    'This is your total mechanical advance':
        'Dies ist die gesamte mechanische Verstellung',
    'If still climbing above 3,500 RPM &ndash; springs too light or bushing too large':
        'Wenn noch ueber 3.500 U/min steigend &ndash; Federn zu leicht oder Buchse zu gross',
    'MSD Advance Kit 8464 (springs + bushings)':
        'MSD Advance Kit 8464 (Federn + Buchsen)',
    'Small pliers (Spitzzange)':
        'Spitzzange',
    'Timing light':
        'Blitzlampe / Stroboskop',
    '<strong>Build specs:</strong> ~9.7:1 CR, CNC heads (AFR 1399), MSD CDI, 98 ROZ fuel':
        '<strong>Build-Daten:</strong> ~9,7:1 Verdichtung, CNC-Koepfe (AFR 1399), MSD CDI, 98 ROZ Kraftstoff',
    '<strong>Total Timing (Gesamtvorverstellen):</strong> 32&ndash;36&deg;':
        '<strong>Gesamtvorverstellung:</strong> 32&ndash;36&deg;',
    '<strong>Vacuum Advance (Unterdruck):</strong> +8&ndash;10&deg; at part load (Teillast)':
        '<strong>Unterdruckverstellung:</strong> +8&ndash;10&deg; bei Teillast',
    # Retorque
    'First heat cycle completed':
        'Erster Waermezyklus abgeschlossen',
    '<strong>1.</strong> Remove valve covers (Ventildeckel abnehmen)':
        '<strong>1.</strong> Ventildeckel abnehmen',
    '<strong>3.</strong> Re-torque intake manifold bolts: cross pattern to 18 ft-lbs (24 Nm)':
        '<strong>3.</strong> Ansaugspinnen-Schrauben nachziehen: Kreuzweise auf 18 ft-lbs (24 Nm)',
    '<strong>4.</strong> Recheck all 16 rocker preloads (1/2 turn past zero lash) &ndash; head re-torque may shift preload':
        '<strong>4.</strong> Alle 16 Kipphebel-Vorspannungen pruefen (1/2 Umdrehung nach Nullspiel) &ndash; Kopf-Nachziehen kann Vorspannung verschieben',
    '<strong>5.</strong> Reinstall valve covers':
        '<strong>5.</strong> Ventildeckel wieder montieren',
    'Copper gaskets (CP331) and aluminum heads settle during first heat cycle &ndash; re-torque is essential':
        'Kupferdichtungen (CP331) und Aluminium-Koepfe setzen sich beim ersten Waermezyklus &ndash; Nachziehen ist unverzichtbar',
    'Some studs may turn slightly further &ndash; this is normal (gasket compression)':
        'Manche Bolzen drehen evtl. noch etwas weiter &ndash; das ist normal (Dichtungssetzen)',
    'If a stud turns more than 1/4 turn &ndash; something may have shifted &ndash; investigate':
        'Wenn ein Bolzen mehr als 1/4 Umdrehung dreht &ndash; etwas koennte sich verschoben haben &ndash; untersuchen',
    'After re-torque, no further re-torques needed unless head is removed':
        'Nach dem Nachziehen keine weiteren Nachzuege noetig, es sei denn der Kopf wird ausgebaut',
    # Oil Change
    '<strong>3.</strong> Unfold filter paper and hold against light (Filterpapier auseinanderfalten, gegen Licht halten)':
        '<strong>3.</strong> Filterpapier auseinanderfalten und gegen Licht halten',
    '<strong>5.</strong> Metal particles = find the cause, do not ignore! (Metallpartikel = Ursache finden!)':
        '<strong>5.</strong> Metallpartikel = Ursache finden, nicht ignorieren!',
    'Filter paper (clean = reference for future comparisons)':
        'Filterpapier (sauber = Referenz fuer kuenftige Vergleiche)',
    'If particles: close-up + determine material (aluminum, steel, copper)':
        'Bei Partikeln: Nahaufnahme + Material bestimmen (Aluminium, Stahl, Kupfer)',
    # Spark Read
    'Spark plug socket 5/8&quot; / 16 mm':
        'Zuendkerzen-Nuss 5/8&quot; / 16 mm',
    'Magnifying glass (Lupe) for insulator inspection':
        'Lupe zur Isolator-Pruefung',
    'Good lighting':
        'Gute Beleuchtung',
    '<strong>Light tan / gray (Hellbraun / Grau):</strong> IDEAL &ndash; correct mixture, good combustion (Idealer Zustand)':
        '<strong>Hellbraun / Grau:</strong> IDEAL &ndash; korrektes Gemisch, gute Verbrennung',
    '<strong>1.</strong> Engine at operating temperature, run for at least 10 minutes under varying load':
        '<strong>1.</strong> Motor auf Betriebstemperatur, mindestens 10 Minuten unter wechselnder Last',
    '<strong>2.</strong> Shut off engine at 2,500 RPM (do NOT idle first &ndash; idle enriches the reading)':
        '<strong>2.</strong> Motor bei 2.500 U/min abstellen (NICHT vorher in Leerlauf gehen &ndash; Leerlauf verfaelscht die Ablesung)',
    '<strong>3.</strong> Pull ALL 8 plugs &ndash; lay out in cylinder order (alle 8 Kerzen ziehen &ndash; in Zylinderreihenfolge auslegen)':
        '<strong>3.</strong> ALLE 8 Kerzen ziehen &ndash; in Zylinderreihenfolge auslegen',
    '<strong>5.</strong> One cylinder different from others = that cylinder has a specific issue':
        '<strong>5.</strong> Ein Zylinder anders als die anderen = dieser Zylinder hat ein spezifisches Problem',
    'Install fresh plugs before the reading run for clearest results':
        'Neue Kerzen vor dem Lese-Lauf einsetzen fuer klarste Ergebnisse',
    'DellOrto DRLA 45: each barrel feeds 4 cylinders &ndash; if one bank is different, adjust that carburetor':
        'DellOrto DRLA 45: jeder Vergaser versorgt 4 Zylinder &ndash; wenn eine Bank abweicht, diesen Vergaser einstellen',
    'Photograph each plug for comparison at later tuning sessions':
        'Jede Kerze fotografieren fuer Vergleich bei spaeteren Tuning-Sitzungen',
    'All 8 plugs laid out in order &ndash; reference for future readings':
        'Alle 8 Kerzen in Reihenfolge ausgelegt &ndash; Referenz fuer kuenftige Ablesungen',
}

# DE->EN for remaining German lines
DE_EN_2 = {
    'Alle 10 Muttern handfest auf die Stehbolzen drehen (Kopfdichtung sitzt, Kopf ausgerichtet).':
        'Hand-start all 10 nuts on studs (head gasket seated, head aligned).',
    '<strong>Stufe 2:</strong> Im selben Schema auf 55 ft-lbs (75 Nm) anziehen.':
        '<strong>Stage 2:</strong> In same sequence, torque to 55 ft-lbs (75 Nm).',
    '5 Minuten warten.':
        'Wait 5 minutes.',
    '<strong>Stufe 3:</strong> Obere Reihe (Blind Holes / Sackloch) auf 80 ft-lbs (108 Nm). Untere Reihe (Water Holes / Wasserkanal) auf 70 ft-lbs (95 Nm) + Dichtmittel auf Gewinde!':
        '<strong>Stage 3:</strong> Upper row (blind holes) to 80 ft-lbs (108 Nm). Lower row (water jacket) to 70 ft-lbs (95 Nm) + sealant on threads!',
    'Schema beachten: 1-2-3-4-5-6-7-8-9-10 im Kreuz von der Mitte nach au&szlig;en (siehe Diagramm unten).':
        'Follow pattern: 1-2-3-4-5-6-7-8-9-10 in cross pattern from center outward (see diagram below).',
    'Kreuzschema von der Mitte nach au&szlig;en!':
        'Cross pattern from center outward!',
    'Lange Bolzen (Sackloch) und kurze Bolzen (Wasserkanal) haben <strong>unterschiedliche Endwerte</strong>':
        'Long studs (blind holes) and short studs (water jacket) have <strong>different final torque values</strong>',
    'ARP Ultra-Torque auf Gewinde UND Mutterauflage &ndash; ohne Schmierung sind die Werte falsch!':
        'ARP Ultra-Torque on threads AND nut face &ndash; without lubrication the values are wrong!',
    # Fuel Card German lines
    'Alle Kraftstoffleitungen, Schlauchklemmen und Anschl&uuml;sse auf festen Sitz pr&uuml;fen.':
        'Check all fuel lines, hose clamps, and fittings for tight fit.',
    'Kraftstofffilter auf Sauberkeit kontrollieren (bei Rebuild immer erneuern).':
        'Check fuel filter for cleanliness (always replace during rebuild).',
    'Kraftstoffdruck-Manometer am Vergaser-Eingang anschlie&szlig;en.':
        'Connect fuel pressure gauge at carburetor inlet.',
    'Motor anlassen (oder Anlasser drehen lassen) &ndash; Druck ablesen: Soll 5.5&ndash;7.0 psi (0.38&ndash;0.48 bar).':
        'Start engine (or crank with starter) &ndash; read pressure: target 5.5&ndash;7.0 psi (0.38&ndash;0.48 bar).',
    'Zu hoch: Druckregler einbauen oder Pumpe pr&uuml;fen. Zu niedrig: Pumpe, Filter oder Leitung verstopft.':
        'Too high: install pressure regulator or check pump. Too low: pump, filter, or line blocked.',
    'Auf Leckagen an allen Verbindungen pr&uuml;fen &ndash; Feuerrisiko!':
        'Check all connections for leaks &ndash; fire hazard!',
    'Zu hoher Druck = Vergaser l&auml;uft &uuml;ber (Flooding) &ndash; Druckregler erforderlich':
        'Excessive pressure = carburetor flooding &ndash; pressure regulator required',
    'Alle Verbindungen auf Dichtheit pr&uuml;fen &ndash; vor dem Erststart!':
        'Check all connections for leaks &ndash; before first start!',
    'Feuerl&ouml;scher bereithalten':
        'Have fire extinguisher ready',
    '<strong>Nicht &uuml;berziehen! Handfest + max 1/4 Umdrehung.</strong> Vergaser-Flansch ist empfindlich. (Do not overtighten! Hand-tight + max 1/4 turn. Carburetor flange is delicate.)':
        '<strong>Do not overtighten! Hand-tight + max 1/4 turn.</strong> Carburetor flange is delicate.',
}


def process_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    in_guide = False
    guide_depth = 0
    stats = {'en_de': 0, 'de_en': 0, 'bilingual': 0, 'skipped': 0}
    
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
            
            if inner in EN_DE_2:
                de_text = EN_DE_2[inner]
                lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{inner}</span>{suffix}'
                stats['en_de'] += 1
            elif inner in DE_EN_2:
                en_text = DE_EN_2[inner]
                lines[i] = f'{prefix}<span class="de">{inner}</span><span class="en">{en_text}</span>{suffix}'
                stats['de_en'] += 1
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
