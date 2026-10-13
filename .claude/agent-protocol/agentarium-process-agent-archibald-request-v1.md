# Archibald-Auftrag — Cadence Process Agent

Version: 1.0 DRAFT
Stand: 13.10.2026
Task: `E-PROC-AGENT-001`
Status: versandfertiger Spezifikationsauftrag; technische Zustellung und Worker-Empfang nicht nachgewiesen

## Verbindliche Envelope

`[AGENTARIUM:E-PROC-AGENT-001:MA:MA_REQUEST:V1]`

| Feld | Wert |
|---|---|
| Projekt | Agentarium |
| Absender | Atlas / Main Agent |
| Empfänger | Archibald / technischer Subagent `spec-agent` |
| Phase | Spezifikation des Process Agent |
| Signal | `MA_REQUEST V1` |
| Request-Ref | `E-PROC-AGENT-001/MA_REQUEST/V1` |
| Quellenstand | Konzept-/Prozessbaseline `agent/agentarium-process-v1-draft@ba725fd9ffd6627222de25e0de882e228b8d1ba0`; Wissenspaket `@340d829d5cd3b2d48613385582c6476ea8358737` |
| Nutzerentscheidung | `USER_DECISION V1`: Name `Cadence` und Konzept V0.3 für Spezifikationsarbeit angenommen |
| Autorisierung | **Kein `USER_GO` für Implementierung, Agentendefinition, Rulebook-/Skilländerung, Merge oder Betrieb** |
| Wissenspaket | `KP-PROC-AGENT V1`; `.claude/agent-protocol/kp-process-agent-v1.md`; Commit `340d829d5cd3b2d48613385582c6476ea8358737`; SHA-256 `617f3d4ef6404175a82e2d386c4e12702ab98c069ab48904b5d94567fb82b607` |

## Gepinnte Quellen

| Quelle | Pfad | SHA-256 | Git-Blob |
|---|---|---|---|
| Cadence-Konzept V0.3 | `.claude/agent-protocol/agentarium-process-agent-concept-v0.3-draft.md` | `a63c984a541f37c4c82ca40907cc514e3a423d19d96ed8ae78f5680f0eba7e24` | `01f8bc24108c9147e656f3e7741949fd6c5b1330` |
| Rulebook V1 DRAFT | `.claude/agent-protocol/agentarium-rulebook-v1-draft.md` | `1cb465fda399a448114cf371755bcf69a7b8d8acce9eb2d96455c017cd441718` | `f00d4e04fb1a5fc17b4a976c9a1095866ea62297` |
| Work-Item Lifecycle V0.4 | `.claude/agent-protocol/agentarium-work-item-lifecycle-v0.4-draft.md` | `2b2a9cbf4791c9bfe8195a0a1c75b7414e7b939fd59f7ca165df47aec100cddd` | `20196bf53fde8b8c88d2944b38e1ef841f371a04` |
| Task Register V0.4 | `.claude/agent-protocol/agentarium-task-register-v0.4-draft.md` | `a3a52f82f7f1cbc5803154542174264bdc81a2704d1cef6867fbd52b90ad2fa5` | `18bb9e7bb17ec027cef1744dc628518da4d74a67` |
| aktuelle Spec-Agent-Definition | `.claude/agents/spec-agent.md` | `05343fac5d58e2890fce37f38f0c311b4777718193ad24204aa85d671526cecf` | `3d49a612a1b2ad8d353b2b5345053dca60d4c23c` |
| Spec-Agent-Ausgabeprotokoll | `.claude/agent-protocol/spec-agent-output.md` | `2d3c0ba0ccc9dc7a22e9794e3e45c9230fa825c39074f00f5a4f3d96d4e38052` | `64aa9587a7ee67176612ca8d80f929942327529d` |
| Process-Agent-Wissenspaket | `.claude/agent-protocol/kp-process-agent-v1.md` | `617f3d4ef6404175a82e2d386c4e12702ab98c069ab48904b5d94567fb82b607` | `738b7e314d9e006309a2152c2acfa1936d9c378a` am Commit `340d829d5cd3b2d48613385582c6476ea8358737` |

## Auftrag

Erstelle eine implementierungsunabhängige, testbare Spezifikation für den Claude-Code-Subagenten `process-agent` mit dem persönlichen Namen **Cadence**.

Die Spezifikation muss mindestens enthalten:

