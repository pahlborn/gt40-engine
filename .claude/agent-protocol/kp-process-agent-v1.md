# KP-PROC-AGENT V1 — Claude Process Agent

Version: 1.0
Verifikationsdatum: 13.10.2026
Erstellerrolle: Scout / Research-Knowledge Agent
Status: `RKA_READY`; offizielle Anthropic-/Claude-Code-Quellen geprüft; keine projektspezifische Runtime-Abnahme

## Ergebnis

Ein Claude Process Agent kann Prozessartefakte read-only prüfen und versionierte Änderungsvorschläge erstellen. Ereignisannahme, zuverlässige Persistenz, Fristen, Exactly-once, Recovery und technische Rechteerzwingung sind jedoch Funktionen der konkreten Laufzeit beziehungsweise der getrennten Infrastruktur. Sie werden nicht allein durch den Agentenprompt garantiert.

`confirmed` bedeutet in diesem Paket: durch die am Verifikationsdatum gelesene offizielle Dokumentation bestätigt. Es bedeutet nicht, dass die Funktion im Agentarium praktisch getestet wurde.

## Bestätigtes Wissen

| ID | Status | Aussage und Grenze | Quelle |
|---|---|---|---|
| K-PA-01 | confirmed | Custom Subagents besitzen eigenen Kontext, Systemprompt und Werkzeugkonfiguration. `tools` begrenzt den Bestand; ohne das Feld wird geerbt. `disallowedTools` entfernt auch ausdrücklich gelistete Werkzeuge. | S1 |
| K-PA-02 | confirmed | Subagent-Memory persistiert als Dateien und kann Read, Write und Edit automatisch aktivieren. Eine Memory-Erweiterung benötigt daher eine neue Sicherheitsbaseline. | S1 |
| K-PA-03 | confirmed | Skills liefern Anweisungen. `allowed-tools` ist eine Vorabgenehmigung und keine Werkzeug-Positivliste. `context: fork` kann weitere Ausführungspfade eröffnen. | S2 |
| K-PA-04 | confirmed | CLAUDE.md und Auto-Memory sind Kontext, keine erzwungene Konfiguration. Persistierter Inhalt wird nicht automatisch zu einer freigegebenen Regel. | S3 |
| K-PA-05 | confirmed | Hooks können Ereignisse liefern und bestimmte Werkzeugaufrufe sperren. `SubagentStop` enthält Agent-ID, Typ, Transkriptpfad und finale Antwort. Stop-Hooks sind kein neutraler Abschlussmechanismus, wenn sie Weiterarbeit erzwingen. | S4 |
| K-PA-06 | confirmed | Hookfehler und Timeouts sind häufig nicht blockierend. `onFailure: "block"` ist für Command-/HTTP-Hooks ab Claude Code v2.1.295 dokumentiert und gilt nicht pauschal für alle Ereignisse oder asynchronen Hooks. | S4 |
| K-PA-07 | confirmed | Agent Teams sind experimentell; Taskstände können nachlaufen. In-Process-Teammates erhalten automatisch Message-/Task-Werkzeuge, die auch bei entsprechenden `disallowedTools` verfügbar bleiben. Subagent, Teammate und Hauptsitzung sind nicht sicherheitsgleich. | S5 |
| K-PA-08 | confirmed | `Monitor` ist zeitlich begrenzt und kein unbegrenzt laufender Prozesswächter. Provider-, Telemetrie- und Plattformgrenzen gelten. | S6 |
| K-PA-09 | confirmed | Agent-View-Hintergrundsitzungen sind maschinenabhängig und enden spätestens mit dem Herunterfahren. Sie sind kein unabhängiger Always-on-Dienst. | S7 |
| K-PA-10 | confirmed | `/loop`/Cron sind sitzungsgebunden, holen verpasste Termine nicht einzeln nach und sind kein dauerhafter externer Scheduler. | S8 |
| K-PA-11 | confirmed | Channels liefern Ereignisse in eine laufende Sitzung und sind eine Preview-Funktion mit Authentifizierungs- und Betriebsgrenzen. | S9 |
| K-PA-12 | confirmed | Routines können unabhängig laufen und neue Sitzungen starten. Ereignisse können bei Limits verworfen werden. Standardmäßig sind alle verbundenen Connectoren eingeschlossen; deren Werkzeuge können einschließlich Schreiboperationen ohne Rückfrage genutzt werden. Die geprüfte Doku belegt keinen allgemeinen `issue_comment.created`-Pfad. | S10 |
| K-PA-13 | confirmed | Claude GitHub Actions kann auf GitHub-Ereignisse reagieren, besitzt aber einen breiten App-Berechtigungssatz. Eine App-Installation ist kein Read-only-Nachweis. | S11 |
| K-PA-14 | confirmed | CLI/SDK unterstützen nichtinteraktive Aufrufe. `--allowedTools` genehmigt Aufrufe vorab, begrenzt aber nicht allein den Werkzeugbestand. `--bare` ist nicht automatisch read-only und überspringt Hooks. | S12 |
| K-PA-15 | confirmed | Permissionregeln können MCP-Server und konkrete Tools adressieren. Lokale Dateisperren decken keine indirekten GitHub-/MCP-Schreibwege ab. | S13 |
| K-PA-16 | confirmed | Die Bash-Sandbox begrenzt Shell-Kindprozesse, nicht automatisch Dateiwerkzeuge, MCP-Server oder Hooks. Natives Windows wird nicht unterstützt; WSL2 ist gesondert zu betrachten. | S14 |
| K-PA-17 | confirmed | Managed Settings können lokale Überschreibungen verhindern, bleiben aber gegenüber einem lokalen Administrator veränderbar. | S15 |

