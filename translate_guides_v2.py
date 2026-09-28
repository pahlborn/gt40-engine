#!/usr/bin/env python3
"""
v2: Comprehensive guide translation for build-log.html
Strategy: For each <li> in guide sections, add dual-language spans.
- Lines already in German get an EN span added
- Lines in English get a DE span added
- Lines that are bilingual (EN with DE in parens) get split
Uses a comprehensive translation dictionary for both directions.
"""
import re
import html as htmlmod

# ============================================================
# EN -> DE translations (for English-only lines)
# ============================================================
EN_TO_DE = {
    # ---- PHASE 1 ----
    # Step 1: Block Visual Inspection
    'Lift short block from crate (2 persons, ~155 lbs / 70 kg)':
        'Short Block aus Kiste heben (2 Personen, ~70 kg)',
    'Mount on engine stand (adapter for 302/351W pattern)':
        'Auf Motorstaender montieren (Adapter fuer 302/351W-Muster)',
    'Remove preservation / shipping oil':
        'Konservierungs-/Versandoel entfernen',
    'Work light / LED inspection lamp':
        'Arbeitsleuchte / LED-Inspektionslampe',
    'Inspection mirror (dental or telescoping)':
        'Inspektionsspiegel (Dental- oder Teleskopspiegel)',
    'Deck surface both banks':
        'Deckflaeche beide Baenke',
    'ID plate / casting number':
        'ID-Plakette / Gussnummer',
    'Any anomalies (casting flaws, scratches)':
        'Auffaelligkeiten (Gussfehler, Kratzer)',

    # Step 2: Chase Threads
    'Compressed air gun with extension':
        'Druckluftpistole mit Verlaengerung',
    'Safety glasses (mandatory!)':
        'Schutzbrille (Pflicht!)',
    'T-handle tap wrench':
        'T-Griff-Windeisen',
    'Clean lint-free rags':
        'Saubere fusselfreie Tuecher',
    'All holes free of chips and residue':
        'Alle Bohrungen frei von Spaenen und Rueckstaenden',
    'Tap runs freely in every hole':
        'Gewindebohrer laeuft in jeder Bohrung frei',

    # Step 5: Rotate Crank
    'Crankshaft installed in block':
        'Kurbelwelle im Block eingebaut',
    'All main caps torqued to spec':
        'Alle Hauptlagerdeckel auf Drehmoment angezogen',
    'Assembly lube on all bearing surfaces':
        'Montagepaste auf allen Lagerflaechen',
    'Crankshaft turns smoothly through full 720&deg;':
        'Kurbelwelle dreht gleichmaessig ueber volle 720&deg;',
    'No sudden resistance or binding':
        'Keine ploetzliche Widerstandsaenderung oder Klemmen',
    'No noises (scraping, clicking)':
        'Keine Geraeusche (Schleifen, Klicken)',
    'Turn at flywheel end by hand (more leverage)':
        'Am Schwungrad-Ende von Hand drehen (mehr Hebel)',
    'Binding = bearing issue or debris in oil gallery':
        'Klemmen = Lagerproblem oder Fremdkoerper im Oelkanal',

    # Step 7: Cam Bearing Type
    'Visual inspection only':
        'Nur Sichtpruefung',

    # Step 8: Main Bearing Clearance
    'Lower bearing shells into main caps (tab in notch, <strong>NO oil</strong> on bearing surface)':
        'Untere Lagerschalen in Hauptlagerdeckel einlegen (Nase in Nut, <strong>KEIN Oel</strong> auf Lagerflaeche)',
    'Upper shells into block saddles':
        'Obere Schalen in Blocksattel einlegen',
    'Crankshaft onto upper shells':
        'Kurbelwelle auf obere Schalen auflegen',
    'Record value, remove all Plastigage residue':
        'Wert notieren, alle Plastigage-Rueckstaende entfernen',
    'Repeat for all 5 main bearings':
        'Fuer alle 5 Hauptlager wiederholen',

    # Step 9: Crankshaft Endplay
    'Mount dial indicator axially against crank snout or flywheel flange':
        'Messuhr axial an Kurbelwellenstumpf oder Schwungradflansch montieren',
    'Push crank fully forward, zero the gauge':
        'Kurbelwelle ganz nach vorne druecken, Messuhr auf Null stellen',
    'Push crank fully rearward, read value':
        'Kurbelwelle ganz nach hinten druecken, Wert ablesen',
    'That reading = crankshaft endplay':
        'Dieser Wert = Kurbelwellen-Axialspiel',

    # Step 10: Cam Visual
    'Cam card included? (Intake Centerline for degreeing)':
        'Cam-Card dabei? (Intake Centerline fuer Degreeing)',

    # Step 12: Lifters
    'Count: 16 pcs':
        'Anzahl: 16 Stueck',
    'Rollers spin freely (check each one individually)':
        'Rollen drehen frei (jede einzeln pruefen)',
    'Link-bar mechanism functions correctly':
        'Link-Bar-Mechanismus funktioniert einwandfrei',
    'Establish numbering system (1E, 1A, 2E, 2A... = cylinder + intake/exhaust)':
        'Nummerierungssystem festlegen (1E, 1A, 2E, 2A... = Zylinder + Einlass/Auslass)',

    # Step 13: Rockers
    '16 pcs, trunnion (pivot pin) with no axial play':
        '16 Stueck, Drehpunkt (Achsbolzen) ohne Axialspiel',
    'Roller tip spins freely':
        'Rollenspitze dreht frei',
    'Ratio 1.6:1 confirmed on packaging':
        'Uebersetzung 1,6:1 auf Verpackung bestaetigt',
    'Ultra Pro Magnum = steel body &ndash; significantly stronger than aluminum rockers':
        'Ultra Pro Magnum = Stahlkoerper &ndash; deutlich staerker als Aluminium-Kipphebel',
    'Fulcrum design &ndash; no separate fulcrum bolt required':
        'Kipphebel-Design &ndash; keine separate Befestigungsschraube noetig',

    # Step 14: Polylocks
    'Polylocks replace standard adjusting nuts &ndash; they lock the rocker adjustment permanently':
        'Polylocks ersetzen Standard-Einstellmuttern &ndash; sie fixieren die Kipphebel-Einstellung dauerhaft',
    'Set screw tightens against stud threads to prevent rotation &ndash; critical for maintaining valve preload':
        'Madenschraube klemmt gegen Bolzengewinde um Drehung zu verhindern &ndash; kritisch fuer Ventilvorspannung',
    'Keep 1&ndash;2 spares in toolbox for Phase 3 assembly':
        '1&ndash;2 Ersatz im Werkzeugkasten fuer Phase 3 bereithalten',

    # Step 15: Sealing Surface Flatness
    'Grease/vaseline for sealing':
        'Fett/Vaseline zum Abdichten',
    'Measuring fluid (isopropanol + food coloring)':
        'Messfluessigkeit (Isopropanol + Lebensmittelfarbe)',

    # Step 25: ARP Head Studs
    'Vernier caliper or micrometer':
        'Messschieber oder Mikrometer',
    'ARP spec sheet':
        'ARP-Datenblatt',
    'Measure each stud from base to tip':
        'Jeden Stehbolzen von Basis bis Spitze messen',
    'Compare to ARP published length':
        'Mit ARP-Herstellerangabe vergleichen',
    'Stretched studs = replace immediately':
        'Gelaegte Bolzen = sofort ersetzen',

    # Common phrases
    '~15 min.': '~15 Min.',
    '~20 min.': '~20 Min.',
    '~30 min.': '~30 Min.',
    '~45 min.': '~45 Min.',
    '~60 min.': '~60 Min.',
    '~90 min.': '~90 Min.',
    '~2 hours': '~2 Stunden',
    '~1 hour': '~1 Stunde',
}

