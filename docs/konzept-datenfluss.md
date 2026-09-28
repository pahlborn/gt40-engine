# Konzept: Datenfluss-Bereinigung

## Problem

Die Seiten sind historisch gewachsen. Es gibt drei "Schichten" von Daten, die nicht sauber verkettet sind:

| Schicht | Was | Beispiel | Herkunft |
|---|---|---|---|
| **1. Komponentenauswahl** | Warum diese Teile? Was sind die Zielwerte? | "330-360 BHP", "9.7:1 CR Ziel", "6.200 RPM Cam-Range" | Manuell geschrieben, historisch |
| **2. Simulation** | Was berechnen die Simulatoren aus den tatsaechlichen Daten? | CR-Rechner -> 9.82:1, Motor-Sim -> 347 HP @ 5.800, Geschwindigkeits-Sim -> Vmax 248 km/h | Berechnet aus Eingabefeldern |
| **3. Streckenanalyse** | Wie schnell auf welcher Strecke? | "~220-235 km/h auf Pannoniaring", "~340-360 BHP" | Manuell geschrieben, historisch |

### Konkrete Inkonsistenzen

1. **Leistung**: "Geschaetzte Motorleistung" sagt 330-360 BHP. Streckenanalyse sagt ~340-360 BHP. Der Simulator berechnet evtl. 347 HP. Drei verschiedene Angaben.

2. **Verdichtung**: CR-Rechner-Ergebnis (berechnet) vs. "9.7:1" Hardcoded an diversen Stellen. Teilweise korrigiert (v65), aber Placeholder-Werte im Simulator (value="9.7") bleiben.

3. **V-max pro Strecke**: Die Streckenanalyse hat Hardcoded-V-max-Werte ("~220-235 km/h"), die vom Geschwindigkeits-Simulator abweichen koennten.

4. **Leistung/Gewicht**: Streckenanalyse sagt "324-343 BHP/t" - berechnet aus den Hardcoded-Leistungswerten und dem Fahrzeuggewicht.

## Loesung: Single Source of Truth mit Kette

### Stufe 1: Datenquellen definieren (SSOT)

```
Gemessene Werte (Eingabefelder)
    |
    v
CR-Rechner (berechnet CR aus Bore/Stroke/Chamber/Gasket/Deck/Dish)
    |
    v
Motor-Simulator (berechnet HP/TQ/RPM aus CR + Cam + Heads + Intake)
    |
    v
Geschwindigkeits-Simulator (berechnet V-max/Ganggeschwindigkeiten aus HP/TQ + Getriebe + Reifen + Gewicht)
    |
    v
Streckenanalyse (nutzt V-max und Ganggeschwindigkeiten fuer Strecken-Einschaetzungen)
```

### Stufe 2: Statische Texte durch berechnete Werte ersetzen

| Aktuell (statisch) | Kuenftig (berechnet) |
|---|---|
| "330-360 BHP" | Aus Motor-Simulator: `simPeakHP` |
| "330-350 ft-lbs" | Aus Motor-Simulator: `simPeakTQ` |
| "~220-235 km/h auf Pannoniaring" | Aus Geschwindigkeits-Sim: V-max im 4./5. Gang |
| "~324-343 BHP/t" | HP / Fahrzeuggewicht |
| "~1.050 kg" | Aus Eingabefeld `dsWeight` |

### Stufe 3: "Build-Ziele" vs. "Berechnete Werte" klar trennen

Die Sektion "Geschaetzte Motorleistung" wird zu zwei Teilen:

**A. Build-Ziele (was wir anstreben)**
- Vom User eingetragen
- z.B. "Ziel-CR: 9.5-10.0:1", "Ziel-Leistung: 330+ BHP"
- Diese aendern sich NICHT wenn der Simulator laeuft

**B. Berechnete Werte (was die Daten ergeben)**
- Automatisch aus den Simulatoren gezogen
- z.B. "Berechnete CR: 9.82:1", "Berechnete Leistung: 347 HP"
- Aktualisieren sich automatisch

Wenn A und B abweichen, wird eine Warnung angezeigt:
"Berechnete Leistung (347 HP) weicht von Build-Ziel (330-360 HP) ab."

### Stufe 4: Streckenanalyse dynamisieren

Die Streckenanalyse-V-max-Werte werden aus dem Geschwindigkeits-Simulator gezogen:
- V-max auf laengster Geraden = Sim-V-max im hoechsten erreichbaren Gang
- Vorherrschende Gaenge = aus der Gang-Tabelle ableitbar
- Die Fahrzeug-Daten (Gewicht, BHP, BHP/t) kommen aus den Eingabefeldern

### Stufe 5: Cross-Checks automatisieren

Der Simulator prueft bereits RPM-Limits. Ergaenzen:
- Leistung vs. Build-Ziel (Warnung wenn ausserhalb)
- CR vs. Oktan-Empfehlung (existiert teilweise)
- V-max vs. Strecken-V-max (Warnung wenn unrealistisch)

## Umsetzungsplan (Empfehlung)

| Phase | Was | Aufwand | Nutzen |
|---|---|---|---|
| **Phase 1** | "Geschaetzte Motorleistung" in Ziel vs. Berechnet aufteilen | Klein | Sofort klar, was Annahme und was Fakt ist |
| **Phase 2** | Streckenanalyse-Header dynamisieren (BHP, BHP/t, V-max aus Sim) | Mittel | Keine Hardcoded-Leistungswerte mehr in Streckenanalyse |
| **Phase 3** | Cross-Check-Warnungen wenn Ziel != Berechnet | Klein | Inkonsistenzen werden sichtbar |
| **Phase 4** | Strecken-V-max aus Geschwindigkeits-Sim berechnen | Gross | Streckenanalyse ist immer aktuell |

## Nicht aendern

- Die Strecken-Einschaetzungen (Reifenbewertung, Bremsen, Kuehlung) bleiben manuell - das ist Fahrer-Erfahrung, kein Rechenwert.
- Die Build-Ziele bleiben manuell editierbar - sie sind die Planungsgrundlage.
- Die Simulator-Formeln bleiben empirisch mit +/- 10% Genauigkeit - kein Pruefstand-Ersatz.
