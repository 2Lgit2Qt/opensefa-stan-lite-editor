const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('canvas');
const LS_KEY='opensefa-stan-lite-project';
let state={nodes:[],flows:[],selected:null,mode:'select',connectFrom:null,nextId:1,modelName:'SEFMN model'};

function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function save(){localStorage.setItem(LS_KEY,JSON.stringify({nodes:state.nodes,flows:state.flows,nextId:state.nextId,modelName:state.modelName}));}
function loadSaved(){try{const s=JSON.parse(localStorage.getItem(LS_KEY));if(s&&s.nodes){state.nodes=s.nodes;state.flows=s.flows;state.nextId=s.nextId;state.modelName=s.modelName||state.modelName;state.nodes.forEach(n=>{if(n.type==='stock'&&!n.start){n.start={type:'fixed',value:0,unc:0};n.end={type:'fixed',value:0,unc:0};}});return true;}}catch(e){}return false;}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;a.click();}
function varObj(v,prefix){const out={name:prefix,is_transfer_coefficient:false};if(v.type==='measured'){out.type='MeasuredVariable';out.value=v.value;out.uncertainty=v.unc;}else if(v.type==='fixed'){out.type='FixedVariable';out.value=v.value;}else out.type='UnmeasuredVariable';return out;}

function addNode(type){
  const prefix=type==='process'?'P':type==='stock'?'S':'Sub';
  const n={id:'n'+state.nextId++,type,name:prefix+(state.nextId-1),x:150+Math.random()*300,y:120+Math.random()*200};
  if(type==='stock'){n.start={type:'fixed',value:0,unc:0};n.end={type:'fixed',value:0,unc:0};}
  state.nodes.push(n);select({kind:'node',id:n.id});save();
}

function addFlow(from,to){
  if(from===to)return;
  const f={id:'f'+state.nextId++,name:'F'+(state.flows.length+1),from,to,type:'unmeasured',value:0,uncertainty:0.1,unit:'t/a',tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05};
  state.flows.push(f);select({kind:'flow',id:f.id});save();
}

function select(sel){state.selected=sel;renderPanel();render();}
function getNode(id){return state.nodes.find(n=>n.id===id);}
function tcName(f){return f.name+'_tc';}

function render(){
  svg.innerHTML='';
  const defs=el('defs',{});
  const marker=el('marker',{id:'arrow',viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'6',markerHeight:'6',orient:'auto'});
  marker.appendChild(el('path',{d:'M0,0 L10,5 L0,10 z',fill:'#333'}));
  defs.appendChild(marker);svg.appendChild(defs);
  state.flows.forEach(f=>{
    const a=getNode(f.from),b=getNode(f.to);if(!a||!b)return;
    const line=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:state.selected&&state.selected.kind==='flow'&&state.selected.id===f.id?'#e67e22':'#333','stroke-width':2,'marker-end':'url(#arrow)',class:'flow'});
    line.addEventListener('click',()=>select({kind:'flow',id:f.id}));
    svg.appendChild(line);
    const mid=el('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-6,'font-size':'12','text-anchor':'middle'});
    mid.textContent=f.name+(f.tcEnabled?' [tc]':'');svg.appendChild(mid);
  });
  state.nodes.forEach(n=>{
    const g=el('g',{class:'node'+(state.selected&&state.selected.kind==='node'&&state.selected.id===n.id?' selected':''),transform:`translate(${n.x},${n.y})`});
    if(n.type==='process')g.appendChild(el('rect',{x:-30,y:-20,width:60,height:40,fill:'#dbeafe',stroke:'#333'}));
    else if(n.type==='subsystem')g.appendChild(el('rect',{x:-40,y:-25,width:80,height:50,rx:12,fill:'#fef9c3',stroke:'#333'}));
    else g.appendChild(el('circle',{r:22,fill:'#dcfce7',stroke:'#333'}));
    const t=el('text',{'text-anchor':'middle',dy:'4','font-size':'12'});t.textContent=n.name;g.appendChild(t);
    g.addEventListener('mousedown',e=>{e.preventDefault();if(state.mode==='connect'){if(!state.connectFrom){state.connectFrom=n.id;}else{addFlow(state.connectFrom,n.id);state.connectFrom=null;state.mode='select';}return;}const sx=e.clientX-n.x,sy=e.clientY-n.y;const move=ev=>{n.x=ev.clientX-sx;n.y=ev.clientY-sy;render();};const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);select({kind:'node',id:n.id});save();};window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);});
    svg.appendChild(g);
  });
}

