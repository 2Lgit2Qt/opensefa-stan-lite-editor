const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('canvas');
const LS_KEY='opensefa-stan-lite-project';
const UI_KEY='opensefa-stan-lite-ui';
const MAT=[{code:'C',name:'Carbon',kind:'substance'},{code:'N',name:'Nitrogen',kind:'substance'},{code:'P',name:'Phosphorus',kind:'substance'},{code:'K',name:'Potassium',kind:'substance'},{code:'S',name:'Sulphur',kind:'substance'},{code:'Cl',name:'Chlorine',kind:'substance'},{code:'Ca',name:'Calcium',kind:'substance'},{code:'Fe',name:'Iron',kind:'substance'},{code:'Cu',name:'Copper',kind:'substance'},{code:'Zn',name:'Zinc',kind:'substance'},{code:'Pb',name:'Lead',kind:'substance'},{code:'Al',name:'Aluminium',kind:'substance'},{code:'Si',name:'Silicon',kind:'substance'},{code:'Cd',name:'Cadmium',kind:'substance'},{code:'Hg',name:'Mercury',kind:'substance'},{code:'H2O',name:'Water',kind:'substance'},{code:'CO2',name:'Carbon dioxide',kind:'substance'},{code:'ORG',name:'Organic dry matter',kind:'substance'},{code:'SUB',name:'Subgood (custom)',kind:'subgood'},{code:'EN',name:'Energy',kind:'energy'}];
const I18N={
 en:{file:'File',edit:'Edit',view:'View',extras:'Extras',new:'New',open:'Open',save:'Save project',undo:'Undo',redo:'Redo',find:'Find objects',del:'Delete',explorer:'Model Explorer',shapes:'Shapes',properties:'Properties',trace:'Trace Output',process:'Process',stock:'Stock',connect:'Internal flow',select:'Selection mode',solve:'Calculate',layers:'Layers',grid:'Grid',snap:'Snap to grid',zoomIn:'Zoom in',zoomOut:'Zoom out',clear:'Clear',validation:'Check structure',sankey:'Show as Sankey',entered:'Entered',calculated:'Calculated',period:'Period'},
 de:{file:'Datei',edit:'Bearbeiten',view:'Ansicht',extras:'Extras',new:'Neu',open:'Öffnen',save:'Projekt speichern',undo:'Rückgängig',redo:'Wiederholen',find:'Objekte suchen',del:'Löschen',explorer:'Modell-Explorer',shapes:'Formen',properties:'Eigenschaften',trace:'Trace-Ausgabe',process:'Prozess',stock:'Lager',connect:'Interner Fluss',select:'Auswahlmodus',solve:'Berechnen',layers:'Schichten',grid:'Gitter',snap:'Am Gitter fangen',zoomIn:'Vergrößern',zoomOut:'Verkleinern',clear:'Leeren',validation:'Struktur prüfen',sankey:'Als Sankey zeigen',entered:'Eingegeben',calculated:'Berechnet',period:'Zeitraum'}
};
I18N.en.model='Model name';I18N.de.model='Modellname';I18N.en.name='Name';I18N.de.name='Name';I18N.en.value='Value';I18N.de.value='Wert';I18N.en.uncertainty='Uncertainty';I18N.de.uncertainty='Unsicherheit';I18N.en.unit='Unit';I18N.de.unit='Einheit';I18N.en.type='Type';I18N.de.type='Typ';I18N.en.measured='measured';I18N.de.measured='gemessen';I18N.en.unmeasured='unmeasured';I18N.de.unmeasured='ungemessen';I18N.en.fixed='fixed';I18N.de.fixed='fixiert';I18N.en.boundary='Boundary stock (no balance equation)';I18N.de.boundary='Grenz-Lager (keine Bilanzgleichung)';I18N.en.start='Start content';I18N.de.start='Anfangsbestand';I18N.en.end='End content';I18N.de.end='Endbestand';I18N.en.tc='Transfer coefficients';I18N.de.tc='Transferkoeffizienten';I18N.en.conc='Concentration';I18N.de.conc='Konzentration';I18N.en.worksheet='Worksheet';I18N.de.worksheet='Arbeitsblatt';I18N.en.general='General';I18N.de.general='Allgemein';I18N.en.values='Values';I18N.de.values='Werte';I18N.en.system='System';I18N.de.system='System';I18N.en.short='Short symbol';I18N.de.short='Kurzzeichen';I18N.en.remarks='Remarks';I18N.de.remarks='Anmerkungen';I18N.en.routing='Routing';I18N.de.routing='Verlauf';
let ui={lang:'en',zoom:1,grid:true,snap:true,displayMode:'entered',captionType:'name',unitMode:'entered'};
try{Object.assign(ui,JSON.parse(localStorage.getItem(UI_KEY))||{});}catch(e){}
if(!I18N[ui.lang])ui.lang=(navigator.language||'').toLowerCase().startsWith('de')?'de':'en';
function t(k){return (I18N[ui.lang]&&I18N[ui.lang][k])||I18N.en[k]||k;}
function saveUI(){localStorage.setItem(UI_KEY,JSON.stringify(ui));}
let state={scaling:{unit:'capita',factor:100000,mode:'none'},doc:{nodes:[],flows:[],texts:[],nextId:1},layers:[{id:'L1',code:'G',name:'Goods',kind:'goods',unit:'t/a',calc:true,dispUnit:'t'}],materials:[],refs:[],units:{mass:{t:1000,kg:1,g:0.001,lb:0.45359237},volume:{m3:1,l:0.001,hl:0.1},energy:{MJ:1,GJ:1000,kWh:3.6,MWh:3600},time:{a:1,d:1/365,h:1/8760}},customUnits:{},periods:{start:2026,count:1},activePeriod:null,subgoods:false,editPath:[],sel:[],mode:'select',connectFrom:null,modelName:'SEFMN model',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',worksheet:{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''},expanded:{},trace:[],clipboard:null,undoStack:[],redoStack:[],propTab:'general'};
function periodList(){const r=[];for(let i=0;i<state.periods.count;i++)r.push(String(state.periods.start+i));return r;}
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function D(){let d=state.doc;for(const id of state.editPath){const n=d.nodes.find(x=>x.id===id);if(!n)return state.doc;if(!n.sub)n.sub={nodes:[],flows:[],texts:[],nextId:1};d=n.sub;}return d;}
function save(){localStorage.setItem(LS_KEY,JSON.stringify({scaling:state.scaling,doc:state.doc,layers:state.layers,materials:state.materials,refs:state.refs,units:state.units,customUnits:state.customUnits,periods:state.periods,subgoods:state.subgoods,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet}));}
function scaleFactor(){if(!state.scaling||state.scaling.mode==='none')return 1;const d=D();if(state.scaling.mode==='imports'){let s=0;d.flows.forEach(f=>{if(flowKind(f)==='import'){const dd=f.pd[curP()][state.activeLayer];if(dd)s+=Math.abs(+dd.value||0);}});return s||1;}if(state.scaling.mode==='exports'){let s=0;d.flows.forEach(f=>{if(flowKind(f)==='export'){const dd=f.pd[curP()][state.activeLayer];if(dd)s+=Math.abs(+dd.value||0);}});return s||1;}return state.scaling.factor||1;}
function scaleDisplay(v){const k=scaleFactor();if(k===1)return v;return v/k;}
function ensureFlow(f){
 if(!f.pd){const p0=String(state.periods.start);f.pd={};f.pd[p0]=f.layerData||{};delete f.layerData;}
 periodList().forEach(p=>{if(!f.pd[p])f.pd[p]={};state.layers.forEach(l=>{if(!f.pd[p][l.id])f.pd[p][l.id]={type:'unmeasured',value:0,unc:0.1,unit:l.unit||'t/a',ref:'',rem:''};else{if(f.pd[p][l.id].ref===undefined)f.pd[p][l.id].ref='';if(f.pd[p][l.id].rem===undefined)f.pd[p][l.id].rem='';}});if(!f.pd[p].conc)f.pd[p].conc=(f.conc!==undefined)?JSON.parse(JSON.stringify(f.conc)):{enabled:false,type:'measured',value:10,unc:1};if(!f.pd[p].vol)f.pd[p].vol={type:'unmeasured',value:0,unc:0.1};if(!f.pd[p].dens)f.pd[p].dens={type:'unmeasured',value:0,unc:0.1};});
 if(f.conc!==undefined)delete f.conc;
 if(!f.tc){f.tc={};state.layers.forEach(l=>{f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});}
 if(!f.routing)f.routing='straight';
}
function ensureStock(n){
 if(!n.pd){const p0=String(state.periods.start);n.pd={};n.pd[p0]=n.layerData||{};delete n.layerData;}
 periodList().forEach(p=>{if(!n.pd[p])n.pd[p]={};state.layers.forEach(l=>{if(!n.pd[p][l.id])n.pd[p][l.id]={start:{type:'fixed',value:0,unc:0,ref:'',rem:''},end:{type:'fixed',value:0,unc:0,ref:'',rem:''}};else{['start','end'].forEach(k=>{if(n.pd[p][l.id][k].ref===undefined)n.pd[p][l.id][k].ref='';if(n.pd[p][l.id][k].rem===undefined)n.pd[p][l.id][k].rem='';});}});});
}
function migrateDoc(doc){
 if(!doc.texts)doc.texts=[];
 if(!doc.nextId)doc.nextId=1;
 doc.flows.forEach(ensureFlow);
 doc.nodes.forEach(n=>{
  if(n.type==='stock'){if(n.boundary===undefined)n.boundary=false;ensureStock(n);}
  if(n.type==='subsystem'&&!n.sub)n.sub={nodes:[],flows:[],texts:[],nextId:1};
  if(n.sub)migrateDoc(n.sub);
 });
}
function migrate(){
 const s=state.doc;
 if(!s||!s.nodes){const legacy=JSON.parse(localStorage.getItem(LS_KEY)||'{}');if(legacy.doc)state.doc=legacy.doc;else if(legacy.nodes)state.doc={nodes:legacy.nodes,flows:legacy.flows,texts:[],nextId:legacy.nextId||1};else state.doc={nodes:[],flows:[],texts:[],nextId:1};}
 state.layers=state.layers&&state.layers.length?state.layers:[{id:'L1',code:'G',name:'Goods',kind:'goods',unit:'t/a',calc:true,dispUnit:'t'}];
 if(!state.layers.find(l=>l.id===state.activeLayer))state.activeLayer=state.layers[0].id;
 if(!state.periods)state.periods={start:2026,count:1};
 if(!state.activePeriod||!periodList().includes(state.activePeriod))state.activePeriod=String(state.periods.start);
 state.scaling=state.scaling||{unit:'capita',factor:100000,mode:'none'};
 state.worksheet=state.worksheet||{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''};
 if(!state.refs)state.refs=[];
 migrateDoc(state.doc);
}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s&&s.doc&&s.doc.nodes){Object.assign(state,{scaling:s.scaling||state.scaling,doc:s.doc,layers:s.layers||state.layers,materials:s.materials||[],refs:s.refs||[],units:s.units||state.units,customUnits:s.customUnits||{},periods:s.periods||state.periods,subgoods:!!s.subgoods,modelName:s.modelName||state.modelName,periodLabel:s.periodLabel||state.periodLabel,worksheet:s.worksheet||state.worksheet});migrate();return true;}}catch(e){}migrate();return false;}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;a.click();}
function varObj(v,name,tc){const out={name,is_transfer_coefficient:!!tc};if(v.type==='measured'){out.type='MeasuredVariable';out.value=v.value;out.uncertainty=v.unc;}else if(v.type==='fixed'){out.type='FixedVariable';out.value=v.value;}else out.type='UnmeasuredVariable';return out;}
function isSelected(kind,id){return state.sel.some(s=>s.kind===kind&&s.id===id);}
function select(sel,add){
 if(add&&sel){const i=state.sel.findIndex(s=>s.kind===sel.kind&&s.id===sel.id);if(i>=0)state.sel.splice(i,1);else state.sel.push(sel);}
 else if(sel)state.sel=[sel];
 else state.sel=[];
 state.propTab='general';renderAll();
}
function getNode(id){return D().nodes.find(n=>n.id===id);}
function curP(){return state.activePeriod;}
function vname(f,l,p){return f.name+'__'+l+'__'+(p||curP());}
function tname(f,l){return f.name+'_tc__'+l;}
function unitFamily(u){for(const fam of Object.keys(state.units))if(state.units[fam][u]!==undefined)return fam;return null;}
function toDisplay(v,u,layer){if(ui.unitMode!=='display'||!layer||!layer.dispUnit)return {v:v,u:u};const f1=unitFamily(u),f2=unitFamily(layer.dispUnit);if(!f1||f1!==f2)return {v:v,u:u};const k=state.units[f1][u]/state.units[f1][layer.dispUnit];return {v:v*k,u:layer.dispUnit};}
function flowValue(f,l,p){const n=vname(f,l,p);if(state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[n]!==undefined)return Math.abs(+state.lastResult.variables_value[n]||0);const d=f.pd[p||curP()][l];return Math.abs(+d.value||0);}
function pushUndo(){state.undoStack.push(JSON.stringify(state.doc));if(state.undoStack.length>50)state.undoStack.shift();state.redoStack=[];}
function doUndo(){if(!state.undoStack.length)return;state.redoStack.push(JSON.stringify(state.doc));state.doc=JSON.parse(state.undoStack.pop());migrateDoc(state.doc);state.sel=[];save();renderAll();}
function doRedo(){if(!state.redoStack.length)return;state.undoStack.push(JSON.stringify(state.doc));state.doc=JSON.parse(state.redoStack.pop());migrateDoc(state.doc);state.sel=[];save();renderAll();}
function addNode(type){
 pushUndo();
 const prefix=type==='process'?'P':type==='stock'?'S':'Sub';
 const n={id:'n'+D().nextId++,type,name:prefix+D().nextId,short:'',remarks:'',x:150+Math.random()*300,y:120+Math.random()*200};
 if(type==='stock'){n.boundary=false;n.pd={};periodList().forEach(p=>{n.pd[p]={};state.layers.forEach(l=>{n.pd[p][l.id]={start:{type:'fixed',value:0,unc:0,ref:'',rem:''},end:{type:'fixed',value:0,unc:0,ref:'',rem:''}};});});}
 if(type==='subsystem')n.sub={nodes:[],flows:[],texts:[],nextId:1};
 D().nodes.push(n);select({kind:'node',id:n.id});save();
}
function addText(){pushUndo();const tx={id:'x'+D().nextId++,x:200+Math.random()*200,y:100+Math.random()*150,text:'Text'};D().texts.push(tx);select({kind:'text',id:tx.id});save();}
function addFlow(from,to){
 if(from===to)return;
 pushUndo();
 const f={id:'f'+D().nextId++,name:'F'+(D().flows.length+1),from,to,routing:'straight',lx:0,ly:0,pd:{},tc:{}};
 periodList().forEach(p=>{f.pd[p]={};state.layers.forEach(l=>{f.pd[p][l.id]={type:'unmeasured',value:0,unc:0.1,unit:l.unit||'t/a',ref:'',rem:''};f.pd[p].conc={enabled:false,type:'measured',value:10,unc:1};f.pd[p].vol={type:'unmeasured',value:0,unc:0.1};f.pd[p].dens={type:'unmeasured',value:0,unc:0.1};});});
 state.layers.forEach(l=>{f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});
 ensureFlow(f);D().flows.push(f);select({kind:'flow',id:f.id});save();
}
function flowKind(f){const a=getNode(f.from),b=getNode(f.to);if(a&&a.type==='stock'&&a.boundary)return 'import';if(b&&b.type==='stock'&&b.boundary)return 'export';return 'internal';}
function deleteSelection(){
 if(!state.sel.length)return;
 pushUndo();
 const nodeIds=new Set(state.sel.filter(s=>s.kind==='node').map(s=>s.id));
 const flowIds=new Set(state.sel.filter(s=>s.kind==='flow').map(s=>s.id));
 const textIds=new Set(state.sel.filter(s=>s.kind==='text').map(s=>s.id));
 const d=D();
 d.flows=d.flows.filter(f=>!flowIds.has(f.id)&&!nodeIds.has(f.from)&&!nodeIds.has(f.to));
 d.nodes=d.nodes.filter(n=>!nodeIds.has(n.id));
 d.texts=d.texts.filter(x=>!textIds.has(x.id));
 state.sel=[];save();renderAll();
}
function copySelection(){
 const nodeIds=new Set(state.sel.filter(s=>s.kind==='node').map(s=>s.id));
 if(!nodeIds.size)return;
 const d=D();
 state.clipboard={nodes:d.nodes.filter(n=>nodeIds.has(n.id)).map(n=>JSON.parse(JSON.stringify(n))),flows:d.flows.filter(f=>nodeIds.has(f.from)&&nodeIds.has(f.to)).map(f=>JSON.parse(JSON.stringify(f)))};
 traceMsg('info','Copied '+state.clipboard.nodes.length+' object(s).');
}
function pasteClipboard(){
 if(!state.clipboard||!state.clipboard.nodes.length)return;
 pushUndo();
 const map={};const d=D();
 state.clipboard.nodes.forEach(n=>{const nid='n'+d.nextId++;map[n.id]=nid;n.id=nid;n.x+=30;n.y+=30;n.name=n.name+'_c';});
 state.clipboard.flows.forEach(f=>{f.id='f'+d.nextId++;f.from=map[f.from];f.to=map[f.to];});
 d.nodes=d.nodes.concat(state.clipboard.nodes);
 d.flows=d.flows.concat(state.clipboard.flows);
 migrateDoc(d);
 traceMsg('info','Pasted '+state.clipboard.nodes.length+' object(s).');
 save();renderAll();
}
function enterSubsystem(id){const n=getNode(id);if(!n||n.type!=='subsystem')return;if(state.editPath.length>=5){traceMsg('warning','Maximum of six hierarchy levels reached.');return;}state.editPath.push(id);state.sel=[];renderAll();}
function exitSubsystem(){if(state.editPath.length){state.editPath.pop();state.sel=[];renderAll();}}
function toWorld(e){const r=svg.getBoundingClientRect();return {x:(e.clientX-r.left)/ui.zoom,y:(e.clientY-r.top)/ui.zoom};}
function anchorPt(n,toward){
 const dx=toward.x-n.x,dy=toward.y-n.y;const len=Math.hypot(dx,dy)||1;const ux=dx/len,uy=dy/len;
 if(n.type==='stock')return {x:n.x+22*ux,y:n.y+22*uy};
 let hw=30,hh=20;if(n.type==='subsystem'){hw=40;hh=25;}
 const s=Math.min(hw/Math.max(Math.abs(ux),1e-9),hh/Math.max(Math.abs(uy),1e-9));
 return {x:n.x+s*ux,y:n.y+s*uy};
}
function captionOf(n){
 if(ui.captionType==='short'&&n.short)return n.short;
 if(ui.captionType==='both')return (n.short?n.short+': ':'')+n.name;
 return n.name;
}
