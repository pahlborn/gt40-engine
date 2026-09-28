# -*- coding: utf-8 -*-
"""
Apply EN translations to glossary fields via JS dict + data-fidx attributes.
Clean approach: 
1. Number each glossary-field and glossary-related div with data-fidx
2. Build JS dicts (_glossFieldEN / _glossFieldDE) 
3. Update switchGlossaryLang to swap field innerHTML
"""
import re
import sys
import io
import html as hmod
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================
# Label map DE -> EN
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
    'F\u00fcr uns:': 'For us:',
    'Warum gr\u00f6\u00dfer als Cam Lift?': 'Why larger than Cam Lift?',
}

# ============================================================
# Full translation map: keyed by label|content_prefix (first 35 chars)
# ============================================================
T = {
    # ===== 1. GRUNDBEGRIFFE =====
    'Was ist das?|Der Innendurchmesser des Zylinders':
        'The internal diameter of the cylinder.',
    'Einfach gesagt:|Die Breite des Lochs, in dem der Kolbe':
        'The width of the hole in which the piston moves up and down.',
    'Warum?|Zusammen mit dem Hub bestimmt die Bohru':
        'Together with the stroke, the bore determines the displacement.',
    'Was ist das?|Der Weg, den der Kolben zwischen OT':
        'The distance the piston travels between TDC and BDC.',
    'Einfach gesagt:|Wie weit der Kolben bei einer volls':
        'How far the piston travels in one complete up-and-down movement.',
    'Was ist das?|Das Volumen, das der Kolben zwische':
        'The volume displaced by the piston between TDC and BDC.',
    'Einfach gesagt:|Der Raum, den der Kolben bei seiner':
        'The space the piston sweeps through during its travel in the cylinder.',
    'Was ist das?|Die reale Leistung, gemessen an der':
        'The actual power measured at the crankshaft (brake dynamometer / dyno). BHP accounts for internal friction losses.',
    'Einfach gesagt:|Was der Motor tats\u00e4chlich an seiner':
        "What the engine actually delivers at its crankshaft \u2013 the most honest power figure.",
    'Abgrenzung:|HP (Horsepower) \u2013 oft theoretisch':
        'HP (Horsepower) \u2013 often theoretical or measured without accessories. HP SAE gross (pre-1972) = no accessories, open exhaust \u2192 inflated numbers. WHP = measured at the wheels, includes drivetrain losses.',
    'In diesem Projekt:|Alle Leistungsangaben sind BHP':
        'All power figures are BHP (crankshaft). The simulator calculates BHP based on BMEP, VE and mechanical efficiency.',
    'Was ist das?|Die Position, bei der der Kolben ga':
        'The highest point the piston reaches in the cylinder. The crankshaft has completed a half rotation.',
    'Warum?|OT ist eine wichtige Referenz f\u00fcr nah':
        'TDC is the primary reference for nearly all engine measurements.',
    'Was ist das?|Die Position, bei der der Kolben ga':
        'The lowest point the piston reaches in the cylinder.',
    'Warum?|OT und UT bestimmen zusammen den Hub':
        'TDC and BDC together define the stroke.',
    # ===== 2. BLOCK & DECK =====
    'Was ist das?|Das Hauptgeh\u00e4use des Motors':
        'The main housing of the engine containing cylinders, crankshaft bearings and coolant passages. The foundation of every build.',
    'Einfach gesagt:|Das Grundger\u00fcst des Motors':
        'The basic framework of the engine.',
    'Was ist das?|Die bearbeitete obere Fl\u00e4che des Mo':
        'The machined upper surface of the block where the cylinder head mounts and the head gasket seals.',
    'Warum?|Die Lage dieser Fl\u00e4che beeinflusst':
        'The position of this surface affects quench distance and compression.',
    'Was ist das?|Der Abstand von der Mitte der Haupt':
        'The distance from the crankshaft main bearing centerline to the deck surface. A fixed block dimension.',
    'Warum wichtig?|Deck Height + Stroke + Rod Length':
        'Deck Height + Stroke + Rod Length + Compression Height determine piston position at TDC. If the value deviates, the piston position changes.',
    'Wie messen?|1. Kurbelwelle und ein Kolben (ohne':
        '1. Install crankshaft and one piston (without rings). 2. Rotate piston to TDC. 3. Dial indicator on deck surface, zero, then measure down to piston crown.',
    'Toleranz:|\u00b1 0.005" (0.13 mm). Bei abweichende':
        '\u00b1 0.005" (0.13 mm). If values deviate: have the block decked (machined flat).',
    'Was ist das?|Der Abstand zwischen Kolbenobersei':
        'The distance between the piston crown and the block deck surface at TDC. Positive = piston below deck. Negative = piston above deck.',
    'Typischer Wert:|0.005"\u20130.015" (0.13\u20130.38 mm) unte':
        '0.005"\u20130.015" (0.13\u20130.38 mm) below deck. Target for Boss 302: approx. 0.010" (0.25 mm).',
    'Wie messen?|1. Kolben (ohne Ringe) mit Pleuel u':
        '1. Install piston (without rings) with rod and crankshaft. 2. Rotate to exact TDC. 3. Dial indicator on deck, zero \u2192 measure to piston crown.',
    'Warum wichtig?|Bestimmt direkt die Quench Distan':
        'Directly determines quench distance (= piston-to-deck + compressed gasket thickness) and thus compression ratio and detonation behavior.',
    'Was ist das?|Die tats\u00e4chliche Position der Kolbe':
        'The actual position of the piston crown relative to the block deck surface at TDC.',
    # ===== 3. VERDICHTUNG =====
    'Was ist das?|Das Verh\u00e4ltnis zwischen dem gesamt':
        'The ratio of total cylinder volume (at BDC) to clearance volume (at TDC). Determines how much the mixture is compressed before ignition.',
    'Einfach gesagt:|Ein Motor mit 10:1 hat bei OT nur':
        'An engine with 10:1 has only one-tenth of the volume at TDC that was present at BDC.',
    'Was ist das?|Die geometrisch berechnete Verdicht':
        'The geometric compression ratio calculated from physical volumes \u2013 without considering camshaft timing.',
    'Was ist das?|Ber\u00fccksichtigt zus\u00e4tzlich, wann das':
        'Also considers when the intake valve actually closes \u2013 part of the charge escapes before compression begins. More accurate for predicting detonation.',
    'Einfach gesagt:|Solange das Einlassventil noch off':
        'As long as the intake valve is still open, part of the mixture can flow back \u2013 effective compression starts later.',
    'Was ist das?|Das Volumen des Brennraums im Zylin':
        'The volume of the combustion chamber in the cylinder head where combustion occurs. Measured by filling with fluid (burette method).',
    'Warum?|Wesentlicher Bestandteil der Compress':
        'A key component of the compression ratio calculation.',
    'Was ist das?|Eine Vertiefung im Kolbenboden':
        'A recess in the piston crown that creates additional volume and lowers compression ratio.',
    'Auswirkung:|Mehr Volumen \u2192 geringere Verdichtu':
        'More volume \u2192 lower compression ratio.',
    'Was ist das?|Eine Erh\u00f6hung auf dem Kolbenboden':
        'A raised area on the piston crown that reduces clearance volume and increases compression ratio.',
    'Auswirkung:|Weniger Restvolumen \u2192 h\u00f6here Verdic':
        'Less clearance volume \u2192 higher compression ratio.',
    'Was ist das?|Die Dicke der Zylinderkopfdichtung':
        'The thickness of the head gasket. Affects piston-to-head distance and thus clearance volume and compression ratio.',
    'Was ist das?|Die Dicke der Dichtung nach Montage':
        'The actual gasket thickness after torquing the head bolts. Always less than the uncompressed thickness.',
    'Wichtig:|F\u00fcr Berechnungen ist die Einbaudicke':
        'For calculations, the compressed (installed) thickness is relevant, not the uncompressed thickness.',
    'Was ist das?|Der sehr kleine Abstand zwischen Ko':
        'The very small gap between piston and cylinder head in a defined flat area. Creates turbulence (squish) improving combustion and reducing detonation.',
    'Einfach gesagt:|Wenn der Kolben nach oben kommt, w':
        'When the piston comes up, the mixture is squeezed out of this narrow area at high velocity.',
    'Warum?|Verbessert die Gemischbewegung im Bre':
        'Improves mixture motion in the combustion chamber \u2013 faster, more complete combustion, less detonation.',
    'Typischer Wert:|0.035"\u20130.045" (0.89\u20131.14 mm) idea':
        '0.035"\u20130.045" (0.89\u20131.14 mm) ideal. Below 0.035": risk of contact. Above 0.050": quench effect diminishes.',
    'Berechnung:|Piston-to-Deck + Compressed Gasket':
        'Piston-to-Deck + Compressed Gasket Thickness. Ideal: 0.035"\u20130.045" (0.89\u20131.14 mm).',
    'Was ist das?|Der Bereich des Kolbenbodens, der d':
        'The area of the piston crown directly opposing the flat portion of the cylinder head. Larger quench area = more turbulence = better combustion.',
    'Wie berechnen?|Quench Distance = Piston-to-Deck':
        'Quench Distance = Piston-to-Deck Clearance + Compressed Gasket Thickness.',
    # ===== 4. KURBELTRIEB =====
    'Was ist das?|Wandelt die lineare Kolbenbewegung':
        'Converts the linear piston motion into rotary motion.',
    'Was ist das?|Wandelt die Auf-und-ab-Bewegung de':
        'Converts the up-and-down piston motion into rotary motion.',
    'Was ist das?|Verbindet den Kolben mit der Kurbel':
        'Connects the piston to the crankshaft. Converts linear motion into rotary motion.',
    'Was ist das?|Der Abstand zwischen den Mittelpunk':
        'The distance from the piston pin center to the crankshaft journal center (center-to-center).',
    'Was ist das?|Der Abstand von Mitte Kolbenbolzen':
        'The distance from piston pin center to crankshaft journal center.',
    'Warum?|Zusammen mit Hub und Deck Height best':
        'Together with stroke and deck height, determines piston position in the cylinder.',
    'Was ist das?|Das Verh\u00e4ltnis von Pleuell\u00e4nge zu':
        'The ratio of connecting rod length to crankshaft stroke. Affects piston dwell time, side loading, and power characteristics.',
    'Berechnung:|Rod Length / Stroke':
        'Rod Length / Stroke',
    'Was ist das?|Der Teil der Kurbelwelle, der im Hau':
        'The part of the crankshaft that runs in the main bearing of the block.',
    'Was ist das?|Die Lagerstellen der Kurbelwelle':
        'The bearing surfaces of the crankshaft that sit in the main bearings of the block.',
    'Was ist das?|Der Teil der Kurbelwelle, auf dem da':
        'The part of the crankshaft on which the connecting rod bearing rides.',
    'Was ist das?|Die Zapfen an der Kurbelwelle, an d':
        'The pins on the crankshaft where the connecting rods attach.',
    'Was ist das?|Das Lager, in dem die Kurbelwelle im':
        'The bearing in which the crankshaft rotates in the block. Consists of two precision half-shells.',
    'Was ist das?|Die Lager, in denen die Kurbelwelle':
        'The bearings in which the crankshaft rotates.',
    'Was ist das?|Das Lager zwischen Pleuel und Kurbel':
        'The bearing between the connecting rod and the crankshaft journal.',
    'Was ist das?|Die Lagerschalen, die den Pleuel mit':
        'The bearing shells connecting the connecting rod to the crankshaft rod journal.',
    'Was ist das?|Der kleine Abstand zwischen Kurbelw':
        'The small gap between the crankshaft main journal and the main bearing shell.',
    'Typischer Wert:|0.0015"\u20130.0025" (0.038\u20130.064 mm)':
        '0.0015"\u20130.0025" (0.038\u20130.064 mm). Ford 302: 0.0005"\u20130.0024".',
    'Einfach gesagt:|Zwischen Kurbelwelle und Lager mus':
        'A defined space for the hydrodynamic oil film must exist between crankshaft and bearing.',
    'Wie messen?|1. Lagerschalen einlegen (trocken, ':
        '1. Install bearing shells (dry, no oil). 2. Place Plastigage strip across journal. 3. Install cap, torque to spec. 4. Remove cap, compare strip width to scale.',
    'Was ist das?|Der Abstand zwischen Pleuellager un':
        'The gap between the rod bearing and the crankshaft journal.',
    'Was ist das?|Der Spalt zwischen Pleuellagerzapfe':
        'The gap between the rod journal and the rod bearing shell.',
    'Warum?|Bestimmt, wie sich der tragende \u00d6lfil':
        'Determines how the load-bearing oil film forms.',
    'Typischer Wert:|0.001"\u20130.003" (0.025\u20130.076 mm).':
        '0.001"\u20130.003" (0.025\u20130.076 mm). Ford 302: 0.0006"\u20130.0026".',
    'Wie messen?|1. Lagerschalen in Pleuel und Decke':
        '1. Install bearing shells in rod and cap (dry). 2. Place Plastigage across rod journal. 3. Install cap, torque to spec. 4. Remove, compare.',
    'Was ist das?|Wie weit sich die Kurbelwelle in L\u00e4':
        'How far the crankshaft can move back and forth lengthwise, controlled by thrust bearings.',
    'Typischer Wert:|0.004"\u20130.008" (0.10\u20130.20 mm).':
        '0.004"\u20130.008" (0.10\u20130.20 mm). Ford 302: 0.004"\u20130.008".',
    'Wie messen?|1. Kurbelwelle mit allen Hauptlager':
        '1. Crankshaft installed with all main bearings. 2. Dial indicator on front face. 3. Push crank forward and back, read total movement.',
    'Was ist das?|Ausgleichsmassen sind innerhalb der':
        'All counterweights are integrated within the crankshaft configuration.',
    'Was ist das?|Alle Ausgleichsgewichte sind in der':
        'All counterweights are integrated into the crankshaft.',
    'Warum?|Bestimmt, welche Ausf\u00fchrung von Balan':
        'Determines which type of balancer and flywheel must be used.',
    'Was ist das?|Balancer und Schwungrad/Flexplate b':
        'Balancer and flywheel/flexplate require no additional counterweight mass.',
    'Was ist das?|Bauteil am vorderen Kurbelwellenend':
        'Component at the front of the crankshaft that dampens torsional vibrations.',
    'Was ist das?|Die Abweichung einer rotierenden Fl':
        'The deviation of a rotating surface from perfect circular motion. Measured with a dial indicator.',
    'Einfach gesagt:|Ob etwas beim Drehen \u201eeiert\u201c':
        'Whether something wobbles when spinning.',
    'Wie messen?|1. Teil in V-Block oder Prismen legen':
        '1. Place part in V-block. 2. Dial indicator perpendicular to surface. 3. Rotate, read TIR (Total Indicator Reading).',
    'Was ist das?|Der Prozess, jeden einzelnen Motor':
        'The process of measuring every single engine component and assembling to optimal tolerances.',
    'Einfach gesagt:|Nicht \u201esoll ungef\u00e4hr passen\u201c, son':
        'Not "should roughly fit" but: measure \u2192 compare \u2192 adjust \u2192 document.',
    # ===== 5. KOLBEN & RINGE =====
    'Was ist das?|Der Kolben bewegt sich im Zylinder ':
        'The piston moves up and down in the cylinder, transferring combustion force to the crankshaft via the connecting rod.',
    'Was ist das?|Der Abstand zwischen Kolben und Zyl':
        'The gap between the piston skirt and the cylinder wall. Required for thermal expansion and oil film.',
    'Einfach gesagt:|Darf nicht klemmen, aber auch nich':
        'Must not bind, but also must not have excessive play.',
    'Typischer Wert:|0.003"\u20130.005" (0.08\u20130.13 mm) f\u00fc':
        '0.003"\u20130.005" (0.08\u20130.13 mm) for forged pistons. Cast pistons: 0.001"\u20130.002".',
    'Wie messen?|1. Zylinderbohrung mit Innenmesssch':
        '1. Measure cylinder bore with bore gauge at 3 heights and 2 angles. 2. Measure piston at 90\u00b0 to pin. 3. Bore minus piston = clearance.',
    'Was ist das?|Abstand zwischen Kolbenbolzenmitte':
        'Distance from piston pin center to the top of the piston crown.',
    'Warum?|Zusammen mit Pleuell\u00e4nge, Hub und Dec':
        'Together with rod length, stroke and deck height, determines piston position at TDC.',
    'Was ist das?|Aussparungen im Kolbenboden':
        'Recesses machined into the piston crown to provide clearance for the valves at overlap.',
    'Was ist das?|Aussparung im Kolbenboden f\u00fcr das V':
        'Recess in the piston crown for valve clearance.',
    'Was ist das?|Der Mindestabstand zwischen ge\u00f6ffne':
        'The minimum distance between an open valve and the piston crown, especially critical at overlap TDC.',
    'Was ist das?|Der kleinste Abstand zwischen Kolbe':
        'The minimum distance between the piston and a valve during the engine cycle.',
    'Einfach gesagt:|Kolben und Ventil d\u00fcrfen sich niem':
        'Piston and valve must never touch!',
    'Warum besonders wichtig?|H\u00e4ngt von Nockenwellensteuerzei':
        'Depends on camshaft timing, valve lift, deck height, gasket and valve train. Must be verified on every build.',
    'Typischer Wert:|Einlass: \u2265 0.080" (2.0 mm). Ausla':
        'Intake: \u2265 0.080" (2.0 mm). Exhaust: \u2265 0.100" (2.5 mm). More is safer.',
    'Wie messen?|1. Motor komplett zusammengebaut (K':
        '1. Engine fully assembled (heads, valves, springs, rockers, pushrods). 2. Modeling clay in valve reliefs. 3. Rotate engine 2 full revolutions. 4. Remove head, measure clay thickness.',
    'Was ist das?|Der kleinste Abstand zwischen Kolbe':
        'The minimum distance between piston crown and cylinder head. Not the same as piston-to-valve clearance.',
    'Was ist das?|Der Gesamtabstand zwischen Kolbenob':
        'The total distance between piston crown and cylinder head at TDC.',
    'Was ist das?|Der oberste Kolbenring':
        'The uppermost piston ring \u2013 the primary compression seal.',
    'Aufgabe:|\u00dcbernimmt den wesentlichen Teil der':
        'Provides the primary seal against combustion pressure.',
    'Was ist das?|Der zweite Kolbenring':
        'The second piston ring \u2013 backs up the first ring and scrapes oil.',
    'Aufgabe:|Unterst\u00fctzt Abdichtung und beeinflu':
        'Supports sealing and controls oil regulation.',
    'Was ist das?|Der unterste Ring':
        'The lowest ring \u2013 scrapes excess oil from the cylinder wall.',
    'Aufgabe:|Kontrolliert die \u00d6lmenge auf der Zyl':
        'Controls the amount of oil on the cylinder wall.',
    'Was ist das?|Der Spalt zwischen den beiden Enden':
        'The gap between the two ends of a piston ring when installed in the cylinder.',
    'Was ist das?|Der Spalt an den Enden des Kolbenri':
        'The gap at the ends of the piston ring when installed.',
    'Warum?|Der Ring dehnt sich bei Erw\u00e4rmung aus':
        'The ring expands when heated. Without a gap, the ends would push against each other.',
    'Typischer Wert:|Top Ring: 0.016"\u20130.022"':
        'Top Ring: 0.016"\u20130.022" (0.41\u20130.56 mm). 2nd Ring: 0.010"\u20130.020". Oil Ring: per manufacturer spec.',
    'Wie messen?|1. Ring in die Zylinderbohrung schi':
        '1. Push ring into bore (without piston). 2. Use inverted piston to push ring ~1" down. 3. Measure gap with feeler gauge.',
    'Was ist das?|Die Nut im Kolben, in der der Ring':
        'The groove in the piston where the ring sits.',
    'Was ist das?|Die Nuten im Kolben':
        'The grooves machined into the piston that hold the piston rings.',
    'Was ist das?|Der Bereich des Kolbens zwischen zw':
        'The area of the piston between two ring grooves. The fire land protects the first ring from direct combustion heat.',
    'Was ist das?|Der Materialsteg zwischen zwei Kolb':
        'The material between two ring grooves.',
    'Was ist das?|Die Winkelpositionen der Ringst\u00f6\u00dfe':
        'The angular positions of the ring gaps relative to each other on the piston (typically 120\u00b0 offset).',
    'Was ist das?|Die gezielte Anordnung der Ringst':
        'The deliberate positioning of ring gaps relative to each other to minimize blow-by.',
    # ===== 7. ZYLINDERKOPF =====
    'Was ist das?|Bildet zusammen mit Kolben und Zyli':
        'Together with piston and cylinder, forms the combustion chamber. Contains valves, guides and seats.',
    'Was ist das?|Sitzt auf dem Block und bildet die':
        'Sits on top of the block forming the upper boundary of the combustion chamber.',
    'Was ist das?|Der Kanal, durch den das Frischgas':
        'The passage through which the fresh charge reaches the intake valve.',
    'Was ist das?|Der Kanal, durch den das Luft-Kraft':
        'The passage through which the air-fuel mixture flows into the combustion chamber.',
    'Was ist das?|Der Kanal, durch den die Abgase zum':
        'The passage through which the exhaust gases exit to the exhaust system.',
    'Was ist das?|Der Kanal, durch den die verbrannte':
        'The passage through which the burned exhaust gases exit.',
    'Was ist das?|Das Volumen eines Einlass- oder Aus':
        'The volume of an intake or exhaust port, measured in cc.',
    'Was ist das?|Das Volumen des Ein- oder Auslasska':
        'The volume of the intake or exhaust port.',
    'Wichtig:|Gr\u00f6\u00dfer ist nicht automatisch besser':
        'Bigger is not automatically better. Port size must match the engine and RPM range.',
    # ===== 8. VENTILE =====
    'Was ist das?|\u00d6ffnet und schlie\u00dft den Gaswechsel':
        'Opens and closes the gas exchange between cylinder and intake/exhaust system.',
    'Was ist das?|Ventile steuern den Gaswechsel':
        'Valves control the gas exchange at precisely timed intervals.',
    'Aufgabe:|L\u00e4sst das Frischgas in den Zylinder':
        'Allows the fresh charge into the cylinder.',
    'Aufgabe:|L\u00e4sst die Abgase aus dem Zylinder':
        'Allows the exhaust gases out of the cylinder.',
    'Was ist das?|Der d\u00fcnne Teil des Ventils, der in':
        'The thin part of the valve that slides in the valve guide.',
    'Was ist das?|Der zylindrische Schaft':
        'The cylindrical shaft of the valve.',
    'Was ist das?|Die Fl\u00e4che des Ventils, die auf dem':
        'The surface of the valve that sits on the valve seat and seals.',
    'Was ist das?|Die Dichtfl':
        'The sealing surface of the valve.',
    'Was ist das?|Die bearbeitete Sitzfl\u00e4che im Zylin':
        'The machined seat surface in the cylinder head against which the valve seals.',
    'Was ist das?|Der Ring im Zylinderkopf':
        'The hardened ring in the cylinder head against which the valve face seals.',
    'Was ist das?|F\u00fchrt den Ventilschaft und h\u00e4lt das':
        'Guides the valve stem and keeps the valve in the correct position.',
    'Was ist das?|Die F':
        'The bushing that guides the valve stem \u2013 ensures precise alignment.',
    # ===== 9. VENTILFEDERN =====
    'Was ist das?|Sorgt daf\u00fcr, dass das Ventil nach':
        'Ensures the valve closes after opening and maintains seat pressure.',
    'Was ist das?|Die Feder, die das Ventil':
        'The spring that closes the valve and keeps it seated.',
    'Was ist das?|Der Abstand zwischen Federsitz und':
        'The distance between the spring pad and the retainer with the spring installed.',
    'Was ist das?|Die H':
        'The height of the valve spring when installed with retainer and keepers.',
    'Warum?|Die Federkraft h\u00e4ngt stark von der E':
        'Spring force is highly dependent on installed height.',
    'Wie messen?|1. Ventilfeder, Retainer und Keile':
        '1. Install valve spring, retainer and keepers. 2. Measure height from spring pad to retainer underside with caliper.',
    'Was ist das?|Die Kraft, mit der die Feder das Ve':
        'The spring force when the valve is closed (at installed height).',
    'Was ist das?|Die Federkraft bei':
        'The spring force at a specific valve lift.',
    'Was ist das?|Die Federkraft bei einem bestimmten':
        'The spring force at a given valve lift. Must be high enough to control the valve at high RPM.',
    'Wichtig:|Ohne Angabe des Ventilhubs nicht ein':
        'Meaningless without specifying the valve lift!',
    'Was ist das?|Windungen der Feder liegen vollst\u00e4n':
        'Spring coils are fully compressed against each other.',
    'Was ist das?|Die L':
        'The length at which the spring coils are fully compressed (solid height).',
    'Warum kritisch?|Die Feder darf bei maximalem Vent':
        'The spring must not reach coil bind at maximum valve lift!',
    'Wie messen?|1. Ventilfeder auf Pr\u00fcfstand spann':
        '1. Spring on tester or: measure installed spring with caliper. Calculate compression at max lift.',
    'Was ist das?|Sitzt oben auf der Ventilfeder und':
        'Sits on top of the valve spring and is held by the keepers.',
    'Was ist das?|Der Teller':
        'The plate that sits on top of the valve spring.',
    'Was ist das?|Kleine Keile, die den Federteller a':
        'Small wedges that hold the retainer on the valve stem.',
    'Was ist das?|Kleine konische':
        'Small conical wedges that lock the retainer to the valve stem groove.',
    'Was ist das?|Der Abstand zwischen Federteller-Un':
        'The distance between retainer bottom and valve seal top at full lift.',
    'Warum wichtig?|Der Federteller darf die Dichtung':
        'The retainer must not contact the seal at maximum lift! Minimum 0.050" clearance.',
    'Typischer Wert:|Mindestens 0.050" (1.27 mm) bei m':
        'Minimum 0.050" (1.27 mm) at maximum lift.',
    'Wie messen?|1. Ventil bei maximalem Hub (oder m':
        '1. Open valve to max lift. 2. Measure distance between retainer bottom and seal top with feeler gauge.',
    'Was ist das?|Das Ventil folgt bei hoher Drehzahl':
        'At high RPM the valve no longer reliably follows the camshaft profile \u2013 it "floats" open.',
    'Was ist das?|Wenn die Ventilfeder':
        'When the valve spring cannot close the valve quickly enough.',
    'Warum kritisch?|Kann zu mechanischen Sch\u00e4den f\u00fch':
        'Can cause mechanical damage!',
    # ===== 10. NOCKENWELLE =====
    'Was ist das?|Die Welle mit exzentrischen Nocken':
        'The shaft with eccentric lobes that controls valve opening and closing.',
    'Was ist das?|Bestimmt, wann und wie weit die Ven':
        'Determines when and how far the valves open.',
    'Was ist das?|Die Erhebung auf der Nockenwelle':
        'The raised portion on the camshaft that pushes the lifter to open the valve.',
    'Folge:|Lifter unten \u2192 Pushrod unten \u2192 Ventil':
        'Lifter down \u2192 pushrod down \u2192 valve closed.',
    'Was ist das?|Der runde, niedrigere Teil des Nock':
        'The round, lower part of the cam lobe where the lifter is not being lifted.',
    'Was ist das?|Der runde Grundbereich des Nockens':
        'The round base portion where no valve lift occurs.',
    'Was ist das?|Die maximale Erhebung des Nockens':
        'The maximum rise of the cam lobe above the base circle.',
    'Was ist das?|Wie weit die Nocke den Lifter anheb':
        'How far the cam lobe lifts the lifter.',
    'Was ist das?|Wie weit sich das Ventil tats\u00e4chlic':
        'How far the valve actually opens.',
    'Was ist das?|Wie weit das Ventil':
        'How far the valve opens from its seat.',
    'Warum gr\u00f6\u00dfer als Cam Lift?|Der Kipphebel \u00fcbersetzt die':
        'The rocker arm multiplies the motion.',
    'Was ist das?|Das ':
        'The ratio of lever arms in the rocker \u2013 multiplies cam lift.',
    'Beispiel:|Bei 1,6:1 bewegt sich das Ventil ca':
        'With 1.6:1 ratio, the valve moves approx. 1.6 times as far as the lifter.',
    'Was ist das?|Wie lange ein Ventil w\u00e4hrend eines':
        'How long a valve stays open during one engine cycle, in crankshaft degrees.',
    'Was ist das?|Wie lange das Ventil':
        'How long the valve stays open, in crankshaft degrees.',
    'Wichtig:|Nur sinnvoll zusammen mit der Messme':
        'Only meaningful combined with the measurement method (e.g., Duration @ 0.050").',
    'Was ist das?|Die ':
        'The duration measured at 0.050" valve lift \u2013 the industry standard for comparing cam profiles.',
    'Warum wichtig?|Erm\u00f6glicht sinnvolleren Vergleic':
        'Enables more meaningful camshaft comparison than advertised duration.',
    'Was ist das?|Der Winkel zwischen den Mittellinien':
        'The angle between the centerlines of the intake and exhaust lobes, in camshaft degrees.',
    'Was ist das?|Der Winkel zwischen dem maximalen E':
        'The angle between maximum intake and exhaust lift.',
    'Was ist das?|Der Kurbelwellenwinkel, bei dem ein':
        'The crankshaft angle at which a cam lobe reaches its geometric center (maximum lift) relative to TDC.',
    'Was ist das?|Der Kurbelwinkelgrad':
        'The crankshaft degree at which maximum intake lobe lift occurs.',
    'Typischer Wert:|Intake Centerline 106\u00b0\u2013110\u00b0 ATDC':
        'Intake Centerline 106\u00b0\u2013110\u00b0 ATDC (depending on camshaft).',
    'Wie messen?|Siehe "Degreeing the Cam". Die Int':
        'See "Degreeing the Cam". The intake centerline is the crankshaft angle at maximum intake lobe lift.',
    'Was ist das?|Die Nockenwelle wird gegen\u00fcber der':
        'The camshaft is positioned earlier than the base setting relative to the crankshaft.',
    'Was ist das?|Die Nockenwelle ist relativ zur Kur':
        'The camshaft is positioned relative to the crankshaft \u2013 earlier (advance) or later (retard).',
    'Was ist das?|Die tats\u00e4chliche Position der Nocke':
        'The actual position of the camshaft is verified with a degree wheel and dial indicator.',
    'Was ist das?|Das pr':
        'The precision process of verifying camshaft position using a degree wheel and dial indicator.',
    'Einfach gesagt:|Wir verlassen uns nicht nur auf d':
        "We don't just rely on the chain marks \u2013 we verify by measuring.",
    'Wie messen?|1. Gradscheibe (Degree Wheel) an de':
        '1. Mount degree wheel on crankshaft. 2. Pointer on block. 3. Dial indicator on #1 intake lifter. 4. Find max lift point, note crankshaft angle.',
    'Was ist das?|Die Kurbelwinkelgrade, in denen Ein':
        'The crankshaft degrees during which both intake and exhaust valves are open simultaneously.',
    'Was ist das?|Der Zeitraum, in dem Einlass- und A':
        'The period during which intake and exhaust valves are simultaneously open.',
    'Warum wichtig?|Beeinflusst unter anderem die effe':
        'Affects effective compression, idle quality and RPM behavior.',
    'Einfach gesagt:|Am Ende des Aussto\u00dfens ist das Au':
        'At the end of the exhaust stroke, the exhaust valve is still open while the intake valve already opens.',
    # ===== 11. STEUERTRIEB =====
    'Was ist das?|Das System aus Kette/Zahnr':
        'The system of chain, gears and sprockets synchronizing cam to crank at 2:1.',
    'Was ist das?|Kurbelwellenrad, Nockenwellenrad un':
        'Crank gear, cam gear and timing chain.',
    'Was ist das?|Die Kette, die Kurbelwellenrad und':
        'The chain connecting crank gear to cam gear for precise valve timing.',
    'Was ist das?|Verbindet Kurbelwelle und Nockenwel':
        'Connects crankshaft and camshaft for correct rotation ratio.',
    'Was ist das?|Das Zahnrad auf der Kurbelwelle':
        'The gear/sprocket on the crankshaft that drives the timing chain.',
    'Was ist das?|Das Zahnrad auf der Nockenwelle':
        'The gear/sprocket on the camshaft, driven at half crank speed.',
    'Was ist das?|Markierung auf den Zahnr\u00e4dern zur':
        'Marks on the gears for positioning crankshaft and camshaft.',
    'Was ist das?|Markierungen auf den Steuerzahnr':
        'Marks on the timing gears used to align valve timing.',
    'Wichtig:|Eine Markierung ersetzt nicht zwingen':
        'A timing mark does not necessarily replace degreeing!',
    'Was ist das?|Das Spiel zwischen den Zahnflanken':
        'The play between gear teeth \u2013 required for lubrication and thermal expansion.',
    'Was ist das?|Der Abstand zwischen den Zahnflanke':
        'The gap between gear teeth of two meshing gears.',
    # ===== 12. LIFTER & PUSHROD =====
    'Was ist das?|Ein Lifter mit Rollenrad zur Nocken':
        'A lifter with a roller on the camshaft and a hydraulic mechanism for automatic valve lash compensation.',
    'Was ist das?|Ein St':
        'A tappet with a roller and hydraulic element that eliminates valve lash.',
    'Was ist das?|Das Rollenrad am unteren Ende des L':
        'The roller at the bottom of the lifter riding on the cam lobe.',
    'Was ist das?|Die Rolle am unteren Ende des Lifte':
        'The roller at the bottom of the lifter.',
    'Was ist das?|Ein kleiner Kolben im Lifter-Innere':
        'A small piston inside the lifter that automatically compensates for valve lash.',
    'Was ist das?|Der innere hydraulische Kolben im L':
        'The internal hydraulic piston maintaining zero valve lash.',
    'Was ist das?|Wie weit der Plunger nach dem Einst':
        'How far the plunger is pushed into the lifter body after adjustment.',
    'Was ist das?|Wie weit der Plunger im Lifter':
        'How far the plunger is pushed into the lifter body.',
    'Einfach gesagt:|Der Plunger soll nicht ganz oben':
        'The plunger should sit at a defined midpoint \u2013 neither fully extended nor bottomed out.',
    'Was ist das?|Das \u00e4u\u00dfere Geh\u00e4use des Lifters':
        'The outer housing of the lifter.',
    'Was ist das?|Das ':
        'The outer housing of the lifter that rides in the lifter bore.',
    'Was ist das?|Die Bohrung im Motorblock':
        'The bore in the engine block in which the lifter slides.',
    'Was ist das?|Die Bohrung im Motorblock, in der d':
        'The bore in the block in which the lifter moves up and down.',
    'Was ist das?|H\u00e4lt die Roller-Lifter in ihrer kor':
        'Holds the roller lifters in their correct position.',
    'Was ist das?|Eine Halterung':
        'A retainer (spider/tie-bar) that holds lifters in their bores and prevents rotation.',
    'Was ist das?|Die Stange zwischen Lifter und Kipp':
        'The rod between lifter and rocker arm. The lifter is pushed up by the cam and transmits force via the pushrod to the rocker.',
    'Was ist das?|Die Verbindungsstange zwischen Lift':
        'The connecting rod between lifter and rocker arm.',
    'Was ist das?|Eine verstellbare Sto\u00dfelstange':
        'An adjustable pushrod for determining the correct final pushrod length.',
    'Was ist das?|Eine verstellbare':
        'An adjustable pushrod for determining correct length.',
    'Was ist das?|Die korrekte L':
        'The correct length is critical for proper rocker geometry.',
    'Einfach gesagt:|Wir kaufen nicht einfach eine beli':
        "We don't just buy any length \u2013 we measure the correct length first.",
    'Warum wichtig?|Eine falsche L\u00e4nge ver\u00e4ndert die':
        'An incorrect length changes the rocker arm position on the valve.',
    'Was ist das?|Der Kipphebel lenkt die Aufw':
        'The rocker arm redirects upward pushrod motion downward onto the valve and multiplies lift.',
    'Was ist das?|\u00dcbertr\u00e4gt die Bewegung der Pushrod':
        'Transfers the pushrod motion to the valve.',
    'Was ist das?|Der Bereich des Kipphebels, der auf':
        'The area of the rocker arm that rides on the valve stem tip.',
    'Was ist das?|Die Kontaktfl':
        'The contact surface of the rocker arm on the valve stem.',
    'Was ist das?|Die Spur, die der Kipphebel auf der':
        'The trace pattern the rocker tip leaves on the valve stem tip.',
    'Was ist das?|Das Muster':
        'The pattern the rocker tip traces on the valve stem.',
    'Warum wichtig?|Zeigt, ob die Ventiltrieb-Geometri':
        'Shows whether the valve train geometry is correct.',
    'Was ist das?|Das Zusammenspiel von Lifter, Pushr':
        'The interaction of lifter, pushrod, rocker arm and valve across the full operating range.',
    'Was ist das?|Das Zusammenspiel aller':
        'The interaction of all valve train components.',
    'Was ist das?|Der Abstand':
        'The gap between rocker tip and valve stem when the lifter is on the base circle.',
    'Bei hydraulischem Lifter:|Das Spiel wird durch die Einstell':
        'The lash is taken up by the adjustment and the plunger preload.',
    # ===== 13. STEUERZEITEN =====
    'Was ist das?|Der Kurbelwellenwinkel, bei dem das ':
        'The crankshaft angle at which the intake valve begins to open (before TDC).',
    'Was ist das?|Der Kurbelwellengrad':
        'The crankshaft degree at which a valve event occurs.',
    'Was ist das?|Der Kurbelwinkelgrad':
        'The crankshaft degree at which a valve event occurs relative to TDC/BDC.',
    'Was ist das?|Der Kurbelwinkelgrad nach UT':
        'The crankshaft degree after BDC at which the intake valve fully closes.',
    'Was ist das?|Der Kurbelwinkelgrad vor UT':
        'The crankshaft degree before BDC at which the exhaust valve begins to open.',
    'Was ist das?|Der Kurbelwinkelgrad nach OT':
        'The crankshaft degree after TDC at which the exhaust valve fully closes.',
    # ===== 14. OELSYSTEM =====
    'Was ist das?|F\u00f6rdert Motor\u00f6l aus der \u00d6lwanne dur':
        'Delivers engine oil from the oil pan through the engine to all lubrication points.',
    'Was ist das?|F':
        'Delivers pressurized oil to all bearings, valve train and timing chain.',
    'Was ist das?|Das Rohr, \u00fcber das die \u00d6lpumpe das':
        'The tube through which the oil pump draws oil from the oil pan.',
    'Was ist das?|Das Rohr mit Sieb':
        'The tube with screen that draws oil from the pan.',
    'Was ist das?|Der Abstand zwischen \u00d6l-Pickup':
        'The distance between the oil pickup screen and the bottom of the oil pan.',
    'Was ist das?|Der Abstand zwischen ':
        'The distance between the oil pickup and the pan bottom.',
    'Warum wichtig?|Darf weder zu weit vom \u00d6l entfern':
        'Must be neither too far from the oil nor touching the bottom. 1/4"\u20133/8" (6\u201310 mm) optimal.',
    'Typischer Wert:|1/4"\u20133/8" (6\u201310 mm) Abstand zwisch':
        '1/4"\u20133/8" (6\u201310 mm) between oil pickup and pan floor.',
    'Wie messen?|1. Pickup in \u00d6lpumpe einbauen, Pump':
        '1. Install pickup in pump, mount on block. 2. Modeling clay under screen. 3. Install pan, torque. 4. Remove pan, measure clay.',
    'Was ist das?|Der \u00d6lvorratsbeh\u00e4lter am unteren En':
        'The oil reservoir at the bottom of the engine.',
    'Was ist das?|Der ':
        'The reservoir at the bottom of the engine.',
    'Was ist das?|Verhindert, dass \u00d6l bei Beschleunigu':
        'Prevents oil from sloshing away from the pickup during acceleration or cornering.',
    'Was ist das?|Ein Blech in der ':
        'A plate in the oil pan preventing oil slosh.',
    'F\u00fcr uns:|Besonders relevant bei Trackdays und':
        'Especially relevant on track days and under high lateral G-forces.',
    'Was ist das?|Ein gelochtes':
        'A perforated tray between crankshaft and oil pan reducing oil mist and parasitic drag.',
    'Was ist das?|Reduziert die \u00d6lmenge, die von der':
        'Reduces the amount of oil churned up by the rotating crankshaft.',
    'Was ist das?|Der Druck im Schmierkreislauf des M':
        'The pressure in the engine lubrication circuit.',
    'Was ist das?|Der Druck':
        'The pressure at which oil is delivered to the bearings.',
    'Was ist das?|Eine ':
        'An oil pump with higher flow capacity (+25% typical).',
    'Wichtig:|High Volume bedeutet nicht automatisc':
        'High volume does not automatically mean higher pressure. Depends on engine, bearings, RPM and viscosity.',
    'Was ist das?|Verhindert, dass der \u00d6ldruck \u00fcber d':
        'Prevents oil pressure from exceeding the intended range.',
    'Was ist das?|Ein Ventil in der ':
        'A valve in the oil pump preventing excessive pressure.',
    # ===== 15. MESSEN & MONTAGE =====
    'Was ist das?|Ein definierter Abstand zwischen zw':
        'A defined gap between two mating parts for oil film, expansion or free movement.',
    'Beispiel:|Piston-to-Wall Clearance = Abstand K':
        'Piston-to-Wall Clearance = gap between piston and cylinder wall.',
    'Was ist das?|Der Bereich, innerhalb dessen ein Ma':
        'The range within which a dimension may fall.',
    'Was ist das?|Der zul':
        'The allowable deviation from a specified dimension.',
    'Was ist das?|Wenn zwei Bauteile sich ber':
        'When two components physically contact each other causing damage.',
    'Beispiel:|Piston-to-Valve Interference = Kolbe':
        'Piston-to-Valve Interference = piston and valve make contact.',
    'Was ist das?|Axiales Spiel':
        'Axial (lengthwise) play of a shaft in its bearings.',
    'Beispiel:|Crankshaft Endplay = Bewegung der Ku':
        'Crankshaft Endplay = crankshaft back-and-forth movement.',
    'Was ist das?|Pr':
        'A precision measuring instrument.',
    'Verwendung:|Kurbelwellen-Endplay, Rundlauf, Deg':
        'Crankshaft endplay, runout, degreeing the camshaft.',
    'Was ist das?|Satz d\u00fcnner Metallbl\u00e4tter mit defin':
        'A set of thin metal blades of defined thickness for measuring gaps.',
    'Was ist das?|Ein Set':
        'A set of precisely ground metal blades for measuring gaps.',
    'Verwendung:|Pr\u00e4zise Au\u00dfenma\u00dfe, z.B. Kurbelwelle':
        'Precise external dimensions, e.g. crankshaft journals.',
    'Verwendung:|Zylinderbohrungen, Lagerbohrungen':
        'Cylinder bores, bearing housings.',
    'Was ist das?|Ein d':
        'A thin wax strip placed between bearing and journal.',
    'Einfach gesagt:|Die Breite des plattgedr\u00fcckten Ku':
        'The width of the crushed strip indicates the bearing clearance.',
    'Was ist das?|Die vorgeschriebene Drehkraft, mit':
        'The prescribed torque force for tightening a fastener.',
    'Was ist das?|Die Kraft':
        'The force applied to tighten a fastener.',
    'Was ist das?|Die vorgeschriebene Reihenfolge':
        'The prescribed order for tightening fasteners.',
    'Warum wichtig?|Damit sich das Bauteil gleichm\u00e4\u00dfi':
        'So the component seats evenly and is not warped.',
    'Was ist das?|Nach einem definierten Anfangsdrehm':
        'After a defined initial torque, the bolt is turned by a specified angle.',
    'Was ist das?|Nach dem Voranzug':
        'After initial torque, the fastener is turned additional degrees.',
    'Wichtig:|Nur verwenden, wenn es f\u00fcr die betre':
        'Only use when specified for the particular fastener!',
    'Was ist das?|Ein Klebstoff':
        'An adhesive on threads preventing loosening from vibration. Blue = removable, red = permanent.',
    'Was ist das?|Spezial':
        'Special paste for critical surfaces during assembly to ensure lubrication at initial startup.',
    'Verwendung:|Lagerstellen, Nockenwellenmontage':
        'Bearing surfaces, camshaft installation.',
    # ===== 16. ZUSAMMENHAENGE =====
    '|Bestimmt durch: Deck Height, Stroke, Ro':
        'Determined by: Deck Height, Stroke, Rod Length, Compression Height \u2192 Piston-to-Deck position.',
    '|Quench Distance = Piston-to-Deck + Comp':
        'Quench Distance = Piston-to-Deck + Compressed Gasket Thickness',
    '|Ben\u00f6tigt: Bore, Stroke, Combustion Cham':
        'Requires: Bore, Stroke, Combustion Chamber Volume, Piston Dish/Dome, Piston-to-Deck, Gasket Bore, Compressed Gasket Thickness.',
    '|Abh\u00e4ngig von: Lifter, Plunger Position':
        'Depends on: Lifter, Plunger Position, Pushrod Length, Rocker Arm, Rocker Ratio, Valve Stem Height, Valve Lash.',
    '|Beeinflusst durch: Camshaft Timing, Lif':
        'Influenced by: Camshaft Timing, Lift, Duration, Rocker Ratio, Valve Size, Piston Valve Relief, Piston-to-Deck.',
    '|Relevant: Installed Spring Height, Seat':
        'Relevant: Installed Spring Height, Seat Pressure, Open Pressure, Maximum Valve Lift, Coil Bind, Retainer-to-Seal Clearance.',
    '|TDC \u2013 Top Dead Center (OT)':
        'TDC \u2013 Top Dead Center | BDC \u2013 Bottom Dead Center | IO/IC \u2013 Intake Open/Close | EO/EC \u2013 Exhaust Open/Close',
}


