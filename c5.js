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
function refsDialog(){
 const rows=state.refs.map((r,i)=>'<tr><td>'+esc(r)+'</td><td><button data-dr="'+i+'">Delete</button></td></tr>').join('');
 openModal('Literature references','<table><tr><th>Reference</th><th></th></tr>'+(rows||'')+'</table>'+
  '<label>New reference<input id="refNew"></label>'+
  '<p>References are offered as a dropdown when documenting individual flow and stock values (Properties \u2192 Values).</p>'+
  '<div class="rowbtns"><button id="refAdd">Add</button><button id="rClose">Close</button></div>');
 document.getElementById('refAdd').onclick=()=>{const v=document.getElementById('refNew').value.trim();if(!v)return;if(state.refs.includes(v)){alert('Reference already exists.');return;}state.refs.push(v);save();refsDialog();};
 document.querySelectorAll('#modalBody [data-dr]').forEach(b=>b.onclick=()=>{state.refs.splice(+b.dataset.dr,1);save();refsDialog();});
 document.getElementById('rClose').onclick=closeModal;
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
  html+='<h5>Standard score histogram (\u0394/\u03c3)</h5><table>'+lbl.map((L2,i)=>'<tr><td>'+L2+'</td><td>'+cnt[i]+'</td><td>'+'\u2588'.repeat(Math.round(cnt[i]*12/mx))+'</td></tr>').join('')+'</table>';
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
 const md='# MFA/SEFA project worksheet\n\n## Model\n\n- Model: '+state.modelName+'\n- Periods: '+periodList()[0]+'\u2013'+periodList()[periodList().length-1]+'\n\n## Research question\n\n'+(w.question||'(not filled)')+'\n\n## Spatial boundary\n\n'+(w.spatial||'(not filled)')+'\n\n## Reference period\n\n'+(w.period||periodList().join(', '))+'\n\n## Tracked goods, substances, and energy\n\n'+(w.quantities||'(not filled)')+'\n\n## Data sources and assumptions\n\n'+(w.sources||'(not filled)')+'\n\n## Literature references\n\n'+((state.refs&&state.refs.length)?state.refs.map(r=>'- '+r).join('\n'):'(none)')+'\n\n## Interpretation and optimization potential\n\n'+(w.interpretation||'(not filled)')+'\n';
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
function openModal(title,html,cls){
 const m=document.getElementById('modal');document.getElementById('modalTitle').textContent=title;const mb=document.getElementById('modalBox');mb.className=cls||'';document.getElementById('modalBody').innerHTML=html;m.hidden=false;
}
function closeModal(){document.getElementById('modal').hidden=true;document.getElementById('modalBox').className='';}
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
 const rows=state.layers.map(l=>'<tr><td>'+esc(l.code)+'</td><td><input data-ln="'+l.id+'" value="'+esc(l.name)+'"></td><td>'+l.kind+'</td><td><input data-lu="'+l.id+'" value="'+esc(l.unit||'')+'" size="6"></td><td><input type="checkbox" data-lc="'+l.id+'" '+(l.calc!==false?'checked':'')+'></td><td><input data-ld="'+l.id+'" value="'+esc(l.dispUnit||'')+'" size="6"></td><td>'+(l.kind==='goods'?'\u2014':'<button data-dl="'+l.id+'">Delete</button>')+'</td></tr>').join('');
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
var dexState={tab:'values',group:'pl',collapsed:{},edit:false,calc:false,sort:null,dir:1};
function dexOpen(){
 openModal('Data Explorer','','wide');
 const mb=document.getElementById('modalBody');
 mb.onclick=dexClick;
 mb.oninput=dexInput;
 mb.onchange=dexInput;
 dexRender();
}
function dexBuildRows(){
 const d=D();const rows=[];const pl=periodList();
 if(dexState.tab==='values'){
  d.flows.forEach(f=>{
   pl.forEach(p=>{
    state.layers.forEach(l=>{
     const dat=f.pd[p]&&f.pd[p][l.id];
     if(!dat)return;
     rows.push({kind:'fv',f,p,l,dat,keys:{flow:f.name,layer:l,period:p},vals:[f.name,(getNode(f.from)?getNode(f.from).name:'?'),(getNode(f.to)?getNode(f.to).name:'?'),l,p,dat.type,dat.value,dat.unc,dat.unit||'',dat.ref||'',dat.rem||'']});
    });
   });
  });
 }else if(dexState.tab==='tc'){
  d.flows.forEach(f=>{
   state.layers.forEach(l=>{
    const tc=f.tc&&f.tc[l.id];
    if(!tc)return;
    rows.push({kind:'tc',f,l,tc,keys:{flow:f.name,layer:l},vals:[f.name,l,tc.enabled?'yes':'no',tc.type,tc.value,tc.unc]});
   });
  });
 }else if(dexState.tab==='stocks'){
  d.nodes.filter(n=>n.type==='stock').forEach(n=>{
   pl.forEach(p=>{
    state.layers.forEach(l=>{
     const pd=n.pd[p]&&n.pd[p][l.id];
     if(!pd)return;
     ['start','end'].forEach(kd=>{
      rows.push({kind:'st',f:n.id,p,l,kd,dat:pd[kd],keys:{stock:n.name,layer:l,period:p},vals:[n.name,l,p,kd,pd[kd].type,pd[kd].value,pd[kd].unc,pd[kd].ref||'',pd[kd].rem||'']});
     });
    });
   });
  });
 }else if(dexState.tab==='conc'){
  d.flows.forEach(f=>{
   pl.forEach(p=>{
    const c=f.pd[p]&&f.pd[p].conc;
    if(!c)return;
    rows.push({kind:'cc',f,p,c,keys:{flow:f.name,period:p},vals:[f.name,p,c.enabled?'yes':'no',c.type,c.value,c.unc]});
   });
  });
 }else if(dexState.tab==='procs'){
  d.nodes.forEach(n=>{
   const ins=d.flows.filter(f=>f.to===n.id).map(f=>f.name).join(', ');
   const outs=d.flows.filter(f=>f.from===n.id).map(f=>f.name).join(', ');
   rows.push({kind:'pr',f:n.id,keys:{name:n.name},vals:[n.name,n.type,ins,outs]});
  });
 }
 return rows;
}
function dexHead(){
 if(dexState.tab==='values')return ['Flow','From','To','Layer','Period','Type','Value','Unc.','Unit','Ref','Rem'];
 if(dexState.tab==='tc')return ['Flow','Layer','Enabled','Type','Value','Unc.'];
 if(dexState.tab==='stocks')return ['Stock','Layer','Period','Start/End','Type','Value','Unc.','Ref','Rem'];
 if(dexState.tab==='conc')return ['Flow','Period','Enabled','Type','Value','Unc.'];
 return ['Name','Type','Inputs','Outputs'];
}
function dexErrMap(){
 const errs={};
 validateModel().forEach(m=>{if(m.ref&&m.ref.kind==='flow')errs[m.ref.id]=m.msg;});
 return errs;
}
function dexCell(kind,f,p,l,kd,fld,val,editable){
 if(!editable)return '<td>'+esc(val)+'</td>';
 if(fld==='type')return '<td><select data-k="'+kind+'" data-f="'+f+'" data-p="'+(p||'')+'" data-l="'+(l||'')+'" data-kd="'+(kd||'')+'" data-fld="type"><option'+(val==='measured'?' selected':'')+'>measured</option><option'+(val==='unmeasured'?' selected':'')+'>unmeasured</option><option'+(val==='fixed'?' selected':'')+'>fixed</option></select></td>';
 if(fld==='enabled')return '<td><input type="checkbox" data-k="'+kind+'" data-f="'+f+'" data-p="'+(p||'')+'" data-l="'+(l||'')+'" data-fld="enabled" '+(val?'checked':'')+'></td>';
 return '<td><input data-k="'+kind+'" data-f="'+f+'" data-p="'+(p||'')+'" data-l="'+(l||'')+'" data-kd="'+(kd||'')+'" data-fld="'+fld+'" value="'+esc(val)+'"></td>';
}
function dexRender(){
 const mb=document.getElementById('modalBody');
 const tabs=[['values','Flow values'],['tc','Transfer coefficients'],['stocks','Stocks'],['conc','Concentrations'],['procs','Processes']];
 let bar='<div class="dexbar">'+tabs.map(x=>'<button data-tab="'+x[0]+'"'+(dexState.tab===x[0]?' style="font-weight:bold"':'')+'>'+x[1]+'</button>').join('')+
  '<span style="flex:1"></span>'+
  '<label><input type="checkbox" id="dexEdit" '+(dexState.edit?'checked':'')+'> Edit</label>'+
  '<label><input type="checkbox" id="dexCalc" '+(dexState.calc?'checked':'')+'> Calculated</label>';
 if(dexState.tab==='values')bar+='<label>Group<select id="dexGroup"><option value="pl"'+(dexState.group==='pl'?' selected':'')+'>Period \u2192 Layer</option><option value="lp"'+(dexState.group==='lp'?' selected':'')+'>Layer \u2192 Period</option><option value="none"'+(dexState.group==='none'?' selected':'')+'>None</option></select></label>';
 bar+='<button id="dexCopy">Copy TSV</button><button id="dexCsv">Export CSV</button>'+(dexState.tab==='values'?'<button id="dexPaste">Paste block</button>':'')+'</div>';
 const rows=dexBuildRows();
 const head=dexHead();
 const errs=dexErrMap();
 const sortable=({values:['Flow','Value','Period','Layer'],tc:['Flow'],stocks:['Stock'],conc:['Flow'],procs:['Name']});
 let h='<div id="dexGrid"><table><tr>'+head.map(c=>'<th'+((sortable[dexState.tab]||[]).indexOf(c)>=0?' data-sort="'+c+'"':'')+'>'+c+'</th>').join('')+(dexState.tab==='values'&&dexState.calc?'<th>Reconciled</th>':'')+'</tr>';
 const sorted=rows.slice();
 if(dexState.sort){
  const idx=head.indexOf(dexState.sort);
  if(idx>=0)sorted.sort((a,b)=>{const av=a.vals[idx];const bv=b.vals[idx];return (av>bv?1:av<bv?-1:0)*dexState.dir;});
 }
 function rowHtml(r){
  let cls='';if(r.kind==='fv'&&errs[r.f.id])cls=' class="err" title="'+esc(errs[r.f.id])+'"';
  let cells='';
  const e=dexState.edit;
  if(r.kind==='fv'){
   cells='<td>'+esc(r.vals[0])+'</td><td>'+esc(r.vals[1])+'</td><td>'+esc(r.vals[2])+'</td><td>'+esc(r.vals[3])+'</td><td>'+esc(r.vals[4])+'</td>'+
    dexCell('fv',r.f.id,r.p,r.l,'','type',r.dat.type,e)+
    dexCell('fv',r.f.id,r.p,r.l,'','value',r.dat.value,e)+
    dexCell('fv',r.f.id,r.p,r.l,'','unc',r.dat.unc,e)+
    dexCell('fv',r.f.id,r.p,r.l,'','unit',r.dat.unit||'',e)+
    dexCell('fv',r.f.id,r.p,r.l,'','ref',r.dat.ref||'',e)+
    dexCell('fv',r.f.id,r.p,r.l,'','rem',r.dat.rem||'',e);
   if(dexState.calc){
    const vn=vname(r.f,r.l,r.p);
    const rv=(state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[vn]!==undefined)?state.lastResult.variables_value[vn]:'\u2014';
    cells+='<td>'+rv+'</td>';
   }
  }else if(r.kind==='tc'){
   cells='<td>'+esc(r.vals[0])+'</td><td>'+esc(r.vals[1])+'</td>'+
    dexCell('tc',r.f.id,'',r.l,'','enabled',r.tc.enabled,e)+
    dexCell('tc',r.f.id,'',r.l,'','type',r.tc.type,e)+
    dexCell('tc',r.f.id,'',r.l,'','value',r.tc.value,e)+
    dexCell('tc',r.f.id,'',r.l,'','unc',r.tc.unc,e);
  }else if(r.kind==='st'){
   cells='<td>'+esc(r.vals[0])+'</td><td>'+esc(r.vals[1])+'</td><td>'+esc(r.vals[2])+'</td><td>'+esc(r.vals[3])+'</td>'+
    dexCell('st',r.f,r.p,r.l,r.kd,'type',r.dat.type,e)+
    dexCell('st',r.f,r.p,r.l,r.kd,'value',r.dat.value,e)+
    dexCell('st',r.f,r.p,r.l,r.kd,'unc',r.dat.unc,e)+
    dexCell('st',r.f,r.p,r.l,r.kd,'ref',r.dat.ref||'',e)+
    dexCell('st',r.f,r.p,r.l,r.kd,'rem',r.dat.rem||'',e);
  }else if(r.kind==='cc'){
   cells='<td>'+esc(r.vals[0])+'</td><td>'+esc(r.vals[1])+'</td>'+
    dexCell('cc',r.f.id,r.p,'','','enabled',r.c.enabled,e)+
    dexCell('cc',r.f.id,r.p,'','','type',r.c.type,e)+
    dexCell('cc',r.f.id,r.p,'','','value',r.c.value,e)+
    dexCell('cc',r.f.id,r.p,'','','unc',r.c.unc,e);
  }else{
   cells=r.vals.map(v=>'<td>'+esc(v)+'</td>').join('');
  }
  return '<tr'+cls+'>'+cells+'</tr>';
 }
 if(dexState.tab==='values'&&dexState.group!=='none'){
  const outer=dexState.group==='pl'?'period':'layer';
  const inner=dexState.group==='pl'?'layer':'period';
  const groups={};
  sorted.forEach(r=>{const gk=r.keys[outer];if(!groups[gk])groups[gk]=[];groups[gk].push(r);});
  Object.keys(groups).forEach(gk=>{
   const collapsed=dexState.collapsed[dexState.tab+'|'+gk];
   h+='<tr class="grp"><td colspan="'+(head.length+(dexState.calc?1:0))+'" data-grp="'+esc(gk)+'">'+(collapsed?'\u25b8':'\u25be')+' '+(outer==='period'?'Period ':'Layer ')+esc(gk)+'</td></tr>';
   if(!collapsed){
    const sub={};
    groups[gk].forEach(r=>{const sk=r.keys[inner];if(!sub[sk])sub[sk]=[];sub[sk].push(r);});
    Object.keys(sub).forEach(sk=>{
     h+='<tr class="grp2"><td colspan="'+(head.length+(dexState.calc?1:0))+'">'+(inner==='period'?'Period ':'Layer ')+esc(sk)+'</td></tr>';
     sub[sk].forEach(r=>{h+=rowHtml(r);});
    });
   }
  });
 }else{
  sorted.forEach(r=>{h+=rowHtml(r);});
 }
 h+='</table></div>';
 if(dexState.tab==='values'){
  h+='<div id="dexPasteBox" style="display:none;margin-top:6px"><textarea id="dexPasteArea" style="width:100%;height:80px"></textarea><button id="dexPasteApply">Apply pasted block</button><p>Header row required: name,layer,period,type,value,uncertainty,unit. Rows update existing flows (Excel: copy cells, paste here).</p></div>';
 }
 mb.innerHTML=bar+h;
}
function dexClick(ev){
 const el=ev.target;if(!el.dataset&&!el.id)return;
 if(el.dataset&&el.dataset.tab){dexState.tab=el.dataset.tab;dexState.sort=null;dexRender();return;}
 if(el.dataset&&el.dataset.grp){const g=dexState.tab+'|'+el.dataset.grp;dexState.collapsed[g]=!dexState.collapsed[g];dexRender();return;}
 if(el.dataset&&el.dataset.sort){if(dexState.sort===el.dataset.sort)dexState.dir*=-1;else{dexState.sort=el.dataset.sort;dexState.dir=1;}dexRender();return;}
 if(el.id==='dexEdit'){dexState.edit=el.checked;dexRender();return;}
 if(el.id==='dexCalc'){dexState.calc=el.checked;dexRender();return;}
 if(el.id==='dexGroup'){dexState.group=el.value;dexRender();return;}
 if(el.id==='dexCopy'){dexCopy();return;}
 if(el.id==='dexCsv'){dexCsv();return;}
 if(el.id==='dexPaste'){document.getElementById('dexPasteBox').style.display='block';return;}
 if(el.id==='dexPasteApply'){importCSV(document.getElementById('dexPasteArea').value);dexRender();return;}
}
function dexInput(ev){
 const el=ev.target;if(!el.dataset||!el.dataset.k)return;
 const d=D();const k=el.dataset.k;
 if(k==='fv'){
  const f=d.flows.find(x=>x.id===el.dataset.f);if(!f)return;
  const dat=f.pd[el.dataset.p]&&f.pd[el.dataset.p][el.dataset.l];if(!dat)return;
  const fld=el.dataset.fld;
  if(fld==='value'||fld==='unc')dat[fld]=+el.value;else dat[fld]=el.value;
  save();
 }else if(k==='tc'){
  const f=d.flows.find(x=>x.id===el.dataset.f);if(!f)return;
  const tc=f.tc&&f.tc[el.dataset.l];if(!tc)return;
  const fld=el.dataset.fld;
  if(fld==='enabled')tc.enabled=el.checked;else if(fld==='value'||fld==='unc')tc[fld]=+el.value;else tc[fld]=el.value;
  save();
 }else if(k==='st'){
  const n=d.nodes.find(x=>x.id===el.dataset.f);if(!n)return;
  const dat=n.pd[el.dataset.p]&&n.pd[el.dataset.p][el.dataset.l];if(!dat)return;
  const tgt=dat[el.dataset.kd];if(!tgt)return;
  const fld=el.dataset.fld;
  if(fld==='value'||fld==='unc')tgt[fld]=+el.value;else tgt[fld]=el.value;
  save();
 }else if(k==='cc'){
  const f=d.flows.find(x=>x.id===el.dataset.f);if(!f)return;
  const c=f.pd[el.dataset.p]&&f.pd[el.dataset.p].conc;if(!c)return;
  const fld=el.dataset.fld;
  if(fld==='enabled')c.enabled=el.checked;else if(fld==='value'||fld==='unc')c[fld]=+el.value;else c[fld]=el.value;
  save();
 }
}
function dexTsv(){
 const rows=dexBuildRows();
 const head=dexHead();
 const lines=[head.join('\t')];
 rows.forEach(r=>{lines.push(r.vals.map(v=>String(v)).join('\t'));});
 return lines.join('\n');
}
function dexCopy(){
 const s=dexTsv();
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(s).then(()=>traceMsg('info','Data Explorer table copied to clipboard (TSV \u2014 paste into Excel).'),()=>traceMsg('warning','Clipboard write failed; use Export CSV.'));}
 else traceMsg('warning','Clipboard API unavailable; use Export CSV.');
}
function dexCsv(){
 const s=dexTsv().split('\n').map(r=>r.split('\t').map(f=>/[",\n]/.test(f)?'"'+f.replace(/"/g,'""')+'"':f).join(',')).join('\n');
 download((state.modelName||'model').replace(/\W+/g,'_')+'_data_'+dexState.tab+'.csv',s,'text/csv');
 traceMsg('info','Exported '+dexState.tab+' data as CSV.');
}
