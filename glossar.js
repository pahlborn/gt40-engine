/**
 * glossar.js - Das gemeinsame Motoren-Glossar.
 *
 * Bis v44 stand dieser Block wortgleich in build-log.html, index.html und
 * specs.html. Drei Kopien, und sie waren bereits auseinandergelaufen: die
 * Warnung zu den Vorzeichenkonventionen der Verdichtungsrechner stand nur in
 * specs.html, und "Kolbenunterstand" hatte in index.html ein anderes
 * Messverfahren als in den beiden anderen. Wer das Glossar auf der falschen
 * Seite aufschlug, bekam die aermere Fassung - ohne Hinweis darauf.
 *
 * Derselbe Fehlermodus wie beim FIELD_MIGRATION-Bug: Inhalt kopiert, eine
 * Kopie gepflegt, die anderen nicht.
 *
 * Quelle der zusammengefuehrten Fassung war specs.html, weil sie in allen
 * drei Abweichungen die vollstaendigere Version trug.
 *
 * Einbindung: <div class="glossary-body" id="glossaryBody"></div> plus
 * <script src="glossar.js"></script>. Der Inhalt wird eingesetzt, bevor
 * search.js oder filterGlossary() ihn brauchen.
 *
 * Neuer Begriff: hier eintragen, nicht in einer der HTML-Dateien.
 */
