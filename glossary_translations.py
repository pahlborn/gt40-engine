# -*- coding: utf-8 -*-
"""
Glossary field translations DE -> EN.
Adds data-de-content and data-en-content attributes to all glossary fields.
Updates switchGlossaryLang() to swap field contents.
"""
import re
import sys
import io
import html as hmod
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================
# Label translations
# ============================================================
LABEL_MAP = {
    'Was ist das?': 'What is it?',
    'Einfach gesagt:': 'Simply put:',
    'Warum?': 'Why?',
    'Wie messen?': 'How to measure?',
    'Warum wichtig?': 'Why important?',
    'Wichtig:': 'Important:',
    'Aufgabe:': 'Function:',
    'Beispiel:': 'Example:',
    'Verwendung:': 'Usage:',
    'Auswirkung:': 'Effect:',
    'Berechnung:': 'Calculation:',
    'Warum kritisch?': 'Why critical?',
    'Abgrenzung:': 'Distinction:',
    'In diesem Projekt:': 'In this project:',
    'Toleranz:': 'Tolerance:',
    'Typischer Wert:': 'Typical value:',
    'Wie berechnen?': 'How to calculate?',
    'Warum besonders wichtig?': 'Why especially important?',
    'Folge:': 'Consequence:',
    'Bei hydraulischem Lifter:': 'With hydraulic lifter:',
    'Verwandt:': 'Related:',
    'F\u00fcr uns:': 'For us:',
    'Warum gr\u00f6\u00dfer als Cam Lift?': 'Why larger than Cam Lift?',
}

