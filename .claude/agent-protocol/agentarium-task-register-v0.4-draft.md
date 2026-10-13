# Agentarium Task Register und externe Übergaben — Entwurf

Version: 0.4 DRAFT
Stand: 13.10.2026  
Repository: `pahlborn/gt40-engine`  
Branch: `agent/agentarium-process-v1-draft`  
Base: `main@5cc1e42c28f7daf3e3cc07f2a038742f52c870ba`  
Register-Head vor dieser Revision: `a08e8dd37ad5e137ab9459646b3fc11361ac969a`
Status: Process-Agent-Epic ergänzt; automatischer Transport bis zum Nachweis eines getrennten Publishers beziehungsweise Relay-Ingress `blocked`

## 1. Verbindliche Verwendung

Dieses Register ist die gemeinsame, versionierte Übergabequelle. Es ersetzt kein Rollenprofil, keine fachliche Prüfung, kein `USER_GO` und kein Relay. Eine Aufgabe gilt beim Host erst als empfangen, wenn ein getrennt nachgewiesener Übergabehost `HOST_RECEIVED` zum exakten Auftrag registriert hat. Der Fachlauf gilt erst nach einem separaten `WORKER_IDENTITY_ACK` als startbereit. Beide Signale belegen weder Arbeitsabschluss noch fachliche Richtigkeit.

Externe Antworten dürfen nur durch einen getrennten, eng berechtigten Publisher oder einen nachgewiesenen Relay-Ingress unverändert mit ihrer vollständigen Envelope in PR #51 dokumentiert werden. Fachrollen erhalten dadurch keine GitHub-Schreibrechte. Bis dieser Rückkanal technisch nachgewiesen ist, bleibt die automatische Zustellung `blocked`; weder Atlas noch eine andere Rolle darf einen Auftrag als zugestellt, aktiv oder abgeschlossen melden.

## 2. Register

| Feld | Work-Item Lifecycle |
|---|---|
| Task ID | `AGENTARIUM-PROC-WIL-001` |
| Titel | Epic-zentrierter Work-Item Lifecycle |
| Nutzerergebnis | Ein `USER_GO` pro exakter Epic-Version; keine Einzel-GOs für Stories, Capabilities, Requirements, ACs oder Testfälle |
| Workflowstatus | `in Review` |
| Ergebnisstatus | ChatGPT-Delta-Reviews `bestanden`; externe Beiträge `offen`; Runtime `nicht geprüft` |
| Verantwortlich aktuell | Atlas für Transportklärung; Archibald und Forge noch nicht technisch zugestellt |
| Scope | WIL V0.4, Rollenvertragsfolgen, Spec-/Feasibility-Prüfung |
| Ausschlüsse | keine Implementierung, keine Agentendefinitionsänderung, kein Merge, kein Release |
| Risiko | ungetestete Statusautomatik oder unklare externe Rollenidentität könnte Gates umgehen |
| Priorität | hoch |
| Abhängigkeiten | bestätigter Übergabehost, getrennte Claude-Sitzungen, lesender Zugriff, autorisierter Publisher oder Relay-Ingress |
| Spezifikation | `.claude/agent-protocol/agentarium-work-item-lifecycle-v0.4-draft.md` |
| SHA-256 | `2b2a9cbf4791c9bfe8195a0a1c75b7414e7b939fd59f7ca165df47aec100cddd` |
| Evidenz | Nova V3 `ALIGNED`; Scout V3 `RKA_READY`; Argus V4 `RA_AGREED`; Sentinel V4 `PASS_WITH_LIMITS` |
| Offene Entscheidung | Übernahme in das Rulebook nach Archibald-/Forge-Beitrag und Runtime-Nachweisen; Owner Peter + Atlas |
| Nächste Aktion | Publisher/Ingress und Übergabehost nach §3 technisch definieren und isoliert prüfen; erst danach §§4–5 zustellen |
| Eventkanal | `blocked`; PR #51 ist Datensatz, aber für diese neuen Sitzungen nicht als Rückkanal verifiziert |
| Cleanup | Draft-Branch und PR #51 offen; keine Timer oder Abonnements durch dieses Register angelegt |

