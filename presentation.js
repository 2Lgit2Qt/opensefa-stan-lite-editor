/* German editor UI and per-document system boundaries. */
(function(){
'use strict';
ui.lang='de';saveUI();document.documentElement.lang='de';
Object.assign(I18N.de,{connect:'Fluss',stock:'Lager',boundary:'Externer Ein-/Ausgang',trace:'Meldungen',select:'Auswahl',snap:'Ausrichten',sankey:'Sankey',unmeasured:'Unbekannt',fixed:'Fest',measured:'Gemessen'});
const q=id=>document.getElementById(id);
const safe=v=>esc(v==null?'':v).replace(/"/g,'&quot;');
function invalidate(){state.lastResult=null;state.lastPayload=null;save();}
function commit(){invalidate();renderAll();}
function label(text,id,value,type){return '<label>'+safe(text)+'<input id="'+id+'" type="'+(type||'text')+'" value="'+safe(value)+'"'+(type==='number'?' step="any"':'')+'></label>';}
const translations={
'Common':'Allgemein','Sankey':'Sankey','Data':'Daten','Defaults':'Vorgaben','Options':'Optionen','Language':'Sprache','English':'Englisch','Deutsch':'Deutsch','Show grid':'Gitter anzeigen','Snap to grid':'Am Gitter ausrichten','Caption type':'Beschriftung','Name':'Name','Short symbol':'Kurzzeichen','Both':'Beide','Diagram font size':'Schriftgröße','Show as Sankey (flows proportional to values)':'Sankey-Darstellung','Maximum arrow width (px)':'Maximale Flussbreite (px)','Show calculated values in diagram':'Berechnete Werte anzeigen','Use display units in diagram':'Anzeigeeinheiten verwenden','Use subgood layers (subgood flows must sum to goods flow)':'Untergut-Schichten verwenden','Scaling basis':'Skalierung','Scaling unit':'Bezugseinheit','Scaling factor':'Bezugswert','Scale data by':'Skalieren nach','No scaling':'Keine','Σ imports':'Summe Einfuhr','Σ exports':'Summe Ausfuhr','Grid spacing: 20 px (fixed)':'Gitterabstand: 20 px','Snap increments: 20 px (fixed)':'Ausrichtungsabstand: 20 px','Process size: 60×40 px (fixed)':'Prozessgröße: 60 × 40 px','Subsystem size: 80×50 px (fixed)':'Subsystemgröße: 80 × 50 px','Reset all settings to defaults':'Vorgaben wiederherstellen','Close':'Schließen','Calculation':'Berechnung','Trace level':'Meldungsumfang','First period':'Erster Zeitraum','Last period':'Letzter Zeitraum','Display used equations after computation':'Gleichungen anzeigen','Start':'Starten','none':'Keine','errors':'Fehler','warnings':'Warnungen','information':'Informationen','details':'Details','Literature references':'Literaturquellen','Reference':'Quelle','New reference':'Neue Quelle','Add':'Hinzufügen','Delete':'Löschen','Define material':'Material definieren','Code':'Kennung','Kind':'Art','predefined':'Vordefiniert','New material':'Neues Material','Add material':'Material hinzufügen','substance':'Stoff','subgood':'Untergut','energy':'Energie','goods':'Gut','volume':'Volumen','Layers and periods':'Schichten und Zeiträume','Periods':'Zeiträume','Start year':'Startjahr','Number of periods (1 year each)':'Anzahl Jahre','Apply periods':'Zeiträume übernehmen','Layers':'Schichten','Layer':'Schicht','Unit':'Einheit','Calc':'Berechnen','Display unit':'Anzeigeeinheit','Add layer from material':'Material','Add layer':'Schicht hinzufügen','Define units':'Einheiten definieren','Factor (to base)':'Faktor zur Basiseinheit','Family':'Größe','Unit name (must not start with a number)':'Einheitenname','Factor to family base':'Faktor zur Basiseinheit','Insert unit':'Einheit hinzufügen','mass':'Masse','time':'Zeit','Data Explorer':'Daten-Explorer','Flow values':'Flusswerte','Transfer coefficients':'Transferkoeffizienten','Stocks':'Lagerbestände','Concentrations':'Konzentrationen','Processes':'Prozesse','Edit':'Bearbeiten','Calculated':'Berechnet','Group':'Gruppierung','Period → Layer':'Zeitraum → Schicht','Layer → Period':'Schicht → Zeitraum','None':'Keine','Copy TSV':'TSV kopieren','Export CSV':'CSV exportieren','Paste block':'Daten einfügen','Apply pasted block':'Daten übernehmen','Flow':'Fluss','From':'Von','To':'Nach','Period':'Zeitraum','Type':'Typ','Value':'Wert','Unc.':'Unsicherheit','Ref':'Quelle','Rem':'Anmerkung','Reconciled':'Ausgeglichen','Enabled':'Aktiv','Stock':'Lager','Start/End':'Anfang/Ende','Inputs':'Zuflüsse','Outputs':'Abflüsse','yes':'Ja','no':'Nein','start':'Anfang','end':'Ende','measured':'Gemessen','unmeasured':'Unbekannt','fixed':'Fest','Document information':'Dokumentinformationen','Model':'Modell','Subsystems':'Subsysteme','Flows':'Flüsse','Text fields':'Textfelder','Variables (exported)':'Variablen','Equations (exported)':'Gleichungen','Measured values':'Messwerte','Fixed values':'Festwerte','Unmeasured values':'Unbekannte Werte','Data completeness':'Datenvollständigkeit','Documented values':'Dokumentierte Werte','Subgood mode':'Untergut-Modus','Scaling':'Skalierung','enabled':'Aktiv','disabled':'Inaktiv','Status':'Status','Objective':'Zielfunktion','Residual':'Residuum','Solve time':'Rechenzeit','Variable':'Variable','Entered':'Eingegeben','Unc':'Unsicherheit'
};
function localize(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>{
  const p=n.parentElement;if(!p||p.closest('textarea,pre,[contenteditable]'))return;
  if(p.tagName==='OPTION'&&!p.hasAttribute('value'))p.value=p.textContent;
  const s=n.nodeValue.trim();if(Object.prototype.hasOwnProperty.call(translations,s))n.nodeValue=n.nodeValue.replace(s,translations[s]);
 });
}
const oldModal=openModal;
openModal=function(title,html,cls){oldModal(translations[title]||title,html,cls);};
['optionsDialog','calcDialog','refsDialog','materialsDialog','layersDialog','unitsDialog','documentInfo','dexRender','dexOpen'].forEach(name=>{
 const fn=window[name];if(typeof fn!=='function')return;
 window[name]=function(){const result=fn.apply(this,arguments);const root=q('modalBody');root.querySelectorAll('p').forEach(p=>p.remove());localize(q('modalBox'));return result;};
});
// Observe only the built-in modal, not diagram names or user-entered data.
let translating=false;
new MutationObserver(()=>{if(translating)return;translating=true;localize(q('modalBox'));q('modalBody').querySelectorAll('p').forEach(p=>p.remove());translating=false;}).observe(q('modalBox'),{childList:true,subtree:true});
const oldStatic=renderStatic;
renderStatic=function(){
 oldStatic();
 const texts={miSaveAs:'Speichern unter …',miClean:'Beispiel: Bilanz',miConflict:'Beispiel: Konflikt',miWorksheet:'Arbeitsblatt exportieren',miJson:'Solver-JSON exportieren',miExportSvg:'SVG exportieren',miExportPng:'PNG exportieren',miDocInfo:'Dokumentinformationen',miCsv:'CSV importieren',miMaterials:'Materialien',miLayers:'Schichten und Zeiträume',miUnits:'Einheiten',miRefs:'Literaturquellen',miCalc:'Berechnung …',miData:'Daten-Explorer',miOptions:'Optionen',miReset:'Einstellungen zurücksetzen',shBoundary:'Externer Ein-/Ausgang',shText:'Textfeld',shSubsystem:'Subsystem',tbAltglas:'Beispiel: Altglas',miLang:'Sprache: Deutsch'};
 Object.keys(texts).forEach(id=>{if(q(id))q(id).textContent=texts[id];});
 q('tbUnitsMode').textContent='Einheiten: '+(ui.unitMode==='entered'?'Eingabe':'Anzeige');
 q('tbSankey').textContent='Sankey: '+(state.weighted?'an':'aus');
 q('miCaption').textContent='Beschriftung: '+({name:'Name',short:'Kurzzeichen',both:'Beide'}[ui.captionType]||'Name');
 q('miSubgoods').textContent='Untergut-Schichten: '+(state.subgoods?'an':'aus');
 q('findInput').placeholder='Suchbegriff';
};
q('miLang').onclick=()=>{};
// The former release referenced these IDs without creating the buttons.
['tbBoundaryDraw','tbBoundaryClear'].forEach((id,i)=>{
 if(q(id))return;const b=document.createElement('button');b.id=id;b.textContent=i?'Systemgrenze entfernen':'Systemgrenze zeichnen';q('shapes').appendChild(b);
});
let boundarySelected=false,gesture=null;
function frame(){return D().systemBoundary||null;}
function finish(){
 if(!gesture)return;
 const old=gesture.before;const doc=gesture.doc;
 if(gesture.kind==='draw'&&doc.systemBoundary&&(doc.systemBoundary.w<40||doc.systemBoundary.h<40))doc.systemBoundary=gesture.previous;
 state.undoStack.push(old);state.redoStack=[];gesture=null;state.mode='select';invalidate();renderAll();setModeButtons();
}
function begin(e,kind,corner){
 if(e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();
 const d=D(),p=toWorld(e),previous=d.systemBoundary?Object.assign({},d.systemBoundary):null;
 gesture={kind,corner,doc:d,before:JSON.stringify(state.doc),previous,start:p,base:previous};boundarySelected=true;
 if(kind==='draw')d.systemBoundary={x:p.x,y:p.y,w:0,h:0};
 render();
}
svg.addEventListener('mousedown',e=>{if(state.mode==='boundary')begin(e,'draw');},true);
window.addEventListener('mousemove',e=>{
 if(!gesture)return;e.preventDefault();const p=toWorld(e),g=gesture,s=g.start,b=g.base;
 if(g.kind==='draw')g.doc.systemBoundary={x:Math.min(s.x,p.x),y:Math.min(s.y,p.y),w:Math.abs(p.x-s.x),h:Math.abs(p.y-s.y)};
 else if(g.kind==='move')g.doc.systemBoundary={x:b.x+p.x-s.x,y:b.y+p.y-s.y,w:b.w,h:b.h};
 else{
  let x0=b.x,y0=b.y,x1=b.x+b.w,y1=b.y+b.h;
  if(g.corner.includes('w'))x0=Math.min(p.x,x1-40);else x1=Math.max(p.x,x0+40);
  if(g.corner.includes('n'))y0=Math.min(p.y,y1-40);else y1=Math.max(p.y,y0+40);
  g.doc.systemBoundary={x:x0,y:y0,w:x1-x0,h:y1-y0};
 }
 render();
},true);
window.addEventListener('mouseup',finish,true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){gesture.doc.systemBoundary=gesture.previous;gesture=null;state.mode='select';renderAll();setModeButtons();}},true);
q('tbBoundaryDraw').onclick=()=>{state.mode='boundary';state.connectFrom=null;boundarySelected=true;setModeButtons();};
q('tbBoundaryClear').onclick=()=>{pushUndo();delete D().systemBoundary;boundarySelected=false;commit();};
const oldModes=setModeButtons;
setModeButtons=function(){oldModes();q('tbBoundaryDraw').style.fontWeight=state.mode==='boundary'?'bold':'normal';svg.style.cursor=state.mode==='boundary'?'crosshair':'';};
const oldRender=render;
render=function(){
 oldRender();const world=Array.from(svg.children).find(x=>x.tagName.toLowerCase()==='g');if(!world)return;
 // Remove the automatic boundary and its three metadata labels; leave nodes, flows and user text intact.
 Array.from(world.children).forEach(child=>{
  if(child.tagName.toLowerCase()==='rect'&&child.hasAttribute('stroke-dasharray'))child.remove();
  if(child.tagName.toLowerCase()==='text'&&!child.classList.contains('flowlabel'))child.remove();
 });
 const b=frame();if(!b)return;
 const group=el('g',{'data-system-boundary':'true'});
 const r=el('rect',{x:b.x,y:b.y,width:b.w,height:b.h,fill:'none',stroke:boundarySelected?'#2563eb':'#64748b','stroke-width':1.5,'stroke-dasharray':'7 5','pointer-events':'stroke',cursor:'move'});
 r.addEventListener('mousedown',e=>begin(e,'move'));group.appendChild(r);
 if(boundarySelected){['nw','ne','sw','se'].forEach(c=>{
  const h=el('rect',{x:(c.includes('w')?b.x:b.x+b.w)-4,y:(c.includes('n')?b.y:b.y+b.h)-4,width:8,height:8,fill:'#fff',stroke:'#2563eb',cursor:c+'-resize'});
  h.addEventListener('mousedown',e=>begin(e,'resize',c));group.appendChild(h);
 });}
 // After grid, before flows: frame never covers the nodes.
 const grid=world.firstElementChild;world.insertBefore(group,grid&&grid.getAttribute('fill')==='url(#gridp)'?grid.nextSibling:world.firstChild);
};
// Stable option values regardless of visible language.
dataEditor=function(v,p){
 return '<label>Typ<select id="'+p+'_type">'+['measured','unmeasured','fixed'].map(k=>'<option value="'+k+'"'+(v.type===k?' selected':'')+'>'+t(k)+'</option>').join('')+'</select></label>'+label('Wert',p+'_value',v.value,'number')+label('Unsicherheit (absolut)',p+'_unc',v.unc,'number')+label('Unsicherheit (%)',p+'_pct',v.value?v.unc/Math.abs(v.value)*100:0,'number');
};
const oldBind=bindDataEditor;
bindDataEditor=function(v,p,after){oldBind(v,p,()=>{invalidate();if(after)after();});};
function bindText(id,object,key,draw){q(id).onchange=e=>{object[key]=e.target.value;invalidate();if(draw){render();renderExplorer();}};}
function reference(d,p){return label('Quelle',p+'_ref',d.ref||'')+'<label>Anmerkung<textarea id="'+p+'_rem">'+safe(d.rem||'')+'</textarea></label>';}
function bindReference(d,p){bindText(p+'_ref',d,'ref');bindText(p+'_rem',d,'rem');}
renderProps=function(){
 const body=q('props'),tabs=q('propTabs'),sel=state.sel.length===1?state.sel[0]:null;
 const list=sel?['general','values']:['system','worksheet'];if(!list.includes(state.propTab))state.propTab=list[0];
 tabs.innerHTML=list.map(k=>'<button data-tab="'+k+'" class="'+(state.propTab===k?'active':'')+'">'+t(k)+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.propTab=b.dataset.tab;renderProps();});
 const l=state.layers.find(x=>x.id===state.activeLayer),L=l.id,p=curP();
 if(!sel){
  if(state.propTab==='worksheet'){
   const fields={question:'Fragestellung',spatial:'Räumliche Abgrenzung',period:'Bezugszeitraum',quantities:'Materialien',sources:'Quellen',interpretation:'Auswertung'};
   body.innerHTML=Object.keys(fields).map(k=>'<label>'+fields[k]+'<textarea id="ws_'+k+'">'+safe(state.worksheet[k]||'')+'</textarea></label>').join('');
   Object.keys(fields).forEach(k=>bindText('ws_'+k,state.worksheet,k));return;
  }
  body.innerHTML=label('Modellname','pModel',state.modelName)+'<div id="resultTable"></div>';
  bindText('pModel',state,'modelName',true);if(state.lastResult)fillResult(state.lastResult);return;
 }
 if(sel.kind==='text'){
  const x=D().texts.find(n=>n.id===sel.id);if(!x)return;body.innerHTML=label('Text','txText',x.text);bindText('txText',x,'text',true);return;
 }
 if(sel.kind==='node'){
  const n=getNode(sel.id);if(!n)return;
  if(state.propTab==='general'){
   body.innerHTML=label('Name','pName',n.name)+label('Kurzzeichen','pShort',n.short||'')+'<label>Anmerkung<textarea id="pRem">'+safe(n.remarks||'')+'</textarea></label>'+(n.type==='stock'?'<label><input id="boundary" type="checkbox" '+(n.boundary?'checked':'')+'> Externer Ein-/Ausgang</label>':'')+(n.type==='subsystem'?'<button id="pEnter">Subsystem öffnen</button>':'');
   bindText('pName',n,'name',true);bindText('pShort',n,'short',true);bindText('pRem',n,'remarks');
   if(q('boundary'))q('boundary').onchange=e=>{pushUndo();n.boundary=e.target.checked;commit();};
   if(q('pEnter'))q('pEnter').onclick=()=>enterSubsystem(n.id);
  }else if(n.type==='stock'&&!n.boundary){
   ensureStock(n);const pd=n.pd[p][L];
   body.innerHTML='<h4>Anfangsbestand ('+safe(l.dispUnit||l.unit)+')</h4>'+dataEditor(pd.start,'st')+'<h4>Endbestand ('+safe(l.dispUnit||l.unit)+')</h4>'+dataEditor(pd.end,'en');
   bindDataEditor(pd.start,'st',render);bindDataEditor(pd.end,'en',render);
  }else if(n.type==='process'){
   const outs=D().flows.filter(f=>f.from===n.id);outs.forEach(f=>{f.tc=f.tc||{};f.tc[L]=f.tc[L]||{enabled:false,type:'fixed',value:0,unc:0};});
   body.innerHTML=outs.map(f=>{const c=f.tc[L];return '<h4>'+safe(f.name)+'</h4><label><input type="checkbox" id="tc_'+f.id+'" '+(c.enabled?'checked':'')+'> Transferkoeffizient</label>'+(c.enabled?dataEditor(c,'tc'+f.id):'');}).join('');
   outs.forEach(f=>{q('tc_'+f.id).onchange=e=>{f.tc[L].enabled=e.target.checked;commit();};if(f.tc[L].enabled)bindDataEditor(f.tc[L],'tc'+f.id);});
  }else body.innerHTML='';
  if(n.type==='stock'&&!n.boundary){
   n.capacities=n.capacities||{};body.insertAdjacentHTML('beforeend',label('Kapazität ('+(l.dispUnit||l.unit)+')','stockCapacity',n.capacities[L],'number'));
   q('stockCapacity').min='0';q('stockCapacity').onchange=e=>{n.capacities[L]=e.target.value===''?null:+e.target.value;commit();};
  }
  return;
 }
 const f=D().flows.find(x=>x.id===sel.id);if(!f)return;ensureFlow(f);const d=f.pd[p][L];
 if(state.propTab==='general'){
  body.innerHTML=label('Name','fName',f.name)+'<label>Verlauf<select id="fRouting"><option value="straight">Gerade</option><option value="ortho">Rechtwinklig</option></select></label>';
  q('fRouting').value=f.routing;bindText('fName',f,'name',true);q('fRouting').onchange=e=>{f.routing=e.target.value;commit();};
 }else{
  body.innerHTML=dataEditor(d,'d')+label('Einheit','d_unit',d.unit)+reference(d,'d');
  bindDataEditor(d,'d',render);bindText('d_unit',d,'unit');bindReference(d,'d');
  // Preserve advanced model quantities without permanently displaying their editors.
  const advanced=document.createElement('details');advanced.innerHTML='<summary>Weitere Größen</summary>';
  if(l.kind==='goods')advanced.insertAdjacentHTML('beforeend','<h4>Volumenstrom</h4>'+dataEditor(f.pd[p].vol,'vol')+'<h4>Dichte</h4>'+dataEditor(f.pd[p].dens,'dens'));
  else if(l.kind==='substance'||l.kind==='energy')advanced.insertAdjacentHTML('beforeend','<label><input id="c_en" type="checkbox" '+(f.pd[p].conc.enabled?'checked':'')+'> Konzentration</label>'+dataEditor(f.pd[p].conc,'c'));
  if(advanced.children.length>1){body.appendChild(advanced);if(l.kind==='goods'){bindDataEditor(f.pd[p].vol,'vol');bindDataEditor(f.pd[p].dens,'dens');}else{bindDataEditor(f.pd[p].conc,'c');q('c_en').onchange=e=>{f.pd[p].conc.enabled=e.target.checked;commit();};}}
 }
};
fillResult=function(data){
 const box=q('resultTable');if(!box)return;
 const statuses={FEASIBLE:'Lösung gefunden',OPTIMAL:'Optimal',INFEASIBLE:'Nicht lösbar'};
 box.innerHTML='<h4>'+safe(statuses[data.status]||data.status||'Ergebnis')+'</h4><table><tr><th>Variable</th><th>Wert</th><th>Unsicherheit</th></tr>'+Object.keys(data.variables_value||{}).map(k=>'<tr><td>'+safe(k)+'</td><td>'+safe(data.variables_value[k])+'</td><td>'+safe((data.uncertainties||{})[k])+'</td></tr>').join('')+'</table>';
};
renderTrace=function(){
 const rows=state.trace.filter(m=>m.level!=='info');q('traceList').innerHTML=rows.map((m,i)=>'<p class="'+(m.ref?'cl':'')+'" data-index="'+i+'">'+(m.level==='error'?'Fehler: ':'Warnung: ')+safe(m.msg)+'</p>').join('');
 q('traceList').querySelectorAll('p.cl').forEach(e=>e.onclick=()=>select(rows[+e.dataset.index].ref));
};
const oldExplorer=renderExplorer;
renderExplorer=function(){oldExplorer();q('explorer').querySelectorAll('small').forEach(e=>{e.textContent='';});};
const oldCrumb=renderCrumb;
renderCrumb=function(){oldCrumb();if(q('crumbBack'))q('crumbBack').textContent='Zurück';};
function capacityMessages(doc,prefix){
 const messages=[];doc.nodes.forEach(n=>{
  if(n.type==='stock'&&!n.boundary)periodList().forEach(p=>state.layers.filter(l=>l.calc!==false).forEach(l=>{
   const pd=n.pd&&n.pd[p]&&n.pd[p][l.id],cap=n.capacities&&n.capacities[l.id];if(!pd)return;
   ['start','end'].forEach(k=>{const key=prefix+n.name+'_'+k+'__'+l.id+'__'+p;const results=state.lastResult&&state.lastResult.variables_value;const returned=results&&results[key]!=null;if(!returned&&pd[k].type==='unmeasured')return;const v=+(returned?results[key]:pd[k].value);
    if(v<0||(cap!=null&&(!Number.isFinite(+cap)||+cap<0||v>+cap+1e-7)))messages.push({level:'error',msg:n.name+': '+(k==='start'?'Anfangsbestand':'Endbestand')+' außerhalb der Lagergrenzen ('+p+', '+l.name+').',ref:{kind:'node',id:n.id}});
   });
  }));if(n.sub)messages.push(...capacityMessages(n.sub,prefix+n.name+'.'));
 });return messages;
}
const oldValidate=validateModel;
validateModel=function(){return oldValidate().concat(capacityMessages(state.doc,''));};
const oldShow=showResult;
showResult=function(data){oldShow(data);capacityMessages(state.doc,'').forEach(m=>traceMsg(m.level,m.msg,m.ref));};
const oldAdd=addNode;
addNode=function(type){const name=prompt('Name:',type==='stock'?'Lager':type==='subsystem'?'Subsystem':'Prozess');if(!name||!name.trim())return;oldAdd(type);getNode(state.sel[0].id).name=name.trim();commit();};
q('shProcess').onclick=()=>addNode('process');q('shStock').onclick=()=>addNode('stock');q('shSubsystem').onclick=()=>addNode('subsystem');
q('shBoundary').onclick=()=>{const name=prompt('Name:','Anlieferung');if(!name||!name.trim())return;oldAdd('stock');const n=getNode(state.sel[0].id);n.name=name.trim();n.boundary=true;n.x=60;commit();};
q('tbAltglas').onclick=async()=>{
 if(!confirm('Aktuelles Projekt durch das Altglas-Beispiel ersetzen?'))return;
 try{const r=await fetch('examples/altglas-demo.json',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const s=await r.json();Object.assign(state,s);Object.assign(state,{editPath:[],sel:[],trace:[],expanded:{},undoStack:[],redoStack:[],activeLayer:s.layers[0].id,activePeriod:String(s.periods.start),lastResult:null,lastPayload:null,mode:'select',connectFrom:null});state.doc.systemBoundary={x:170,y:170,w:570,h:140};ui.zoom=.8;ui.displayMode='entered';saveUI();migrate();save();renderAll();setModeButtons();}catch(e){traceMsg('error','Beispiel konnte nicht geladen werden: '+e.message);}
};
q('miJson').onclick=()=>download('solver.json',JSON.stringify(exportModel(),null,2));
// Compact, neutral styles; no hidden inputs or diagnostic errors.
const style=document.createElement('style');style.textContent='body{font-family:Inter,system-ui,sans-serif;color:#1e293b;background:#f8fafc}button,select,input,textarea{border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:inherit}button{cursor:pointer}button:hover{background:#eff6ff}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #2563eb;outline-offset:1px}#left{width:200px;background:#f8fafc}#right{width:330px;background:#f8fafc}.pane{padding:12px;border-color:#e2e8f0}.pane h3{letter-spacing:.04em;color:#64748b}#props{background:#fff;border-color:#e2e8f0}#props input[type=checkbox]{width:auto;margin-right:6px}#props details{margin-top:14px}#props summary{cursor:pointer;color:#64748b}#traceList{color:#b45309}#toolbars{gap:8px}#shapes button{text-align:left}#modalBox{border-radius:8px;border-color:#e2e8f0}#modalBox label{display:block;margin:8px 0}#modalBox p{display:none}';document.head.appendChild(style);
if(state.boundary&&!D().systemBoundary)D().systemBoundary=Object.assign({},state.boundary);
renderAll();setModeButtons();
})();