## Abgeleitete Sicherheitsanforderungen

Diese Punkte sind `derived` aus K-PA-01 bis K-PA-17 und noch kein implementiertes Design:

1. Agentenanweisung oder Skill allein ist keine technische Mutationssperre.
2. Alle erreichbaren Schreibwege müssen betrachtet werden: Dateiwerkzeuge, Shell/Monitor, MCP/Connectoren, Memory, Skills und Delegation.
3. Freigegebene Regeln, Skills und Enforcement-Konfiguration liegen außerhalb der Schreibhoheit des Process Agent.
4. Neue Memory-Inhalte dürfen niemals automatisch als freigegebene Regeln gelten.
5. Hookschutz benötigt belegtes Fehlerverhalten und Schutz der Hookkonfiguration selbst.
6. Rechte werden für den tatsächlichen Modus geprüft; ordinary Subagent, Background Subagent, Teammate, Hauptsitzung, Routine und CI sind nicht austauschbar.
7. Ein read-only Process Agent darf bereitgestellte Ereignisse, Logs und Artefakte analysieren sowie fachliche Duplikate erkennen und klassifizieren. Dauerhafte Deduplizierungsregister, atomare Zustandsänderungen, Exactly-once-Erzwingung, Erfassung, Persistenz, vollständige Zustellung und zeitliche Überwachung benötigen eine gesondert abgesicherte Laufzeit beziehungsweise Host-/Relay-Funktion.

## Nicht nachgewiesen

Im geprüften Dokumentationsumfang gibt es keine Garantie für:

- 30- oder 60-Sekunden-SLAs;
- lückenlose Ereigniszustellung;
- Exactly-once-Verarbeitung;
- automatisch atomare Freigabe- oder Statusänderungen;
- automatisch richtige Memory-Inhalte;
- tatsächliche Pfad-, Repository- oder Connector-Isolation der späteren Cadence-Runtime.

Diese Punkte bleiben `not_evidenced` und benötigen spezifizierte, isolierte Laufzeittests.

## Quellenregister

Alle Quellen: Herausgeber Anthropic, geprüft am 13.10.2026.

| ID | Primärquelle | Relevanter Bereich |
|---|---|---|
| S1 | https://code.claude.com/docs/en/sub-agents | Frontmatter, Tools, Permissions, Memory |
| S2 | https://code.claude.com/docs/en/skills | Toolfreigaben, Fork/Subagent, Restriktionen |
| S3 | https://code.claude.com/docs/en/memory | CLAUDE.md, Auto-Memory, Speicherung |
| S4 | https://code.claude.com/docs/en/hooks | Ereignisse, Exit-Verhalten, Timeouts, SubagentStop |
| S5 | https://code.claude.com/docs/en/agent-teams | Architektur, Rechte, Einschränkungen |
| S6 | https://code.claude.com/docs/en/tools-reference#monitor-tool | Monitor-Grenzen |
| S7 | https://code.claude.com/docs/en/agent-view | Hintergrundbetrieb und Grenzen |
| S8 | https://code.claude.com/docs/en/scheduled-tasks | Cron-/Loop-Lebensdauer und Einschränkungen |
| S9 | https://code.claude.com/docs/en/channels | Preview, Sitzungsvoraussetzung |
| S10 | https://code.claude.com/docs/en/routines | Trigger, Connectoren, Limits |
| S11 | https://code.claude.com/docs/en/github-actions | App-Rechte und Automationsmodus |
| S12 | https://code.claude.com/docs/en/headless | nichtinteraktive Ausführung, Bare Mode |
| S13 | https://code.claude.com/docs/en/permissions | MCP- und Dateiregeln |
| S14 | https://code.claude.com/docs/en/sandboxing | Scope und Plattformgrenzen |
| S15 | https://code.claude.com/docs/en/managed-settings | Priorität und Administratorgrenzen |

## Revalidierung

Neu prüfen, wenn sich Claude-Code-Version, Provider, Plattform, Permissionmodus, Agentenmodus, Memory, Skillzugriff, Hooks, Connectoren, MCP-Schemata, GitHub-App-Rechte oder Preview-Funktionen ändern.

Dieses Wissenspaket erlaubt keine Architektur-, Agenten-, Skill-, Implementierungs- oder Betriebsfreigabe.