function contentEditor(label,v,id){
  return `<h4>${label}</h4>
  <label>Type<select id="${id}_type"><option${v.type==='measured'?' selected':''}>measured</option><option${v.type==='unmeasured'?' selected':''}>unmeasured</option><option${v.type==='fixed'?' selected':''}>fixed</option></select></label>
  <label>Value<input id="${id}_value" type="number" value="${v.value}"></label>
  <label>Uncertainty<input id="${id}_unc" type="number" step="0.01" value="${v.unc}"></label>`;
}

function renderPanel(){
  const p=document.getElementById('props');p.innerHTML='';
  if(!state.selected){p.innerHTML='<p>Select a node or flow.</p>';return;}
  if(state.selected.kind==='node'){
    const n=getNode(state.selected.id);
    const outs=state.flows.filter(f=>f.from===n.id);
    let html=`<label>Name<input id="pName" value="${n.name}"></label><p>Type: ${n.type}</p>`;
    if(n.type==='stock'){
      html+=contentEditor('Start content',n.start,'start')+contentEditor('End content',n.end,'end');
    }
    if(n.type==='process'){
      html+='<h3>Transfer coefficients</h3>';
      if(!outs.length)html+='<p>No outgoing flows.</p>';
      outs.forEach(f=>{
        html+=`<h4>${f.name}</h4>
        <label><input type="checkbox" id="tc_${f.id}" ${f.tcEnabled?'checked':''}> Use transfer coefficient</label>
        <div id="tcbox_${f.id}" style="display:${f.tcEnabled?'block':'none'}">
          <label>Type<select id="tct_${f.id}"><option${f.tcType==='measured'?' selected':''}>measured</option><option${f.tcType==='unmeasured'?' selected':''}>unmeasured</option><option${f.tcType==='fixed'?' selected':''}>fixed</option></select></label>
          <label>Value<input id="tcv_${f.id}" type="number" step="0.01" value="${f.tcValue}"></label>
          <label>Uncertainty<input id="tcu_${f.id}" type="number" step="0.01" value="${f.tcUnc}"></label>
        </div>`;
      });
    }
    p.innerHTML=html;
    document.getElementById('pName').oninput=e=>{n.name=e.target.value;render();save();};
    if(n.type==='stock'){
      ['start','end'].forEach(k=>{
        document.getElementById(k+'_type').onchange=e=>{n[k].type=e.target.value;save();};
        document.getElementById(k+'_value').oninput=e=>{n[k].value=+e.target.value;save();};
        document.getElementById(k+'_unc').oninput=e=>{n[k].unc=+e.target.value;save();};
      });
    }
    outs.forEach(f=>{
      document.getElementById('tc_'+f.id).onchange=e=>{f.tcEnabled=e.target.checked;render();renderPanel();save();};
      document.getElementById('tct_'+f.id).onchange=e=>{f.tcType=e.target.value;save();};
      document.getElementById('tcv_'+f.id).oninput=e=>{f.tcValue=+e.target.value;save();};
      document.getElementById('tcu_'+f.id).oninput=e=>{f.tcUnc=+e.target.value;save();};
    });
  }else{
    const f=state.flows.find(x=>x.id===state.selected.id);
    p.innerHTML=`<label>Name<input id="fName" value="${f.name}"></label>
      <label>Unit<input id="fUnit" value="${f.unit||''}"></label>
      <label>Type<select id="fType"><option${f.type==='measured'?' selected':''}>measured</option><option${f.type==='unmeasured'?' selected':''}>unmeasured</option><option${f.type==='fixed'?' selected':''}>fixed</option></select></label>
      <label>Value<input id="fValue" type="number" value="${f.value}"></label>
      <label>Uncertainty<input id="fUnc" type="number" step="0.01" value="${f.uncertainty}"></label>
      <p>${getNode(f.from).name} → ${getNode(f.to).name}</p>`;
    document.getElementById('fName').oninput=e=>{f.name=e.target.value;render();save();};
    document.getElementById('fUnit').oninput=e=>{f.unit=e.target.value;save();};
    document.getElementById('fType').onchange=e=>{f.type=e.target.value;render();save();};
    document.getElementById('fValue').oninput=e=>{f.value=+e.target.value;save();};
    document.getElementById('fUnc').oninput=e=>{f.uncertainty=+e.target.value;save();};
  }
}

