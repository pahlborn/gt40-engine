#!/usr/bin/env python3
"""
Add dual-language spans to build-log.html guide content.
For each <li> in guide sections, wraps content in <span class="de">...</span><span class="en">...</span>
CSS toggles visibility based on html[lang].
"""
import re
import html as htmlmod

# ============================================================
# TRANSLATION DICTIONARY: English HTML -> German HTML
# Key = exact innerHTML of <li>, Value = German translation
# ============================================================
TRANSLATIONS = {
    # ---- PHASE 1: Step 1 - Block Visual Inspection ----
    'Lift short block from crate (2 persons, ~155 lbs / 70 kg)':
        'Short Block aus Kiste heben (2 Personen, ~70 kg)',
    'Mount on engine stand (adapter for 302/351W pattern)':
        'Auf Motorst&auml;nder montieren (Adapter f&uuml;r 302/351W-Muster)',
    'Remove preservation / shipping oil':
        'Konservierungs- / Versand&ouml;l entfernen',
    'Work light / LED inspection lamp':
        'Arbeitsleuchte / LED-Inspektionslampe',
    'Inspection mirror (dental or telescoping)':
        'Inspektionsspiegel (Dental- oder Teleskopspiegel)',
    'Magnifying glass for hairline cracks (Haarrisse)':
        'Lupe f&uuml;r Haarrisse',
    '<strong>Cylinder Bores (Lauffl&auml;chen):</strong> No scoring, no ridge at TDC':
        '<strong>Zylinderbohrungen (Lauffl&auml;chen):</strong> Keine Riefen, kein Grat am OT',
    '<strong>Sealing Surfaces (Dichtfl&auml;chen):</strong> Deck, intake rails, timing cover face &ndash; no gouges, no pitting':
        '<strong>Dichtfl&auml;chen:</strong> Deck, Ansaugschienen, Steuerkettendeckel-Fl&auml;che &ndash; keine Kerben, keine Lochfra&szlig;stellen',
    '<strong>Threaded Holes (Gewindebohrungen):</strong> No damaged threads, no debris in blind holes':
        '<strong>Gewindebohrungen:</strong> Keine besch&auml;digten Gewinde, kein Schmutz in Sacklochbohrungen',
    '<strong>Freeze Plugs (Froststopfen):</strong> All tight, no rust':
        '<strong>Froststopfen:</strong> Alle fest, kein Rost',
    '<strong>Oil Galleries (&Ouml;lkan&auml;le):</strong> Gallery plugs present and sealed':
        '<strong>&Ouml;lkan&auml;le:</strong> Alle Stopfen vorhanden und dicht',
    'Deck surface both banks':
        'Deckfl&auml;che beide B&auml;nke',
    'ID plate / casting number':
        'ID-Plakette / Gussnummer',
    'Any anomalies (casting flaws, scratches)':
        'Auff&auml;lligkeiten (Gussfehler, Kratzer)',
    '~30 min. incl. unpacking &amp; mounting':
        '~30 Min. inkl. Auspacken &amp; Aufbauen',

    # ---- Step 2: Chase Threads ----
    'Tap set: 7/16&quot;-14, 3/8&quot;-16, 5/16&quot;-18 (11.11 mm, 9.53 mm, 7.94 mm)':
        'Gewindebohrersatz: 7/16&quot;-14, 3/8&quot;-16, 5/16&quot;-18 (11,11 mm, 9,53 mm, 7,94 mm)',
    'Compressed air gun with extension':
        'Druckluftpistole mit Verl&auml;ngerung',
    'Safety glasses (mandatory!)':
        'Schutzbrille (Pflicht!)',
    'T-handle tap wrench':
        'T-Griff-Windeisen',
    'Brake cleaner (residual dirt)':
        'Bremsenreiniger (Restschmutz)',
    'Clean lint-free rags':
        'Saubere fusselfreie T&uuml;cher',
    'All holes free of chips and residue':
        'Alle Bohrungen frei von Sp&auml;nen und R&uuml;ckst&auml;nden',
    'Tap runs freely in every hole':
        'Gewindebohrer l&auml;uft in jeder Bohrung frei',
    '~45 min.':
        '~45 Min.',

    # ---- Step 3: Deck Height ----
    'Depth micrometer (Tiefenmikrometer) or depth gauge':
        'Tiefenmikrometer oder Tiefenmessschieber',
    'Straightedge (Haarlineal) + feeler gauge (F&uuml;hlerlehre)':
        'Haarlineal + F&uuml;hlerlehre',

    # ---- Step 5: Rotate Crank ----
    'Crankshaft installed in block':
        'Kurbelwelle im Block eingebaut',
    'All main caps torqued to spec':
        'Alle Hauptlagerdeckel auf Drehmoment angezogen',
    'Assembly lube on all bearing surfaces':
        'Montagepaste auf allen Lagerfl&auml;chen',
    'Breaker bar with correct socket (15/16&quot; or 24 mm for SBF)':
        'Knebel mit passender Nuss (15/16&quot; oder 24 mm f&uuml;r SBF)',
    'Attach socket/breaker bar to harmonic balancer bolt (or front crank snout)':
        'Nuss/Knebel an Schwingungsd&auml;mpfer-Schraube ansetzen (oder vorderes Kurbelwellende)',
    'Rotate clockwise (viewed from front) through at least 2 full revolutions':
        'Im Uhrzeigersinn drehen (von vorne gesehen), mindestens 2 volle Umdrehungen',
    'Feel for any tight spots, binding, or grinding':
        'Auf Schwerg&auml;ngigkeit, Klemmen oder Schleifen achten',
    'Crank should rotate smoothly with consistent resistance':
        'Kurbelwelle sollte gleichm&auml;&szlig;ig und mit konstantem Widerstand drehen',
    'If any binding: STOP &ndash; investigate before proceeding':
        'Bei Klemmen: STOPP &ndash; vor dem Weitermachen untersuchen',
    '<strong>Smooth, consistent rotation</strong> through 720&deg; (2 full turns)':
        '<strong>Gleichm&auml;&szlig;ige, konstante Drehung</strong> &uuml;ber 720&deg; (2 volle Umdrehungen)',
    'No tight spots, no grinding, no sudden resistance changes':
        'Keine Schwerg&auml;ngigkeit, kein Schleifen, keine pl&ouml;tzlichen Widerstands&auml;nderungen',
    'Any binding may indicate: incorrect bearing clearance, misaligned main cap, debris in bore, or thrust bearing issue':
        'Klemmen kann bedeuten: falsches Lagerspiel, falsch ausgerichteter Lagerdeckel, Fremdkörper in Bohrung oder Drucklagerproblem',
    'Do this check after EVERY assembly step that adds rotating/reciprocating parts':
        'Diese Pr&uuml;fung nach JEDEM Montageschritt durchf&uuml;hren, der drehende/oszillierende Teile hinzuf&uuml;gt',

    # ---- Step 6: Oil Gallery Plugs ----
    'Flashlight or bore scope':
        'Taschenlampe oder Endoskop',
    'Pick tool (to test plug tightness)':
        'Haken (zum Pr&uuml;fen der Stopfenfestigkeit)',
    'Brass drift + hammer (if replacement needed)':
        'Messingdorn + Hammer (bei Bedarf zum Austausch)',
    'Locate all oil gallery plugs (rear main, sides, front)':
        'Alle &Ouml;lkanalstopfen lokalisieren (hinten, seitlich, vorne)',
    'Verify each plug is fully seated and sealed':
        'Pr&uuml;fen ob jeder Stopfen vollst&auml;ndig sitzt und dicht ist',
    'Look for signs of seepage or rust around plugs':
        'Auf Anzeichen von Undichtigkeit oder Rost um die Stopfen achten',
    'If loose: remove, clean threads, apply Permatex #2 or equivalent, reinstall':
        'Bei Lockerheit: Entfernen, Gewinde reinigen, Permatex #2 oder &Auml;quivalent auftragen, wieder einsetzen',
    'All plugs seated, sealed, no leakage signs':
        'Alle Stopfen sitzen fest, sind dicht, keine Undichtigkeitszeichen',
    'A leaking gallery plug can cause catastrophic oil loss at RPM':
        'Ein undichter &Ouml;lkanalstopfen kann bei Drehzahl katastrophalen &Ouml;lverlust verursachen',

    # ---- Step 7: Cam Bearing Type ----
    'Visual inspection only':
        'Nur Sichtpr&uuml;fung',
    'Note current bearing type (babbit, shell, or roller) and condition':
        'Aktuellen Lagertyp (Wei&szlig;metall, Schale oder Rolle) und Zustand notieren',
    'Babbit (cast-in): original BOSS 302 block style':
        'Wei&szlig;metall (eingegossen): Original-BOSS-302-Block-Bauart',
    'Shell bearings: replaceable, check for wear/scoring':
        'Lagerschalen: austauschbar, auf Verschlei&szlig;/Riefen pr&uuml;fen',
    'Roller bearings: if previously installed, verify condition':
        'Rollenlager: falls bereits eingebaut, Zustand pr&uuml;fen',
    'This determines Phase 2 cam bearing installation approach':
        'Dies bestimmt die Vorgehensweise f&uuml;r den Nockenwellen-Lagereinbau in Phase 2',

    # ---- Step 8: Main Bearing Clearance ----
    'Block cleaned, bearing bores clean, dry &amp; grease-free':
        'Block gereinigt, Lagerbohrungen sauber, trocken &amp; fettfrei',
    'Bearing shells assigned to positions':
        'Lagerschalen den Positionen zugeordnet',
    'Crankshaft cleaned':
        'Kurbelwelle gereinigt',
    'Plastigage Green PG-1: 0.001&quot;&ndash;0.003&quot; (0.025&ndash;0.076 mm)':
        'Plastigage Gr&uuml;n PG-1: 0,001&quot;&ndash;0,003&quot; (0,025&ndash;0,076 mm)',
    'Plastigage Red PR-1: 0.002&quot;&ndash;0.006&quot; (0.051&ndash;0.152 mm)':
        'Plastigage Rot PR-1: 0,002&quot;&ndash;0,006&quot; (0,051&ndash;0,152 mm)',
    'Torque wrench to 100 ft-lbs (135 Nm)':
        'Drehmomentschl&uuml;ssel bis 100 ft-lbs (135 Nm)',
    'Assembly Lube (COMP 153, Lucas 10153, or Red Line)':
        'Montagepaste (COMP 153, Lucas 10153 oder Red Line)',
    '<strong>1.</strong> Lower bearing shells into main caps (tab in notch, <strong>NO oil</strong> on bearing surface)':
        '<strong>1.</strong> Untere Lagerschalen in Hauptlagerdeckel einlegen (Nase in Nut, <strong>KEIN &Ouml;l</strong> auf Lagerfl&auml;che)',
    '<strong>2.</strong> Upper shells into block saddles':
        '<strong>2.</strong> Obere Schalen in Blocksattel einlegen',
    '<strong>3.</strong> Crankshaft onto upper shells':
        '<strong>3.</strong> Kurbelwelle auf obere Schalen auflegen',
    '<strong>4.</strong> Plastigage strip on main journal &ndash; across full width, <strong>NOT on oil channel</strong>':
        '<strong>4.</strong> Plastigage-Streifen auf Hauptlagerzapfen &ndash; &uuml;ber die gesamte Breite, <strong>NICHT auf &Ouml;lkanal</strong>',
    '<strong>5.</strong> Main cap on, torque to spec. <strong>DO NOT ROTATE CRANK!</strong>':
        '<strong>5.</strong> Lagerdeckel aufsetzen, auf Drehmoment anziehen. <strong>KURBELWELLE NICHT DREHEN!</strong>',
    '<strong>6.</strong> Remove cap, compare crushed width to scale &rarr; bearing clearance':
        '<strong>6.</strong> Deckel abnehmen, Quetschbreite mit Skala vergleichen &rarr; Lagerspiel',
    '<strong>7.</strong> Record value, remove all Plastigage residue':
        '<strong>7.</strong> Wert notieren, alle Plastigage-R&uuml;ckst&auml;nde entfernen',
    '<strong>8.</strong> Repeat for all 5 main bearings':
        '<strong>8.</strong> F&uuml;r alle 5 Hauptlager wiederholen',
    'If out of spec, use different shell thickness (Std / 0.001&quot; / 0.002&quot; undersize). <strong>Never file!</strong>':
        'Bei Abweichung andere Schalendicke verwenden (Std / 0,001&quot; / 0,002&quot; Unterma&szlig;). <strong>Niemals feilen!</strong>',
    'Use Green Plastigage first; switch to Red only if clearance exceeds Green range':
        'Zuerst gr&uuml;ne Plastigage verwenden; nur auf Rot wechseln wenn Spiel den gr&uuml;nen Bereich &uuml;berschreitet',
    'Plastigage strip on journal (before cap install)':
        'Plastigage-Streifen auf Zapfen (vor Deckelmontage)',
    'Crushed Plastigage vs. scale (reading)':
        'Gequetschte Plastigage vs. Skala (Ablesung)',

    # ---- Step 9: Crankshaft Endplay ----
    'Main bearing caps torqued':
        'Hauptlagerdeckel auf Drehmoment angezogen',
    'Thrust bearing at position 3 (SBF standard)':
        'Drucklager an Position 3 (SBF-Standard)',
    'Dial indicator with magnetic base':
        'Messuhr mit Magnetfu&szlig;',
    'Pry bar or large screwdriver':
        'Brecheisen oder gro&szlig;er Schraubendreher',
    '<strong>1.</strong> Mount dial indicator on block, plunger touching crank snout or flange (axial direction)':
        '<strong>1.</strong> Messuhr am Block montieren, Messbolzen ber&uuml;hrt Kurbelwellenstumpf oder Flansch (axiale Richtung)',
    '<strong>2.</strong> Pry crankshaft fully forward &ndash; zero gauge':
        '<strong>2.</strong> Kurbelwelle ganz nach vorne hebeln &ndash; Messuhr auf Null stellen',
    '<strong>3.</strong> Pry crankshaft fully rearward &ndash; read gauge':
        '<strong>3.</strong> Kurbelwelle ganz nach hinten hebeln &ndash; Messuhr ablesen',
    '<strong>4.</strong> Repeat 3 times, take average':
        '<strong>4.</strong> 3 Mal wiederholen, Durchschnitt bilden',
    'If out of spec: check thrust bearing shell condition, replace if worn':
        'Bei Abweichung: Drucklagerschale pr&uuml;fen, bei Verschlei&szlig; austauschen',
    'Thrust bearings wear faster on manual transmission cars (clutch pressure)':
        'Drucklager verschlei&szlig;en schneller bei Schaltgetriebe-Fahrzeugen (Kupplungsdruck)',

    # ---- Step 10: Cam Visual Inspection ----
    'Lobe profiles: no flat spots, no pitting':
        'Nockenprofile: keine Abflachungen, keine Lochfra&szlig;stellen',
    'Journal surfaces: smooth, no scoring':
        'Lagerzapfen-Oberfl&auml;chen: glatt, keine Riefen',
    'Distributor drive gear: teeth intact':
        'Verteiler-Antriebszahnrad: Z&auml;hne intakt',
    'Compare lobe profiles visually (intake vs. exhaust should differ)':
        'Nockenprofile visuell vergleichen (Einlass vs. Auslass sollten unterschiedlich sein)',

    # ---- Step 11: Cam Journals ----
    'Outside micrometer (0&ndash;2&quot; / 0&ndash;50 mm)':
        'Au&szlig;enmikrometer (0&ndash;2&quot; / 0&ndash;50 mm)',
    'V-blocks to support camshaft (optional but recommended)':
        'Prismenb&ouml;cke zur Nockenwellenauflage (optional aber empfohlen)',
    'COMP Cams spec sheet for XE274HR':
        'COMP Cams Datenblatt f&uuml;r XE274HR',
    'Measure each journal at 2 points (0&deg; and 90&deg;) &ndash; check for out-of-round':
        'Jeden Zapfen an 2 Stellen messen (0&deg; und 90&deg;) &ndash; auf Unrundheit pr&uuml;fen',
    'Compare to COMP spec sheet':
        'Mit COMP-Datenblatt vergleichen',
    'All journals within spec, no taper, no out-of-round':
        'Alle Zapfen innerhalb Toleranz, kein Konus, keine Unrundheit',

    # ---- Step 12: Lifters ----
    'Clean, well-lit workspace':
        'Sauberer, gut beleuchteter Arbeitsplatz',
    'Magnifying glass or loupe':
        'Vergr&ouml;&szlig;erungsglas oder Lupe',
    'Inspect roller wheel: spins freely, no flat spots':
        'Laufrolle pr&uuml;fen: dreht frei, keine Abflachungen',
    'Inspect body: no scoring, no galling on OD':
        'K&ouml;rper pr&uuml;fen: keine Riefen, kein Fressen am Au&szlig;endurchmesser',
    'Check oil metering hole (must be clear)':
        '&Ouml;l-Dosierbohrung pr&uuml;fen (muss frei sein)',
    'Mark each lifter for its position (intake/exhaust, cylinder number)':
        'Jeden St&ouml;&szlig;el f&uuml;r seine Position markieren (Einlass/Auslass, Zylindernummer)',
    'Morel 5327 are HLT (High Limited Travel) &ndash; the piston inside has restricted movement by design':
        'Morel 5327 sind HLT (High Limited Travel) &ndash; der innere Kolben hat konstruktionsbedingt begrenzten Hub',
    'If a roller doesn&rsquo;t spin freely: <strong>reject that lifter</strong>':
        'Wenn eine Rolle nicht frei dreht: <strong>diesen St&ouml;&szlig;el aussortieren</strong>',

    # ---- Step 13: Rockers ----
    'Visual inspection, magnifying glass':
        'Sichtpr&uuml;fung, Vergr&ouml;&szlig;erungsglas',
    'Roller tip: rolls freely, no play, no flat spots':
        'Rollenspitze: dreht frei, kein Spiel, keine Abflachungen',
    'Trunnion/fulcrum: no cracks, no discoloration':
        'Drehpunkt/Auflage: keine Risse, keine Verf&auml;rbungen',
    'Check that all 16 pieces are the correct ratio (1.6:1 for COMP 1632-16)':
        'Pr&uuml;fen ob alle 16 St&uuml;ck das richtige &Uuml;bersetzungsverh&auml;ltnis haben (1,6:1 f&uuml;r COMP 1632-16)',

    # ---- Step 14: Polylocks ----
    'Visual inspection':
        'Sichtpr&uuml;fung',
    'Thread gauge or known-good stud (optional)':
        'Gewindelehre oder bekannt guter Stehbolzen (optional)',
    'Inspect all 16 polylocks for thread damage':
        'Alle 16 Polylocks auf Gewindesch&auml;den pr&uuml;fen',
    'Verify internal hex/allen fits adjustment tool':
        'Pr&uuml;fen ob Innensechskant zum Einstellwerkzeug passt',
    'Spin each on a rocker stud by hand &ndash; must thread smoothly':
        'Jeden auf einen Kipphebelbolzen von Hand drehen &ndash; muss leichtg&auml;ngig laufen',

    # ---- Step 15: Sealing Surface Flatness ----
    'Straightedge (precision machinist&rsquo;s rule, min. 12&quot; / 300 mm)':
        'Haarlineal (Pr&auml;zisions-Metalllineal, min. 12&quot; / 300 mm)',
    'Feeler gauge set':
        'F&uuml;hlerlehrensatz',
    'Check deck surface, intake surface, exhaust surface':
        'Deckfl&auml;che, Ansaugfl&auml;che, Auslassfl&auml;che pr&uuml;fen',
    'Place straightedge diagonally and lengthwise':
        'Haarlineal diagonal und l&auml;ngs auflegen',
    'Slide feeler gauge under &ndash; max. 0.003&quot; (0.076 mm) acceptable':
        'F&uuml;hlerlehre unterschieben &ndash; max. 0,003&quot; (0,076 mm) akzeptabel',
    'If exceeds 0.003&quot;: head must be milled (planen lassen)':
        'Bei &Uuml;berschreitung von 0,003&quot;: Kopf muss geplant werden',

    # ---- Step 16: Chamber Volume ----
    'Graduated burette (100 cc / 100 ml)':
        'Graduierte B&uuml;rette (100 cc / 100 ml)',
    'Plexiglas plate with hole (Plexiglas with hole)':
        'Plexiglasplatte mit Bohrung',
    'Mineral spirits or light oil (colored for visibility)':
        'Testbenzin oder leichtes &Ouml;l (eingef&auml;rbt f&uuml;r Sichtbarkeit)',
    'Grease (to seal plate edges)':
        'Fett (zum Abdichten der Plattenkanten)',
    '<strong>1.</strong> Install valves and spark plug in head':
        '<strong>1.</strong> Ventile und Z&uuml;ndkerze im Kopf montieren',
    '<strong>2.</strong> Head inverted on bench, chamber facing up':
        '<strong>2.</strong> Kopf umgedreht auf Werkbank, Brennraum nach oben',
    '<strong>3.</strong> Apply grease to plexiglas edges, place over chamber':
        '<strong>3.</strong> Fett auf Plexiglaskanten auftragen, &uuml;ber Brennraum legen',
    '<strong>4.</strong> Fill through hole with burette &ndash; record volume':
        '<strong>4.</strong> Durch Bohrung mit B&uuml;rette bef&uuml;llen &ndash; Volumen notieren',
    '<strong>5.</strong> Repeat for all chambers &ndash; max variance 1 cc':
        '<strong>5.</strong> F&uuml;r alle Brennr&auml;ume wiederholen &ndash; max. Abweichung 1 cc',
    'All chambers within 1 cc of each other':
        'Alle Brennr&auml;ume innerhalb 1 cc zueinander',
    'If variance &gt; 1 cc: requires machining (fly-cutting)':
        'Bei Abweichung &gt; 1 cc: erfordert maschinelle Bearbeitung (Planfr&auml;sen)',
    'This measurement feeds directly into compression ratio calculation':
        'Dieses Ma&szlig; flie&szlig;t direkt in die Verdichtungsverh&auml;ltnis-Berechnung ein',

    # ---- Step 17: Rocker Studs ----
    'Thread gauge 7/16&quot;-20 (optional)':
        'Gewindelehre 7/16&quot;-20 (optional)',
    'Verify all 16 studs are 7/16&quot; &ndash; if screw-in, check installed height':
        'Alle 16 Bolzen auf 7/16&quot; pr&uuml;fen &ndash; bei Schraubbolzen Einbauh&ouml;he pr&uuml;fen',
    'Check threads: clean, no galling, polylocks thread smoothly':
        'Gewinde pr&uuml;fen: sauber, kein Fressen, Polylocks laufen leichtg&auml;ngig',
    'AFR 1399 heads come with pressed-in studs by default':
        'AFR 1399 K&ouml;pfe werden standardm&auml;&szlig;ig mit eingepressten Bolzen geliefert',
    'If converting to screw-in (ARP #134-7101): requires machine shop to drill/tap':
        'Bei Umr&uuml;stung auf Schraubbolzen (ARP #134-7101): Maschinenwerkstatt f&uuml;r Bohren/Schneiden erforderlich',

    # ---- Step 18: Springs & Retainers ----
    'Verify all 16 springs are AFR 8605 (or chosen upgrade)':
        'Alle 16 Federn als AFR 8605 (oder gew&auml;hltes Upgrade) best&auml;tigen',
    'Verify all 16 retainers are AFR 8600 (titanium)':
        'Alle 16 Federteller als AFR 8600 (Titan) best&auml;tigen',
    'Check for shipping damage: no cracks, no chips on titanium retainers':
        'Auf Transportsch&auml;den pr&uuml;fen: keine Risse, keine Absplitterungen an Titan-Federtellern',
    'Ti retainers are lighter than steel &rarr; less valvetrain mass &rarr; higher RPM capability':
        'Titan-Federteller sind leichter als Stahl &rarr; weniger Ventiltrieb-Masse &rarr; h&ouml;here Drehzahlf&auml;higkeit',

    # ---- Step 19: Installed Spring Height ----
    'Spring height micrometer or caliper':
        'Federh&ouml;hen-Mikrometer oder Messschieber',
    'Spring height gauge (optional, more accurate)':
        'Federh&ouml;hen-Lehre (optional, genauer)',
    'Measure installed height: retainer underside to spring seat':
        'Einbauh&ouml;he messen: Federteller-Unterseite bis Federsitz',
    'All 16 must be within spec (check AFR documentation for 8605)':
        'Alle 16 m&uuml;ssen innerhalb der Toleranz liegen (AFR-Dokumentation f&uuml;r 8605 pr&uuml;fen)',
    'If too tall: use shims under spring (0.015&quot; or 0.030&quot;)':
        'Bei zu gro&szlig;er H&ouml;he: Unterlegscheiben unter Feder verwenden (0,015&quot; oder 0,030&quot;)',
    'If too short: spring will be over-compressed &ndash; check seat machining':
        'Bei zu geringer H&ouml;he: Feder wird zu stark komprimiert &ndash; Sitzbearbeitung pr&uuml;fen',
    'Consistent installed height across all 16 = consistent valve control':
        'Gleichm&auml;&szlig;ige Einbauh&ouml;he bei allen 16 = gleichm&auml;&szlig;ige Ventilsteuerung',

    # ---- Step 20: Coil Bind ----
    'Spring height micrometer':
        'Federh&ouml;hen-Mikrometer',
    'Calculator':
        'Taschenrechner',
    'Calculate: Installed Height &minus; Max Lift &minus; Coil Bind Height = Clearance':
        'Berechnung: Einbauh&ouml;he &minus; Max. Hub &minus; Blocklänge = Freigang',
    'Must have &ge; 0.060&quot; (1.52 mm) clearance to coil bind':
        'Mindestens &ge; 0,060&quot; (1,52 mm) Abstand zum Federblock',
    'Coil bind = spring goes solid = <strong>catastrophic valve train failure</strong>':
        'Federblock = Feder geht auf Block = <strong>katastrophaler Ventiltrieb-Ausfall</strong>',
    'If clearance is marginal: use shorter retainers or different springs':
        'Bei knappem Freigang: k&uuml;rzere Federteller oder andere Federn verwenden',

    # ---- Step 21: Open Spring Pressure ----
    'Spring tester (bench type preferred)':
        'Federpr&uuml;fger&auml;t (Werkbank-Typ bevorzugt)',
    'Measure open pressure at max valve lift (0.565&quot; / 14.35 mm for XE274HR)':
        '&Ouml;ffnungsdruck bei max. Ventilhub messen (0,565&quot; / 14,35 mm f&uuml;r XE274HR)',
    'Compare to AFR 8605 spec (check documentation)':
        'Mit AFR-8605-Spezifikation vergleichen (Dokumentation pr&uuml;fen)',
    'All 16 springs should be within 10% of each other':
        'Alle 16 Federn sollten innerhalb von 10% zueinander liegen',
    'Weak springs = valve float at RPM. Too stiff = accelerated cam/lifter wear':
        'Schwache Federn = Ventilflattern bei Drehzahl. Zu steif = beschleunigter Nocken-/St&ouml;&szlig;elverschlei&szlig;',

    # ---- Step 22: Valve Keepers ----
    'Small magnet or pick tool':
        'Kleiner Magnet oder Haken',
    'Check all 32 keepers (2 per valve, 16 valves)':
        'Alle 32 Ventilkeile pr&uuml;fen (2 pro Ventil, 16 Ventile)',
    'Verify 7&deg; angle matches titanium retainers':
        '7&deg;-Winkel passend zu Titan-Federtellern best&auml;tigen',
    'No cracks, no wear on contact surfaces':
        'Keine Risse, kein Verschlei&szlig; an Kontaktfl&auml;chen',
    'Keepers are the smallest but most critical retention parts &ndash; one failure = dropped valve':
        'Ventilkeile sind die kleinsten aber kritischsten Halteelemente &ndash; ein Versagen = gefallenes Ventil',
    'Always use new keepers with new retainers':
        'Immer neue Keile mit neuen Federtellern verwenden',
    'Organize in labeled bags by position':
        'In beschrifteten Beuteln nach Position sortieren',

    # ---- Step 23: Rod Bearing Clearance ----
    'Same as main bearing clearance procedure, but for connecting rod bearings':
        'Gleiche Vorgehensweise wie Hauptlagerspiel, aber f&uuml;r Pleuellager',
    'Plastigage, torque wrench, assembly lube':
        'Plastigage, Drehmomentschl&uuml;ssel, Montagepaste',
    'Torque wrench (45 ft-lbs / 61 Nm for rod bolts)':
        'Drehmomentschl&uuml;ssel (45 ft-lbs / 61 Nm f&uuml;r Pleuelschrauben)',

    # ---- Step 24: Ring End Gap ----
    'Ring end gap is set by the <strong>bore size</strong>, not the piston':
        'Der Ringstoß wird durch die <strong>Bohrungsgr&ouml;&szlig;e</strong> bestimmt, nicht durch den Kolben',
    'File only in ONE direction &ndash; NEVER back and forth!':
        'Nur in EINE Richtung feilen &ndash; NIEMALS hin und her!',
    'If gap is too large: wrong ring set or worn bore':
        'Bei zu gro&szlig;em Sto&szlig;: falscher Ringsatz oder verschlissene Bohrung',

    # ---- General/Common translations ----
    'Torque wrench (Drehmomentschl&uuml;ssel)':
        'Drehmomentschl&uuml;ssel',
    'RTV silicone (Permatex Ultra Black or similar)':
        'RTV-Silikon (Permatex Ultra Black oder vergleichbar)',
    'Clean lint-free rags (fusselfreie T&uuml;cher)':
        'Saubere fusselfreie T&uuml;cher',
    'Assembly lube (Montagepaste)':
        'Montagepaste',
    'Thread sealant (Gewindedichtmittel)':
        'Gewindedichtmittel',
    '~15 min.':
        '~15 Min.',
    '~20 min.':
        '~20 Min.',
    '~30 min.':
        '~30 Min.',
    '~60 min.':
        '~60 Min.',
    '~90 min.':
        '~90 Min.',
}


