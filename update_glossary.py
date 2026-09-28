# -*- coding: utf-8 -*-
"""
Glossar-Update: Fachbegriffe DE/EN mit Wikipedia-Links und Normen.
Aktualisiert die glossary-term Zeilen auf allen 3 Seiten.

Format DE: Deutscher Fachbegriff (English Term)
Format EN: English Term (Deutscher Fachbegriff)
"""

import re
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================================
# MAPPING: old_term -> (new_de_term, new_en_term, data_search_update, wiki_de, wiki_en)
# ============================================================
GLOSSARY_MAP = {
    # --- GRUNDBEGRIFFE ---
    'Bore &ndash; Zylinderbohrung': {
        'de': 'Zylinderbohrung (Bore)',
        'en': 'Bore (Zylinderbohrung)',
        'search': 'bore zylinderbohrung innendurchmesser zylinder kolben hubraum',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderbohrung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Bore_(engine)',
    },
    'Stroke &ndash; Kolbenhub': {
        'de': 'Hub (Stroke)',
        'en': 'Stroke (Hub)',
        'search': 'stroke hub kolbenhub weg kolben ot ut hubraum',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hub_(Mechanik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Stroke_(engine)',
    },
    'Displacement &ndash; Hubraum': {
        'de': 'Hubraum (Displacement)',
        'en': 'Displacement (Hubraum)',
        'search': 'displacement hubraum volumen kolben verdraengt',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hubraum',
        'wiki_en': 'https://en.wikipedia.org/wiki/Engine_displacement',
    },
    'BHP &ndash; Brake Horsepower': {
        'de': 'BHP &ndash; Brake Horsepower (Bremsleistung)',
        'en': 'BHP &ndash; Brake Horsepower',
        'search': 'bhp brake horsepower bremsleistung leistung ps kw din sae',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pferdest%C3%A4rke',
        'wiki_en': 'https://en.wikipedia.org/wiki/Horsepower#Brake_horsepower',
    },
    'TDC &ndash; Top Dead Center (Oberer Totpunkt)': {
        'de': 'OT &ndash; Oberer Totpunkt (TDC)',
        'en': 'TDC &ndash; Top Dead Center (Oberer Totpunkt)',
        'search': 'tdc ot top dead center oberer totpunkt kolben oben',
        'wiki_de': 'https://de.wikipedia.org/wiki/Totpunkt',
        'wiki_en': 'https://en.wikipedia.org/wiki/Dead_centre_(engineering)',
    },
    'BDC &ndash; Bottom Dead Center (Unterer Totpunkt)': {
        'de': 'UT &ndash; Unterer Totpunkt (BDC)',
        'en': 'BDC &ndash; Bottom Dead Center (Unterer Totpunkt)',
        'search': 'bdc ut bottom dead center unterer totpunkt kolben unten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Totpunkt',
        'wiki_en': 'https://en.wikipedia.org/wiki/Dead_centre_(engineering)',
    },

    # --- BLOCK & KURBELTRIEB ---
    'Engine Block &ndash; Motorblock': {
        'de': 'Motorblock (Engine Block)',
        'en': 'Engine Block (Motorblock)',
        'search': 'engine block motorblock zylinderblock kurbelgehaeuse',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorblock',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_block',
    },
    'Deck / Deck Surface &ndash; Blockdeck': {
        'de': 'Dichtfl&auml;che / Deckfl&auml;che (Deck Surface)',
        'en': 'Deck / Deck Surface (Dichtfl&auml;che)',
        'search': 'deck surface blockdeck dichtflaeche deckflaeche zylinderkopf planflaeche',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorblock',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_block',
    },
    'Deck Height &ndash; Deckh&ouml;he': {
        'de': 'Blockh&ouml;he (Deck Height)',
        'en': 'Deck Height (Blockh&ouml;he)',
        'search': 'deck height blockhoehe zylinderblockhoehe kurbelwelle mitte deckflaeche abstand',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorblock',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_block',
    },
    'Piston-to-Deck Clearance &ndash; Kolben-Deck-Abstand': {
        'de': 'Kolbenunterstand (Piston-to-Deck Clearance)',
        'en': 'Piston-to-Deck Clearance (Kolbenunterstand)',
        'search': 'piston-to-deck clearance kolbenunterstand kolbenueberstand deckspiel ot messen messuhr',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Piston Deck Height &ndash; Kolbenposition zum Deck': {
        'de': 'Kolben&uuml;ber-/unterstand (Piston Deck Height)',
        'en': 'Piston Deck Height (Kolben&uuml;ber-/unterstand)',
        'search': 'piston deck height kolbenueberstand kolbenunterstand position ot',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Crankshaft &ndash; Kurbelwelle': {
        'de': 'Kurbelwelle (Crankshaft)',
        'en': 'Crankshaft (Kurbelwelle)',
        'search': 'crankshaft kurbelwelle hauptlager pleuel drehmoment',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kurbelwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Crankshaft',
    },
    'Main Journal &ndash; Hauptlagerzapfen': {
        'de': 'Hauptlagerzapfen (Main Journal)',
        'en': 'Main Journal (Hauptlagerzapfen)',
        'search': 'main journal hauptlagerzapfen kurbelwelle lager',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kurbelwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Crankshaft',
    },
    'Rod Journal &ndash; Pleuellagerzapfen': {
        'de': 'Pleuellagerzapfen (Rod Journal)',
        'en': 'Rod Journal (Pleuellagerzapfen)',
        'search': 'rod journal pleuellagerzapfen hubzapfen kurbelwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kurbelwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Crankshaft',
    },
    'Main Bearing &ndash; Hauptlager': {
        'de': 'Hauptlager (Main Bearing)',
        'en': 'Main Bearing (Hauptlager)',
        'search': 'main bearing hauptlager kurbelwelle lagerschale',
        'wiki_de': 'https://de.wikipedia.org/wiki/Gleitlager',
        'wiki_en': 'https://en.wikipedia.org/wiki/Plain_bearing',
    },
    'Main Bearing Clearance &ndash; Hauptlagerspiel': {
        'de': 'Hauptlagerspiel (Main Bearing Clearance)',
        'en': 'Main Bearing Clearance (Hauptlagerspiel)',
        'search': 'main bearing clearance hauptlagerspiel oelfilm plastigage spiel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Gleitlager',
        'wiki_en': 'https://en.wikipedia.org/wiki/Plain_bearing',
    },
    'Rod Bearing &ndash; Pleuellager': {
        'de': 'Pleuellager (Rod Bearing)',
        'en': 'Rod Bearing (Pleuellager)',
        'search': 'rod bearing pleuellager lagerschale pleuel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pleuel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Connecting_rod',
    },
    'Rod Bearing Clearance &ndash; Pleuellagerspiel': {
        'de': 'Pleuellagerspiel (Rod Bearing Clearance)',
        'en': 'Rod Bearing Clearance (Pleuellagerspiel)',
        'search': 'rod bearing clearance pleuellagerspiel oelfilm spiel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pleuel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Connecting_rod',
    },
    'Crankshaft Endplay &ndash; Kurbelwellen-Axialspiel': {
        'de': 'Axialspiel, Kurbelwelle (Crankshaft Endplay)',
        'en': 'Crankshaft Endplay (Axialspiel)',
        'search': 'crankshaft endplay axialspiel kurbelwelle anlaufscheibe thrust bearing',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kurbelwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Crankshaft',
    },
    'Internal Balance &ndash; Innenauswuchtung': {
        'de': 'Innenauswuchtung (Internal Balance)',
        'en': 'Internal Balance (Innenauswuchtung)',
        'search': 'internal balance innenauswuchtung gegengewichte kurbelwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Auswuchten',
        'wiki_en': 'https://en.wikipedia.org/wiki/Balancing_machine',
    },
    'Zero Balance &ndash; Nullwuchtung': {
        'de': 'Nullwuchtung (Zero Balance)',
        'en': 'Zero Balance (Nullwuchtung)',
        'search': 'zero balance nullwuchtung 302 sbf kurbelwelle gewichte',
        'wiki_de': 'https://de.wikipedia.org/wiki/Auswuchten',
        'wiki_en': 'https://en.wikipedia.org/wiki/Balancing_machine',
    },
    'Harmonic Balancer &ndash; Schwingungsd&auml;mpfer': {
        'de': 'Schwingungsd&auml;mpfer (Harmonic Balancer)',
        'en': 'Harmonic Balancer (Schwingungsd&auml;mpfer)',
        'search': 'harmonic balancer schwingungsdaempfer drehschwingung kurbelwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Drehschwingungsd%C3%A4mpfer',
        'wiki_en': 'https://en.wikipedia.org/wiki/Harmonic_damper',
    },
    'Runout &ndash; Rundlaufabweichung': {
        'de': 'Rundlaufabweichung (Runout)',
        'en': 'Runout (Rundlaufabweichung)',
        'search': 'runout rundlaufabweichung schlag messuhr tir',
        'wiki_de': 'https://de.wikipedia.org/wiki/Rundlaufabweichung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Runout',
    },
    'Blueprinting &ndash; Pr&auml;ziser Motoraufbau': {
        'de': 'Blueprinting',
        'en': 'Blueprinting',
        'search': 'blueprinting praeziser motoraufbau vermessen toleranz optimal',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motortuning',
        'wiki_en': 'https://en.wikipedia.org/wiki/Engine_blueprinting',
    },

    # --- KOLBEN & PLEUEL ---
    'Piston &ndash; Kolben': {
        'de': 'Kolben (Piston)',
        'en': 'Piston (Kolben)',
        'search': 'piston kolben zylinder verbrennung hub',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Connecting Rod &ndash; Pleuel': {
        'de': 'Pleuel (Connecting Rod)',
        'en': 'Connecting Rod (Pleuel)',
        'search': 'connecting rod pleuel pleuelstange kolben kurbelwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pleuel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Connecting_rod',
    },
    'Rod Length &ndash; Pleuel&auml;nge': {
        'de': 'Pleull&auml;nge (Rod Length)',
        'en': 'Rod Length (Pleuell&auml;nge)',
        'search': 'rod length pleuellaenge center-to-center',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pleuel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Connecting_rod',
    },
    'Rod Ratio &ndash; Pleuelverh&auml;ltnis': {
        'de': 'Pleuelverh&auml;ltnis (Rod Ratio)',
        'en': 'Rod Ratio (Pleuelverh&auml;ltnis)',
        'search': 'rod ratio pleuelverhaeltnis laenge hub seitenkraft',
        'wiki_de': 'https://de.wikipedia.org/wiki/Pleuel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Connecting_rod',
    },
    'Piston Dish &ndash; Kolbenmulde': {
        'de': 'Kolbenmulde (Piston Dish)',
        'en': 'Piston Dish (Kolbenmulde)',
        'search': 'piston dish kolbenmulde volumen verdichtung brennraum',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Piston Dome &ndash; Kolbenw&ouml;lbung': {
        'de': 'Kolbenboden, erhaben (Piston Dome)',
        'en': 'Piston Dome (erhabener Kolbenboden)',
        'search': 'piston dome kolbenboden erhaben woelbung verdichtung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Valve Relief &ndash; Ventiltasche': {
        'de': 'Ventiltasche (Valve Relief)',
        'en': 'Valve Relief (Ventiltasche)',
        'search': 'valve relief ventiltasche kolben freimachung ventilfreigang',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Compression Height &ndash; Kompressionsh&ouml;he': {
        'de': 'Kompressionsh&ouml;he (Compression Height)',
        'en': 'Compression Height (Kompressionsh&ouml;he)',
        'search': 'compression height kompressionshoehe kh kolbenbolzen feuersteg kolbenboden',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Piston-to-Wall Clearance &ndash; Kolben-Zylinder-Spiel': {
        'de': 'Einbauspiel (Piston-to-Wall Clearance)',
        'en': 'Piston-to-Wall Clearance (Einbauspiel)',
        'search': 'piston-to-wall clearance einbauspiel kolbenspiel zylinder laufflaeche',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Piston-to-Valve Clearance &ndash; Kolben-Ventil-Abstand': {
        'de': 'Ventil-Kolben-Freigang (Piston-to-Valve Clearance)',
        'en': 'Piston-to-Valve Clearance (Ventil-Kolben-Freigang)',
        'search': 'piston-to-valve clearance ventilfreigang kolben ventil sicherheitsabstand ptv',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Piston-to-Head Clearance &ndash; Kolben-Kopf-Abstand': {
        'de': 'Quetschspaltma&szlig; (Piston-to-Head Clearance)',
        'en': 'Piston-to-Head Clearance (Quetschspaltma&szlig;)',
        'search': 'piston-to-head clearance quetschspalt squish quench kolben kopf abstand',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolben_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Squish_(engine)',
    },

    # --- VERDICHTUNG ---
    'Compression Ratio &ndash; Verdichtungsverh&auml;ltnis': {
        'de': 'Verdichtungsverh&auml;ltnis (Compression Ratio)',
        'en': 'Compression Ratio (Verdichtungsverh&auml;ltnis)',
        'search': 'compression ratio verdichtungsverhaeltnis cr hubraum brennraum',
        'wiki_de': 'https://de.wikipedia.org/wiki/Verdichtungsverh%C3%A4ltnis',
        'wiki_en': 'https://en.wikipedia.org/wiki/Compression_ratio',
    },
    'Static Compression Ratio &ndash; Statisches Verdichtungsverh&auml;ltnis': {
        'de': 'Statisches Verdichtungsverh&auml;ltnis (Static CR)',
        'en': 'Static Compression Ratio (Statische Verdichtung)',
        'search': 'static compression ratio statisch verdichtungsverhaeltnis geometrisch',
        'wiki_de': 'https://de.wikipedia.org/wiki/Verdichtungsverh%C3%A4ltnis',
        'wiki_en': 'https://en.wikipedia.org/wiki/Compression_ratio',
    },
    'Dynamic Compression Ratio &ndash; Dynamisches Verdichtungsverh&auml;ltnis': {
        'de': 'Dynamisches Verdichtungsverh&auml;ltnis (Dynamic CR)',
        'en': 'Dynamic Compression Ratio (Dynamische Verdichtung)',
        'search': 'dynamic compression ratio dynamisch verdichtung einlass schliesst nockenwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Verdichtungsverh%C3%A4ltnis',
        'wiki_en': 'https://en.wikipedia.org/wiki/Compression_ratio',
    },
    'Combustion Chamber Volume &ndash; Brennraumvolumen': {
        'de': 'Brennraumvolumen (Combustion Chamber Volume)',
        'en': 'Combustion Chamber Volume (Brennraumvolumen)',
        'search': 'combustion chamber volume brennraumvolumen zylinderkopf cc',
        'wiki_de': 'https://de.wikipedia.org/wiki/Brennraum',
        'wiki_en': 'https://en.wikipedia.org/wiki/Combustion_chamber',
    },
    'Gasket Thickness &ndash; Dichtungsdicke': {
        'de': 'Dichtungsdicke (Gasket Thickness)',
        'en': 'Gasket Thickness (Dichtungsdicke)',
        'search': 'gasket thickness dichtungsdicke zylinderkopfdichtung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopfdichtung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Head_gasket',
    },
    'Compressed Gasket Thickness &ndash; Einbaudicke': {
        'de': 'Einbaudicke (Compressed Gasket Thickness)',
        'en': 'Compressed Gasket Thickness (Einbaudicke)',
        'search': 'compressed gasket thickness einbaudicke einbaumass komprimiert',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopfdichtung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Head_gasket',
    },
    'Quench &ndash; Quetschbereich': {
        'de': 'Quetschspalt (Quench / Squish)',
        'en': 'Quench / Squish (Quetschspalt)',
        'search': 'quench squish quetschspalt quetschflaeche turbulenz brennraum',
        'wiki_de': 'https://de.wikipedia.org/wiki/Brennraum',
        'wiki_en': 'https://en.wikipedia.org/wiki/Squish_(engine)',
    },
    'Quench Distance &ndash; Quetschabstand': {
        'de': 'Quetschspaltma&szlig; (Quench Distance)',
        'en': 'Quench Distance (Quetschspaltma&szlig;)',
        'search': 'quench distance quetschspaltmass abstand kolben kopf dichtung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Brennraum',
        'wiki_en': 'https://en.wikipedia.org/wiki/Squish_(engine)',
    },
    'Quench Area &ndash; Quetschfl&auml;che': {
        'de': 'Quetschfl&auml;che (Quench Area)',
        'en': 'Quench Area (Quetschfl&auml;che)',
        'search': 'quench area quetschflaeche flach kolben kopf turbulenz',
        'wiki_de': 'https://de.wikipedia.org/wiki/Brennraum',
        'wiki_en': 'https://en.wikipedia.org/wiki/Squish_(engine)',
    },

    # --- KOLBENRINGE ---
    'Top Ring &ndash; Oberster Kolbenring': {
        'de': '1. Kompressionsring (Top Ring)',
        'en': 'Top Ring (1. Kompressionsring)',
        'search': 'top ring kompressionsring verdichtungsring erster kolbenring',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },
    'Second Ring &ndash; Zweiter Kolbenring': {
        'de': '2. Kompressionsring (Second Ring)',
        'en': 'Second Ring (2. Kompressionsring)',
        'search': 'second ring kompressionsring zweiter kolbenring abstreif',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },
    'Oil Ring &ndash; &Ouml;labstreifring': {
        'de': '&Ouml;labstreifring (Oil Ring)',
        'en': 'Oil Ring (&Ouml;labstreifring)',
        'search': 'oil ring oelabstreifring oelfilm zylinder',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },
    'Ring End Gap &ndash; Kolbenringsto&szlig;': {
        'de': 'Sto&szlig;spiel (Ring End Gap)',
        'en': 'Ring End Gap (Sto&szlig;spiel)',
        'search': 'ring end gap stossspiel kolbenringstossspiel ringstoss spalt waermedehnung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },
    'Ring Groove &ndash; Kolbenringnut': {
        'de': 'Kolbenringnut (Ring Groove)',
        'en': 'Ring Groove (Kolbenringnut)',
        'search': 'ring groove kolbenringnut nut kolben',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },
    'Ring Land &ndash; Ringsteg': {
        'de': 'Ringsteg / Feuersteg (Ring Land)',
        'en': 'Ring Land (Ringsteg / Feuersteg)',
        'search': 'ring land ringsteg feuersteg kolben oberster',
        'wiki_de': 'https://de.wikipedia.org/wiki/Feuersteg',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston',
    },
    'Ring Clocking &ndash; Anordnung der Ringst&ouml;&szlig;e': {
        'de': 'Ringsto&szlig;versatz (Ring Clocking)',
        'en': 'Ring Clocking (Ringsto&szlig;versatz)',
        'search': 'ring clocking ringstossversatz anordnung 120 grad blowby',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kolbenring',
        'wiki_en': 'https://en.wikipedia.org/wiki/Piston_ring',
    },

    # --- ZYLINDERKOPF ---
    'Cylinder Head &ndash; Zylinderkopf': {
        'de': 'Zylinderkopf (Cylinder Head)',
        'en': 'Cylinder Head (Zylinderkopf)',
        'search': 'cylinder head zylinderkopf brennraum ventil kanal',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopf',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_head',
    },
    'Intake Port &ndash; Einlasskanal': {
        'de': 'Einlasskanal (Intake Port)',
        'en': 'Intake Port (Einlasskanal)',
        'search': 'intake port einlasskanal ansaugkanal gemisch',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopf',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_head',
    },
    'Exhaust Port &ndash; Auslasskanal': {
        'de': 'Auslasskanal (Exhaust Port)',
        'en': 'Exhaust Port (Auslasskanal)',
        'search': 'exhaust port auslasskanal abgas',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopf',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_head',
    },
    'Port Volume &ndash; Kanalvolumen': {
        'de': 'Kanalvolumen (Port Volume)',
        'en': 'Port Volume (Kanalvolumen)',
        'search': 'port volume kanalvolumen cc durchfluss',
        'wiki_de': 'https://de.wikipedia.org/wiki/Zylinderkopf',
        'wiki_en': 'https://en.wikipedia.org/wiki/Cylinder_head',
    },

    # --- VENTILE ---
    'Valve &ndash; Ventil': {
        'de': 'Ventil (Valve)',
        'en': 'Valve (Ventil)',
        'search': 'valve ventil einlass auslass oeffnen schliessen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Intake Valve &ndash; Einlassventil': {
        'de': 'Einlassventil (Intake Valve)',
        'en': 'Intake Valve (Einlassventil)',
        'search': 'intake valve einlassventil gemisch ansaugen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Exhaust Valve &ndash; Auslassventil': {
        'de': 'Auslassventil (Exhaust Valve)',
        'en': 'Exhaust Valve (Auslassventil)',
        'search': 'exhaust valve auslassventil abgas hitze',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Valve Stem &ndash; Ventilschaft': {
        'de': 'Ventilschaft (Valve Stem)',
        'en': 'Valve Stem (Ventilschaft)',
        'search': 'valve stem ventilschaft fuehrung dichtung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Valve Face &ndash; Ventilteller': {
        'de': 'Ventilteller (Valve Face)',
        'en': 'Valve Face (Ventilteller)',
        'search': 'valve face ventilteller dichtflaeche sitz',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Valve Seat &ndash; Ventilsitz': {
        'de': 'Ventilsitz (Valve Seat)',
        'en': 'Valve Seat (Ventilsitz)',
        'search': 'valve seat ventilsitz dichtung winkel einschleifen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_seat',
    },
    'Valve Guide &ndash; Ventilf&uuml;hrung': {
        'de': 'Ventilf&uuml;hrung (Valve Guide)',
        'en': 'Valve Guide (Ventilf&uuml;hrung)',
        'search': 'valve guide ventilfuehrung schaft fuehrung spiel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_guide',
    },
    'Valve Lift &ndash; Ventilhub': {
        'de': 'Ventilhub (Valve Lift)',
        'en': 'Valve Lift (Ventilhub)',
        'search': 'valve lift ventilhub nockenhub kipphebel uebersetzung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Valve Lash &ndash; Ventilspiel': {
        'de': 'Ventilspiel (Valve Lash)',
        'en': 'Valve Lash (Ventilspiel)',
        'search': 'valve lash ventilspiel einstellen kalt warm',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilspiel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_clearance',
    },

    # --- VENTILFEDERN ---
    'Valve Spring &ndash; Ventilfeder': {
        'de': 'Ventilfeder (Valve Spring)',
        'en': 'Valve Spring (Ventilfeder)',
        'search': 'valve spring ventilfeder schliessdruck federkraft',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Installed Spring Height &ndash; Ventilfeder-Einbauh&ouml;he': {
        'de': 'Einbauh&ouml;he (Installed Spring Height)',
        'en': 'Installed Spring Height (Einbauh&ouml;he)',
        'search': 'installed spring height einbauhoehe ventilfeder shimm',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Seat Pressure &ndash; Sitzdruck': {
        'de': 'Sitzdruck (Seat Pressure)',
        'en': 'Seat Pressure (Sitzdruck)',
        'search': 'seat pressure sitzdruck federkraft geschlossen einbauhoehe',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Open Pressure &ndash; &Ouml;ffnungsdruck': {
        'de': '&Ouml;ffnungskraft (Open Pressure)',
        'en': 'Open Pressure (&Ouml;ffnungskraft)',
        'search': 'open pressure oeffnungskraft federkraft maximaler hub',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Coil Bind &ndash; Federblock': {
        'de': 'Blockl&auml;nge (Coil Bind)',
        'en': 'Coil Bind (Blockl&auml;nge)',
        'search': 'coil bind blocklaenge feder block windungen aneinander',
        'wiki_de': 'https://de.wikipedia.org/wiki/Feder_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Coil_spring',
    },
    'Retainer &ndash; Federteller': {
        'de': 'Federteller (Retainer)',
        'en': 'Retainer (Federteller)',
        'search': 'retainer federteller ventilfeder keile',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Valve Locks / Keepers &ndash; Ventilkeile': {
        'de': 'Ventilkeile (Valve Locks / Keepers)',
        'en': 'Valve Locks / Keepers (Ventilkeile)',
        'search': 'valve locks keepers ventilkeile federteller schaft sichern',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Poppet_valve',
    },
    'Retainer-to-Seal Clearance': {
        'de': 'Retainer-to-Seal Clearance',
        'en': 'Retainer-to-Seal Clearance',
        'search': 'retainer seal clearance federteller schaftdichtung hub',
    },
    'Valve Float &ndash; Ventilflattern': {
        'de': 'Ventilflattern (Valve Float)',
        'en': 'Valve Float (Ventilflattern)',
        'search': 'valve float ventilflattern drehzahl feder zu schwach',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_float',
    },

    # --- NOCKENWELLE ---
    'Camshaft &ndash; Nockenwelle': {
        'de': 'Nockenwelle (Camshaft)',
        'en': 'Camshaft (Nockenwelle)',
        'search': 'camshaft nockenwelle nocken ventilsteuerung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Cam Lobe &ndash; Nocken': {
        'de': 'Nocken (Cam Lobe)',
        'en': 'Cam Lobe (Nocken)',
        'search': 'cam lobe nocken erhebung nockenwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Base Circle &ndash; Grundkreis': {
        'de': 'Grundkreis (Base Circle)',
        'en': 'Base Circle (Grundkreis)',
        'search': 'base circle grundkreis nockenwelle ventil geschlossen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Lobe Lift / Cam Lift &ndash; Nockenhub': {
        'de': 'Nockenhub (Lobe Lift / Cam Lift)',
        'en': 'Lobe Lift / Cam Lift (Nockenhub)',
        'search': 'lobe lift cam lift nockenhub erhebung grundkreis',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Duration &ndash; &Ouml;ffnungsdauer': {
        'de': '&Ouml;ffnungsdauer (Duration)',
        'en': 'Duration (&Ouml;ffnungsdauer)',
        'search': 'duration oeffnungsdauer grad kurbelwinkel ventil offen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Duration @ 0.050"': {
        'de': 'Duration @ 0.050&quot;',
        'en': 'Duration @ 0.050&quot;',
        'search': 'duration 0.050 vergleichsmass standard hub',
    },
    'LSA &ndash; Lobe Separation Angle': {
        'de': 'LSA &ndash; Lobe Separation Angle',
        'en': 'LSA &ndash; Lobe Separation Angle',
        'search': 'lsa lobe separation angle einlass auslass nocken winkel',
    },
    'Camshaft Centerline &ndash; Nocken-Mittellinie': {
        'de': 'Camshaft Centerline (Einbauwinkel)',
        'en': 'Camshaft Centerline (Einbauwinkel)',
        'search': 'camshaft centerline einbauwinkel intake exhaust maximaler hub grad',
    },
    'Cam Advance &ndash; Vorverstellung': {
        'de': 'Vorverstellung / Fr&uuml;hverstellung (Cam Advance)',
        'en': 'Cam Advance (Vorverstellung)',
        'search': 'cam advance vorverstellung fruehverstellung nockenwelle steuerzeiten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Cam Retard &ndash; R&uuml;ckverstellung': {
        'de': 'Sp&auml;tverstellung (Cam Retard)',
        'en': 'Cam Retard (Sp&auml;tverstellung)',
        'search': 'cam retard spaetverstellung nockenwelle steuerzeiten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Degreeing the Cam &ndash; Nockenwelle einmessen': {
        'de': 'Nockenwelle einmessen (Degreeing the Cam)',
        'en': 'Degreeing the Cam (Nockenwelle einmessen)',
        'search': 'degreeing cam nockenwelle einmessen gradscheibe centerline',
        'wiki_de': 'https://de.wikipedia.org/wiki/Nockenwelle',
        'wiki_en': 'https://en.wikipedia.org/wiki/Camshaft',
    },
    'Valve Overlap &ndash; Ventil&uuml;berschneidung': {
        'de': 'Ventil&uuml;berschneidung (Valve Overlap)',
        'en': 'Valve Overlap (Ventil&uuml;berschneidung)',
        'search': 'valve overlap ventilueberschneidung einlass auslass gleichzeitig offen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },

    # --- STEUERTRIEB ---
    'Timing Set &ndash; Steuertrieb': {
        'de': 'Steuertrieb (Timing Set)',
        'en': 'Timing Set (Steuertrieb)',
        'search': 'timing set steuertrieb kette zahnrad nockenwelle kurbelwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'Timing Chain &ndash; Steuerkette': {
        'de': 'Steuerkette (Timing Chain)',
        'en': 'Timing Chain (Steuerkette)',
        'search': 'timing chain steuerkette antrieb nockenwelle',
        'wiki_de': 'https://de.wikipedia.org/wiki/Steuerkette',
        'wiki_en': 'https://en.wikipedia.org/wiki/Timing_chain',
    },
    'Crank Gear / Sprocket &ndash; Kurbelwellenrad': {
        'de': 'Kurbelwellenrad (Crank Gear / Sprocket)',
        'en': 'Crank Gear / Sprocket (Kurbelwellenrad)',
        'search': 'crank gear sprocket kurbelwellenrad steuertrieb',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'Cam Gear / Sprocket &ndash; Nockenwellenrad': {
        'de': 'Nockenwellenrad (Cam Gear / Sprocket)',
        'en': 'Cam Gear / Sprocket (Nockenwellenrad)',
        'search': 'cam gear sprocket nockenwellenrad steuertrieb',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'Timing Mark &ndash; Steuerzeitmarkierung': {
        'de': 'Steuermarke (Timing Mark)',
        'en': 'Timing Mark (Steuermarke)',
        'search': 'timing mark steuermarke zuendmarke ot markierung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'Backlash &ndash; Flankenspiel': {
        'de': 'Flankenspiel (Backlash)',
        'en': 'Backlash (Flankenspiel)',
        'search': 'backlash flankenspiel zahnflankenspiel zahnrad steuertrieb',
        'wiki_de': 'https://de.wikipedia.org/wiki/Flankenspiel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Backlash_(engineering)',
    },

    # --- LIFTER & PUSHROD ---
    'Hydraulic Roller Lifter &ndash; Hyd. Rollenst&ouml;&szlig;el': {
        'de': 'Hydraulischer Rollenst&ouml;&szlig;el (Hydraulic Roller Lifter)',
        'en': 'Hydraulic Roller Lifter (Hyd. Rollenst&ouml;&szlig;el)',
        'search': 'hydraulic roller lifter hydrostoessel rollenstoessel ventilspielausgleich',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Roller Wheel &ndash; Lifter-Rolle': {
        'de': 'Laufrolle (Roller Wheel)',
        'en': 'Roller Wheel (Laufrolle)',
        'search': 'roller wheel laufrolle lifter nockenwelle kontakt',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Plunger &ndash; Hydraulischer Kolben': {
        'de': 'Hydraulikkolben (Plunger)',
        'en': 'Plunger (Hydraulikkolben)',
        'search': 'plunger hydraulikkolben lifter oelkissen ventilspielausgleich',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Plunger Preload &ndash; Plunger-Vorspannung': {
        'de': 'Vorspannma&szlig; (Plunger Preload)',
        'en': 'Plunger Preload (Vorspannma&szlig;)',
        'search': 'plunger preload vorspannmass hydrostoessel einstellung grundstellung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Lifter Body &ndash; Liftergeh&auml;use': {
        'de': 'St&ouml;&szlig;elk&ouml;rper (Lifter Body)',
        'en': 'Lifter Body (St&ouml;&szlig;elk&ouml;rper)',
        'search': 'lifter body stoesselkoerper gehaeuse bohrung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Lifter Bore &ndash; Lifterbohrung': {
        'de': 'St&ouml;&szlig;elbohrung (Lifter Bore)',
        'en': 'Lifter Bore (St&ouml;&szlig;elbohrung)',
        'search': 'lifter bore stoesselbohrung block bohrung durchmesser',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Lifter Retainer &ndash; Lifter-Halterung': {
        'de': 'St&ouml;&szlig;elf&uuml;hrung / Spider (Lifter Retainer)',
        'en': 'Lifter Retainer (St&ouml;&szlig;elf&uuml;hrung / Spider)',
        'search': 'lifter retainer stoesselfuehrung spider tie-bar halterung rotation',
        'wiki_de': 'https://de.wikipedia.org/wiki/Hydrost%C3%B6%C3%9Fel',
        'wiki_en': 'https://en.wikipedia.org/wiki/Hydraulic_tappet',
    },
    'Pushrod &ndash; Sto&szlig;elstange': {
        'de': 'Sto&szlig;stange (Pushrod)',
        'en': 'Pushrod (Sto&szlig;stange)',
        'search': 'pushrod stossstange stoesselstange lifter kipphebel ohv',
        'wiki_de': 'https://de.wikipedia.org/wiki/Sto%C3%9Fstange_(Motor)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Pushrod',
    },
    'Checking Pushrod &ndash; Mess-Sto&szlig;elstange': {
        'de': 'Checking Pushrod (Mess-Pushrod)',
        'en': 'Checking Pushrod',
        'search': 'checking pushrod mess verstellbar laenge geometrie',
    },
    'Pushrod Length &ndash; Sto&szlig;elstangenl&auml;nge': {
        'de': 'Pushrod-L&auml;nge (Pushrod Length)',
        'en': 'Pushrod Length (Pushrod-L&auml;nge)',
        'search': 'pushrod length stossstangenlaenge geometrie kipphebel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Sto%C3%9Fstange_(Motor)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Pushrod',
    },
    'Rocker Arm &ndash; Kipphebel': {
        'de': 'Kipphebel (Rocker Arm)',
        'en': 'Rocker Arm (Kipphebel)',
        'search': 'rocker arm kipphebel ventil pushrod uebersetzung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kipphebel_(Ventilsteuerung)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Rocker_arm',
    },
    'Rocker Ratio &ndash; Kipphebel&uuml;bers.': {
        'de': 'Kipphebel&uuml;bersetzung (Rocker Ratio)',
        'en': 'Rocker Ratio (Kipphebel&uuml;bersetzung)',
        'search': 'rocker ratio kipphebeluebersetzung verhaeltnis nockenhub ventilhub',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kipphebel_(Ventilsteuerung)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Rocker_arm',
    },
    'Rocker Tip &ndash; Kipphebelkontaktfl&auml;che': {
        'de': 'Kipphebel-Druckst&uuml;ck (Rocker Tip)',
        'en': 'Rocker Tip (Kipphebel-Druckst&uuml;ck)',
        'search': 'rocker tip druckstueck tastkuppe kontakt ventilschaft laufspur',
        'wiki_de': 'https://de.wikipedia.org/wiki/Kipphebel_(Ventilsteuerung)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Rocker_arm',
    },
    'Sweep Pattern &ndash; Laufspur': {
        'de': 'Laufspur (Sweep Pattern)',
        'en': 'Sweep Pattern (Laufspur)',
        'search': 'sweep pattern laufspur kontaktmuster ventilschaft kipphebel',
    },
    'Valve Train Geometry &ndash; Ventiltrieb-Geometrie': {
        'de': 'Ventiltrieb-Geometrie (Valve Train Geometry)',
        'en': 'Valve Train Geometry (Ventiltrieb-Geometrie)',
        'search': 'valve train geometry ventiltrieb geometrie pushrod laenge kipphebel winkel',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valvetrain',
    },

    # --- STEUERZEITEN ---
    'IO &ndash; Intake Opening (Einlass &ouml;ffnet)': {
        'de': 'E&Ouml; &ndash; Einlass &ouml;ffnet (IO &ndash; Intake Opening)',
        'en': 'IO &ndash; Intake Opening (E&Ouml; &ndash; Einlass &ouml;ffnet)',
        'search': 'io intake opening einlass oeffnet steuerzeiten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'IC &ndash; Intake Closing (Einlass schlie&szlig;t)': {
        'de': 'ES &ndash; Einlass schlie&szlig;t (IC &ndash; Intake Closing)',
        'en': 'IC &ndash; Intake Closing (ES &ndash; Einlass schlie&szlig;t)',
        'search': 'ic intake closing einlass schliesst steuerzeiten dynamische verdichtung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'EO &ndash; Exhaust Opening (Auslass &ouml;ffnet)': {
        'de': 'A&Ouml; &ndash; Auslass &ouml;ffnet (EO &ndash; Exhaust Opening)',
        'en': 'EO &ndash; Exhaust Opening (A&Ouml; &ndash; Auslass &ouml;ffnet)',
        'search': 'eo exhaust opening auslass oeffnet steuerzeiten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },
    'EC &ndash; Exhaust Closing (Auslass schlie&szlig;t)': {
        'de': 'AS &ndash; Auslass schlie&szlig;t (EC &ndash; Exhaust Closing)',
        'en': 'EC &ndash; Exhaust Closing (AS &ndash; Auslass schlie&szlig;t)',
        'search': 'ec exhaust closing auslass schliesst steuerzeiten',
        'wiki_de': 'https://de.wikipedia.org/wiki/Ventilsteuerung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Valve_timing',
    },

    # --- ÖLSYSTEM ---
    'Oil Pump &ndash; &Ouml;lpumpe': {
        'de': '&Ouml;lpumpe (Oil Pump)',
        'en': 'Oil Pump (&Ouml;lpumpe)',
        'search': 'oil pump oelpumpe foerdermenge druck',
        'wiki_de': 'https://de.wikipedia.org/wiki/%C3%96lpumpe',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pump_(internal_combustion_engine)',
    },
    'Oil Pickup &ndash; &Ouml;lansaugrohr': {
        'de': '&Ouml;lansaugrohr (Oil Pickup)',
        'en': 'Oil Pickup (&Ouml;lansaugrohr)',
        'search': 'oil pickup oelansaugrohr sieb wanne',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorschmierung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pump_(internal_combustion_engine)',
    },
    'Pickup-to-Pan Clearance': {
        'de': 'Pickup-to-Pan Clearance',
        'en': 'Pickup-to-Pan Clearance',
        'search': 'pickup pan clearance ansaugrohr wannenboden abstand',
    },
    'Oil Pan / Sump &ndash; &Ouml;lwanne': {
        'de': '&Ouml;lwanne (Oil Pan / Sump)',
        'en': 'Oil Pan / Sump (&Ouml;lwanne)',
        'search': 'oil pan sump oelwanne vorrat motor',
        'wiki_de': 'https://de.wikipedia.org/wiki/%C3%96lwanne',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pan',
    },
    'Baffle &ndash; Schwallblech': {
        'de': 'Schwallblech (Baffle)',
        'en': 'Baffle (Schwallblech)',
        'search': 'baffle schwallblech oelwanne schwappen kurvenfahrt',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorschmierung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pan',
    },
    'Windage Tray &ndash; Windage-Blech': {
        'de': 'Windage Tray (&Ouml;l-Abweisblech)',
        'en': 'Windage Tray',
        'search': 'windage tray abweisblech oelnebel kurbelwelle widerstand',
    },
    'Oil Pressure &ndash; &Ouml;ldruck': {
        'de': '&Ouml;ldruck (Oil Pressure)',
        'en': 'Oil Pressure (&Ouml;ldruck)',
        'search': 'oil pressure oeldruck bar psi schmierung',
        'wiki_de': 'https://de.wikipedia.org/wiki/Motorschmierung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pressure',
    },
    'High Volume Oil Pump &ndash; Hochvolumen-&Ouml;lpumpe': {
        'de': 'Hochf&ouml;rder-&Ouml;lpumpe (High Volume Oil Pump)',
        'en': 'High Volume Oil Pump (Hochf&ouml;rder-&Ouml;lpumpe)',
        'search': 'high volume oil pump hochfoerder oelpumpe foerdermenge',
        'wiki_de': 'https://de.wikipedia.org/wiki/%C3%96lpumpe',
        'wiki_en': 'https://en.wikipedia.org/wiki/Oil_pump_(internal_combustion_engine)',
    },
    'Pressure Relief Valve &ndash; Druckbegrenzungsventil': {
        'de': 'Druckbegrenzungsventil (Pressure Relief Valve)',
        'en': 'Pressure Relief Valve (Druckbegrenzungsventil)',
        'search': 'pressure relief valve druckbegrenzungsventil ueberdruckventil oelpumpe',
        'wiki_de': 'https://de.wikipedia.org/wiki/%C3%96lpumpe',
        'wiki_en': 'https://en.wikipedia.org/wiki/Relief_valve',
    },

    # --- MONTAGE & DREHMOMENT ---
    'Clearance &ndash; Spiel / Abstand': {
        'de': 'Spiel / Abstand (Clearance)',
        'en': 'Clearance (Spiel / Abstand)',
        'search': 'clearance spiel abstand freigang toleranz',
    },
    'Tolerance &ndash; Toleranz': {
        'de': 'Toleranz (Tolerance)',
        'en': 'Tolerance (Toleranz)',
        'search': 'tolerance toleranz mass abweichung din',
        'wiki_de': 'https://de.wikipedia.org/wiki/Toleranz_(Technik)',
        'wiki_en': 'https://en.wikipedia.org/wiki/Engineering_tolerance',
    },
    'Interference &ndash; Kollision': {
        'de': 'Kollision / Interference',
        'en': 'Interference (Kollision)',
        'search': 'interference kollision kontakt ventil kolben freigang',
    },
    'Endplay &ndash; Axialspiel': {
        'de': 'Axialspiel (Endplay)',
        'en': 'Endplay (Axialspiel)',
        'search': 'endplay axialspiel laengs welle lager',
    },
    'Torque &ndash; Anzugsdrehmoment': {
        'de': 'Anzugsmoment (Torque)',
        'en': 'Torque (Anzugsmoment)',
        'search': 'torque anzugsmoment drehmoment nm ft-lbs schraube',
        'wiki_de': 'https://de.wikipedia.org/wiki/Drehmoment',
        'wiki_en': 'https://en.wikipedia.org/wiki/Torque',
    },
    'Torque Sequence &ndash; Anzugsreihenfolge': {
        'de': 'Anzugsreihenfolge (Torque Sequence)',
        'en': 'Torque Sequence (Anzugsreihenfolge)',
        'search': 'torque sequence anzugsreihenfolge reihenfolge kreuzweise',
    },
    'Torque Angle &ndash; Drehwinkelanzug': {
        'de': 'Drehwinkelanzug (Torque Angle)',
        'en': 'Torque Angle (Drehwinkelanzug)',
        'search': 'torque angle drehwinkelanzug grad nachziehen streckgrenze',
        'wiki_de': 'https://de.wikipedia.org/wiki/Drehmoment',
        'wiki_en': 'https://en.wikipedia.org/wiki/Torque',
    },
    'Threadlocker &ndash; Schraubensicherung': {
        'de': 'Schraubensicherung (Threadlocker)',
        'en': 'Threadlocker (Schraubensicherung)',
        'search': 'threadlocker schraubensicherung loctite kleber gewinde',
        'wiki_de': 'https://de.wikipedia.org/wiki/Schraubensicherung',
        'wiki_en': 'https://en.wikipedia.org/wiki/Thread-locking_fluid',
    },
    'Assembly Lubricant &ndash; Montage&ouml;l': {
        'de': 'Montagepaste (Assembly Lubricant)',
        'en': 'Assembly Lubricant (Montagepaste)',
        'search': 'assembly lubricant montagepaste montageoel einlaufpaste moly',
    },

    # --- MESSWERKZEUGE ---
    'Dial Indicator &ndash; Messuhr': {
        'de': 'Messuhr (Dial Indicator)',
        'en': 'Dial Indicator (Messuhr)',
        'search': 'dial indicator messuhr tausendstel messen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Messuhr',
        'wiki_en': 'https://en.wikipedia.org/wiki/Indicator_(distance_amplifying_instrument)',
    },
    'Feeler Gauge &ndash; F&uuml;hlerlehre': {
        'de': 'F&uuml;hlerlehre (Feeler Gauge)',
        'en': 'Feeler Gauge (F&uuml;hlerlehre)',
        'search': 'feeler gauge fuehlerlehre spalt messen blaettchen',
        'wiki_de': 'https://de.wikipedia.org/wiki/F%C3%BChlerlehre',
        'wiki_en': 'https://en.wikipedia.org/wiki/Feeler_gauge',
    },
    'Micrometer &ndash; B&uuml;gelmessschraube': {
        'de': 'B&uuml;gelmessschraube / Mikrometer (Micrometer)',
        'en': 'Micrometer (B&uuml;gelmessschraube)',
        'search': 'micrometer buegelmessschraube mikrometer aussen messen',
        'wiki_de': 'https://de.wikipedia.org/wiki/Messschraube',
        'wiki_en': 'https://en.wikipedia.org/wiki/Micrometer_(device)',
    },
    'Bore Gauge &ndash; Innenmessger&auml;t': {
        'de': 'Innenmessger&auml;t (Bore Gauge)',
        'en': 'Bore Gauge (Innenmessger&auml;t)',
        'search': 'bore gauge innenmessgeraet innen feinmessen zylinder',
        'wiki_de': 'https://de.wikipedia.org/wiki/Innenmessger%C3%A4t',
        'wiki_en': 'https://en.wikipedia.org/wiki/Bore_gauge',
    },
    'Plastigage &ndash; Messstreifen': {
        'de': 'Plastigage',
        'en': 'Plastigage',
        'search': 'plastigage messstreifen lagerspiel messen streifen quetschen',
    },

    # --- DUPLIKATE / SONDERFÄLLE ---
    'Kolbenposition bei OT': {
        'de': 'Kolbenposition bei OT',
        'en': 'Piston Position at TDC',
        'search': 'kolbenposition ot tdc piston deck',
    },
    'Quench Distance': {
        'de': 'Quetschspaltma&szlig; (Quench Distance)',
        'en': 'Quench Distance (Quetschspaltma&szlig;)',
        'search': 'quench distance quetschspaltmass abstand kolben kopf',
    },
    'Compression Ratio &ndash; Berechnung': {
        'de': 'Verdichtungsverh&auml;ltnis &ndash; Berechnung',
        'en': 'Compression Ratio &ndash; Calculation',
        'search': 'compression ratio berechnung formel hubraum brennraum',
    },
    'Valve Train Geometry &ndash; Pushrod Length': {
        'de': 'Ventiltrieb-Geometrie &ndash; Pushrod-L&auml;nge',
        'en': 'Valve Train Geometry &ndash; Pushrod Length',
        'search': 'valve train geometry pushrod length stossstange laenge geometrie',
    },
    'Piston-to-Valve Clearance': {
        'de': 'Ventil-Kolben-Freigang (Piston-to-Valve Clearance)',
        'en': 'Piston-to-Valve Clearance (Ventil-Kolben-Freigang)',
        'search': 'piston-to-valve clearance ventilfreigang ptv sicherheitsabstand',
    },
    'Ventilfedern &ndash; Pr&uuml;fung': {
        'de': 'Ventilfedern &ndash; Pr&uuml;fung',
        'en': 'Valve Springs &ndash; Inspection',
        'search': 'ventilfedern pruefung valve springs inspection',
    },
}


def update_file(filename):
    """Update glossary terms in a single HTML file."""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changes = 0
    
    for old_term, mapping in GLOSSARY_MAP.items():
        new_de_term = mapping['de']
        
        # Pattern: <div class="glossary-term">OLD_TERM</div>
        # We need to handle possible whitespace and attributes
        old_pattern = f'class="glossary-term">{old_term}</div>'
        new_replacement = f'class="glossary-term">{new_de_term}</div>'
        
        if old_pattern in content:
            content = content.replace(old_pattern, new_replacement)
            changes += 1
        else:
            # Try with possible extra spaces/newlines
            old_pattern2 = f'class="glossary-term">\n{old_term}</div>'
            if old_pattern2 in content:
                content = content.replace(old_pattern2, f'class="glossary-term">\n{new_de_term}</div>')
                changes += 1
    
    # Also update data-search attributes where applicable
    for old_term, mapping in GLOSSARY_MAP.items():
        if 'search' in mapping:
            new_search = mapping['search']
            # Find the entry that had this old term and update its data-search
            # This is trickier - we look for the entry div that contains the term
    
    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  {filename}: {changes} Begriffe aktualisiert')
    else:
        print(f'  {filename}: keine Aenderungen')
    
    return changes


if __name__ == '__main__':
    total = 0
    for fn in ['index.html', 'specs.html', 'build-log.html']:
        total += update_file(fn)
    print(f'\nGesamt: {total} Begriffe aktualisiert')
