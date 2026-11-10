function optionsDialog(){
 const tabs=[['common','Common'],['sankey','Sankey'],['data','Data'],['defaults','Defaults']];
 let html='<div style="display:flex;gap:2px;margin-bottom:8px">'+tabs.map(x=>'<button data-otab="'+x[0]+'" style="padding:4px 12px;border:1px solid #ccc;background:'+(x[0]==='common'?'#fff':'#eee')+';cursor:pointer">'+x[1]+'</button>').join('')+'</div><div id="optBody"></div>';
 openModal('Options',html);
 let cur='common';
 function renderTab(){
  const b=document.getElementById('optBody');
  if(cur==='common'){
   b.innerHTML='<label>Language<select id="optLang"><option value="en"'+(ui.lang==='en'?' selected':'')+'>English</option><option value="de"'+(ui.lang==='de'?' selected':'')+'>Deutsch</option></select></label>'+
   '<label><input type="checkbox" id="optGrid" '+(ui.grid?'checked':'')+'> Show grid</label>'+
   '<label><input type="checkbox" id="optSnap" '+(ui.snap?'checked':'')+'> Snap to grid</label>'+
   '<label>Caption type<select id="optCaption"><option value="name"'+(ui.captionType==='name'?' selected':'')+'>Name</option><option value="short"'+(ui.captionType==='short'?' selected':'')+'>Short symbol</option><option value="both"'+(ui.captionType==='both'?' selected':'')+'>Both</option></select></label>'+
   '<label>Diagram font size<input id="optFont" type="number" value="12" min="8" max="20"></label>';
   document.getElementById('optLang').onchange=e=>{ui.lang=e.target.value;saveUI();renderAll();};
   document.getElementById('optGrid').onchange=e=>{ui.grid=e.target.checked;saveUI();renderAll();};
   document.getElementById('optSnap').onchange=e=>{ui.snap=e.target.checked;saveUI();renderStatic();};
   document.getElementById('optCaption').onchange=e=>{ui.captionType=e.target.value;saveUI();renderStatic();render();};
  }else if(cur==='sankey'){
   b.innerHTML='<label><input type="checkbox" id="optWeighted" '+(state.weighted?'checked':'')+'> Show as Sankey (flows proportional to values)</label>'+
   '<label>Maximum arrow width (px)<input id="optSankeyW" type="range" min="5" max="50" value="'+(ui.sankeyMaxWidth||20)+'" style="width:100%"></label>'+
   '<label><input type="checkbox" id="optDisplayCalc" '+(ui.displayMode==='calculated'?'checked':'')+'> Show calculated values in diagram</label>'+
   '<label><input type="checkbox" id="optUnitMode" '+(ui.unitMode==='display'?'checked':'')+'> Use display units in diagram</label>';
   document.getElementById('optWeighted').onchange=e=>{state.weighted=e.target.checked;render();};
   document.getElementById('optSankeyW').oninput=e=>{ui.sankeyMaxWidth=+e.target.value;saveUI();render();};
   document.getElementById('optDisplayCalc').onchange=e=>{ui.displayMode=e.target.checked?'calculated':'entered';saveUI();renderStatic();render();};
   document.getElementById('optUnitMode').onchange=e=>{ui.unitMode=e.target.checked?'display':'entered';saveUI();renderStatic();render();};
  }else if(cur==='data'){
   b.innerHTML='<label><input type="checkbox" id="optSubgoods" '+(state.subgoods?'checked':'')+'> Use subgood layers (subgood flows must sum to goods flow)</label>'+
   '<p>Subgood mode adds the constraint that the sum of all subgood-layer mass flows equals the goods-layer flow for each flow.</p>'+
   '<h5>Scaling basis</h5>'+
   '<label>Scaling unit<input id="optScaleUnit" value="'+esc(state.scaling.unit||'capita')+'"></label>'+
   '<label>Scaling factor<input id="optScaleFactor" type="number" value="'+(state.scaling.factor||100000)+'"></label>'+
   '<label>Scale data by<select id="optScaleMode"><option value="none"'+(state.scaling.mode==='none'?' selected':'')+'>No scaling</option><option value="basis"'+(state.scaling.mode==='basis'?' selected':'')+'>Scaling factor</option><option value="imports"'+(state.scaling.mode==='imports'?' selected':'')+'>\u03a3 imports</option><option value="exports"'+(state.scaling.mode==='exports'?' selected':'')+'>\u03a3 exports</option></select></label>';
   document.getElementById('optSubgoods').onchange=e=>{state.subgoods=e.target.checked;save();renderStatic();};
   document.getElementById('optScaleUnit').oninput=e=>{state.scaling.unit=e.target.value;save();};
   document.getElementById('optScaleFactor').oninput=e=>{state.scaling.factor=+e.target.value;save();};
   document.getElementById('optScaleMode').onchange=e=>{state.scaling.mode=e.target.value;save();if(state.lastResult)fillResult(state.lastResult);};
  }else if(cur==='defaults'){
   b.innerHTML='<label><input type="checkbox" checked disabled> Grid spacing: 20 px (fixed)</label>'+
   '<label><input type="checkbox" checked disabled> Snap increments: 20 px (fixed)</label>'+
   '<label><input type="checkbox" checked disabled> Process size: 60\u00d740 px (fixed)</label>'+
   '<label><input type="checkbox" checked disabled> Subsystem size: 80\u00d750 px (fixed)</label>'+
   '<p>Default sizes are fixed in this prototype. STAN allows editing them in the Options \u2192 Defaults tab.</p>'+
   '<button id="optReset">Reset all settings to defaults</button>';
   document.getElementById('optReset').onclick=()=>{localStorage.removeItem(UI_KEY);location.reload();};
  }
 }
 document.querySelectorAll('#modalBody [data-otab]').forEach(b=>b.onclick=()=>{
  cur=b.dataset.otab;
  document.querySelectorAll('#modalBody [data-otab]').forEach(x=>x.style.background=x===b?'#fff':'#eee');
  renderTab();
 });
 renderTab();
 const close=document.createElement('div');
 close.className='rowbtns';
 close.innerHTML='<button>Close</button>';
 close.querySelector('button').onclick=closeModal;
 document.getElementById('modalBody').appendChild(close);
}
function documentInfo(){
 const d=D();
 const pl=periodList();
 const layers=state.layers.filter(l=>l.calc!==false);
 let nP=0,nS=0,nSub=0,nF=0,nT=0;
 d.nodes.forEach(n=>{if(n.type==='process')nP++;else if(n.type==='stock')nS++;else if(n.type==='subsystem')nSub++;});
 nF=d.flows.length;nT=d.texts.length;
 const m=exportModel();
 const nV=m.content.variables.length;
 const nE=m.content.equations.length;
 let nMeasured=0,nUnmeasured=0,nFixed=0;
 d.flows.forEach(f=>pl.forEach(p=>layers.forEach(l=>{
  const dd=f.pd[p]&&f.pd[p][l.id];if(!dd)return;
  if(dd.type==='measured')nMeasured++;
  else if(dd.type==='fixed')nFixed++;
  else nUnmeasured++;
 })));
 let nRefs=0;
 d.flows.forEach(f=>pl.forEach(p=>layers.forEach(l=>{
  const dd=f.pd[p]&&f.pd[p][l.id];if(dd&&dd.ref)nRefs++;
 })));
 const measuredPct=nMeasured+nFixed>0?Math.round(100*(nMeasured+nFixed)/(nMeasured+nFixed+nUnmeasured)):0;
 const html='<table>'+
  '<tr><th>Model</th><td>'+esc(state.modelName)+'</td></tr>'+
  '<tr><th>Periods</th><td>'+pl.length+' ('+pl[0]+'\u2013'+pl[pl.length-1]+')</td></tr>'+
  '<tr><th>Layers</th><td>'+state.layers.length+' ('+state.layers.map(l=>esc(l.name)).join(', ')+')</td></tr>'+
  '<tr><th>Processes</th><td>'+nP+'</td></tr>'+
  '<tr><th>Stocks</th><td>'+nS+' (boundary: '+d.nodes.filter(n=>n.type==='stock'&&n.boundary).length+')</td></tr>'+
  '<tr><th>Subsystems</th><td>'+nSub+'</td></tr>'+
  '<tr><th>Flows</th><td>'+nF+'</td></tr>'+
  '<tr><th>Text fields</th><td>'+nT+'</td></tr>'+
  '<tr><th>Variables (exported)</th><td>'+nV+'</td></tr>'+
  '<tr><th>Equations (exported)</th><td>'+nE+'</td></tr>'+
  '<tr><th>Measured values</th><td>'+nMeasured+'</td></tr>'+
  '<tr><th>Fixed values</th><td>'+nFixed+'</td></tr>'+
  '<tr><th>Unmeasured values</th><td>'+nUnmeasured+'</td></tr>'+
  '<tr><th>Data completeness</th><td>'+measuredPct+'% known (measured + fixed)</td></tr>'+
  '<tr><th>Documented values</th><td>'+nRefs+' with literature reference</td></tr>'+
  '<tr><th>Literature references</th><td>'+state.refs.length+'</td></tr>'+
  '<tr><th>Subgood mode</th><td>'+(state.subgoods?'enabled':'disabled')+'</td></tr>'+
  '<tr><th>Scaling</th><td>'+(state.scaling&&state.scaling.mode!=='none'?esc(state.scaling.unit||'')+' \u00f7 '+scaleFactor():'none')+'</td></tr>'+
  '</table>';
 openModal('Document information',html+'<div class="rowbtns"><button onclick="document.getElementById(\'modal\').hidden=true">Close</button></div>');
}
function saveProjectAs(){
 const name=prompt('Save project as:',state.modelName);
 if(!name||!name.trim())return;
 state.modelName=name.trim();
 save();
 download(name.trim().replace(/\W+/g,'_')+'.json',JSON.stringify({scaling:state.scaling,doc:state.doc,layers:state.layers,materials:state.materials,refs:state.refs,units:state.units,customUnits:state.customUnits,periods:state.periods,subgoods:state.subgoods,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet},null,2));
 traceMsg('info','Project saved as: '+name.trim());
 renderExplorer();
}
(function(){
 const on=(id,fn)=>{const e=document.getElementById(id);if(e)e.onclick=fn;};
 on('miOptions',optionsDialog);
 on('miDocInfo',documentInfo);
 on('miSaveAs',saveProjectAs);
})();
