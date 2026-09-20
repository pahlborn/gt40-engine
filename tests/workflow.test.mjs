// Tests fuer den GitHub-Actions-Workflow selbst.
//
// Hintergrund: ein Schrittname wurde als
//     - name: Vergaser: Zerlegen, Synchronisieren, Bedueusung
// eingetragen. Ein nicht gequoteter Doppelpunkt mit Leerzeichen zerlegt das
// YAML. Der Workflow scheiterte daraufhin beim Parsen - vor jedem Job. Das
// erzeugt KEINE Check-Runs, sondern einen Lauf, der in derselben Sekunde
// endet, in der er beginnt. Vier Pushes und zwei Merges lang blieb das
// unbemerkt, weil eine leere Check-Run-Liste wie "noch nicht gestartet"
// aussieht.
//
// Dieser Test braucht keinen Browser und laeuft in Millisekunden.
//
// Lokal: node tests/workflow.test.mjs

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, suite, test, assert, summary } from './helpers.mjs';

const WF = path.join(REPO_ROOT, '.github', 'workflows', 'tests.yml');
const zeilen = fs.readFileSync(WF, 'utf8').split(/\r?\n/);

// Ein skalarer Wert ist gefaehrlich, wenn er ": " enthaelt und weder in
// Anfuehrungszeichen steht noch ein Block-Skalar (| oder >) ist.
function gefaehrlich(wert) {
  const w = wert.trim();
  if (!w || w.startsWith('|') || w.startsWith('>')) return false;
  if ((w.startsWith('"') && w.endsWith('"')) || (w.startsWith("'") && w.endsWith("'"))) return false;
  return w.includes(': ');
}

try {

// ---------------------------------------------------------------------------
suite('Workflow-YAML bleibt parsebar');

await test('Kein Schrittname enthaelt einen ungequoteten Doppelpunkt', async () => {
  const treffer = [];
  zeilen.forEach((z, i) => {
    const m = z.match(/^\s*-?\s*name:\s*(.*)$/);
    if (m && gefaehrlich(m[1])) treffer.push('Zeile ' + (i + 1) + ': ' + z.trim());
  });
  assert(treffer.length === 0,
    'Ungequoteter Doppelpunkt in einem Namen:\n  ' + treffer.join('\n  '));
});

await test('Auch andere Skalare tragen keinen ungequoteten Doppelpunkt', async () => {
  const treffer = [];
  zeilen.forEach((z, i) => {
    const m = z.match(/^\s*-?\s*([a-zA-Z_-]+):\s+(.*)$/);
    if (!m) return;
    if (m[1] === 'run') return;            // Shell-Zeilen duerfen alles
    if (m[2].trim().startsWith('#')) return;
    if (gefaehrlich(m[2])) treffer.push('Zeile ' + (i + 1) + ': ' + z.trim());
  });
  assert(treffer.length === 0,
    'Ungequoteter Doppelpunkt in einem Wert:\n  ' + treffer.join('\n  '));
});

await test('Einrueckung der Schritte ist einheitlich', async () => {
  // Ein verrutschter Schritt faellt sonst stillschweigend aus dem Job heraus.
  const tiefen = new Set();
  zeilen.forEach((z) => {
    const m = z.match(/^(\s*)- name:/);
    if (m) tiefen.add(m[1].length);
  });
  assert(tiefen.size <= 1,
    'Schritte unterschiedlich eingerueckt: ' + [...tiefen].join(', '));
});

// ---------------------------------------------------------------------------
suite('Jeder Test laeuft auch wirklich in CI');

await test('Alle tests/*.test.mjs sind im Workflow verdrahtet', async () => {
  // Ein Test, den CI nicht aufruft, schuetzt nichts.
  const inhalt = zeilen.join('\n');
  const dateien = fs.readdirSync(path.join(REPO_ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.mjs'));
  assert(dateien.length > 0, 'Keine Testdateien gefunden');
  const fehlend = dateien.filter((f) => !inhalt.includes('tests/' + f));
  assert(fehlend.length === 0, 'Nicht im Workflow: ' + fehlend.join(', '));
});

await test('Der Workflow ruft keine Datei auf, die es nicht gibt', async () => {
  const fehlend = [];
  for (const z of zeilen) {
    for (const m of z.matchAll(/tests\/[\w.-]+\.mjs/g)) {
      if (!fs.existsSync(path.join(REPO_ROOT, m[0]))) fehlend.push(m[0]);
    }
  }
  assert(fehlend.length === 0, 'Im Workflow genannt, aber nicht vorhanden: ' + fehlend.join(', '));
});

} finally {
  // kein Browser, kein Server - nichts aufzuraeumen
}

process.exit(summary() === 0 ? 0 : 1);
