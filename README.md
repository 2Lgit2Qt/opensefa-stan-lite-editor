# OpenSEFA STAN-lite Editor

A browser-based MFA/SFA modeling workspace connected to the OpenSEFA.jl reconciliation solver, built to mirror the STAN 2.8 workflow. See ROADMAP.md for the full STAN parity plan (M1–M8).

## Update your local copy

```bash
cd ~/Projects/opensefa-stan-lite-editor
git pull

cd ~/Projects/opensefa-reconciliation-solver
git pull
```

Hard-refresh the browser with Cmd+Shift+R after updating.

## Launch locally (Apple-silicon Mac)

Terminal 1 — solver:

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e "using OpenSEFA; start_server()"
```

Terminal 2 — editor:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

Open http://localhost:8000.

## Milestones completed

- **M1 — Workspaces**: menu bar, STAN toolbars, Model Explorer, Shapes, tabbed Properties, Trace Output, zoom/grid/snap, multi-select, copy/paste, find, undo/redo, STAN shortcuts, German/English UI.
- **M2 — Model building**: system boundary with Σ sums, import/export/internal flow types, true subsystems (six levels), flow routing, movable labels, short symbols, text fields.
- **M3 — Layers, materials, periods, units**: material catalog and custom materials, substance/subgood/energy layers, per-period data entry with period records, STAN stock equation across periods, subgood mode, editable unit families with per-layer display units.
- **M4 — Data entry and documentation**: per-value literature references and remarks with References manager and worksheet literature section; percent uncertainty entry; volume flow and density on the goods layer; per-period per-layer concentration.
- **M5 — Data Explorer and exchange**: tabbed Data Explorer (Ctrl+D) with Flow values, TCs, Stocks, Concentrations, and Processes; editable grid; grouping; sortable columns; entered vs calculated toggle; error-row marking; Copy TSV; Export CSV; Paste block.
- **M6 — Calculation**: Calculation dialog via Alt+F5 (trace level, period range, equation dump); F5 quick calculation; coarse balance under process labels; per-process exclusion from goods-layer balancing with bracketed names; gross-error check against the 95% confidence criterion; standard-score histogram; scaling basis (unit + factor + mode: none / scaling factor / Σ imports / Σ exports) with values in the result table divided by the selected reference; entered vs calculated data toggle.

### Honest labeling of the diagnostics

Two result statistics are simplified client-side proxies and are labelled as such in the UI. Gross-error detection follows the documented 95% confidence-interval criterion. True statistical tests run inside OpenSEFA.jl.

### Known M6 simplifications

Scaling divides displayed result values but does not rescale the underlying data (STAN's Scale Data modifies the data). The stability check via multiple solver runs with different random seeds requires server-side seed control not available through the OpenSEFA.jl HTTP API. Short variable keys in the equation dump are defined but not yet wired to the dialog checkbox.

## Next: M7 — Presentation

True Sankey rendering with flow widths proportional to values and curved routing; toggle between entered and calculated data in the diagram; legend object with units and scale basis; flow styles with inflection points; diagram export (PNG/SVG); print layout.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found`:** install Julia 1.10 via Juliaup.
- **Old project:** File → Open migrates automatically.
- **Reset:** Extras → Reset settings.

## License

MIT. OpenSEFA.jl: PolyForm Noncommercial 1.0.0.
