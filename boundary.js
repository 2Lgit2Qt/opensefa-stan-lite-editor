/* Geometry is authoritative when a document has a system boundary. */
(function(){
'use strict';
function within(n,b){return n.x>b.x&&n.x<b.x+b.w&&n.y>b.y&&n.y<b.y+b.h;}
function external(n,d){return d.systemBoundary?!within(n,d.systemBoundary):!!n.boundary;}
function sync(d){let changed=false;d.nodes.forEach(n=>{if(d.systemBoundary){const value=external(n,d);if(n.boundary!==value){n.boundary=value;changed=true;}}if(n.sub&&sync(n.sub))changed=true;});return changed;}
function update(){if(sync(state.doc)){state.lastResult=null;state.lastPayload=null;} }
const previousSave=save;
save=function(){update();return previousSave.apply(this,arguments);};
let boundarySelected=false,drawing=false;
function styleBoundary(){const group=svg.querySelector('[data-system-boundary]');if(!group)return;const outline=group.firstElementChild;if(!outline)return;outline.setAttribute('stroke',boundarySelected?'#2563eb':'#64748b');Array.from(group.children).slice(1).forEach(handle=>{handle.style.display=boundarySelected?'':'none';});}
const previousRender=render;
render=function(){update();const result=previousRender.apply(this,arguments);styleBoundary();return result;};
// Let the existing handlers perform geometry edits; manage visual selection separately.
svg.addEventListener('mousedown',event=>{if(event.button!==0)return;const target=event.target;const onBoundary=target.closest&&target.closest('[data-system-boundary]');drawing=state.mode==='boundary';boundarySelected=!!onBoundary||drawing;if(!onBoundary&&!drawing)styleBoundary();},true);
window.addEventListener('mouseup',()=>{if(drawing){drawing=false;boundarySelected=false;render();}else styleBoundary();});
window.addEventListener('keydown',event=>{if(event.key==='Escape'){drawing=false;boundarySelected=false;if(state.mode==='boundary'){state.mode='select';setModeButtons();}render();}});
const selectButton=document.getElementById('shSelect');if(selectButton)selectButton.addEventListener('click',()=>{boundarySelected=false;drawing=false;render();});
const previousProps=renderProps;
renderProps=function(){update();previousProps.apply(this,arguments);const checkbox=document.getElementById('boundary');if(checkbox&&D().systemBoundary){checkbox.disabled=true;checkbox.title='Automatisch durch die Systemgrenze bestimmt';}const selected=state.sel.length===1?state.sel[0]:null;if(selected&&selected.kind==='flow'&&state.propTab==='general'){const flow=D().flows.find(f=>f.id===selected.id);if(flow){const text=document.createElement('div');text.textContent='Flusstyp: '+({import:'Einfuhr',export:'Ausfuhr',internal:'Intern',external:'Außerhalb des Systems'}[flowKind(flow)]);document.getElementById('props').appendChild(text);}}};
const previousKind=flowKind;
flowKind=function(f){const d=D();if(!d.systemBoundary)return previousKind(f);const a=d.nodes.find(n=>n.id===f.from),b=d.nodes.find(n=>n.id===f.to);if(!a||!b)return 'external';const ae=external(a,d),be=external(b,d);return ae?(be?'external':'import'):(be?'export':'internal');};
// Adapt only the solver view; never remove or retype nodes in the project.
const previousExport=exportDoc;
exportDoc=function(prefix,doc,periods){sync(doc);if(!doc.systemBoundary)return previousExport(prefix,doc,periods);const active=new Set(doc.nodes.filter(n=>!external(n,doc)).map(n=>n.id));const view=Object.assign({},doc,{nodes:doc.nodes.map(n=>{if(active.has(n.id))return n;return Object.assign({},n,{type:'stock',boundary:true,sub:null});}),flows:doc.flows.filter(f=>active.has(f.from)||active.has(f.to))});return previousExport(prefix,view,periods);};
// Validation operates on the same internal scope as export.
const previousValidate=validateModel;
validateModel=function(){update();const doc=D();if(!doc.systemBoundary)return previousValidate();const savedNodes=doc.nodes,savedFlows=doc.flows;const active=new Set(savedNodes.filter(n=>!external(n,doc)).map(n=>n.id));try{doc.nodes=savedNodes.map(n=>active.has(n.id)?n:Object.assign({},n,{type:'stock',boundary:true,sub:null}));doc.flows=savedFlows.filter(f=>active.has(f.from)||active.has(f.to));return previousValidate();}finally{doc.nodes=savedNodes;doc.flows=savedFlows;}};
const clear=document.getElementById('tbBoundaryClear');if(clear){clear.title='Grenze entfernen; aktuelle interne/externe Zuordnung beibehalten';clear.addEventListener('click',()=>{boundarySelected=false;drawing=false;});}
// Detach the legacy demo action. No example is fetched or loaded by this module.
const demo=document.getElementById('tbAltglas');if(demo){demo.onclick=null;demo.remove();}
renderAll();
})();
