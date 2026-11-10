function exportDoc(prefix,doc,plOverride){
 const variables=[];const equations=[];
 const pl=(plOverride&&plOverride.length)?plOverride:periodList();
 const layers=state.layers.filter(l=>l.calc!==false);
 const goodsL=layers.find(l=>l.kind==='goods');
 const vn=(f,l,p)=>prefix+f.name+'__'+l+'__'+p;
 const tn=(f,l)=>prefix+f.name+'_tc__'+l;
 doc.flows.forEach(f=>pl.forEach(p=>layers.forEach(l=>{
  variables.push(varObj(f.pd[p][l.id],vn(f,l.id,p)));
 })));
 doc.flows.forEach(f=>layers.forEach(l=>{if(f.tc[l.id]&&f.tc[l.id].enabled)variables.push(varObj(f.tc[l.id],tn(f,l.id),true));}));
 doc.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>pl.forEach(p=>layers.forEach(l=>{
  variables.push(varObj(n.pd[p][l.id].start,prefix+n.name+'_start__'+l.id+'__'+p));
  variables.push(varObj(n.pd[p][l.id].end,prefix+n.name+'_end__'+l.id+'__'+p));
 })));
 doc.nodes.forEach(n=>{
  const ins=doc.flows.filter(f=>f.to===n.id),outs=doc.flows.filter(f=>f.from===n.id);
  pl.forEach(p=>layers.forEach(l=>{
   if((n.type==='process'||n.type==='subsystem')&&!(n.noBalance&&goodsL&&l.id===goodsL.id)){
    const lt=[];ins.forEach(f=>lt.push({name:vn(f,l.id,p),factor:1}));outs.forEach(f=>lt.push({name:vn(f,l.id,p),factor:-1}));
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
    outs.filter(f=>f.tc[l.id]&&f.tc[l.id].enabled).forEach(f=>{
     equations.push({constant_term:{value:0},linear_terms:[{name:vn(f,l.id,p),factor:1}],bilinear_terms:ins.map(i=>({name1:tn(f,l.id),name2:vn(i,l.id,p),factor:-1}))});
    });
   }
   if(n.type==='stock'&&!n.boundary){
    const lt=[];ins.forEach(f=>lt.push({name:vn(f,l.id,p),factor:1}));outs.forEach(f=>lt.push({name:vn(f,l.id,p),factor:-1}));
    lt.push({name:prefix+n.name+'_end__'+l.id+'__'+p,factor:-1});lt.push({name:prefix+n.name+'_start__'+l.id+'__'+p,factor:1});
    equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
   }
  }));
  if(n.type==='subsystem'&&n.sub&&n.sub.nodes.length){
   const inner=exportDoc(prefix+n.name+'.',n.sub,plOverride);
   inner.variables.forEach(v=>variables.push(v));
   inner.equations.forEach(eq=>equations.push(eq));
  }
 });
 doc.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>{
  for(let i=0;i+1<pl.length;i++)layers.forEach(l=>{
   equations.push({constant_term:{value:0},linear_terms:[{name:prefix+n.name+'_start__'+l.id+'__'+pl[i+1],factor:1},{name:prefix+n.name+'_end__'+l.id+'__'+pl[i],factor:-1}],bilinear_terms:[]});
  });
 });
 if(state.subgoods){
  const subgoods=layers.filter(l=>l.kind==='subgood');
  const goods=layers.find(l=>l.kind==='goods');
  if(subgoods.length&&goods)doc.flows.forEach(f=>pl.forEach(p=>{
   const lt=[{name:vn(f,goods.id,p),factor:-1}];subgoods.forEach(s=>lt.push({name:vn(f,s.id,p),factor:1}));
   equations.push({constant_term:{value:0},linear_terms:lt,bilinear_terms:[]});
  }));
 }
 if(goodsL){doc.flows.forEach(f=>pl.forEach(p=>{
  const vv=f.pd[p]&&f.pd[p].vol;const dn=f.pd[p]&&f.pd[p].dens;
  if(vv&&dn&&((vv.type&&vv.type!=='unmeasured')||(dn.type&&dn.type!=='unmeasured'))){
   variables.push(varObj(vv,prefix+f.name+'_vol__'+p));
   variables.push(varObj(dn,prefix+f.name+'_dens__'+p));
   equations.push({constant_term:{value:0},linear_terms:[{name:vn(f,goodsL.id,p),factor:1}],bilinear_terms:[{name1:prefix+f.name+'_vol__'+p,name2:prefix+f.name+'_dens__'+p,factor:-1}]});
  }
 }));}
 layers.forEach(sl=>{
  if((sl.kind==='substance'||sl.kind==='energy')&&goodsL){
   doc.flows.forEach(f=>pl.forEach(p=>{
    const c=f.pd[p]&&f.pd[p].conc;
    if(c&&c.enabled){
     const cn=prefix+f.name+'_conc__'+sl.id+'__'+p;
     variables.push(varObj(c,cn));
     equations.push({constant_term:{value:0},linear_terms:[{name:vn(f,sl.id,p),factor:1}],bilinear_terms:[{name1:cn,name2:vn(f,goodsL.id,p),factor:-1}]});
    }
   }));
  }
 });
 return {variables,equations};
}
function exportModel(cps){const pl=(cps&&cps.length)?cps:periodList();const r=exportDoc('',state.doc,pl);return {content:{name:state.modelName,periods:{start:state.periods.start,count:state.periods.count,list:pl},variables:r.variables,equations:r.equations,solver:'JuMP'}};}
function validateModel(){
 const msgs=[];let eqCount=0;const unknowns=new Set();const d=D();const pl=periodList();const layers=state.layers.filter(l=>l.calc!==false);
 d.flows.forEach(f=>pl.forEach(p=>layers.forEach(l=>{
  unknowns.add(vname(f,l.id,p));
  const dd=f.pd[p][l.id];
  if(!Number.isFinite(+dd.value))msgs.push({level:'error',msg:f.name+' ('+l.id+','+p+'): value is not a number.',ref:{kind:'flow',id:f.id}});
  if(dd.type==='measured'&&!(+dd.unc>0))msgs.push({level:'error',msg:f.name+' ('+l.id+','+p+'): measured variables need uncertainty > 0.',ref:{kind:'flow',id:f.id}});
 })));
 d.flows.forEach(f=>layers.forEach(l=>{if(f.tc[l.id]&&f.tc[l.id].enabled)unknowns.add(tname(f,l.id));}));
 d.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>pl.forEach(p=>layers.forEach(l=>{unknowns.add(n.name+'_start__'+l.id+'__'+p);unknowns.add(n.name+'_end__'+l.id+'__'+p);})))  ;
 d.nodes.forEach(n=>{
  const ins=d.flows.filter(f=>f.to===n.id),outs=d.flows.filter(f=>f.from===n.id);
  pl.forEach(p=>layers.forEach(l=>{
   if((n.type==='process'||n.type==='subsystem')&&!(n.noBalance)){eqCount++;
    outs.filter(f=>f.tc[l.id]&&f.tc[l.id].enabled).forEach(f=>{eqCount++;
     if(!ins.length)msgs.push({level:'error',msg:f.name+': transfer coefficient needs at least one input flow.',ref:{kind:'flow',id:f.id}});
     if(ins.length===1&&outs.length===1)msgs.push({level:'warning',msg:f.name+': TC with one input and one output over-constrains the balance; add a loss/split outlet.',ref:{kind:'flow',id:f.id}});
    });
   }
   if(n.type==='stock'&&!n.boundary)eqCount++;
  }));
 });
 if(state.subgoods){const sg=layers.filter(l=>l.kind==='subgood').length;const g=layers.find(l=>l.kind==='goods');if(sg&&g)eqCount+=d.flows.length*pl.length;}
 d.nodes.filter(n=>n.type==='stock'&&!n.boundary).forEach(n=>{eqCount+=(pl.length-1)*layers.length;});
 msgs.push({level:'info',msg:'Preliminary count: '+eqCount+' equations, '+unknowns.size+' variables, '+pl.length+' period(s). This does not prove observability, redundancy, or feasibility.'});
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
 if(need.some(n=>idx(n)<0))return traceMsg('error','CSV needs columns: name,layer,type,value,uncertainty,unit (period optional).');
 let applied=0,skipped=0;const d=D();
 rows.slice(1).forEach(r=>{
  const name=r[idx('name')].trim(),layer=r[idx('layer')].trim();
  const p=idx('period')>=0?r[idx('period')].trim():curP();
  const f=d.flows.find(x=>x.name===name);
  if(!f||!f.pd[p]||!f.pd[p][layer]){skipped++;traceMsg('warning','Skipped '+name+' ('+layer+','+p+').');return;}
  const dd=f.pd[p][layer];dd.type=r[idx('type')].trim();dd.value=+r[idx('value')];dd.unc=+r[idx('uncertainty')];dd.unit=r[idx('unit')].trim();applied++;
 });
 traceMsg('info','CSV import: '+applied+' values applied, '+skipped+' skipped.');
 save();render();renderProps();
}