def match_translation(label_de, content_text):
    """Find EN translation for a DE field by matching label + content prefix."""
    for key, en_val in T.items():
        parts = key.split('|', 1)
        if len(parts) == 2:
            key_label, key_prefix = parts
        else:
            key_label, key_prefix = '', parts[0]
        
        # Check label match
        label_decoded = hmod.unescape(label_de)
        if key_label and key_label != label_de and key_label != label_decoded:
            continue
        if not key_label and label_de:
            continue
        
        # Check content prefix match (first 35 chars)
        if content_text.startswith(key_prefix[:35]):
            return en_val
    return None


def build_translation_dict(filename):
    """Build indexed translation dictionary from a file."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    body_start = content.index('id="glossaryBody"')
    body_end = content.index('</div><!-- /glossary-body -->')
    body = content[body_start:body_end]
    
    translations = {}
    idx = 0
    
    # Fields
    for m in re.finditer(r'<div class="glossary-field">(.*?)</div>', body, re.DOTALL):
        idx += 1
        inner = m.group(1).strip()
        
        label_m = re.search(r'<span class="glossary-field-label">(.*?)</span>', inner)
        label_de = label_m.group(1).strip() if label_m else ''
        
        if label_m:
            content_raw = inner[label_m.end():].strip()
        else:
            content_raw = inner
        content_text = hmod.unescape(re.sub(r'<[^>]+>', '', content_raw)).strip()
        
        en_content = match_translation(label_de, content_text)
        if en_content is not None:
            label_en = LABEL_MAP.get(label_de, LABEL_MAP.get(hmod.unescape(label_de), label_de))
            if label_de:
                en_html = f'<span class="glossary-field-label">{label_en}</span> {en_content}'
            else:
                en_html = en_content
            translations[idx] = {'de': inner, 'en': en_html}
    
    # Related
    for m in re.finditer(r'<div class="glossary-related">(.*?)</div>', body, re.DOTALL):
        idx += 1
        inner = m.group(1).strip()
        en_inner = inner.replace('Verwandt:', 'Related:')
        translations[idx] = {'de': inner, 'en': en_inner}
    
    return translations, idx


def apply_to_file(filename, translations, total_count):
    """Tag fields with data-fidx and inject JS dict + swap logic."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    body_start_m = re.search(r'id="glossaryBody"', content)
    body_end_m = re.search(r'</div><!-- /glossary-body -->', content)
    before = content[:body_start_m.start()]
    body = content[body_start_m.start():body_end_m.end()]
    after = content[body_end_m.end():]
    
    idx = [0]
    tagged = [0]
    
    def tag_field(m):
        idx[0] += 1
        inner = m.group(1).strip()
        if idx[0] in translations:
            tagged[0] += 1
            return f'<div class="glossary-field" data-fidx="{idx[0]}">{inner}</div>'
        return m.group(0)
    
    body = re.sub(r'<div class="glossary-field">(.*?)</div>', tag_field, body, flags=re.DOTALL)
    
    def tag_related(m):
        idx[0] += 1
        inner = m.group(1).strip()
        if idx[0] in translations:
            tagged[0] += 1
            return f'<div class="glossary-related" data-fidx="{idx[0]}">{inner}</div>'
        return m.group(0)
    
    body = re.sub(r'<div class="glossary-related">(.*?)</div>', tag_related, body, flags=re.DOTALL)
    
    content = before + body + after
    
    # Build JS dicts
    js_en_lines = []
    js_de_lines = []
    for fidx in sorted(translations.keys()):
        en = translations[fidx]['en'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ').replace('\r', '')
        de = translations[fidx]['de'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ').replace('\r', '')
        js_en_lines.append(f"        {fidx}:'{en}'")
        js_de_lines.append(f"        {fidx}:'{de}'")
    
    js_dict = f"""    var _gEN={{{','.join(js_en_lines)}}};
    var _gDE={{{','.join(js_de_lines)}}};"""
    
    # Insert dicts before glossaryLang declaration
    marker = "var glossaryLang = 'de';"
    if marker in content and '_gEN' not in content:
        content = content.replace(marker, js_dict + '\n    ' + marker)
    
    # Update switchGlossaryLang to swap field contents
    old_term_swap = """document.querySelectorAll('#glossaryBody .glossary-term[data-de]').forEach(function(el) {
            el.innerHTML = el.getAttribute('data-' + glossaryLang);
        });"""
    
    new_term_swap = """document.querySelectorAll('#glossaryBody .glossary-term[data-de]').forEach(function(el) {
            el.innerHTML = el.getAttribute('data-' + glossaryLang);
        });
        var _fd = glossaryLang === 'en' ? _gEN : _gDE;
        document.querySelectorAll('#glossaryBody [data-fidx]').forEach(function(el) {
            var k = parseInt(el.getAttribute('data-fidx'));
            if (_fd[k]) el.innerHTML = _fd[k];
        });"""
    
    if old_term_swap in content and '_fd' not in content:
        content = content.replace(old_term_swap, new_term_swap)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'  {filename}: {tagged[0]} tagged, JS dict {len(translations)} entries')


if __name__ == '__main__':
    print('Building translation dict from specs.html...')
    translations, total = build_translation_dict('specs.html')
    print(f'  {len(translations)} of {total} translated ({total - len(translations)} missing)')
    
    # Show missing
    with open('specs.html', 'r', encoding='utf-8') as f:
        c = f.read()
    body = c[c.index('id="glossaryBody"'):c.index('</div><!-- /glossary-body -->')]
    idx = 0
    missing = []
    for m in re.finditer(r'<div class="glossary-field">(.*?)</div>', body, re.DOTALL):
        idx += 1
        if idx not in translations:
            inner = m.group(1).strip()
            label_m = re.search(r'<span class="glossary-field-label">(.*?)</span>', inner)
            label = hmod.unescape(label_m.group(1).strip()) if label_m else ''
            ct = hmod.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<span class="glossary-field-label">.*?</span>\s*', '', inner))).strip()
            missing.append(f'  #{idx} [{label}] {ct[:60]}')
    
    if missing:
        print(f'\n  Missing translations ({len(missing)}):')
        for m in missing:
            print(m)
    
    print('\nApplying to all files...')
    for fn in ['index.html', 'specs.html', 'build-log.html']:
        apply_to_file(fn, translations, total)
    
    print('\nDone.')