function exportModel(){
  const variables=state.flows.map(f=>{
    const v={name:f.name,is_transfer_coefficient:false};
    if(f.type==='measured'){v.type='MeasuredVariable';v.value=f.value;v.uncertainty=f.uncertainty;}
    else if(f.type==='fixed'){v.type='FixedVariable';v.value=f.value;}
    else v.type='UnmeasuredVariable';
    return v;
  });
  state.flows.forEach(f=>{
    if(!f.tcEnabled)return;
    variables.push(varObj({type:f.tcType,value:f.tcValue,unc:f.tcUnc},tcName(f)));
    variables[variables.length-1].is_transfer_coefficient=true;
  });
  state.nodes.filter(n=>n.type==='stock').forEach(n=>{
    variables.push(varObj(n.start,n.name+'_start'));
    variables.push(varObj(n.end,n.name+'_end'));
  });
  const equations=[];
  state.nodes.forEach(n=>{
    const ins=state.flows.filter(f=>f.to===n.id);
    const outs=state.flows.filter(f=>f.from===n.id);
    if(n.type==='process'||n.type==='subsystem'){
      const linear_terms=[];
      ins.forEach(f=>linear_terms.push({name:f.name,factor:1}));
      outs.forEach(f=>linear_terms.push({name:f.name,factor:-1}));
      equations.push({constant_term:{value:0},linear_terms,bilinear_terms:[]});
      outs.filter(f=>f.tcEnabled).forEach(f=>{
        equations.push({constant_term:{value:0},linear_terms:[{name:f.name,factor:1}],bilinear_terms:ins.map(i=>({name1:tcName(f),name2:i.name,factor:-1}))});
      });
    }
    if(n.type==='stock'){
      const linear_terms=[];
      ins.forEach(f=>linear_terms.push({name:f.name,factor:1}));
      outs.forEach(f=>linear_terms.push({name:f.name,factor:-1}));
      linear_terms.push({name:n.name+'_end',factor:-1});
      linear_terms.push({name:n.name+'_start',factor:1});
      equations.push({constant_term:{value:0},linear_terms,bilinear_terms:[]});
    }
  });
  return {content:{name:state.modelName,variables,equations,solver:'JuMP'}};
}

function showResult(data){
  document.getElementById('output').textContent=JSON.stringify(data,null,2);
  const vars=(data&&(data.solution&&data.solution.variables))||data&&data.variables||null;
  const rt=document.getElementById('resultTable');
  if(Array.isArray(vars)&&vars.length){
    rt.innerHTML='<table><tr><th>Variable</th><th>Value</th><th>Uncertainty</th></tr>'+vars.map(v=>`<tr><td>${v.name||''}</td><td>${v.value??v.reconciled??''}</td><td>${v.uncertainty??v.std??''}</td></tr>`).join('')+'</table>';
  }else rt.innerHTML='<p>No variable table found in solver response; see raw JSON below.</p>';
}

