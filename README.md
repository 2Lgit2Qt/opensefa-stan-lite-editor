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
- **Calculation features (partial M6, delivered early)**: Calculation dialog via Alt+F5 or Edit \u2192 Calculation (trace level none/errors/warnings/information/details, first/last period selection, equation dump); F5 quick calculation; coarse balance shown under process labels before calculation; per-process exclusion from goods-layer balancing with bracketed names; gross-error check against the 95% confidence criterion with trace verdicts; standard-score histogram; equation dump after computation.

### Honest labeling of the diagnostics

Two result statistics are simplified client-side proxies and are labelled as such in the UI: the equation/variable balance (raw count difference, not STAN\u2019s transformed degree of over-determination) and the adjustment index (mean relative adjustment, not STAN\u2019s reconciliation-quality statistic). Gross-error detection follows the documented 95% confidence-interval criterion. True statistical tests run inside OpenSEFA.jl on the solver side.

## Next: M4 \u2014 Data entry and documentation

Per-value literature references and remarks, percent uncertainty entry, volume flow and density on the goods layer, per-period concentration data on substance/energy layers. Editable unit lists were already delivered with M3.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found` or StructUtils error:** install Julia 1.10 via Juliaup, then rebuild with `Pkg.instantiate()` and `Pkg.precompile()`.
- **Old project:** open it via File \u2192 Open; the legacy data format is migrated automatically.
- **Reset everything:** Extras \u2192 Reset settings clears browser storage and reloads.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