| Feld | Claude Relay |
|---|---|
| Task ID | `AGENTARIUM-RELAY-001` |
| Titel | Atlas–Claude Relay |
| Nutzerergebnis | Ergebnisse zwischen Atlas und Claude-Rollen ohne biologisches Kopieren austauschen |
| Workflowstatus | `in Review` |
| Ergebnisstatus | Dokumentreview `bestanden`; Forge-Feasibility und Runtime `offen` |
| Verantwortlich aktuell | Atlas für Transportklärung; Forge-Sitzung noch nicht bestätigt |
| Scope | Relay V0.4, Rechte-, Status-, Crash-, Race-, Timing-, Policy- und End-to-End-Machbarkeit |
| Ausschlüsse | keine Implementierung, keine GitHub-App-Anlage, keine Secrets, kein Merge |
| Risiko | falsche Zustellung, doppelte Verarbeitung oder Rechteausweitung |
| Priorität | hoch |
| Abhängigkeiten | Forge-Rollenidentität, Übergabehost, autorisierter Publisher/Ingress, Repositoryzugriff; später separate Runtime-Freigabe |
| Spezifikation | `.claude/agent-protocol/agentarium-relay-spec-v0.4-draft.md` |
| SHA-256 | `a196c560eb38f0390b2996d1b4fdf62e12fd9c0345f0f53bb1d0a1dc06747a41` |
| Evidenz | Argus V4 `RA_AGREED`; Sentinel `PASS_WITH_LIMITS`; Nova V3 `ALIGNED` |
| Offene Entscheidung | Architektur erst nach Forge-Feasibility und Runtime-Testplan; Owner Peter + Atlas |
| Nächste Aktion | Transportvertrag nach §3 erfüllen; danach Forge-Auftrag aus §5 zustellen |
| Eventkanal | `blocked` |
| Cleanup | keine Automation, kein Timer und keine Testressource aktiv |

| Feld | Process Agent |
|---|---|
| Task ID | `E-PROC-AGENT-001` |
| Titel | Cadence — Process Agent für Lernen, Prozesspflege und Skillverbesserung |
| Nutzerergebnis | Das gesamte Team kann Prozessdefizite, Reibung, Beinahefehler, erfolgreiche Muster und Verbesserungsvorschläge melden; ein unabhängiger, read-only Claude-Agent bereitet daraus überprüfbare Änderungen und Schulungen vor |
| Workflowstatus | `Konzeptreview bestanden; Entscheidung offen` |
| Ergebnisstatus | Konzept V0.3; Argus `RA_AGREED V2`; Sentinel `QA_REPORT V2` `PASS_WITH_LIMITS`; Runtime und Transport nicht geprüft; keine Umsetzungsfreigabe |
| Verantwortlich aktuell | Atlas für Konsolidierung; Peter und Atlas gemeinsam für Konzept- und Prozessentscheidung |
| Scope | Rollenvertrag, direkter Teamkanal, Erfahrungsfälle, Verbesserungszyklus, Skill-/Trainingspflege, Minimalrechte und Abnahmetests |
| Ausschlüsse | keine Agentendefinition, keine Skill-/Rulebook-Änderung, keine Automation, keine Implementierung, kein Merge, kein Release |
| Risiko | Selbstbestätigung, Überwachungskultur, verdeckte Schreibwege, unzuverlässige Ereigniszustellung oder Vermischung mit Atlas' Orchestrierung |
| Priorität | hoch |
| Abhängigkeiten | Konzeptentscheidung, unabhängige Reviews, Archibald-Spezifikation, technische Rechteprüfung, Relay/Publisher-Nachweis und exaktes Epic-`USER_GO` vor Umsetzung |
| Konzept | `.claude/agent-protocol/agentarium-process-agent-concept-v0.1-draft.md` |
| SHA-256 | `a63c984a541f37c4c82ca40907cc514e3a423d19d96ed8ae78f5680f0eba7e24` |
| Evidenz | Nova `NOVA_READY V1`; Scout `RKA_READY V1`; Argus `RA_AGREED V2`; Sentinel `QA_REPORT V2` `PASS_WITH_LIMITS`; Reviews bezogen sich auf inhaltsgleichen V0.2-Stand `f7cffd…`, V0.3 ändert nur Versions- und Statusmetadaten |
| Offene Entscheidung | persönlicher Name `Cadence` und Freigabe der empfohlenen Kombination; Owner Peter + Atlas |
| Nächste Aktion | Reviews konsolidieren, Konzept bei Bedarf revidieren; danach Archibald-Spezifikation vorbereiten. Keine Umsetzung ohne Epic-`USER_GO` |
| Eventkanal | `blocked`; direkte Melderechte sind fachlich definiert, Transport und persistente Registrierung aber noch nicht nachgewiesen |
| Cleanup | keine Automation, kein Timer, keine neue Claude-Sitzung und keine Agentendefinition durch dieses Register angelegt |

