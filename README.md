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

## All milestones completed (M1–M8)

- **M1 — Workspaces**: menu bar, STAN toolbars, Model Explorer, Shapes, tabbed Properties, Trace Output, zoom/grid/snap, multi-select, copy/paste, find, undo/redo, STAN shortcuts, German/English UI.
- **M2 — Model building**: system boundary with Σ sums, import/export/internal flow types, true subsystems (six levels), flow routing, movable labels, short symbols, text fields.
- **M3 — Layers, materials, periods, units**: material catalog and custom materials, substance/subgood/energy layers, per-period data entry with period records, STAN stock equation across periods, subgood mode, editable unit families with per-layer display units.
- **M4 — Data entry and documentation**: per-value literature references and remarks with References manager and worksheet literature section; percent uncertainty entry; volume flow and density on the goods layer; per-period per-layer concentration.
- **M5 — Data Explorer and exchange**: tabbed Data Explorer (Ctrl+D) with Flow values, TCs, Stocks, Concentrations, and Processes; editable grid; grouping; sortable columns; entered vs calculated toggle; error-row marking; Copy TSV; Export CSV; Paste block.
- **M6 — Calculation**: Calculation dialog via Alt+F5; F5 quick calculation; coarse balance; exclusion from goods-layer balancing; gross-error check; standard-score histogram; scaling basis with result-table display.
- **M7 — Presentation**: Sankey mode with curved Bézier flow paths; width slider; legend with layer, unit, display mode, and scaling info; SVG and PNG diagram export.
- **M8 — Options, files, and platform behavior**: Options dialog (Extras → Options…) with Common, Sankey, Data, and Defaults tabs consolidating all settings; Document Info (File → Document info…) with object counts, data completeness percentage, and documented-value count; Save As (File → Save As…) with project-name prompt and download.

### Honest limitations summary

The editor is a prototype, not a full STAN replacement. The most significant deviations from STAN 2.8: scaling divides displayed values but does not rescale data; the Data Explorer edits write directly on input; subsystems are boundary-balance nodes without nested internal models rendered in the same view; concentration is entered per flow and links to the goods layer only; short variable keys and print preview are defined but not yet wired; the stability check requires server-side seed control not available via the HTTP API. STAN's web portal, Windows installer, .zmfa/.smfa file formats, and proprietary calculation modules are deliberately out of scope.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found`:** install Julia 1.10 via Juliaup.
- **Old project:** File → Open migrates automatically.
- **Reset:** Extras → Reset settings.

## License

MIT. OpenSEFA.jl: PolyForm Noncommercial 1.0.0.