# ============================================================
# DE -> EN translations (for German-only lines)
# ============================================================
DE_TO_EN = {
    'Block sauber und frei von Dichtungsresten auf der Deckflaeche.':
        'Block clean and free of gasket residue on the deck surface.',
    'Kurbelwelle, Pleuel und Kolben (ohne Ringe!) einbauen.':
        'Install crankshaft, connecting rods and pistons (without rings!).',
    'Alle 8 Zylinder durchmessen &ndash; Zyl. 1 + 5 zuerst (zeigt Block-Praezision).':
        'Measure all 8 cylinders &ndash; Cyl. 1 + 5 first (shows block precision).',
}


def is_german_text(text):
    """Detect if text is primarily German (not perfect, heuristic)."""
    decoded = htmlmod.unescape(text)
    # Remove HTML tags for analysis
    clean = re.sub(r'<[^>]+>', '', decoded)

    # Check for German umlauts/eszett
    if re.search(r'[äöüÄÖÜß]', clean):
        return True

    # Check for common German words (without umlauts)
    german_words = [
        'und', 'auf', 'der', 'die', 'das', 'den', 'dem', 'ein', 'eine',
        'ist', 'mit', 'von', 'zu', 'nicht', 'werden', 'alle', 'nach',
        'vor', 'bei', 'muss', 'kann', 'messen', 'Wert', 'Messung',
        'Block', 'Kolben', 'Kurbelwelle', 'Nockenwelle', 'Ventil',
        'Zylinder', 'Bohrung', 'montieren', 'einbauen', 'Drehmoment',
        'Mindestens', 'Stellen', 'Abweichung', 'dokumentieren',
        'Stopfen', 'Gewinde', 'reinigen', 'anziehen', 'ablesen',
        'Alternativ', 'Hersteller', 'Angabe', 'erneut', 'drehen',
        'Jeden', 'jeder', 'Seite', 'zwischen', 'Schritt',
        'Wichtigste', 'bestimmt', 'zeigt', 'dabei', 'immer',
    ]
    words_in_text = clean.split()
    german_count = sum(1 for w in words_in_text if w.strip('.,;:!?()') in german_words)
    return german_count >= 2


def process_file(filepath):
    """Add dual-language spans to guide <li> elements."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    in_guide = False
    guide_depth = 0
    translated = 0
    already_done = 0
    untouched = 0

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
                already_done += 1
                continue

            # Match <li>...</li> on single line
            m = re.match(r'^(\s*<li>)(.*?)(</li>\s*)$', line)
            if not m:
                continue

            prefix, inner, suffix = m.groups()
            inner = inner.strip()

            # Skip empty
            if not inner:
                continue

            # Check if we have a translation
            de_text = EN_TO_DE.get(inner)
            if de_text:
                # English line with known DE translation
                lines[i] = f'{prefix}<span class="de">{de_text}</span><span class="en">{inner}</span>{suffix}'
                translated += 1
                continue

            en_text = DE_TO_EN.get(inner)
            if en_text:
                # German line with known EN translation
                lines[i] = f'{prefix}<span class="de">{inner}</span><span class="en">{en_text}</span>{suffix}'
                translated += 1
                continue

            # Check if text is German (keep as-is for now, but mark)
            if is_german_text(inner):
                # Already German - keep DE span, no EN translation yet
                # We'll mark it so CSS can show/hide properly
                untouched += 1
                continue

            # English text without translation - leave as-is
            untouched += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'Translated: {translated}')
    print(f'Already done: {already_done}')
    print(f'Untouched: {untouched}')


if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else 'build-log.html'
    print(f'Processing {path}...')
    process_file(path)
