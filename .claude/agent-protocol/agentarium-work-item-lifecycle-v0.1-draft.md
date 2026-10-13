# Agentarium Work-Item Lifecycle — Prozessentwurf

Version: 0.1 DRAFT  
Stand: 13.10.2026  
Task: `AGENTARIUM-PROC-WIL-001`  
Prozessbasis: Agentarium Rulebook V1.0 DRAFT, Commit `69941ee182d698753c99e4e30c4836b320eeda09`  
Status: Entwurf durch Atlas; Teamreview ausstehend; keine Prozess-, Implementierungs-, Merge- oder Veröffentlichungsfreigabe

## 1. Ziel

Epics, User Stories beziehungsweise technische Capabilities, Anforderungen, Akzeptanzkriterien, Testfälle, Testläufe und Findings bilden eine durchgehend versionierte Beweiskette. Archibald spezifiziert; Forge setzt nur akzeptierte Stände um; Argus und Sentinel prüfen unabhängig; Nova schützt Vision und Experience; Peter erteilt die erforderlichen Nutzerentscheidungen.

## 2. Artefakthierarchie und stabile IDs

| Ebene | ID | Zweck |
|---|---|---|
| Epic | `E-###` | messbarer Produkt- oder Prozessnutzen über mehrere Liefergegenstände |
| User Story | `US-###` | Nutzerverhalten mit Akteur, Ziel und Nutzen |
| Technical Capability | `CAP-###` | notwendige technische Fähigkeit ohne künstliche Nutzergeschichte |
| Requirement | `R-###` | eindeutige normative Anforderung |
| Acceptance Criterion | `AC-###` | beobachtbare Bestehensbedingung zu mindestens einem Requirement |
| Test Case | `TC-###` | reproduzierbarer Prüfablauf für mindestens ein AC |
| Test Run | `TR-###` | Ergebnis eines Testfalls auf exaktem Commit/Build und Kriterienstand |
| Finding | `F-###` | Abweichung, Lücke, Risiko oder Beobachtung mit Owner und Schwere |

Nicht jede technische Aufgabe benötigt eine User Story. Reine Infrastruktur-, Sicherheits- oder Prozessarbeit verwendet `CAP-###`, wenn ein erfundener Nutzertext den Sachverhalt verschleiern würde.

## 3. Verbindliche Traceability

1. Jedes `US` und jede `CAP` gehört zu genau einem aktiven Epic oder nennt begründet `standalone`.
2. Jede bindende Anforderung verweist auf mindestens ein `US` oder `CAP` sowie auf bestätigte beziehungsweise zulässig abgeleitete Wissenseinträge.
3. Jedes Requirement besitzt mindestens ein AC oder wird als `blocked` geführt.
4. Jedes AC besitzt vor G5 mindestens einen `TC` oder einen offenen `Test Gap`, der das Gate schließt.
5. Jeder Test Run nennt exakte Versionen von `TC`, `AC`, Spezifikation, Commit/Build, Umgebung und Testdaten.
6. Findings verweisen auf die verletzten oder fehlenden IDs. Ein Finding verändert keine Anforderung stillschweigend.
7. Löschung ist unzulässig, sobald ein Artefakt referenziert wurde; Ablösung erfolgt durch neue Version plus `superseded_by`.

## 4. Statusmodelle

### 4.1 Epic

`proposed → discovery → specified → approved → in_progress → validating → done`

Ausnahmezustände: `blocked`, `rejected`, `superseded`, `aborted`.

### 4.2 User Story und Technical Capability

`draft → ready_for_spec → specified → in_review → accepted → ready_for_implementation → implementing → ready_for_qa → verified → done`

Ausnahmezustände: `decision_required`, `change_requested`, `blocked`, `rejected`, `superseded`, `aborted`.

`accepted` bestätigt nur den geprüften Sollstand. Erst Peters versioniertes `USER_GO` setzt `ready_for_implementation`. `verified` ist kein Merge- oder Release-Go.

### 4.3 Requirement und Acceptance Criterion

`draft → in_review → accepted`

Ausnahmezustände: `decision_required`, `change_requested`, `blocked`, `rejected`, `superseded`.

### 4.4 Test Case und Test Run

Testfall-Definition: `draft → ready → retired` beziehungsweise `superseded`.

Testlauf-Ergebnis: `not_tested`, `passed`, `failed`, `blocked`, `invalid`.

Definition und Ergebnis bleiben getrennt. Ein geänderter Testfall überschreibt keinen früheren Testlauf. `skipped` zählt als `not_tested`, niemals als `passed`.

### 4.5 Finding

Workflow: `open → triaged → assigned → correction_in_progress → ready_for_retest → verified_closed`.

Alternative Endzustände: `accepted_risk` nur durch Peter, `deferred` mit Zielversion, `rejected_as_invalid` mit Evidenz, `superseded`.

Schwere bleibt separat: `BLOCKER`, `MAJOR`, `MINOR`, `NOTE`.

Klasse bleibt separat: `Bug`, `Regression`, `Specification Gap`, `Feature Gap`, `Vision Gap/Drift`, `Knowledge Gap`, `Non-functional Bug`, `Non-functional Issue`, `Test Gap`, `Test Defect`, `Environment/Tool Block`, `Security/Critical Protection`.