1. Identität, Zweck, Nicht-Ziele und klare Abgrenzung zu Atlas, Relay, Nova, Scout, Archibald, Argus, Forge und Sentinel.
2. Direkte Melderechte aller Teammitglieder sowie die Signale `PROCESS_DEFECT`, `RULE_CONFLICT`, `PROCESS_FRICTION`, `SKILL_GAP`, `TRAINING_NEED`, `IMPROVEMENT_PROPOSAL`, `PROCESS_SUCCESS` und `NEAR_MISS`.
3. Vollständige Eingangs-, Block-, Rückfrage-, Proposal-, Pause- und Handback-Envelopes einschließlich Versions-, Quellen- und Entscheidungsbindung.
4. Statusmodell für Transportereignis, Erfahrungsfall und Musterhypothese mit Guards, Ownern und erlaubten Übergängen.
5. Vorschläge für Rulebook-, Agenten-, Skill- und Trainingsänderungen, ohne eigene Änderungs-, Delegations-, Freigabe- oder Abnahmebefugnis.
6. Trennung von Beobachtung, Interpretation, Hypothese, Entscheidung und Wirksamkeitsnachweis.
7. Messplan und Ergebniszustände `effective`, `ineffective`, `harmful` und `inconclusive`.
8. Technisches Default-Deny-Zielprofil mit exakter Positivliste und ausdrücklich gesperrten indirekten Pfaden. Keine Behauptung einer bereits geprüften Runtime.
9. Datenzugriffsgrenzen für autorisierte Repositories, Pfade und Datensätze sowie Regeln für Secrets, Policy-Blockaden und untrusted Input.
10. Befristeter Auftragsvertrag mit Receipt, Worker-Identität, Fristen, Stop, Timeout, Late Result und Recovery-Owner.
11. Positiv-, Negativ-, Grenz-, Fehler- und Regressionstests einschließlich Selbstbestätigung, Deduplizierung, Gegenbelegen und Wirkungsmessung.
12. Genaue Folgeänderungen, die später getrennt am Rulebook, Rollenregister, Ausgabeprotokoll und an der Agentendefinition erforderlich wären. Nichts davon jetzt ändern.

## Verbindliche Grenzen

Erlaubt:

- ausschließlich Read, Glob, Grep und die technisch freigegebenen lesenden GitHub-Werkzeuge;
- Analyse der gepinnten Quellen;
- genau eine vollständige Rückgabe an die aufrufende Claude-Hauptsitzung.

Verboten:

- Dateien, GitHub, PRs, Kommentare, Issues, Notion, Skills, Memory, Agentendefinitionen oder Konfigurationen verändern;
- Code oder Prozessänderungen implementieren;
- weitere Agenten, Skills, Sessions, Worktrees, Hooks, Timer oder Automationen starten;
- Werkzeuge nachladen oder Rechte erweitern;
- `USER_GO`, Merge-, Release- oder Betriebsfreigabe annehmen oder ableiten;
- die eigene Spezifikation freigeben oder abnehmen.

## Erwartete Rückgabe

- Dieser Auftrag ist wegen des read-only One-shot-Handbacks ausdrücklich **ein Lauf mit genau einer finalen Rückgabe**. Ein separates `SA_ACK` wird nicht verlangt; Entry-Check und `SA_ACK V1` werden bei vollständigem Eingang im selben finalen Handback vor `SA_READY V1` dokumentiert. Der Host liefert `WORKER_IDENTITY_ACK` unabhängig davon vor Beginn der Facharbeit.
- Fehlt genau eine entscheidende Information: eine fokussierte `SA_QUESTION V1` als einzige finale Rückgabe.
- Andernfalls: vollständige Spezifikation als `SA_READY V1` mit Versionskennung, Quellenbezug, Traceability-Matrix, offenen Punkten und Stop-Bestätigung.
- Kein `SA_READY`, solange eine materielle Anforderung unprüfbar oder widersprüchlich bleibt.
- Für diesen Lauf bleibt der aktuell geladene SA-Vertrag maßgeblich: Archibald verwendet `[GT40:E-PROC-AGENT-001:SA:<SIGNAL>:V1]`. Atlas ordnet diesen inneren Worker-Handback über Request-Ref und Quellenhash eindeutig der äußeren Agentarium-Envelope zu. Die spätere Spezifikation muss den fest verdrahteten Projektpräfix als erforderlichen Vertragsdelta für einen multi-projektfähigen Spec Agent behandeln. Es erfolgt in diesem Lauf keine stillschweigende Änderung der geladenen Definition.

## Transport und Stop

Die Datei ist nur ein versandfertiger Auftrag. Sie beweist weder Zustellung noch Empfang.

- `HOST_RECEIVED`: spätestens 60 Sekunden nach nachgewiesener Übergabe an einen geprüften Host.
- `WORKER_IDENTITY_ACK`: spätestens weitere 60 Sekunden nach gültigem Host-Empfang.
- `result_by`: spätestens 5 Minuten nach gültiger Worker-Identität.
- Timeout beendet den Lauf. Kein automatischer Neustart, kein Ersatzagent und keine Warteschleife.
- Stop nach genau einer vollständigen Rückgabe oder einem definierten Pause-/Fehlerstatus.

Bis Übergabehost und getrennt berechtigter Publisher/Ingress praktisch nachgewiesen sind, bleibt die Zustellung `blocked`.