# ============================================================
# Content translations keyed by label|first40chars of content
# ============================================================
FIELD_TRANSLATIONS = {
    # === 1. GRUNDBEGRIFFE ===
    # Bore
    'Was ist das?|Der Innendurchmesser des Zylinders.':
        'The internal diameter of the cylinder.',
    'Einfach gesagt:|Die Breite des Lochs, in dem der Kolben auf und ab':
        'The width of the hole in which the piston moves up and down.',
    'Warum?|Zusammen mit dem Hub bestimmt die Bohrung den Hubraum.':
        'Together with the stroke, the bore determines the displacement.',
    # Stroke
    'Was ist das?|Der Weg, den der Kolben zwischen OT und UT zur':
        'The distance the piston travels between TDC and BDC.',
    'Einfach gesagt:|Wie weit der Kolben bei einer vollst':
        'How far the piston travels in one complete movement up and back down.',
    # Displacement
    'Was ist das?|Das Volumen, das der Kolben zwischen OT und UT verdr':
        'The volume displaced by the piston between TDC and BDC.',
    'Einfach gesagt:|Der Raum, den der Kolben bei seiner Bewegung im Zylinder':
        'The space the piston sweeps through during its travel in the cylinder.',
    # BHP
    'Was ist das?|Die reale Leistung, gemessen an der Kurbelwelle':
        'The actual power measured at the crankshaft (on a brake dynamometer / dyno). BHP accounts for internal friction losses of the engine.',
    'Einfach gesagt:|Was der Motor tats':
        'What the engine actually delivers at its crankshaft \u2013 the most honest power figure.',
    'Abgrenzung:|HP (Horsepower) \u2013 oft theoretisch oder o':
        'HP (Horsepower) \u2013 often theoretical or measured without accessories (alternator, water pump). HP SAE gross (pre-1972) = no accessories, open exhaust \u2192 inflated numbers. WHP (Wheel Horsepower) = measured at the wheels, includes drivetrain losses.',
    'In diesem Projekt:|Alle Leistungsangaben sind BHP':
        'All power figures are BHP (crankshaft). The simulator calculates BHP based on BMEP, VE and mechanical efficiency.',
    # TDC
    'Was ist das?|Der h':
        'The highest point the piston reaches in the cylinder. The crankshaft has completed a half rotation.',
    'Warum?|OT ist eine wichtige Referenz f\u00fcr nahezu':
        'TDC is the primary reference for nearly all engine measurements.',
    # BDC
    'Was ist das?|Der tiefste Punkt, den der Kolben im Zylinder erreicht':
        'The lowest point the piston reaches in the cylinder.',
    'Warum?|OT und UT bestimmen zusammen den Hub.':
        'TDC and BDC together define the stroke.',

    # === 2. BLOCK & DECK ===
    # Engine Block
    'Was ist das?|Das Geh':
        'The housing that contains all cylinders and the crankshaft bearings. The foundation of the engine.',
    'Einfach gesagt:|Das Grundger\u00fcst des Motors.':
        'The basic framework of the engine.',
    # Deck Surface
    'Was ist das?|Die obere Planfl':
        'The upper machined surface of the block where the cylinder head mounts and the head gasket seals.',
    'Warum?|Die Lage dieser Fl\u00e4che beeinflusst Quenc':
        'The position of this surface affects quench distance and compression.',
    # Deck Height (Block)
    'Was ist das?|Der Abstand von der Mitte der Hauptlager':
        'The distance from the crankshaft main bearing centerline to the deck surface. A fixed block dimension.',
    'Warum wichtig?|Deck Height + Stroke + Rod Length + Comp':
        'Deck Height + Stroke + Rod Length + Compression Height determine where the piston sits at TDC. If the value does not match, the piston position changes.',
    'Wie messen?|1. Kurbelwelle und ein Kolben (ohne Ring':
        '1. Install crankshaft and one piston (without rings). 2. Rotate piston to TDC (highest point). 3. Place dial indicator on deck surface, zero it, then measure down to piston crown.',
    'Toleranz:|\u00b1 0.005" (0.13 mm). Bei abweichenden Wer':
        '\u00b1 0.005" (0.13 mm). If values deviate: have the block decked (machined flat).',
    # Piston-to-Deck Clearance
    'Was ist das?|Der Abstand zwischen Kolbenoberseite und Block':
        'The distance between the piston crown and the block deck surface at TDC. Positive = piston below deck ("in the hole"). Negative = piston above deck ("out of the hole").',
    'Typischer Wert:|0.005"\u20130.015" (0.13\u20130.38 mm) unter Deck.':
        '0.005"\u20130.015" (0.13\u20130.38 mm) below deck. Target for Boss 302: approx. 0.010" (0.25 mm).',
    'Wie messen?|1. Kolben (ohne Ringe) mit Pleuel und Ku':
        '1. Install piston (without rings) with rod and crankshaft. 2. Rotate piston to exact TDC (verify with dial indicator and degree wheel). 3. Dial indicator on deck surface, zero \u2192 measure to piston crown.',
    'Warum wichtig?|Bestimmt direkt die Quench Distance (= P':
        'Directly determines the quench distance (= piston-to-deck + compressed gasket thickness) and thus the compression ratio and detonation behavior.',
    # Piston Deck Height
    'Was ist das?|Die tats':
        'The actual position of the piston crown relative to the block deck surface at TDC.',

    # === 3. VERDICHTUNG ===
    # CR
    'Was ist das?|Das Verh':
        'The ratio of total cylinder volume (at BDC) to clearance volume (at TDC). Determines how much the air-fuel mixture is compressed before ignition.',
    'Einfach gesagt:|Ein Motor mit 10:1 hat bei OT nur noch e':
        'An engine with 10:1 has only one-tenth of the volume at TDC that was present at BDC.',
    # Static CR
    'Was ist das?|Das geometrische Verdichtungsverh':
        'The geometric compression ratio calculated from physical volumes \u2013 without considering camshaft timing.',
    # Dynamic CR
    'Was ist das?|Ber':
        'Takes into account that the intake valve closes after BDC \u2013 part of the charge escapes before compression begins. Determines actual detonation tendency more accurately than static CR.',
    'Einfach gesagt:|Solange das Einlassventil noch offen ist':
        'As long as the intake valve is still open, part of the mixture can flow back \u2013 the effective compression starts later.',
    # Chamber Volume
    'Was ist das?|Das Volumen des Brennraums im Zylinderkopf':
        'The volume of the combustion chamber in the cylinder head with the valves closed. Measured by filling with fluid (burette method).',
    'Warum?|Wesentlicher Bestandteil der Compression':
        'A key component of the compression ratio calculation.',
    # Piston Dish
    'Was ist das?|Eine Mulde':
        'A recess (concavity) in the piston crown that increases clearance volume and lowers compression ratio.',
    'Auswirkung:|Mehr Volumen \u2192 geringere Verdichtung.':
        'More volume \u2192 lower compression ratio.',
    # Piston Dome
    'Was ist das?|Eine Erh':
        'A raised area on the piston crown that reduces clearance volume and increases compression ratio.',
    'Auswirkung:|Weniger Restvolumen \u2192 h\u00f6here Verdichtung':
        'Less clearance volume \u2192 higher compression ratio.',
    # Gasket Thickness
    'Was ist das?|Die Dicke der Zylinderkopfdichtung':
        'The thickness of the head gasket \u2013 affects clearance volume and thus compression ratio.',
    # Compressed Gasket Thickness
    'Was ist das?|Die tats':
        'The actual gasket thickness after torquing the head bolts. Always less than the uncompressed thickness.',
    'Wichtig:|F\u00fcr Berechnungen ist die Einbaudicke rel':
        'For calculations, the compressed (installed) thickness is relevant, not the uncompressed thickness.',
    # Quench
    'Was ist das?|Der flache Bereich zwischen Kolbenoberfl':
        'The flat area between the piston crown and the cylinder head where the gap is very small. Creates turbulence (squish) during compression.',
    'Einfach gesagt:|Wenn der Kolben nach oben kommt, wird da':
        'When the piston comes up, the mixture is squeezed out of this narrow area at high velocity.',
    'Warum?|Verbessert die Gemischbewegung im Brennr':
        'Improves mixture motion in the combustion chamber \u2013 faster, more complete combustion, less detonation.',
    # Quench Distance
    'Was ist das?|Der Abstand zwischen der flachen Kolbenoberfl':
        'The distance between the flat piston surface and the flat cylinder head surface at TDC.',
    'Berechnung:|Piston-to-Deck + Compressed Gasket Thick':
        'Piston-to-Deck + Compressed Gasket Thickness. Ideal range: 0.035"\u20130.045" (0.89\u20131.14 mm). Below 0.035" risks contact.',
    # Quench Area
    'Was ist das?|Der Fl':
        'The area of the piston crown directly opposing the flat portion of the cylinder head. Larger quench area = more turbulence = better combustion.',
    'Wie berechnen?|Quench Distance = Piston-to-Deck Clearan':
        'Quench Distance = Piston-to-Deck Clearance + compressed head gasket thickness (Compressed Gasket Thickness).',

    # === 4. KURBELTRIEB ===
    # Crankshaft
    'Was ist das?|Wandelt die lineare Kolbenbewegung in Drehbewegung um':
        'Converts the linear piston motion into rotary motion.',
    'Was ist das?|Wandelt die Auf-und-ab-Bewegung der Kolb':
        'Converts the up-and-down piston motion into rotary motion.',
    # Connecting Rod
    'Was ist das?|Verbindet den Kolben mit der Kurbelwelle':
        'Connects the piston to the crankshaft. Converts linear motion into rotary motion.',
    # Rod Length
    'Was ist das?|Der Abstand von Mitte Kolbenbolzen bis Mitte Pleuel':
        'The distance from the piston pin center to the crankshaft journal center (center-to-center).',
    'Warum?|Zusammen mit Hub und Deck Height bestimm':
        'Together with stroke and deck height, it determines the piston position in the cylinder.',
    # Rod Ratio
    'Was ist das?|Das Verh':
        'The ratio of connecting rod length to crankshaft stroke. Affects piston dwell time, side loading, and power characteristics.',
    'Berechnung:|Rod Length / Stroke':
        'Rod Length / Stroke',
    # Main Journal
    'Was ist das?|Die Lagerstellen der Kurbelwelle':
        'The bearing surfaces of the crankshaft that sit in the main bearings of the block.',
    # Rod Journal
    'Was ist das?|Die Zapfen an der Kurbelwelle, an denen die Pleuel befestigt sind':
        'The pins on the crankshaft where the connecting rods attach.',
    # Main Bearing
    'Was ist das?|Die Lager, in denen die Kurbelwelle':
        'The bearings in which the crankshaft rotates. Consist of two precision half-shells with a defined oil clearance.',
    # Main Bearing Clearance
    'Was ist das?|Der kleine Abstand zwischen Kurbelwellen-Hauptlagerzapfen und Hauptlager':
        'The small gap between the crankshaft main journal and the main bearing.',
    'Einfach gesagt:|Zwischen Kurbelwelle und Lager muss ein ':
        'A defined space for the hydrodynamic oil film must exist between crankshaft and bearing.',
    'Wie messen?|1. Lagerschalen einlegen (trocken, kein ':
        '1. Install bearing shells (dry, no oil). 2. Place Plastigage strip across journal. 3. Install cap, torque to spec. 4. Remove cap, compare strip width to scale.',
    # Rod Bearing
    'Was ist das?|Die Lagerschalen, die den Pleuel mit dem':
        'The bearing shells connecting the connecting rod to the crankshaft rod journal.',
    # Rod Bearing Clearance
    'Was ist das?|Der Spalt zwischen Pleuellagerzapfen und Pleuellagerschale':
        'The gap between the rod journal and the rod bearing shell. Determines the oil film thickness under load.',
    'Warum?|Bestimmt, wie sich der tragende \u00d6lfilm b':
        'Determines how the load-bearing oil film forms. 0.001"\u20130.003" (0.025\u20130.076 mm). Ford 302: typically 0.0015"\u20130.0025".',
    'Wie messen?|1. Lagerschalen in Pleuel und Deckel ein':
        '1. Install bearing shells in rod and cap (dry). 2. Place Plastigage strip across rod journal. 3. Install cap, torque to spec. 4. Remove cap, compare strip width to scale.',
    # Crankshaft Endplay
    'Was ist das?|Axiales Spiel':
        'Axial (lengthwise) play of a shaft in its bearings.',
    'Was ist das?|Wie weit sich die Kurbelwelle in L\u00e4ngsri':
        'How far the crankshaft can move back and forth lengthwise, controlled by thrust bearings. 0.004"\u20130.008" typical.',
    'Wie messen?|1. Kurbelwelle mit allen Hauptlagern ein':
        '1. Crankshaft installed with all main bearings. 2. Dial indicator on the front face of the crankshaft. 3. Push crank forward and back, read total movement.',
    # Internal Balance
    'Was ist das?|Alle Ausgleichsgewichte sind in der Kurbelwelle':
        'All counterweights are integrated into the crankshaft. No external balance weights needed on harmonic balancer or flywheel.',
    'Was ist das?|Ausgleichsmassen sind innerhalb der Kurb':
        'Counterweights are integrated within the crankshaft configuration.',
    'Warum?|Bestimmt, welche Ausf\u00fchrung von Balancer':
        'Determines which type of balancer and flywheel must be used.',
    # Zero Balance
    'Was ist das?|Die Kurbelwelle wird ohne ':
        'The crankshaft is balanced without external counterweights. Harmonic balancer and flywheel have zero balance offset.',
    'Was ist das?|Balancer und Schwungrad/Flexplate ben\u00f6ti':
        'Balancer and flywheel/flexplate require no additional counterweight mass.',
    # Harmonic Balancer
    'Was ist das?|D':
        'Dampens torsional vibrations of the crankshaft.',
    'Was ist das?|Bauteil am vorderen Kurbelwellenende, da':
        'Component at the front of the crankshaft that dampens torsional vibrations. Without it, the crankshaft could break from resonance at certain RPM.',

    # === 5. KOLBEN & PLEUEL ===
    # Piston
    'Was ist das?|Der Kolben bewegt sich im Zylinder auf und ab':
        'The piston moves up and down in the cylinder, transferring combustion force to the crankshaft via the connecting rod.',
    # Piston-to-Wall Clearance
    'Was ist das?|Der Spalt zwischen dem Kolbenhemd':
        'The gap between the piston skirt and the cylinder wall. Required for thermal expansion and oil film.',
    'Einfach gesagt:|Darf nicht klemmen, aber auch nicht zu v':
        'Must not bind, but also not have excessive play. 0.003"\u20130.005" (0.08\u20130.13 mm) typical.',
    'Wie messen?|1. Zylinderbohrung mit Innenmessschraube':
        '1. Measure cylinder bore with bore gauge or telescoping gauge + micrometer at 3 heights and 2 angles. 2. Measure piston diameter 90\u00b0 to pin bore. 3. Bore minus piston = clearance.',
    # Compression Height
    'Was ist das?|Der Abstand von der Mitte des Kolbenbolzens bis zur Oberkante':
        'The distance from the piston pin center to the top of the piston crown.',
    'Was ist das?|Abstand zwischen Kolbenbolzenmitte und K':
        'Distance from piston pin center to the top of the piston crown.',
    'Warum?|Zusammen mit Pleuell\u00e4nge, Hub und Deck H':
        'Together with rod length, stroke and deck height, it determines piston position at TDC.',
    # Valve Relief
    'Was ist das?|Aussparungen im Kolbenboden':
        'Recesses machined into the piston crown to provide clearance for the valves at overlap.',
    'Was ist das?|Aussparung im Kolbenboden f\u00fcr das Ventil':
        'Recess in the piston crown for valve clearance.',
    # Piston-to-Valve Clearance
    'Was ist das?|Der Mindestabstand zwischen ge':
        'The minimum distance between an open valve and the piston crown, especially critical at overlap TDC.',
    'Einfach gesagt:|Kolben und Ventil d\u00fcrfen sich niemals be':
        'Piston and valve must never touch!',
    'Warum besonders wichtig?|H\u00e4ngt von Nockenwellensteuerzeiten, Vent':
        'Depends on camshaft timing, valve lift, deck height, gasket and valve train. Must be verified on every build.',
    'Wie messen?|1. Motor komplett zusammengebaut (K\u00f6pfe,':
        '1. Engine fully assembled (heads, valves, springs, rockers, pushrods). 2. Place modeling clay in valve reliefs. 3. Rotate engine 2 full revolutions. 4. Remove head, measure clay thickness.',
    # Piston-to-Head Clearance
    'Was ist das?|Der Gesamtabstand zwischen Kolbenoberfl':
        'The total distance between piston crown and cylinder head at TDC. Equals piston-to-deck clearance plus compressed gasket thickness.',

    # === 6. KOLBENRINGE ===
    # Top Ring
    'Was ist das?|Der oberste Kolbenring':
        'The uppermost piston ring \u2013 the primary compression seal.',
    'Aufgabe:|\u00dcbernimmt den wesentlichen Teil der Abdi':
        'Provides the primary seal against combustion pressure.',
    # Second Ring
    'Was ist das?|Der zweite Kolbenring':
        'The second piston ring \u2013 backs up the first ring and scrapes oil.',
    'Aufgabe:|Unterst\u00fctzt Abdichtung und beeinflusst \u00d6':
        'Supports sealing and controls oil regulation.',
    # Oil Ring
    'Was ist das?|Der unterste Ring':
        'The lowest ring \u2013 scrapes excess oil from the cylinder wall and returns it to the crankcase.',
    'Aufgabe:|Kontrolliert die \u00d6lmenge auf der Zylinde':
        'Controls the amount of oil on the cylinder wall.',
    # Ring End Gap
    'Was ist das?|Der Spalt an den Enden des Kolbenrings':
        'The gap at the ends of the piston ring when installed in the cylinder.',
    'Warum?|Der Ring dehnt sich bei Erw\u00e4rmung aus. O':
        'The ring expands when heated. Without a gap, the ends would push against each other and damage the cylinder.',
    'Wie messen?|1. Ring in die Zylinderbohrung schieben ':
        '1. Push ring into the cylinder bore (without piston). 2. Use an inverted piston to push the ring about 1" down for squareness. 3. Measure gap with feeler gauge.',
    # Ring Groove
    'Was ist das?|Die Nuten im Kolben':
        'The grooves machined into the piston that hold the piston rings.',
    # Ring Land
    'Was ist das?|Der Materialsteg zwischen zwei Kolbenring':
        'The material between two piston ring grooves. The fire land protects the first ring from direct combustion heat.',
    # Ring Clocking
    'Was ist das?|Die gezielte Anordnung der Ringst':
        'The deliberate positioning of ring gaps relative to each other (typically offset by 120\u00b0) to minimize blow-by.',

    # === 7. ZYLINDERKOPF ===
    # Cylinder Head
    'Was ist das?|Sitzt auf dem Block und bildet die Oberseite':
        'Sits on top of the block and forms the upper boundary of the combustion chamber. Contains valves, ports, and springs.',
    'Was ist das?|Bildet zusammen mit Kolben und Zylinder ':
        'Together with the piston and cylinder, forms the combustion chamber. Contains valves, valve guides and valve seats.',
    # Intake Port
    'Was ist das?|Der Kanal, durch den das Luft-Kraftstoff-Gemisch':
        'The passage through which the air-fuel mixture flows into the combustion chamber.',
    # Exhaust Port
    'Was ist das?|Der Kanal, durch den die verbrannten Gase':
        'The passage through which the burned exhaust gases exit the combustion chamber.',
    # Port Volume
    'Was ist das?|Das Volumen des Ein- oder Auslasskanals':
        'The volume of the intake or exhaust port, measured in cc.',
    'Wichtig:|Gr\u00f6\u00dfer ist nicht automatisch besser. Die':
        'Bigger is not automatically better. Port size must match the engine and RPM range.',

    # === 8. VENTILE ===
    # Valve
    'Was ist das?|Ventile steuern den Gaswechsel':
        'Valves control the gas exchange \u2013 they open and close the intake and exhaust ports at precisely timed intervals.',
    'Was ist das?|\u00d6ffnet und schlie\u00dft den Gaswechsel zwisc':
        'Opens and closes the gas exchange between cylinder and intake/exhaust system.',
    # Intake Valve
    'Was ist das?|L':
        'Allows the air-fuel mixture into the combustion chamber when open.',
    'Aufgabe:|L\u00e4sst das Frischgas in den Zylinder.':
        'Allows the fresh charge into the cylinder.',
    # Exhaust Valve
    'Aufgabe:|L\u00e4sst die Abgase aus dem Zylinder.':
        'Allows the exhaust gases out of the cylinder.',
    # Valve Stem
    'Was ist das?|Der zylindrische Schaft':
        'The cylindrical shaft of the valve that slides in the valve guide.',
    # Valve Face
    'Was ist das?|Die Dichtfl':
        'The sealing surface of the valve that contacts the valve seat when closed.',
    # Valve Seat
    'Was ist das?|Der Ring im Zylinderkopf':
        'The hardened ring in the cylinder head against which the valve face seals.',
    # Valve Guide
    'Was ist das?|Die F':
        'The bushing that guides the valve stem \u2013 ensures precise alignment and provides an oil seal.',

    # === 9. VENTILFEDERN ===
    # Valve Spring
    'Was ist das?|Die Feder, die das Ventil':
        'The spring that closes the valve and keeps it seated. Must be strong enough to prevent valve float at high RPM.',
    'Was ist das?|Sorgt daf\u00fcr, dass das Ventil nach dem \u00d6f':
        'Ensures the valve closes again after opening and maintains positive seat pressure.',
    # Installed Height
    'Was ist das?|Die H':
        'The height of the valve spring when installed on the head with retainer and keepers.',
    'Warum?|Die Federkraft h\u00e4ngt stark von der Einba':
        'The spring force is highly dependent on the installed height. 1. Install valve spring, retainer and keepers. 2. Measure height from spring pad to underside of retainer.',
    # Seat Pressure
    'Was ist das?|Die Federkraft bei':
        'The spring force when the valve is closed (at installed height). Must be sufficient to seal the valve.',
    # Open Pressure
    'Wichtig:|Ohne Angabe des Ventilhubs nicht eindeut':
        'Meaningless without specifying the valve lift!',
    # Coil Bind
    'Was ist das?|Die L':
        'The length at which the spring coils are fully compressed (solid height). Must never be reached during operation.',
    'Was ist das?|Windungen der Feder liegen vollst\u00e4ndig a':
        'Spring coils are fully compressed against each other.',
    'Warum kritisch?|Die Feder darf bei maximalem Ventilhub n':
        'The spring must not reach coil bind at maximum valve lift! 1. Measure free spring length on a flat surface. 2. Subtract calculated compression at max lift.',
    # Retainer
    'Was ist das?|Der Teller':
        'The plate that sits on top of the valve spring and is secured by valve keepers.',
    'Was ist das?|Sitzt oben auf der Ventilfeder und wird ':
        'Sits on top of the valve spring and is held on the valve by the keepers.',
    # Valve Keepers
    'Was ist das?|Kleine konische':
        'Small conical wedges that lock the retainer to the valve stem groove.',
    'Was ist das?|Kleine Keile, die den Federteller am Ven':
        'Small wedges that hold the retainer on the valve stem.',
    # Retainer-to-Seal
    'Was ist das?|Der Abstand zwischen Federteller-Unterkante':
        'The distance between the bottom of the retainer and the top of the valve seal at full lift.',
    'Warum wichtig?|Der Federteller darf die Dichtung bei ma':
        'The retainer must not contact the seal at maximum lift! Minimum 0.050" clearance required.',
    'Wie messen?|1. Ventil bei maximalem Hub (oder mit be':
        '1. Open valve to maximum lift (or use known shim under retainer). 2. Measure distance between retainer bottom and seal top with feeler gauge.',
    # Valve Float
    'Was ist das?|Wenn die Ventilfeder':
        'When the valve spring cannot close the valve quickly enough \u2013 the valve "floats" open, causing power loss and potential engine damage.',
    'Warum kritisch?|Kann zu mechanischen Sch\u00e4den f\u00fchren!':
        'Can cause mechanical damage!',

    # === 10. NOCKENWELLE ===
    # Camshaft
    'Was ist das?|Die Welle mit exzentrischen Nocken':
        'The shaft with eccentric lobes that controls the opening and closing of the intake and exhaust valves.',
    'Was ist das?|Bestimmt, wann und wie weit die Ventile ':
        'Determines when and how far the valves open.',
    # Cam Lobe
    'Was ist das?|Die Erhebung auf der Nockenwelle':
        'The raised portion on the camshaft that pushes the lifter to open the valve.',
    'Folge:|Lifter unten \u2192 Pushrod unten \u2192 Ventil ge':
        'Lifter down \u2192 pushrod down \u2192 valve closed.',
    # Base Circle
    'Was ist das?|Der runde Grundbereich des Nockens':
        'The round base portion of the cam lobe where no valve lift occurs \u2013 the valve is closed.',
    # Lobe Lift
    'Was ist das?|Die maximale Erhebung des Nockens':
        'The maximum rise of the cam lobe above the base circle.',
    'Was ist das?|Wie weit die Nocke den Lifter anhebt.':
        'How far the cam lobe lifts the lifter.',
    # Valve Lift
    'Was ist das?|Wie weit das Ventil':
        'How far the valve opens from its seat. Equals cam lift multiplied by rocker ratio.',
    'Was ist das?|Wie weit sich das Ventil tats\u00e4chlich \u00f6ff':
        'How far the valve actually opens.',
    'Warum gr\u00f6\u00dfer als Cam Lift?|Der Kipphebel \u00fcbersetzt die Bewegung.':
        'The rocker arm multiplies the motion.',
    # Rocker Ratio
    'Was ist das?|Das ':
        'The ratio of lever arms in the rocker \u2013 multiplies cam lift.',
    'Beispiel:|Bei 1,6:1 bewegt sich das Ventil ca. 1,6':
        'With 1.6:1 ratio, the valve moves approx. 1.6 times as far as the lifter.',
    # Duration
    'Was ist das?|Wie lange das Ventil':
        'How long the valve stays open, measured in crankshaft degrees.',
    'Was ist das?|Wie lange ein Ventil w\u00e4hrend eines Motor':
        'How long a valve stays open during one engine cycle, measured in crankshaft degrees.',
    'Wichtig:|Nur sinnvoll zusammen mit der Messmethod':
        'Only meaningful when combined with the measurement method (e.g., Duration @ 0.050").',
    # Duration @ 0.050
    'Was ist das?|Die ':
        'The duration measured at 0.050" valve lift \u2013 the industry standard for comparing camshaft profiles.',
    'Warum wichtig?|Erm\u00f6glicht sinnvolleren Vergleich versch':
        'Enables more meaningful comparison of different camshafts than advertised duration.',
    # LSA
    'Was ist das?|Der Winkel zwischen dem maximalen Einlasshub':
        'The angle between maximum intake lift and maximum exhaust lift, measured in camshaft degrees.',
    # Camshaft Centerline
    'Was ist das?|Der Kurbelwinkelgrad':
        'The crankshaft degree at which maximum intake lobe lift occurs relative to TDC.',
    'Typischer Wert:|Intake Centerline 106\u00b0\u2013110\u00b0 ATDC (je nac':
        'Intake Centerline 106\u00b0\u2013110\u00b0 ATDC (depending on camshaft).',
    'Wie messen?|Siehe "Degreeing the Cam". Die Intake Ce':
        'See "Degreeing the Cam". The intake centerline is the crankshaft angle (in degrees ATDC) at which the intake lobe reaches maximum lift.',
    # Cam Advance
    'Was ist das?|Die Nockenwelle ist relativ zur Kurbelwelle vor':
        'The camshaft is advanced relative to the crankshaft \u2013 intake events happen earlier, improving low-end torque.',
    # Cam Retard
    'Was ist das?|Die Nockenwelle ist relativ zur Kurbelwelle nach':
        'The camshaft is retarded relative to the crankshaft \u2013 intake events happen later, shifting power to higher RPM.',
    # Degreeing
    'Was ist das?|Das pr':
        'The precision process of verifying the exact installed camshaft position using a degree wheel and dial indicator.',
    'Einfach gesagt:|Wir verlassen uns nicht nur auf die Kett':
        'We don\'t just rely on the chain marks \u2013 we verify by measuring. 1. Degree wheel on crank. 2. Dial indicator on lifter. 3. Measure opening/closing points at 0.050" lift. 4. Calculate centerline.',
    # Valve Overlap
    'Was ist das?|Die Kurbelwinkelgrade, in denen Einlass-':
        'The crankshaft degrees during which both intake and exhaust valves are open simultaneously \u2013 around TDC at the end of the exhaust stroke.',
    'Warum wichtig?|Beeinflusst unter anderem die effektive ':
        'Affects effective compression, idle quality and RPM behavior.',
    'Einfach gesagt:|Am Ende des Aussto\u00dfens ist das Auslassve':
        'At the end of the exhaust stroke, the exhaust valve is still open while the intake valve already opens \u2013 both valves are open simultaneously.',

    # === 11. STEUERTRIEB ===
    # Timing Set
    'Was ist das?|Das System aus Kette/Zahnr':
        'The system of chain/gears and sprockets that synchronizes the camshaft to the crankshaft at a 2:1 ratio.',
    'Was ist das?|Kurbelwellenrad, Nockenwellenrad und Ste':
        'Crank gear, cam gear and timing chain.',
    # Timing Chain
    'Was ist das?|Die Kette, die Kurbelwellenrad und Nockenwellenrad':
        'The chain connecting the crank gear to the cam gear, maintaining precise valve timing.',
    'Was ist das?|Verbindet Kurbelwelle und Nockenwelle f\u00fc':
        'Connects crankshaft and camshaft for correct rotation ratio.',
    # Crank Gear
    'Was ist das?|Das Zahnrad auf der Kurbelwelle':
        'The gear/sprocket on the crankshaft that drives the timing chain.',
    # Cam Gear
    'Was ist das?|Das Zahnrad auf der Nockenwelle':
        'The gear/sprocket on the camshaft, driven by the timing chain at half crankshaft speed.',
    # Timing Mark
    'Was ist das?|Markierungen auf den Steuerzahnr':
        'Marks on the timing gears and block used to align camshaft and crankshaft timing.',
    'Was ist das?|Markierung auf den Zahnr\u00e4dern zur Positi':
        'Marks on the gears for positioning crankshaft and camshaft.',
    'Wichtig:|Eine Markierung ersetzt nicht zwingend d':
        'A timing mark does not necessarily replace degreeing!',
    # Backlash
    'Was ist das?|Das Spiel zwischen den Zahnflanken':
        'The play between gear teeth \u2013 required for lubrication and thermal expansion.',

    # === 12. LIFTER & PUSHROD ===
    # Hydraulic Roller Lifter
    'Was ist das?|Ein St':
        'A tappet with a roller wheel that rides on the camshaft lobe (reducing friction) and a hydraulic element that automatically eliminates valve lash.',
    'Was ist das?|Ein Lifter mit Rollenrad zur Nockenwelle':
        'A lifter with a roller wheel on the camshaft and a hydraulic mechanism to automatically compensate for valve lash.',
    # Roller Wheel
    'Was ist das?|Die Rolle am unteren Ende des Lifters':
        'The roller at the bottom of the lifter that rides on the cam lobe, reducing friction and wear.',
    # Plunger
    'Was ist das?|Der innere hydraulische Kolben im Lifter':
        'The internal hydraulic piston in the lifter that maintains zero valve lash via oil pressure.',
    'Was ist das?|Ein kleiner Kolben im Lifter-Inneren, de':
        'A small piston inside the lifter that can move and automatically compensates for valve lash.',
    # Plunger Preload
    'Was ist das?|Wie weit der Plunger im Lifter':
        'How far the plunger is pushed into the lifter body when the valve is closed.',
    'Einfach gesagt:|Der Plunger soll nicht ganz oben und nic':
        'The plunger should neither be at the very top nor at the end of its travel \u2013 it sits at a defined midpoint.',
    # Lifter Body
    'Was ist das?|Das ':
        'The outer housing of the lifter that rides in the lifter bore in the block.',
    # Lifter Bore
    'Was ist das?|Die Bohrung im Motorblock':
        'The bore in the engine block in which the lifter body slides.',
    # Lifter Retainer
    'Was ist das?|Eine Halterung':
        'A retainer (spider/tie-bar) that holds the lifters in their bores and prevents rotation \u2013 critical for roller lifters.',
    'Was ist das?|H\u00e4lt die Roller-Lifter in ihrer korrekte':
        'Holds the roller lifters in their correct position.',
    # Pushrod
    'Was ist das?|Die Verbindungsstange zwischen Lifter':
        'The connecting rod between the lifter and the rocker arm that transmits camshaft motion to the valve.',
    # Checking Pushrod
    'Was ist das?|Eine verstellbare':
        'An adjustable pushrod used to determine the correct pushrod length for optimal valve train geometry.',
    # Pushrod Length
    'Was ist das?|Die korrekte L':
        'The correct length is critical for proper rocker arm geometry \u2013 ensures the rocker tip sweeps correctly across the valve stem.',
    'Einfach gesagt:|Wir kaufen nicht einfach eine beliebige ':
        'We don\'t just buy any length \u2013 we measure the correct length first.',
    'Warum wichtig?|Eine falsche L\u00e4nge ver\u00e4ndert die Stellun':
        'An incorrect length changes the rocker arm position on the valve.',
    # Rocker Arm
    'Was ist das?|Der Kipphebel lenkt die Aufw':
        'The rocker arm redirects the upward pushrod motion downward onto the valve stem and multiplies the lift by its ratio.',
    'Was ist das?|\u00dcbertr\u00e4gt die Bewegung der Pushrod auf d':
        'Transfers the pushrod motion to the valve.',
    # Rocker Tip
    'Was ist das?|Die Kontaktfl':
        'The contact surface of the rocker arm that presses on the valve stem tip.',
    # Sweep Pattern
    'Was ist das?|Das Muster':
        'The pattern the rocker tip traces on the valve stem tip during its arc of motion. Should be centered.',
    'Warum wichtig?|Zeigt, ob die Ventiltrieb-Geometrie korr':
        'Shows whether the valve train geometry is correct.',
    # Valve Train Geometry
    'Was ist das?|Das Zusammenspiel aller':
        'The interaction of all valve train components (lifter, pushrod, rocker arm, valve) \u2013 correct geometry ensures maximum efficiency and minimal wear.',
    # Valve Lash
    'Was ist das?|Der Abstand':
        'The gap between the rocker arm tip and the valve stem tip when the lifter is on the base circle.',
    'Bei hydraulischem Lifter:|Das Spiel wird durch die Einstellung und':
        'The lash is taken up by the adjustment and the plunger preload.',

    # === 13. STEUERZEITEN ===
    'Warum wichtig?|Beeinflusst unter anderem die effektive':
        'Affects effective compression, idle quality and RPM behavior among other things.',
    'Einfach gesagt:|Am Ende des Aussto\u00dfens ist das Auslassve':
        'At the end of the exhaust stroke, the exhaust valve is still open while the intake valve already opens.',

    # === 14. \u00d6LSYSTEM ===
    # Oil Pump
    'Was ist das?|F':
        'Delivers pressurized oil to all bearings, the valve train, and the timing chain.',
    # Oil Pickup
    'Was ist das?|Das Rohr mit Sieb':
        'The tube with screen that draws oil from the oil pan and feeds it to the oil pump.',
    # Pickup-to-Pan
    'Was ist das?|Der Abstand zwischen ':
        'The distance between the oil pickup screen and the bottom of the oil pan.',
    'Warum wichtig?|Darf weder zu weit vom \u00d6l entfernt sein ':
        'Must be neither too far from the oil nor touching the bottom. 1/4"\u20133/8" (6\u201310 mm) optimal.',
    'Wie messen?|1. Pickup in \u00d6lpumpe einbauen, Pumpe am ':
        '1. Install pickup in oil pump, mount pump on block. 2. Place modeling clay on the underside of the pickup screen. 3. Install oil pan, torque bolts. 4. Remove pan, measure clay thickness.',
    # Oil Pan
    'Was ist das?|Der ':
        'The reservoir at the bottom of the engine that holds the oil supply.',
    # Baffle
    'Was ist das?|Ein Blech in der ':
        'A plate in the oil pan that prevents oil from sloshing away from the pickup during acceleration, braking or cornering.',
    'Was ist das?|Verhindert, dass \u00d6l bei Beschleunigung o':
        'Prevents oil from sloshing away from the pickup during acceleration or cornering.',
    'F\u00fcr uns:|Besonders relevant bei Trackdays und hoh':
        'Especially relevant on track days and under high lateral G-forces.',
    # Windage Tray
    'Was ist das?|Ein gelochtes':
        'A perforated sheet metal tray between the crankshaft and oil pan that separates oil mist from the rotating crank, reducing parasitic drag.',
    'Was ist das?|Reduziert die \u00d6lmenge, die von der drehe':
        'Reduces the amount of oil churned up by the rotating crankshaft.',
    # Oil Pressure
    'Was ist das?|Der Druck':
        'The pressure at which oil is delivered to the bearings.',
    # High Volume Oil Pump
    'Was ist das?|Eine ':
        'An oil pump with higher flow capacity (typically +25% over stock).',
    'Wichtig:|High Volume bedeutet nicht automatisch h':
        'High volume does not automatically mean higher oil pressure. Pressure depends on engine, bearings, RPM and oil viscosity.',
    # Pressure Relief Valve
    'Was ist das?|Ein Ventil in der ':
        'A valve in the oil pump that opens at a set pressure to prevent damage from excessive oil pressure.',
    'Was ist das?|Verhindert, dass der \u00d6ldruck \u00fcber den vo':
        'Prevents oil pressure from exceeding the intended range.',

    # === 15. MESSEN & MONTAGE ===
    # Clearance
    'Was ist das?|Ein definierter Abstand zwischen zwei':
        'A defined gap between two mating parts \u2013 required for oil film, thermal expansion, or free movement.',
    'Beispiel:|Piston-to-Wall Clearance = Abstand Kolbe':
        'Piston-to-Wall Clearance = gap between piston and cylinder wall.',
    # Tolerance
    'Was ist das?|Der zul':
        'The allowable deviation from a specified dimension.',
    # Interference
    'Was ist das?|Wenn zwei Bauteile sich ber':
        'When two components physically contact each other in a way that causes damage.',
    'Beispiel:|Piston-to-Valve Interference = Kolben un':
        'Piston-to-Valve Interference = piston and valve make contact.',
    # Runout
    'Was ist das?|Die Abweichung einer rotierenden Fl':
        'The deviation of a rotating surface from perfect circular motion.',
    'Einfach gesagt:|Ob etwas beim Drehen \u201eeiert\u201c.':
        'Whether something wobbles when spinning. 1. Place part in V-block or similar. 2. Dial indicator perpendicular to surface. 3. Rotate, read TIR (Total Indicator Reading).',
    # Endplay
    # (already covered above under Crankshaft Endplay)
    'Beispiel:|Crankshaft Endplay = Bewegung der Kurbel':
        'Crankshaft Endplay = movement of the crankshaft back and forth.',
    # Dial Indicator
    'Was ist das?|Pr':
        'A precision measuring instrument that displays linear displacement.',
    'Verwendung:|Kurbelwellen-Endplay, Rundlauf, Degreein':
        'Crankshaft endplay, runout, degreeing the camshaft.',
    # Feeler Gauge
    'Was ist das?|Ein Set':
        'A set of precisely ground metal blades of known thickness used to measure gaps.',
    # Micrometer
    'Verwendung:|Pr\u00e4zise Au\u00dfenma\u00dfe, z.B. Kurbelwellenzapf':
        'Precise external dimensions, e.g. crankshaft journals.',
    # Bore Gauge
    'Verwendung:|Zylinderbohrungen, Lagerbohrungen.':
        'Cylinder bores, bearing housings.',
    # Plastigage
    'Was ist das?|Ein d':
        'A thin wax strip placed between bearing and journal.',
    'Einfach gesagt:|Die Breite des plattgedr\u00fcckten Kunststof':
        'The width of the crushed plastic strip indicates the bearing clearance.',
    # Torque
    'Was ist das?|Die Kraft':
        'The force applied to tighten a fastener, measured in ft-lbs or Nm.',
    # Torque Sequence
    'Was ist das?|Die vorgeschriebene Reihenfolge':
        'The prescribed order in which fasteners must be tightened.',
    'Warum wichtig?|Damit sich das Bauteil gleichm\u00e4\u00dfig setzt':
        'So the component seats evenly and is not warped.',
    # Torque Angle
    'Was ist das?|Nach dem Voranzug':
        'After initial torque, the fastener is turned an additional specified number of degrees.',
    'Was ist das?|Nach einem definierten Anfangsdrehmoment':
        'After a defined initial torque, the bolt is turned by a specified angle.',
    'Wichtig:|Nur verwenden, wenn es f\u00fcr die betreffen':
        'Only use when specified for the particular fastener!',
    # Threadlocker
    'Was ist das?|Ein Klebstoff':
        'An adhesive applied to threads to prevent loosening from vibration. Blue = removable, red = permanent.',
    # Assembly Lubricant
    'Was ist das?|Spezial':
        'Special paste applied to critical surfaces during assembly for initial startup lubrication.',
    'Verwendung:|Lagerstellen, Nockenwellenmontage.':
        'Bearing surfaces, camshaft installation.',
    # Blueprinting
    'Was ist das?|Der Prozess, jeden einzelnen Motor':
        'The process of measuring every single engine component and assembling to optimal tolerances.',
    'Einfach gesagt:|Nicht \u201esoll ungef\u00e4hr passen\u201c, sondern me':
        'Not "should roughly fit" but: measure \u2192 compare \u2192 adjust \u2192 document.',
    # Satz d\u00fcnner Metallbl\u00e4tter
    'Was ist das?|Satz d\u00fcnner Metallbl\u00e4tter mit definierte':
        'A set of thin metal blades of defined thickness for measuring small gaps.',

    # === 16. ZUSAMMENH\u00c4NGE ===
    '|Bestimmt durch: Deck Height, Stroke, Rod':
        'Determined by: Deck Height, Stroke, Rod Length, Compression Height \u2192 results in the Piston-to-Deck position.',
    '|Quench Distance = Piston-to-Deck + Compr':
        'Quench Distance = Piston-to-Deck + Compressed Gasket Thickness',
    '|Ben\u00f6tigt: Bore, Stroke, Combustion Chamb':
        'Requires: Bore, Stroke, Combustion Chamber Volume, Piston Dish/Dome, Piston-to-Deck, Gasket Bore, Compressed Gasket Thickness.',
    '|Abh\u00e4ngig von: Lifter, Plunger Position, ':
        'Depends on: Lifter, Plunger Position, Pushrod Length, Rocker Arm, Rocker Ratio, Valve Stem Height, Valve Lash.',
    '|Beeinflusst durch: Camshaft Timing, Lift':
        'Influenced by: Camshaft Timing, Lift, Duration, Rocker Ratio, Valve Size, Piston Valve Relief, Piston-to-Deck.',
    '|Relevant: Installed Spring Height, Seat ':
        'Relevant: Installed Spring Height, Seat Pressure, Open Pressure, Maximum Valve Lift, Coil Bind, Retainer-to-Seal Clearance.',
    '|TDC \u2013 Top Dead Center (OT)  | ':
        'TDC \u2013 Top Dead Center | BDC \u2013 Bottom Dead Center | IO/IC \u2013 Intake Open/Close | EO/EC \u2013 Exhaust Open/Close',
}


