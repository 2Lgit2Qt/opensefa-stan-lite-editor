var calcOpts={traceLevel:'information',firstP:null,lastP:null,showEq:false};
function calcPeriods(){const pl=periodList();let a=calcOpts.firstP!=null?pl.indexOf(String(calcOpts.firstP)):0;let b=calcOpts.lastP!=null?pl.indexOf(String(calcOpts.lastP)):pl.length-1;if(a<0)a=0;if(b<0)b=pl.length-1;if(b<a){const tmp=a;a=b;b=tmp;}return pl.slice(a,b+1);}
function calcDialog(){
 const pl=periodList();
 const pOpts=pl.map(p=>'<option value="'+p+'">'+p+'</option>').join('');
 openModal('Calculation','<label>Trace level<select id="coTrace"><option value="none">none</option><option value="errors">errors</option><option value="warnings">warnings</option><option value="information">information</option><option value="details">details</option></select></label>'+
  '<label>First period<select id="coFirst">'+pOpts+'</select></label><label>Last period<select id="coLast">'+pOpts+'</select></label>'+
  '<label><input type="checkbox" id="coEq" '+(calcOpts.showEq?'checked':'')+'>Display used equations after computation</label>'+
  '<p>Method: data reconciliation, computation of unknown quantities and uncertainty propagation via OpenSEFA.jl (JuMP/Ipopt). Quick start: F5. This dialog: Alt+F5.</p>'+
  '<div class="rowbtns"><button id="coStart">Start</button><button id="coClose">Close</button></div>');
 document.getElementById('coTrace').value=calcOpts.traceLevel;
 document.getElementById('coFirst').value=calcOpts.firstP||pl[0];
 document.getElementById('coLast').value=calcOpts.lastP||pl[pl.length-1];
 document.getElementById('coStart').onclick=()=>{calcOpts.traceLevel=document.getElementById('coTrace').value;calcOpts.firstP=document.getElementById('coFirst').value;calcOpts.lastP=document.getElementById('coLast').value;calcOpts.showEq=document.getElementById('coEq').checked;closeModal();doSolve();};
 document.getElementById('coClose').onclick=closeModal;
}
function fillResult(data){
 const rt=document.getElementById('resultTable');if(!rt)return;
 const vals=data&&data.variables_value||{};const uncs=data&&data.uncertainties||{};
 const lp=state.lastPayload;
 const nV=lp?lp.content.variables.length:0;const nE=lp?lp.content.equations.length:0;
 const dof=nE-nV;
 let html='<table>';
 html+='<tr><th>Status</th><td>'+(data&&data.status||'')+'</td></tr>';
 html+='<tr><th>Objective</th><td>'+(data&&data.objective_value!=null?data.objective_value:'')+'</td></tr>';
 html+='<tr><th>Residual</th><td>'+(data&&data.residual_value!=null?data.residual_value:'')+'</td></tr>';
 html+='<tr><th>Solve time</th><td>'+(data&&data['Solve time (s)']!=null?data['Solve time (s)']:'')+' s</td></tr>';
 html+='<tr><th>Equation/variable balance</th><td>'+dof+' (equations '+nE+' \u2212 variables '+nV+') \u2014 raw count, not STAN\u2019s transformed degree of over-determination</td></tr>';
 let q='';let nm=0;
 const names=Object.keys(vals);
 names.forEach(n=>{const m=n.match(/^(F\d+)__(L\d+)__(\d+)$/);if(m){const f=state.doc.flows.find(x=>x.name===m[1]);const l=m[2],p=m[3];if(f&&f.pd[p]&&f.pd[p][l]&&f.pd[p][l].type==='measured')nm++;}});
 if(data&&data.objective_value!=null&&nm>0){q=Math.max(0,1-(+data.objective_value)/Math.max(1,nm)).toFixed(2);}
 html+='<tr><th>Adjustment index (proxy)</th><td>'+q+' \u2014 mean relative adjustment proxy, not STAN\u2019s reconciliation quality statistic</td></tr>';
 html+='</table>';
 if(names.length){
  const zs=[];
  html+='<table><tr><th>Variable</th><th>Entered</th><th>Reconciled</th><th>Unc.</th><th>\u0394/\u03c3</th></tr>'+names.map(n=>{
   const m=n.match(/^(F\d+)__(L\d+)__(\d+)$/);let entered='',z='';let color='';let zv=null;
   if(m){const f=state.doc.flows.find(x=>x.name===m[1]);const l=m[2],p=m[3];
    if(f&&f.pd[p]&&f.pd[p][l]){entered=f.pd[p][l].value;
     if(f.pd[p][l].type==='measured'&&+f.pd[p][l].unc>0){zv=((+vals[n])-f.pd[p][l].value)/f.pd[p][l].unc;z=zv.toFixed(2);if(Math.abs(zv)>2)color='color:#b91c1c;font-weight:bold';}
    }
   }
   if(zv!==null)zs.push(zv);
   return '<tr><td>'+n+'</td><td>'+entered+'</td><td>'+vals[n]+'</td><td>'+(uncs[n]!=null?uncs[n]:'')+'</td><td style="'+color+'">'+z+'</td></tr>';
  }).join('')+'</table>';
  const edges=[-Infinity,-2,-1,0,1,2,Infinity];
  const cnt=[0,0,0,0,0,0];
  zs.forEach(z=>{for(let i=0;i<6;i++){if(z>=edges[i]&&z<edges[i+1]){cnt[i]++;break;}}});
  const lbl=['< \u22122','\u22122 .. \u22121','\u22121 .. 0','0 .. 1','1 .. 2','> 2'];
  const mx=Math.max.apply(null,cnt.concat([1]));
  html+='<h5>Standard score histogram (\u0394/\u03c3)</h5><table>'+lbl.map((L,i)=>'<tr><td>'+L+'</td><td>'+cnt[i]+'</td><td>'+'\u2588'.repeat(Math.round(cnt[i]*12/mx))+'</td></tr>').join('')+'</table>';
  const gross=zs.filter(z=>Math.abs(z)>2).length;
  if(gross>0)traceMsg('warning','Gross error check: '+gross+' of '+zs.length+' measured values lie outside the 95% confidence interval (|\u0394/\u03c3| > 2). The model is likely to contain gross errors.');
  else if(zs.length)traceMsg('info','Gross error check: no measured value outside the 95% confidence interval. Reconciliation tolerable.');
  if(q!=='')traceMsg('info','Adjustment index (proxy): '+q+' \u2014 simplified client-side statistic, not STAN\u2019s internal reconciliation quality.');
  if(dof>0)traceMsg('info','Raw equation surplus: '+dof+' (more equations than variables \u2014 reconciliation possible; not a proof of redundancy).');
  else if(dof<0)traceMsg('warning','System underdetermined by '+(-dof)+' \u2014 some variables may be unobservable.');
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
 const md='# MFA/SEFA project worksheet\n\n## Model\n\n- Model: '+state.modelName+'\n- Periods: '+periodList()[0]+'\u2013'+periodList()[periodList().length-1]+'\n\n## Research question\n\n'+(w.question||'(not filled)')+'\n\n## Spatial boundary\n\n'+(w.spatial||'(not filled)')+'\n\n## Reference period\n\n'+(w.period||periodList().join(', '))+'\n\n## Tracked goods, substances, and energy\n\n'+(w.quantities||'(not filled)')+'\n\n## Data sources and assumptions\n\n'+(w.sources||'(not filled)')+'\n\n## Interpretation and optimization potential\n\n'+(w.interpretation||'(not filled)')+'\n';
 download((state.modelName||'worksheet').replace(/\W+/g,'_')+'_worksheet.md',md,'text/markdown');
}
function doSolve(){
 const out=document.getElementById('output');if(out)out.textContent='Solving\u2026';
 runValidation();
 const cps=calcPeriods();
 let payload;
 try{payload=JSON.stringify(exportModel(cps));}catch(err){traceMsg('error','Export failed: '+err.message);if(out)out.textContent='Export failed: '+err.message;return;}
 state.lastPayload=JSON.parse(payload);
 traceMsg('info','Calculation started for periods '+cps[0]+'\u2013'+cps[cps.length-1]+' ('+state.lastPayload.content.variables.length+' variables, '+state.lastPayload.content.equations.length+' equations).');
 if(calcOpts.showEq||calcOpts.traceLevel==='details'){state.lastPayload.content.equations.forEach((eq,i)=>{const lt=(eq.linear_terms||[]).map(x=>x.name+'\u00d7'+x.factor).join(' + ');const bt=(eq.bilinear_terms||[]).map(x=>x.name1+'\u00d7'+x.name2+'\u00d7'+x.factor).join(' + ');traceMsg('info','Eq '+(i+1)+': '+lt+(bt?' + '+bt:'')+' = 0');});}
 fetch('http://localhost:8080/solve',{method:'POST',headers:{'Content-Type':'application/json'},body:payload}).then(r=>r.json()).then(showResult).catch(e=>{traceMsg('error','Solver error: '+e.message+' \u2014 is the Julia server running on port 8080?');if(out)out.textContent='Error: '+e.message;});
}
function openFind(){
 const fb=document.getElementById('findBox');fb.hidden=false;document.getElementById('findInput').value='';document.getElementById('findResults').innerHTML='';document.getElementById('findInput').focus();
 document.getElementById('findInput').oninput=()=>{
  const q=document.getElementById('findInput').value.toLowerCase();const res=document.getElementById('findResults');
  if(!q){res.innerHTML='';return;}
  let h='';D().nodes.forEach(n=>{if(n.name.toLowerCase().includes(q))h+='<div data-x="node" data-id="'+n.id+'">'+esc(n.name)+' ('+n.type+')</div>';});D().flows.forEach(f=>{if(f.name.toLowerCase().includes(q))h+='<div data-x="flow" data-id="'+f.id+'">'+esc(f.name)+' (flow)</div>';});
  res.innerHTML=h||'<p>No matches.</p>';
  res.querySelectorAll('div[data-x]').forEach(d=>d.onclick=()=>{fb.hidden=true;select({kind:d.dataset.x,id:d.dataset.id});});
 };
}
function doNew(){state.doc={nodes:[],flows:[],texts:[],nextId:1};state.editPath=[];state.sel=[];state.lastResult=null;state.lastPayload=null;state.trace=[];state.expanded={};save();renderAll();}
function openModal(title,html){
 const m=document.getElementById('modal');document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=html;m.hidden=false;
}
function closeModal(){document.getElementById('modal').hidden=true;}
function materialsDialog(){
 const rows=MAT.concat(state.materials).map((m,i)=>'<tr><td>'+esc(m.code)+'</td><td>'+esc(m.name)+'</td><td>'+m.kind+'</td><td>'+(i>=MAT.length?'<button data-del="'+esc(m.code)+'">Delete</button>':'predefined')+'</td></tr>').join('');
 openModal('Define material','<table><tr><th>Code</th><th>Name</th><th>Kind</th><th></th></tr>'+rows+'</table>'+
  '<label>Code<input id="matCode"></label><label>Name<input id="matName"></label><label>Kind<select id="matKind"><option>substance</option><option>subgood</option><option>energy</option></select></label>'+
  '<div class="rowbtns"><button id="matAdd">Add material</button><button id="mClose">Close</button></div>');
 document.getElementById('matAdd').onclick=()=>{const code=document.getElementById('matCode').value.trim(),name=document.getElementById('matName').value.trim(),kind=document.getElementById('matKind').value;if(!code||!name){alert('Code and name required.');return;}if(MAT.concat(state.materials).some(m=>m.code===code)){alert('Code already exists.');return;}if(/^\d/.test(code)){alert('Codes must not start with a number.');return;}state.materials.push({code,name,kind});save();materialsDialog();};
 document.getElementById('mClose').onclick=closeModal;
 document.querySelectorAll('#modalBody [data-del]').forEach(b=>b.onclick=()=>{state.materials=state.materials.filter(m=>m.code!==b.dataset.del);save();materialsDialog();});
}
function layersDialog(){
 const matOptions=MAT.concat(state.materials).map(m=>'<option value="'+esc(m.code)+'">'+esc(m.code)+' \u2014 '+esc(m.name)+' ('+m.kind+')</option>').join('');
 const rows=state.layers.map(l=>'<tr><td>'+esc(l.code)+'</td><td><input data-ln="'+l.id+'" value="'+esc(l.name)+'"></td><td>'+l.kind+'</td><td><input data-lu="'+l.id+'" value="'+esc(l.unit||'')+'" size="6"></td><td><input type="checkbox" data-lc="'+l.id+'" '+(l.calc!==false?'checked':'')+'></td><td><input data-ld="'+l.id+'" value="'+esc(l.dispUnit||'')+'" size="6"></td><td>'+(l.kind==='goods'?'—':'<button data-dl="'+l.id+'">Delete</button>')+'</td></tr>').join('');
 openModal('Layers and periods','<h4>Periods</h4>'+
  '<label>Start year<input id="perStart" type="number" value="'+state.periods.start+'"></label><label>Number of periods (1 year each)<input id="perCount" type="number" min="1" max="50" value="'+state.periods.count+'"></label>'+
  '<button id="perApply">Apply periods</button><p>Changing the period record keeps data by position (STAN keep behavior); data beyond the new count is discarded.</p>'+
  '<h4>Layers</h4><table><tr><th>Code</th><th>Name</th><th>Kind</th><th>Unit</th><th>Calc</th><th>Display unit</th><th></th></tr>'+rows+'</table>'+
  '<label>Add layer from material<select id="newLayerMat">'+matOptions+'</select></label><button id="layerAdd">Add layer</button>'+
  '<div class="rowbtns"><button id="lClose">Close</button></div>');
 document.getElementById('perApply').onclick=()=>{
  const ns=+document.getElementById('perStart').value,nc=Math.max(1,Math.min(50,+document.getElementById('perCount').value));
  const oldList=periodList();
  state.periods={start:ns,count:nc};
  const newList=periodList();
  const walk=doc=>{doc.flows.forEach(f=>{const np={};newList.forEach((p,i)=>{if(oldList[i]&&f.pd[oldList[i]])np[p]=f.pd[oldList[i]];});f.pd=np;});doc.nodes.forEach(n=>{if(n.type==='stock'){const np={};newList.forEach((p,i)=>{if(oldList[i]&&n.pd[oldList[i]])np[p]=n.pd[oldList[i]];});n.pd=np;}if(n.sub)walk(n.sub);});};
  walk(state.doc);migrateDoc(state.doc);state.activePeriod=newList[0];save();traceMsg('info','Period record updated: '+newList[0]+'\u2013'+newList[newList.length-1]+'. Data kept by position.');layersDialog();renderAll();
 };
 document.querySelectorAll('#modalBody [data-ln]').forEach(i=>i.oninput=()=>{const l=state.layers.find(x=>x.id===i.dataset.ln);l.name=i.value;save();});
 document.querySelectorAll('#modalBody [data-lu]').forEach(i=>i.oninput=()=>{const l=state.layers.find(x=>x.id===i.dataset.lu);l.unit=i.value;save();});
 document.querySelectorAll('#modalBody [data-ld]').forEach(i=>i.oninput=()=>{const l=state.layers.find(x=>x.id===i.dataset.ld);l.dispUnit=i.value;save();});
 document.querySelectorAll('#modalBody [data-lc]').forEach(i=>i.onchange=()=>{const l=state.layers.find(x=>x.id===i.dataset.lc);l.calc=i.checked;save();});
 document.querySelectorAll('#modalBody [data-dl]').forEach(b=>b.onclick=()=>{const id=b.dataset.dl;state.layers=state.layers.filter(l=>l.id!==id);if(state.activeLayer===id)state.activeLayer=state.layers[0].id;save();layersDialog();renderAll();});
 document.getElementById('layerAdd').onclick=()=>{const code=document.getElementById('newLayerMat').value;const m=MAT.concat(state.materials).find(x=>x.code===code);if(!m)return;const id='L'+(state.layers.length+1)+(Math.random()*100|0);state.layers.push({id,code:m.code,name:m.name,kind:m.kind,unit:m.kind==='energy'?'MJ/a':'kg/a',calc:true,dispUnit:m.kind==='energy'?'MJ':'kg'});migrateDoc(state.doc);save();layersDialog();renderAll();};
 document.getElementById('lClose').onclick=closeModal;
}
function unitsDialog(){
 let html='';
 for(const fam of Object.keys(state.units)){
  html+='<h4>'+fam+'</h4><table><tr><th>Unit</th><th>Factor (to base)</th><th></th></tr>';
  for(const u of Object.keys(state.units[fam])){const custom=state.customUnits[fam]&&state.customUnits[fam][u];html+='<tr><td>'+esc(u)+(custom?' *':'')+'</td><td>'+state.units[fam][u]+'</td><td>'+(custom?'<button data-du="'+fam+'|'+esc(u)+'">Delete</button>':'predefined')+'</td></tr>';}
  html+='</table>';
 }
 openModal('Define units',html+'<label>Family<select id="uFam">'+Object.keys(state.units).map(f=>'<option>'+f+'</option>').join('')+'</select></label><label>Unit name (must not start with a number)<input id="uName"></label><label>Factor to family base<input id="uFactor" type="number" step="any"></label><div class="rowbtns"><button id="uAdd">Insert unit</button><button id="uClose">Close</button></div>');
 document.getElementById('uAdd').onclick=()=>{const fam=document.getElementById('uFam').value,name=document.getElementById('uName').value.trim(),fac=+document.getElementById('uFactor').value;if(!name||!fac||!Number.isFinite(fac)){alert('Name and numeric factor required.');return;}if(/^\d/.test(name)){alert('Unit names must not start with a number.');return;}if(state.units[fam][name]!==undefined){alert('Unit already exists in this family.');return;}state.units[fam][name]=fac;state.customUnits[fam]=state.customUnits[fam]||{};state.customUnits[fam][name]=true;save();unitsDialog();};
 document.querySelectorAll('#modalBody [data-du]').forEach(b=>b.onclick=()=>{const fam=b.dataset.du.split('|')[0],u=b.dataset.du.split('|')[1];delete state.units[fam][u];delete state.customUnits[fam][u];save();unitsDialog();});
 document.getElementById('uClose').onclick=closeModal;
}
