/**
 * Cam Degreeing am GT40 / Ford M-6268-A302.
 * Wiederholbare, fortlaufende Einstellrunden; jeweils 3 ICL-Messungen.
 * Runde 1 nutzt ausschließlich die bisherigen Gist-Felder aus v123.
 * Weitere Runden verwenden neue data-field-Keys und bleiben historisch erhalten.
 * A/R-Beschriftungen und Messung sind getrennt: die App wählt KEINE Keilnut automatisch.
 */
(function (global) {
  'use strict';
  function zahl(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    var s = String(v == null ? '' : v).trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function lauf(vor, nach) {
    var a = zahl(vor), b = zahl(nach);
    if (a === null || b === null || a < 0 || a >= 360 || b < 0 || b >= 360) return null;
    if (b < a) b += 360;
    var weg = b - a;
    if (weg <= 0 || weg >= 180) return null;
    return (a + weg / 2) % 360;
  }
  function auswerten(messungen, soll) {
    var werte = messungen.map(function(paar) { return lauf(paar[0],paar[1]); });
    var gueltig = werte.filter(function(v) { return v !== null; });
    var mittel = gueltig.length ? gueltig.reduce(function(a,b){return a+b;},0)/gueltig.length : null;
    var ziel = zahl(soll);
    return {
      werte: werte, anzahl: gueltig.length, komplett: gueltig.length === 3,
      mittel: mittel, abweichung: mittel!==null && ziel!==null ? mittel-ziel : null,
      spannweite: gueltig.length>=2 ? Math.max.apply(null,gueltig)-Math.min.apply(null,gueltig) : null
    };
  }
  function fmt(v) {
    return v===null ? '—' : String(Number(v.toFixed(2))).replace('.',',');
  }
  function feld(name) { return global.document && global.document.querySelector('[data-field="'+name+'"]'); }
  function eingabe(name) { var el=feld(name); return el ? el.value : ''; }
  function text(id,wert) { var el=global.document && global.document.getElementById(id); if(el) el.textContent=wert; }
  function rundeKey(n,m,se) { return 'p2_degree_cycle_'+n+'_m'+m+'_'+(se==='vor'?'vor':'nach'); }
  function leseRunde(n) {
    if(n===1) return [[eingabe('p2_open050'),eingabe('p2_close050')],
                       [eingabe('p2_degree_r2_vor'),eingabe('p2_degree_r2_nach')],
                       [eingabe('p2_degree_r3_vor'),eingabe('p2_degree_r3_nach')]];
    return [1,2,3].map(function(m){ return [eingabe(rundeKey(n,m,'vor')),eingabe(rundeKey(n,m,'nach'))]; });
  }
  function input(key,aria) {
    return '<input type="text" inputmode="decimal" data-field="'+key+
      '" aria-label="'+aria+'" placeholder="°" style="width:66px" oninput="CamDegreeing.onInput()">';
  }
  function tabelle(n) {
    var rows='';
    for(var m=1;m<=3;m++){
      rows+='<tr><td style="padding:.3rem">'+m+'</td><td>'+input(rundeKey(n,m,'vor'),'Runde '+n+', Messung '+m+' vor Maximum')+
       '</td><td>'+input(rundeKey(n,m,'nach'),'Runde '+n+', Messung '+m+' nach Maximum')+
       '</td><td><strong id="cam-icl-cycle-'+n+'-run-'+m+'">—</strong></td></tr>';
    }
    return '<div class="cam-round-extra" style="margin-top:1.15rem;padding:.8rem;border:1px solid #c7d6e2;border-radius:5px" data-cam-cycle="'+n+'">'+
     '<h4 style="margin:.1rem 0 .6rem">Einstellrunde '+n+' (nach Korrektur)</h4>'+
     '<label>Verwendete Keilnut: <input type="text" data-field="p2_degree_setting_'+n+
     '" placeholder="z. B. A2" style="width:100px" oninput="autoSave()"></label> '+
     '<label>Zugehörige Zahnradmarkierung: <input type="text" data-field="p2_degree_mark_'+n+
     '" placeholder="z. B. A2" style="width:100px" oninput="autoSave()"></label>'+
     '<label>Anlass: <input type="text" data-field="p2_degree_reason_'+n+'" placeholder="OT neu / Advance / Retard" style="width:180px" oninput="autoSave()"></label>'+
     '<div style="overflow-x:auto"><table style="width:100%;min-width:410px"><thead><tr><th>Messung</th><th>Vor −0,050"</th><th>Nach −0,050"</th><th>ICL</th></tr></thead><tbody>'+
     rows+'</tbody></table></div>'+
     '<div><strong>Mittel:</strong> <span id="cam-cycle-'+n+'-average">—</span>; <strong>Abweichung:</strong> <span id="cam-cycle-'+n+'-delta">—</span>; <strong>Spannweite:</strong> <span id="cam-cycle-'+n+'-spread">—</span></div>'+
     '<p style="font-size:.8rem">Nach jeder Änderung am Steuertrieb: zwei KW-Umdrehungen von Hand, Markierungen prüfen, dann alle drei Messungen wiederholen.</p></div>';
  }
  function countAusData(data) {
    var n = Math.max(1,Math.min(20,parseInt(data && data.p2_degree_round_count,10)||1));
    // Weitere gespeicherte Felder duerfen nie verborgen werden, wenn "count" aus Altgeraet fehlt.
    Object.keys(data||{}).forEach(function(key) {
      var m=key.match(/^p2_degree_cycle_(\d+)_m[123]_(?:vor|nach)$/);
      if(m) n=Math.max(n,Math.min(20,Number(m[1])));
    });
    return n;
  }
  function ensureRounds(data) {
    var target=global.document && global.document.getElementById('cam-degreeing-extra-rounds');
    if(!target) return;
    var n=countAusData(data||{});
    for(var i=2;i<=n;i++) {
      if(!global.document.querySelector('[data-cam-cycle="'+i+'"]'))
        target.insertAdjacentHTML('beforeend',tabelle(i));
    }
    // Bei reinem Wiederherstellen von Cloud-Daten nie bestehende Eingabeknoten entfernen.
    var count=feld('p2_degree_round_count');
    if(count && Number(count.value||0)<n) count.value=String(n);
  }
  function auswertungsText(abweichung) {
    if(abweichung === null) return '—';
    return (abweichung>0?'+':'')+fmt(abweichung)+'° '+
      (abweichung>0?'(später / retardiert)':abweichung<0?'(früher / advanced)':'(Soll getroffen)');
  }
  function render() {
    if(!global.document || !global.document.getElementById('cam-degreeing-repetitions')) return null;
    var roundInput=feld('p2_degree_round_count');
    var count=roundInput ? Math.max(1,Math.min(20,Number(roundInput.value)||1)) : 1;
    var target=eingabe('p2_icl_target');
    var letzte=null;
    for(var n=1;n<=count;n++){
      var res=auswerten(leseRunde(n),target);
      if(n===1){
        res.werte.forEach(function(v,i){text('cam-icl-run-'+(i+1),fmt(v));});
      } else {
        res.werte.forEach(function(v,i){text('cam-icl-cycle-'+n+'-run-'+(i+1),fmt(v));});
        text('cam-cycle-'+n+'-average',res.mittel===null?'—':fmt(res.mittel)+'°');
        text('cam-cycle-'+n+'-delta',auswertungsText(res.abweichung));
        text('cam-cycle-'+n+'-spread',res.spannweite===null?'—':fmt(res.spannweite)+'°');
      }
      letzte=res;
    }
    var res=letzte;
    text('cam-runs-count','Einstellrunde '+count+': '+res.anzahl+' / 3 Messungen vollständig');
    text('cam-icl-average',res.mittel===null?'—':fmt(res.mittel)+'° ATDC');
    text('cam-icl-spread',res.spannweite===null?'— (mindestens 2 Messungen nötig)':fmt(res.spannweite)+'°');
    text('cam-icl-deviation',auswertungsText(res.abweichung));
    var richtung=res.abweichung===null?'—':res.abweichung>0?'ADVANCE: ICL verkleinern':res.abweichung<0?'RETARD: ICL vergrößern':'Keine rechnerische Korrektur';
    text('cam-icl-correction',richtung);
    var grenze=res.abweichung!==null && Math.abs(res.abweichung)<=1;
    text('cam-measure-state',!res.komplett
      ? 'Messreihe unvollständig. Keine Einstellfreigabe aus vorläufigen Werten.'
      : grenze
        ? '3/3 gemessen; innerhalb der Ford-Orientierung ±1° — OT, Taststück, Zahnradmarken und mechanische Freigängigkeit zusätzlich prüfen.'
        : '3/3 gemessen; außerhalb der Ford-Orientierung ±1°. OT und Messung prüfen; ggf. Stellung am Kurbelwellenrad korrigieren und neue Einstellrunde beginnen.');
    // Alter ICL-Wert bleibt erhalten, bis die aktuelle Runde wieder Messwerte hat.
    var actual=feld('p2_icl_actual');
    if(actual) actual.value=res.mittel===null?'':fmt(res.mittel);
    return res;
  }
  function onInput() {
    render();
    if(typeof global.autoSave==='function')global.autoSave();
  }
  function addRound() {
    if(!global.document)return;
    var c=feld('p2_degree_round_count');
    if(!c)return;
    var current=Number(c.value)||1;
    if(current>=20){text('cam-add-round-state','Mehr als 20 Runden nicht vorgesehen.');return;}
    var res=render();
    if(!res || res.anzahl===0) {
      text('cam-add-round-state','Vorher mindestens ein vollständiges Winkelpaar erfassen.');
      return;
    }
    var n=current+1;
    ensureRounds({p2_degree_round_count:n});
    c.value=String(n);
    c.dispatchEvent(new Event('input',{bubbles:true}));
    text('cam-add-round-state','Runde '+n+' angelegt. Vor dem erneuten Messen Stellung dokumentieren und Steuertrieb erneut prüfen.');
    render();
    if(typeof global.autoSave==='function')global.autoSave();
  }
  function ensureFromData(data){ensureRounds(data); render();}
  global.CamDegreeing={zahl:zahl,lauf:lauf,auswerten:auswerten,render:render,
    onInput:onInput,addRound:addRound,ensureFromData:ensureFromData};
  if(global.document && global.document.addEventListener)
    global.document.addEventListener('DOMContentLoaded',function(){
      var raw={};try{raw=JSON.parse(localStorage.getItem('engineBuildLog')||'{}');}catch(e){}
      ensureRounds(raw);
      render();
    });
})(typeof window!=='undefined'?window:globalThis);
