# STAN 2.8 Parity Roadmap — OpenSEFA STAN-lite Editor

Comprehensive gap analysis of the OpenSEFA STAN-lite Editor against the STAN 2.8 User Manual (TU Wien, August 2026). Goal: a STAN-experienced user can work with the prototype natively, without relearning anything.

Design principles

- Use STAN terminology throughout the UI: process, stock, flow, transfer coefficient (TC), goods, substance, subgood, energy, layer, period, system boundary, import, export.
- Mirror STAN keyboard shortcuts where possible: F5 calculate, Ctrl+D Data Explorer, Ctrl+F find, Ctrl+S save, Ctrl+N new, Ctrl+O open, Ctrl+Z/Ctrl+Y undo/redo, Del delete.
- German and English UI language, selectable, defaulting to system setting (STAN behavior).
- Every value can be entered with a unit directly behind the number (e.g. 100 kg/a) and with a standard uncertainty after the ± sign (e.g. 100 ± 10 kg/a).

Acceptance criterion

A person fluent in STAN 2.8 can build a complete MFA/SFA model, enter data, calculate, and interpret results in the prototype without consulting different documentation — the workflow, terms, and dialogs map one-to-one to the STAN 2.8 manual.

## Already implemented

- Processes with and without stock; boundary and internal stocks; balance nodes (subsystem-lite)
- Directed flows: measured, unmeasured, fixed; values, uncertainties, units
- Layers (goods, substance, energy) with per-layer flow data
- Transfer coefficients as bilinear equations
- Concentration links between primary and secondary layer
- Stock-change balances for internal stocks
- Data reconciliation via OpenSEFA.jl (/solve); result table with Δ/σ
- Preliminary structural check (equation/variable count, TC sanity)
- CSV import (flow updates by name + layer); mass/energy unit conversion (value + uncertainty)
- Weighted-flow view; autosave; project save/open; solver JSON export
- Project worksheet (research question, boundary, period, sources, interpretation)

## M1 — Workspaces and GUI conventions

- [ ] Menu bar and toolbars with STAN grouping: STANDARD, DIAGRAM, DATA INPUT, SANKEY, INTERNET
- [ ] Dockable, floatable, hideable windows; draggable borders (partially present)
- [ ] Model Explorer: hierarchical tree of processes, flows, subsystems; synchronized selection with drawing area and properties window; context menus
- [ ] Shapes window: selection mode; insert modes for process, system boundary, legend, text field, import flow, export flow, internal flow
- [ ] Properties window with STAN tabs per object type: System, Process, Flow, Text Field
- [ ] Trace Output window: message grid with group-by, click message to highlight object, clear-all
- [ ] Drawing area: rulers, dynamic resizing, zoom factor (Ctrl+F11/Ctrl+F12), grid toggle, snap to grid
- [ ] Undo/redo of object shifting and resizing (Ctrl+Z / Ctrl+Y)
- [ ] Multi-select (Ctrl+click and rubber-band frame), copy/paste/delete of objects
- [ ] Find objects (Ctrl+F) with search over fields and elements; highlight in diagram
- [ ] German/English language setting; diagram and object fonts

## M2 — Model building

- [ ] Process shapes: draw by drag, predefined size on click, resize via handles, minimum size, anchor points on border grid, process color, default sizes
- [ ] Process captions: short symbol and/or name; remarks per process
- [ ] Process types: with stock, without stock, subsystem (checkbox semantics as in STAN)
- [ ] True subsystems: double-click opens own drawing area; import/export flows pre-exist and cannot be deleted on subsystem level; up to six hierarchy levels; blue border display
- [ ] Flows: internal, import, export as distinct types with STAN symbols; auto-connection to nearest free anchor point; dashed display when not connected to two processes; single-connected internal flow treated as import/export during calculation
- [ ] Flow routing: straight, rectangular with inflection points; move parallel; change course and style
- [ ] Flow labels and ovals: resizable labels, movable, alignment options, oval position (first/middle/last segment, offset)
- [ ] System boundary: insert/refresh, select, resize, move, delete; label with system name and period; automatic text fields for Σ imports, Σ exports, Σ stock change; processes must be fully inside or outside; no splitting flows (require splitting process)
- [ ] Text fields and legend object (units, scale basis)
- [ ] Short symbols with automatic indexing on name collisions

## M3 — Layers, materials, periods, units

- [ ] Goods layer always exists; create/delete substance, subgood, and energy layers
- [ ] Define Material dialog: predefined elements table, custom compounds and subgoods (code + name)
- [ ] Subgood mode: subgood layer mass flows must sum to the goods flow per flow
- [ ] Layer selection toolbar; layers selectable for calculation
- [ ] Periods: duration, number, start year; equal-length consecutive record; keep-or-rename warning on changes; per-period data entry; period selection toolbar; periods selectable for calculation
- [ ] Stock equation across periods: stock_i = stock_(i−1) + Δstock_(i−1)
- [ ] Units: define/delete units for mass, volume, energy, time with relation to an existing unit; per-layer display units; entered-vs-display unit toggle in properties; units entered directly behind values

