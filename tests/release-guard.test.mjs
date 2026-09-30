// Versionsdisziplin: wer eine ausgelieferte Datei aendert, zaehlt die Version
// hoch. Sonst nicht.
//
// Anlass: v54 ging zweimal raus. Ein zweiter Commit hat dieselben drei Seiten
// geaendert, ohne APP_VERSION anzufassen - die Release-Dokumentation hat die
// Aenderung nie erwaehnt, und der Freigabezeitpunkt zeigte auf den Stand
// davor. Die vorhandenen Tests sehen das nicht: sie pruefen nur, ob die
// Dateien untereinander stimmen, nicht ob sie zum ausgelieferten Stand passen.
//
// Laeuft ohne Browser. Braucht Historie - im Workflow steht fetch-depth: 0.
//
// Lokal gegen einen beliebigen Stand:
//   node tests/release-guard.test.mjs <basis> <kopf>

import { execFileSync } from 'node:child_process';

// Die Buchfuehrung des Release selbst. Sie darf sich aendern, ohne dass
// deswegen schon wieder hochgezaehlt werden muesste.
const BUCHFUEHRUNG = ['version.js', 'sw.js', 'changelog.js'];

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function istAusgeliefert(pfad) {
  if (pfad.includes('/')) return false;              // nur die Wurzel
  if (BUCHFUEHRUNG.includes(pfad)) return false;
  return /\.(html|js|css)$/.test(pfad);
}

// Beispielstempel fuer die Fehlermeldung - damit dort nicht nur steht, was
// falsch ist, sondern auch, wie die Zeile auszusehen hat.
function jetztIso() {
  // Bewusst Europe/Berlin und nicht die Zeit des Rechners: der CI-Runner laeuft
  // in UTC, und wer das Beispiel abschreibt, traegt sonst die falsche Zone ein.
  const z = (n) => String(n).padStart(2, '0');
  const teile = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date()).replace(' ', 'T');
  // Versatz gegen UTC aus der Differenz der beiden Darstellungen bestimmen.
  const jetzt = new Date();
  const berlin = new Date(jetzt.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const utc = new Date(jetzt.toLocaleString('en-US', { timeZone: 'UTC' }));
  const min = Math.round((berlin - utc) / 60000);
  const vz = min >= 0 ? '+' : '-';
  return teile + ':00' + vz + z(Math.floor(Math.abs(min) / 60)) + ':' + z(Math.abs(min) % 60);
}

function versionIn(ref) {
  try {
    const s = git('show', ref + ':version.js');
    const m = s.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
  } catch { return null; }
}

function stempelIn(ref) {
  try {
    const s = git('show', ref + ':version.js');
    const m = s.match(/APP_BUILT\s*=\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
  } catch { return null; }
}

// --- Basis bestimmen -------------------------------------------------------
let basis = process.argv[2];
const kopf = process.argv[3] || 'HEAD';
if (!basis) {
  const ziel = process.env.GITHUB_BASE_REF;            // gesetzt bei Pull Requests
  // Bei einem Pull Request steht der Ziel-Branch drin. Laesst er sich nicht
  // aufloesen - flache Klone, fehlende Remote-Refs -, tut es der erste
  // Elternteil: beim Merge-Ref eines PR ist das genau die Basis, bei einem
  // Push der Stand davor.
  if (ziel) {
    try { basis = git('merge-base', 'origin/' + ziel, kopf); } catch { basis = null; }
  }
  if (!basis) {
    try { basis = git('rev-parse', kopf + '^'); }
    catch {
      console.log('Kein Vorgaenger-Commit - nichts zu vergleichen.');
      process.exit(0);
    }
  }
}

// --- Vergleich -------------------------------------------------------------
const geaendert = git('diff', '--name-only', basis, kopf).split('\n').filter(Boolean);
const ausgeliefert = geaendert.filter(istAusgeliefert);

console.log('Basis : ' + git('rev-parse', '--short', basis) + '  ' + (versionIn(basis) || '?'));
console.log('Kopf  : ' + git('rev-parse', '--short', kopf) + '  ' + (versionIn(kopf) || '?'));

if (!ausgeliefert.length) {
  console.log('Keine ausgelieferte Datei geaendert - nichts zu pruefen.');
  process.exit(0);
}
console.log('Geaendert: ' + ausgeliefert.join(', '));

const fehler = [];
const alt = versionIn(basis);
const neu = versionIn(kopf);

if (alt && neu && alt === neu) {
  fehler.push(
    'APP_VERSION steht unveraendert auf ' + neu + ', obwohl ausgelieferte Dateien\n' +
    '  geaendert wurden. Damit gehen zwei verschiedene Staende unter derselben\n' +
    '  Nummer raus: die Release-Dokumentation kann den zweiten nicht nennen, und\n' +
    '  der Freigabezeitpunkt zeigt auf den ersten.\n' +
    '  Zu tun: version.js und sw.js hochzaehlen, Eintrag in changelog.js ergaenzen.');
} else if (alt && neu) {
  // Hochgezaehlt - dann muss auch der Zeitstempel mitgehen. Nur pruefbar, wo
  // es einen gibt: APP_BUILT kam erst mit v54 dazu, davor ist beides null und
  // ein schlichter Vergleich wuerde faelschlich anschlagen.
  const sk = stempelIn(kopf);
  const sb = stempelIn(basis);
  if (sk && sk === sb) {
    fehler.push(
      'APP_VERSION ging von ' + alt + ' auf ' + neu + ', APP_BUILT blieb stehen\n' +
      '  auf ' + (sb || '(nicht gesetzt)') + '. Der Freigabezeitpunkt wuerde einen\n' +
      '  aelteren Stand behaupten, als ausgeliefert wird.\n' +
      '  Zu tun: APP_BUILT in version.js auf jetzt setzen (ISO 8601 mit\n' +
      '  Zonenangabe, z.B. ' + jetztIso() + ') und dieselbe Uhrzeit als time\n' +
      '  im obersten Eintrag von changelog.js eintragen. Das Datum dort gehoert\n' +
      '  ebenfalls auf heute - nicht vom vorigen Eintrag uebernehmen.');
  }
}

if (fehler.length) {
  console.error('\nVersionsdisziplin verletzt:\n');
  for (const f of fehler) console.error('- ' + f + '\n');
  process.exit(1);
}
console.log('Version und Zeitstempel passen zum ausgelieferten Stand.');