document.getElementById('addProcess').onclick=()=>addNode('process');
document.getElementById('addStock').onclick=()=>addNode('stock');
document.getElementById('addSubsystem').onclick=()=>addNode('subsystem');
document.getElementById('connectMode').onclick=()=>{state.mode='connect';state.connectFrom=null;};
document.getElementById('deleteSel').onclick=()=>{if(!state.selected)return;if(state.selected.kind==='node'){state.flows=state.flows.filter(f=>f.from!==state.selected.id&&f.to!==state.selected.id);state.nodes=state.nodes.filter(n=>n.id!==state.selected.id);}else state.flows=state.flows.filter(f=>f.id!==state.selected.id);state.selected=null;render();renderPanel();save();};
document.getElementById('exportJson').onclick=()=>{document.getElementById('output').textContent=JSON.stringify(exportModel(),null,2);};
document.getElementById('saveProject').onclick=()=>download((state.modelName||'model').replace(/\W+/g,'_')+'.json',JSON.stringify({nodes:state.nodes,flows:state.flows,nextId:state.nextId,modelName:state.modelName},null,2));
document.getElementById('openProjectBtn').onclick=()=>document.getElementById('openProject').click();
document.getElementById('openProject').onchange=e=>{const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);state.nodes=s.nodes||[];state.flows=s.flows||[];state.nextId=s.nextId||1;state.modelName=s.modelName||'SEFMN model';state.nodes.forEach(n=>{if(n.type==='stock'&&!n.start){n.start={type:'fixed',value:0,unc:0};n.end={type:'fixed',value:0,unc:0};}});document.getElementById('modelName').value=state.modelName;state.selected=null;render();renderPanel();save();}catch(err){alert('Invalid project file: '+err.message);}};r.readAsText(e.target.files[0]);};
document.getElementById('solve').onclick=async()=>{
  const url=document.getElementById('solverUrl').value;
  document.getElementById('output').textContent='Solving…';
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exportModel())});showResult(await r.json());}
  catch(e){document.getElementById('output').textContent='Error: '+e.message+'\n\nIf this is a CORS error, serve this page via: python -m http.server 8000';}
};
document.getElementById('modelName').oninput=e=>{state.modelName=e.target.value;save();};
document.getElementById('solverUrl').onchange=save;
document.getElementById('loadDemo').onclick=()=>{
  state={nodes:[],flows:[],selected:null,mode:'select',connectFrom:null,nextId:1,modelName:'Demo three-process model'};
  state.nodes=[{id:'n1',type:'stock',name:'S1',x:80,y:150,start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}},{id:'n2',type:'process',name:'P1',x:260,y:150},{id:'n3',type:'process',name:'P2',x:440,y:150},{id:'n4',type:'process',name:'P3',x:620,y:150},{id:'n5',type:'stock',name:'S2',x:800,y:150,start:{type:'fixed',value:0,unc:0},end:{type:'fixed',value:0,unc:0}}];
  state.flows=[
    {id:'f1',name:'F1',from:'n1',to:'n2',type:'measured',value:100,uncertainty:10,unit:'t/a',tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f2',name:'F2',from:'n2',to:'n3',type:'unmeasured',value:0,uncertainty:0.1,unit:'t/a',tcEnabled:true,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f3',name:'F3',from:'n3',to:'n4',type:'measured',value:160,uncertainty:16,unit:'t/a',tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f4',name:'F4',from:'n4',to:'n5',type:'unmeasured',value:0,uncertainty:0.1,unit:'t/a',tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05}];
  state.nextId=6;document.getElementById('modelName').value=state.modelName;render();renderPanel();save();
};
if(!loadSaved()){document.getElementById('loadDemo').click();}else{render();renderPanel();}
