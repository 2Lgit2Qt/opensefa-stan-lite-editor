const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('canvas');
let state={nodes:[],flows:[],selected:null,mode:'select',connectFrom:null,nextId:1};

function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}

function addNode(type){
  const n={id:'n'+state.nextId++,type,name:(type==='process'?'P':'S')+(state.nextId-1),x:150+Math.random()*300,y:120+Math.random()*200};
  state.nodes.push(n);select({kind:'node',id:n.id});render();
}

function addFlow(from,to){
  if(from===to)return;
  const f={id:'f'+state.nextId++,name:'F'+(state.flows.length+1),from,to,type:'unmeasured',value:0,uncertainty:0.1,tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05};
  state.flows.push(f);select({kind:'flow',id:f.id});render();
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
    else g.appendChild(el('circle',{r:22,fill:'#dcfce7',stroke:'#333'}));
    const t=el('text',{'text-anchor':'middle',dy:'4','font-size':'12'});t.textContent=n.name;g.appendChild(t);
    g.addEventListener('mousedown',e=>{e.preventDefault();if(state.mode==='connect'){if(!state.connectFrom){state.connectFrom=n.id;}else{addFlow(state.connectFrom,n.id);state.connectFrom=null;state.mode='select';}return;}const sx=e.clientX-n.x,sy=e.clientY-n.y;const move=ev=>{n.x=ev.clientX-sx;n.y=ev.clientY-sy;render();};const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);select({kind:'node',id:n.id});};window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);});
    svg.appendChild(g);
  });
}

function renderPanel(){
  const p=document.getElementById('props');p.innerHTML='';
  if(!state.selected){p.innerHTML='<p>Select a node or flow.</p>';return;}
  if(state.selected.kind==='node'){
    const n=getNode(state.selected.id);
    const outs=state.flows.filter(f=>f.from===n.id);
    let html=`<label>Name<input id="pName" value="${n.name}"></label><p>Type: ${n.type}</p>`;
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
    document.getElementById('pName').oninput=e=>{n.name=e.target.value;render();};
    outs.forEach(f=>{
      document.getElementById('tc_'+f.id).onchange=e=>{f.tcEnabled=e.target.checked;render();renderPanel();};
      document.getElementById('tct_'+f.id).onchange=e=>f.tcType=e.target.value;
      document.getElementById('tcv_'+f.id).oninput=e=>f.tcValue=+e.target.value;
      document.getElementById('tcu_'+f.id).oninput=e=>f.tcUnc=+e.target.value;
    });
  }else{
    const f=state.flows.find(x=>x.id===state.selected.id);
    p.innerHTML=`<label>Name<input id="fName" value="${f.name}"></label>
      <label>Type<select id="fType"><option${f.type==='measured'?' selected':''}>measured</option><option${f.type==='unmeasured'?' selected':''}>unmeasured</option><option${f.type==='fixed'?' selected':''}>fixed</option></select></label>
      <label>Value<input id="fValue" type="number" value="${f.value}"></label>
      <label>Uncertainty<input id="fUnc" type="number" step="0.01" value="${f.uncertainty}"></label>
      <p>${getNode(f.from).name} → ${getNode(f.to).name}</p>`;
    document.getElementById('fName').oninput=e=>{f.name=e.target.value;render();};
    document.getElementById('fType').onchange=e=>{f.type=e.target.value;render();};
    document.getElementById('fValue').oninput=e=>f.value=+e.target.value;
    document.getElementById('fUnc').oninput=e=>f.uncertainty=+e.target.value;
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
    const v={name:tcName(f),is_transfer_coefficient:true};
    if(f.tcType==='measured'){v.type='MeasuredVariable';v.value=f.tcValue;v.uncertainty=f.tcUnc;}
    else if(f.tcType==='fixed'){v.type='FixedVariable';v.value=f.tcValue;}
    else v.type='UnmeasuredVariable';
    variables.push(v);
  });
  const equations=[];
  state.nodes.filter(n=>n.type==='process').forEach(n=>{
    const linear_terms=[];
    state.flows.forEach(f=>{
      if(f.to===n.id)linear_terms.push({name:f.name,factor:1});
      if(f.from===n.id)linear_terms.push({name:f.name,factor:-1});
    });
    equations.push({constant_term:{value:0},linear_terms,bilinear_terms:[]});
    const inputs=state.flows.filter(f=>f.to===n.id);
    state.flows.filter(f=>f.from===n.id&&f.tcEnabled).forEach(f=>{
      equations.push({
        constant_term:{value:0},
        linear_terms:[{name:f.name,factor:1}],
        bilinear_terms:inputs.map(i=>({name1:tcName(f),name2:i.name,factor:-1}))
      });
    });
  });
  return {content:{name:'SEFMN model',variables,equations,solver:'JuMP'}};
}

document.getElementById('addProcess').onclick=()=>addNode('process');
document.getElementById('addStock').onclick=()=>addNode('stock');
document.getElementById('connectMode').onclick=()=>{state.mode='connect';state.connectFrom=null;};
document.getElementById('deleteSel').onclick=()=>{if(!state.selected)return;if(state.selected.kind==='node'){state.flows=state.flows.filter(f=>f.from!==state.selected.id&&f.to!==state.selected.id);state.nodes=state.nodes.filter(n=>n.id!==state.selected.id);}else state.flows=state.flows.filter(f=>f.id!==state.selected.id);state.selected=null;render();renderPanel();};
document.getElementById('exportJson').onclick=()=>{document.getElementById('output').textContent=JSON.stringify(exportModel(),null,2);};
document.getElementById('solve').onclick=async()=>{
  const url=document.getElementById('solverUrl').value;
  document.getElementById('output').textContent='Solving…';
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exportModel())});document.getElementById('output').textContent=JSON.stringify(await r.json(),null,2);}
  catch(e){document.getElementById('output').textContent='Error: '+e.message+'\n\nIf this is a CORS error, serve this page via: python -m http.server 8000';}
};
document.getElementById('loadDemo').onclick=()=>{
  state={nodes:[],flows:[],selected:null,mode:'select',connectFrom:null,nextId:1};
  const s1={id:'n1',type:'stock',name:'S1',x:80,y:150},p1={id:'n2',type:'process',name:'P1',x:260,y:150},p2={id:'n3',type:'process',name:'P2',x:440,y:150},p3={id:'n4',type:'process',name:'P3',x:620,y:150},s2={id:'n5',type:'stock',name:'S2',x:800,y:150};
  state.nodes=[s1,p1,p2,p3,s2];
  state.flows=[
    {id:'f1',name:'F1',from:'n1',to:'n2',type:'measured',value:100,uncertainty:10,tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f2',name:'F2',from:'n2',to:'n3',type:'unmeasured',value:0,uncertainty:0.1,tcEnabled:true,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f3',name:'F3',from:'n3',to:'n4',type:'measured',value:160,uncertainty:16,tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05},
    {id:'f4',name:'F4',from:'n4',to:'n5',type:'unmeasured',value:0,uncertainty:0.1,tcEnabled:false,tcType:'measured',tcValue:0.5,tcUnc:0.05}];
  state.nextId=6;render();renderPanel();
};
render();renderPanel();
