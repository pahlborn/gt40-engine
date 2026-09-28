# -*- coding: utf-8 -*-
"""
Add DE/EN toggle to glossary on all 3 pages.
- Adds toggle button to glossary header
- Adds data-de and data-en attributes to every glossary-term
- Adds switchGlossaryLang() function
- Updates filterGlossary count text based on language
"""
import re
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================
# MAPPING: current DE term -> EN term for data-en attribute
# ============================================================
TERM_MAP = {
    'Zylinderbohrung (Bore)': 'Bore (Zylinderbohrung)',
    'Hub (Stroke)': 'Stroke (Hub)',
    'Hubraum (Displacement)': 'Displacement (Hubraum)',
    'BHP &ndash; Brake Horsepower (Bremsleistung)': 'BHP &ndash; Brake Horsepower',
    'OT &ndash; Oberer Totpunkt (TDC)': 'TDC &ndash; Top Dead Center (Oberer Totpunkt)',
    'UT &ndash; Unterer Totpunkt (BDC)': 'BDC &ndash; Bottom Dead Center (Unterer Totpunkt)',
    'Motorblock (Engine Block)': 'Engine Block (Motorblock)',
    'Dichtfl&auml;che / Deckfl&auml;che (Deck Surface)': 'Deck / Deck Surface (Dichtfl&auml;che)',
    'Blockh&ouml;he (Deck Height)': 'Deck Height (Blockh&ouml;he)',
    'Kolbenunterstand (Piston-to-Deck Clearance)': 'Piston-to-Deck Clearance (Kolbenunterstand)',
    'Kolben&uuml;ber-/unterstand (Piston Deck Height)': 'Piston Deck Height (Kolben&uuml;ber-/unterstand)',
    'Verdichtungsverh&auml;ltnis (Compression Ratio)': 'Compression Ratio (Verdichtungsverh&auml;ltnis)',
    'Statisches Verdichtungsverh&auml;ltnis (Static CR)': 'Static Compression Ratio (Statisches Verdichtungsverh&auml;ltnis)',
    'Dynamisches Verdichtungsverh&auml;ltnis (Dynamic CR)': 'Dynamic Compression Ratio (Dynamisches Verdichtungsverh&auml;ltnis)',
    'Brennraumvolumen (Combustion Chamber Volume)': 'Combustion Chamber Volume (Brennraumvolumen)',
    'Kolbenmulde (Piston Dish)': 'Piston Dish (Kolbenmulde)',
    'Kolbenboden, erhaben (Piston Dome)': 'Piston Dome (erhabener Kolbenboden)',
    'Dichtungsdicke (Gasket Thickness)': 'Gasket Thickness (Dichtungsdicke)',
    'Einbaudicke (Compressed Gasket Thickness)': 'Compressed Gasket Thickness (Einbaudicke)',
    'Quetschspalt (Quench / Squish)': 'Quench / Squish (Quetschspalt)',
    'Quetschspaltma&szlig; (Quench Distance)': 'Quench Distance (Quetschspaltma&szlig;)',
    'Quetschfl&auml;che (Quench Area)': 'Quench Area (Quetschfl&auml;che)',
    'Kurbelwelle (Crankshaft)': 'Crankshaft (Kurbelwelle)',
    'Pleuel (Connecting Rod)': 'Connecting Rod (Pleuel)',
    'Pleuell&auml;nge (Rod Length)': 'Rod Length (Pleuell&auml;nge)',
    'Pleuelverh&auml;ltnis (Rod Ratio)': 'Rod Ratio (Pleuelverh&auml;ltnis)',
    'Hauptlagerzapfen (Main Journal)': 'Main Journal (Hauptlagerzapfen)',
    'Pleuellagerzapfen (Rod Journal)': 'Rod Journal (Pleuellagerzapfen)',
    'Hauptlager (Main Bearing)': 'Main Bearing (Hauptlager)',
    'Pleuellager (Rod Bearing)': 'Rod Bearing (Pleuellager)',
    'Hauptlagerspiel (Main Bearing Clearance)': 'Main Bearing Clearance (Hauptlagerspiel)',
    'Pleuellagerspiel (Rod Bearing Clearance)': 'Rod Bearing Clearance (Pleuellagerspiel)',
    'Axialspiel, Kurbelwelle (Crankshaft Endplay)': 'Crankshaft Endplay (Axialspiel)',
    'Innenauswuchtung (Internal Balance)': 'Internal Balance (Innenauswuchtung)',
    'Nullwuchtung (Zero Balance)': 'Zero Balance (Nullwuchtung)',
    'Schwingungsd&auml;mpfer (Harmonic Balancer)': 'Harmonic Balancer (Schwingungsd&auml;mpfer)',
    'Kolben (Piston)': 'Piston (Kolben)',
    'Einbauspiel (Piston-to-Wall Clearance)': 'Piston-to-Wall Clearance (Einbauspiel)',
    'Kompressionsh&ouml;he (Compression Height)': 'Compression Height (Kompressionsh&ouml;he)',
    'Ventiltasche (Valve Relief)': 'Valve Relief (Ventiltasche)',
    'Ventil-Kolben-Freigang (Piston-to-Valve Clearance)': 'Piston-to-Valve Clearance (Ventil-Kolben-Freigang)',
    'Quetschspaltma&szlig; (Piston-to-Head Clearance)': 'Piston-to-Head Clearance (Quetschspaltma&szlig;)',
    '1. Kompressionsring (Top Ring)': 'Top Ring (1. Kompressionsring)',
    '2. Kompressionsring (Second Ring)': 'Second Ring (2. Kompressionsring)',
    '&Ouml;labstreifring (Oil Ring)': 'Oil Ring (&Ouml;labstreifring)',
    'Sto&szlig;spiel (Ring End Gap)': 'Ring End Gap (Sto&szlig;spiel)',
    'Kolbenringnut (Ring Groove)': 'Ring Groove (Kolbenringnut)',
    'Ringsteg / Feuersteg (Ring Land)': 'Ring Land (Ringsteg / Feuersteg)',
    'Ringsto&szlig;versatz (Ring Clocking)': 'Ring Clocking (Ringsto&szlig;versatz)',
    'Zylinderkopf (Cylinder Head)': 'Cylinder Head (Zylinderkopf)',
    'Einlasskanal (Intake Port)': 'Intake Port (Einlasskanal)',
    'Auslasskanal (Exhaust Port)': 'Exhaust Port (Auslasskanal)',
    'Kanalvolumen (Port Volume)': 'Port Volume (Kanalvolumen)',
    'Ventil (Valve)': 'Valve (Ventil)',
    'Einlassventil (Intake Valve)': 'Intake Valve (Einlassventil)',
    'Auslassventil (Exhaust Valve)': 'Exhaust Valve (Auslassventil)',
    'Ventilschaft (Valve Stem)': 'Valve Stem (Ventilschaft)',
    'Ventilteller (Valve Face)': 'Valve Face (Ventilteller)',
    'Ventilsitz (Valve Seat)': 'Valve Seat (Ventilsitz)',
    'Ventilf&uuml;hrung (Valve Guide)': 'Valve Guide (Ventilf&uuml;hrung)',
    'Ventilfeder (Valve Spring)': 'Valve Spring (Ventilfeder)',
    'Einbauh&ouml;he (Installed Spring Height)': 'Installed Spring Height (Einbauh&ouml;he)',
    'Sitzdruck (Seat Pressure)': 'Seat Pressure (Sitzdruck)',
    '&Ouml;ffnungskraft (Open Pressure)': 'Open Pressure (&Ouml;ffnungskraft)',
    'Blockl&auml;nge (Coil Bind)': 'Coil Bind (Blockl&auml;nge)',
    'Federteller (Retainer)': 'Retainer (Federteller)',
    'Ventilkeile (Valve Locks / Keepers)': 'Valve Locks / Keepers (Ventilkeile)',
    'Retainer-to-Seal Clearance': 'Retainer-to-Seal Clearance',
    'Ventilflattern (Valve Float)': 'Valve Float (Ventilflattern)',
    'Nockenwelle (Camshaft)': 'Camshaft (Nockenwelle)',
    'Nocken (Cam Lobe)': 'Cam Lobe (Nocken)',
    'Grundkreis (Base Circle)': 'Base Circle (Grundkreis)',
    'Nockenhub (Lobe Lift / Cam Lift)': 'Lobe Lift / Cam Lift (Nockenhub)',
    'Ventilhub (Valve Lift)': 'Valve Lift (Ventilhub)',
    'Kipphebel&uuml;bersetzung (Rocker Ratio)': 'Rocker Ratio (Kipphebel&uuml;bersetzung)',
    '&Ouml;ffnungsdauer (Duration)': 'Duration (&Ouml;ffnungsdauer)',
    'Duration @ 0.050&quot;': 'Duration @ 0.050&quot;',
    'LSA &ndash; Lobe Separation Angle (Spreizbogen)': 'LSA &ndash; Lobe Separation Angle',
    'Camshaft Centerline (Einbauwinkel)': 'Camshaft Centerline',
    'Vorverstellung / Fr&uuml;hverstellung (Cam Advance)': 'Cam Advance (Vorverstellung)',
    'Sp&auml;tverstellung (Cam Retard)': 'Cam Retard (Sp&auml;tverstellung)',
    'Nockenwelle einmessen (Degreeing the Cam)': 'Degreeing the Cam (Nockenwelle einmessen)',
    'Steuertrieb (Timing Set)': 'Timing Set (Steuertrieb)',
    'Steuerkette (Timing Chain)': 'Timing Chain (Steuerkette)',
    'Kurbelwellenrad (Crank Gear / Sprocket)': 'Crank Gear / Sprocket (Kurbelwellenrad)',
    'Nockenwellenrad (Cam Gear / Sprocket)': 'Cam Gear / Sprocket (Nockenwellenrad)',
    'Steuermarke (Timing Mark)': 'Timing Mark (Steuermarke)',
    'Hydraulischer Rollenst&ouml;&szlig;el (Hydraulic Roller Lifter)': 'Hydraulic Roller Lifter (Hyd. Rollenst&ouml;&szlig;el)',
    'Laufrolle (Roller Wheel)': 'Roller Wheel (Laufrolle)',
    'Hydraulikkolben (Plunger)': 'Plunger (Hydraulikkolben)',
    'Vorspannma&szlig; (Plunger Preload)': 'Plunger Preload (Vorspannma&szlig;)',
    'St&ouml;&szlig;elk&ouml;rper (Lifter Body)': 'Lifter Body (St&ouml;&szlig;elk&ouml;rper)',
    'St&ouml;&szlig;elbohrung (Lifter Bore)': 'Lifter Bore (St&ouml;&szlig;elbohrung)',
    'St&ouml;&szlig;elf&uuml;hrung / Spider (Lifter Retainer)': 'Lifter Retainer (St&ouml;&szlig;elf&uuml;hrung / Spider)',
    'Sto&szlig;stange (Pushrod)': 'Pushrod (Sto&szlig;stange)',
    'Checking Pushrod (Mess-Pushrod)': 'Checking Pushrod',
    'Pushrod-L&auml;nge (Pushrod Length)': 'Pushrod Length (Pushrod-L&auml;nge)',
    'Kipphebel (Rocker Arm)': 'Rocker Arm (Kipphebel)',
    'Kipphebel-Druckst&uuml;ck (Rocker Tip)': 'Rocker Tip (Kipphebel-Druckst&uuml;ck)',
    'Laufspur (Sweep Pattern)': 'Sweep Pattern (Laufspur)',
    'Ventiltrieb-Geometrie (Valve Train Geometry)': 'Valve Train Geometry (Ventiltrieb-Geometrie)',
    'Ventilspiel (Valve Lash)': 'Valve Lash (Ventilspiel)',
    'E&Ouml; &ndash; Einlass &ouml;ffnet (IO &ndash; Intake Opening)': 'IO &ndash; Intake Opening (E&Ouml; &ndash; Einlass &ouml;ffnet)',
    'ES &ndash; Einlass schlie&szlig;t (IC &ndash; Intake Closing)': 'IC &ndash; Intake Closing (ES &ndash; Einlass schlie&szlig;t)',
    'A&Ouml; &ndash; Auslass &ouml;ffnet (EO &ndash; Exhaust Opening)': 'EO &ndash; Exhaust Opening (A&Ouml; &ndash; Auslass &ouml;ffnet)',
    'AS &ndash; Auslass schlie&szlig;t (EC &ndash; Exhaust Closing)': 'EC &ndash; Exhaust Closing (AS &ndash; Auslass schlie&szlig;t)',
    'Ventil&uuml;berschneidung (Valve Overlap)': 'Valve Overlap (Ventil&uuml;berschneidung)',
    '&Ouml;lpumpe (Oil Pump)': 'Oil Pump (&Ouml;lpumpe)',
    '&Ouml;lansaugrohr (Oil Pickup)': 'Oil Pickup (&Ouml;lansaugrohr)',
    'Pickup-to-Pan Clearance': 'Pickup-to-Pan Clearance',
    '&Ouml;lwanne (Oil Pan / Sump)': 'Oil Pan / Sump (&Ouml;lwanne)',
    'Schwallblech (Baffle)': 'Baffle (Schwallblech)',
    'Windage Tray (&Ouml;l-Abweisblech)': 'Windage Tray',
    '&Ouml;ldruck (Oil Pressure)': 'Oil Pressure (&Ouml;ldruck)',
    'Hochf&ouml;rder-&Ouml;lpumpe (High Volume Oil Pump)': 'High Volume Oil Pump (Hochf&ouml;rder-&Ouml;lpumpe)',
    'Druckbegrenzungsventil (Pressure Relief Valve)': 'Pressure Relief Valve (Druckbegrenzungsventil)',
    'Spiel / Abstand (Clearance)': 'Clearance (Spiel / Abstand)',
    'Toleranz (Tolerance)': 'Tolerance (Toleranz)',
    'Kollision / Interference': 'Interference (Kollision)',
    'Rundlaufabweichung (Runout)': 'Runout (Rundlaufabweichung)',
    'Axialspiel (Endplay)': 'Endplay (Axialspiel)',
    'Flankenspiel (Backlash)': 'Backlash (Flankenspiel)',
    'Messuhr (Dial Indicator)': 'Dial Indicator (Messuhr)',
    'F&uuml;hlerlehre (Feeler Gauge)': 'Feeler Gauge (F&uuml;hlerlehre)',
    'B&uuml;gelmessschraube / Mikrometer (Micrometer)': 'Micrometer (B&uuml;gelmessschraube)',
    'Innenmessger&auml;t (Bore Gauge)': 'Bore Gauge (Innenmessger&auml;t)',
    'Plastigage': 'Plastigage',
    'Anzugsmoment (Torque)': 'Torque (Anzugsmoment)',
    'Anzugsreihenfolge (Torque Sequence)': 'Torque Sequence (Anzugsreihenfolge)',
    'Drehwinkelanzug (Torque Angle)': 'Torque Angle (Drehwinkelanzug)',
    'Schraubensicherung (Threadlocker)': 'Threadlocker (Schraubensicherung)',
    'Montagepaste (Assembly Lubricant)': 'Assembly Lubricant (Montagepaste)',
    'Blueprinting': 'Blueprinting',
    'Kolbenposition bei OT': 'Piston Position at TDC',
    'Verdichtungsverh&auml;ltnis &ndash; Berechnung (CR Calculation)': 'Compression Ratio &ndash; Calculation (Verdichtungsverh&auml;ltnis)',
    'Ventiltrieb-Geometrie &ndash; Pushrod-L&auml;nge (Valve Train Geometry)': 'Valve Train Geometry &ndash; Pushrod Length (Ventiltrieb-Geometrie)',
    'Ventil-Kolben-Freigang (Piston-to-Valve Clearance)': 'Piston-to-Valve Clearance (Ventil-Kolben-Freigang)',
    'Ventilfedern &ndash; Pr&uuml;fung (Valve Springs Inspection)': 'Valve Springs &ndash; Inspection (Ventilfedern)',
}


