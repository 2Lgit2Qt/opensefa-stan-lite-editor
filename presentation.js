/* Bereinigte Präsentationserweiterung: deutsche Oberfläche, Lager und zeichenbare Systemgrenze. */
(function () {
 'use strict';

 I18N.de.connect = 'Fluss';
 I18N.de.stock = 'Lager';
 I18N.de.boundary = 'Extern (Systemgrenze überschreiten)';
 I18N.de.trace = 'Meldungen';

 function changed() {
  state.lastResult = null;
  state.lastPayload = null;
  save();
  renderAll();
 }

 function safe(value) {
  return esc(value).replace(/"/g, '&quot;');
 }

 // Systemgrenze als zeichenbares, verschiebbares Rechteck speichern.
 const originalSave = save;
 save = function () {
  originalSave();
  try {
   const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
   raw.boundary = state.boundary || null;
   localStorage.setItem(LS_KEY, JSON.stringify(raw));
  } catch (error) {}
 };

 try {
  const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  if (raw.boundary) state.boundary = raw.boundary;
 } catch (error) {}

 function drawBoundary() {
  const existing = svg.querySelector('.system-boundary');
  if (existing) existing.remove();
  if (!state.boundary) return;
  const b = state.boundary;
  const group = el('g', { class: 'system-boundary' });
  const rect = el('rect', {
   x: b.x, y: b.y, width: b.w, height: b.h,
   fill: 'none', stroke: '#555',
   'stroke-dasharray': '7 5', 'stroke-width': 1.5
  });
  const label = el('text', {
   x: b.x + 8, y: b.y + 18,
   'font-size': '12', fill: '#555'
  });
  label.textContent = 'Systemgrenze';
  group.appendChild(rect);
  group.appendChild(label);
  svg.insertBefore(group, svg.firstChild);
 }

 const originalRender = render;
 render = function () {
  originalRender();
  drawBoundary();
 };

 // Zeichenmodus: Aufziehen mit der Maus; bestehende Grenze wird ersetzt.
 let draft = null;
 svg.addEventListener('pointerdown', function (event) {
  if (state.mode !== 'boundary') return;
  event.preventDefault();
  event.stopPropagation();
  const point = toWorld(event);
  draft = { x0: point.x, y0: point.y };
  state.boundary = { x: point.x, y: point.y, w: 0, h: 0 };
  render();
 }, true);

 svg.addEventListener('pointermove', function (event) {
  if (state.mode !== 'boundary' || !draft) return;
  event.preventDefault();
  event.stopPropagation();
  const point = toWorld(event);
  state.boundary = {
   x: Math.min(draft.x0, point.x),
   y: Math.min(draft.y0, point.y),
   w: Math.abs(point.x - draft.x0),
   h: Math.abs(point.y - draft.y0)
  };
  render();
 }, true);

 svg.addEventListener('pointerup', function () {
  if (state.mode !== 'boundary' || !draft) return;
  draft = null;
  state.mode = 'select';
  setModeButtons();
  save();
  renderAll();
 }, true);

 document.getElementById('tbBoundaryDraw').onclick = function () {
  state.mode = 'boundary';
  setModeButtons();
  document.getElementById('tbBoundaryDraw').style.fontWeight = 'bold';
 };

 document.getElementById('tbBoundaryClear').onclick = function () {
  state.boundary = null;
  changed();
 };

 // Externer Ein-/Ausgang: kein bilanziertes Lager, sondern Schnittstelle zur Umgebung.
 document.getElementById('shBoundary').onclick = function () {
  const name = prompt('Name des externen Ein-/Ausgangs:', 'Anlieferung');
  if (!name || !name.trim()) return;
  addNode('stock');
  const node = getNode(state.sel[0].id);
  node.name = name.trim();
  node.boundary = true;
  node.x = 60;
  node.y = 140;
  changed();
 };

 // Lager: kompakte Kapazität je Schicht, ohne erklärende Textblöcke.
 const originalRenderProps = renderProps;
 renderProps = function () {
  originalRenderProps();
  const selection = state.sel.length === 1 ? state.sel[0] : null;
  if (!selection || selection.kind !== 'node') return;
  const node = getNode(selection.id);
  if (!node || node.type !== 'stock' || node.boundary) return;
  const layer = state.layers.find(function (item) { return item.id === state.activeLayer; });
  if (!layer) return;
  node.capacities = node.capacities || {};
  const field = document.createElement('label');
  field.innerHTML = 'Kapazität (' + safe(layer.dispUnit || layer.unit) + ')<input id="stockCapacity" type="number" min="0" step="any" value="' + (node.capacities[layer.id] == null ? '' : safe(node.capacities[layer.id])) + '">';
  document.getElementById('props').appendChild(field);
  document.getElementById('stockCapacity').onchange = function (event) {
   node.capacities[layer.id] = event.target.value === '' ? null : +event.target.value;
   changed();
  };
 };

 // Altglas-Beispiel laden.
 async function loadDemo() {
  if (!confirm('Das aktuelle Projekt durch das Altglas-Beispiel ersetzen?')) return;
  try {
   const response = await fetch('examples/altglas-demo.json', { cache: 'no-store' });
   if (!response.ok) throw new Error('HTTP ' + response.status);
   const saved = await response.json();
   Object.assign(state, saved);
   state.editPath = [];
   state.sel = [];
   state.trace = [];
   state.expanded = {};
   state.undoStack = [];
   state.redoStack = [];
   state.activeLayer = saved.layers[0].id;
   state.activePeriod = String(saved.periods.start);
   state.lastResult = null;
   state.lastPayload = null;
   state.mode = 'select';
   state.connectFrom = null;
   state.boundary = { x: 170, y: 170, w: 640, h: 180 };
   ui.lang = 'de';
   ui.zoom = 0.8;
   ui.displayMode = 'entered';
   saveUI();
   migrate();
   save();
   renderAll();
   setModeButtons();
  } catch (error) {
   traceMsg('error', 'Beispiel konnte nicht geladen werden: ' + error.message);
  }
 }

 document.getElementById('tbAltglas').onclick = loadDemo;
 document.getElementById('shStock').onclick = function () { addNode('stock'); };
 document.getElementById('shProcess').onclick = function () { addNode('process'); };
 document.getElementById('tbSolve').onclick = doSolve;

 renderAll();
})();