## M4 — Data entry and documentation

- [ ] Goods layer: mass flow, volume flow, and/or density per flow
- [ ] Substance layer: mass flow and/or concentration (per mass or per volume of good)
- [ ] Energy layer: energy flow and/or concentration (per mass or per volume of good)
- [ ] Percent uncertainty entry auto-converted to absolute (e.g. 10 %)
- [ ] TC entry matrix per process: relative to sum of inputs or to a single input; values as 0–1 or percent; uncertainties (e.g. 0.60 − 0.06); question mark to let STAN calculate; TC sum = 1 check per process; TCs only for processes without stock and subsystem
- [ ] Stock/Δstock entry with units and uncertainties; concentration entry on stocks
- [ ] Additional linear relations between flows: flow_x = factor × flow_y, per value type, layer, period
- [ ] Documentation per value: literature reference (dropdown of previously used), remarks; per layer and period
- [ ] Number formatting options: significant digits (dependent on/independent of uncertainty), decimal places, uncertainty in % or absolute, thousands separators, zero threshold, exponential notation thresholds
- [ ] Time series display of a flow (flow graph dialog) for the active layer

## M5 — Data Explorer and exchange

- [ ] Data Explorer (Ctrl+D): editable grid of system, flows, processes, flow values, TCs, stocks, Δstock, concentrations
- [ ] Grouping hierarchy by dragging column headings (default: periods → layers); sorting by column; collapsible groups; reset layout
- [ ] Edit mode toggle; toggle entered input vs. calculated output; entered vs. display units; show/hide volume columns
- [ ] Clipboard integration with Excel: copy/paste blocks; auto-assignment of mixed data types to correct columns
- [ ] Export data to file (csv/txt) with column headings and hidden calculated columns; export process list; flow catalog
- [ ] Validate imported data: syntax check, marked error cells, tooltips

## M6 — Calculation

- [ ] Calculation dialog (Alt+F5): method selection, trace level (none/errors/warnings/information/details), options
- [ ] Quick calculation via F5
- [ ] Select layers and period ranges for calculation
- [ ] Exclude processes from balancing on the goods layer (bracketed name display)
- [ ] Coarse balance of processes (Σ known inputs − Σ known outputs) displayed in process icons before calculation
- [ ] Error propagation for calculated quantities
- [ ] Gross error detection: statistical test whether adjustments are explainable as random errors; 95 % confidence criterion
- [ ] Degree of over-determination (equations without unknowns after transformation)
- [ ] Objective function value display (weighted least squares)
- [ ] Quality of data reconciliation score 0–1
- [ ] Standard score histogram ((measured − reconciled)/standard uncertainty)
- [ ] Display used equations after computation; short variable keys option
- [ ] Automatic scaling toggle to reduce condition number; scaling basis (e.g. 100,000 capita); scale data by reference entity, Σ imports, or Σ exports; scaling disabled with cross-layer relations
- [ ] Changeable random-number start value for initial values; stability check via multiple runs

## M7 — Presentation

- [ ] Sankey display: widths proportional to flow values; slider for relative arrow width; maximum width setting; scope (current/all layers × current/all periods); automatic display-unit harmonization for substance layers in all-layers mode
- [ ] Toggle entered vs. calculated data in the diagram
- [ ] Diagram export (PNG/SVG) with format, resolution, grey-scaling, anti-aliasing options
- [ ] Print preview and print layout
- [ ] Legend with units and scale basis

## M8 — Options, files, and platform behavior

- [ ] Options dialog: Common (language, subgoods, fonts), Processes & Flows (captions, coarse balance, Sankey, anchor points), Number Formats, Scaling, Calculation, Defaults (grid, snap, process size)
- [ ] Reset to defaults
- [ ] File management: new/open/save/save-as, recent files; single-document JSON project format (analogous to .zmfa role)
- [ ] Document information: object counts, documentation and calculation levels
- [ ] System keywords and description
- [ ] Undo/copy warnings with do-not-show-again option (resettable)

## Out of scope (deliberate)

- STAN web portal (stan2web.net): login, upload/download, release states, rating — collaboration platform, not analysis functionality
- Windows MSI installer and 32-bit compatibility mode
- Windows .zmfa/.smfa/.mfa/.xmfa file formats
- Proprietary calculation modules Cencic 2012 and IAL-IMPL2013 as swappable DLLs; reconciliation runs via the open OpenSEFA.jl solver instead

## Build order

M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8. Each milestone lands as commits with its features listed in the README. M1 and M2 establish the STAN-native workspace so all later features are built into the right UI structure from the start.