def add_data_attrs(content):
    """Add data-de and data-en attributes to every glossary-term div."""
    changes = 0
    for de_term, en_term in TERM_MAP.items():
        # Match: <div class="glossary-term">DE_TERM</div>
        old = f'<div class="glossary-term">{de_term}</div>'
        new = f'<div class="glossary-term" data-de="{de_term}" data-en="{en_term}">{de_term}</div>'
        if old in content:
            content = content.replace(old, new)
            changes += 1
    return content, changes


def add_toggle_button(content):
    """Add the DE/EN toggle button to the glossary search row."""
    # Insert toggle button after glossaryCount span
    old_marker = '<span class="glossary-count" id="glossaryCount"></span>'
    toggle_html = '''<span class="glossary-count" id="glossaryCount"></span>
            <button class="glossary-lang-toggle" id="glossaryLangBtn" onclick="switchGlossaryLang()" title="Sprache umschalten">DE</button>'''
    
    if old_marker in content and 'glossaryLangBtn' not in content:
        content = content.replace(old_marker, toggle_html)
        return content, True
    return content, False


def add_toggle_css(content):
    """Add CSS for the language toggle button."""
    css = '''
        .glossary-lang-toggle {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.4);
            color: #fff;
            font-weight: 700;
            font-size: 0.72rem;
            padding: 0.15rem 0.45rem;
            border-radius: 4px;
            cursor: pointer;
            min-width: 32px;
            text-align: center;
            transition: all 0.2s;
            letter-spacing: 0.5px;
        }
        .glossary-lang-toggle:hover { background: rgba(255,255,255,0.3); }
        .glossary-lang-toggle.en { background: #2d5aa0; border-color: #4a90d9; }'''
    
    # Insert before .glossary-body CSS
    marker = '.glossary-body {'
    if marker in content and 'glossary-lang-toggle' not in content:
        content = content.replace(marker, css + '\n        ' + marker)
        return content, True
    return content, False


