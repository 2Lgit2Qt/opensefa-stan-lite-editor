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

## Workspace (M1)

Menu bar, STAN-grouped toolbars, Model Explorer, Shapes window, tabbed Properties, Trace Output, zoom/grid/snap, multi-select, copy/paste, find, undo/redo, STAN keyboard shortcuts (F5, Ctrl+N/O/S/Z/Y/F), German/English UI.

## Model building (M2)

- **System boundary**: automatically drawn around all internal objects, labeled with system name and period, showing Σ imports, Σ exports, Σ stock change, and a legend with layer and unit. Refreshes automatically; boundary stocks sit outside it.
- **Flow types**: import / export / internal, derived from boundary stocks (STAN semantics). Imports are blue with ⇒, exports green with ⇐, internal flows dark.
- **True subsystems**: add a Subsystem shape, then double-click (or Explorer ↘ / Properties → Edit subsystem) to open its own drawing area. The breadcrumb shows the hierarchy; up to six levels. Internal models are fully balanced: their equations are exported with a Sub1. name prefix and solved together with the parent model.
- **Flow routing**: straight or orthogonal (with inflection), selectable per flow in Properties → General.
- **Movable flow labels**: drag any flow label to reposition it.
- **Flows anchor on object borders** instead of centers.
- **Short symbols and remarks** per process; caption type (name / short / both) via View menu.
- **Text fields**: arbitrary text objects on the diagram, draggable, editable in Properties.

All M1 features and all modeling features (layers, transfer coefficients, concentration links, stocks, validation, CSV import, teaching examples, worksheet, solver) are preserved. Projects from older versions are migrated automatically.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found` or StructUtils error:** install Julia 1.10 via Juliaup, then rebuild with `Pkg.instantiate()` and `Pkg.precompile()`.
- **Old project:** open it via File → Open; the legacy format is migrated automatically.
- **Reset everything:** Extras → Reset settings clears browser storage and reloads.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
