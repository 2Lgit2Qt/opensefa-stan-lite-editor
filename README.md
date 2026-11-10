# OpenSEFA STAN-lite Editor

A browser-based MFA/SFA modeling workspace connected to the OpenSEFA.jl reconciliation solver, built to mirror the STAN 2.8 workflow. See ROADMAP.md for the full STAN parity plan (M1\u2013M8).

## Update your local copy

```bash
cd ~/Projects/opensefa-stan-lite-editor
git pull

cd ~/Projects/opensefa-reconciliation-solver
git pull
```

Hard-refresh the browser with Cmd+Shift+R after updating.

## Launch locally (Apple-silicon Mac)

Terminal 1 \u2014 solver:

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e "using OpenSEFA; start_server()"
```

Terminal 2 \u2014 editor:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

Open http://localhost:8000.

## Milestones completed

- **M1 \u2014 Workspaces**: menu bar, STAN toolbars, Model Explorer, Shapes, tabbed Properties, Trace Output, zoom/grid/snap, multi-select, copy/paste, find, undo/redo, STAN shortcuts, German/English UI.
- **M2 \u2014 Model building**: system boundary with \u03a3 sums, import/export/internal flow types, true subsystems (six levels), flow routing, movable labels, short symbols, text fields.
- **M3 \u2014 Layers, materials, periods, units**: material catalog and custom materials, substance/subgood/energy layers, per-period data entry with period records, STAN stock equation across periods, subgood mode, editable unit families with per-layer display units.
- **M4 \u2014 Data entry and documentation**: per-value literature references and remarks (flows and stocks, per layer and period) with a References manager (Edit \u2192 References\u2026) and a literature section in the exported worksheet; percent uncertainty entry (auto-converted to absolute); volume flow and density on the goods layer with the exported equation mass = volume \u00d7 density; per-period, per-layer concentration on substance and energy layers with the exported equation substance/energy flow = concentration \u00d7 goods flow. Old projects with flow-level concentration links are migrated automatically.
- **Calculation features (partial M6, delivered early)**: Calculation dialog via Alt+F5 or Edit \u2192 Calculation (trace level, first/last period selection, equation dump); F5 quick calculation; coarse balance shown under process labels before calculation; per-process exclusion from goods-layer balancing with bracketed names; gross-error check against the 95% confidence criterion; standard-score histogram.

### Honest labeling of the diagnostics

Two result statistics are simplified client-side proxies and are labelled as such in the UI: the equation/variable balance (raw count difference, not STAN\u2019s transformed degree of over-determination) and the adjustment index (mean relative adjustment, not STAN\u2019s reconciliation-quality statistic). Gross-error detection follows the documented 95% confidence-interval criterion. True statistical tests run inside OpenSEFA.jl on the solver side.

### Known M4 simplifications

Concentration is entered per flow and period on the active substance/energy layer and links that layer to the goods layer; STAN additionally supports concentrations relative to volume and on stock contents. Transfer coefficients remain shared across periods. Reference selection is a plain text list, not STAN\u2019s templated reference database.

## Next: M5 \u2014 Data Explorer and exchange

Editable grouped data grid (Ctrl+D), grouping hierarchy, entered/calculated and unit toggles, Excel clipboard exchange, file export, and data validation.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found` or StructUtils error:** install Julia 1.10 via Juliaup, then rebuild with `Pkg.instantiate()` and `Pkg.precompile()`.
- **Old project:** open it via File \u2192 Open; the legacy data format is migrated automatically.
- **Reset everything:** Extras \u2192 Reset settings clears browser storage and reloads.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
