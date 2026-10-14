const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('canvas');
const LS_KEY='opensefa-stan-lite-project';
let state={nodes:[],flows:[],layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Substance',unit:'kg/a'}],selected:null,mode:'select',connectFrom:null,nextId:1,modelName:'SEFMN model',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',worksheet:{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''}};
const UNITS={mass:{t:1000,kg:1,g:0.001,lb:0.45359237},energy:{MJ:1,GJ:1000,kWh:3.6,MWh:3600}};
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function save(){localStorage.setItem(LS_KEY,JSON.stringify({nodes:state.nodes,flows:state.flows,layers:state.layers,nextId:state.nextId,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet}));}
function migrate(){
 state.layers=state.layers&&state.layers.length?state.layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Substance',unit:'kg/a'}];
 if(!state.layers.find(l=>l.id===state.activeLayer))state.activeLayer=state.layers[0].id;
 state.worksheet=state.worksheet||{question:'',spatial:'',period:'',quantities:'',sources:'',interpretation:''};
 state.flows.forEach(f=>{
  if(!f.layerData){f.layerData={};state.layers.forEach(l=>{f.layerData[l.id]=l.id==='L1'?{type:f.type||'unmeasured',value:f.value||0,unc:f.uncertainty||0.1,unit:f.unit||'t/a'}:{type:'unmeasured',value:0,unc:0.1,unit:'kg/a'};});}
  if(!f.tc){f.tc={};state.layers.forEach(l=>{f.tc[l.id]={enabled:l.id==='L1'&&f.tcEnabled||false,type:f.tcType||'measured',value:f.tcValue||0.5,unc:f.tcUnc||0.05};});}
  if(f.conc===undefined)f.conc={enabled:false,type:'measured',value:10,unc:1};
 });
 state.nodes.forEach(n=>{
  if(n.type==='stock'){
   if(n.boundary===undefined)n.boundary=false;
   if(!n.layerData){const s=n.start||{type:'fixed',value:0,unc:0},e=n.end||{type:'fixed',value:0,unc:0};n.layerData={};state.layers.forEach(l=>{n.layerData[l.id]={start:l.id==='L1'?s:{type:'fixed',value:0,unc:0},end:l.id==='L1'?e:{type:'fixed',value:0,unc:0}};});}
  }
 });
}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s&&s.nodes){Object.assign(state,{nodes:s.nodes,flows:s.flows,layers:s.layers||state.layers,nextId:s.nextId,modelName:s.modelName||state.modelName,periodLabel:s.periodLabel||state.periodLabel,worksheet:s.worksheet||state.worksheet});migrate();return true;}}catch(e){}return false;}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'application/json'}));a.download=name;a.click();}
function varObj(v,name,tc){const out={name,is_transfer_coefficient:!!tc};if(v.type==='measured'){out.type='MeasuredVariable';out.value=v.value;out.uncertainty=v.unc;}else if(v.type==='fixed'){out.type='FixedVariable';out.value=v.value;}else out.type='UnmeasuredVariable';return out;}
function addNode(type){
 const prefix=type==='process'?'P':type==='stock'?'S':'Sub';
 const n={id:'n'+state.nextId++,type,name:prefix+(state.nextId-1),x:150+Math.random()*300,y:120+Math.random()*200};
 if(type==='stock'){n.boundary=false;n.layerData={};state.layers.forEach(l=>{n.layerData[l.id]={start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}};});}
 state.nodes.push(n);select({kind:'node',id:n.id});save();
}
function addFlow(from,to){
 if(from===to)return;
 const f={id:'f'+state.nextId++,name:'F'+(state.flows.length+1),from,to,layerData:{},tc:{},conc:{enabled:false,type:'measured',value:10,unc:1}};
 state.layers.forEach(l=>{f.layerData[l.id]={type:'unmeasured',value:0,unc:0.1,unit:l.unit};f.tc[l.id]={enabled:false,type:'measured',value:0.5,unc:0.05};});
 state.flows.push(f);select({kind:'flow',id:f.id});save();
}
function select(sel){state.selected=sel;renderPanel();render();}
function getNode(id){return state.nodes.find(n=>n.id===id);}
function vname(f,l){return f.name+'__'+l;}
function tname(f,l){return f.name+'_tc__'+l;}
function flowValue(f,l){const n=vname(f,l);if(state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[n]!==undefined)return Math.abs(+state.lastResult.variables_value[n]||0);return Math.abs(+f.layerData[l].value||0);}
function render(){
 svg.innerHTML='';
 const defs=el('defs',{});const marker=el('marker',{id:'arrow',viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'6',markerHeight:'6',orient:'auto'});marker.appendChild(el('path',{d:'M0,0 L10,5 L0,10 z',fill:'#333'}));defs.appendChild(marker);svg.appendChild(defs);
 const widths={};
 if(state.weighted){const vals=state.flows.map(f=>flowValue(f,state.activeLayer));const mx=Math.max(...vals,1e-9);state.flows.forEach((f,i)=>widths[f.id]=2+18*vals[i]/mx);}
 state.flows.forEach(f=>{const a=getNode(f.from),b=getNode(f.to);if(!a||!b)return;const line=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:state.selected&&state.selected.kind==='flow'&&state.selected.id===f.id?'#e67e22':'#333','stroke-width':widths[f.id]||2,'marker-end':'url(#arrow)',class:'flow'});line.addEventListener('click',()=>select({kind:'flow',id:f.id}));svg.appendChild(line);const mid=el('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-6,'font-size':'12','text-anchor':'middle'});mid.textContent=f.name;svg.appendChild(mid);});
 state.nodes.forEach(n=>{const g=el('g',{class:'node'+(state.selected&&state.selected.kind==='node'&&state.selected.id===n.id?' selected':''),transform:`translate(${n.x},${n.y})`});if(n.type==='process')g.appendChild(el('rect',{x:-30,y:-20,width:60,height:40,fill:'#dbeafe',stroke:'#333'}));else if(n.type==='subsystem')g.appendChild(el('rect',{x:-40,y:-25,width:80,height:50,rx:12,fill:'#fef9c3',stroke:'#333'}));else g.appendChild(el('circle',{r:22,fill:n.boundary?'#fee2e2':'#dcfce7',stroke:'#333'}));const t=el('text',{'text-anchor':'middle',dy:'4','font-size':'12'});t.textContent=n.name;g.appendChild(t);g.addEventListener('mousedown',e=>{e.preventDefault();if(state.mode==='connect'){if(!state.connectFrom){state.connectFrom=n.id;}else{addFlow(state.connectFrom,n.id);state.connectFrom=null;state.mode='select';}return;}const sx=e.clientX-n.x,sy=e.clientY-n.y;const move=ev=>{n.x=ev.clientX-sx;n.y=ev.clientY-sy;render();};const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);select({kind:'node',id:n.id});save();};window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);});svg.appendChild(g);});
}
function dataEditor(v,p){return `<label>Type<select id="${p}_type"><option${v.type==='measured'?' selected':''}>measured</option><option${v.type==='unmeasured'?' selected':''}>unmeasured</option><option${v.type==='fixed'?' selected':''}>fixed</option></select></label><label>Value<input id="${p}_value" type="number" value="${v.value}"></label><label>Uncertainty<input id="${p}_unc" type="number" step="0.01" value="${v.unc}"></label>`;}
function unitOptions(sel){return Object.keys(UNITS.mass).concat(Object.keys(UNITS.energy)).map(u=>`<option${u===sel?' selected':''}>${u}</option>`).join('');}
function renderPanel(){
 const p=document.getElementById('props');
 let html='<h3>Layers</h3>';
 html+=state.layers.map(l=>`<button class="layerBtn" data-l="${l.id}" style="margin:2px;padding:4px 8px;${l.id===state.activeLayer?'background:#dbeafe':''}">${l.name}</button>`).join('');
 html+=`<button id="addLayer" style="margin:2px;padding:4px 8px">+ Layer</button>`;
 p.innerHTML=html;
 p.querySelectorAll('.layerBtn').forEach(b=>b.onclick=()=>{state.activeLayer=b.dataset.l;renderPanel();});
 document.getElementById('addLayer').onclick=()=>{const id='L'+(state.layers.length+1);state.layers.push({id,name:'Layer '+(state.layers.length+1),unit:'t/a'});state.activeLayer=id;state.flows.forEach(f=>{f.layerData[id]={type:'unmeasured',value:0,unc:0.1,unit:'t/a'};f.tc[id]={enabled:false,type:'measured',value:0.5,unc:0.05};});state.nodes.filter(n=>n.type==='stock').forEach(n=>{n.layerData[id]={start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}};});save();renderPanel();};
 const box=document.createElement('div');p.appendChild(box);
 if(!state.selected){box.innerHTML='<p>Select a node or flow.</p>';return;}
 const L=state.activeLayer;
 if(state.selected.kind==='node'){
  const n=getNode(state.selected.id);const outs=state.flows.filter(f=>f.from===n.id);
  let h=`<h3>${n.name} — ${state.layers.find(l=>l.id===L).name}</h3><label>Name<input id="pName" value="${n.name}"></label>`;
  if(n.type==='stock'){h+=`<label><input type="checkbox" id="boundary" ${n.boundary?'checked':''}> Boundary stock (no balance equation)</label><p>Stock contents are quantities at the start/end of the reference period; connected flows are rates over that period.</p>`;h+='<h4>Start</h4>'+dataEditor(n.layerData[L].start,'st')+'<h4>End</h4>'+dataEditor(n.layerData[L].end,'en');}
  if(n.type==='process'){h+='<h4>Transfer coefficients</h4>';if(!outs.length)h+='<p>No outgoing flows.</p>';outs.forEach(f=>{const tc=f.tc[L];h+=`<h5>${f.name}</h5><label><input type="checkbox" id="tc_${f.id}" ${tc.enabled?'checked':''}> Use TC</label><div id="tcbox_${f.id}" style="display:${tc.enabled?'block':'none'}">${dataEditor(tc,'tc'+f.id)}</div>`;});}
  if(n.type==='subsystem')h+='<p>Simplified balance node: inputs minus outputs equals zero. It does not yet contain a nested internal model.</p>';
  box.innerHTML=h;
  document.getElementById('pName').oninput=e=>{n.name=e.target.value;render();save();};
  if(n.type==='stock'){
   document.getElementById('boundary').onchange=e=>{n.boundary=e.target.checked;render();save();};
   ['st','en'].forEach((k,i)=>{const key=i?'end':'start';document.getElementById(k+'_type').onchange=e=>{n.layerData[L][key].type=e.target.value;save();};document.getElementById(k+'_value').oninput=e=>{n.layerData[L][key].value=+e.target.value;save();};document.getElementById(k+'_unc').oninput=e=>{n.layerData[L][key].unc=+e.target.value;save();};});
  }
  outs.forEach(f=>{const tc=f.tc[L];document.getElementById('tc_'+f.id).onchange=e=>{tc.enabled=e.target.checked;render();renderPanel();save();};document.getElementById('tc'+f.id+'_type').onchange=e=>{tc.type=e.target.value;save();};document.getElementById('tc'+f.id+'_value').oninput=e=>{tc.value=+e.target.value;save();};document.getElementById('tc'+f.id+'_unc').oninput=e=>{tc.unc=+e.target.value;save();};});
 }else{
  const f=state.flows.find(x=>x.id===state.selected.id);const d=f.layerData[L];const primary=state.layers[0],secondary=state.layers[1];
  let h=`<h3>${f.name} — ${state.layers.find(l=>l.id===L).name}</h3><label>Name<input id="fName" value="${f.name}"></label>`+dataEditor(d,'d')+`<label>Unit<input id="d_unit" value="${d.unit||''}"></label>
  <label>Convert value and uncertainty<br><select id="convFrom">${unitOptions(d.unit)}</select> to <select id="convTo">${unitOptions(d.unit)}</select></label><button id="convertBtn">Convert</button>`;
  if(primary&&secondary){const c=f.conc;h+=`<h4>Concentration link</h4><p>Direction: <b>${primary.name}</b> → <b>${secondary.name}</b>. Equation: secondary flow = concentration × primary flow.</p><label><input type="checkbox" id="c_en" ${c.enabled?'checked':''}> Enable</label><div id="cbox" style="display:${c.enabled?'block':'none'}">${dataEditor(c,'c')}</div>`;}
  box.innerHTML=h;
  document.getElementById('fName').oninput=e=>{f.name=e.target.value;render();save();};
  document.getElementById('d_type').onchange=e=>{d.type=e.target.value;save();};
  document.getElementById('d_value').oninput=e=>{d.value=+e.target.value;save();};
  document.getElementById('d_unc').oninput=e=>{d.unc=+e.target.value;save();};
  document.getElementById('d_unit').oninput=e=>{d.unit=e.target.value;save();};
  document.getElementById('convertBtn').onclick=()=>{const from=document.getElementById('convFrom').value,to=document.getElementById('convTo').value;const fam=Object.keys(UNITS).find(k=>UNITS[k][from]!==undefined&&UNITS[k][to]!==undefined);if(!fam){alert('Incompatible units: conversion only within mass or energy.');return;}const k=UNITS[fam][from]/UNITS[fam][to];d.value=d.value*k;d.unc=d.unc*k;d.unit=to;save();renderPanel();render();};
  if(primary&&secondary){document.getElementById('c_en').onchange=e=>{f.conc.enabled=e.target.checked;renderPanel();save();};document.getElementById('c_type').onchange=e=>{f.conc.type=e.target.value;save();};document.getElementById('c_value').oninput=e=>{f.conc.value=+e.target.value;save();};document.getElementById('c_unc').oninput=e=>{f.conc.unc=+e.target.value;save();};}
 }
}
function exportModel(){
 const variables=[];const equations=[];
 state.flows.forEach(f=>state.layers.forEach(l=>{
  variables.push(varObj(f.layerData[l.id],vname(f,l.id)));
  if(f.tc[l.id].enabled){variables.push(varObj(f.tc[l.id],tname(f,l.id),true));}
 }));
 state.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>state.layers.forEach(l=>{
  variables.push(varObj(n.layerData[l.id].start,n.name+'_start__'+l.id));
  variables.push(varObj(n.layerData[l.id].end,n.name+'_end__'+l.id));
 }));
 state.nodes.forEach(n=>{
  const ins=state.flows.filter(f=>f.to===n.id),outs=state.flows.filter(f=>f.from===n.id);
  state.layers.forEach(l=>{
   if(n.type==='process'||n.type==='subsystem'){
    const lt=[];ins.forEach(f=>lt.push({name:vname(f,l.id),factor:1}));outs.forEach(f=>lt.push({name:vname(f,l.id),factor:-1}));
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
    outs.filter(f=>f.tc[l.id].enabled).forEach(f=>{
     equations.push({constant_term:{value:0},linear_terms:[{name:vname(f,l.id),factor:1}],bilinear_terms:ins.map(i=>({name1:tname(f,l.id),name2:vname(i,l.id),factor:-1}))});
    });
   }
   if(n.type==='stock'&&!n.boundary){
    const lt=[];ins.forEach(f=>lt.push({name:vname(f,l.id),factor:1}));outs.forEach(f=>lt.push({name:vname(f,l.id),factor:-1}));
    lt.push({name:n.name+'_end__'+l.id,factor:-1});lt.push({name:n.name+'_start__'+l.id,factor:1});
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
   }
  });
 });
 const primary=state.layers[0],secondary=state.layers[1];
 if(primary&&secondary){state.flows.forEach(f=>{if(f.conc&&f.conc.enabled){variables.push(varObj(f.conc,f.name+'_conc'));equations.push({constant_term:{value:0},linear_terms:[{name:vname(f,secondary.id),factor:1}],bilinear_terms:[{name1:f.name+'_conc',name2:vname(f,primary.id),factor:-1}]});}});}
 return {content:{name:state.modelName,period:state.periodLabel,variables,equations,solver:'JuMP'}};
}
function validateModel(){
 const msgs=[];let eqCount=0;const unknowns=new Set();
 state.flows.forEach(f=>state.layers.forEach(l=>{
  unknowns.add(vname(f,l.id));
  const d=f.layerData[l.id];
  if(!Number.isFinite(+d.value))msgs.push({level:'error',msg:`${f.name} (${l.id}): value is not a number.`});
  if(d.type==='measured'&&!(+d.unc>0))msgs.push({level:'error',msg:`${f.name} (${l.id}): measured variables need uncertainty > 0.`});
  if(f.tc[l.id].enabled)unknowns.add(tname(f,l.id));
 }));
 state.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>state.layers.forEach(l=>{unknowns.add(n.name+'_start__'+l.id);unknowns.add(n.name+'_end__'+l.id);}));
 state.nodes.forEach(n=>{
  const ins=state.flows.filter(f=>f.to===n.id),outs=state.flows.filter(f=>f.from===n.id);
  state.layers.forEach(l=>{
   if(n.type==='process'||n.type==='subsystem'){eqCount++;
    outs.filter(f=>f.tc[l.id].enabled).forEach(f=>{eqCount++;
     if(!ins.length)msgs.push({level:'error',msg:`${f.name}: transfer coefficient needs at least one input flow.`});
     if(ins.length===1&&outs.length===1)msgs.push({level:'warning',msg:`${f.name}: TC with one input and one output over-constrains the balance; add a loss/split outlet.`});
    });
   }
   if(n.type==='stock'&&!n.boundary)eqCount++;
  });
 });
 const primary=state.layers[0],secondary=state.layers[1];
 if(primary&&secondary)state.flows.forEach(f=>{if(f.conc&&f.conc.enabled)eqCount++;});
 msgs.push({level:'info',msg:`Preliminary count: ${eqCount} equations, ${unknowns.size} variables. This does not prove observability, redundancy, or feasibility.`});
 return msgs;
}
function showValidation(msgs){
 document.getElementById('validation').innerHTML=msgs.map(m=>`<p style="color:${m.level==='error'?'#b91c1c':m.level==='warning'?'#b45309':'#1d4ed8'}"><b>${m.level.toUpperCase()}:</b> ${m.msg}</p>`).join('');
}
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
 const rows=parseCSV(text);if(!rows.length)return showValidation([{level:'error',msg:'CSV file is empty.'}]);
 const header=rows[0].map(h=>h.trim().toLowerCase());const idx=n=>header.indexOf(n);
 const need=['name','layer','type','value','uncertainty','unit'];
 if(need.some(n=>idx(n)<0))return showValidation([{level:'error',msg:'CSV needs columns: name,layer,type,value,uncertainty,unit.'}]);
 let applied=0,skipped=0;const msgs=[{level:'info',msg:'CSV import updates existing flows only; it does not create new flows.'}];
 rows.slice(1).forEach(r=>{
  const name=r[idx('name')].trim(),layer=r[idx('layer')].trim();
  const f=state.flows.find(x=>x.name===name);
  if(!f||!f.layerData[layer]){skipped++;msgs.push({level:'warning',msg:`Skipped ${name} (${layer||'no layer'}).`});return;}
  const d=f.layerData[layer];d.type=r[idx('type')].trim();d.value=+r[idx('value')];d.unc=+r[idx('uncertainty')];d.unit=r[idx('unit')].trim();applied++;
 });
 msgs.unshift({level:'info',msg:`CSV import: ${applied} values applied, ${skipped} skipped.`});
 save();render();renderPanel();showValidation(msgs);
}
function showResult(data){
 state.lastResult=data;
 document.getElementById('output').textContent=JSON.stringify(data,null,2);
 const rt=document.getElementById('resultTable');
 const vals=data&&data.variables_value||{};const uncs=data&&data.uncertainties||{};
 let html='';
 if(data){
  html+=`<table><tr><th>Status</th><td>${data.status||''}</td></tr><tr><th>Objective</th><td>${data.objective_value??''}</td></tr><tr><th>Residual</th><td>${data.residual_value??''}</td></tr><tr><th>Solve time</th><td>${data['Solve time (s)']??''} s</td></tr></table>`;
 }
 const names=Object.keys(vals);
 if(names.length){
  html+='<table><tr><th>Variable</th><th>Entered</th><th>Reconciled</th><th>Uncertainty</th><th>Δ/σ</th></tr>'+names.map(n=>{
   const m=n.match(/^(F\d+)__(L\d+)$/);let entered='',z='';let color='';
   if(m){const f=state.flows.find(x=>x.name===m[1]);const l=m[2];
    if(f&&f.layerData[l]){entered=f.layerData[l].value;
     if(f.layerData[l].type==='measured'&&+f.layerData[l].unc>0){z=((+vals[n])-f.layerData[l].value)/f.layerData[l].unc;z=z.toFixed(2);if(Math.abs(z)>2)color='color:#b91c1c;font-weight:bold';}
    }
   }
   return `<tr><td>${n}</td><td>${entered}</td><td>${vals[n]}</td><td>${uncs[n]??''}</td><td style="${color}">${z}</td></tr>`;
  }).join('')+'</table><p>Δ/σ is the normalized shift from the entered measured value; |Δ/σ| &gt; 2 is highlighted. A large shift indicates tension between data and model assumptions, not necessarily an incorrect measurement.</p>';
 }else html+='<p>No variable values found; see raw JSON.</p>';
 rt.innerHTML=html;render();
}
function exportWorksheet(){
 const w=state.worksheet;
 const md=`# MFA/SEFA project worksheet\n\n## Model\n\n- Model: ${state.modelName}\n- Reference period: ${state.periodLabel}\n\n## Research question\n\n${w.question||'(not filled)'}\n\n## Spatial boundary\n\n${w.spatial||'(not filled)'}\n\n## Reference period\n\n${w.period||state.periodLabel}\n\n## Tracked goods, substances, and energy\n\n${w.quantities||'(not filled)'}\n\n## Data sources and assumptions\n\n${w.sources||'(not filled)'}\n\n## Interpretation and optimization potential\n\n${w.interpretation||'(not filled)'}\n`;
 download((state.modelName||'worksheet').replace(/\W+/g,'_')+'_worksheet.md',md,'text/markdown');
}
document.getElementById('addProcess').onclick=()=>addNode('process');
document.getElementById('addStock').onclick=()=>addNode('stock');
document.getElementById('addSubsystem').onclick=()=>addNode('subsystem');
document.getElementById('connectMode').onclick=()=>{state.mode='connect';state.connectFrom=null;};
document.getElementById('deleteSel').onclick=()=>{if(!state.selected)return;if(state.selected.kind==='node'){state.flows=state.flows.filter(f=>f.from!==state.selected.id&&f.to!==state.selected.id);state.nodes=state.nodes.filter(n=>n.id!==state.selected.id);}else state.flows=state.flows.filter(f=>f.id!==state.selected.id);state.selected=null;render();renderPanel();save();};
document.getElementById('validate').onclick=()=>showValidation(validateModel());
document.getElementById('weightedToggle').onclick=e=>{state.weighted=!state.weighted;e.target.textContent='Weighted flows: '+(state.weighted?'on':'off');render();};
document.getElementById('importCsvBtn').onclick=()=>document.getElementById('importCsv').click();
document.getElementById('importCsv').onchange=e=>{const r=new FileReader();r.onload=()=>importCSV(r.result);r.readAsText(e.target.files[0]);};
document.getElementById('exportWorksheet').onclick=exportWorksheet;
document.getElementById('exportJson').onclick=()=>{document.getElementById('output').textContent=JSON.stringify(exportModel(),null,2);};
document.getElementById('saveProject').onclick=()=>download((state.modelName||'model').replace(/\W+/g,'_')+'.json',JSON.stringify({nodes:state.nodes,flows:state.flows,layers:state.layers,nextId:state.nextId,modelName:state.modelName,periodLabel:state.periodLabel,worksheet:state.worksheet},null,2));
document.getElementById('openProjectBtn').onclick=()=>document.getElementById('openProject').click();
document.getElementById('openProject').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);Object.assign(state,{nodes:s.nodes||[],flows:s.flows||[],layers:s.layers||state.layers,nextId:s.nextId||1,modelName:s.modelName||'SEFMN model',periodLabel:s.periodLabel||'Year 2026',worksheet:s.worksheet||state.worksheet});migrate();document.getElementById('modelName').value=state.modelName;document.getElementById('periodLabel').value=state.periodLabel;['question','spatial','period','quantities','sources','interpretation'].forEach(k=>document.getElementById('ws_'+k).value=state.worksheet[k]||'');state.selected=null;render();renderPanel();save();}catch(err){alert('Invalid project file: '+err.message);}};r.readAsText(e.target.files[0]);};
document.getElementById('solve').onclick=async()=>{const url=document.getElementById('solverUrl').value;showValidation(validateModel());document.getElementById('output').textContent='Solving…';try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exportModel())});showResult(await r.json());}catch(e){document.getElementById('output').textContent='Error: '+e.message+'\n\nIf CORS blocks this, serve via: python3 -m http.server 8000';}};
document.getElementById('modelName').oninput=e=>{state.modelName=e.target.value;save();};
document.getElementById('periodLabel').oninput=e=>{state.periodLabel=e.target.value;save();};
document.getElementById('solverUrl').onchange=save;
['question','spatial','period','quantities','sources','interpretation'].forEach(k=>{document.getElementById('ws_'+k).oninput=e=>{state.worksheet[k]=e.target.value;save();};});
document.getElementById('loadClean').onclick=()=>{
 state={nodes:[],flows:[],layers:[{id:'L1',name:'Goods',unit:'t/a'}],selected:null,mode:'select',connectFrom:null,nextId:1,modelName:'Consistent balance example',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',worksheet:state.worksheet};
 state.nodes=[{id:'n1',type:'stock',name:'S1',x:100,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n2',type:'process',name:'P1',x:320,y:150},{id:'n3',type:'stock',name:'S2',x:540,y:80,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n4',type:'stock',name:'S3',x:540,y:220,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}];
 const mk=(name,from,to,type,value,unc)=>({id:'f'+state.nextId++,name,from,to,layerData:{L1:{type,value,unc,unit:'t/a'}},tc:{L1:{enabled:false,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}});
 state.flows=[mk('F1','n1','n2','measured',100,10),mk('F2','n2','n3','measured',50,5),mk('F3','n2','n4','unmeasured',0,0.1)];
 state.flows[1].tc.L1.enabled=true;state.flows[1].tc.L1.value=0.5;state.flows[1].tc.L1.unc=0.05;
 state.nextId=5;document.getElementById('modelName').value=state.modelName;document.getElementById('periodLabel').value=state.periodLabel;document.getElementById('weightedToggle').textContent='Weighted flows: off';render();renderPanel();save();
};
document.getElementById('loadConflict').onclick=()=>{
 state={nodes:[],flows:[],layers:[{id:'L1',name:'Goods',unit:'t/a'},{id:'L2',name:'Phosphorus',unit:'kg/a'}],selected:null,mode:'select',connectFrom:null,nextId:1,modelName:'Conflict example',activeLayer:'L1',weighted:false,lastResult:null,periodLabel:'Year 2026',worksheet:state.worksheet};
 state.nodes=[{id:'n1',type:'stock',name:'S1',x:80,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}},{id:'n2',type:'process',name:'P1',x:260,y:150},{id:'n3',type:'process',name:'P2',x:440,y:150},{id:'n4',type:'stock',name:'S2',x:620,y:150,boundary:true,layerData:{L1:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},L2:{start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}}}];
 const mk=(name,from,to,l1,l2)=>({id:'f'+state.nextId++,name,from,to,layerData:{L1:l1,L2:l2},tc:{L1:{enabled:false,type:'measured',value:0.5,unc:0.05},L2:{enabled:false,type:'measured',value:0.5,unc:0.05}},conc:{enabled:false,type:'measured',value:10,unc:1}});
 state.flows=[mk('F1','n1','n2',{type:'measured',value:100,unc:10,unit:'t/a'},{type:'measured',value:1000,unc:100,unit:'kg/a'}),mk('F2','n2','n3',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'}),mk('F3','n3','n4',{type:'measured',value:160,unc:16,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'}),mk('F4','n2','n4',{type:'unmeasured',value:0,unc:0.1,unit:'t/a'},{type:'unmeasured',value:0,unc:1,unit:'kg/a'})];
 state.flows[1].tc.L1.enabled=true;state.flows[1].tc.L1.value=0.5;state.flows[1].tc.L1.unc=0.05;
 state.flows[2].conc.enabled=true;state.flows[2].conc.value=10;state.flows[2].conc.unc=1;
 state.nextId=6;document.getElementById('modelName').value=state.modelName;document.getElementById('periodLabel').value=state.periodLabel;document.getElementById('weightedToggle').textContent='Weighted flows: off';render();renderPanel();save();
};
if(!loadSaved()){document.getElementById('loadClean').click();}else{render();renderPanel();['question','spatial','period','quantities','sources','interpretation'].forEach(k=>document.getElementById('ws_'+k).value=state.worksheet[k]||'');}
