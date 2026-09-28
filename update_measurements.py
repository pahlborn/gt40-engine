"""
Systematisch alle Mess-relevanten Glossar-Eintraege um Messanleitungen erweitern
und fehlende Build-Log Procedures ergaenzen.
"""
import re

# ============================================================
# GLOSSAR UPDATES (index.html) - Messanleitungen
# ============================================================

glossary_updates = {
    # Key: exact glossary-term text (as it appears in HTML)
    # Value: new fields to ADD (inserted before </div>\n</div> closing)

    "Main Bearing Clearance &ndash; Hauptlagerspiel": {
        "replace": [
            ("Was ist das?", "Was ist das?</span> Das Spiel zwischen Hauptlagerzapfen und Lagerschale. Bestimmt den &Ouml;lfilm und damit Schmierung und Lebensdauer."),
        ],
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.0015&quot;&ndash;0.0025&quot; (0.038&ndash;0.064 mm). Ford 302: 0.0005&quot;&ndash;0.0024&quot;.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Lagerschalen einlegen (trocken, kein &Ouml;l). 2. Plastigage-Streifen quer auf den Zapfen legen. 3. Lagerdeckel mit Sollmoment anziehen (ohne Kurbelwelle zu drehen!). 4. Deckel abnehmen, Plastigage-Breite mit Skala auf der Verpackung ablesen. 5. Breiter = weniger Spiel, schmaler = mehr Spiel. 6. Alle 5 Hauptlager einzeln messen.</div>',
        ]
    },

    "Rod Bearing Clearance &ndash; Pleuellagerspiel": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.001&quot;&ndash;0.003&quot; (0.025&ndash;0.076 mm). Ford 302: 0.0006&quot;&ndash;0.0026&quot;.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Lagerschalen in Pleuel und Deckel einlegen (trocken). 2. Plastigage-Streifen quer auf den Hubzapfen legen. 3. Pleueldeckel mit Sollmoment anziehen (Kurbel nicht drehen!). 4. Deckel abnehmen, Plastigage-Breite ablesen. 5. Alle 8 Pleuel einzeln messen. 6. Bei Abweichung: andere Lagerschalen-Gr&ouml;&szlig;e w&auml;hlen (Standard, 0.001&quot; OS, 0.010&quot; OS).</div>',
        ]
    },

    "Crankshaft Endplay &ndash; Kurbelwellen-Axialspiel": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.004&quot;&ndash;0.008&quot; (0.10&ndash;0.20 mm). Ford 302: 0.004&quot;&ndash;0.008&quot;.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Kurbelwelle mit allen Hauptlagern eingebaut. 2. Messuhr (Dial Indicator) an der Stirnseite der Kurbelwelle ansetzen. 3. Kurbelwelle mit Schraubendreher nach hinten dr&uuml;cken, Messuhr auf Null. 4. Kurbelwelle nach vorne dr&uuml;cken, Messuhr ablesen = Endplay. 5. Alternativ: F&uuml;hlerlehre zwischen Thrust-Bearing-Flanke und Kurbelwangen-Anlauffl&auml;che messen.</div>',
        ]
    },

    "Ring End Gap &ndash; Kolbenringsto&szlig;": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Top Ring: 0.016&quot;&ndash;0.022&quot; (0.41&ndash;0.56 mm). 2nd Ring: 0.010&quot;&ndash;0.020&quot; (0.25&ndash;0.51 mm). &Ouml;lring: herstellerabh&auml;ngig.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ring in die Zylinderbohrung schieben (ohne Kolben). 2. Mit umgedrehtem Kolben den Ring ca. 1&quot; in die Bohrung dr&uuml;cken (damit er gerade sitzt). 3. F&uuml;hlerlehre in den Ringsto&szlig; (Gap) einf&uuml;hren. 4. Zu eng: Ring vorsichtig mit Diamantfeile am Sto&szlig; abfeilen. 5. Jeden Ring in seinem Zylinder messen (Bohrungen k&ouml;nnen leicht variieren).</div>',
        ]
    },

    "Coil Bind &ndash; Federblock": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ventilfeder auf Pr&uuml;fstand spannen oder: Eingebaute Feder mit Messschieber messen. 2. Installierte L&auml;nge (Installed Height) minus Ventilhub (Valve Lift) = L&auml;nge bei maximalem Hub. 3. Coil-Bind-H&ouml;he: Alle Windungen aufeinander gepresst (aus Herstellerangabe). 4. Clearance = L&auml;nge bei max. Hub &minus; Coil-Bind-H&ouml;he. 5. Mindestens 0.060&quot; (1.52 mm) Sicherheitsabstand halten.</div>',
        ]
    },

    "Piston-to-Wall Clearance &ndash; Kolben-Zylinder-Spiel": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.003&quot;&ndash;0.005&quot; (0.08&ndash;0.13 mm) f&uuml;r geschmiedete Kolben. Gusskolben: 0.001&quot;&ndash;0.002&quot;.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Zylinderbohrung mit Innenmessschraube (Bore Gauge) oder Telescoping Gauge + Mikrometerschraube messen. 2. Kolbendurchmesser am Schaft (Skirt) rechtwinklig zum Kolbenbolzen messen (an der breitesten Stelle). 3. Bohrung minus Kolben = Clearance. 4. Jede Bohrung oben, mitte, unten messen (Konizit&auml;t) und in 90&deg; versetzt (Ovalit&auml;t).</div>',
        ]
    },

    "Piston-to-Valve Clearance &ndash; Kolben-Ventil-Abstand": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Einlass: &ge; 0.080&quot; (2.0 mm). Auslass: &ge; 0.100&quot; (2.5 mm). Mehr ist sicherer.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Motor komplett zusammengebaut (K&ouml;pfe, Ventile, Federn, Kipphebel, St&ouml;&szlig;elstangen). 2. Modelliermasse (Knetmasse / Clay) auf die Ventiltaschen im Kolben dr&uuml;cken. 3. Kurbelwelle 2 volle Umdrehungen drehen. 4. Kopf abnehmen, Knetmasse vorsichtig mit Messschieber messen. 5. D&uuml;nnste Stelle = PTV-Clearance. 6. Immer Einlass UND Auslass pr&uuml;fen.</div>',
        ]
    },

    "Retainer-to-Seal Clearance": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Mindestens 0.050&quot; (1.27 mm) bei maximalem Hub.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ventil bei maximalem Hub (oder mit bekanntem Shim unter dem Federteller). 2. Abstand zwischen Unterseite des Federtellers (Retainer) und Oberkante der Ventilschaftdichtung (Valve Seal) messen. 3. Methode: F&uuml;hlerlehre oder Plastigage zwischen Retainer und Seal. 4. Zu wenig Clearance zerst&ouml;rt die Dichtung beim Betrieb.</div>',
        ]
    },

    "Installed Spring Height &ndash; Ventilfeder-Einbauh&ouml;he": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ventilfeder, Retainer und Keile einbauen. 2. Messschieber zwischen Federsitz (Spring Pad am Kopf) und Unterseite des Federtellers (Retainer) ansetzen. 3. Abstand ablesen = Installed Height. 4. Herstellervorgabe vergleichen. 5. Bei zu gro&szlig;er H&ouml;he: Shims (Unterlegscheiben) unter die Feder legen. 6. Alle 16 Ventile pr&uuml;fen.</div>',
        ]
    },

    "Quench Distance &ndash; Quetschabstand": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.035&quot;&ndash;0.045&quot; (0.89&ndash;1.14 mm) ideal. Unter 0.035&quot;: Klopfgefahr. &Uuml;ber 0.050&quot;: Quench-Effekt geht verloren.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie berechnen?</span> Quench Distance = Piston-to-Deck Clearance + komprimierte Kopfdichtungsdicke (Compressed Gasket Thickness). Beispiel: 0.010&quot; Deck Clearance + 0.039&quot; Dichtung = 0.049&quot; Quench.</div>',
        ]
    },

    "Runout &ndash; Rundlaufabweichung": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Teil in V-Block oder Prismen legen (bzw. eingebaut lassen). 2. Messuhr (Dial Indicator) am zu pr&uuml;fenden Punkt ansetzen und auf Null stellen. 3. Teil eine volle Umdrehung drehen. 4. Gesamtausschlag (TIR &ndash; Total Indicator Reading) ablesen. 5. Typische Anwendungen: Kurbelwelle (max. 0.001&quot;), Schwungrad-Planfl&auml;che, Nockenwelle.</div>',
        ]
    },

    "Pickup-to-Pan Clearance": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 1/4&quot;&ndash;3/8&quot; (6&ndash;10 mm) Abstand zwischen &Ouml;l-Pickup und Wannenboden.</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Pickup in &Ouml;lpumpe einbauen, Pumpe am Block befestigen. 2. Modelliermasse (Knetmasse) auf die Unterseite des Pickup-Siebs dr&uuml;cken. 3. &Ouml;lwanne montieren und mit ein paar Schrauben fixieren. 4. Wanne wieder abnehmen, Knetmasse mit Messschieber messen. 5. D&uuml;nnste Stelle = Clearance. Zu nah: Pickup k&ouml;nnte auf dem Boden aufsetzen.</div>',
        ]
    },

    "Degreeing the Cam &ndash; Nockenwelle einmessen": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Gradscheibe (Degree Wheel) an der Kurbelwelle befestigen. 2. Zeiger (Pointer) am Block fixieren. 3. OT exakt finden (Positive-Stop-Methode). 4. Messuhr auf den Einlass-Lifter von Zylinder 1 setzen. 5. Kurbel drehen bis Einlassventil auf maximalen Hub steht. 6. Intake Centerline Wert auf Gradscheibe ablesen. 7. Mit Hersteller-Angabe vergleichen. 8. Abweichung: Verstellbares Nockenwellenrad (Adjustable Timing Set) nutzen.</div>',
        ]
    },

    "Camshaft Centerline &ndash; Nocken-Mittellinie": {
        "add": [
            '<div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Intake Centerline 106&deg;&ndash;110&deg; ATDC (je nach Nockenwelle).</div>',
            '<div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> Siehe &quot;Degreeing the Cam&quot;. Die Intake Centerline ist der Kurbelwinkel (in Grad nach OT), bei dem das Einlassventil den maximalen Hub erreicht.</div>',
        ]
    },
}