def translate_field_html(field_html):
    """Translate a single glossary field's HTML content to English."""
    # Extract label
    label_m = re.search(r'<span class="glossary-field-label">(.*?)</span>', field_html)
    label_de = ''
    if label_m:
        label_de = label_m.group(1).strip()
    
    label_en = LABEL_MAP.get(label_de, label_de)
    # Also try with HTML entities decoded
    label_de_decoded = hmod.unescape(label_de)
    if label_de_decoded != label_de and label_de_decoded in LABEL_MAP:
        label_en = LABEL_MAP[label_de_decoded]
    
    # Get content after label
    if label_m:
        content_after_label = field_html[label_m.end():].strip()
    else:
        content_after_label = field_html.strip()
    content_text = hmod.unescape(re.sub(r'<[^>]+>', '', content_after_label)).strip()
    
    # Try to find translation by label + first chars of content
    en_content = None
    for key, val in FIELD_TRANSLATIONS.items():
        parts = key.split('|', 1)
        if len(parts) == 2:
            key_label = parts[0]
            key_prefix = parts[1]
            # Match label (with or without HTML entities)
            if (key_label == label_de or key_label == label_de_decoded or 
                key_label == hmod.unescape(label_de)):
                if content_text[:len(key_prefix)] == key_prefix or content_text.startswith(key_prefix[:20]):
                    en_content = val
                    break
    
    if en_content is None:
        return None
    
    # Build EN HTML
    if label_de:
        en_html = f'<span class="glossary-field-label">{label_en}</span> {en_content}'
    else:
        en_html = en_content
    return en_html


