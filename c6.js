function wireUI(){
 const on=(id,fn)=>{const e=document.getElementById(id);if(e)e.onclick=fn;};
 on('miNew',doNew);on('tbNew',doNew);
 on('miOpen',()=>document.getElementById('openProject').click());on('tbOpen',()=>document.getElementById('openProject').click());
 on('miSave',()=>download((state.modelName||'model').replace(/\W+/g,'_')+'.json',JSON.stringify({doc:state.doc,layers:state.layers,materials:state.materials,refs:state.refs,units:state.units,customUnits:state.customUnits,periods:state.periods,subgoods:state.subgoods,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet},null,2)));
 on('tbSave',()=>document.getElementById('miSave').click());
 on('miUndo',doUndo);on('tbUndo',doUndo);on('miRedo',doRedo);on('tbRedo',doRedo);
 on('miFind',openFind);on('tbFind',openFind);
 on('miDelete',deleteSelection);on('shDelete',deleteSelection);
 on('miCsv',()=>document.getElementById('importCsv').click());on('tbCsv',()=>document.getElementById('importCsv').click());
 on('miMaterials',materialsDialog);
 on('miLayers',layersDialog);
 on('miUnits',unitsDialog);
 on('miRefs',refsDialog);
 on('miCalc',calcDialog);
 on('miSubgoods',()=>{state.subgoods=!state.subgoods;save();renderStatic();traceMsg('info','Subgood mode '+(state.subgoods?'enabled: subgood layers must sum to the goods layer per flow.':'disabled.'));});
 on('miClean',loadClean);on('miConflict',loadConflict);
 on('miWorksheet',exportWorksheet);
 on('miJson',()=>{state.propTab='system';state.sel=[];renderAll();const out=document.getElementById('output');if(out)out.textContent=JSON.stringify(exportModel(),null,2);});
 on('miGrid',()=>{ui.grid=!ui.grid;saveUI();renderAll();});on('tbGrid',()=>document.getElementById('miGrid').click());
 on('miSnap',()=>{ui.snap=!ui.snap;saveUI();renderStatic();});on('tbSnap',()=>document.getElementById('miSnap').click());
 on('miZoomIn',()=>{ui.zoom=Math.min(4,ui.zoom*1.2);saveUI();render();});on('tbZoomIn',()=>document.getElementById('miZoomIn').click());
 on('miZoomOut',()=>{ui.zoom=Math.max(0.2,ui.zoom/1.2);saveUI();render();});on('tbZoomOut',()=>document.getElementById('miZoomOut').click());
 on('miCaption',()=>{ui.captionType=ui.captionType==='name'?'short':ui.captionType==='short'?'both':'name';saveUI();renderStatic();render();});
 on('miLang',()=>{ui.lang=ui.lang==='de'?'en':'de';saveUI();renderAll();});
 on('tbUnitsMode',()=>{ui.unitMode=ui.unitMode==='entered'?'display':'entered';saveUI();renderStatic();render();});
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
 const pse=document.getElementById('periodSelect');if(pse)pse.onchange=e=>{state.activePeriod=e.target.value;renderProps();render();};
 document.getElementById('importCsv').onchange=e=>{const r=new FileReader();r.onload=()=>importCSV(r.result);r.readAsText(e.target.files[0]);};
 document.getElementById('openProject').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(s.doc){Object.assign(state,{doc:s.doc,layers:s.layers||state.layers,materials:s.materials||[],refs:s.refs||[],units:s.units||state.units,customUnits:s.customUnits||{},periods:s.periods||state.periods,subgoods:!!s.subgoods,modelName:s.modelName||'SEFMN model',periodLabel:s.periodLabel||'Year 2026',worksheet:s.worksheet||state.worksheet});}else{Object.assign(state,{doc:{nodes:s.nodes||[],flows:s.flows||[],texts:[],nextId:s.nextId||1},layers:s.layers||state.layers,refs:s.refs||[],modelName:s.modelName||'SEFMN model',periodLabel:s.periodLabel||'Year 2026',worksheet:s.worksheet||state.worksheet});}state.editPath=[];state.sel=[];state.trace=[];state.lastResult=null;state.lastPayload=null;migrate();save();renderAll();}catch(err){alert('Invalid project file: '+err.message);}};r.readAsText(e.target.files[0]);};
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
  if(e.key==='F5'&&e.altKey){e.preventDefault();calcDialog();}
  else if(e.key==='F5'){e.preventDefault();doSolve();}
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
  else if(e.key==='Escape'){closeModal();document.getElementById('findBox').hidden=true;state.mode='select';state.connectFrom=null;setModeButtons();}
 });
}
function mkFlow(id,name,from,to,routing,pd){return {id,name,from,to,routing,lx:0,ly:0,pd,tc:{},conc:{enabled:false,type:'measured',value:10,unc:1}};}
function loadClean(){
 state.periods={start:2026,count:1};state.activePeriod='2026';
 state.layers=[{id:'L1',code:'G',name:'Goods',kind:'goods',unit:'t/a',calc:true,dispUnit:'t'}];
 state.doc={nodes:[{id:'n1',type:'stock',name:'S1',short:'',remarks:'',x:100,y:150,boundary:true,pd:{2026:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}},{id:'n2',type:'process',name:'P1',short:'',remarks:'',x:320,y:150},{id:'n3',type:'stock',name:'S2',short:'',remarks:'',x:540,y:80,boundary:true,pd:{2026:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}},{id:'n4',type:'stock',name:'S3',short:'',remarks:'',x:540,y:220,boundary:true,pd:{2026:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}}],flows:[mkFlow('f1','F1','n1','n2','straight',{2026:{L1:{type:'measured',value:100,unc:10,unit:'t/a'}}}),mkFlow('f2','F2','n2','n3','straight',{2026:{L1:{type:'measured',value:50,unc:5,unit:'t/a'}}}),mkFlow('f3','F3','n2','n4','straight',{2026:{L1:{type:'unmeasured',value:0,unc:0.1,unit:'t/a'}}})],texts:[],nextId:5};
 state.doc.flows.forEach(f=>{state.layers.forEach(l=>{f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});});
 state.doc.flows[1].tc.L1.enabled=true;state.doc.flows[1].tc.L1.value=0.5;state.doc.flows[1].tc.L1.unc=0.05;
 migrateDoc(state.doc);
 Object.assign(state,{editPath:[],modelName:'Consistent balance example',activeLayer:'L1',weighted:false,lastResult:null,lastPayload:null,sel:[],trace:[],undoStack:[],redoStack:[],expanded:{}});
 save();renderAll();setModeButtons();
}
function loadConflict(){
 state.periods={start:2026,count:1};state.activePeriod='2026';
 state.layers=[{id:'L1',code:'G',name:'Goods',kind:'goods',unit:'t/a',calc:true,dispUnit:'t'},{id:'L2',code:'P',name:'Phosphorus',kind:'substance',unit:'kg/a',calc:true,dispUnit:'kg'}];
 state.doc={nodes:[{id:'n1',type:'stock',name:'S1',short:'',remarks:'',x:80,y:150,boundary:true,pd:{2026:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}},{id:'n2',type:'process',name:'P1',short:'',remarks:'',x:260,y:150},{id:'n3',type:'process',name:'P2',short:'',remarks:'',x:440,y:150},{id:'n4',type:'stock',name:'S2',short:'',remarks:'',x:620,y:150,boundary:true,pd:{2026:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}}],flows:[],texts:[],nextId:1};
 const mk=(name,from,to,l1,l2,id)=>mkFlow(id,name,from,to,'straight',{2026:{L1:l1,L2:l2}});
 state.doc.flows=[mk('F1','n1','n2',{type:'measured',value:100,unc:10,unit:'t/a'},{type:'measured',value:1000,unc:100,unit:'kg/a'},'f1'),mk('F2','n2','n3',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f2'),mk('F3','n3','n4',{type:'measured',value:160,unc:16,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f3'),mk('F4','n2','n4',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'},'f4')];
 state.doc.flows.forEach(f=>{state.layers.forEach(l=>{f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});});
 state.doc.flows[1].tc.L1.enabled=true;state.doc.flows[2].conc.enabled=true;state.doc.flows[2].conc.value=10;state.doc.flows[2].conc.unc=1;
 migrateDoc(state.doc);
 Object.assign(state,{editPath:[],modelName:'Conflict example',activeLayer:'L1',weighted:false,lastResult:null,lastPayload:null,sel:[],trace:[],undoStack:[],redoStack:[],expanded:{}});
 save();renderAll();setModeButtons();
}
wireUI();setModeButtons();
if(!loadSaved()){loadClean();}else{renderAll();}
