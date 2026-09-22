# Arbeitsregeln fuer dieses Repository

Gilt fuer alle, die hier Code aendern - Menschen wie Agenten. Die Regeln
stehen hier, weil sie schon verletzt worden sind, nicht vorsorglich.

## 1. Jede Aenderung an einer ausgelieferten Datei zaehlt die Version hoch

Ausgeliefert ist alles im Wurzelverzeichnis mit der Endung `.html`, `.js`
oder `.css`. Wer eine davon aendert, aendert drei Dinge zusammen:

| Datei | was |
|---|---|
| `version.js` | `APP_VERSION` hochzaehlen, `APP_BUILT` auf jetzt setzen |
| `sw.js` | `CACHE_NAME` auf `boss302-v<N>` mitziehen |
| `changelog.js` | Eintrag ganz oben, mit `date` und `time` |

Ausgenommen sind nur diese drei Dateien selbst - sie sind die Buchfuehrung
des Release, nicht sein Inhalt.

**Warum:** v54 ging zweimal raus. Zwei Commits haben dieselben drei Seiten
geaendert, der zweite ohne Versionssprung. Die Release-Dokumentation konnte
den zweiten Stand nicht nennen, und der angezeigte Freigabezeitpunkt zeigte
auf den ersten. Der Job `Versionsdisziplin` in der CI prueft das jetzt und
nennt beim Scheitern, was zu tun ist.

## 2. Keine Luecke in der Versionsfolge

Jede Nummer zwischen der aeltesten und der aktuellsten braucht einen Eintrag
in `changelog.js`.

**Warum:** v50 bis v53 fehlten vollstaendig. Der damalige Test verglich nur
die oberste Nummer mit `APP_VERSION` - er war vier Releases lang rot, und ein
spaeterer Eintrag hat ihn wieder gruen gemacht, ohne dass die Luecke weg war.

## 3. Rote CI wird nicht ueberschrieben

Ein roter Lauf auf `main` ist ein Befund, kein Rauschen. Weiterpushen, bis er
zufaellig wieder gruen wird, hat die Luecke aus Regel 2 erst entstehen lassen.

## 4. Zeilenenden nicht umstellen

`index.html`, `specs.html` und `build-log.html` sind CRLF. Alles andere ist
LF. Wer eine Datei bearbeitet, behaelt ihre Zeilenenden - in Python etwa mit
`io.open(pfad, encoding='utf-8', newline='')` beim Lesen und beim Schreiben.
Gegenprobe: `wc -l` und `grep -c $'\r'` muessen bei den drei HTML-Dateien
dieselbe Zahl liefern.

## 5. Kein Sollwert ohne Quelle

Messwerte, Drehmomente, Gradzahlen und Duesengroessen stehen nur mit Beleg
da. Ist keiner da, wird der Wert als offen gekennzeichnet, nicht geraten.
Mehrere Tests halten das fest.

## 6. Tests werden gegengeprueft

Ein neuer Test zaehlt erst, wenn er nachweislich rot wird, sobald man den
Fehler wieder einbaut. Ohne diese Probe laesst sich nicht unterscheiden, ob
er greift oder nur nichts findet.

**Warum:** Beim Test gegen implizite globale Variablen war die erste Fassung
wertlos - sie prueft auf eine Eigenschaft, die zum Pruefzeitpunkt noch gar
nicht existierte. Aufgefallen ist das nur durch die Gegenprobe.

## 7. Parallel arbeiten: PR statt Direktpush

Arbeiten mehrere gleichzeitig, geht jede Aenderung ueber einen Pull Request.
Git fuehrt die Dateien sauber zusammen - was kollidiert, ist die gemeinsame
Buchfuehrung aus Regel 1, und die sieht man nur im PR rechtzeitig.

## Tests

`node tests/<name>.test.mjs`, oder alle zusammen so, wie der Workflow sie
aufruft. Jede Datei `tests/*.test.mjs` muss in `.github/workflows/tests.yml`
verdrahtet sein; `tests/workflow.test.mjs` prueft genau das.
