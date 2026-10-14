# OpenSEFA STAN-lite Editor

A dependency-free browser editor for multi-layer MFA/SEFA flow models, connected to the OpenSEFA.jl reconciliation solver. It is a learning and exploration companion for material-flow analysis, not a full replacement for STAN.

## Update your local copy

```bash
cd ~/Projects/opensefa-stan-lite-editor
git pull

cd ~/Projects/opensefa-reconciliation-solver
git pull
```

Then hard-refresh the browser with `Cmd+Shift+R`.

If you changed files locally:

```bash
git stash
git pull
git stash pop
```

Update Julia and packages:

```bash
juliaup update
juliaup default 1.10
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e 'using Pkg; Pkg.update()'
julia --project -e 'using Pkg; Pkg.precompile()'
```

## Launch locally on an Apple-silicon Mac

```bash
brew uninstall --cask julia
brew install juliaup
juliaup add 1.10
juliaup default 1.10
```

Close and reopen Terminal, then:

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/MatplusGmbH/opensefa-reconciliation-solver.git
git clone https://github.com/2Lgit2Qt/opensefa-stan-lite-editor.git
```

Terminal 1:

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e 'using Pkg; Pkg.instantiate()'
julia --project -e 'using Pkg; Pkg.precompile()'
julia --project -e "using OpenSEFA; start_server()"
```

Terminal 2:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Teaching examples

- **Example: consistent** — 100 t/a input, 50 t/a main output with transfer coefficient 0.5, and an unmeasured loss output. Use it to study conservation and transfer coefficients.
- **Example: conflict** — layered goods/phosphorus model with intentionally inconsistent measurements. Use it to discuss how reconciliation exposes tension between data and model assumptions.

A large Δ/σ means reconciliation had to adjust a measured value substantially. It signals tension among data and model assumptions; it does not by itself prove which input is wrong.

## Course worksheet

The worksheet records research question, spatial boundary, reference period, tracked quantities, sources and assumptions, and interpretation. Save it with the project or export it as Markdown for the seminar paper.

## Reliability notes

- Unit conversion changes both value and uncertainty and only converts within mass or energy.
- The structural check is preliminary; it does not prove observability, redundancy, or feasibility.
- Balance nodes are simplified: they do not contain nested internal models.
- Stock contents are quantities; connected flows are rates over the reference period.
- The weighted-flow view scales straight arrows; it is not a full Sankey layout.
- CSV import updates existing flows only; it does not import Excel files or create flows.

## Solver connection

Use `http://localhost:8080/solve` and start the solver with:

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e "using OpenSEFA; start_server()"
```

## Troubleshooting

### `failed to find source of parent package: StructUtils`

Use Julia 1.10 via Juliaup:

```bash
brew install juliaup
juliaup add 1.10
juliaup default 1.10
```

Then:

```bash
cd ~/Projects/opensefa-reconciliation-solver
rm -rf ~/.julia/compiled
julia --project -e 'using Pkg; Pkg.instantiate()'
julia --project -e 'using Pkg; Pkg.precompile()'
julia --project -e "using OpenSEFA; start_server()"
```

### Other issues

- **CORS error:** serve the editor with `python3 -m http.server 8000`; never use `file://`.
- **Port 8080 in use:** `lsof -i :8080`, then `kill -9 <PID>`.
- **Port 8000 in use:** `python3 -m http.server 8081` and open `http://localhost:8081`.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