## 3. Getrennter Transport-, Identitäts- und Fristvertrag

### 3.1 Rollen

| Rolle | Erlaubte Aktionen | Verbotene Aktionen | Aktueller Nachweis |
|---|---|---|---|
| Übergabehost | exaktes Register und gepinnte Quellen lesen; Auftrag/Quelle prüfen; genau eine bezeichnete Worker-Sitzung starten; Laufzeitmetadaten und Handback erfassen | fachliche Antwort verfassen, Auftrag verändern, GitHub schreiben, weitere Worker starten, Rechte erweitern | nicht vorhanden |
| Archibald-Worker | genau den SA-Auftrag mit seinem technisch erzwungenen Read-only-Profil bearbeiten und einmalig zurückgeben | Veröffentlichung, Mutation, weitere Agenten/Sitzungen, Rechteänderung | Definition grundsätzlich getestet; neue Sitzung nicht bestätigt |
| Forge-Worker | genau den CA-Feasibility-Auftrag in einer getrennten Sitzung bearbeiten und einmalig zurückgeben | Implementierung, Veröffentlichung, Mutation, weitere Agenten/Sitzungen, Rechteänderung | nicht vorhanden |
| Publisher/Relay-Ingress | nach gültigem Receipt ausschließlich den unveränderten zulässigen Handback an PR #51 anhängen; Verarbeitungsbeleg speichern | Dateien, Branches, PR-Metadaten oder Handback verändern; Fachentscheidungen treffen; neue Agenten starten | nicht vorhanden; daher Transport `blocked` |

Der Übergabehost ist ein befristeter Bootstrap-Transport, kein abgenommener Relay und keine Fachrolle. Forge läuft nicht im Übergabehost, sondern in einer getrennten Worker-Sitzung. Keine dieser Rollen erhält Rechte allein durch dieses Register.

### 3.2 Zweistufiger Empfang und Identität

Stufe 1 vor jeder Worker-Initialisierung:

`[AGENTARIUM:<TASK-ID>:HOST:HOST_RECEIVED:V1]`

Pflichtfelder:

- `request_ref`, `request_version` und vom Dispatcher gespeicherter `request_body_sha256`;
- technische Parent-/Host-Sitzungskennung;
- geplante technische Zielrolle und vorab geprüfte Agentendefinition mit Commit beziehungsweise Hash; dies ist noch keine beobachtete Worker-Identität;
- gelesener Quell-Commit, Pfade, Blob-IDs und Dokument-SHA-256;
- Publisher-/Ingress-Actor und der vorgesehene unveränderte Ergebnisweg;
- Stop-Bedingung und `host_received_by`.

Nur nach gültigem `HOST_RECEIVED` darf der Host genau einen Worker kontrolliert initialisieren. Dieser Worker bleibt bis zur zweiten Prüfung fachlich geparkt. Stufe 2:

`[AGENTARIUM:<TASK-ID>:<SA|CA>:WORKER_IDENTITY_ACK:V1]`

Pflichtfelder:

- Referenz auf das gültige `HOST_RECEIVED` und denselben Request;
- tatsächliche Worker-Sitzungskennung;
- tatsächlich geladene Rolle/Agentendefinition mit beobachtetem Commit beziehungsweise Hash;
- tatsächlich sichtbares erlaubtes Werkzeugprofil;
- unabhängig inspizierbare Laufzeitmetadaten;
- vorgesehener Ergebnisweg, Stop-Bedingung, `worker_identity_by` und `result_by`.

