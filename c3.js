function dataEditor(v,p){return '<label>'+t('type')+'<select id="'+p+'_type"><option'+(v.type==='measured'?' selected':'')+'>'+t('measured')+'</option><option'+(v.type==='unmeasured'?' selected':'')+'>'+t('unmeasured')+'</option><option'+(v.type==='fixed'?' selected':'')+'>'+t('fixed')+'</option></select></label><label>'+t('value')+'<input id="'+p+'_value" type="number" value="'+v.value+'"></label><label>'+t('uncertainty')+'<input id="'+p+'_unc" type="number" step="0.01" value="'+v.unc+'"></label><label>'+t('uncertainty')+' %<input id="'+p+'_pct" type="number" step="0.1" value="'+(v.value?(v.unc/Math.abs(v.value)*100).toFixed(2):'0')+'"></label>';}
function bindDataEditor(v,p,after){
 document.getElementById(p+'_type').onchange=e=>{v.type=e.target.value;save();if(after)after();};
 document.getElementById(p+'_value').oninput=e=>{v.value=+e.target.value;save();document.getElementById(p+'_pct').value=v.value?(v.unc/Math.abs(v.value)*100).toFixed(2):'0';if(after)after();};
 document.getElementById(p+'_unc').oninput=e=>{v.unc=+e.target.value;save();document.getElementById(p+'_pct').value=v.value?(v.unc/Math.abs(v.value)*100).toFixed(2):'0';if(after)after();};
 document.getElementById(p+'_pct').oninput=e=>{const pct=+e.target.value;v.unc=Math.abs(v.value||0)*pct/100;save();document.getElementById(p+'_unc').value=(+v.unc.toFixed(4));if(after)after();};
}
function refOptions(cur){return state.refs.map(r=>'<option'+(r===cur?' selected':'')+'>'+esc(r)+'</option>').join('');}
function refEditor(d,p){return '<label>Literature reference<select id="'+p+'_ref"><option value="">\u2014</option>'+refOptions(d.ref)+'</select> <button id="'+p+'_refNew" type="button">+</button></label><label>'+t('remarks')+'<textarea id="'+p+'_rem">'+esc(d.rem||'')+'</textarea></label>';}
function bindRefEditor(d,p){
 document.getElementById(p+'_ref').onchange=e=>{d.ref=e.target.value;save();};
 document.getElementById(p+'_refNew').onclick=()=>{const r=prompt('New literature reference:');if(r&&r.trim()){state.refs.push(r.trim());d.ref=r.trim();save();renderProps();}};
 document.getElementById(p+'_rem').oninput=e=>{d.rem=e.target.value;save();};
}
function unitOptions(sel){return Object.keys(state.units.mass).concat(Object.keys(state.units.volume),Object.keys(state.units.energy),Object.keys(state.units.time)).map(u=>'<option'+(u===sel?' selected':'')+'>'+u+'</option>').join('');}
function renderProps(){
 const tabs=document.getElementById('propTabs');const body=document.getElementById('props');
 const sel0=state.sel.length===1?state.sel[0]:null;
 let tabList;
 if(!sel0)tabList=['system','worksheet'];
 else tabList=['general','values'];
 if(!tabList.includes(state.propTab))state.propTab=tabList[0];
 tabs.innerHTML=tabList.map(x=>'<button data-tab="'+x+'"'+(x===state.propTab?' class="active"':'')+'>'+t(x)+'</button>').join('');
 tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.propTab=b.dataset.tab;renderProps();});
 const L=state.activeLayer;const layer=state.layers.find(l=>l.id===L);
 if(!sel0){
  if(state.propTab==='system'){
   body.innerHTML='<label>'+t('model')+'<input id="pModel" value="'+esc(state.modelName)+'"></label><label>'+t('period')+'<input id="pPeriod" value="'+esc(state.periods.start)+'" type="number"></label><button id="pSolve">'+t('solve')+' (F5)</button><p>Period record: '+periodList()[0]+'\u2013'+periodList()[periodList().length-1]+' ('+state.periods.count+' \u00d7 1 year). Edit via Edit \u2192 Layers and periods\u2026</p><div id="resultTable"></div><pre id="output"></pre>';
   document.getElementById('pModel').oninput=e=>{state.modelName=e.target.value;save();renderExplorer();render();};
   document.getElementById('pSolve').onclick=doSolve;
   if(state.lastResult)fillResult(state.lastResult);
  }else{
   const w=state.worksheet;const fields=[['question','Research question'],['spatial','Spatial boundary'],['period','Reference period'],['quantities','Tracked goods, substances, energy'],['sources','Data sources and assumptions'],['interpretation','Interpretation and optimization potential']];
   body.innerHTML=fields.map(f=>'<label>'+f[1]+'<textarea id="ws_'+f[0]+'">'+esc(w[f[0]])+'</textarea></label>').join('')+'<button id="wsExport">Export worksheet (Markdown)</button>';
   fields.forEach(f=>{document.getElementById('ws_'+f[0]).oninput=e=>{state.worksheet[f[0]]=e.target.value;save();};});
   document.getElementById('wsExport').onclick=exportWorksheet;
  }
  return;
 }
 if(sel0.kind==='text'){
  const x=D().texts.find(y=>y.id===sel0.id);if(!x)return;
  body.innerHTML='<label>Text<input id="txText" value="'+esc(x.text)+'"></label>';
  document.getElementById('txText').oninput=e=>{x.text=e.target.value;save();render();renderExplorer();};
  return;
 }
 if(sel0.kind==='node'){
  const n=getNode(sel0.id);if(!n)return;
  if(state.propTab==='general'){
   let h='<label>'+t('name')+'<input id="pName" value="'+esc(n.name)+'"></label><label>'+t('short')+'<input id="pShort" value="'+esc(n.short||'')+'"></label><p>'+t('process')+': '+n.type+'</p>';
   if(n.type==='stock')h+='<label><input type="checkbox" id="boundary" '+(n.boundary?'checked':'')+'>'+t('boundary')+'</label>';
   if(n.type==='subsystem')h+='<p>Subsystem with own internal model. Double-click to edit (up to six levels).</p><button id="pEnter">Edit subsystem</button>';
   if(n.type==='process'||n.type==='subsystem')h+='<label><input type="checkbox" id="noBal" '+(n.noBalance?'checked':'')+'>Exclude from balancing (layer of goods)</label>';
   h+='<label>'+t('remarks')+'<textarea id="pRem">'+esc(n.remarks||'')+'</textarea></label>';
   body.innerHTML=h;
   document.getElementById('pName').oninput=e=>{n.name=e.target.value;save();render();renderExplorer();};
   document.getElementById('pShort').oninput=e=>{n.short=e.target.value;save();render();};
   document.getElementById('pRem').oninput=e=>{n.remarks=e.target.value;save();};
   if(n.type==='stock')document.getElementById('boundary').onchange=e=>{n.boundary=e.target.checked;save();render();};
   if(n.type==='subsystem')document.getElementById('pEnter').onclick=()=>enterSubsystem(n.id);
   if(n.type==='process'||n.type==='subsystem')document.getElementById('noBal').onchange=e=>{n.noBalance=e.target.checked;save();render();};
  }else{
   const pd=n.pd?n.pd[curP()][L]:null;
   let h='<h4>'+esc(n.name)+' \u2014 '+esc(layer.name)+' \u2014 '+curP()+'</h4>';
   if(n.type==='stock'&&pd){h+='<h5>'+t('start')+'</h5>'+dataEditor(pd.start,'st')+refEditor(pd.start,'st')+'<h5>'+t('end')+'</h5>'+dataEditor(pd.end,'en')+refEditor(pd.end,'en');}
   if(n.type==='process'){const outs=D().flows.filter(f=>f.from===n.id);h+='<h5>'+t('tc')+' (shared across periods)</h5>';if(!outs.length)h+='<p>\u2014</p>';outs.forEach(f=>{const tc=f.tc[L];h+='<h6>'+esc(f.name)+'</h6><label><input type="checkbox" id="tc_'+f.id+'" '+(tc.enabled?'checked':'')+'> TC</label><div id="tcbox_'+f.id+'" style="display:'+(tc.enabled?'block':'none')+'">'+dataEditor(tc,'tc'+f.id)+'</div>';});}
   body.innerHTML=h;
   if(n.type==='stock'&&pd){['st','en'].forEach((k,i)=>{const key=i?'end':'start';bindDataEditor(pd[key],k,render);bindRefEditor(pd[key],k);});}
   if(n.type==='process')D().flows.filter(f=>f.from===n.id).forEach(f=>{const tc=f.tc[L];document.getElementById('tc_'+f.id).onchange=e=>{tc.enabled=e.target.checked;save();renderProps();render();};if(document.getElementById('tc'+f.id+'_type'))bindDataEditor(tc,'tc'+f.id);});
  }
 }else{
  const f=D().flows.find(x=>x.id===sel0.id);if(!f)return;
  const dd=f.pd[curP()][L];
  if(state.propTab==='general'){
   const kind=flowKind(f);
   body.innerHTML='<label>'+t('name')+'<input id="fName" value="'+esc(f.name)+'"></label><p>'+(getNode(f.from)?esc(getNode(f.from).name):'?')+' \u2192 '+(getNode(f.to)?esc(getNode(f.to).name):'?')+'</p><p>Flow type: <b>'+kind+'</b></p><label>'+t('routing')+'<select id="fRouting"><option'+(f.routing==='straight'?' selected':'')+'>straight</option><option'+(f.routing==='ortho'?' selected':'')+'>ortho</option></select></label>';
   document.getElementById('fName').oninput=e=>{f.name=e.target.value;save();render();renderExplorer();};
   document.getElementById('fRouting').onchange=e=>{f.routing=e.target.value;save();render();};
  }else{
   let h=dataEditor(dd,'d')+refEditor(dd,'d')+'<label>'+t('unit')+'<input id="d_unit" value="'+esc(dd.unit||'')+'"></label><label>Convert: <select id="convFrom">'+unitOptions(dd.unit)+'</select> \u2192 <select id="convTo">'+unitOptions(dd.unit)+'</select></label><button id="convertBtn">Convert value + uncertainty</button>';
   if(layer.kind==='goods'){
    const vv=f.pd[curP()].vol;const dn=f.pd[curP()].dens;
    h+='<h5>Volume flow (goods)</h5>'+dataEditor(vv,'vol');
    h+='<h5>Density (goods)</h5>'+dataEditor(dn,'dens');
    h+='<p>Exported equation: mass flow = volume flow \u00d7 density.</p>';
   }else if(layer.kind==='substance'||layer.kind==='energy'){
    const c=f.pd[curP()].conc;
    h+='<h5>'+t('conc')+' \u2014 '+esc(layer.name)+', '+curP()+'</h5>';
    h+='<label><input type="checkbox" id="c_en" '+(c.enabled?'checked':'')+'> Use concentration for this period</label><div id="cbox" style="display:'+(c.enabled?'block':'none')+'">'+dataEditor(c,'c')+'</div>';
    h+='<p>Exported equation: '+esc(layer.name)+' flow = concentration \u00d7 goods flow.</p>';
   }
   body.innerHTML=h;
   bindDataEditor(dd,'d',render);
   bindRefEditor(dd,'d');
   document.getElementById('d_unit').oninput=e=>{dd.unit=e.target.value;save();};
   document.getElementById('convertBtn').onclick=()=>{const from=document.getElementById('convFrom').value,to=document.getElementById('convTo').value;const fam=Object.keys(state.units).find(k=>state.units[k][from]!==undefined&&state.units[k][to]!==undefined);if(!fam){alert('Incompatible units.');return;}const k=state.units[fam][from]/state.units[fam][to];dd.value=dd.value*k;dd.unc=dd.unc*k;dd.unit=to;save();renderProps();render();};
   if(layer.kind==='goods'){bindDataEditor(f.pd[curP()].vol,'vol');bindDataEditor(f.pd[curP()].dens,'dens');}
   else if(layer.kind==='substance'||layer.kind==='energy'){const c=f.pd[curP()].conc;document.getElementById('c_en').onchange=e=>{c.enabled=e.target.checked;save();renderProps();};if(document.getElementById('c_type'))bindDataEditor(c,'c');}
  }
 }
}
function traceMsg(level,msg,ref){
 const tl=(typeof calcOpts!=='undefined'&&calcOpts&&calcOpts.traceLevel)||'information';
 if(tl==='none')return;
 if(tl==='errors'&&level!=='error')return;
 if(tl==='warnings'&&level==='info')return;
 state.trace.push({level,msg,ref:ref||null});renderTrace();
}
function renderTrace(){
 const tl=document.getElementById('traceList');
 tl.innerHTML=state.trace.map((m,i)=>'<p class="'+(m.ref?'cl':'')+'" data-i="'+i+'" style="color:'+(m.level==='error'?'#b91c1c':m.level==='warning'?'#b45309':'#1d4ed8')+'">['+m.level.toUpperCase()+'] '+esc(m.msg)+'</p>').join('')||'<p>No messages.</p>';
 tl.querySelectorAll('p.cl').forEach(p=>p.onclick=()=>{const m=state.trace[+p.dataset.i];if(m&&m.ref)select(m.ref);});
}
function renderAll(){renderStatic();render();renderExplorer();renderProps();renderTrace();}
function setModeButtons(){document.getElementById('shSelect').style.fontWeight=state.mode==='select'?'bold':'normal';document.getElementById('shConnect').style.fontWeight=state.mode==='connect'?'bold':'normal';}