(function (global) {
  'use strict';

  var GLOSSAR_HTML = `        <!-- 1. Grundbegriffe -->
        <div class="glossary-category" data-cat="cat-grund">
            <div class="glossary-category-title">1. Grundbegriffe des Motors</div>

            <div class="glossary-entry" data-search="bore zylinderbohrung innendurchmesser zylinder kolben hubraum">
                <div class="glossary-term" data-de="Zylinderbohrung (Bore)" data-en="Bore (Zylinderbohrung)">Zylinderbohrung (Bore)</div>
                <div class="glossary-field" data-fidx="1"><span class="glossary-field-label">Was ist das?</span> Der Innendurchmesser des Zylinders.</div>
                <div class="glossary-field" data-fidx="2"><span class="glossary-field-label">Einfach gesagt:</span> Die Breite des Lochs, in dem der Kolben auf und ab l&auml;uft.</div>
                <div class="glossary-field" data-fidx="3"><span class="glossary-field-label">Warum?</span> Zusammen mit dem Hub bestimmt die Bohrung den Hubraum.</div>
                <div class="glossary-related" data-fidx="199">Verwandt: Stroke, Displacement, Piston-to-Wall Clearance</div>
            </div>

            <div class="glossary-entry" data-search="stroke hub kolbenhub weg kolben ot ut hubraum">
                <div class="glossary-term" data-de="Hub (Stroke)" data-en="Stroke (Hub)">Hub (Stroke)</div>
                <div class="glossary-field" data-fidx="4"><span class="glossary-field-label">Was ist das?</span> Der Weg, den der Kolben zwischen OT und UT zur&uuml;cklegt.</div>
                <div class="glossary-field" data-fidx="5"><span class="glossary-field-label">Einfach gesagt:</span> Wie weit der Kolben bei einer vollst&auml;ndigen Bewegung nach oben und wieder nach unten l&auml;uft.</div>
                <div class="glossary-related" data-fidx="200">Verwandt: Bore, TDC, BDC, Crankshaft</div>
            </div>

            <div class="glossary-entry" data-search="displacement hubraum volumen kolben verdraengt">
                <div class="glossary-term" data-de="Hubraum (Displacement)" data-en="Displacement (Hubraum)">Hubraum (Displacement)</div>
                <div class="glossary-field" data-fidx="6"><span class="glossary-field-label">Was ist das?</span> Das Volumen, das der Kolben zwischen OT und UT verdr&auml;ngt.</div>
                <div class="glossary-field" data-fidx="7"><span class="glossary-field-label">Einfach gesagt:</span> Der Raum, den der Kolben bei seiner Bewegung im Zylinder &bdquo;durchf&auml;hrt&ldquo;.</div>
                <div class="glossary-related" data-fidx="201">Verwandt: Bore, Stroke, Compression Ratio</div>
            </div>

            <div class="glossary-entry" data-search="bhp brake horsepower leistung kurbelwelle pferdestärke ps din kw watt motor dyno prüfstand">
                <div class="glossary-term" data-de="BHP &ndash; Brake Horsepower (Bremsleistung)" data-en="BHP &ndash; Brake Horsepower">BHP &ndash; Brake Horsepower (Bremsleistung)</div>
                <div class="glossary-field" data-fidx="8"><span class="glossary-field-label">Was ist das?</span> Die reale Leistung, gemessen an der Kurbelwelle (am Bremsenpr&uuml;fstand / Dyno). BHP ber&uuml;cksichtigt innere Reibung und Lasten des Motors (Ventiltrieb, &Ouml;lpumpe, innere Reibung).</div>
                <div class="glossary-field" data-fidx="9"><span class="glossary-field-label">Einfach gesagt:</span> Was der Motor tats&auml;chlich an seiner Kurbelwelle abgibt &ndash; <strong>die ehrlichste Leistungsangabe f&uuml;r den Motor selbst.</strong></div>
                <div class="glossary-field" data-fidx="10"><span class="glossary-field-label">Abgrenzung:</span>
                    <ul style="margin:0.3rem 0 0 1rem;padding:0;font-size:0.78rem;">
                        <li><strong>HP (Horsepower)</strong> &ndash; oft theoretisch oder ohne Nebenaggregate (Lichtmaschine, Wasserpumpe) gemessen. HP &ge; BHP.</li>
                        <li><strong>WHP (Wheel Horsepower)</strong> &ndash; Leistung, die tats&auml;chlich an den R&auml;dern ankommt. Immer niedriger als BHP, weil Getriebe, Differential und Antriebsstrang 12&ndash;18% Verluste erzeugen. <em>WHP &asymp; BHP &times; 0.82&ndash;0.88.</em></li>
                        <li><strong>PS (DIN 70020)</strong> &ndash; metrische Pferdest&auml;rke. 1 PS = 0.986 BHP. 1 BHP = 1.014 PS.</li>
                        <li><strong>kW</strong> &ndash; SI-Einheit. 1 BHP = 0.746 kW.</li>
                    </ul></div>
                <div class="glossary-field" data-fidx="11"><span class="glossary-field-label">In diesem Projekt:</span> Alle Leistungsangaben sind <strong>BHP</strong> (Kurbelwelle). Der Simulator berechnet BHP auf Basis von Verdichtung, Nockenwelle, Kopf-Flow und mechanischem Wirkungsgrad. F&uuml;r die tats&auml;chliche Radleistung (WHP) ca. 15% abziehen.</div>
                <div class="glossary-related" data-fidx="202">Verwandt: Torque (ft-lbs), PS (DIN), kW, WHP, Dyno</div>
            </div>

            <div class="glossary-entry" data-search="tdc top dead center oberer totpunkt ot kolben oben referenz">
                <div class="glossary-term" data-de="OT &ndash; Oberer Totpunkt (TDC)" data-en="TDC &ndash; Top Dead Center (Oberer Totpunkt)">OT &ndash; Oberer Totpunkt (TDC)</div>
                <div class="glossary-field" data-fidx="12"><span class="glossary-field-label">Was ist das?</span> Die Position, bei der der Kolben ganz oben steht.</div>
                <div class="glossary-field" data-fidx="13"><span class="glossary-field-label">Warum?</span> OT ist eine wichtige Referenz f&uuml;r nahezu alle Messungen am Motor.</div>
                <div class="glossary-related" data-fidx="203">Verwandt: BDC, Piston-to-Deck, Degreeing</div>
            </div>

            <div class="glossary-entry" data-search="bdc bottom dead center unterer totpunkt ut kolben unten">
                <div class="glossary-term" data-de="UT &ndash; Unterer Totpunkt (BDC)" data-en="BDC &ndash; Bottom Dead Center (Unterer Totpunkt)">UT &ndash; Unterer Totpunkt (BDC)</div>
                <div class="glossary-field" data-fidx="14"><span class="glossary-field-label">Was ist das?</span> Die Position, bei der der Kolben ganz unten steht.</div>
                <div class="glossary-field" data-fidx="15"><span class="glossary-field-label">Warum?</span> OT und UT bestimmen zusammen den Hub.</div>
            </div>
        </div>

        <!-- 2. Block und Deck -->
        <div class="glossary-category" data-cat="cat-block">
            <div class="glossary-category-title">2. Block und Deck</div>

            <div class="glossary-entry" data-search="engine block motorblock hauptgehaeuse zylinder kurbelwellenlager">
                <div class="glossary-term" data-de="Motorblock (Engine Block)" data-en="Engine Block (Motorblock)">Motorblock (Engine Block)</div>
                <div class="glossary-field" data-fidx="16"><span class="glossary-field-label">Was ist das?</span> Das Hauptgeh&auml;use des Motors mit Zylindern, Kurbelwellenlagern und Lifterbohrungen.</div>
                <div class="glossary-field" data-fidx="17"><span class="glossary-field-label">Einfach gesagt:</span> Das Grundger&uuml;st des Motors.</div>
            </div>

            <div class="glossary-entry" data-search="deck surface blockdeck blockoberflaeche zylinderkopfdichtung">
                <div class="glossary-term" data-de="Dichtfl&auml;che / Deckfl&auml;che (Deck Surface)" data-en="Deck / Deck Surface (Dichtfl&auml;che)">Dichtfl&auml;che / Deckfl&auml;che (Deck Surface)</div>
                <div class="glossary-field" data-fidx="18"><span class="glossary-field-label">Was ist das?</span> Die bearbeitete obere Fl&auml;che des Motorblocks, auf der die Zylinderkopfdichtung liegt.</div>
                <div class="glossary-field" data-fidx="19"><span class="glossary-field-label">Warum?</span> Die Lage dieser Fl&auml;che beeinflusst Quench und Verdichtung.</div>
            </div>

            <div class="glossary-entry" data-search="deck height deckhoehe kurbelwelle blockdeckflaeche hub pleuellaenge messen messung tiefenmikrometer">
                <div class="glossary-term" data-de="Blockh&ouml;he (Deck Height)" data-en="Deck Height (Blockh&ouml;he)">Blockh&ouml;he (Deck Height)</div>
                <div class="glossary-field" data-fidx="20"><span class="glossary-field-label">Was ist das?</span> Der Abstand von der Mitte der Hauptlagergasse (Crankshaft Centerline) bis zur Blockdeckfl&auml;che. Beim Ford 302 / Boss 302: 8.206&quot; (208.43 mm).</div>
                <div class="glossary-field" data-fidx="21"><span class="glossary-field-label">Warum wichtig?</span> Deck Height + Stroke + Rod Length + Compression Height bestimmen, wo der Kolben bei OT steht. Stimmt die Deck Height nicht, &auml;ndern sich Verdichtung und Quench.</div>
                <div class="glossary-field" data-fidx="22"><span class="glossary-field-label">Wie messen?</span> 1. Kurbelwelle und ein Kolben (ohne Ringe) einbauen. 2. Kolben auf OT drehen (h&ouml;chster Punkt). 3. Haarlineal &uuml;ber den Zylinder legen. 4. Tiefenmikrometer oder F&uuml;hlerlehre zwischen Kolbenoberseite und Haarlineal ansetzen. 5. Ergebnis = Piston-to-Deck Clearance. 6. Deck Height = Stroke/2 + Rod Length + Compression Height + Piston-to-Deck.</div>
                <div class="glossary-field" data-fidx="23"><span class="glossary-field-label">Toleranz:</span> &plusmn; 0.005&quot; (0.13 mm). Bei abweichenden Werten: Block planfr&auml;sen lassen (Deck the Block).</div>
                <div class="glossary-related" data-fidx="204">Verwandt: Piston-to-Deck Clearance, Stroke, Rod Length, Compression Height, Quench</div>
            </div>

            <div class="glossary-entry" data-search="piston-to-deck clearance kolben deck abstand ot messen messuhr haarlineal straightedge dial indicator">
                <div class="glossary-term" data-de="Kolbenunterstand (Piston-to-Deck Clearance)" data-en="Piston-to-Deck Clearance (Kolbenunterstand)">Kolbenunterstand (Piston-to-Deck Clearance)</div>
                <div class="glossary-field" data-fidx="24"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen Kolbenoberseite und Blockdeckfl&auml;che bei OT (oberer Totpunkt). Positiv = Kolben steht unter dem Deck (&quot;in the hole&quot;). Negativ = Kolben steht &uuml;ber dem Deck (&quot;out of the hole&quot;).</div>
                <div class="glossary-field" data-fidx="25"><span class="glossary-field-label">Typischer Wert:</span> 0.005&quot;&ndash;0.015&quot; (0.13&ndash;0.38 mm) unter Deck. Zielwert f&uuml;r Boss 302: ca. 0.010&quot; (0.25 mm).</div>
                <div class="glossary-field" data-fidx="26"><span class="glossary-field-label">Wie messen?</span> 1. Kolben (ohne Ringe) mit Pleuel und Kurbelwelle einbauen. 2. Kolben auf exakten OT drehen (Kurbel langsam drehen, h&ouml;chsten Punkt finden). 3. Pr&auml;zisions-Haarlineal (Straightedge) quer &uuml;ber die Zylinderbohrung legen. 4. Messuhr (Dial Indicator) mit Magnetstativ auf dem Haarlineal fixieren, Taster nach unten auf die Kolbenoberseite absenken. 5. Messuhr auf Null stellen. Kurbel minimal vor und zur&uuml;ck drehen, um den exakten OT (h&ouml;chster Ausschlag) zu best&auml;tigen. 6. Wert ablesen. 7. Jeden Zylinder an Druck- und Gegenseite (Thrust &amp; Anti-Thrust) messen.</div>
                <div class="glossary-field" data-fidx="27"><span class="glossary-field-label">Warum wichtig?</span> Bestimmt direkt die Quench Distance (= Piston-to-Deck + komprimierte Kopfdichtungs-Dicke) und damit Verdichtung, Klopfneigung und Leistung. Die wichtigste Messung des gesamten Builds!</div>
                <div class="glossary-related" data-fidx="205">Verwandt: Deck Height, Quench Distance, Compression Ratio, Head Gasket</div>
            </div>

            <div class="glossary-entry" data-search="piston deck height kolbenposition position kolben relativ block">
                <div class="glossary-term" data-de="Kolben&uuml;ber-/unterstand (Piston Deck Height)" data-en="Piston Deck Height (Kolben&uuml;ber-/unterstand)">Kolben&uuml;ber-/unterstand (Piston Deck Height)</div>
                <div class="glossary-field" data-fidx="28"><span class="glossary-field-label">Was ist das?</span> Die tats&auml;chliche Position der Kolbenoberseite relativ zur Blockdeckfl&auml;che bei OT.</div>
            </div>
        </div>

        <!-- 3. Verdichtung und Quench -->
        <div class="glossary-category" data-cat="cat-verdichtung">
            <div class="glossary-category-title">3. Verdichtung und Quench</div>

            <div class="glossary-entry" data-search="compression ratio verdichtungsverhaeltnis zylindervolumen verbrennung leistung">
                <div class="glossary-term" data-de="Verdichtungsverh&auml;ltnis (Compression Ratio)" data-en="Compression Ratio (Verdichtungsverh&auml;ltnis)">Verdichtungsverh&auml;ltnis (Compression Ratio)</div>
                <div class="glossary-field" data-fidx="29"><span class="glossary-field-label">Was ist das?</span> Das Verh&auml;ltnis zwischen dem gesamten Zylindervolumen bei UT und dem verbleibenden Volumen bei OT.</div>
                <div class="glossary-field" data-fidx="30"><span class="glossary-field-label">Einfach gesagt:</span> Ein Motor mit 10:1 hat bei OT nur noch ein Zehntel des Volumens, das bei UT vorhanden war.</div>
                <div class="glossary-related" data-fidx="206">Verwandt: Combustion Chamber Volume, Piston Dish, Gasket Volume</div>
            </div>

            <div class="glossary-entry" data-search="static compression ratio statisches verdichtungsverhaeltnis geometrisch">
                <div class="glossary-term" data-de="Statisches Verdichtungsverh&auml;ltnis (Static CR)" data-en="Static Compression Ratio (Statisches Verdichtungsverh&auml;ltnis)">Statisches Verdichtungsverh&auml;ltnis (Static CR)</div>
                <div class="glossary-field" data-fidx="31"><span class="glossary-field-label">Was ist das?</span> Die geometrisch berechnete Verdichtung, die sich allein aus den tats&auml;chlichen Volumina ergibt.</div>
            </div>

            <div class="glossary-entry" data-search="dynamic compression ratio dynamisches verdichtungsverhaeltnis einlassventil schliesst">
                <div class="glossary-term" data-de="Dynamisches Verdichtungsverh&auml;ltnis (Dynamic CR)" data-en="Dynamic Compression Ratio (Dynamisches Verdichtungsverh&auml;ltnis)">Dynamisches Verdichtungsverh&auml;ltnis (Dynamic CR)</div>
                <div class="glossary-field" data-fidx="32"><span class="glossary-field-label">Was ist das?</span> Ber&uuml;cksichtigt zus&auml;tzlich, wann das Einlassventil tats&auml;chlich schlie&szlig;t.</div>
                <div class="glossary-field" data-fidx="33"><span class="glossary-field-label">Einfach gesagt:</span> Solange das Einlassventil noch offen ist, kann ein Teil des Gemisches zur&uuml;ckstr&ouml;men &ndash; die effektive Verdichtung ist daher geringer.</div>
            </div>

            <div class="glossary-entry" data-search="combustion chamber volume brennraumvolumen zylinderkopf verbrennung">
                <div class="glossary-term" data-de="Brennraumvolumen (Combustion Chamber Volume)" data-en="Combustion Chamber Volume (Brennraumvolumen)">Brennraumvolumen (Combustion Chamber Volume)</div>
                <div class="glossary-field" data-fidx="34"><span class="glossary-field-label">Was ist das?</span> Das Volumen des Brennraums im Zylinderkopf, in dem die Verbrennung stattfindet.</div>
                <div class="glossary-field" data-fidx="35"><span class="glossary-field-label">Warum?</span> Wesentlicher Bestandteil der Compression-Ratio-Berechnung.</div>
            </div>

            <div class="glossary-entry" data-search="piston dish kolbenmulde kolbenvertiefung vertiefung verdichtung geringer vorzeichen">
                <div class="glossary-term" data-de="Kolbenmulde (Piston Dish)" data-en="Piston Dish (Kolbenmulde)">Kolbenmulde (Piston Dish)</div>
                <div class="glossary-field" data-fidx="36"><span class="glossary-field-label">Was ist das?</span> Eine Vertiefung im Kolbenboden (inkl. Valve Reliefs), die zus&auml;tzlichen Raum schafft.</div>
                <div class="glossary-field" data-fidx="37"><span class="glossary-field-label">Auswirkung:</span> Mehr Volumen &rarr; geringere Verdichtung. Im CR-Rechner immer als <strong>positive Zahl</strong> eingeben (wird zum Restvolumen addiert).</div>
                <div class="glossary-field" data-fidx="37b"><span class="glossary-field-label">Achtung Vorzeichen:</span> Online-Rechner verwenden unterschiedliche Konventionen! Summit Racing (&bdquo;Effective Dome Volume&ldquo;) erwartet <strong>positive</strong> Werte f&uuml;r Dish. Andere Rechner erwarten negative Werte. Immer die Hilfe des jeweiligen Rechners lesen!</div>
            </div>

            <div class="glossary-entry" data-search="piston dome kolbenwoelbung erhoehung verdichtung hoeher vorzeichen">
                <div class="glossary-term" data-de="Kolbenboden, erhaben (Piston Dome)" data-en="Piston Dome (erhabener Kolbenboden)">Kolbenboden, erhaben (Piston Dome)</div>
                <div class="glossary-field" data-fidx="38"><span class="glossary-field-label">Was ist das?</span> Eine Erh&ouml;hung auf dem Kolbenboden, die in den Brennraum ragt.</div>
                <div class="glossary-field" data-fidx="39"><span class="glossary-field-label">Auswirkung:</span> Weniger Restvolumen &rarr; h&ouml;here Verdichtung. Dieser Motor hat Flat-Top-Kolben mit Valve Reliefs (Dish), keinen Dome.</div>
            </div>

            <div class="glossary-entry" data-search="gasket thickness dichtungsdicke zylinderkopfdichtung abstand verdichtung">
                <div class="glossary-term" data-de="Dichtungsdicke (Gasket Thickness)" data-en="Gasket Thickness (Dichtungsdicke)">Dichtungsdicke (Gasket Thickness)</div>
                <div class="glossary-field" data-fidx="40"><span class="glossary-field-label">Was ist das?</span> Die Dicke der Zylinderkopfdichtung. Beeinflusst Kolben-Kopf-Abstand und Verdichtung.</div>
            </div>

            <div class="glossary-entry" data-search="compressed gasket thickness einbaudicke zylinderkopfdichtung drehmoment montiert">
                <div class="glossary-term" data-de="Einbaudicke (Compressed Gasket Thickness)" data-en="Compressed Gasket Thickness (Einbaudicke)">Einbaudicke (Compressed Gasket Thickness)</div>
                <div class="glossary-field" data-fidx="41"><span class="glossary-field-label">Was ist das?</span> Die Dicke der Dichtung nach Montage mit vorgeschriebenem Drehmoment.</div>
                <div class="glossary-field" data-fidx="42"><span class="glossary-field-label">Wichtig:</span> F&uuml;r Berechnungen ist die Einbaudicke relevant, nicht die unmontierte Dicke.</div>
            </div>

            <div class="glossary-entry" data-search="quench quetschbereich quetschspalt abstand kolben zylinderkopf gemisch">
                <div class="glossary-term" data-de="Quetschspalt (Quench / Squish)" data-en="Quench / Squish (Quetschspalt)">Quetschspalt (Quench / Squish)</div>
                <div class="glossary-field" data-fidx="43"><span class="glossary-field-label">Was ist das?</span> Der sehr kleine Abstand zwischen Kolben und Zylinderkopf in einem daf&uuml;r vorgesehenen Bereich.</div>
                <div class="glossary-field" data-fidx="44"><span class="glossary-field-label">Einfach gesagt:</span> Wenn der Kolben nach oben kommt, wird das Gemisch in diesem engen Bereich herausgedr&uuml;ckt.</div>
                <div class="glossary-field" data-fidx="45"><span class="glossary-field-label">Warum?</span> Verbessert die Gemischbewegung im Brennraum.</div>
            </div>

            <div class="glossary-entry" data-search="quench distance quetschabstand piston-to-deck gasket abstand">
                <div class="glossary-term" data-de="Quetschspaltma&szlig; (Quench Distance)" data-en="Quench Distance (Quetschspaltma&szlig;)">Quetschspaltma&szlig; (Quench Distance)</div>
                <div class="glossary-field" data-fidx="46"><span class="glossary-field-label">Berechnung:</span> Piston-to-Deck + Compressed Gasket Thickness
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.035&quot;&ndash;0.045&quot; (0.89&ndash;1.14 mm) ideal. Unter 0.035&quot;: Klopfgefahr. &Uuml;ber 0.050&quot;: Quench-Effekt geht verloren.</div>
                <div class="glossary-field" data-fidx="47"><span class="glossary-field-label">Wie berechnen?</span> Quench Distance = Piston-to-Deck Clearance + komprimierte Kopfdichtungsdicke (Compressed Gasket Thickness). Beispiel: 0.010&quot; Deck Clearance + 0.039&quot; Dichtung = 0.049&quot; Quench.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="quench area quetschflaeche kolbenboden zylinderkopf nah">
                <div class="glossary-term" data-de="Quetschfl&auml;che (Quench Area)" data-en="Quench Area (Quetschfl&auml;che)">Quetschfl&auml;che (Quench Area)</div>
                <div class="glossary-field" data-fidx="48"><span class="glossary-field-label">Was ist das?</span> Der Bereich des Kolbenbodens, der dem Zylinderkopf bei OT besonders nahe kommt.</div>
            </div>
        </div>

        <!-- 4. Kurbeltrieb -->
        <div class="glossary-category" data-cat="cat-kurbel">
            <div class="glossary-category-title">4. Kurbeltrieb</div>

            <div class="glossary-entry" data-search="crankshaft kurbelwelle drehbewegung kolben">
                <div class="glossary-term" data-de="Kurbelwelle (Crankshaft)" data-en="Crankshaft (Kurbelwelle)">Kurbelwelle (Crankshaft)</div>
                <div class="glossary-field" data-fidx="49"><span class="glossary-field-label">Was ist das?</span> Wandelt die Auf-und-ab-Bewegung der Kolben in eine Drehbewegung um.</div>
            </div>

            <div class="glossary-entry" data-search="connecting rod pleuel verbindung kolben kurbelwelle">
                <div class="glossary-term" data-de="Pleuel (Connecting Rod)" data-en="Connecting Rod (Pleuel)">Pleuel (Connecting Rod)</div>
                <div class="glossary-field" data-fidx="50"><span class="glossary-field-label">Was ist das?</span> Verbindet den Kolben mit der Kurbelwelle.</div>
            </div>

            <div class="glossary-entry" data-search="rod length pleuellaenge abstand pleuelauge">
                <div class="glossary-term" data-de="Pleuell&auml;nge (Rod Length)" data-en="Rod Length (Pleuell&auml;nge)">Pleuell&auml;nge (Rod Length)</div>
                <div class="glossary-field" data-fidx="51"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen den Mittelpunkten des kleinen und gro&szlig;en Pleuelauges.</div>
                <div class="glossary-field" data-fidx="52"><span class="glossary-field-label">Warum?</span> Zusammen mit Hub und Deck Height bestimmt sie die Position des Kolbens im Zylinder.</div>
            </div>

            <div class="glossary-entry" data-search="rod ratio pleuelverhaeltnis pleuellaenge hub">
                <div class="glossary-term" data-de="Pleuelverh&auml;ltnis (Rod Ratio)" data-en="Rod Ratio (Pleuelverh&auml;ltnis)">Pleuelverh&auml;ltnis (Rod Ratio)</div>
                <div class="glossary-field" data-fidx="53"><span class="glossary-field-label">Berechnung:</span> Rod Length / Stroke</div>
            </div>

            <div class="glossary-entry" data-search="main journal hauptlagerzapfen kurbelwelle hauptlager block">
                <div class="glossary-term" data-de="Hauptlagerzapfen (Main Journal)" data-en="Main Journal (Hauptlagerzapfen)">Hauptlagerzapfen (Main Journal)</div>
                <div class="glossary-field" data-fidx="54"><span class="glossary-field-label">Was ist das?</span> Der Teil der Kurbelwelle, der im Hauptlager des Blocks l&auml;uft.</div>
            </div>

            <div class="glossary-entry" data-search="rod journal pleuellagerzapfen hubzapfen kurbelwelle pleuel">
                <div class="glossary-term" data-de="Pleuellagerzapfen (Rod Journal)" data-en="Rod Journal (Pleuellagerzapfen)">Pleuellagerzapfen (Rod Journal)</div>
                <div class="glossary-field" data-fidx="55"><span class="glossary-field-label">Was ist das?</span> Der Teil der Kurbelwelle, auf dem das Pleuel gelagert ist.</div>
            </div>

            <div class="glossary-entry" data-search="main bearing hauptlager kurbelwelle motorblock lager">
                <div class="glossary-term" data-de="Hauptlager (Main Bearing)" data-en="Main Bearing (Hauptlager)">Hauptlager (Main Bearing)</div>
                <div class="glossary-field" data-fidx="56"><span class="glossary-field-label">Was ist das?</span> Das Lager, in dem die Kurbelwelle im Motorblock l&auml;uft.</div>
            </div>

            <div class="glossary-entry" data-search="rod bearing pleuellager lager pleuel kurbelwellenzapfen">
                <div class="glossary-term" data-de="Pleuellager (Rod Bearing)" data-en="Rod Bearing (Pleuellager)">Pleuellager (Rod Bearing)</div>
                <div class="glossary-field" data-fidx="57"><span class="glossary-field-label">Was ist das?</span> Das Lager zwischen Pleuel und Kurbelwellenzapfen.</div>
            </div>

            <div class="glossary-entry" data-search="main bearing clearance hauptlagerspiel abstand oelfilm kurbelwelle">
                <div class="glossary-term" data-de="Hauptlagerspiel (Main Bearing Clearance)" data-en="Main Bearing Clearance (Hauptlagerspiel)">Hauptlagerspiel (Main Bearing Clearance)</div>
                <div class="glossary-field" data-fidx="58"><span class="glossary-field-label">Was ist das?</span> Der kleine Abstand zwischen Kurbelwellen-Hauptlagerzapfen und Hauptlager.</div>
                <div class="glossary-field" data-fidx="59"><span class="glossary-field-label">Einfach gesagt:</span> Zwischen Kurbelwelle und Lager muss ein definierter Raum f&uuml;r den &Ouml;lfilm vorhanden sein.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.0015&quot;&ndash;0.0025&quot; (0.038&ndash;0.064 mm). Ford 302: 0.0005&quot;&ndash;0.0024&quot;.</div>
                <div class="glossary-field" data-fidx="60"><span class="glossary-field-label">Wie messen?</span> 1. Lagerschalen einlegen (trocken, kein &Ouml;l). 2. Plastigage-Streifen quer auf den Zapfen legen. 3. Lagerdeckel mit Sollmoment anziehen (ohne Kurbelwelle zu drehen!). 4. Deckel abnehmen, Plastigage-Breite mit Skala auf der Verpackung ablesen. 5. Breiter = weniger Spiel, schmaler = mehr Spiel. 6. Alle 5 Hauptlager einzeln messen.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="rod bearing clearance pleuellagerspiel abstand oelfilm">
                <div class="glossary-term" data-de="Pleuellagerspiel (Rod Bearing Clearance)" data-en="Rod Bearing Clearance (Pleuellagerspiel)">Pleuellagerspiel (Rod Bearing Clearance)</div>
                <div class="glossary-field" data-fidx="61"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen Pleuellager und Kurbelwellenzapfen.</div>
                <div class="glossary-field" data-fidx="62"><span class="glossary-field-label">Warum?</span> Bestimmt, wie sich der tragende &Ouml;lfilm bildet.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.001&quot;&ndash;0.003&quot; (0.025&ndash;0.076 mm). Ford 302: 0.0006&quot;&ndash;0.0026&quot;.</div>
                <div class="glossary-field" data-fidx="63"><span class="glossary-field-label">Wie messen?</span> 1. Lagerschalen in Pleuel und Deckel einlegen (trocken). 2. Plastigage-Streifen quer auf den Hubzapfen legen. 3. Pleueldeckel mit Sollmoment anziehen (Kurbel nicht drehen!). 4. Deckel abnehmen, Plastigage-Breite ablesen. 5. Alle 8 Pleuel einzeln messen. 6. Bei Abweichung: andere Lagerschalen-Gr&ouml;&szlig;e w&auml;hlen (Standard, 0.001&quot; OS, 0.010&quot; OS).</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="crankshaft endplay kurbelwellen axialspiel laengsrichtung wandern">
                <div class="glossary-term" data-de="Axialspiel, Kurbelwelle (Crankshaft Endplay)" data-en="Crankshaft Endplay (Axialspiel)">Axialspiel, Kurbelwelle (Crankshaft Endplay)</div>
                <div class="glossary-field" data-fidx="64"><span class="glossary-field-label">Was ist das?</span> Wie weit sich die Kurbelwelle in L&auml;ngsrichtung vor und zur&uuml;ck bewegen kann.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.004&quot;&ndash;0.008&quot; (0.10&ndash;0.20 mm). Ford 302: 0.004&quot;&ndash;0.008&quot;.</div>
                <div class="glossary-field" data-fidx="65"><span class="glossary-field-label">Wie messen?</span> 1. Kurbelwelle mit allen Hauptlagern eingebaut. 2. Messuhr (Dial Indicator) an der Stirnseite der Kurbelwelle ansetzen. 3. Kurbelwelle mit Schraubendreher nach hinten dr&uuml;cken, Messuhr auf Null. 4. Kurbelwelle nach vorne dr&uuml;cken, Messuhr ablesen = Endplay. 5. Alternativ: F&uuml;hlerlehre zwischen Thrust-Bearing-Flanke und Kurbelwangen-Anlauffl&auml;che messen.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="internal balance innenauswuchtung kurbeltrieb ausgleichsmassen">
                <div class="glossary-term" data-de="Innenauswuchtung (Internal Balance)" data-en="Internal Balance (Innenauswuchtung)">Innenauswuchtung (Internal Balance)</div>
                <div class="glossary-field" data-fidx="66"><span class="glossary-field-label">Was ist das?</span> Ausgleichsmassen sind innerhalb der Kurbelwellen-Konfiguration ber&uuml;cksichtigt.</div>
                <div class="glossary-field" data-fidx="67"><span class="glossary-field-label">Warum?</span> Bestimmt, welche Ausf&uuml;hrung von Balancer und Schwungrad verwendet werden muss.</div>
            </div>

            <div class="glossary-entry" data-search="zero balance nullwuchtung balancer schwungrad flexplate">
                <div class="glossary-term" data-de="Nullwuchtung (Zero Balance)" data-en="Zero Balance (Nullwuchtung)">Nullwuchtung (Zero Balance)</div>
                <div class="glossary-field" data-fidx="68"><span class="glossary-field-label">Was ist das?</span> Balancer und Schwungrad/Flexplate ben&ouml;tigen keine zus&auml;tzliche Ausgleichsmasse.</div>
            </div>

            <div class="glossary-entry" data-search="harmonic balancer schwingungsdaempfer torsionsschwingungen kurbelwelle">
                <div class="glossary-term" data-de="Schwingungsd&auml;mpfer (Harmonic Balancer)" data-en="Harmonic Balancer (Schwingungsd&auml;mpfer)">Schwingungsd&auml;mpfer (Harmonic Balancer)</div>
                <div class="glossary-field" data-fidx="69"><span class="glossary-field-label">Was ist das?</span> Bauteil am vorderen Kurbelwellenende, das Torsionsschwingungen d&auml;mpft.</div>
            </div>
        </div>

        <!-- 5. Kolben und Ringe -->
        <div class="glossary-category" data-cat="cat-kolben">
            <div class="glossary-category-title">5. Kolben und Kolbenringe</div>

            <div class="glossary-entry" data-search="piston kolben zylinder ot ut">
                <div class="glossary-term" data-de="Kolben (Piston)" data-en="Piston (Kolben)">Kolben (Piston)</div>
                <div class="glossary-field" data-fidx="70"><span class="glossary-field-label">Was ist das?</span> Der Kolben bewegt sich im Zylinder zwischen OT und UT.</div>
            </div>

            <div class="glossary-entry" data-search="piston-to-wall clearance kolben zylinder spiel klemmen kippen">
                <div class="glossary-term" data-de="Einbauspiel (Piston-to-Wall Clearance)" data-en="Piston-to-Wall Clearance (Einbauspiel)">Einbauspiel (Piston-to-Wall Clearance)</div>
                <div class="glossary-field" data-fidx="71"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen Kolben und Zylinderwand.</div>
                <div class="glossary-field" data-fidx="72"><span class="glossary-field-label">Einfach gesagt:</span> Darf nicht klemmen, aber auch nicht zu viel Spiel haben.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 0.003&quot;&ndash;0.005&quot; (0.08&ndash;0.13 mm) f&uuml;r geschmiedete Kolben. Gusskolben: 0.001&quot;&ndash;0.002&quot;.</div>
                <div class="glossary-field" data-fidx="73"><span class="glossary-field-label">Wie messen?</span> 1. Zylinderbohrung mit Innenmessschraube (Bore Gauge) oder Telescoping Gauge + Mikrometerschraube messen. 2. Kolbendurchmesser am Schaft (Skirt) rechtwinklig zum Kolbenbolzen messen (an der breitesten Stelle). 3. Bohrung minus Kolben = Clearance. 4. Jede Bohrung oben, mitte, unten messen (Konizit&auml;t) und in 90&deg; versetzt (Ovalit&auml;t).</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="compression height kompressionshoehe kolbenbolzenmitte kolbenoberseite">
                <div class="glossary-term" data-de="Kompressionsh&ouml;he (Compression Height)" data-en="Compression Height (Kompressionsh&ouml;he)">Kompressionsh&ouml;he (Compression Height)</div>
                <div class="glossary-field" data-fidx="74"><span class="glossary-field-label">Was ist das?</span> Abstand zwischen Kolbenbolzenmitte und Kolbenoberseite.</div>
                <div class="glossary-field" data-fidx="75"><span class="glossary-field-label">Warum?</span> Zusammen mit Pleuell&auml;nge, Hub und Deck Height bestimmt sie die Kolbenposition bei OT.</div>
            </div>

            <div class="glossary-entry" data-search="valve relief ventiltasche aussparung kolbenboden ventil platz">
                <div class="glossary-term" data-de="Ventiltasche (Valve Relief)" data-en="Valve Relief (Ventiltasche)">Ventiltasche (Valve Relief)</div>
                <div class="glossary-field" data-fidx="76"><span class="glossary-field-label">Was ist das?</span> Aussparung im Kolbenboden f&uuml;r das Ventil.</div>
            </div>

            <div class="glossary-entry" data-search="piston-to-valve clearance kolben ventil abstand freiraum beruehren">
                <div class="glossary-term" data-de="Ventil-Kolben-Freigang (Piston-to-Valve Clearance)" data-en="Piston-to-Valve Clearance (Ventil-Kolben-Freigang)">Ventil-Kolben-Freigang (Piston-to-Valve Clearance)</div>
                <div class="glossary-field" data-fidx="77"><span class="glossary-field-label">Was ist das?</span> Der kleinste Abstand zwischen Kolben und Ventil w&auml;hrend des Motorzyklus.</div>
                <div class="glossary-field" data-fidx="78"><span class="glossary-field-label">Einfach gesagt:</span> Kolben und Ventil d&uuml;rfen sich niemals ber&uuml;hren!</div>
                <div class="glossary-field" data-fidx="79"><span class="glossary-field-label">Warum besonders wichtig?</span> H&auml;ngt von Nockenwellensteuerzeiten, Ventilhub, Deckh&ouml;he, Dichtung und Ventiltrieb ab.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Einlass: &ge; 0.080&quot; (2.0 mm). Auslass: &ge; 0.100&quot; (2.5 mm). Mehr ist sicherer.</div>
                <div class="glossary-field" data-fidx="80"><span class="glossary-field-label">Wie messen?</span> 1. Motor komplett zusammengebaut (K&ouml;pfe, Ventile, Federn, Kipphebel, St&ouml;&szlig;elstangen). 2. Modelliermasse (Knetmasse / Clay) auf die Ventiltaschen im Kolben dr&uuml;cken. 3. Kurbelwelle 2 volle Umdrehungen drehen. 4. Kopf abnehmen, Knetmasse vorsichtig mit Messschieber messen. 5. D&uuml;nnste Stelle = PTV-Clearance. 6. Immer Einlass UND Auslass pr&uuml;fen.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="piston-to-head clearance kolben kopf abstand">
                <div class="glossary-term" data-de="Quetschspaltma&szlig; (Piston-to-Head Clearance)" data-en="Piston-to-Head Clearance (Quetschspaltma&szlig;)">Quetschspaltma&szlig; (Piston-to-Head Clearance)</div>
                <div class="glossary-field" data-fidx="81"><span class="glossary-field-label">Was ist das?</span> Der kleinste Abstand zwischen Kolben und Zylinderkopf. Nicht dasselbe wie Piston-to-Valve Clearance!</div>
            </div>

            <div class="glossary-entry" data-search="top ring oberster kolbenring abdichtung verbrennungsdruck">
                <div class="glossary-term" data-de="1. Kompressionsring (Top Ring)" data-en="Top Ring (1. Kompressionsring)">1. Kompressionsring (Top Ring)</div>
                <div class="glossary-field" data-fidx="82"><span class="glossary-field-label">Aufgabe:</span> &Uuml;bernimmt den wesentlichen Teil der Abdichtung gegen Verbrennungsdruck.</div>
            </div>

            <div class="glossary-entry" data-search="second ring zweiter kolbenring abdichtung oelregulierung">
                <div class="glossary-term" data-de="2. Kompressionsring (Second Ring)" data-en="Second Ring (2. Kompressionsring)">2. Kompressionsring (Second Ring)</div>
                <div class="glossary-field" data-fidx="83"><span class="glossary-field-label">Aufgabe:</span> Unterst&uuml;tzt Abdichtung und beeinflusst &Ouml;lregulierung.</div>
            </div>

            <div class="glossary-entry" data-search="oil ring oelabstreifring unterster ring oelmenge zylinderwand">
                <div class="glossary-term" data-de="&Ouml;labstreifring (Oil Ring)" data-en="Oil Ring (&Ouml;labstreifring)">&Ouml;labstreifring (Oil Ring)</div>
                <div class="glossary-field" data-fidx="84"><span class="glossary-field-label">Aufgabe:</span> Kontrolliert die &Ouml;lmenge auf der Zylinderwand.</div>
            </div>

            <div class="glossary-entry" data-search="ring end gap kolbenringstoss spalt enden ausdehnung erwaermung">
                <div class="glossary-term" data-de="Sto&szlig;spiel (Ring End Gap)" data-en="Ring End Gap (Sto&szlig;spiel)">Sto&szlig;spiel (Ring End Gap)</div>
                <div class="glossary-field" data-fidx="85"><span class="glossary-field-label">Was ist das?</span> Der Spalt zwischen den beiden Enden eines Kolbenrings.</div>
                <div class="glossary-field" data-fidx="86"><span class="glossary-field-label">Warum?</span> Der Ring dehnt sich bei Erw&auml;rmung aus. Ohne Spalt k&ouml;nnten die Enden aneinanderstossen.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Top Ring: 0.016&quot;&ndash;0.022&quot; (0.41&ndash;0.56 mm). 2nd Ring: 0.010&quot;&ndash;0.020&quot; (0.25&ndash;0.51 mm). &Ouml;lring: herstellerabh&auml;ngig.</div>
                <div class="glossary-field" data-fidx="87"><span class="glossary-field-label">Wie messen?</span> 1. Ring in die Zylinderbohrung schieben (ohne Kolben). 2. Mit umgedrehtem Kolben den Ring ca. 1&quot; in die Bohrung dr&uuml;cken (damit er gerade sitzt). 3. F&uuml;hlerlehre in den Ringsto&szlig; (Gap) einf&uuml;hren. 4. Zu eng: Ring vorsichtig mit Diamantfeile am Sto&szlig; abfeilen. 5. Jeden Ring in seinem Zylinder messen (Bohrungen k&ouml;nnen leicht variieren).</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="ring groove kolbenringnut nut kolben ring sitzt">
                <div class="glossary-term" data-de="Kolbenringnut (Ring Groove)" data-en="Ring Groove (Kolbenringnut)">Kolbenringnut (Ring Groove)</div>
                <div class="glossary-field" data-fidx="88"><span class="glossary-field-label">Was ist das?</span> Die Nut im Kolben, in der der Ring sitzt.</div>
            </div>

            <div class="glossary-entry" data-search="ring land ringsteg bereich kolben ringnuten">
                <div class="glossary-term" data-de="Ringsteg / Feuersteg (Ring Land)" data-en="Ring Land (Ringsteg / Feuersteg)">Ringsteg / Feuersteg (Ring Land)</div>
                <div class="glossary-field" data-fidx="89"><span class="glossary-field-label">Was ist das?</span> Der Bereich des Kolbens zwischen zwei Ringnuten.</div>
            </div>

            <div class="glossary-entry" data-search="ring clocking anordnung ringstoesse winkelpositionen">
                <div class="glossary-term" data-de="Ringsto&szlig;versatz (Ring Clocking)" data-en="Ring Clocking (Ringsto&szlig;versatz)">Ringsto&szlig;versatz (Ring Clocking)</div>
                <div class="glossary-field" data-fidx="90"><span class="glossary-field-label">Was ist das?</span> Die Winkelpositionen der Ringst&ouml;&szlig;e zueinander auf dem Kolben.</div>
            </div>
        </div>

        <!-- 6. Zylinderkopf -->
        <div class="glossary-category" data-cat="cat-kopf">
            <div class="glossary-category-title">6. Zylinderkopf</div>

            <div class="glossary-entry" data-search="cylinder head zylinderkopf brennraum ventile ventilsitze">
                <div class="glossary-term" data-de="Zylinderkopf (Cylinder Head)" data-en="Cylinder Head (Zylinderkopf)">Zylinderkopf (Cylinder Head)</div>
                <div class="glossary-field" data-fidx="91"><span class="glossary-field-label">Was ist das?</span> Bildet zusammen mit Kolben und Zylinder den Brennraum. Enth&auml;lt Ventile, Ventilf&uuml;hrungen und Ventilsitze.</div>
            </div>

            <div class="glossary-entry" data-search="intake port einlasskanal kanal frischgas einlassventil">
                <div class="glossary-term" data-de="Einlasskanal (Intake Port)" data-en="Intake Port (Einlasskanal)">Einlasskanal (Intake Port)</div>
                <div class="glossary-field" data-fidx="92"><span class="glossary-field-label">Was ist das?</span> Der Kanal, durch den das Frischgas zum Einlassventil gelangt.</div>
            </div>

            <div class="glossary-entry" data-search="exhaust port auslasskanal kanal abgase auslassventil auspuff">
                <div class="glossary-term" data-de="Auslasskanal (Exhaust Port)" data-en="Exhaust Port (Auslasskanal)">Auslasskanal (Exhaust Port)</div>
                <div class="glossary-field" data-fidx="93"><span class="glossary-field-label">Was ist das?</span> Der Kanal, durch den die Abgase zum Auspuff gelangen.</div>
            </div>

            <div class="glossary-entry" data-search="port volume kanalvolumen einlass auslass groesse drehzahl luftbedarf">
                <div class="glossary-term" data-de="Kanalvolumen (Port Volume)" data-en="Port Volume (Kanalvolumen)">Kanalvolumen (Port Volume)</div>
                <div class="glossary-field" data-fidx="94"><span class="glossary-field-label">Was ist das?</span> Das Volumen eines Einlass- oder Auslasskanals.</div>
                <div class="glossary-field" data-fidx="95"><span class="glossary-field-label">Wichtig:</span> Gr&ouml;&szlig;er ist nicht automatisch besser. Die Kanalgr&ouml;&szlig;e muss zum Motor und Drehzahlbereich passen.</div>
            </div>

            <div class="glossary-entry" data-search="valve ventil gaswechsel oeffnen schliessen ansaug abgas">
                <div class="glossary-term" data-de="Ventil (Valve)" data-en="Valve (Ventil)">Ventil (Valve)</div>
                <div class="glossary-field" data-fidx="96"><span class="glossary-field-label">Was ist das?</span> &Ouml;ffnet und schlie&szlig;t den Gaswechsel zwischen Zylinder und Ansaug-/Abgassystem.</div>
            </div>

            <div class="glossary-entry" data-search="intake valve einlassventil frischgas zylinder">
                <div class="glossary-term" data-de="Einlassventil (Intake Valve)" data-en="Intake Valve (Einlassventil)">Einlassventil (Intake Valve)</div>
                <div class="glossary-field" data-fidx="97"><span class="glossary-field-label">Aufgabe:</span> L&auml;sst das Frischgas in den Zylinder.</div>
            </div>

            <div class="glossary-entry" data-search="exhaust valve auslassventil abgase zylinder">
                <div class="glossary-term" data-de="Auslassventil (Exhaust Valve)" data-en="Exhaust Valve (Auslassventil)">Auslassventil (Exhaust Valve)</div>
                <div class="glossary-field" data-fidx="98"><span class="glossary-field-label">Aufgabe:</span> L&auml;sst die Abgase aus dem Zylinder.</div>
            </div>

            <div class="glossary-entry" data-search="valve stem ventilschaft duenn fuehrung">
                <div class="glossary-term" data-de="Ventilschaft (Valve Stem)" data-en="Valve Stem (Ventilschaft)">Ventilschaft (Valve Stem)</div>
                <div class="glossary-field" data-fidx="99"><span class="glossary-field-label">Was ist das?</span> Der d&uuml;nne Teil des Ventils, der in der Ventilf&uuml;hrung l&auml;uft.</div>
            </div>

            <div class="glossary-entry" data-search="valve face ventilteller ventilflaeche sitz abdichtet">
                <div class="glossary-term" data-de="Ventilteller (Valve Face)" data-en="Valve Face (Ventilteller)">Ventilteller (Valve Face)</div>
                <div class="glossary-field" data-fidx="100"><span class="glossary-field-label">Was ist das?</span> Die Fl&auml;che des Ventils, die auf dem Ventilsitz aufliegt und abdichtet.</div>
            </div>

            <div class="glossary-entry" data-search="valve seat ventilsitz sitzflaeche zylinderkopf abdichtet">
                <div class="glossary-term" data-de="Ventilsitz (Valve Seat)" data-en="Valve Seat (Ventilsitz)">Ventilsitz (Valve Seat)</div>
                <div class="glossary-field" data-fidx="101"><span class="glossary-field-label">Was ist das?</span> Die bearbeitete Sitzfl&auml;che im Zylinderkopf, gegen die das Ventil abdichtet.</div>
            </div>

            <div class="glossary-entry" data-search="valve guide ventilfuehrung ventilschaft position fuehrt">
                <div class="glossary-term" data-de="Ventilf&uuml;hrung (Valve Guide)" data-en="Valve Guide (Ventilf&uuml;hrung)">Ventilf&uuml;hrung (Valve Guide)</div>
                <div class="glossary-field" data-fidx="102"><span class="glossary-field-label">Was ist das?</span> F&uuml;hrt den Ventilschaft und h&auml;lt das Ventil in der richtigen Position.</div>
            </div>
        </div>

        <!-- 7. Ventilfedern -->
        <div class="glossary-category" data-cat="cat-federn">
            <div class="glossary-category-title">7. Ventilfedern</div>

            <div class="glossary-entry" data-search="valve spring ventilfeder feder ventil schliesst oeffnen">
                <div class="glossary-term" data-de="Ventilfeder (Valve Spring)" data-en="Valve Spring (Ventilfeder)">Ventilfeder (Valve Spring)</div>
                <div class="glossary-field" data-fidx="103"><span class="glossary-field-label">Was ist das?</span> Sorgt daf&uuml;r, dass das Ventil nach dem &Ouml;ffnen wieder geschlossen wird.</div>
            </div>

            <div class="glossary-entry" data-search="installed spring height ventilfeder einbauhoehe abstand sitz federteller">
                <div class="glossary-term" data-de="Einbauh&ouml;he (Installed Spring Height)" data-en="Installed Spring Height (Einbauh&ouml;he)">Einbauh&ouml;he (Installed Spring Height)</div>
                <div class="glossary-field" data-fidx="104"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen Federsitz und Federteller bei eingebauter Feder.</div>
                <div class="glossary-field" data-fidx="105"><span class="glossary-field-label">Warum?</span> Die Federkraft h&auml;ngt stark von der Einbauh&ouml;he ab.
                <div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ventilfeder, Retainer und Keile einbauen. 2. Messschieber zwischen Federsitz (Spring Pad am Kopf) und Unterseite des Federtellers (Retainer) ansetzen. 3. Abstand ablesen = Installed Height. 4. Herstellervorgabe vergleichen. 5. Bei zu gro&szlig;er H&ouml;he: Shims (Unterlegscheiben) unter die Feder legen. 6. Alle 16 Ventile pr&uuml;fen.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="seat pressure sitzdruck kraft ventilfeder geschlossen belastet">
                <div class="glossary-term" data-de="Sitzdruck (Seat Pressure)" data-en="Seat Pressure (Sitzdruck)">Sitzdruck (Seat Pressure)</div>
                <div class="glossary-field" data-fidx="106"><span class="glossary-field-label">Was ist das?</span> Die Kraft, mit der die Feder das Ventil bei geschlossenem Ventil belastet.</div>
            </div>

            <div class="glossary-entry" data-search="open pressure oeffnungsdruck federkraft ventilhub">
                <div class="glossary-term" data-de="&Ouml;ffnungskraft (Open Pressure)" data-en="Open Pressure (&Ouml;ffnungskraft)">&Ouml;ffnungskraft (Open Pressure)</div>
                <div class="glossary-field" data-fidx="107"><span class="glossary-field-label">Was ist das?</span> Die Federkraft bei einem bestimmten Ventilhub.</div>
                <div class="glossary-field" data-fidx="108"><span class="glossary-field-label">Wichtig:</span> Ohne Angabe des Ventilhubs nicht eindeutig!</div>
            </div>

            <div class="glossary-entry" data-search="coil bind federblock windungen aufeinanderliegen maximum">
                <div class="glossary-term" data-de="Blockl&auml;nge (Coil Bind)" data-en="Coil Bind (Blockl&auml;nge)">Blockl&auml;nge (Coil Bind)</div>
                <div class="glossary-field" data-fidx="109"><span class="glossary-field-label">Was ist das?</span> Windungen der Feder liegen vollst&auml;ndig aufeinander.</div>
                <div class="glossary-field" data-fidx="110"><span class="glossary-field-label">Warum kritisch?</span> Die Feder darf bei maximalem Ventilhub nicht in Coil Bind kommen!
                <div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Ventilfeder auf Pr&uuml;fstand spannen oder: Eingebaute Feder mit Messschieber messen. 2. Installierte L&auml;nge (Installed Height) minus Ventilhub (Valve Lift) = L&auml;nge bei maximalem Hub. 3. Coil-Bind-H&ouml;he: Alle Windungen aufeinander gepresst (aus Herstellerangabe). 4. Clearance = L&auml;nge bei max. Hub &minus; Coil-Bind-H&ouml;he. 5. Mindestens 0.060&quot; (1.52 mm) Sicherheitsabstand halten.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="retainer federteller oben ventilfeder ventilkeile">
                <div class="glossary-term" data-de="Federteller (Retainer)" data-en="Retainer (Federteller)">Federteller (Retainer)</div>
                <div class="glossary-field" data-fidx="111"><span class="glossary-field-label">Was ist das?</span> Sitzt oben auf der Ventilfeder und wird &uuml;ber die Ventilkeile am Ventil gehalten.</div>
            </div>

            <div class="glossary-entry" data-search="valve locks keepers ventilkeile federteller ventilschaft halten">
                <div class="glossary-term" data-de="Ventilkeile (Valve Locks / Keepers)" data-en="Valve Locks / Keepers (Ventilkeile)">Ventilkeile (Valve Locks / Keepers)</div>
                <div class="glossary-field" data-fidx="112"><span class="glossary-field-label">Was ist das?</span> Kleine Keile, die den Federteller am Ventilschaft halten.</div>
            </div>

            <div class="glossary-entry" data-search="retainer-to-seal clearance abstand federteller ventilschaftdichtung">
                <div class="glossary-term" data-de="Retainer-to-Seal Clearance" data-en="Retainer-to-Seal Clearance">Retainer-to-Seal Clearance</div>
                <div class="glossary-deutsch">Abstand Federteller&ndash;Ventilschaftdichtung</div>
                <div class="glossary-field" data-fidx="113"><span class="glossary-field-label">Warum wichtig?</span> Der Federteller darf die Dichtung bei maximalem Hub nicht ber&uuml;hren!
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Mindestens 0.050&quot; (1.27 mm) bei maximalem Hub.</div>
                <div class="glossary-field" data-fidx="114"><span class="glossary-field-label">Wie messen?</span> 1. Ventil bei maximalem Hub (oder mit bekanntem Shim unter dem Federteller). 2. Abstand zwischen Unterseite des Federtellers (Retainer) und Oberkante der Ventilschaftdichtung (Valve Seal) messen. 3. Methode: F&uuml;hlerlehre oder Plastigage zwischen Retainer und Seal. 4. Zu wenig Clearance zerst&ouml;rt die Dichtung beim Betrieb.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="valve float ventilflattern drehzahl ventiltrieb instabil">
                <div class="glossary-term" data-de="Ventilflattern (Valve Float)" data-en="Valve Float (Ventilflattern)">Ventilflattern (Valve Float)</div>
                <div class="glossary-field" data-fidx="115"><span class="glossary-field-label">Was ist das?</span> Das Ventil folgt bei hoher Drehzahl nicht mehr zuverl&auml;ssig dem Ventiltrieb.</div>
                <div class="glossary-field" data-fidx="116"><span class="glossary-field-label">Warum kritisch?</span> Kann zu mechanischen Sch&auml;den f&uuml;hren!</div>
            </div>
        </div>

        <!-- 8. Nockenwelle -->
        <div class="glossary-category" data-cat="cat-nocken">
            <div class="glossary-category-title">8. Nockenwelle</div>

            <div class="glossary-entry" data-search="camshaft cam nockenwelle ventile oeffnen steuerung">
                <div class="glossary-term" data-de="Nockenwelle (Camshaft)" data-en="Camshaft (Nockenwelle)">Nockenwelle (Camshaft)</div>
                <div class="glossary-field" data-fidx="117"><span class="glossary-field-label">Was ist das?</span> Bestimmt, wann und wie weit die Ventile ge&ouml;ffnet werden.</div>
            </div>

            <div class="glossary-entry" data-search="cam lobe nocken erhebung lifter angehoben">
                <div class="glossary-term" data-de="Nocken (Cam Lobe)" data-en="Cam Lobe (Nocken)">Nocken (Cam Lobe)</div>
                <div class="glossary-field" data-fidx="118"><span class="glossary-field-label">Was ist das?</span> Die Erhebung auf der Nockenwelle, die den Lifter nach oben bewegt.</div>
            </div>

            <div class="glossary-entry" data-search="base circle grundkreis nocken rund lifter nicht angehoben">
                <div class="glossary-term" data-de="Grundkreis (Base Circle)" data-en="Base Circle (Grundkreis)">Grundkreis (Base Circle)</div>
                <div class="glossary-field" data-fidx="119"><span class="glossary-field-label">Was ist das?</span> Der runde, niedrigere Teil des Nockens, bei dem der Lifter nicht angehoben wird.</div>
                <div class="glossary-field" data-fidx="120"><span class="glossary-field-label">Folge:</span> Lifter unten &rarr; Pushrod unten &rarr; Ventil geschlossen.</div>
            </div>

            <div class="glossary-entry" data-search="lobe lift cam lift nockenhub lifter anhebt">
                <div class="glossary-term" data-de="Nockenhub (Lobe Lift / Cam Lift)" data-en="Lobe Lift / Cam Lift (Nockenhub)">Nockenhub (Lobe Lift / Cam Lift)</div>
                <div class="glossary-field" data-fidx="121"><span class="glossary-field-label">Was ist das?</span> Wie weit die Nocke den Lifter anhebt.</div>
            </div>

            <div class="glossary-entry" data-search="valve lift ventilhub oeffnet kipphebel uebersetzt">
                <div class="glossary-term" data-de="Ventilhub (Valve Lift)" data-en="Valve Lift (Ventilhub)">Ventilhub (Valve Lift)</div>
                <div class="glossary-field" data-fidx="122"><span class="glossary-field-label">Was ist das?</span> Wie weit sich das Ventil tats&auml;chlich &ouml;ffnet.</div>
                <div class="glossary-field" data-fidx="123"><span class="glossary-field-label">Warum gr&ouml;&szlig;er als Cam Lift?</span> Der Kipphebel &uuml;bersetzt die Bewegung.</div>
            </div>

            <div class="glossary-entry" data-search="rocker ratio kipphebeluebersetzung verhaeltnis stoessel ventil bewegung">
                <div class="glossary-term" data-de="Kipphebel&uuml;bersetzung (Rocker Ratio)" data-en="Rocker Ratio (Kipphebel&uuml;bersetzung)">Kipphebel&uuml;bersetzung (Rocker Ratio)</div>
                <div class="glossary-field" data-fidx="124"><span class="glossary-field-label">Beispiel:</span> Bei 1,6:1 bewegt sich das Ventil ca. 1,6-mal so weit wie der Lifter.</div>
            </div>

            <div class="glossary-entry" data-search="duration oeffnungsdauer ventil geoeffnet motorzyklus">
                <div class="glossary-term" data-de="&Ouml;ffnungsdauer (Duration)" data-en="Duration (&Ouml;ffnungsdauer)">&Ouml;ffnungsdauer (Duration)</div>
                <div class="glossary-field" data-fidx="125"><span class="glossary-field-label">Was ist das?</span> Wie lange ein Ventil w&auml;hrend eines Motorzyklus ge&ouml;ffnet ist.</div>
                <div class="glossary-field" data-fidx="126"><span class="glossary-field-label">Wichtig:</span> Nur sinnvoll zusammen mit der Messmethode (z.B. Duration @ 0.050").</div>
            </div>

            <div class="glossary-entry" data-search="duration 0.050 oeffnungsdauer hub vergleich nockenwellen">
                <div class="glossary-term" data-de="Duration @ 0.050&quot;" data-en="Duration @ 0.050&quot;">Duration @ 0.050&quot;</div>
                <div class="glossary-deutsch">&Ouml;ffnungsdauer bei 0,050 Zoll Hub</div>
                <div class="glossary-field" data-fidx="127"><span class="glossary-field-label">Warum wichtig?</span> Erm&ouml;glicht sinnvolleren Vergleich verschiedener Nockenwellen als Advertised Duration.</div>
            </div>

            <div class="glossary-entry" data-search="lobe separation angle lsa nockenspreizwinkel einlass auslass mittellinie">
                <div class="glossary-term" data-de="LSA &ndash; Lobe Separation Angle (Spreizbogen)" data-en="LSA &ndash; Lobe Separation Angle">LSA &ndash; Lobe Separation Angle (Spreizbogen)</div>
                <div class="glossary-deutsch">Nockenspreizwinkel</div>
                <div class="glossary-field" data-fidx="128"><span class="glossary-field-label">Was ist das?</span> Der Winkel zwischen den Mittellinien des Einlass- und Auslassnockens.</div>
            </div>

            <div class="glossary-entry" data-search="camshaft centerline nocken mittellinie kurbelwellenwinkel geometrische mitte">
                <div class="glossary-term" data-de="Camshaft Centerline (Einbauwinkel)" data-en="Camshaft Centerline">Camshaft Centerline (Einbauwinkel)</div>
                <div class="glossary-field" data-fidx="129"><span class="glossary-field-label">Was ist das?</span> Der Kurbelwellenwinkel, bei dem ein Nocken seine geometrische Mitte erreicht.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> Intake Centerline 106&deg;&ndash;110&deg; ATDC (je nach Nockenwelle).</div>
                <div class="glossary-field" data-fidx="130"><span class="glossary-field-label">Wie messen?</span> Siehe &quot;Degreeing the Cam&quot;. Die Intake Centerline ist der Kurbelwinkel (in Grad nach OT), bei dem das Einlassventil den maximalen Hub erreicht.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="cam advance vorverstellung nockenwelle frueher">
                <div class="glossary-term" data-de="Vorverstellung / Fr&uuml;hverstellung (Cam Advance)" data-en="Cam Advance (Vorverstellung)">Vorverstellung / Fr&uuml;hverstellung (Cam Advance)</div>
                <div class="glossary-field" data-fidx="131"><span class="glossary-field-label">Was ist das?</span> Die Nockenwelle wird gegen&uuml;ber der Grundstellung fr&uuml;her positioniert.</div>
            </div>

            <div class="glossary-entry" data-search="cam retard rueckverstellung nockenwelle spaeter">
                <div class="glossary-term" data-de="Sp&auml;tverstellung (Cam Retard)" data-en="Cam Retard (Sp&auml;tverstellung)">Sp&auml;tverstellung (Cam Retard)</div>
                <div class="glossary-field" data-fidx="132"><span class="glossary-field-label">Was ist das?</span> Die Nockenwelle wird gegen&uuml;ber der Grundstellung sp&auml;ter positioniert.</div>
            </div>

            <div class="glossary-entry" data-search="degreeing cam nockenwelle einmessen gradscheibe messuhr position vermessen">
                <div class="glossary-term" data-de="Nockenwelle einmessen (Degreeing the Cam)" data-en="Degreeing the Cam (Nockenwelle einmessen)">Nockenwelle einmessen (Degreeing the Cam)</div>
                <div class="glossary-field" data-fidx="133"><span class="glossary-field-label">Was ist das?</span> Die tats&auml;chliche Position der Nockenwelle wird mit Gradscheibe und Messuhr exakt vermessen.</div>
                <div class="glossary-field" data-fidx="134"><span class="glossary-field-label">Einfach gesagt:</span> Wir verlassen uns nicht nur auf die Kettenmarkierungen, sondern messen nach.
                <div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Gradscheibe (Degree Wheel) an der Kurbelwelle befestigen. 2. Zeiger (Pointer) am Block fixieren. 3. OT exakt finden (Positive-Stop-Methode). 4. Messuhr auf den Einlass-Lifter von Zylinder 1 setzen. 5. Kurbel drehen bis Einlassventil auf maximalen Hub steht. 6. Intake Centerline Wert auf Gradscheibe ablesen. 7. Mit Hersteller-Angabe vergleichen. 8. Abweichung: Verstellbares Nockenwellenrad (Adjustable Timing Set) nutzen.</div>
            </div>
            </div>
        </div>

        <!-- 9. Steuertrieb -->
        <div class="glossary-category" data-cat="cat-steuer">
            <div class="glossary-category-title">9. Steuertrieb</div>

            <div class="glossary-entry" data-search="timing set steuertrieb steuerkettensatz kurbelwellenrad nockenwellenrad">
                <div class="glossary-term" data-de="Steuertrieb (Timing Set)" data-en="Timing Set (Steuertrieb)">Steuertrieb (Timing Set)</div>
                <div class="glossary-field" data-fidx="135"><span class="glossary-field-label">Was ist das?</span> Kurbelwellenrad, Nockenwellenrad und Steuerkette.</div>
            </div>

            <div class="glossary-entry" data-search="timing chain steuerkette kurbelwelle nockenwelle verhaeltnis drehen">
                <div class="glossary-term" data-de="Steuerkette (Timing Chain)" data-en="Timing Chain (Steuerkette)">Steuerkette (Timing Chain)</div>
                <div class="glossary-field" data-fidx="136"><span class="glossary-field-label">Was ist das?</span> Verbindet Kurbelwelle und Nockenwelle f&uuml;r korrektes Drehverh&auml;ltnis.</div>
            </div>

            <div class="glossary-entry" data-search="crank gear sprocket kurbelwellenrad zahnrad steuerkette antreibt">
                <div class="glossary-term" data-de="Kurbelwellenrad (Crank Gear / Sprocket)" data-en="Crank Gear / Sprocket (Kurbelwellenrad)">Kurbelwellenrad (Crank Gear / Sprocket)</div>
                <div class="glossary-field" data-fidx="137"><span class="glossary-field-label">Was ist das?</span> Das Zahnrad auf der Kurbelwelle, das die Steuerkette antreibt.</div>
            </div>

            <div class="glossary-entry" data-search="cam gear sprocket nockenwellenrad zahnrad steuerkette angetrieben">
                <div class="glossary-term" data-de="Nockenwellenrad (Cam Gear / Sprocket)" data-en="Cam Gear / Sprocket (Nockenwellenrad)">Nockenwellenrad (Cam Gear / Sprocket)</div>
                <div class="glossary-field" data-fidx="138"><span class="glossary-field-label">Was ist das?</span> Das Zahnrad auf der Nockenwelle, angetrieben von der Steuerkette.</div>
            </div>

            <div class="glossary-entry" data-search="timing mark steuerzeitmarkierung markierung zahnraeder positionierung">
                <div class="glossary-term" data-de="Steuermarke (Timing Mark)" data-en="Timing Mark (Steuermarke)">Steuermarke (Timing Mark)</div>
                <div class="glossary-field" data-fidx="139"><span class="glossary-field-label">Was ist das?</span> Markierung auf den Zahnr&auml;dern zur Positionierung von Kurbel- und Nockenwelle.</div>
                <div class="glossary-field" data-fidx="140"><span class="glossary-field-label">Wichtig:</span> Eine Markierung ersetzt nicht zwingend das Degreeing!</div>
            </div>
        </div>

        <!-- 10. Hydraulic Roller Lifter -->
        <div class="glossary-category" data-cat="cat-lifter">
            <div class="glossary-category-title">10. Hydraulic Roller Lifter</div>

            <div class="glossary-entry" data-search="hydraulic roller lifter hydraulischer rollenstoessel rollenrad nockenwelle ventilspiel">
                <div class="glossary-term" data-de="Hydraulischer Rollenst&ouml;&szlig;el (Hydraulic Roller Lifter)" data-en="Hydraulic Roller Lifter (Hyd. Rollenst&ouml;&szlig;el)">Hydraulischer Rollenst&ouml;&szlig;el (Hydraulic Roller Lifter)</div>
                <div class="glossary-field" data-fidx="141"><span class="glossary-field-label">Was ist das?</span> Ein Lifter mit Rollenrad zur Nockenwelle und hydraulischem Mechanismus zum Ausgleich des Ventilspiels.</div>
            </div>

            <div class="glossary-entry" data-search="roller wheel lifter rolle rollenrad nocke oberflaeche rollt">
                <div class="glossary-term" data-de="Laufrolle (Roller Wheel)" data-en="Roller Wheel (Laufrolle)">Laufrolle (Roller Wheel)</div>
                <div class="glossary-field" data-fidx="142"><span class="glossary-field-label">Was ist das?</span> Das Rollenrad am unteren Ende des Lifters, das direkt auf der Nocke rollt.</div>
            </div>

            <div class="glossary-entry" data-search="plunger hydraulischer kolben lifter innere ventilspiel ausgleich">
                <div class="glossary-term" data-de="Hydraulikkolben (Plunger)" data-en="Plunger (Hydraulikkolben)">Hydraulikkolben (Plunger)</div>
                <div class="glossary-field" data-fidx="143"><span class="glossary-field-label">Was ist das?</span> Ein kleiner Kolben im Lifter-Inneren, der sich bewegen kann und das Ventilspiel automatisch ausgleicht.</div>
            </div>

            <div class="glossary-entry" data-search="plunger preload vorspannung hineingedrueckt arbeitsbereich einstellen">
                <div class="glossary-term" data-de="Vorspannma&szlig; (Plunger Preload)" data-en="Plunger Preload (Vorspannma&szlig;)">Vorspannma&szlig; (Plunger Preload)</div>
                <div class="glossary-field" data-fidx="144"><span class="glossary-field-label">Was ist das?</span> Wie weit der Plunger nach dem Einstellen in den Lifter hineingedr&uuml;ckt ist.</div>
                <div class="glossary-field" data-fidx="145"><span class="glossary-field-label">Einfach gesagt:</span> Der Plunger soll nicht ganz oben und nicht am Ende seines Weges stehen &ndash; er steht in einer definierten Position innerhalb seines Arbeitsbereichs.</div>
            </div>

            <div class="glossary-entry" data-search="lifter body liftergehaeuse aeussere gehaeuse">
                <div class="glossary-term" data-de="St&ouml;&szlig;elk&ouml;rper (Lifter Body)" data-en="Lifter Body (St&ouml;&szlig;elk&ouml;rper)">St&ouml;&szlig;elk&ouml;rper (Lifter Body)</div>
                <div class="glossary-field" data-fidx="146"><span class="glossary-field-label">Was ist das?</span> Das &auml;u&szlig;ere Geh&auml;use des Lifters.</div>
            </div>

            <div class="glossary-entry" data-search="lifter bore lifterbohrung bohrung motorblock lifter laeuft">
                <div class="glossary-term" data-de="St&ouml;&szlig;elbohrung (Lifter Bore)" data-en="Lifter Bore (St&ouml;&szlig;elbohrung)">St&ouml;&szlig;elbohrung (Lifter Bore)</div>
                <div class="glossary-field" data-fidx="147"><span class="glossary-field-label">Was ist das?</span> Die Bohrung im Motorblock, in der der Lifter auf und ab l&auml;uft.</div>
            </div>

            <div class="glossary-entry" data-search="lifter retainer halterung roller lifter position haelt">
                <div class="glossary-term" data-de="St&ouml;&szlig;elf&uuml;hrung / Spider (Lifter Retainer)" data-en="Lifter Retainer (St&ouml;&szlig;elf&uuml;hrung / Spider)">St&ouml;&szlig;elf&uuml;hrung / Spider (Lifter Retainer)</div>
                <div class="glossary-field" data-fidx="148"><span class="glossary-field-label">Was ist das?</span> H&auml;lt die Roller-Lifter in ihrer korrekten Position.</div>
            </div>
        </div>

        <!-- 11. Pushrods & Rocker -->
        <div class="glossary-category" data-cat="cat-pushrod">
            <div class="glossary-category-title">11. Pushrods und Rocker Arms</div>

            <div class="glossary-entry" data-search="pushrod stoessel stange lifter kipphebel verbindung">
                <div class="glossary-term" data-de="Sto&szlig;stange (Pushrod)" data-en="Pushrod (Sto&szlig;stange)">Sto&szlig;stange (Pushrod)</div>
                <div class="glossary-field" data-fidx="149"><span class="glossary-field-label">Was ist das?</span> Die Stange zwischen Lifter und Kipphebel. Der Lifter wird von der Nocke angehoben, schiebt die Pushrod nach oben, die wiederum den Kipphebel bewegt.</div>
            </div>

            <div class="glossary-entry" data-search="checking pushrod mess stoessel stange verstellbar laenge ermittelt einstell">
                <div class="glossary-term" data-de="Checking Pushrod (Mess-Pushrod)" data-en="Checking Pushrod">Checking Pushrod (Mess-Pushrod)</div>
                <div class="glossary-field" data-fidx="150"><span class="glossary-field-label">Was ist das?</span> Eine verstellbare Sto&szlig;elstange, mit der die korrekte endg&uuml;ltige L&auml;nge ermittelt wird.</div>
                <div class="glossary-field" data-fidx="151"><span class="glossary-field-label">Einfach gesagt:</span> Wir kaufen nicht einfach eine beliebige L&auml;nge, sondern messen die richtige L&auml;nge erst aus.</div>
            </div>

            <div class="glossary-entry" data-search="pushrod length stoessel stange laenge geometrie kipphebel ventil">
                <div class="glossary-term" data-de="Pushrod-L&auml;nge (Pushrod Length)" data-en="Pushrod Length (Pushrod-L&auml;nge)">Pushrod-L&auml;nge (Pushrod Length)</div>
                <div class="glossary-field" data-fidx="152"><span class="glossary-field-label">Warum wichtig?</span> Eine falsche L&auml;nge ver&auml;ndert die Stellung des Kipphebels auf dem Ventil.</div>
            </div>

            <div class="glossary-entry" data-search="rocker arm kipphebel uebertraegt pushrod ventil bewegung">
                <div class="glossary-term" data-de="Kipphebel (Rocker Arm)" data-en="Rocker Arm (Kipphebel)">Kipphebel (Rocker Arm)</div>
                <div class="glossary-field" data-fidx="153"><span class="glossary-field-label">Was ist das?</span> &Uuml;bertr&auml;gt die Bewegung der Pushrod auf das Ventil.</div>
            </div>

            <div class="glossary-entry" data-search="rocker tip kipphebelkontaktflaeche bereich ventilspitze laeuft">
                <div class="glossary-term" data-de="Kipphebel-Druckst&uuml;ck (Rocker Tip)" data-en="Rocker Tip (Kipphebel-Druckst&uuml;ck)">Kipphebel-Druckst&uuml;ck (Rocker Tip)</div>
                <div class="glossary-field" data-fidx="154"><span class="glossary-field-label">Was ist das?</span> Der Bereich des Kipphebels, der auf der Ventilspitze l&auml;uft.</div>
            </div>

            <div class="glossary-entry" data-search="sweep pattern laufspur kipphebel ventilspitze geometrie korrekt">
                <div class="glossary-term" data-de="Laufspur (Sweep Pattern)" data-en="Sweep Pattern (Laufspur)">Laufspur (Sweep Pattern)</div>
                <div class="glossary-field" data-fidx="155"><span class="glossary-field-label">Was ist das?</span> Die Spur, die der Kipphebel auf der Ventilspitze hinterl&auml;sst.</div>
                <div class="glossary-field" data-fidx="156"><span class="glossary-field-label">Warum wichtig?</span> Zeigt, ob die Ventiltrieb-Geometrie korrekt ist.</div>
            </div>

            <div class="glossary-entry" data-search="valve train geometry ventiltrieb geometrie lifter pushrod kipphebel ventil zusammenspiel">
                <div class="glossary-term" data-de="Ventiltrieb-Geometrie (Valve Train Geometry)" data-en="Valve Train Geometry (Ventiltrieb-Geometrie)">Ventiltrieb-Geometrie (Valve Train Geometry)</div>
                <div class="glossary-field" data-fidx="157"><span class="glossary-field-label">Was ist das?</span> Das Zusammenspiel von Lifter, Pushrod, Kipphebel und Ventil &uuml;ber den gesamten Bewegungsablauf.</div>
            </div>

            <div class="glossary-entry" data-search="valve lash ventilspiel abstand kontaktflaechen hydraulisch preload">
                <div class="glossary-term" data-de="Ventilspiel (Valve Lash)" data-en="Valve Lash (Ventilspiel)">Ventilspiel (Valve Lash)</div>
                <div class="glossary-field" data-fidx="158"><span class="glossary-field-label">Bei hydraulischem Lifter:</span> Das Spiel wird durch die Einstellung und die Plunger-Vorspannung aufgenommen.</div>
            </div>
        </div>

        <!-- 12. Ventilsteuerung -->
        <div class="glossary-category" data-cat="cat-vsteuer">
            <div class="glossary-category-title">12. Ventilsteuerung</div>

            <div class="glossary-entry" data-search="intake opening io einlassventil oeffnet kurbelwellenwinkel">
                <div class="glossary-term" data-de="E&Ouml; &ndash; Einlass &ouml;ffnet (IO &ndash; Intake Opening)" data-en="IO &ndash; Intake Opening (E&Ouml; &ndash; Einlass &ouml;ffnet)">E&Ouml; &ndash; Einlass &ouml;ffnet (IO &ndash; Intake Opening)</div>
                <div class="glossary-field" data-fidx="159"><span class="glossary-field-label">Was ist das?</span> Der Kurbelwellenwinkel, bei dem das Einlassventil zu &ouml;ffnen beginnt.</div>
            </div>

            <div class="glossary-entry" data-search="intake closing ic einlassventil schliesst verdichtung drehzahl">
                <div class="glossary-term" data-de="ES &ndash; Einlass schlie&szlig;t (IC &ndash; Intake Closing)" data-en="IC &ndash; Intake Closing (ES &ndash; Einlass schlie&szlig;t)">ES &ndash; Einlass schlie&szlig;t (IC &ndash; Intake Closing)</div>
                <div class="glossary-field" data-fidx="160"><span class="glossary-field-label">Warum wichtig?</span> Beeinflusst unter anderem die effektive Verdichtung und das Drehzahlverhalten.</div>
            </div>

            <div class="glossary-entry" data-search="exhaust opening eo auslassventil oeffnet kurbelwellenwinkel">
                <div class="glossary-term" data-de="A&Ouml; &ndash; Auslass &ouml;ffnet (EO &ndash; Exhaust Opening)" data-en="EO &ndash; Exhaust Opening (A&Ouml; &ndash; Auslass &ouml;ffnet)">A&Ouml; &ndash; Auslass &ouml;ffnet (EO &ndash; Exhaust Opening)</div>
                <div class="glossary-field" data-fidx="161"><span class="glossary-field-label">Was ist das?</span> Der Kurbelwellenwinkel, bei dem das Auslassventil zu &ouml;ffnen beginnt.</div>
            </div>

            <div class="glossary-entry" data-search="exhaust closing ec auslassventil schliesst kurbelwellenwinkel">
                <div class="glossary-term" data-de="AS &ndash; Auslass schlie&szlig;t (EC &ndash; Exhaust Closing)" data-en="EC &ndash; Exhaust Closing (AS &ndash; Auslass schlie&szlig;t)">AS &ndash; Auslass schlie&szlig;t (EC &ndash; Exhaust Closing)</div>
                <div class="glossary-field" data-fidx="162"><span class="glossary-field-label">Was ist das?</span> Der Kurbelwellenwinkel, bei dem das Auslassventil schlie&szlig;t.</div>
            </div>

            <div class="glossary-entry" data-search="valve overlap ventilueberschneidung einlass auslass gleichzeitig geoeffnet">
                <div class="glossary-term" data-de="Ventil&uuml;berschneidung (Valve Overlap)" data-en="Valve Overlap (Ventil&uuml;berschneidung)">Ventil&uuml;berschneidung (Valve Overlap)</div>
                <div class="glossary-field" data-fidx="163"><span class="glossary-field-label">Was ist das?</span> Der Zeitraum, in dem Einlass- und Auslassventil gleichzeitig ge&ouml;ffnet sind.</div>
                <div class="glossary-field" data-fidx="164"><span class="glossary-field-label">Einfach gesagt:</span> Am Ende des Aussto&szlig;ens ist das Auslassventil noch offen, w&auml;hrend das Einlassventil bereits &ouml;ffnet.</div>
            </div>
        </div>

        <!-- 13. Oelsystem -->
        <div class="glossary-category" data-cat="cat-oel">
            <div class="glossary-category-title">13. &Ouml;lsystem</div>

            <div class="glossary-entry" data-search="oil pump oelpumpe foerdert motoroel oelwanne motor">
                <div class="glossary-term" data-de="&Ouml;lpumpe (Oil Pump)" data-en="Oil Pump (&Ouml;lpumpe)">&Ouml;lpumpe (Oil Pump)</div>
                <div class="glossary-field" data-fidx="165"><span class="glossary-field-label">Was ist das?</span> F&ouml;rdert Motor&ouml;l aus der &Ouml;lwanne durch den Motor.</div>
            </div>

            <div class="glossary-entry" data-search="oil pickup oelansaugrohr rohr oelpumpe oel oelwanne ansaugt">
                <div class="glossary-term" data-de="&Ouml;lansaugrohr (Oil Pickup)" data-en="Oil Pickup (&Ouml;lansaugrohr)">&Ouml;lansaugrohr (Oil Pickup)</div>
                <div class="glossary-field" data-fidx="166"><span class="glossary-field-label">Was ist das?</span> Das Rohr, &uuml;ber das die &Ouml;lpumpe das &Ouml;l aus der &Ouml;lwanne ansaugt.</div>
            </div>

            <div class="glossary-entry" data-search="pickup-to-pan clearance abstand oelansaugrohr oelwannenboden entfernt beruehren">
                <div class="glossary-term" data-de="Pickup-to-Pan Clearance" data-en="Pickup-to-Pan Clearance">Pickup-to-Pan Clearance</div>
                <div class="glossary-deutsch">Abstand &Ouml;lansaugrohr&ndash;&Ouml;lwannenboden</div>
                <div class="glossary-field" data-fidx="167"><span class="glossary-field-label">Warum wichtig?</span> Darf weder zu weit vom &Ouml;l entfernt sein noch den Boden ber&uuml;hren.
                <div class="glossary-field"><span class="glossary-field-label">Typischer Wert:</span> 1/4&quot;&ndash;3/8&quot; (6&ndash;10 mm) Abstand zwischen &Ouml;l-Pickup und Wannenboden.</div>
                <div class="glossary-field" data-fidx="168"><span class="glossary-field-label">Wie messen?</span> 1. Pickup in &Ouml;lpumpe einbauen, Pumpe am Block befestigen. 2. Modelliermasse (Knetmasse) auf die Unterseite des Pickup-Siebs dr&uuml;cken. 3. &Ouml;lwanne montieren und mit ein paar Schrauben fixieren. 4. Wanne wieder abnehmen, Knetmasse mit Messschieber messen. 5. D&uuml;nnste Stelle = Clearance. Zu nah: Pickup k&ouml;nnte auf dem Boden aufsetzen.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="oil pan sump oelwanne oelvorrat behaelter motor unten">
                <div class="glossary-term" data-de="&Ouml;lwanne (Oil Pan / Sump)" data-en="Oil Pan / Sump (&Ouml;lwanne)">&Ouml;lwanne (Oil Pan / Sump)</div>
                <div class="glossary-field" data-fidx="169"><span class="glossary-field-label">Was ist das?</span> Der &Ouml;lvorratsbeh&auml;lter am unteren Ende des Motors.</div>
            </div>

            <div class="glossary-entry" data-search="baffle schwallblech oel schwappt beschleunigung kurvenfahrt ansaugstelle">
                <div class="glossary-term" data-de="Schwallblech (Baffle)" data-en="Baffle (Schwallblech)">Schwallblech (Baffle)</div>
                <div class="glossary-field" data-fidx="170"><span class="glossary-field-label">Was ist das?</span> Verhindert, dass &Ouml;l bei Beschleunigung oder Kurvenfahrt von der Ansaugstelle wegschwappt.</div>
                <div class="glossary-field" data-fidx="171"><span class="glossary-field-label">F&uuml;r uns:</span> Besonders relevant bei Trackdays und hohen Querbeschleunigungen.</div>
            </div>

            <div class="glossary-entry" data-search="windage tray blech kurbelwelle oelwanne aufgewirbelt oelmenge">
                <div class="glossary-term" data-de="Windage Tray (&Ouml;l-Abweisblech)" data-en="Windage Tray">Windage Tray (&Ouml;l-Abweisblech)</div>
                <div class="glossary-field" data-fidx="172"><span class="glossary-field-label">Was ist das?</span> Reduziert die &Ouml;lmenge, die von der drehenden Kurbelwelle aufgewirbelt wird.</div>
            </div>

            <div class="glossary-entry" data-search="oil pressure oeldruck druck schmierkreislauf motor">
                <div class="glossary-term" data-de="&Ouml;ldruck (Oil Pressure)" data-en="Oil Pressure (&Ouml;ldruck)">&Ouml;ldruck (Oil Pressure)</div>
                <div class="glossary-field" data-fidx="173"><span class="glossary-field-label">Was ist das?</span> Der Druck im Schmierkreislauf des Motors.</div>
            </div>

            <div class="glossary-entry" data-search="high volume oil pump hochvolumen oelpumpe umdrehung mehr oel standard">
                <div class="glossary-term" data-de="Hochf&ouml;rder-&Ouml;lpumpe (High Volume Oil Pump)" data-en="High Volume Oil Pump (Hochf&ouml;rder-&Ouml;lpumpe)">Hochf&ouml;rder-&Ouml;lpumpe (High Volume Oil Pump)</div>
                <div class="glossary-field" data-fidx="174"><span class="glossary-field-label">Wichtig:</span> High Volume bedeutet nicht automatisch h&ouml;heren &Ouml;ldruck. Der Druck h&auml;ngt von Motor, Lagern, Drehzahl und Druckbegrenzungsventil ab.</div>
            </div>

            <div class="glossary-entry" data-search="pressure relief valve druckbegrenzungsventil oeldruck bereich steigt">
                <div class="glossary-term" data-de="Druckbegrenzungsventil (Pressure Relief Valve)" data-en="Pressure Relief Valve (Druckbegrenzungsventil)">Druckbegrenzungsventil (Pressure Relief Valve)</div>
                <div class="glossary-field" data-fidx="175"><span class="glossary-field-label">Was ist das?</span> Verhindert, dass der &Ouml;ldruck &uuml;ber den vorgesehenen Bereich steigt.</div>
            </div>
        </div>

        <!-- 14. Messen und Pruefen -->
        <div class="glossary-category" data-cat="cat-messen">
            <div class="glossary-category-title">14. Messen und Pr&uuml;fen</div>

            <div class="glossary-entry" data-search="clearance spiel abstand bauteile definiert piston-to-wall">
                <div class="glossary-term" data-de="Spiel / Abstand (Clearance)" data-en="Clearance (Spiel / Abstand)">Spiel / Abstand (Clearance)</div>
                <div class="glossary-field" data-fidx="176"><span class="glossary-field-label">Beispiel:</span> Piston-to-Wall Clearance = Abstand Kolben&ndash;Zylinderwand.</div>
            </div>

            <div class="glossary-entry" data-search="tolerance toleranz bereich mass liegen darf">
                <div class="glossary-term" data-de="Toleranz (Tolerance)" data-en="Tolerance (Toleranz)">Toleranz (Tolerance)</div>
                <div class="glossary-field" data-fidx="177"><span class="glossary-field-label">Was ist das?</span> Der Bereich, innerhalb dessen ein Ma&szlig; liegen darf.</div>
            </div>

            <div class="glossary-entry" data-search="interference unerlaubte beruehrung kollision naeher zulaessig">
                <div class="glossary-term" data-de="Kollision / Interference" data-en="Interference (Kollision)">Kollision / Interference</div>
                <div class="glossary-field" data-fidx="178"><span class="glossary-field-label">Beispiel:</span> Piston-to-Valve Interference = Kolben und Ventil ber&uuml;hren sich.</div>
            </div>

            <div class="glossary-entry" data-search="runout rundlaufabweichung drehen kreisbahn eiert">
                <div class="glossary-term" data-de="Rundlaufabweichung (Runout)" data-en="Runout (Rundlaufabweichung)">Rundlaufabweichung (Runout)</div>
                <div class="glossary-field" data-fidx="179"><span class="glossary-field-label">Einfach gesagt:</span> Ob etwas beim Drehen &bdquo;eiert&ldquo;.
                <div class="glossary-field"><span class="glossary-field-label">Wie messen?</span> 1. Teil in V-Block oder Prismen legen (bzw. eingebaut lassen). 2. Messuhr (Dial Indicator) am zu pr&uuml;fenden Punkt ansetzen und auf Null stellen. 3. Teil eine volle Umdrehung drehen. 4. Gesamtausschlag (TIR &ndash; Total Indicator Reading) ablesen. 5. Typische Anwendungen: Kurbelwelle (max. 0.001&quot;), Schwungrad-Planfl&auml;che, Nockenwelle.</div>
            </div>
            </div>

            <div class="glossary-entry" data-search="endplay axialspiel bewegung laengsachse crankshaft">
                <div class="glossary-term" data-de="Axialspiel (Endplay)" data-en="Endplay (Axialspiel)">Axialspiel (Endplay)</div>
                <div class="glossary-field" data-fidx="180"><span class="glossary-field-label">Beispiel:</span> Crankshaft Endplay = Bewegung der Kurbelwelle vor und zur&uuml;ck.</div>
            </div>

            <div class="glossary-entry" data-search="backlash flankenspiel abstand zahnflanken zahnraeder">
                <div class="glossary-term" data-de="Flankenspiel (Backlash)" data-en="Backlash (Flankenspiel)">Flankenspiel (Backlash)</div>
                <div class="glossary-field" data-fidx="181"><span class="glossary-field-label">Was ist das?</span> Der Abstand zwischen den Zahnflanken zweier Zahnr&auml;der.</div>
            </div>

            <div class="glossary-entry" data-search="dial indicator messuhr praezisionsmessgeraet kleine bewegungen endplay rundlauf degreeing">
                <div class="glossary-term" data-de="Messuhr (Dial Indicator)" data-en="Dial Indicator (Messuhr)">Messuhr (Dial Indicator)</div>
                <div class="glossary-field" data-fidx="182"><span class="glossary-field-label">Verwendung:</span> Kurbelwellen-Endplay, Rundlauf, Degreeing der Nockenwelle.</div>
            </div>

            <div class="glossary-entry" data-search="feeler gauge fuehlerlehre metallblaetter dicken spalte messen">
                <div class="glossary-term" data-de="F&uuml;hlerlehre (Feeler Gauge)" data-en="Feeler Gauge (F&uuml;hlerlehre)">F&uuml;hlerlehre (Feeler Gauge)</div>
                <div class="glossary-field" data-fidx="183"><span class="glossary-field-label">Was ist das?</span> Satz d&uuml;nner Metallbl&auml;tter mit definierten Dicken. Zum Messen kleiner Spalte.</div>
            </div>

            <div class="glossary-entry" data-search="micrometer buegelmessschraube praezision aussenmasse kurbelwellenzapfen">
                <div class="glossary-term" data-de="B&uuml;gelmessschraube / Mikrometer (Micrometer)" data-en="Micrometer (B&uuml;gelmessschraube)">B&uuml;gelmessschraube / Mikrometer (Micrometer)</div>
                <div class="glossary-field" data-fidx="184"><span class="glossary-field-label">Verwendung:</span> Pr&auml;zise Au&szlig;enma&szlig;e, z.B. Kurbelwellenzapfen.</div>
            </div>

            <div class="glossary-entry" data-search="bore gauge innenmessgeraet innendurchmesser zylinderbohrungen lagerbohrungen">
                <div class="glossary-term" data-de="Innenmessger&auml;t (Bore Gauge)" data-en="Bore Gauge (Innenmessger&auml;t)">Innenmessger&auml;t (Bore Gauge)</div>
                <div class="glossary-field" data-fidx="185"><span class="glossary-field-label">Verwendung:</span> Zylinderbohrungen, Lagerbohrungen.</div>
            </div>

            <div class="glossary-entry" data-search="plastigage messstreifen kunststofffaden lager welle plattgedrueckt lagerspiel breite">
                <div class="glossary-term" data-de="Plastigage" data-en="Plastigage">Plastigage</div>
                <div class="glossary-field" data-fidx="186"><span class="glossary-field-label">Einfach gesagt:</span> Die Breite des plattgedr&uuml;ckten Kunststoffstreifens zeigt das Lagerspiel.</div>
            </div>
        </div>

        <!-- 15. Montage -->
        <div class="glossary-category" data-cat="cat-montage">
            <div class="glossary-category-title">15. Montage</div>

            <div class="glossary-entry" data-search="torque anzugsdrehmoment drehkraft schraube angezogen">
                <div class="glossary-term" data-de="Anzugsmoment (Torque)" data-en="Torque (Anzugsmoment)">Anzugsmoment (Torque)</div>
                <div class="glossary-field" data-fidx="187"><span class="glossary-field-label">Was ist das?</span> Die vorgeschriebene Drehkraft, mit der eine Schraube angezogen wird.</div>
            </div>

            <div class="glossary-entry" data-search="torque sequence anzugsreihenfolge reihenfolge schrauben gleichmaessig verzogen">
                <div class="glossary-term" data-de="Anzugsreihenfolge (Torque Sequence)" data-en="Torque Sequence (Anzugsreihenfolge)">Anzugsreihenfolge (Torque Sequence)</div>
                <div class="glossary-field" data-fidx="188"><span class="glossary-field-label">Warum wichtig?</span> Damit sich das Bauteil gleichm&auml;&szlig;ig setzt und nicht verzogen wird.</div>
            </div>

            <div class="glossary-entry" data-search="torque angle drehwinkelanzug anfangsdrehmoment winkel weitergedreht">
                <div class="glossary-term" data-de="Drehwinkelanzug (Torque Angle)" data-en="Torque Angle (Drehwinkelanzug)">Drehwinkelanzug (Torque Angle)</div>
                <div class="glossary-field" data-fidx="189"><span class="glossary-field-label">Was ist das?</span> Nach einem definierten Anfangsdrehmoment wird die Schraube um einen bestimmten Winkel weitergedreht.</div>
            </div>

            <div class="glossary-entry" data-search="threadlocker schraubensicherung gewinde vibrationen loest">
                <div class="glossary-term" data-de="Schraubensicherung (Threadlocker)" data-en="Threadlocker (Schraubensicherung)">Schraubensicherung (Threadlocker)</div>
                <div class="glossary-field" data-fidx="190"><span class="glossary-field-label">Wichtig:</span> Nur verwenden, wenn es f&uuml;r die betreffende Verschraubung vorgesehen ist!</div>
            </div>

            <div class="glossary-entry" data-search="assembly lubricant montageoel montagepaste schmiermittel montage lagerstellen nockenwelle">
                <div class="glossary-term" data-de="Montagepaste (Assembly Lubricant)" data-en="Assembly Lubricant (Montagepaste)">Montagepaste (Assembly Lubricant)</div>
                <div class="glossary-field" data-fidx="191"><span class="glossary-field-label">Verwendung:</span> Lagerstellen, Nockenwellenmontage.</div>
            </div>

            <div class="glossary-entry" data-search="blueprinting praeziser motoraufbau messwerte messen vergleichen einstellen dokumentieren">
                <div class="glossary-term" data-de="Blueprinting" data-en="Blueprinting">Blueprinting</div>
                <div class="glossary-field" data-fidx="192"><span class="glossary-field-label">Einfach gesagt:</span> Nicht &bdquo;soll ungef&auml;hr passen&ldquo;, sondern <strong>messen &rarr; vergleichen &rarr; einstellen &rarr; dokumentieren</strong>.</div>
            </div>
        </div>

        <!-- 16. Zusammenhaenge -->
        <div class="glossary-category" data-cat="cat-zusammen">
            <div class="glossary-category-title">16. Wichtige Zusammenh&auml;nge</div>

            <div class="glossary-entry" data-search="kolbenposition ot deck height stroke rod length compression height piston-to-deck">
                <div class="glossary-term" data-de="Kolbenposition bei OT" data-en="Piston Position at TDC">Kolbenposition bei OT</div>
                <div class="glossary-field" data-fidx="193">Bestimmt durch: Deck Height, Stroke, Rod Length, Compression Height &rarr; ergibt die <strong>Piston-to-Deck Position</strong>.</div>
            </div>

            <div class="glossary-entry" data-search="quench berechnung piston-to-deck compressed gasket thickness quench distance">
                <div class="glossary-term" data-de="Quetschspaltma&szlig; (Quench Distance)" data-en="Quench Distance (Quetschspaltma&szlig;)">Quetschspaltma&szlig; (Quench Distance)</div>
                <div class="glossary-field" data-fidx="194"><strong>Quench Distance = Piston-to-Deck + Compressed Gasket Thickness</strong></div>
            </div>

            <div class="glossary-entry" data-search="compression ratio berechnung bore stroke combustion chamber piston dish gasket bore">
                <div class="glossary-term" data-de="Verdichtungsverh&auml;ltnis &ndash; Berechnung (CR Calculation)" data-en="Compression Ratio &ndash; Calculation (Verdichtungsverh&auml;ltnis)">Verdichtungsverh&auml;ltnis &ndash; Berechnung (CR Calculation)</div>
                <div class="glossary-field" data-fidx="195">Ben&ouml;tigt: Bore, Stroke, Combustion Chamber Volume, Piston Dish/Dome, Piston-to-Deck, Gasket Bore, Compressed Gasket Thickness.</div>
            </div>

            <div class="glossary-entry" data-search="valve train geometry pushrod length lifter plunger rocker arm ratio sweep pattern">
                <div class="glossary-term" data-de="Ventiltrieb-Geometrie &ndash; Pushrod-L&auml;nge (Valve Train Geometry)" data-en="Valve Train Geometry &ndash; Pushrod Length (Ventiltrieb-Geometrie)">Ventiltrieb-Geometrie &ndash; Pushrod-L&auml;nge (Valve Train Geometry)</div>
                <div class="glossary-field" data-fidx="196">Abh&auml;ngig von: Lifter, Plunger Position, Pushrod Length, Rocker Arm, Rocker Ratio, Valve Stem Height, Sweep Pattern.</div>
            </div>

            <div class="glossary-entry" data-search="piston-to-valve clearance camshaft timing lift duration rocker ratio valve size relief deck gasket">
                <div class="glossary-term" data-de="Ventil-Kolben-Freigang (Piston-to-Valve Clearance)" data-en="Piston-to-Valve Clearance (Ventil-Kolben-Freigang)">Ventil-Kolben-Freigang (Piston-to-Valve Clearance)</div>
                <div class="glossary-field" data-fidx="197">Beeinflusst durch: Camshaft Timing, Lift, Duration, Rocker Ratio, Valve Size, Piston Valve Relief, Piston-to-Deck, Head Gasket Thickness.</div>
            </div>

            <div class="glossary-entry" data-search="ventilfeder pruefung installed spring height seat pressure open pressure maximum valve lift coil bind retainer-to-seal">
                <div class="glossary-term" data-de="Ventilfedern &ndash; Pr&uuml;fung (Valve Springs Inspection)" data-en="Valve Springs &ndash; Inspection (Ventilfedern)">Ventilfedern &ndash; Pr&uuml;fung (Valve Springs Inspection)</div>
                <div class="glossary-field" data-fidx="198">Relevant: Installed Spring Height, Seat Pressure, Open Pressure, Maximum Valve Lift, Coil Bind, Retainer-to-Seal Clearance.</div>
            </div>
        </div>

        <!-- 17. Abkuerzungen -->
        <div class="glossary-category" data-cat="cat-abk">
            <div class="glossary-category-title">17. Abk&uuml;rzungen</div>

            <div class="glossary-entry" data-search="tdc bdc cr scr dcr lsa io ic eo ec hv rpm cc inch lb-ft psi abkuerzungen">
                <div class="glossary-field" style="font-size:0.82rem; line-height:2;">
                    <strong>TDC</strong> &ndash; Top Dead Center (OT) &nbsp;|&nbsp;
                    <strong>BDC</strong> &ndash; Bottom Dead Center (UT)<br>
                    <strong>CR</strong> &ndash; Compression Ratio &nbsp;|&nbsp;
                    <strong>SCR</strong> &ndash; Static Compression Ratio<br>
                    <strong>DCR</strong> &ndash; Dynamic Compression Ratio &nbsp;|&nbsp;
                    <strong>LSA</strong> &ndash; Lobe Separation Angle<br>
                    <strong>IO</strong> &ndash; Intake Opening &nbsp;|&nbsp;
                    <strong>IC</strong> &ndash; Intake Closing<br>
                    <strong>EO</strong> &ndash; Exhaust Opening &nbsp;|&nbsp;
                    <strong>EC</strong> &ndash; Exhaust Closing<br>
                    <strong>HV</strong> &ndash; High Volume &nbsp;|&nbsp;
                    <strong>RPM</strong> &ndash; Revolutions Per Minute<br>
                    <strong>cc</strong> &ndash; Kubikzentimeter &nbsp;|&nbsp;
                    <strong>in. / "</strong> &ndash; Zoll (inch)<br>
                    <strong>lb-ft</strong> &ndash; Drehmoment-Einheit &nbsp;|&nbsp;
                    <strong>psi</strong> &ndash; Druckeinheit
                </div>
            </div>
        </div>

        <div class="glossary-no-results" id="glossaryNoResults" style="display:none;">Kein Begriff gefunden.</div>

    `;

  function einsetzen() {
    var ziel = document.getElementById('glossaryBody');
    if (!ziel) return false;
    // Doppeltes Einsetzen verhindern, falls die Seite das Skript zweimal laedt.
    if (ziel.dataset.gefuellt === 'ja') return true;
    ziel.innerHTML = GLOSSAR_HTML;
    ziel.dataset.gefuellt = 'ja';
    // Zaehler und Filter aktualisieren, falls die Seite sie schon kennt.
    if (typeof global.filterGlossary === 'function') {
      try { global.filterGlossary(); } catch (e) { /* Seite ohne Filter */ }
    }
    return true;
  }

  global.Glossar = { html: GLOSSAR_HTML, einsetzen: einsetzen };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', einsetzen);
  } else {
    einsetzen();
  }
})(typeof window !== 'undefined' ? window : this);