Ein vom Parent berechneter Hash ist als Fremdbeleg zu kennzeichnen. Falscher Request, Commit, Host oder Publisher verhindert bereits die Worker-Initialisierung. Falscher Definitionsstand, Worker, Actor oder Werkzeugbestand nach Initialisierung erzeugt `IDENTITY_MISMATCH`; der Worker führt keine fachliche Arbeit aus und wird beendet. Ein Selbstbericht ohne unabhängig inspizierbare Laufzeitmetadaten genügt nicht.

### 3.3 Fristen und Recovery

- `host_received_by`: spätestens 60 Sekunden nach nachgewiesener Übergabe an den Host.
- `worker_identity_by`: spätestens 60 Sekunden nach gültigem `HOST_RECEIVED`.
- `result_by` Archibald: spätestens 5 Minuten nach gültigem `WORKER_IDENTITY_ACK`.
- `result_by` Forge: spätestens 8 Minuten nach gültigem `WORKER_IDENTITY_ACK`.
- Kein `HOST_RECEIVED` oder `WORKER_IDENTITY_ACK` bis zur jeweiligen Frist: `SA_PAUSED` beziehungsweise `CA_PAUSED` mit `TIMEOUT_RECEIPT` oder `TIMEOUT_IDENTITY`.
- Kein Ergebnis bis zur Frist: `SA_PAUSED` beziehungsweise `CA_PAUSED` mit `TIMEOUT_RESULT`, letzter bestätigter Stand und erhaltene Evidenz.
- Timeout beendet den Laufstatus. Es gibt keinen automatischen Neustart, keine Warteschleife und keine stillschweigende Sitzungsfortsetzung. Atlas entscheidet anhand der Ursache über genau einen neuen versionierten Auftrag oder eskaliert an Peter.
- Quota-, Token-, Werkzeug- oder Plattformprobleme werden als technische Ursache benannt und ändern kein fachliches Ergebnis.

### 3.4 Persistente Korrelation und Exactly-once

Für Receipt und Ergebnis speichert der Publisher/Ingress mindestens:

`task_id`, `source_url`, `source_comment_id`, `raw_body_sha256`, `semantic_payload_sha256`, `sender_role`, `signal`, `signal_version`, `request_ref`, `request_body_sha256`, `session_ref`, `worker_ref`, `publisher_actor`, `processing_result`, `processed_at`.

Regeln:

1. Der semantische Exactly-once-Schlüssel lautet `task_id + request_ref + request_body_sha256 + sender_role + signal + signal_version`.
2. Innerhalb dieses Schlüssels gilt gleicher `semantic_payload_sha256` auch unter anderer Kommentar-URL als Duplikat; kein zweiter Zustandsübergang.
3. Innerhalb dieses Schlüssels erzeugt ein anderer `semantic_payload_sha256` `CONFLICT`; keine fachliche Übernahme. Transportabhängige Felder beeinflussen nur `raw_body_sha256`, nicht den semantischen Hash.
4. Receipt-, Worker-Identity- und Ergebnissignale besitzen verschiedene `signal`-Werte und dürfen für denselben Request jeweils genau einmal verarbeitet werden.
5. Falsche oder alte Sitzung, Rolle, Quellversion, Request-Referenz oder editiertes Signal erzeugt `STALE_OR_MISMATCH`; keine Übernahme.
6. Die vollständige unveränderte Antwort bleibt Evidenz. Policy-geblockter Inhalt wird nicht erneut ausgegeben; gespeichert werden nur zulässige Metadaten und der Blockstatus.
7. Fehlt der persistente Verarbeitungsbeleg, darf Atlas keine erfolgreiche Zustellung oder genau-einmalige Verarbeitung behaupten.

## 4. Übergabe an Archibald

