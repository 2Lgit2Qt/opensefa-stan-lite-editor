# OpenSEFA STAN-lite Editor

A browser-based MFA/SFA modeling workspace connected to the OpenSEFA.jl reconciliation solver, built to mirror the STAN 2.8 workflow. See ROADMAP.md for the full STAN parity plan (M1–M8).

## Prepare Python and Julia (macOS)

Run the commands below in Terminal, not inside the Python or Julia interactive prompt.

### Python

Use Python 3; Python 3.13.x is a suitable setup choice, not an exact project dependency. Python only serves the static editor files: no pip packages or virtual environment are required. Install a supported Python 3 macOS package from [python.org](https://www.python.org/downloads/macos/), following the [official macOS guide](https://docs.python.org/3.13/using/mac.html). Do not replace or delete Apple's system Python. Open a new Terminal after installation and check:

```bash
python3 --version
python3 -m http.server --help
```

The first command must report Python 3.x. If several installations exist, use `python3.13` consistently instead of `python3` when selecting the 3.13 installation. See the [HTTP server command-line documentation](https://docs.python.org/3.13/library/http.server.html#command-line-interface).

### Julia

Use the documented project line Julia 1.10.x via Juliaup, rather than relying on whichever version plain `julia` selects. Review the [official installation instructions](https://julialang.org/install/) before running the installer, which downloads and executes an installation script:

```bash
curl -fsSL https://install.julialang.org | sh
```

Open a new Terminal, then run:

```bash
juliaup add 1.10
juliaup status
julia +1.10 --version
```

The last command should report Julia 1.10.x. The `1.10` channel selects an available patch in that series; record the actual version for reproducibility. See the [Juliaup version-selection guide](https://github.com/JuliaLang/juliaup#using-juliaup). This is the version line used by the existing project instructions, not a claim that every solver dependency was revalidated here.

The solver is a separate project and is not included in this editor repository. Obtain the OpenSEFA solver project and its dependencies before attempting calculations. The commands below assume it is available locally as `~/Projects/opensefa-reconciliation-solver`, with its own Project.toml and OpenSEFA package. Change paths to match your installation. Python alone is sufficient to view the editor, not to run numerical calculations.

## Update your local copy

```bash
cd ~/Projects/opensefa-stan-lite-editor
git pull

cd ~/Projects/opensefa-reconciliation-solver
git pull
```

Hard-refresh the browser with Cmd+Shift+R after updating.

## Launch locally (Apple-silicon Mac)

Terminal 1 — prepare dependencies once, then start the solver:

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia +1.10 --project -e 'using Pkg; Pkg.instantiate()'
julia +1.10 --project -e 'using OpenSEFA; start_server()'
```

Terminal 2 — editor:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. Keep both terminals running; Ctrl+C stops each server. Open the separate example through File → Open → `examples/altglas-demo.json`.

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

- **CORS error:** serve the editor over HTTP, never `file://`. Frontend port 8000 and solver port 8080 are different origins: serving through Python alone does not fix solver CORS configuration.
- **`python3: command not found`:** follow the Python setup above, reopen Terminal and check `python3 --version`.
- **`julia: command not found`:** follow the Juliaup setup above and reopen Terminal. Use `julia +1.10`, not an unverified default version.
- **`Package OpenSEFA not found`:** verify that you are in the separate solver project and have its Project.toml; run `Pkg.instantiate()` there. Do not install an unrelated similarly named package.
- **Old project:** File → Open migrates automatically.
- **Reset:** Extras → Reset settings.

## License

MIT. OpenSEFA.jl: PolyForm Noncommercial 1.0.0.
