# Agentarium Work-Item Lifecycle — Prozessentwurf

Version: 0.2 DRAFT  
Stand: 13.10.2026  
Task: `AGENTARIUM-PROC-WIL-001`  
Prozessbasis: Agentarium Rulebook V1.0 DRAFT, Commit `69941ee182d698753c99e4e30c4836b320eeda09`  
Status: Revision nach `QA_REPORT V1 = FAIL`, `RA_REVIEW V1 = PASS_WITH_NOTES`, `NOVA_READY V1 = CHANGE_REQUESTED` und `RKA PROCESS_PROPOSAL V1`; keine Prozess-, Implementierungs-, Merge- oder Veröffentlichungsfreigabe

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
2. Jede bindende Anforderung verweist auf mindestens ein `US` oder `CAP`. Wissensabhängigkeiten werden mit `knowledge_id`, `knowledge_record_version`, `knowledge_package_version` und `evidence_state` gepinnt. Der Wissenseintrag nennt Quellen-ID, genaue Revision beziehungsweise Commit und Fundstelle, `verified_at`, `valid_for`, Einschränkungen und Revalidierungsauslöser. Ein Link oder der jeweils neueste Stand genügt nicht.
3. Jedes Requirement besitzt mindestens ein AC oder wird als `blocked` geführt.
4. Jedes AC besitzt vor G5 mindestens einen `TC` oder einen offenen `Test Gap`, der das Gate schließt.
5. Jeder Test Run nennt exakte Versionen von `TC`, `AC`, Spezifikation, Commit/Build, Umgebung und Testdaten.
6. Findings verweisen auf die verletzten oder fehlenden IDs. Ein Finding verändert keine Anforderung stillschweigend.
7. Löschung ist unzulässig, sobald ein Artefakt referenziert wurde; Ablösung erfolgt durch neue Version plus `superseded_by`.
8. Bei Visionbezug verweist die Kette zusätzlich auf `vision_id`, `vision_version` und die betroffenen Intent-Kernel-Merkmale. Produktziele und Nutzerentscheidungen verwenden `decision_id + decision_version`. Eine kreative Entscheidung ist keine Bestätigung eines externen Sachverhalts; ihre sachlichen Voraussetzungen bleiben belegpflichtig.

### 3.1 Wissens-Gate und Revalidierung

- `confirmed` darf eine bindende Anforderung stützen.
- `derived` darf dies nur, wenn sämtliche materiellen Eingänge `confirmed` sind und Herleitung, Formeln, Einheiten sowie Gültigkeitsbereich reproduzierbar dokumentiert sind.
- `conflicting`, `provisional`, `not_evidenced`, `not_accessible` und nicht reproduzierbares `derived` schließen nur den betroffenen Anforderungs- und Gate-Pfad. Unabhängige Pfade dürfen weiterarbeiten.
- Peters Risikozustimmung verändert keinen Evidenzstatus.
- Neue materielle Gegenbelege erzeugen `RKA_CONFLICT`. Änderungen von Quellenrevision, Konfiguration, Messung oder Berechnungseingängen lösen Revalidierung aus. Scout meldet `KNOWLEDGE_STALE` mit betroffenen IDs und vorgeschlagener Impact-Menge; Atlas verfolgt die Abhängigkeiten zu Requirements, ACs, Testfällen und Gates.
- Bis zur Neubewertung bleibt der betroffene aktuelle Gate-Pfad geschlossen. Historische Reviews und Testläufe bleiben erhalten; neue Fassungen verwenden `supersedes` und `superseded_by`.
- Zusätzliche Bestätigung ohne materielle Änderung erzwingt keine neue Spezifikation. Atlas dokumentiert die Impact-Entscheidung.

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

Testfall-Definition: `draft → ready → retired` beziehungsweise `superseded`. Archibald beschreibt den Sollbezug; Sentinel bestätigt `ready`, wenn mindestens Vorbedingungen, Eingaben/Testdaten, erwartetes beobachtbares Ergebnis, Umgebung, Evidenzmethode, zulässige Aktionen und Cleanup reproduzierbar festgelegt sind.

Testlauf-Ergebnis: `not_tested`, `passed`, `failed`, `blocked`, `invalid`.

Definition und Ergebnis bleiben getrennt. Ein geänderter Testfall überschreibt keinen früheren Testlauf. `skipped` zählt als `not_tested`, niemals als `passed`.

### 4.5 Finding

Workflow: `open → triaged → assigned → correction_in_progress → ready_for_retest → verified_closed`. Ein fehlgeschlagener Retest setzt den Befund auf `reopened` und anschließend zurück zu `assigned`; der fehlgeschlagene Testlauf bleibt erhalten. Bei `blocked` oder `invalid` bleibt das Finding materiell offen und führt Grund sowie nächsten Owner.

Alternative Verwaltungszustände: `accepted_risk` nur für `MAJOR` durch Peters versionierte Entscheidung mit Begründung, Geltungsbereich und betroffenen Gates; `deferred` mit Zielversion; `rejected_as_invalid` mit Evidenz; `superseded` mit Pflichtverweis auf einen Nachfolger.