```text
[AGENTARIUM:AGENTARIUM-PROC-WIL-001:MA:MA_REQUEST:V4]

Projekt: Agentarium
Absender: Atlas / Main Agent
Empfänger: Archibald / technischer Subagent `spec-agent`
Phase: externer Spezifikations- und Rollenvertragsabgleich
Signal: MA_REQUEST V4
Request-Ref: AGENTARIUM-PROC-WIL-001/MA_REQUEST/V4
Beantwortete Quelle: WIL V0.4 DRAFT

Repository: pahlborn/gt40-engine
Branch: agent/agentarium-process-v1-draft
Commit: 5a36208727842a58f1dc569d33f520c1ac7bb0cc
Pfad: .claude/agent-protocol/agentarium-work-item-lifecycle-v0.4-draft.md
SHA-256: 2b2a9cbf4791c9bfe8195a0a1c75b7414e7b939fd59f7ca165df47aec100cddd

Auftrag:
1. Prüfe, ob WIL V0.4 vollständig und widerspruchsfrei in Archibalds Spezifikationsprozess und Ausgabeprotokoll abbildbar ist.
2. Prüfe insbesondere Epic-ID/-Version, Epic-USER_GO-Referenz, aktuelle technische Baseline, Story/Capability/Requirement/AC/TC-Traceability sowie Change-/Rebaseline-Fälle.
3. Liefere nur erforderliche Änderungen an Prozessvertrag oder Ausgabeprotokoll als versionierten Vorschlag. Keine Datei ändern.
4. Melde einen Identitäts- oder Rechtewiderspruch als Blocker; keine stillschweigende Rollenannahme.

Erlaubt: Read, Glob, Grep und freigegebene GitHub-Lesewerkzeuge.
Verboten: Schreiben, Implementieren, Committen, Pushen, PR/Kommentar veröffentlichen, weitere Agenten/Sitzungen starten, Werkzeuge oder Rechte erweitern.

Erwartetes Signal: SA_READY V4 oder genau eine SA_QUESTION V4.
Receipt/Fristen: ausschließlich gemäß §3; `HOST_RECEIVED` vor Initialisierung, danach geparktes `WORKER_IDENTITY_ACK`; vor beiden gültigen Stufen keine fachliche Arbeit, `result_by` = Worker-Identity + 5 Minuten.
Stop: nach einer vollständigen Rückgabe an die aufrufende Claude-Hauptsitzung.
```

## 5. Übergabe an Forge

```text
[AGENTARIUM:AGENTARIUM-RELAY-001:MA:MA_REQUEST:V4]

Projekt: Agentarium
Absender: Atlas / Main Agent
Empfänger: Forge / Coding Agent
Phase: externe Machbarkeitsprüfung ohne Umsetzung
Signal: MA_REQUEST V4
Request-Ref: AGENTARIUM-RELAY-001/MA_REQUEST/V4
Beantwortete Quellen: Relay V0.4 DRAFT und WIL V0.4 DRAFT

Repository: pahlborn/gt40-engine
Branch: agent/agentarium-process-v1-draft
Commit: 5a36208727842a58f1dc569d33f520c1ac7bb0cc
Pfade:
- .claude/agent-protocol/agentarium-relay-spec-v0.4-draft.md
- .claude/agent-protocol/agentarium-work-item-lifecycle-v0.4-draft.md
SHA-256 Relay: a196c560eb38f0390b2996d1b4fdf62e12fd9c0345f0f53bb1d0a1dc06747a41
SHA-256 WIL: 2b2a9cbf4791c9bfe8195a0a1c75b7414e7b939fd59f7ca165df47aec100cddd

Auftrag:
1. Prüfe technische Umsetzbarkeit beider Entwürfe gegen die tatsächlich verfügbare Claude-Code-, GitHub-App-/MCP- und Agent-SDK-Umgebung.
2. Prüfe Default-Deny, Rollenidentität, unveränderliche Envelope, Idempotenz, Race/Crash-Recovery, Autorisierungsstatus und exakte technische Baselines.
3. Nenne notwendige Komponenten, minimale Rechte, isolierten Runtime-Testplan und reproduzierbare Negativtests.
4. Implementiere nichts und ändere keine Dateien, Konfigurationen, Branches, Issues oder PRs.

Erlaubt: nur lesende Diagnose und Machbarkeitsanalyse innerhalb der bestehenden Sitzung und Berechtigungen.
Verboten: Implementierung, neue Secrets/Apps/Webhooks, Rechteausweitung, Commit, Push, PR-Änderung, Merge, weitere Agenten/Sitzungen, USER_GO-Interpretation.

Erwartetes Signal: CA_FEASIBLE V4 oder genau eine CA_QUESTION V4.
Receipt/Fristen: ausschließlich gemäß §3; `HOST_RECEIVED` vor Initialisierung, danach geparktes `WORKER_IDENTITY_ACK`; vor beiden gültigen Stufen keine fachliche Arbeit, `result_by` = Worker-Identity + 8 Minuten.
Stop: nach einer vollständigen Rückgabe an Atlas über den dokumentierten Rückkanal.
```

