# OpenSEFA STAN-lite Editor

A browser-based MFA/SFA modeling workspace connected to the OpenSEFA.jl reconciliation solver, built to mirror the STAN 2.8 workflow. See ROADMAP.md for full STAN parity status and milestone plan (M1–M8).

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

- Menu bar: File, Edit, View, Extras with hover dropdowns
- Toolbars: STANDARD (New/Open/Save/Undo/Redo/Find), DIAGRAM (Grid/Snap/Zoom), DATA INPUT (layer select, period, CSV, Check structure, Calculate), SANKEY (Show as Sankey, Entered/Calculated display)
- Model Explorer: hierarchical tree of the system; processes expand to their in/out flows; clicking selects the object in diagram and Properties
- Shapes window: Selection mode, Process, Stock, Internal flow (Connect), Delete
- Properties window: tabbed (System/Worksheet when nothing is selected; General/Values for nodes and flows)
- Trace Output: messages and warnings from validation and calculation; click a message to select the referenced object; Clear button
- Canvas: zoom (Ctrl+F11/Ctrl+F12), grid, snap-to-grid on move, marquee selection, Ctrl+click multi-select, group move
- Keyboard shortcuts: F5 Calculate, Ctrl+N/O/S/Z/Y, Ctrl+F find, Ctrl+C/V copy/paste objects, Del delete, Esc cancel modes
- German/English UI language (View menu; defaults to system language)

All prior modeling features are preserved: layers, transfer coefficients, concentration links, stocks, validation, CSV import, teaching examples, worksheet, solver connection.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found` or StructUtils error:** install Julia 1.10 via Juliaup (`brew install juliaup; juliaup add 1.10; juliaup default 1.10`), then rebuild with `Pkg.instantiate()` and `Pkg.precompile()`.
- **Reset everything:** Extras → Reset settings clears the browser storage and reloads.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
