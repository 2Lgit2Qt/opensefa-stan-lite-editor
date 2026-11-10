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

- **M1 — Workspaces**
- **M2 — Model building**
- **M3 — Layers, materials, periods, units**
- **M4 — Data entry and documentation**
- **M5 — Data Explorer and exchange**
- **M6 — Calculation**
- **M7 — Presentation**: Sankey mode with curved quadratic Bézier flow paths, rounded line caps, and a width slider (5–50 px); legend showing layer, unit, entered/calculated mode, display unit, and scaling info (scaling unit ÷ factor); Σ imports/exports/stock change scaled by the active scaling basis; SVG diagram export via File → Export diagram (SVG); PNG diagram export via File → Export diagram (PNG) with white background and 2× resolution; diagram includes the system boundary, all nodes, flows, labels, and legend text.

### Known M7 simplifications

PNG export uses SVG-to-canvas conversion which may not work in all browsers; the SVG export is the reliable fallback. The Sankey width slider affects only the current layer's values. STAN's full Sankey with flow splitting/merging at node boundaries and inflection-point routing is not implemented. Print preview is deferred.

## Next: M8 — Options, files, and platform behavior

Options dialog with multiple tabs; file management (new/open/save/save-as, recent files); document information; system keywords; undo/copy warning suppression.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found`:** install Julia 1.10 via Juliaup.
- **Old project:** File → Open migrates automatically.
- **Reset:** Extras → Reset settings.

## License

MIT. OpenSEFA.jl: PolyForm Noncommercial 1.0.0.