## 6. Zustellung und Rückkanal

1. Ein ausdrücklich beauftragter Übergabehost liest das Register und die Quellen am jeweils exakten Commit; ein beweglicher Branchname genügt nicht.
2. Dispatcher und Host bestimmen und speichern den SHA-256 des unveränderten Request-Blocks. Der Host liefert `HOST_RECEIVED` aus §3.2 innerhalb der Frist.
3. Erst nach gültigem `HOST_RECEIVED` initialisiert der Host genau den bezeichneten Archibald-Worker beziehungsweise wird die getrennte Forge-Worker-Sitzung kontrolliert initialisiert. Der Worker bleibt fachlich geparkt.
4. Erst nach gültigem `WORKER_IDENTITY_ACK` beginnt die Facharbeit. Bei Abweichung endet der Lauf ohne Facharbeit.
5. Facharbeiter geben ausschließlich an Host beziehungsweise vorgesehenen Ingress zurück und erhalten keine Veröffentlichungsrechte.
6. Nur ein separat nachgewiesener Publisher/Ingress darf den unveränderten zulässigen Handback an PR #51 anhängen und den Verarbeitungsdatensatz aus §3.4 speichern.
7. Atlas übernimmt nur Signale, deren Request-, Quellen-, Sitzungs-, Worker- und Publisherbindung vollständig passt. Duplikate, Konflikte und stale/mismatched Antworten ändern keinen Fachstatus.
8. Fristüberschreitungen schließen den Lauf nach §3.3 als pausiert; sie erzeugen keine automatische Überwachung oder Wiederholung.

Da Übergabehost und Publisher/Ingress aktuell nicht nachgewiesen sind, ist der End-to-End-Zustellstatus `blocked`. Die Pakete sind fachlich vorbereitet, aber noch nicht automatisch ausführbar. Das Register erzeugt keine Automation, keinen Timer und keine Agentensitzung.

## 7. Mindesttests vor Freigabe des Transports

| Test | Erwartung |
|---|---|
| `HOST_RECEIVED` mit falschem Request, Commit, Host oder Publisher | keine Worker-Initialisierung; `IDENTITY_MISMATCH` |
| Gültiges `HOST_RECEIVED`, Worker noch unbekannt | nur kontrollierte, fachlich geparkte Initialisierung; keine erfundene Worker-Identität |
| Initialisierter Worker zeigt falsche Definition oder Rechte | keine Facharbeit; `IDENTITY_MISMATCH` |
| Gültige Worker-Identity und danach vollständiges Ergebnis | Host-Empfang, Worker-Identität und Fachresultat getrennt nachweisbar |
| Receipt und Ergebnis desselben Requests | beide je einmal zulässig, da unterschiedliche Signale |
| Dieselbe Antwort zweimal beziehungsweise unter neuer Kommentar-URL | gleicher semantischer Hash; genau ein fachlicher Zustandsübergang |
| Gleicher semantischer Schlüssel mit anderem Inhalt | `CONFLICT`; keine Übernahme |
| Antwort einer alten oder fremden Sitzung | `STALE_OR_MISMATCH`; keine Übernahme |
| Kein Host-Receipt, keine Worker-Identity oder kein Ergebnis bis zur Frist | `TIMEOUT_RECEIPT`/`TIMEOUT_IDENTITY`/`TIMEOUT_RESULT`; kein Retry-Loop |
| Ergebnis trifft erst nach Timeout ein | sichere Evidenzbehandlung, aber keine Reaktivierung des abgeschlossenen Laufs |
| Facharbeiter versucht PR-Veröffentlichung | keine Aktion; nur Übergabe an Publisher/Ingress |
| Publisher/Ingress fehlt | Zustand bleibt `blocked`; keine Zustellbehauptung |