def add_toggle_js(content):
    """Add the switchGlossaryLang() function and update related functions."""
    js_func = '''
    var glossaryLang = 'de';
    function switchGlossaryLang() {
        glossaryLang = glossaryLang === 'de' ? 'en' : 'de';
        var btn = document.getElementById('glossaryLangBtn');
        if (btn) {
            btn.textContent = glossaryLang.toUpperCase();
            btn.classList.toggle('en', glossaryLang === 'en');
        }
        document.querySelectorAll('#glossaryBody .glossary-term[data-de]').forEach(function(el) {
            el.innerHTML = el.getAttribute('data-' + glossaryLang);
        });
        // Update count label
        var countEl = document.getElementById('glossaryCount');
        if (countEl) {
            var n = countEl.textContent.match(/\\d+/);
            if (n) countEl.textContent = n[0] + (glossaryLang === 'de' ? ' Begriffe' : ' terms');
        }
        // Re-apply search highlight if active
        var q = (document.getElementById('glossarySearch').value || '').trim();
        if (q) filterGlossary();
    }'''
    
    # Insert before filterGlossary function
    marker = '    function filterGlossary() {'
    if marker in content and 'switchGlossaryLang' not in content:
        content = content.replace(marker, js_func + '\n' + marker)
        return content, True
    return content, False


