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
- **M5 — Data Explorer and exchange**: tabbed Data Explorer (Ctrl+D) with Flow values, TCs, Stocks, Concentrations, and Processes; editable grid; grouping (Period→Layer / Layer→Period / None); sortable columns; entered vs calculated toggle; error-row marking; Copy TSV; Export CSV; Paste block.
- **Calculation (partial M6)**: Alt+F5 dialog, F5, coarse balance, gross-error check, histogram.

### Known M5 simplifications

Grid edits write on input. Paste uses CSV column format. STAN's drag-column grouping and flow catalog are not implemented.

## Next: M6 — Calculation (remaining)

Scaling basis, solver options, stability check.

## Troubleshooting

- **CORS:** serve with `python3 -m http.server 8000`; never `file://`.
- **Julia:** install 1.10 via Juliaup.
- **Reset:** Extras → Reset settings.

## License

MIT. OpenSEFA.jl: PolyForm Noncommercial 1.0.0.
