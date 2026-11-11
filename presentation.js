/* Presentation workflow extension. Storage uses the existing stock balance export. */
(function () {
 'use strict';
 I18N.en.connect='Create flow'; I18N.de.connect='Fluss erstellen';
 I18N.en.stock='Storage (inventory)'; I18N.de.stock='Lager';
 I18N.en.boundary='External input/output (outside system)';
 I18N.de.boundary='Externer Ein-/Ausgang (außerhalb des Systems)';
 function changed(){state.lastResult=null;state.lastPayload=null;save();renderAll();}
 function safe(s){return esc(s).replace(/"/g,'&quot;');}
 // Explicit machine values avoid saving translated labels as variable types.
 dataEditor=function(v,p){
  const opts=['measured','unmeasured','fixed'].map(k=>'<option value="'+k+'"'+(v.type===k?' selected':'')+'>'+t(k)+'</option>').join('');
  return '<label>'+t('type')+'<select id="'+p+'_type">'+opts+'</select></label><label>'+t('value')+'<input id="'+p+'_value" type="number" step="any" value="'+v.value+'"></label><label>Standardunsicherheit σ (absolut)<input id="'+p+'_unc" type="number" min="0" step="any" value="'+v.unc+'"></label><label>Relative Standardunsicherheit (%)<input id="'+p+'_pct" type="number" min="0" step="any" value="'+(v.value?(v.unc/Math.abs(v.value)*100).toFixed(2):0)+'"></label>';
 };
 const oldBind=bindDataEditor;
 bindDataEditor=function(v,p,after){oldBind(v,p,()=>{state.lastResult=null;state.lastPayload=null;if(after)after();});};
 const oldAdd=addNode;
 addNode=function(type){
  const name=prompt(type==='stock'?'Name des Lagers:':'Name des Prozesses:',type==='stock'?'Lager':'Prozess');
  if(!name||!name.trim())return;
  oldAdd(type);const n=getNode(state.sel[0].id);n.name=name.trim();changed();
 };
 function addBoundary(){
  const name=prompt('Name des externen Ein-/Ausgangs:','Anlieferung');if(!name||!name.trim())return;
  oldAdd('stock');const n=getNode(state.sel[0].id);n.name=name.trim();n.boundary=true;n.x=60;n.y=140;changed();
 }
 function stockIssues(doc,values){
  const msgs=[];
  doc.nodes.forEach(n=>{
   if(n.type==='stock'&&!n.boundary)periodList().forEach(p=>state.layers.filter(l=>l.calc!==false).forEach(l=>{
    const pd=n.pd[p]&&n.pd[p][l.id];if(!pd)return;
    const cap=n.capacities&&n.capacities[l.id];
    if(cap!=null&&(!Number.isFinite(+cap)||+cap<0))msgs.push({level:'error',msg:n.name+': ungültige Kapazität ('+l.name+').',ref:{kind:'node',id:n.id}});
    ['start','end'].forEach(k=>{
     const key=n.name+'_'+k+'__'+l.id+'__'+p;
     const has=values&&Object.prototype.hasOwnProperty.call(values,key);
     if(!has&&pd[k].type==='unmeasured')return;
     const v=+(has?values[key]:pd[k].value);
     if(v< -1e-7||(cap!=null&&v>+cap+1e-7))msgs.push({level:'error',msg:n.name+' / '+p+' / '+l.name+': '+k+'='+v+' außerhalb 0 … '+(cap==null?'∞':cap)+' '+(l.dispUnit||l.unit)+'. Kapazitätsprüfung, keine Optimierungsnebenbedingung.',ref:{kind:'node',id:n.id}});
    });
   }));
   if(n.sub&&!values)msgs.push(...stockIssues(n.sub,null));
  });return msgs;
 }
 const oldValidate=validateModel;
 validateModel=function(){return oldValidate().concat(stockIssues(D(),null));};
 const oldShow=showResult;
 showResult=function(data){oldShow(data);stockIssues(state.doc,data&&data.variables_value).forEach(m=>traceMsg(m.level,m.msg,m.ref));};
 const oldSolve=doSolve;
 doSolve=function(){const bad=stockIssues(state.doc,null).filter(m=>m.level==='error');if(bad.length){bad.forEach(m=>traceMsg(m.level,m.msg,m.ref));return;}oldSolve();};
 const oldProps=renderProps;
 renderProps=function(){
  oldProps();const body=document.getElementById('props');
  const sel=state.sel.length===1?state.sel[0]:null;
  if(!sel)return;
  if(sel.kind==='node'){
   const n=getNode(sel.id);if(!n)return;
   if(state.propTab==='general'&&n.type!=='subsystem'){
    const box=document.createElement('div');
    const role=n.type==='stock'?(n.boundary?'boundary':'stock'):'process';
    box.innerHTML='<label>Knotentyp / Systemzugehörigkeit<select id="demoRole"><option value="process">Prozess (intern)</option><option value="stock">Lager (intern, mit Bilanz)</option><option value="boundary">Systemgrenze: externer Ein-/Ausgang</option></select></label><p>Interne Knoten bestimmen den gestrichelten Rahmen. Die Position allein ändert die Zugehörigkeit nicht.</p><button id="demoValues">'+(role==='stock'?'Lagerbestände und Unsicherheiten einstellen':role==='process'?'Transferkoeffizienten einstellen':'Werte über angeschlossene Flüsse einstellen')+'</button>';
    body.prepend(box);document.getElementById('demoRole').value=role;
    document.getElementById('demoRole').onchange=e=>{pushUndo();const r=e.target.value;n.type=r==='process'?'process':'stock';n.boundary=r==='boundary';if(n.type==='stock')ensureStock(n);changed();};
    document.getElementById('demoValues').onclick=()=>{state.propTab='values';renderProps();};
   }
   if(n.type==='stock'&&!n.boundary){
    const l=state.layers.find(x=>x.id===state.activeLayer);n.capacities=n.capacities||{};
    const box=document.createElement('section');const cap=n.capacities[l.id];
    box.innerHTML='<h4>Lagerkapazität — '+safe(l.name)+'</h4><label>Maximaler Bestand ('+safe(l.dispUnit||l.unit)+')<input id="demoCapacity" type="number" min="0" step="any" value="'+(cap==null?'':safe(cap))+'" placeholder="nicht festgelegt"></label><p>Anfangsbestand + Zufluss − Entnahme = Endbestand. Kapazität ist ein Bestand, kein Jahresdurchsatz. Getrennte Grenzen je Schicht; keine gemeinsame Raumkapazität. Prüfung vor/nach Berechnung, nicht im Optimierer; Spitzen innerhalb der Periode werden nicht erfasst.</p><div id="demoStockStatus"></div>';
    body.appendChild(box);
    document.getElementById('demoCapacity').onchange=e=>{n.capacities[l.id]=e.target.value===''?null:+e.target.value;changed();};
    const pd=n.pd[curP()][l.id];
    document.getElementById('demoStockStatus').textContent='Eingegeben: Anfang '+pd.start.value+', Ende '+pd.end.value+' '+(l.dispUnit||l.unit)+(cap!=null?' / Kapazität '+cap:'');
    if(state.propTab==='values'){
     const note=document.createElement('p');note.textContent='Bestände in '+(l.dispUnit||l.unit)+'; Zuflüsse/Entnahmen als Periodenmengen pro Jahr. Werte je Schicht separat eingeben.';body.prepend(note);
    }
   }
  }else if(sel.kind==='flow'){
   const f=D().flows.find(x=>x.id===sel.id);if(!f)return;
   if(state.propTab==='general'){
    const box=document.createElement('section');box.innerHTML='<h4>Ein Fluss — mehrere Mengen</h4><p>Dieselbe Verbindung trägt Glas und Restflüssigkeit. Schicht wählen, danach Werte eingeben. Tonnen und Liter werden weder addiert noch ohne Dichte umgerechnet.</p><button id="demoFlowValues">Menge und Unsicherheit einstellen</button>';
    body.appendChild(box);document.getElementById('demoFlowValues').onclick=()=>{state.propTab='values';renderProps();};
   }else{
    const l=state.layers.find(x=>x.id===state.activeLayer);const title=document.createElement('h4');title.textContent=l.name+' — '+l.unit+' — '+curP();body.prepend(title);
   }
  }
 };
 async function loadDemo(){
  if(!confirm('Aktuelles Projekt durch die synthetische Altglas-Demo ersetzen? Vorher bei Bedarf speichern.'))return;
  try{
   const r=await fetch('examples/altglas-demo.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
   const s=await r.json();Object.assign(state,s);state.editPath=[];state.sel=[];state.trace=[];state.expanded={};state.undoStack=[];state.redoStack=[];state.activeLayer=s.layers[0].id;state.activePeriod=String(s.periods.start);state.lastResult=null;state.lastPayload=null;state.mode='select';state.connectFrom=null;
   ui.lang='de';ui.zoom=0.8;ui.displayMode='entered';saveUI();migrate();save();renderAll();setModeButtons();traceMsg('info','Altglas-Demo: Anlieferung → Annahme → Lager → Sortierung. Glas (t/a) und Restflüssigkeit (l/a) auf denselben Flüssen. Synthetische Daten; siehe ALTGLAS-DEMO.md.');
  }catch(e){traceMsg('error','Demo konnte nicht geladen werden: '+e.message);}
 }
 document.getElementById('shBoundary').onclick=addBoundary;
 document.getElementById('tbAltglas').onclick=loadDemo;
 document.getElementById('shStock').onclick=()=>addNode('stock');
 document.getElementById('shProcess').onclick=()=>addNode('process');
 document.getElementById('tbSolve').onclick=doSolve;
 renderAll();
})();