Ein `BLOCKER` kann nicht gatewirksam als Risiko akzeptiert, verschoben oder erledigt werden. `deferred` beseitigt weder die Gate-Sperre eines fortbestehenden BLOCKER noch eines nicht akzeptierten MAJOR. Bei `superseded` bleibt die ungelöste materielle Sperre über den Nachfolger wirksam. Gates bewerten die ungeklärte materielle Abweichung, nicht bloß den Workflowstatus. Risikozustimmung verändert keinen Teststatus.

Schwere bleibt separat: `BLOCKER`, `MAJOR`, `MINOR`, `NOTE`.

Klasse bleibt separat: `Bug`, `Regression`, `Specification Gap`, `Feature Gap`, `Vision Gap/Drift`, `Knowledge Gap`, `Non-functional Bug`, `Non-functional Issue`, `Test Gap`, `Test Defect`, `Environment/Tool Block`, `Security/Critical Protection`.

## 5. Review = OK

1. Atlas friert exakte Artefakt-, Vision-/Entscheidungs- und Wissenspaket-/Recordversionen sowie die Traceability-Matrix ein.
2. Archibald bestätigt Vollständigkeit der Spezifikation, aber nicht deren Freigabe.
3. Argus liefert `RA_AGREED` oder nur dokumentierte nicht-blockierende Befunde.
4. **Testability-Gate:** Jedes bindende AC ist `accepted`, besitzt mindestens einen passenden `ready`-Testfall mit reproduzierbarem Orakel und hat keine offene Testabdeckungslücke. Testlaufstatus werden an diesem Vorimplementierungs-Gate nicht als AC-Status verwendet.
5. Forge liefert `CA_FEASIBLE`, ohne Anforderungen umzudeuten.
6. Nova liefert bei Vision-/Experience-Bezug `ALIGNED`.
7. Atlas prüft, dass alle Beiträge dieselbe Version betreffen, jede Wissensabhängigkeit §3.1 erfüllt und keine ungeklärte materielle BLOCKER-Abweichung oder nicht akzeptierte MAJOR-Abweichung besteht.
8. Der Sollstand wird `accepted`. Erst Peters `USER_GO` setzt die betroffenen Stories/Capabilities auf `ready_for_implementation`.
9. Nach Forges Change Set wechseln sie zu `ready_for_qa`. Sentinel testet den exakten Stand; Argus führt den Post-Review aus; Nova prüft bei Bedarf das Erlebnis.
10. **Verification-Gate:** `verified` ist nur zulässig, wenn jedes Pflicht-AC der akzeptierten Version am exakten Lieferstand durch baseline-passende, gültige Testläufe erfüllt ist. `failed`, `blocked`, `invalid` und `not_tested` sind kein Erfüllungsnachweis. Die Baseline umfasst Spezifikation/AC, Testfall, Commit/Build, Fixture/Testdaten, Umgebung und bei wissensabhängigen ACs die Wissensversionen. Akzeptiertes Risiko ersetzt keinen bestandenen Test; eine Lieferung mit Ausnahme wird nicht als vollständig `verified` bezeichnet. Merge/Release und danach `done` bleiben eine eigene menschliche Entscheidung.
11. Änderungen an Sollstand, Commit/Build, Testfall, Fixture, Umgebung oder materieller Wissensbasis benötigen eine dokumentierte Impact-Analyse und die relevanten Retests. Frühere Evidenz wird nicht automatisch übernommen. Ein neuer verbindlicher Sollstand benötigt neue Review-/Freigabereferenzen; altes `USER_GO` gilt nicht stillschweigend weiter.

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
   - Feature Gap oder Vision Gap ohne Verletzung des akzeptierten Sollstands → versionierter Change Request mit Impact-Analyse; Peter entscheidet über Atlas, bevor neue Requirements/ACs und gegebenenfalls ein neues `USER_GO` entstehen.
   - Vision Drift gegen einen bereits akzeptierten Intent Kernel → Korrekturpfad; Änderung des Intent Kernels → neue gemeinsame Entscheidung von Peter und Atlas.
4. Korrektur erzeugt eine neue Version. Der alte Stand und sein fehlgeschlagenes Review bleiben unverändert nachvollziehbar.
5. Re-Review prüft mindestens ursprünglichen Befund, betroffene Traceability-Pfade und relevante Regressionen auf dem neuen exakten Stand.
6. Nach zwei erfolglosen Korrekturzyklen stoppt Atlas den Loop und legt Peter Ursachen, Optionen, Risiken und Empfehlung zur Entscheidung vor.
7. Schweigen, Zeitablauf, grüne CI oder akzeptiertes Restrisiko ändern keinen `failed`-/`blocked`-Teststatus in `passed`.
8. Archibald und Forge ersetzen fehlendes Wissen weder durch Schätzungen noch durch externe Recherche außerhalb ihres Rollenauftrags. Sie melden den Knowledge Gap an Atlas; Atlas beauftragt Scout. Fehlender Zugriff wird als `BLOCKED_TOOL` beziehungsweise `not_accessible` dokumentiert und erteilt weder neue Werkzeugrechte noch eine Delegationsfreigabe.

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