def process_html(filepath):
    """Process build-log.html: add <span class="de">...</span><span class="en">...</span> to guide li elements."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    in_guide = False
    guide_depth = 0
    changes = 0
    skipped = 0
    already_done = 0

    for i, line in enumerate(lines):
        if 'class="step-guide"' in line:
            in_guide = True
            guide_depth = 0
        if in_guide:
            guide_depth += line.count('<div') - line.count('</div')
            if guide_depth <= 0 and '</div>' in line:
                in_guide = False

            # Skip lines that already have lang spans
            if 'class="de"' in line or 'class="en"' in line:
                already_done += 1
                continue

            # Process <li>...</li> on single line
            m = re.match(r'^(\s*<li>)(.*?)(</li>\s*)$', line)
            if m:
                prefix, inner, suffix = m.groups()
                inner_stripped = inner.strip()

                # Look up translation
                de_text = TRANSLATIONS.get(inner_stripped)
                if de_text:
                    lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{inner_stripped}</span>{suffix}'
                    changes += 1
                else:
                    # Check if already in German (contains umlauts/sharp-s and no typical English words)
                    decoded = htmlmod.unescape(inner_stripped)
                    has_german = bool(re.search(r'[\u00e4\u00f6\u00fc\u00c4\u00d6\u00dc\u00df]', decoded))
                    if has_german:
                        # Already German - no translation needed, skip
                        pass
                    else:
                        skipped += 1

    result = '\n'.join(lines)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f'Changes: {changes}')
    print(f'Already done: {already_done}')
    print(f'Skipped (no translation): {skipped}')
    return changes, skipped


if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'build-log.html'
    print(f'Processing {path}...')
    changes, skipped = process_html(path)
    print(f'Done. {changes} lines translated, {skipped} lines without translation.')
