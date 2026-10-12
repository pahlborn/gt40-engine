# Spec Agent output template

This template defines the minimum content of each versioned specification. It is a protocol, not an implementation authorization.

## Header

| Field | Value |
|---|---|
| Project | |
| Task ID | |
| Specification version | |
| Author role | SA |
| Source MA request | URL and version |
| Knowledge package | IDs and version |
| Repository | |
| Baseline branch and commit | |
| Relevant paths | |
| Status | draft / in review / decision required / accepted |
| Created or revised at | ISO 8601 |
| Supersedes | |

## User outcome and success

Describe the user's intended result in observable terms. Separate the desired outcome from a proposed mechanism.

## Scope

### In scope

List behavior and artifacts included in this version.

### Non-goals

List explicitly excluded behavior. Do not use this section to hide known dependencies.

## Current state and problem

Document the verified baseline, current behavior, deficiency, and affected users or workflows.

## Evidence and decisions

| Requirement or constraint | Basis type | Knowledge/decision ID | Source or decision link | Applicability |
|---|---|---|---|---|
| | fact / decision / derived / assumption | | | |

## Requirements

Assign stable IDs. State one testable requirement per entry.

| ID | Normative requirement | Rationale | Dependencies |
|---|---|---|---|
| | MUST / MUST NOT / SHOULD / MAY | | |

## Data, interfaces, units, and formulas

For each input and output record meaning, unit, valid range, origin, missing-value behavior, precision, and display. For calculations record formula, conversions, sign convention, assumptions, and validity limits. Do not use hidden defaults.

## States and errors

Describe initial, normal, incomplete, invalid, degraded, recovery, and terminal states. State visible behavior and retained data for each failure.

## Compatibility and migration

Identify affected stored data, URLs, APIs, files, browsers, translations, documentation, and simulators. Define migration and rollback behavior without implementation code.

## Acceptance criteria

| AC ID | Related requirement | Setup/input | Expected observable result | Evidence method |
|---|---|---|---|---|
| | | | | |

Include normal, boundary, invalid-input, recovery, regression, and explicitly excluded cases. Reference independent expected values where available.

## Open matters

| ID | Question or assumption | Why it matters | Decision/evidence owner | Blocks |
|---|---|---|---|---|
| | | | user / MA / RKA / RA / CA / QA | |

## Implementation boundaries

List permitted files or components, prohibited changes, sequencing constraints, and conditions that require a new user decision. Do not provide code.

## Change log

| Version | Source feedback | Material changes | Re-review required |
|---|---|---|---|
| | | | yes / no |

## Completion signal

End only after the full document is contained in the final response to the MA. SA does not publish it anywhere; the MA decides where it is recorded:

`[GT40:<TASK-ID>:SA:SA_READY:V<n>]`

State the specification version, baseline commit, unresolved items, and next required role. `SA_READY` is not `USER_GO`.