| Epic | Story/Capability | Vision/Entscheidung | Wissen | Requirement | AC | Test Case | baseline-passender Test Run | Findings | Status |
|---|---|---|---|---|---|---|---|---|---|

Die Matrix ist eine Projektion der versionierten Einzelartefakte, keine zweite Wahrheitsquelle.

Ein kleiner `standalone`-Capability-Pfad darf als ein versionierter Datensatz mit automatisch abgeleiteter Matrix geführt werden. Die IDs erzwingen Nachvollziehbarkeit, nicht acht separate Dokumente oder zusätzliche Meetings.

## 9. Offene Prozessnachweise

1. Archibalds Ausgabeprotokoll um Epic-/Story-/Capability- und Traceability-Felder erweitern.
2. Forges noch zu erstellende technische Rollendefinition auf akzeptierte IDs, exakte Version und `USER_GO` begrenzen.
3. Argus- und Sentinel-Verträge auf Statusübergänge und Matrixprüfung abgleichen.
4. Die folgenden Positiv- und Negativtests des vollständigen Prozesses durchführen:

| Test | Fixture | Erwartung |
|---|---|---|
| WIL01 | vollständige Kette, identische Versionen, alle Pflichtreviews | Sollstand `accepted`; ohne `USER_GO` keine Umsetzung |
| WIL02 | bindendes R ohne AC oder AC ohne `ready`-TC | Gate geschlossen; Test Gap mit Owner |
| WIL03 | Pflichtbeitrag auf anderer Artefaktversion | kein Accepted-/Implementierungsübergang |
| WIL04 | TC geändert, alter TR `passed` | alter TR bleibt, zählt aber nicht automatisch für neue Baseline |
| WIL05 | Pflichtlauf `failed`, `blocked`, `invalid` oder `not_tested` | kein `verified`; korrektes Finding/Routing |
| WIL06 | Korrektur, Retest erneut `failed` | Finding `reopened`/`assigned`; beide Fehlernachweise sichtbar |
| WIL07 | Korrektur, Retest `passed` am neuen exakten Stand | Finding mit TR-/Baseline-Referenz geschlossen; relevante Regressionen geprüft |
| WIL08 | BLOCKER/MAJOR als deferred oder accepted_risk | BLOCKER bleibt Gate-Sperre; MAJOR nur mit Peters Entscheidung; Test bleibt unverändert |
| WIL09 | zwei erfolglose Korrekturzyklen | Atlas stoppt Loop und legt Peter Entscheidung vor |
| WIL10 | referenziertes Artefakt soll gelöscht werden | Ablehnung; neue Version mit `superseded_by` |
| WIL11 | Visionanforderung mit Nutzerentscheidung und sachlicher Voraussetzung | Intent bis Experience-Test verfolgbar; Entscheidung akzeptiert, Sachbehauptung belegpflichtig |
| WIL12 | nachträglicher Wunsch außerhalb akzeptierten Scopes | Change Request; kein automatischer Bugfix oder `USER_GO` |
| WIL13 | alle sechs Wissensstatus am selben Requirement-Pfad | nur `confirmed` und reproduzierbares `derived` aus bestätigten Eingängen können binden |
| WIL14 | materielle Quellen-/Konfigurationsänderung | nur abhängige Pfade gesperrt; historische TR/Reviews bleiben erhalten |
| WIL15 | Quelle nicht zugänglich | Knowledge Gap/`not_accessible`; keine erfundene Evidenz oder unerlaubte Recherche |
5. Nova-, Scout-, Argus- und Sentinel-Beiträge wurden in V0.2 eingearbeitet; Delta-Reviews stehen aus. Archibalds und Forges Beiträge bleiben bis zu einem technisch verifizierten direkten Aufruf ausständig. Peter und Atlas entscheiden als Process Owner über die Übernahme ins Rulebook.

## 10. Gate-Status

- Prozessentwurf: `change_requested`; V0.2 im Delta-Review;
- bestehendes Rulebook: unverändert;
- Agentendefinitionen: unverändert;
- Implementierung: nicht freigegeben.

## 11. Änderungshistorie

- V0.1: erster Atlas-Entwurf, SHA-256 `d9a37bcbbc0a07d42e16b3adb013713317b54dac8062ee4de6cedafc02b524ab`.
- V0.1-Reviews: Sentinel `FAIL`, Argus `PASS_WITH_NOTES` mit einem MAJOR, Nova `CHANGE_REQUESTED`, Scout `PROCESS_PROPOSAL V1`.
- V0.2: Testability-/Verification-Gates, materielle Gate-Sperren, Retest-Rückführung, Vision-/Change-Request-Vertrag, versionierte Wissensabhängigkeiten, Revalidierung und WIL01–WIL15 ergänzt. Delta-Reviews ausstehend.
