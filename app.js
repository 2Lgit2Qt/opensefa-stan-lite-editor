const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('canvas');
const LS_KEY='opensefa-stan-lite-project';
const UI_KEY='opensefa-stan-lite-ui';
const I18N={
 en:{file:'File',edit:'Edit',view:'View',extras:'Extras',new:'New',open:'Open',save:'Save project',undo:'Undo',redo:'Redo',find:'Find objects',del:'Delete',explorer:'Model Explorer',shapes:'Shapes',properties:'Properties',trace:'Trace Output',process:'Process',stock:'Stock',connect:'Internal flow',select:'Selection mode',solve:'Calculate',layers:'Layers',grid:'Grid',snap:'Snap to grid',zoomIn:'Zoom in',zoomOut:'Zoom out',clear:'Clear',validation:'Check structure',sankey:'Show as Sankey',entered:'Entered',calculated:'Calculated',period:'Period'},
 de:{file:'Datei',edit:'Bearbeiten',view:'Ansicht',extras:'Extras',new:'Neu',open:'Öffnen',save:'Projekt speichern',undo:'Rückgängig',redo:'Wiederholen',find:'Objekte suchen',del:'Löschen',explorer:'Modell-Explorer',shapes:'Formen',properties:'Eigenschaften',trace:'Trace-Ausgabe',process:'Prozess',stock:'Lager',connect:'Interner Fluss',select:'Auswahlmodus',solve:'Berechnen',layers:'Schichten',grid:'Gitter',snap:'Am Gitter fangen',zoomIn:'Vergrößern',zoomOut:'Verkleinern',clear:'Leeren',validation:'Struktur prüfen',sankey:'Als Sankey zeigen',entered:'Eingegeben',calculated:'Berechnet',period:'Zeitraum'}
};
I18N.en.model='Model name';I18N.de.model='Modellname';I18N.en.name='Name';I18N.de.name='Name';I18N.en.value='Value';I18N.de.value='Wert';I18N.en.uncertainty='Uncertainty';I18N.de.uncertainty='Unsicherheit';I18N.en.unit='Unit';I18N.de.unit='Einheit';I18N.en.type='Type';I18N.de.type='Typ';I18N.en.measured='measured';I18N.de.measured='gemessen';I18N.en.unmeasured='unmeasured';I18N.de.unmeasured='ungemessen';I18N.en.fixed='fixed';I18N.de.fixed='fixiert';I18N.en.boundary='Boundary stock (no balance equation)';I18N.de.boundary='Grenz-Lager (keine Bilanzgleichung)';I18N.en.start='Start content';I18N.de.start='Anfangsbestand';I18N.en.end='End content';I18N.de.end='Endbestand';I18N.en.tc='Transfer coefficients';I18N.de.tc='Transferkoeffizienten';I18N.en.conc='Concentration link';I18N.de.conc='Konzentrationslink';I18N.en.worksheet='Worksheet';I18N.de.worksheet='Arbeitsblatt';I18N.en.general='General';I18N.de.general='Allgemein';I18N.en.values='Values';I18N.de.values='Werte';I18N.en.system='System';I18N.de.system='System';I18N.en.short='Short symbol';I18N.de.short='Kurzzeichen';I18N.en.remarks='Remarks';I18N.de.remarks='Anmerkungen';I18N.en.routing='Routing';I18N.de.routing='Verlauf';
let ui={lang:'en',zoom:1,grid:true,snap:true,displayMode:'entered',captionType:'name'};
try{Object.assign(ui,JSON.parse(localStorage.getItem(UI_KEY))||{});}catch(e){}
if(!I18N[ui.lang])ui.lang=(navigator.language||'').toLowerCase().startsWith('de')?'de':'en';
function t(k){return (I18N[ui.lang]&&I18N[ui.lang][k])||I18N.en[k]||k;}
function saveUI(){localStorage.setItem(UI_KEY,JSON.stringify(ui));}
let state={doc:{nodes:[],flows:[],texts:[],nextId:1},layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Substance',unit:'kg/a'}],editPath:[],sel:[],mode:'select',connectFrom:null,modelName:'SEFMN model',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',worksheet:{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''},expanded:{},trace:[],clipboard:null,undoStack:[],redoStack:[],propTab:'general'};
const UNITS={mass:{t:1000,kg:1,g:0.001,lb:0.45359237},energy:{MJ:1,GJ:1000,kWh:3.6,MWh:3600}};
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function esc(s){return String(s).replace(/&/g,'&').replace(/</g,'<');}
function D(){let d=state.doc;for(const id of state.editPath){const n=d.nodes.find(x=>x.id===id);if(!n)return state.doc;if(!n.sub)n.sub={nodes:[],flows:[],texts:[],nextId:1};d=n.sub;}return d;}
function save(){localStorage.setItem(LS_KEY,JSON.stringify({doc:state.doc,layers:state.layers,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet}));}
function migrateDoc(doc){
 if(!doc.texts)doc.texts=[];
 if(!doc.nextId)doc.nextId=1;
 doc.flows.forEach(f=>{
  if(!f.layerData){f.layerData={};state.layers.forEach(l=>{f.layerData[l.id]=l.id==='L1'?{type:f.type||'unmeasured',value:f.value||0,unc:f.uncertainty||0.1,unit:f.unit||'t/a'}:{type:'unmeasured',value:0,unc:0.1,unit:'kg/a'};});}
  if(!f.tc){f.tc={};state.layers.forEach(l=>{f.tc[l.id]={enabled:l.id==='L1'&&f.tcEnabled||false,type:f.tcType||'measured',value:f.tcValue||0.5,unc:f.tcUnc||0.05};});}
  if(f.conc===undefined)f.conc={enabled:false,type:'measured',value:10,unc:1};
  if(!f.routing)f.routing='straight';
 });
 doc.nodes.forEach(n=>{
  if(n.type==='stock'){
   if(n.boundary===undefined)n.boundary=false;
   if(!n.layerData){const s=n.start||{type:'fixed',value:0,unc:0},e=n.end||{type:'fixed',value:0,unc:0};n.layerData={};state.layers.forEach(l=>{n.layerData[l.id]={start:l.id==='L1'?s:{type:'fixed',value:0,unc:0},end:l.id==='L1'?e:{type:'fixed',value:0,unc:0}};});}
  }
  if(n.type==='subsystem'&&!n.sub)n.sub={nodes:[],flows:[],texts:[],nextId:1};
  if(n.sub)migrateDoc(n.sub);
 });
}
function migrate(){
 const s=state.doc;
 if(!s||!s.nodes){const legacy=JSON.parse(localStorage.getItem(LS_KEY)||'{}');if(legacy.nodes)state.doc={nodes:legacy.nodes,flows:legacy.flows,texts:[],nextId:legacy.nextId||1};else state.doc={nodes:[],flows:[],texts:[],nextId:1};}
 state.layers=state.layers&&state.layers.length?state.layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Substance',unit:'kg/a'}];
 if(!state.layers.find(l=>l.id===state.activeLayer))state.activeLayer=state.layers[0].id;
 state.worksheet=state.worksheet||{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''};
 migrateDoc(state.doc);
}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s&&s.doc&&s.doc.nodes){Object.assign(state,{doc:s.doc,layers:s.layers||state.layers,modelName:s.modelName||state.modelName,periodLabel:s.periodLabel||state.periodLabel,worksheet:s.worksheet||state.worksheet});migrate();return true;}}catch(e){}migrate();return false;}
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
function vname(f,l){return f.name+'__'+l;}
function tname(f,l){return f.name+'_tc__'+l;}
function flowValue(f,l){const n=vname(f,l);if(state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[n]!==undefined)return Math.abs(+state.lastResult.variables_value[n]||0);return Math.abs(+f.layerData[l].value||0);}
function pushUndo(){state.undoStack.push(JSON.stringify(state.doc));if(state.undoStack.length>50)state.undoStack.shift();state.redoStack=[];}
function doUndo(){if(!state.undoStack.length)return;state.redoStack.push(JSON.stringify(state.doc));state.doc=JSON.parse(state.undoStack.pop());state.sel=[];save();renderAll();}
function doRedo(){if(!state.redoStack.length)return;state.undoStack.push(JSON.stringify(state.doc));state.doc=JSON.parse(state.redoStack.pop());state.sel=[];save();renderAll();}
function addNode(type){
 pushUndo();
 const prefix=type==='process'?'P':type==='stock'?'S':'Sub';
 const n={id:'n'+D().nextId++,type,name:prefix+D().nextId,short:'',remarks:'',x:150+Math.random()*300,y:120+Math.random()*200};
 if(type==='stock'){n.boundary=false;n.layerData={};state.layers.forEach(l=>{n.layerData[l.id]={start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}};});}
 if(type==='subsystem')n.sub={nodes:[],flows:[],texts:[],nextId:1};
 D().nodes.push(n);select({kind:'node',id:n.id});save();
}
function addText(){pushUndo();const tx={id:'x'+D().nextId++,x:200+Math.random()*200,y:100+Math.random()*150,text:'Text'};D().texts.push(tx);select({kind:'text',id:tx.id});save();}
function addFlow(from,to){
 if(from===to)return;
 pushUndo();
 const f={id:'f'+D().nextId++,name:'F'+(D().flows.length+1),from,to,routing:'straight',lx:0,ly:0,layerData:{},tc:{},conc:{enabled:false,type:'measured',value:10,unc:1}};
 state.layers.forEach(l=>{f.layerData[l.id]={type:'unmeasured',value:0,unc:0.1,unit:l.unit};f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});
 D().flows.push(f);select({kind:'flow',id:f.id});save();
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
 traceMsg('info','Pasted '+state.clipboard.nodes.length+' object(s).');
 save();renderAll();
}
function enterSubsystem(id){
 const n=getNode(id);if(!n||n.type!=='subsystem')return;
 if(state.editPath.length>=5){traceMsg('warning','Maximum of six hierarchy levels reached.');return;}
 state.editPath.push(id);state.sel=[];renderAll();
}
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
function render(){
 svg.innerHTML='';
 const d=D();
 const defs=el('defs',{});
 if(ui.grid){const pat=el('pattern',{id:'gridp',width:'20',height:'20',patternUnits:'userSpaceOnUse'});pat.appendChild(el('path',{d:'M20 0H0V20',fill:'none',stroke:'#e8e8e8','stroke-width':'1'}));defs.appendChild(pat);}
 const marker=el('marker',{id:'arrow',viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'6',markerHeight:'6',orient:'auto'});marker.appendChild(el('path',{d:'M0,0 L10,5 L0,10 z',fill:'#333'}));defs.appendChild(marker);svg.appendChild(defs);
 const world=el('g',{transform:'scale('+ui.zoom+')'});
 if(ui.grid)world.appendChild(el('rect',{x:0,y:0,width:'10000',height:'10000',fill:'url(#gridp)'}));
 const internal=d.nodes.filter(n=>!(n.type==='stock'&&n.boundary));
 let bx0=Infinity,by0=Infinity,bx1=-Infinity,by1=-Infinity;
 internal.forEach(n=>{bx0=Math.min(bx0,n.x-60);by0=Math.min(by0,n.y-60);bx1=Math.max(bx1,n.x+60);by1=Math.max(by1,n.y+60);});
 if(internal.length){
  world.appendChild(el('rect',{x:bx0,y:by0,width:bx1-bx0,height:by1-by0,fill:'none',stroke:'#888','stroke-dasharray':'6 4','stroke-width':1.5}));
  const bt=el('text',{x:bx0+6,y:by0+14,'font-size':'12',fill:'#555'});bt.textContent=esc(state.modelName)+' — '+esc(state.periodLabel);world.appendChild(bt);
  let sumImp=0,sumExp=0,sumD=0;
  d.flows.forEach(f=>{const k=flowKind(f);const v=flowValue(f,state.activeLayer);if(k==='import')sumImp+=v;if(k==='export')sumExp+=v;});
  d.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>{const ld=n.layerData[state.activeLayer];if(ld)sumD+=(ld.end.value||0)-(ld.start.value||0);});
  const bs=el('text',{x:bx0+6,y:by1-6,'font-size':'11',fill:'#555'});
  bs.textContent='Σ imports: '+(+sumImp.toFixed(3))+' | Σ exports: '+(+sumExp.toFixed(3))+' | Σ stock change: '+(+sumD.toFixed(3));
  world.appendChild(bs);
  const layer=state.layers.find(l=>l.id===state.activeLayer);
  const lg=el('text',{x:bx0+6,y:by1-22,'font-size':'11',fill:'#777'});
  lg.textContent='Layer: '+esc(layer?layer.name:'')+' ('+esc(layer?layer.unit:'')+') — '+(ui.displayMode==='calculated'?'calculated':'entered')+' values';
  world.appendChild(lg);
 }
 const widths={};
 if(state.weighted){const vals=d.flows.map(f=>flowValue(f,state.activeLayer));const mx=Math.max.apply(null,vals.concat([1e-9]));d.flows.forEach((f,i)=>widths[f.id]=2+18*vals[i]/mx);}
 d.flows.forEach(f=>{
  const a=getNode(f.from),b=getNode(f.to);if(!a||!b)return;
  const p1=anchorPt(a,b),p2=anchorPt(b,a);
  const kind=flowKind(f);
  const col=isSelected('flow',f.id)?'#e67e22':(kind==='import'?'#2563eb':kind==='export'?'#16a34a':'#333');
  let shape;
  if(f.routing==='ortho'){
   const mx=(p1.x+p2.x)/2;
   shape=el('polyline',{points:p1.x+','+p1.y+' '+mx+','+p1.y+' '+mx+','+p2.y+' '+p2.x+','+p2.y,fill:'none',stroke:col,'stroke-width':widths[f.id]||2,'marker-end':'url(#arrow)',class:'flow'});
  }else{
   shape=el('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:col,'stroke-width':widths[f.id]||2,'marker-end':'url(#arrow)',class:'flow'});
  }
  shape.addEventListener('click',e=>{e.stopPropagation();select({kind:'flow',id:f.id},e.ctrlKey||e.metaKey);});
  world.appendChild(shape);
  const dd=f.layerData[state.activeLayer];
  let label=f.name;
  if(dd){const vn=vname(f,state.activeLayer);const v=(ui.displayMode==='calculated'&&state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[vn]!==undefined)?(+state.lastResult.variables_value[vn]).toFixed(2):dd.value;label=f.name+' '+v;}
  const sym=kind==='import'?'⇒ ':kind==='export'?'⇐ ':'';
  const mid=el('text',{x:(p1.x+p2.x)/2+(f.lx||0),y:(p1.y+p2.y)/2+(f.ly||0)-8,'font-size':'12','text-anchor':'middle',class:'flowlabel'});
  mid.textContent=sym+label;
  mid.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();const sx=e.clientX-(f.lx||0),sy=e.clientY-(f.ly||0);const mv=ev=>{f.lx=ev.clientX-sx;f.ly=ev.clientY-sy;render();};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);save();};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);});
  world.appendChild(mid);
 });
 d.nodes.forEach(n=>{
  const g=el('g',{class:'node'+(isSelected('node',n.id)?' selected':''),transform:'translate('+n.x+','+n.y+')'});
  if(n.type==='process')g.appendChild(el('rect',{x:-30,y:-20,width:60,height:40,fill:'#dbeafe',stroke:'#333'}));
  else if(n.type==='subsystem'){const r=el('rect',{x:-40,y:-25,width:80,height:50,rx:12,fill:'#fef9c3',stroke:'#1d4ed8','stroke-width':2});g.appendChild(r);}
  else g.appendChild(el('circle',{r:22,fill:n.boundary?'#fee2e2':'#dcfce7',stroke:'#333'}));
  const tx=el('text',{'text-anchor':'middle',dy:'4','font-size':'12'});tx.textContent=captionOf(n);g.appendChild(tx);
  g.addEventListener('dblclick',e=>{e.preventDefault();if(n.type==='subsystem')enterSubsystem(n.id);});
  g.addEventListener('mousedown',e=>{
   e.preventDefault();e.stopPropagation();
   if(state.mode==='connect'){if(!state.connectFrom){state.connectFrom=n.id;}else{addFlow(state.connectFrom,n.id);state.connectFrom=null;state.mode='select';setModeButtons();}return;}
   if(!isSelected('node',n.id))select({kind:'node',id:n.id},e.ctrlKey||e.metaKey);
   else if(e.ctrlKey||e.metaKey)select({kind:'node',id:n.id},true);
   const snapshot=JSON.stringify(state.doc);
   const start=toWorld(e);const offs=state.sel.filter(s=>s.kind==='node').map(s=>{const nn=getNode(s.id);return {id:s.id,dx:start.x-nn.x,dy:start.y-nn.y};});
   const move=ev=>{const w=toWorld(ev);offs.forEach(o=>{const nn=getNode(o.id);if(nn){nn.x=w.x-o.dx;nn.y=w.y-o.dy;}});render();};
   const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);
    if(ui.snap){state.sel.filter(s=>s.kind==='node').forEach(s=>{const nn=getNode(s.id);if(nn){nn.x=Math.round(nn.x/20)*20;nn.y=Math.round(nn.y/20)*20;}});}
    state.undoStack.push(snapshot);state.redoStack=[];save();renderAll();};
   window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
  });
  world.appendChild(g);
 });
 d.texts.forEach(x=>{
  const g=el('g',{class:'node'+(isSelected('text',x.id)?' selected':''),transform:'translate('+x.x+','+x.y+')'});
  const tx=el('text',{'font-size':'13',fill:'#333'});tx.textContent=esc(x.text);g.appendChild(tx);
  g.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();select({kind:'text',id:x.id});const start=toWorld(e);const ox=x.x-start.x,oy=x.y-start.y;const mv=ev=>{const w=toWorld(ev);x.x=w.x+ox;x.y=w.y+oy;render();};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);save();};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);});
  world.appendChild(g);
 });
 svg.appendChild(world);
 renderCrumb();
}
function renderCrumb(){
 const c=document.getElementById('crumb');
 if(!state.editPath.length){c.style.display='none';c.innerHTML='';return;}
 let d=state.doc;const names=['System'];
 state.editPath.forEach(id=>{const n=d.nodes.find(x=>x.id===id);names.push(n?n.name:'?');if(n&&n.sub)d=n.sub;});
 c.style.display='block';
 c.innerHTML='<button id="crumbBack">◀ Back</button>'+names.map(n=>esc(n)).join(' / ');
 document.getElementById('crumbBack').onclick=exitSubsystem;
}
function renderExplorer(){
 const ex=document.getElementById('explorer');const d=D();
 let h='<div class="row'+(state.sel.length?'':' sel')+'"><b>'+esc(state.modelName)+'</b></div>';
 d.nodes.forEach(n=>{
  const ins=d.flows.filter(f=>f.to===n.id),outs=d.flows.filter(f=>f.from===n.id);
  const open=state.expanded[n.id];
  h+='<div class="row'+(isSelected('node',n.id)?' sel':'')+'" data-x="node" data-id="'+n.id+'"><span class="arr" data-a="'+n.id+'">'+(open?'▾':'▸')+'</span>'+esc(n.name)+' <small>('+n.type+')</small>'+(n.type==='subsystem'?' <span class="arr" data-e="'+n.id+'" title="Edit subsystem">↘</span>':'')+'</div>';
  if(open){ins.forEach(f=>{h+='<div class="row sub'+(isSelected('flow',f.id)?' sel':'')+'" data-x="flow" data-id="'+f.id+'">← '+esc(f.name)+'</div>';});outs.forEach(f=>{h+='<div class="row sub'+(isSelected('flow',f.id)?' sel':'')+'" data-x="flow" data-id="'+f.id+'">→ '+esc(f.name)+'</div>';});}
 });
 d.texts.forEach(x=>{h+='<div class="row'+(isSelected('text',x.id)?' sel':'')+'" data-x="text" data-id="'+x.id+'">📝 '+esc(x.text)+'</div>';});
 ex.innerHTML=h;
 ex.querySelectorAll('.row').forEach(r=>{
  r.onclick=ev=>{
   const enter=ev.target.dataset.e;
   if(enter){enterSubsystem(enter);return;}
   const arr=ev.target.dataset.a;
   if(arr){state.expanded[arr]=!state.expanded[arr];renderExplorer();return;}
   if(r.dataset.x==='node')select({kind:'node',id:r.dataset.id},ev.ctrlKey||ev.metaKey);
   else if(r.dataset.x==='flow')select({kind:'flow',id:r.dataset.id},ev.ctrlKey||ev.metaKey);
   else if(r.dataset.x==='text')select({kind:'text',id:r.dataset.id});
   else select(null);
  };
 });
}
function renderStatic(){
 document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n);});
 const ls=document.getElementById('layerSelect');ls.innerHTML=state.layers.map(l=>'<option value="'+l.id+'"'+(l.id===state.activeLayer?' selected':'')+'>'+esc(l.name)+'</option>').join('');
 document.getElementById('periodLabel').value=state.periodLabel;
 document.getElementById('tbSankey').textContent=t('sankey')+(state.weighted?': on':': off');
 document.getElementById('tbDisplay').textContent=t(ui.displayMode==='entered'?'entered':'calculated');
 document.getElementById('tbGrid').style.fontWeight=ui.grid?'bold':'normal';
 document.getElementById('tbSnap').style.fontWeight=ui.snap?'bold':'normal';
 document.getElementById('miCaption').textContent='Caption: '+ui.captionType;
}
function dataEditor(v,p){return '<label>'+t('type')+'<select id="'+p+'_type"><option'+(v.type==='measured'?' selected':'')+'>'+t('measured')+'</option><option'+(v.type==='unmeasured'?' selected':'')+'>'+t('unmeasured')+'</option><option'+(v.type==='fixed'?' selected':'')+'>'+t('fixed')+'</option></select></label><label>'+t('value')+'<input id="'+p+'_value" type="number" value="'+v.value+'"></label><label>'+t('uncertainty')+'<input id="'+p+'_unc" type="number" step="0.01" value="'+v.unc+'"></label>';}
function unitOptions(sel){return Object.keys(UNITS.mass).concat(Object.keys(UNITS.energy)).map(u=>'<option'+(u===sel?' selected':'')+'>'+u+'</option>').join('');}
function renderProps(){
 const tabs=document.getElementById('propTabs');const body=document.getElementById('props');
 const sel0=state.sel.length===1?state.sel[0]:null;
 let tabList;
 if(!sel0)tabList=['system','worksheet'];
 else tabList=['general','values'];
 if(!tabList.includes(state.propTab))state.propTab=tabList[0];
 tabs.innerHTML=tabList.map(x=>'<button data-tab="'+x+'"'+(x===state.propTab?' class="active"':'')+'>'+t(x)+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.propTab=b.dataset.tab;renderProps();});
 const L=state.activeLayer;
 if(!sel0){
  if(state.propTab==='system'){
   body.innerHTML='<label>'+t('model')+'<input id="pModel" value="'+esc(state.modelName)+'"></label><label>'+t('period')+'<input id="pPeriod" value="'+esc(state.periodLabel)+'"></label><button id="pSolve">'+t('solve')+' (F5)</button><div id="resultTable"></div><pre id="output"></pre>';
   document.getElementById('pModel').oninput=e=>{state.modelName=e.target.value;save();renderExplorer();render();};
   document.getElementById('pPeriod').oninput=e=>{state.periodLabel=e.target.value;save();renderStatic();render();};
   document.getElementById('pSolve').onclick=doSolve;
   if(state.lastResult)fillResult(state.lastResult);
  }else{
   const w=state.worksheet;const fields=[['question','Research question'],['spatial','Spatial boundary'],['period','Reference period'],['quantities','Tracked goods, substances, energy'],['sources','Data sources and assumptions'],['interpretation','Interpretation and optimization potential']];
   body.innerHTML=fields.map(f=>'<label>'+f[1]+'<textarea id="ws_'+f[0]+'">'+esc(w[f[0]])+'</textarea></label>').join('')+'<button id="wsExport">Export worksheet (Markdown)</button>';
   fields.forEach(f=>{document.getElementById('ws_'+f[0]).oninput=e=>{state.worksheet[f[0]]=e.target.value;save();};});
   document.getElementById('wsExport').onclick=exportWorksheet;
  }
  return;
 }
 if(sel0.kind==='text'){
  const x=D().texts.find(y=>y.id===sel0.id);if(!x)return;
  body.innerHTML='<label>Text<input id="txText" value="'+esc(x.text)+'"></label>';
  document.getElementById('txText').oninput=e=>{x.text=e.target.value;save();render();renderExplorer();};
  return;
 }
 if(sel0.kind==='node'){
  const n=getNode(sel0.id);if(!n)return;
  const layer=state.layers.find(l=>l.id===L);
  if(state.propTab==='general'){
   let h='<label>'+t('name')+'<input id="pName" value="'+esc(n.name)+'"></label><label>'+t('short')+'<input id="pShort" value="'+esc(n.short||'')+'"></label><p>'+t('process')+': '+n.type+'</p>';
   if(n.type==='stock')h+='<label><input type="checkbox" id="boundary" '+(n.boundary?'checked':'')+'>'+t('boundary')+'</label>';
   if(n.type==='subsystem')h+='<p>Subsystem with own internal model. Double-click to edit (up to six levels).</p><button id="pEnter">Edit subsystem</button>';
   h+='<label>'+t('remarks')+'<textarea id="pRem">'+esc(n.remarks||'')+'</textarea></label>';
   body.innerHTML=h;
   document.getElementById('pName').oninput=e=>{n.name=e.target.value;save();render();renderExplorer();};
   document.getElementById('pShort').oninput=e=>{n.short=e.target.value;save();render();};
   document.getElementById('pRem').oninput=e=>{n.remarks=e.target.value;save();};
   if(n.type==='stock')document.getElementById('boundary').onchange=e=>{n.boundary=e.target.checked;save();render();};
   if(n.type==='subsystem')document.getElementById('pEnter').onclick=()=>enterSubsystem(n.id);
  }else{
   let h='<h4>'+esc(n.name)+' — '+esc(layer.name)+'</h4>';
   if(n.type==='stock'){h+='<h5>'+t('start')+'</h5>'+dataEditor(n.layerData[L].start,'st')+'<h5>'+t('end')+'</h5>'+dataEditor(n.layerData[L].end,'en');}
   if(n.type==='process'){const outs=D().flows.filter(f=>f.from===n.id);h+='<h5>'+t('tc')+'</h5>';if(!outs.length)h+='<p>—</p>';outs.forEach(f=>{const tc=f.tc[L];h+='<h6>'+esc(f.name)+'</h6><label><input type="checkbox" id="tc_'+f.id+'" '+(tc.enabled?'checked':'')+'> TC</label><div id="tcbox_'+f.id+'" style="display:'+(tc.enabled?'block':'none')+'">'+dataEditor(tc,'tc'+f.id)+'</div>';});}
   body.innerHTML=h;
   if(n.type==='stock')['st','en'].forEach((k,i)=>{const key=i?'end':'start';document.getElementById(k+'_type').onchange=e=>{n.layerData[L][key].type=e.target.value;save();};document.getElementById(k+'_value').oninput=e=>{n.layerData[L][key].value=+e.target.value;save();render();};document.getElementById(k+'_unc').oninput=e=>{n.layerData[L][key].unc=+e.target.value;save();};});
   if(n.type==='process')D().flows.filter(f=>f.from===n.id).forEach(f=>{const tc=f.tc[L];document.getElementById('tc_'+f.id).onchange=e=>{tc.enabled=e.target.checked;save();renderProps();render();};document.getElementById('tc'+f.id+'_type').onchange=e=>{tc.type=e.target.value;save();};document.getElementById('tc'+f.id+'_value').oninput=e=>{tc.value=+e.target.value;save();};document.getElementById('tc'+f.id+'_unc').oninput=e=>{tc.unc=+e.target.value;save();};});
  }
 }else{
  const f=D().flows.find(x=>x.id===sel0.id);if(!f)return;
  const layer=state.layers.find(l=>l.id===L);const dd=f.layerData[L];
  if(state.propTab==='general'){
   const kind=flowKind(f);
   body.innerHTML='<label>'+t('name')+'<input id="fName" value="'+esc(f.name)+'"></label><p>'+(getNode(f.from)?esc(getNode(f.from).name):'?')+' → '+(getNode(f.to)?esc(getNode(f.to).name):'?')+'</p><p>Flow type: <b>'+kind+'</b> (import/export/internal, derived from boundary stocks)</p><label>'+t('routing')+'<select id="fRouting"><option'+(f.routing==='straight'?' selected':'')+'>straight</option><option'+(f.routing==='ortho'?' selected':'')+'>ortho</option></select></label>';
   document.getElementById('fName').oninput=e=>{f.name=e.target.value;save();render();renderExplorer();};
   document.getElementById('fRouting').onchange=e=>{f.routing=e.target.value;save();render();};
  }else{
   const primary=state.layers[0],secondary=state.layers[1];
   let h=dataEditor(dd,'d')+'<label>'+t('unit')+'<input id="d_unit" value="'+esc(dd.unit||'')+'"></label><label>Convert: <select id="convFrom">'+unitOptions(dd.unit)+'</select> → <select id="convTo">'+unitOptions(dd.unit)+'</select></label><button id="convertBtn">Convert value + uncertainty</button>';
   if(primary&&secondary){const c=f.conc;h+='<h5>'+t('conc')+'</h5><p>'+esc(primary.name)+' → '+esc(secondary.name)+': secondary = c × primary</p><label><input type="checkbox" id="c_en" '+(c.enabled?'checked':'')+'> Enable</label><div id="cbox" style="display:'+(c.enabled?'block':'none')+'">'+dataEditor(c,'c')+'</div>';}
   body.innerHTML=h;
   document.getElementById('d_type').onchange=e=>{dd.type=e.target.value;save();};
   document.getElementById('d_value').oninput=e=>{dd.value=+e.target.value;save();render();};
   document.getElementById('d_unc').oninput=e=>{dd.unc=+e.target.value;save();};
   document.getElementById('d_unit').oninput=e=>{dd.unit=e.target.value;save();};
   document.getElementById('convertBtn').onclick=()=>{const from=document.getElementById('convFrom').value,to=document.getElementById('convTo').value;const fam=Object.keys(UNITS).find(k=>UNITS[k][from]!==undefined&&UNITS[k][to]!==undefined);if(!fam){alert('Incompatible units.');return;}const k=UNITS[fam][from]/UNITS[fam][to];dd.value=dd.value*k;dd.unc=dd.unc*k;dd.unit=to;save();renderProps();render();};
   if(primary&&secondary){document.getElementById('c_en').onchange=e=>{f.conc.enabled=e.target.checked;save();renderProps();};document.getElementById('c_type').onchange=e=>{f.conc.type=e.target.value;save();};document.getElementById('c_value').oninput=e=>{f.conc.value=+e.target.value;save();};document.getElementById('c_unc').oninput=e=>{f.conc.unc=+e.target.value;save();};}
  }
 }
}
function traceMsg(level,msg,ref){state.trace.push({level,msg,ref:ref||null});renderTrace();}
function renderTrace(){
 const tl=document.getElementById('traceList');
 tl.innerHTML=state.trace.map((m,i)=>'<p class="'+(m.ref?'cl':'')+'" data-i="'+i+'" style="color:'+(m.level==='error'?'#b91c1c':m.level==='warning'?'#b45309':'#1d4ed8')+'">['+m.level.toUpperCase()+'] '+esc(m.msg)+'</p>').join('')||'<p>No messages.</p>';
 tl.querySelectorAll('p.cl').forEach(p=>p.onclick=()=>{const m=state.trace[+p.dataset.i];if(m&&m.ref)select(m.ref);});
}
function renderAll(){renderStatic();render();renderExplorer();renderProps();renderTrace();}
function setModeButtons(){document.getElementById('shSelect').style.fontWeight=state.mode==='select'?'bold':'normal';document.getElementById('shConnect').style.fontWeight=state.mode==='connect'?'bold':'normal';}
function exportDoc(prefix,doc){
 const variables=[];const equations=[];
 const vn=(f,l)=>prefix+f.name+'__'+l;
 const tn=(f,l)=>prefix+f.name+'_tc__'+l;
 doc.flows.forEach(f=>state.layers.forEach(l=>{
  variables.push(varObj(f.layerData[l.id],vn(f,l)));
  if(f.tc[l.id].enabled){variables.push(varObj(f.tc[l.id],tn(f,l),true));}
 }));
 doc.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>state.layers.forEach(l=>{
  variables.push(varObj(n.layerData[l.id].start,prefix+n.name+'_start__'+l));
  variables.push(varObj(n.layerData[l.id].end,prefix+n.name+'_end__'+l));
 }));
 doc.nodes.forEach(n=>{
  const ins=doc.flows.filter(f=>f.to===n.id),outs=doc.flows.filter(f=>f.from===n.id);
  state.layers.forEach(l=>{
   if(n.type==='process'||n.type==='subsystem'){
    const lt=[];ins.forEach(f=>lt.push({name:vn(f,l),factor:1}));outs.forEach(f=>lt.push({name:vn(f,l),factor:-1}));
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
    outs.filter(f=>f.tc[l.id].enabled).forEach(f=>{
     equations.push({constant_term:{value:0},linear_terms:[{name:vn(f,l),factor:1}],bilinear_terms:ins.map(i=>({name1:tn(f,l),name2:vn(i,l),factor:-1}))});
    });
   }
   if(n.type==='stock'&&!n.boundary){
    const lt=[];ins.forEach(f=>lt.push({name:vn(f,l),factor:1}));outs.forEach(f=>lt.push({name:vn(f,l),factor:-1}));
    lt.push({name:prefix+n.name+'_end__'+l,factor:-1});lt.push({name:prefix+n.name+'_start__'+l,factor:1});
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
   }
  });
  if(n.type==='subsystem'&&n.sub&&n.sub.nodes.length){
   const inner=exportDoc(prefix+n.name+'.',n.sub);
   inner.variables.forEach(v=>variables.push(v));
   inner.equations.forEach(eq=>equations.push(eq));
  }
 });
 const primary=state.layers[0],secondary=state.layers[1];
 if(primary&&secondary){doc.flows.forEach(f=>{if(f.conc&&f.conc.enabled){variables.push(varObj(f.conc,prefix+f.name+'_conc'));equations.push({constant_term:{value:0},linear_terms:[{name:vn(f,secondary.id),factor:1}],bilinear_terms:[{name1:prefix+f.name+'_conc',name2:vn(f,primary.id),factor:-1}]});}});}
 return {variables,equations};
}
function exportModel(){const r=exportDoc('',state.doc);return {content:{name:state.modelName,period:state.periodLabel,variables:r.variables,equations:r.equations,solver:'JuMP'}};}
function validateModel(){
 const msgs=[];let eqCount=0;const unknowns=new Set();const d=D();
 d.flows.forEach(f=>state.layers.forEach(l=>{
  unknowns.add(f.name+'__'+l);
  const dd=f.layerData[l.id];
  if(!Number.isFinite(+dd.value))msgs.push({level:'error',msg:f.name+' ('+l+'): value is not a number.',ref:{kind:'flow',id:f.id}});
  if(dd.type==='measured'&&!(+dd.unc>0))msgs.push({level:'error',msg:f.name+' ('+l+'): measured variables need uncertainty > 0.',ref:{kind:'flow',id:f.id}});
  if(f.tc[l.id].enabled)unknowns.add(f.name+'_tc__'+l);
 }));
 d.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>state.layers.forEach(l=>{unknowns.add(n.name+'_start__'+l);unknowns.add(n.name+'_end__'+l);}));
 d.nodes.forEach(n=>{
  const ins=d.flows.filter(f=>f.to===n.id),outs=d.flows.filter(f=>f.from===n.id);
  state.layers.forEach(l=>{
   if(n.type==='process'||n.type==='subsystem'){eqCount++;
    outs.filter(f=>f.tc[l.id].enabled).forEach(f=>{eqCount++;
     if(!ins.length)msgs.push({level:'error',msg:f.name+': transfer coefficient needs at least one input flow.',ref:{kind:'flow',id:f.id}});
     if(ins.length===1&&outs.length===1)msgs.push({level:'warning',msg:f.name+': TC with one input and one output over-constrains the balance; add a loss/split outlet.',ref:{kind:'flow',id:f.id}});
    });
   }
   if(n.type==='stock'&&!n.boundary)eqCount++;
  });
 });
 const primary=state.layers[0],secondary=state.layers[1];
 if(primary&&secondary)d.flows.forEach(f=>{if(f.conc&&f.conc.enabled)eqCount++;});
 msgs.push({level:'info',msg:'Preliminary count: '+eqCount+' equations, '+unknowns.size+' variables. This does not prove observability, redundancy, or feasibility.'});
 return msgs;
}
function runValidation(){validateModel().forEach(m=>traceMsg(m.level,m.msg,m.ref));}
function parseCSV(text){
 const rows=[];let row=[],field='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else q=false;}else field+=c;}
  else if(c==='"')q=true;
  else if(c===','){row.push(field);field='';}
  else if(c==='\n'||c==='\r'){if(field!==''||row.length){row.push(field);rows.push(row);row=[];field='';}if(c==='\r'&&text[i+1]==='\n')i++;}
  else field+=c;
 }
 if(field!==''||row.length){row.push(field);rows.push(row);}
 return rows.filter(r=>r.some(c=>c.trim()!==''));
}
function importCSV(text){
 const rows=parseCSV(text);if(!rows.length)return traceMsg('error','CSV file is empty.');
 const header=rows[0].map(h=>h.trim().toLowerCase());const idx=n=>header.indexOf(n);
 const need=['name','layer','type','value','uncertainty','unit'];
 if(need.some(n=>idx(n)<0))return traceMsg('error','CSV needs columns: name,layer,type,value,uncertainty,unit.');
 let applied=0,skipped=0;
 traceMsg('info','CSV import updates existing flows of the current level only.');
 const d=D();
 rows.slice(1).forEach(r=>{
  const name=r[idx('name')].trim(),layer=r[idx('layer')].trim();
  const f=d.flows.find(x=>x.name===name);
  if(!f||!f.layerData[layer]){skipped++;traceMsg('warning','Skipped '+name+' ('+(layer||'no layer')+').');return;}
  const dd=f.layerData[layer];dd.type=r[idx('type')].trim();dd.value=+r[idx('value')];dd.unc=+r[idx('uncertainty')];dd.unit=r[idx('unit')].trim();applied++;
 });
 traceMsg('info','CSV import: '+applied+' values applied, '+skipped+' skipped.');
 save();render();renderProps();
}
function fillResult(data){
 const rt=document.getElementById('resultTable');if(!rt)return;
 const vals=data&&data.variables_value||{};const uncs=data&&data.uncertainties||{};
 let html='<table><tr><th>Status</th><td>'+(data&&data.status||'')+'</td></tr><tr><th>Objective</th><td>'+(data&&data.objective_value!=null?data.objective_value:'')+'</td></tr><tr><th>Residual</th><td>'+(data&&data.residual_value!=null?data.residual_value:'')+'</td></tr><tr><th>Solve time</th><td>'+(data&&data['Solve time (s)']!=null?data['Solve time (s)']:'')+' s</td></tr></table>';
 const names=Object.keys(vals);
 if(names.length){
  html+='<table><tr><th>Variable</th><th>Entered</th><th>Reconciled</th><th>Unc.</th><th>Δ/σ</th></tr>'+names.map(n=>{
   const m=n.match(/^(F\d+)__(L\d+)$/);let entered='',z='';let color='';
   if(m){const f=state.doc.flows.find(x=>x.name===m[1]);const l=m[2];
    if(f&&f.layerData[l]){entered=f.layerData[l].value;
     if(f.layerData[l].type==='measured'&&+f.layerData[l].unc>0){z=((+vals[n])-f.layerData[l].value)/f.layerData[l].unc;z=z.toFixed(2);if(Math.abs(z)>2)color='color:#b91c1c;font-weight:bold';}
    }
   }
   return '<tr><td>'+n+'</td><td>'+entered+'</td><td>'+vals[n]+'</td><td>'+(uncs[n]!=null?uncs[n]:'')+'</td><td style="'+color+'">'+z+'</td></tr>';
  }).join('')+'</table>';
 }
 rt.innerHTML=html;
}
function showResult(data){
 state.lastResult=data;
 fillResult(data);
 const out=document.getElementById('output');if(out)out.textContent=JSON.stringify(data,null,2);
 traceMsg(data&&data.status==='FEASIBLE'?'info':'warning','Calculation: '+(data&&data.status||'no status')+', objective '+(data&&data.objective_value!=null?data.objective_value:'?')+', residual '+(data&&data.residual_value!=null?data.residual_value:'?')+'.');
 render();
}
function exportWorksheet(){
 const w=state.worksheet;
 const md='# MFA/SEFA project worksheet\n\n## Model\n\n- Model: '+state.modelName+'\n- Reference period: '+state.periodLabel+'\n\n## Research question\n\n'+(w.question||'(not filled)')+'\n\n## Spatial boundary\n\n'+(w.spatial||'(not filled)')+'\n\n## Reference period\n\n'+(w.period||state.periodLabel)+'\n\n## Tracked goods, substances, and energy\n\n'+(w.quantities||'(not filled)')+'\n\n## Data sources and assumptions\n\n'+(w.sources||'(not filled)')+'\n\n## Interpretation and optimization potential\n\n'+(w.interpretation||'(not filled)')+'\n';
 download((state.modelName||'worksheet').replace(/\W+/g,'_')+'_worksheet.md',md,'text/markdown');
}
function doSolve(){
 const out=document.getElementById('output');if(out)out.textContent='Solving…';
 runValidation();
 fetch('http://localhost:8080/solve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exportModel())}).then(r=>r.json()).then(showResult).catch(e=>{traceMsg('error','Solver error: '+e.message+' — is the Julia server running on port 8080?');if(out)out.textContent='Error: '+e.message;});
}
function openFind(){
 const fb=document.getElementById('findBox');fb.hidden=false;document.getElementById('findInput').value='';document.getElementById('findResults').innerHTML='';document.getElementById('findInput').focus();
 document.getElementById('findInput').oninput=()=>{
  const q=document.getElementById('findInput').value.toLowerCase();const res=document.getElementById('findResults');
  if(!q){res.innerHTML='';return;}
  let h='';D().nodes.forEach(n=>{if(n.name.toLowerCase().includes(q))h+='<div data-x="node" data-id="'+n.id+'">'+esc(n.name)+' ('+n.type+')</div>';});
  D().flows.forEach(f=>{if(f.name.toLowerCase().includes(q))h+='<div data-x="flow" data-id="'+f.id+'">'+esc(f.name)+' (flow)</div>';});
  res.innerHTML=h||'<p>No matches.</p>';
  res.querySelectorAll('div[data-x]').forEach(d=>d.onclick=()=>{fb.hidden=true;select({kind:d.dataset.x,id:d.dataset.id});});
 };
}
function doNew(){state.doc={nodes:[],flows:[],texts:[],nextId:1};state.editPath=[];state.sel=[];state.lastResult=null;state.trace=[];state.expanded={};save();renderAll();}
function wireUI(){
 const on=(id,fn)=>{const e=document.getElementById(id);if(e)e.onclick=fn;};
 on('miNew',doNew);on('tbNew',doNew);
 on('miOpen',()=>document.getElementById('openProject').click());on('tbOpen',()=>document.getElementById('openProject').click());
 on('miSave',()=>download((state.modelName||'model').replace(/\W+/g,'_')+'.json',JSON.stringify({doc:state.doc,layers:state.layers,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet},null,2)));
 on('tbSave',()=>document.getElementById('miSave').click());
 on('miUndo',doUndo);on('tbUndo',doUndo);on('miRedo',doRedo);on('tbRedo',doRedo);
 on('miFind',openFind);on('tbFind',openFind);
 on('miDelete',deleteSelection);on('shDelete',deleteSelection);
 on('miCsv',()=>document.getElementById('importCsv').click());on('tbCsv',()=>document.getElementById('importCsv').click());
 on('miClean',loadClean);on('miConflict',loadConflict);
 on('miWorksheet',exportWorksheet);
 on('miJson',()=>{state.propTab='system';state.sel=[];renderAll();const out=document.getElementById('output');if(out)out.textContent=JSON.stringify(exportModel(),null,2);});
 on('miGrid',()=>{ui.grid=!ui.grid;saveUI();renderAll();});on('tbGrid',()=>document.getElementById('miGrid').click());
 on('miSnap',()=>{ui.snap=!ui.snap;saveUI();renderStatic();});on('tbSnap',()=>document.getElementById('miSnap').click());
 on('miZoomIn',()=>{ui.zoom=Math.min(4,ui.zoom*1.2);saveUI();render();});on('tbZoomIn',()=>document.getElementById('miZoomIn').click());
 on('miZoomOut',()=>{ui.zoom=Math.max(0.2,ui.zoom/1.2);saveUI();render();});on('tbZoomOut',()=>document.getElementById('miZoomOut').click());
 on('miCaption',()=>{ui.captionType=ui.captionType==='name'?'short':ui.captionType==='short'?'both':'name';saveUI();renderStatic();render();});
 on('miLang',()=>{ui.lang=ui.lang==='de'?'en':'de';saveUI();renderAll();});
 on('miReset',()=>{localStorage.removeItem(UI_KEY);localStorage.removeItem(LS_KEY);location.reload();});
 on('shSelect',()=>{state.mode='select';state.connectFrom=null;setModeButtons();});
 on('shProcess',()=>addNode('process'));
 on('shStock',()=>addNode('stock'));
 on('shSubsystem',()=>addNode('subsystem'));
 on('shText',addText);
 on('shConnect',()=>{state.mode='connect';state.connectFrom=null;setModeButtons();});
 on('tbValidate',runValidation);
 on('tbSolve',()=>{state.propTab='system';state.sel=[];renderAll();doSolve();});
 on('tbSankey',()=>{state.weighted=!state.weighted;renderStatic();render();});
 on('tbDisplay',()=>{ui.displayMode=ui.displayMode==='entered'?'calculated':'entered';saveUI();renderStatic();render();});
 on('traceClear',()=>{state.trace=[];renderTrace();});
 document.getElementById('layerSelect').onchange=e=>{state.activeLayer=e.target.value;renderProps();render();};
 on('tbAddLayer',()=>{const id='L'+(state.layers.length+1);state.layers.push({id,name:'Layer '+(state.layers.length+1),unit:'t/a'});state.activeLayer=id;
  const walk=doc=>{doc.flows.forEach(f=>{f.layerData[id]={type:'unmeasured',value:0,unc:0.1,unit:'t/a'};f.tc[id]={enabled:false,type:'measured',value:0.5,unc:0.05};});doc.nodes.forEach(n=>{if(n.type==='stock')n.layerData[id]={start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}};if(n.sub)walk(n.sub);});};
  walk(state.doc);save();renderStatic();renderProps();});
 document.getElementById('periodLabel').oninput=e=>{state.periodLabel=e.target.value;save();render();};
 document.getElementById('importCsv').onchange=e=>{const r=new FileReader();r.onload=()=>importCSV(r.result);r.readAsText(e.target.files[0]);};
 document.getElementById('openProject').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(s.doc){Object.assign(state,{doc:s.doc,layers:s.layers||state.layers,modelName:s.modelName||'SEFMN model',periodLabel:s.periodLabel||'Year 2026',worksheet:s.worksheet||state.worksheet});}else{Object.assign(state,{doc:{nodes:s.nodes||[],flows:s.flows||[],texts:[],nextId:s.nextId||1},layers:s.layers||state.layers,modelName:s.modelName||'SEFMN model',periodLabel:s.periodLabel||'Year 2026',worksheet:s.worksheet||state.worksheet});}state.editPath=[];state.sel=[];state.trace=[];state.lastResult=null;migrate();save();renderAll();}catch(err){alert('Invalid project file: '+err.message);}};r.readAsText(e.target.files[0]);};
 svg.addEventListener('mousedown',e=>{
  if(e.target!==svg&&e.target.tagName!=='rect')return;
  const start=toWorld(e);let marquee=null;
  const move=ev=>{const w=toWorld(ev);if(!marquee){marquee=el('rect',{fill:'rgba(80,140,220,0.15)',stroke:'#508cbe','stroke-dasharray':'4'});svg.appendChild(marquee);}
   const x=Math.min(start.x,w.x),y=Math.min(start.y,w.y),ww=Math.abs(w.x-start.x),hh=Math.abs(w.y-start.y);
   marquee.setAttribute('x',x*ui.zoom);marquee.setAttribute('y',y*ui.zoom);marquee.setAttribute('width',ww*ui.zoom);marquee.setAttribute('height',hh*ui.zoom);};
  const up=ev=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);
   if(marquee){svg.removeChild(marquee);const w=toWorld(ev);const x0=Math.min(start.x,w.x),x1=Math.max(start.x,w.x),y0=Math.min(start.y,w.y),y1=Math.max(start.y,w.y);
    state.sel=D().nodes.filter(n=>n.x>=x0-20&&n.x<=x1+20&&n.y>=y0-20&&n.y<=y1+20).map(n=>({kind:'node',id:n.id}));
    renderAll();}
  };
  window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
 });
 window.addEventListener('keydown',e=>{
  const tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='select'||tag==='textarea')return;
  const mod=e.ctrlKey||e.metaKey;
  if(e.key==='F5'){e.preventDefault();doSolve();}
  else if(e.key==='F12'&&mod){e.preventDefault();document.getElementById('miZoomIn').click();}
  else if(e.key==='F11'&&mod){e.preventDefault();document.getElementById('miZoomOut').click();}
  else if(mod&&e.key.toLowerCase()==='n'){e.preventDefault();doNew();}
  else if(mod&&e.key.toLowerCase()==='o'){e.preventDefault();document.getElementById('openProject').click();}
  else if(mod&&e.key.toLowerCase()==='s'){e.preventDefault();document.getElementById('miSave').click();}
  else if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();doUndo();}
  else if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();doRedo();}
  else if(mod&&e.key.toLowerCase()==='f'){e.preventDefault();openFind();}
  else if(mod&&e.key.toLowerCase()==='c'){copySelection();}
  else if(mod&&e.key.toLowerCase()==='v'){pasteClipboard();}
  else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelection();}
  else if(e.key==='Escape'){document.getElementById('findBox').hidden=true;state.mode='select';state.connectFrom=null;setModeButtons();}
 });
}
function loadClean(){
 state.doc={nodes:[{id:'n1',type:'stock',name:'S1',short:'',remarks:'',x:100,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n2',type:'process',name:'P1',short:'',remarks:'',x:320,y:150},{id:'n3',type:'stock',name:'S2',short:'',remarks:'',x:540,y:80,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n4',type:'stock',name:'S3',short:'',remarks:'',x:540,y:220,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}],flows:[{id:'f1',name:'F1',from:'n1',to:'n2',routing:'straight',lx:0,ly:0,layerData:{L1:{type:'measured',value:100,unc:10,unit:'t/a'}},tc:{L1:{enabled:false,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}},{id:'f2',name:'F2',from:'n2',to:'n3',routing:'straight',lx:0,ly:0,layerData:{L1:{type:'measured',value:50,unc:5,unit:'t/a'}},tc:{L1:{enabled:true,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}},{id:'f3',name:'F3',from:'n2',to:'n4',routing:'straight',lx:0,ly:0,layerData:{L1:{type:'unmeasured',value:0,unc:0.1,unit:'t/a'}},tc:{L1:{enabled:false,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}}],texts:[],nextId:5};
 Object.assign(state,{layers:[{id:'L1',name:'Goods',unit:'t/a'}],editPath:[],modelName:'Consistent balance example',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',sel:[],trace:[],undoStack:[],redoStack:[],expanded:{}});
 save();renderAll();setModeButtons();
}
function loadConflict(){
 state.doc={nodes:[{id:'n1',type:'stock',name:'S1',short:'',remarks:'',x:80,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n2',type:'process',name:'P1',short:'',remarks:'',x:260,y:150},{id:'n3',type:'process',name:'P2',short:'',remarks:'',x:440,y:150},{id:'n4',type:'stock',name:'S2',short:'',remarks:'',x:620,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}],flows:[],texts:[],nextId:1};
 const mk=(name,from,to,l1,l2,id)=>({id,name,from,to,routing:'straight',lx:0,ly:0,layerData:{L1:l1,L2:l2},tc:{L1:{enabled:false,type:'measured',value:0.5,unc:0.05},L2:{enabled:false,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}});
 state.doc.flows=[mk('F1','n1','n2',{type:'measured',value:100,unc:10,unit:'t/a'},{type:'measured',value:1000,unc:100,unit:'kg/a'},'f1'),mk('F2','n2','n3',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f2'),mk('F3','n3','n4',{type:'measured',value:160,unc:16,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f3'),mk('F4','n2','n4',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f4')];
 state.doc.flows[1].tc.L1.enabled=true;state.doc.flows[2].conc.enabled=true;state.doc.flows[2].conc.value=10;state.doc.flows[2].conc.unc=1;
 Object.assign(state,{layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Phosphorus',unit:'kg/a'}],editPath:[],modelName:'Conflict example',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',sel:[],trace:[],undoStack:[],redoStack:[],expanded:{}});
 save();renderAll();setModeButtons();
}
wireUI();setModeButtons();
if(!loadSaved()){loadClean();}else{renderAll();}