def update_glossary(html, updates):
    for term, changes in updates.items():
        # Find the glossary entry
        # escape HTML entities in search
        pattern = re.escape(term)
        match = re.search(r'(<div class="glossary-entry"[^>]*>\s*<div class="glossary-term">' + pattern + r'</div>)(.*?)(</div>\s*</div>)', html, re.DOTALL)
        if not match:
            print(f'  NICHT GEFUNDEN: {term[:50]}')
            continue

        entry_content = match.group(2)

        # Check if already has Wie messen
        if 'Wie messen' in entry_content or 'Wie berechnen' in entry_content or 'Wie pr' in entry_content:
            print(f'  BEREITS VORHANDEN: {term[:50]}')
            continue

        # Add new fields before closing </div></div>
        if 'add' in changes:
            new_fields = '\n                '.join(changes['add'])
            # Insert before the last </div> of the entry
            old = match.group(0)
            # Find the related div or last field div
            insert_before = match.group(3)  # </div>\s*</div>
            new = old.replace(insert_before, '\n                ' + new_fields + '\n            ' + insert_before, 1)
            html = html.replace(old, new, 1)
            print(f'  ERGAENZT: {term[:50]}')

    return html

# Process index.html
print('=== index.html ===')
html = open('index.html', encoding='utf-8').read()
html = update_glossary(html, glossary_updates)
open('index.html', 'w', encoding='utf-8').write(html)

# Process specs.html
print('\n=== specs.html ===')
html = open('specs.html', encoding='utf-8').read()
html = update_glossary(html, glossary_updates)
open('specs.html', 'w', encoding='utf-8').write(html)

# Process build-log.html
print('\n=== build-log.html ===')
html = open('build-log.html', encoding='utf-8').read()
html = update_glossary(html, glossary_updates)
open('build-log.html', 'w', encoding='utf-8').write(html)

print('\nDone!')