def update_count_label(content):
    """Update glossaryCount and updateGlossaryCount to respect language."""
    # In filterGlossary: change the count text to be language-aware
    old_count = "document.getElementById('glossaryCount').textContent = visible + ' Begriffe';"
    new_count = "document.getElementById('glossaryCount').textContent = visible + (glossaryLang === 'de' ? ' Begriffe' : ' terms');"
    content = content.replace(old_count, new_count)
    
    old_count2 = "document.getElementById('glossaryCount').textContent = total + ' Begriffe';"
    new_count2 = "document.getElementById('glossaryCount').textContent = total + (typeof glossaryLang !== 'undefined' && glossaryLang === 'en' ? ' terms' : ' Begriffe');"
    content = content.replace(old_count2, new_count2)
    
    return content


def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Add data-de/data-en attributes to terms
    content, attr_count = add_data_attrs(content)
    
    # 2. Add toggle button
    content, btn_added = add_toggle_button(content)
    
    # 3. Add CSS
    content, css_added = add_toggle_css(content)
    
    # 4. Add JS function
    content, js_added = add_toggle_js(content)
    
    # 5. Update count labels
    content = update_count_label(content)
    
    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  {filename}: {attr_count} data-Attribute, Button={btn_added}, CSS={css_added}, JS={js_added}')
    else:
        print(f'  {filename}: keine Aenderungen')


if __name__ == '__main__':
    for fn in ['index.html', 'specs.html', 'build-log.html']:
        process_file(fn)
    print('\nFertig.')
