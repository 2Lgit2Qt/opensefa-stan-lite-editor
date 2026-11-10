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
  const bt=el('text',{x:bx0+6,y:by0+14,'font-size':'12',fill:'#555'});bt.textContent=esc(state.modelName)+' \u2014 '+curP();world.appendChild(bt);
  let sumImp=0,sumExp=0,sumD=0;
  d.flows.forEach(f=>{const k=flowKind(f);const v=flowValue(f,state.activeLayer);if(k==='import')sumImp+=v;if(k==='export')sumExp+=v;});
  d.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>{const ld=n.pd[curP()][state.activeLayer];if(ld)sumD+=(ld.end.value||0)-(ld.start.value||0);});
  const layer=state.layers.find(l=>l.id===state.activeLayer);
  const sf=scaleFactor();
  const leg=el('text',{x:bx0+6,y:by1-6,'font-size':'11',fill:'#555'});
  leg.textContent='\u03a3 imports: '+(+(sumImp/sf).toFixed(4))+' | \u03a3 exports: '+(+(sumExp/sf).toFixed(4))+' | \u03a3 stock change: '+(+(sumD/sf).toFixed(4))+(sf!==1?' (scaled by '+esc(state.scaling.unit||'basis')+' / '+sf+')':'');
  world.appendChild(leg);
  const lg=el('text',{x:bx0+6,y:by1-22,'font-size':'11',fill:'#777'});
  lg.textContent='Layer: '+esc(layer?layer.name:'')+' ('+esc(layer?layer.unit:'')+') \u2014 '+(ui.displayMode==='calculated'?'calculated':'entered')+' values'+(ui.unitMode==='display'&&layer?' \u2014 display unit '+esc(layer.dispUnit||''):'')+(state.scaling&&state.scaling.mode!=='none'?' \u2014 scaling: '+esc(state.scaling.unit||'')+' \u00f7 '+sf:'');
  world.appendChild(lg);
 }
 const widths={};
 if(state.weighted){
  const mx2=ui.sankeyMaxWidth||20;
  const vals=d.flows.map(f=>flowValue(f,state.activeLayer));
  const mx=Math.max.apply(null,vals.concat([1e-9]));
  d.flows.forEach((f,i)=>widths[f.id]=2+mx2*vals[i]/mx);
 }
 d.flows.forEach(f=>{
  const a=getNode(f.from),b=getNode(f.to);if(!a||!b)return;
  const p1=anchorPt(a,b),p2=anchorPt(b,a);
  const kind=flowKind(f);
  const col=isSelected('flow',f.id)?'#e67e22':(kind==='import'?'#2563eb':kind==='export'?'#16a34a':'#333');
  let shape;
  if(f.routing==='ortho'){
   const mx=(p1.x+p2.x)/2;
   shape=el('polyline',{points:p1.x+','+p1.y+' '+mx+','+p1.y+' '+mx+','+p2.y+' '+p2.x+','+p2.y,fill:'none',stroke:col,'stroke-width':widths[f.id]||2,'marker-end':'url(#arrow)',class:'flow'});
  }else if(state.weighted){
   const mx2=(p1.x+p2.x)/2;
   const dx=p2.x-p1.x,dy=p2.y-p1.y;
   shape=el('path',{d:'M '+p1.x+' '+p1.y+' Q '+(mx2+dy*0.15)+' '+((p1.y+p2.y)/2-dx*0.05)+' '+p2.x+' '+p2.y,fill:'none',stroke:col,'stroke-width':widths[f.id]||2,'stroke-linecap':'round',class:'flow'});
  }else{
   shape=el('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:col,'stroke-width':widths[f.id]||2,'marker-end':'url(#arrow)',class:'flow'});
  }
  shape.addEventListener('click',e=>{e.stopPropagation();select({kind:'flow',id:f.id},e.ctrlKey||e.metaKey);});
  world.appendChild(shape);
  const dd=f.pd[curP()][state.activeLayer];
  let label=f.name;
  if(dd){const vn=vname(f,state.activeLayer);const v=(ui.displayMode==='calculated'&&state.lastResult&&state.lastResult.variables_value&&state.lastResult.variables_value[vn]!==undefined)?(+state.lastResult.variables_value[vn]).toFixed(2):dd.value;label=f.name+' '+v;}
  const sym=kind==='import'?'\u21d2 ':kind==='export'?'\u21d0 ':'';
  const mid=el('text',{x:(p1.x+p2.x)/2+(f.lx||0),y:(p1.y+p2.y)/2+(f.ly||0)-8,'font-size':'12','text-anchor':'middle',class:'flowlabel'});
  mid.textContent=sym+label;
  mid.addEventListener('mousedown',e=>{e.preventDefault();e.stopPropagation();const sx=e.clientX-(f.lx||0),sy=e.clientY-(f.ly||0);const mv=ev=>{f.lx=ev.clientX-sx;f.ly=ev.clientY-sy;render();};const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);save();};window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);});
  world.appendChild(mid);
 });
 d.nodes.forEach(n=>{
  const g=el('g',{class:'node'+(isSelected('node',n.id)?' selected':''),transform:'translate('+n.x+','+n.y+')'});
  if(n.type==='process')g.appendChild(el('rect',{x:-30,y:-20,width:60,height:40,fill:'#dbeafe',stroke:'#333'}));
  else if(n.type==='subsystem'){g.appendChild(el('rect',{x:-40,y:-25,width:80,height:50,rx:12,fill:'#fef9c3',stroke:'#1d4ed8','stroke-width':2}));}
  else g.appendChild(el('circle',{r:22,fill:n.boundary?'#fee2e2':'#dcfce7',stroke:'#333'}));
  const tx=el('text',{'text-anchor':'middle',dy:'4','font-size':'12'});tx.textContent=(n.noBalance&&(n.type==='process'||n.type==='subsystem'))?'['+captionOf(n)+']':captionOf(n);g.appendChild(tx);
  if((n.type==='process'||n.type==='subsystem')&&!n.noBalance){
   let coarse=0;
   d.flows.forEach(f=>{if(f.to===n.id){const dd=f.pd[curP()][state.activeLayer];if(dd&&(dd.type==='measured'||dd.type==='fixed'))coarse+=(+dd.value||0);}});
   d.flows.forEach(f=>{if(f.from===n.id){const dd=f.pd[curP()][state.activeLayer];if(dd&&(dd.type==='measured'||dd.type==='fixed'))coarse-=(+dd.value||0);}});
   if(Math.abs(coarse)>1e-9){const ct=el('text',{'text-anchor':'middle',dy:'19','font-size':'9',fill:'#b91c1c'});ct.textContent='\u0394 '+(+coarse.toFixed(2));g.appendChild(ct);}
  }
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
function exportSvg(){
 const s=new XMLSerializer().serializeToString(svg);
 const doc='<?xml version="1.0" encoding="UTF-8"?>\n'+s;
 download((state.modelName||'diagram').replace(/\W+/g,'_')+'.svg',doc,'image/svg+xml');
 traceMsg('info','Diagram exported as SVG.');
}
function exportPng(){
 const s=new XMLSerializer().serializeToString(svg);
 const img=new Image();
 img.onload=()=>{
  const cv=document.createElement('canvas');
  cv.width=svg.clientWidth*2;cv.height=svg.clientHeight*2;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.drawImage(img,0,0,cv.width,cv.height);
  cv.toBlob(blob=>{
   const a=document.createElement('a');
   a.href=URL.createObjectURL(blob);
   a.download=(state.modelName||'diagram').replace(/\W+/g,'_')+'.png';
   a.click();
   traceMsg('info','Diagram exported as PNG.');
  },'image/png');
 };
 img.onerror=()=>{traceMsg('warning','PNG export failed (SVG-to-image conversion not supported). Use SVG export instead.');};
 img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s)));
}
function renderCrumb(){
 const c=document.getElementById('crumb');
 if(!state.editPath.length){c.style.display='none';c.innerHTML='';return;}
 let d=state.doc;const names=['System'];
 state.editPath.forEach(id=>{const n=d.nodes.find(x=>x.id===id);names.push(n?n.name:'?');if(n&&n.sub)d=n.sub;});
 c.style.display='block';
 c.innerHTML='<button id="crumbBack">\u25c0 Back</button>'+names.map(n=>esc(n)).join(' / ');
 document.getElementById('crumbBack').onclick=exitSubsystem;
}
function renderExplorer(){
 const ex=document.getElementById('explorer');const d=D();
 let h='<div class="row'+(state.sel.length?'':' sel')+'"><b>'+esc(state.modelName)+'</b></div>';
 d.nodes.forEach(n=>{
  const ins=d.flows.filter(f=>f.to===n.id),outs=d.flows.filter(f=>f.from===n.id);
  const open=state.expanded[n.id];
  h+='<div class="row'+(isSelected('node',n.id)?' sel':'')+'" data-x="node" data-id="'+n.id+'"><span class="arr" data-a="'+n.id+'">'+(open?'\u25be':'\u25b8')+'</span>'+esc(n.name)+' <small>('+n.type+')</small>'+(n.type==='subsystem'?' <span class="arr" data-e="'+n.id+'" title="Edit subsystem">\u2198</span>':'')+'</div>';
  if(open){ins.forEach(f=>{h+='<div class="row sub'+(isSelected('flow',f.id)?' sel':'')+'" data-x="flow" data-id="'+f.id+'">\u2190 '+esc(f.name)+'</div>';});outs.forEach(f=>{h+='<div class="row sub'+(isSelected('flow',f.id)?' sel':'')+'" data-x="flow" data-id="'+f.id+'">\u2192 '+esc(f.name)+'</div>';});}
 });
 d.texts.forEach(x=>{h+='<div class="row'+(isSelected('text',x.id)?' sel':'')+'" data-x="text" data-id="'+x.id+'">\ud83d\udcdd '+esc(x.text)+'</div>';});
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
 const ls=document.getElementById('layerSelect');ls.innerHTML=state.layers.map(l=>'<option value="'+l.id+'"'+(l.id===state.activeLayer?' selected':'')+'>'+esc(l.name)+(l.calc===false?' (no calc)':'')+'</option>').join('');
 const ps=document.getElementById('periodSelect');if(ps)ps.innerHTML=periodList().map(p=>'<option value="'+p+'"'+(p===state.activePeriod?' selected':'')+'>'+p+'</option>').join('');
 document.getElementById('tbSankey').textContent=t('sankey')+(state.weighted?': on':': off');
 document.getElementById('tbDisplay').textContent=t(ui.displayMode==='entered'?'entered':'calculated');
 document.getElementById('tbUnitsMode').textContent='Units: '+(ui.unitMode==='entered'?'entered':'display');
 document.getElementById('tbGrid').style.fontWeight=ui.grid?'bold':'normal';
 document.getElementById('tbSnap').style.fontWeight=ui.snap?'bold':'normal';
 document.getElementById('miCaption').textContent='Caption: '+ui.captionType;
 document.getElementById('miSubgoods').textContent='Use subgood layers: '+(state.subgoods?'on':'off');
}