def process_file(filename):
    """Add data-de-content and data-en-content to all glossary fields."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    translated = 0
    untranslated = 0
    untranslated_items = []
    
    # First remove any existing data-de-content/data-en-content from prior runs
    content = re.sub(r' data-de-content="[^"]*"', '', content)
    content = re.sub(r' data-en-content="[^"]*"', '', content)
    
    body_start_m = re.search(r'id="glossaryBody"', content)
    body_end_m = re.search(r'</div><!-- /glossary-body -->', content)
    if not body_start_m or not body_end_m:
        print(f'  {filename}: glossaryBody not found!')
        return
    
    before = content[:body_start_m.start()]
    body = content[body_start_m.start():body_end_m.end()]
    after = content[body_end_m.end():]
    
    def replace_field(m):
        nonlocal translated, untranslated, untranslated_items
        inner = m.group(1).strip()
        
        en_html = translate_field_html(inner)
        if en_html:
            de_escaped = inner.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            en_escaped = en_html.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            # Actually, we need to store the raw HTML. Use a different approach - base64 or JS dict
            # For now, use single-quote-safe approach
            translated += 1
            return f'<div class="glossary-field" data-field-idx="{translated}">{inner}</div>'
        else:
            untranslated += 1
            label_m = re.search(r'<span class="glossary-field-label">(.*?)</span>', inner)
            label = label_m.group(1).strip() if label_m else ''
            content_text = hmod.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<span class="glossary-field-label">.*?</span>\s*', '', inner))).strip()
            untranslated_items.append(f'[{label}] {content_text[:60]}')
            return m.group(0)
    
    body = re.sub(r'<div class="glossary-field">(.*?)</div>', replace_field, body, flags=re.DOTALL)
    
    # Also handle related divs
    def replace_related(m):
        nonlocal translated
        inner = m.group(1).strip()
        translated += 1
        return f'<div class="glossary-related" data-field-idx="r{translated}">{inner}</div>'
    
    body = re.sub(r'<div class="glossary-related">(.*?)</div>', replace_related, body, flags=re.DOTALL)
    
    content = before + body + after
    
    print(f'  {filename}: {translated} tagged, {untranslated} untranslated')
    if untranslated_items:
        for item in untranslated_items[:5]:
            print(f'    MISS: {item}')
        if len(untranslated_items) > 5:
            print(f'    ... and {len(untranslated_items) - 5} more')
    
    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)


# Instead of data attributes (too complex with HTML escaping), 
# we'll generate a JS translation dictionary
def generate_js_dict(filename):
    """Extract fields and generate JS translation dict."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    body_start_m = re.search(r'id="glossaryBody"', content)
    body_end_m = re.search(r'</div><!-- /glossary-body -->', content)
    body = content[body_start_m.start():body_end_m.end()]
    
    translations = {}
    idx = [0]
    
    def collect_field(m):
        inner = m.group(1).strip()
        idx[0] += 1
        en_html = translate_field_html(inner)
        if en_html:
            translations[idx[0]] = {'de': inner, 'en': en_html}
        return m.group(0)
    
    re.sub(r'<div class="glossary-field">(.*?)</div>', collect_field, body, flags=re.DOTALL)
    
    # Related
    def collect_related(m):
        inner = m.group(1).strip()
        idx[0] += 1
        en_inner = inner.replace('Verwandt:', 'Related:')
        translations[idx[0]] = {'de': inner, 'en': en_inner}
        return m.group(0)
    
    re.sub(r'<div class="glossary-related">(.*?)</div>', collect_related, body, flags=re.DOTALL)
    
    return translations