## 5. Review = OK

1. Atlas friert eine exakte Artefaktversion und die Traceability-Matrix ein.
2. Archibald bestätigt Vollständigkeit der Spezifikation, aber nicht deren Freigabe.
3. Argus liefert `RA_AGREED` oder nur dokumentierte nicht-blockierende Befunde.
4. Sentinel bestätigt Testbarkeit; kein Pflicht-AC ist `blocked`, `invalid` oder ohne Testabdeckung.
5. Forge liefert `CA_FEASIBLE`, ohne Anforderungen umzudeuten.
6. Nova liefert bei Vision-/Experience-Bezug `ALIGNED`.
7. Atlas prüft, dass alle Beiträge dieselbe Version betreffen und kein offener `BLOCKER` oder nicht akzeptierter `MAJOR` besteht.
8. Der Sollstand wird `accepted`. Erst Peters `USER_GO` setzt die betroffenen Stories/Capabilities auf `ready_for_implementation`.
9. Nach Forges Change Set wechseln sie zu `ready_for_qa`. Sentinel testet den exakten Stand; Argus führt den Post-Review aus; Nova prüft bei Bedarf das Erlebnis.
10. Bei vollständigem Nachweis wird `verified`. Merge/Release und danach `done` bleiben eine eigene menschliche Entscheidung.

## 6. Review = nicht OK

1. Jeder Befund erhält stabile ID, Klasse, Schwere, exakte Fundstelle, betroffene IDs, Evidenz, Owner und erwarteten Nachweis.
2. Korrigierbare Sollabweichung setzt das Artefakt auf `change_requested`; fehlende Entscheidung, Quelle, Umgebung oder Fähigkeit setzt es auf `blocked` beziehungsweise `decision_required`.
3. Routing:
   - unklarer oder widersprüchlicher Sollstand → Archibald;
   - Wissens-/Quellenlücke → Scout;
   - Machbarkeits- oder Implementierungsdefekt → Forge;
   - Testbarkeitslücke → Sentinel und Archibald;
   - Risiko, Sicherheit oder Kompatibilität → Argus;
   - Vision Drift/Experience Gap → Nova;
   - Scope-, Risiko- oder Produktentscheidung → Peter über Atlas.
4. Korrektur erzeugt eine neue Version. Der alte Stand und sein fehlgeschlagenes Review bleiben unverändert nachvollziehbar.
5. Re-Review prüft mindestens ursprünglichen Befund, betroffene Traceability-Pfade und relevante Regressionen auf dem neuen exakten Stand.
6. Nach zwei erfolglosen Korrekturzyklen stoppt Atlas den Loop und legt Peter Ursachen, Optionen, Risiken und Empfehlung zur Entscheidung vor.
7. Schweigen, Zeitablauf, grüne CI oder akzeptiertes Restrisiko ändern keinen `failed`-/`blocked`-Teststatus in `passed`.

## 7. Rollenvertrag

| Rolle | Beitrag |
|---|---|
| Atlas | Register, Versionen, Routing, Gates, konsolidierter Status und Entscheidungsvorlage |
| Nova | Vision, Alignment, Experience und Change Requests; keine Freigabe |
| Scout | belegtes Wissen und Wissensstatus; keine Sollentscheidung |
| Archibald | Epics/Stories/Capabilities in Requirements und ACs überführen; keine Implementierung/Eigenabnahme |
| Forge | Machbarkeit und Umsetzung des akzeptierten, freigegebenen Stands; keine Solländerung/Eigenabnahme |
| Argus | unabhängiges Review und Risiko-/Kompatibilitätsprüfung |
| Sentinel | Testdesign, Testlauf und reproduzierbare Ergebnisse; keine Reparatur oder Kriterienabschwächung |
| Peter | Scope-, Risiko-, Nutzer-, Implementierungs-, Merge- und Releaseentscheidungen |

## 8. Mindest-Traceability-Matrix

| Epic | Story/Capability | Requirement | AC | Test Case | letzter Test Run | Findings | Status |
|---|---|---|---|---|---|---|---|

Die Matrix ist eine Projektion der versionierten Einzelartefakte, keine zweite Wahrheitsquelle.

## 9. Offene Prozessnachweise

1. Archibalds Ausgabeprotokoll um Epic-/Story-/Capability- und Traceability-Felder erweitern.
2. Forges noch zu erstellende technische Rollendefinition auf akzeptierte IDs, exakte Version und `USER_GO` begrenzen.
3. Argus- und Sentinel-Verträge auf Statusübergänge und Matrixprüfung abgleichen.
4. Positiv- und Negativtest eines vollständigen Pfads einschließlich Failed Review, neuer Version und Retest durchführen.
5. Teambeiträge einholen; Peter und Atlas entscheiden als Process Owner über Übernahme ins Rulebook.

## 10. Gate-Status

- Prozessentwurf: `in_review`;
- bestehendes Rulebook: unverändert;
- Agentendefinitionen: unverändert;
- Implementierung: nicht freigegeben.
