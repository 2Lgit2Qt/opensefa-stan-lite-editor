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

## Layers, materials, periods, units (M3)

- **Define material** (Edit menu): catalog of predefined substances (C, N, P, K, S, Cl, Ca, Fe, Cu, Zn, Pb, Al, Si, Cd, Hg, H2O, CO2, organic dry matter), subgoods, and energy; custom materials can be added and deleted.
- **Layers and periods** (Edit menu): manage layers (code, name, kind goods/substance/subgood/energy, unit, calculation on/off, display unit) and the period record (start year, number of consecutive 1-year periods). Changing the period record keeps data by position (STAN “keep” behavior).
- **Period selection** (DATA INPUT toolbar): all values — flow data and stock contents — are entered and displayed per period. Calculation covers the full period record; variables are named `F1__L1__2026` (flow, layer, period).
- **Stock equation across periods**: for internal stocks, `start_(i+1) = end_i` links consecutive periods, matching STAN's `stock_i = stock_(i−1) + Δstock_(i−1)`.
- **Subgood mode** (Extras menu): when enabled, subgood layers must sum to the goods layer per flow; the corresponding equations are exported.
- **Define units** (Edit menu): unit families for mass, volume, energy, and time with predefined units; custom units can be inserted (name must not start with a number) and deleted. Per-layer display units.
- **Units: entered / display** toggle (SANKEY toolbar): switches diagram value display between entered units and the layer's display unit.

Known M3 simplifications (documented for the KI-Logbuch): transfer coefficients and concentration links are shared across periods rather than per-period; the display-unit toggle affects the diagram only — the calculation uses entered values; period duration is fixed at one year.

## Workspace (M1) and model building (M2)

Menu bar, STAN toolbars, Model Explorer, Shapes, tabbed Properties, Trace Output, zoom/grid/snap, multi-select, copy/paste, find, undo/redo, STAN shortcuts, German/English UI; system boundary with Σ imports/exports/stock change; import/export/internal flow types; true subsystems up to six levels (internal equations exported with prefix); straight/orthogonal flow routing; movable flow labels; short symbols, remarks, captions; text fields.

## Troubleshooting

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **`julia: command not found` or StructUtils error:** install Julia 1.10 via Juliaup, then rebuild with `Pkg.instantiate()` and `Pkg.precompile()`.
- **Old project:** open it via File → Open; the legacy data format is migrated automatically.
- **Reset everything:** Extras → Reset settings clears browser storage and reloads.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