def apply_translations(filename, translations):
    """Add indexed data attributes and generate the JS switch logic."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove old idx attributes
    content = re.sub(r' data-field-idx="[^"]*"', '', content)
    
    body_start_m = re.search(r'id="glossaryBody"', content)
    body_end_m = re.search(r'</div><!-- /glossary-body -->', content)
    before = content[:body_start_m.start()]
    body = content[body_start_m.start():body_end_m.end()]
    after = content[body_end_m.end():]
    
    idx = [0]
    translated = 0
    untranslated = 0
    
    def tag_field(m):
        nonlocal translated, untranslated
        inner = m.group(1).strip()
        idx[0] += 1
        if idx[0] in translations:
            translated += 1
            return f'<div class="glossary-field" data-fidx="{idx[0]}">{inner}</div>'
        else:
            untranslated += 1
            return m.group(0)
    
    body = re.sub(r'<div class="glossary-field">(.*?)</div>', tag_field, body, flags=re.DOTALL)
    
    def tag_related(m):
        nonlocal translated
        inner = m.group(1).strip()
        idx[0] += 1
        if idx[0] in translations:
            translated += 1
            return f'<div class="glossary-related" data-fidx="{idx[0]}">{inner}</div>'
        else:
            return m.group(0)
    
    body = re.sub(r'<div class="glossary-related">(.*?)</div>', tag_related, body, flags=re.DOTALL)
    
    content = before + body + after
    
    # Build the JS translation object
    js_lines = ['    var _glossFieldEN = {']
    for fidx in sorted(translations.keys()):
        en = translations[fidx]['en']
        # Escape for JS string
        en_js = en.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '')
        js_lines.append(f"        {fidx}: '{en_js}',")
    js_lines.append('    };')
    
    js_lines.append('    var _glossFieldDE = {')
    for fidx in sorted(translations.keys()):
        de = translations[fidx]['de']
        de_js = de.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '')
        js_lines.append(f"        {fidx}: '{de_js}',")
    js_lines.append('    };')
    
    js_dict_str = '\n'.join(js_lines)
    
    # Insert the dict and update switchGlossaryLang
    # Find existing switchGlossaryLang and add field swapping
    old_switch_pattern = r"(var glossaryLang = 'de';)"
    m = re.search(old_switch_pattern, content)
    if m:
        content = content[:m.start()] + js_dict_str + '\n    ' + m.group(1) + content[m.end():]
    
    # Update switchGlossaryLang to also swap fields
    old_swap = """document.querySelectorAll('#glossaryBody .glossary-term[data-de]').forEach(function(el) {
            el.innerHTML = el.getAttribute('data-' + glossaryLang);
        });"""
    
    new_swap = """document.querySelectorAll('#glossaryBody .glossary-term[data-de]').forEach(function(el) {
            el.innerHTML = el.getAttribute('data-' + glossaryLang);
        });
        var fieldDict = glossaryLang === 'en' ? _glossFieldEN : _glossFieldDE;
        document.querySelectorAll('#glossaryBody [data-fidx]').forEach(function(el) {
            var idx = parseInt(el.getAttribute('data-fidx'));
            if (fieldDict[idx]) el.innerHTML = fieldDict[idx];
        });"""
    
    if old_swap in content and 'fieldDict' not in content.split(old_swap)[0]:
        content = content.replace(old_swap, new_swap)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'  {filename}: {translated} fields tagged, {untranslated} untranslated, JS dict with {len(translations)} entries')
    return translated, untranslated


if __name__ == '__main__':
    # Step 1: Generate translations from specs.html (reference)
    print('Generating translation dict...')
    translations = generate_js_dict('specs.html')
    print(f'  Found {len(translations)} translatable fields')
    
    # Step 2: Apply to all 3 files
    print('\nApplying translations...')
    for fn in ['index.html', 'specs.html', 'build-log.html']:
        apply_translations(fn, translations)
    
    print('\nFertig.')
