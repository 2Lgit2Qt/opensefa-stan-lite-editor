# OpenSEFA STAN-lite Editor

A dependency-free browser editor for multi-layer MFA/SEFA flow models, connected to the OpenSEFA.jl reconciliation solver.

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

## Launch locally on an Apple-silicon (M1/M2/M3/M4) Mac

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Julia with Juliaup

```bash
brew uninstall --cask julia
brew install juliaup
juliaup add 1.10
juliaup default 1.10
```

Close and reopen Terminal, then verify:

```bash
julia --version
```

### 3. Get the repositories

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/MatplusGmbH/opensefa-reconciliation-solver.git
git clone https://github.com/2Lgit2Qt/opensefa-stan-lite-editor.git
```

### 4. Start the solver — Terminal 1

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e 'using Pkg; Pkg.instantiate()'
julia --project -e 'using Pkg; Pkg.precompile()'
julia --project -e "using OpenSEFA; start_server()"
```

Wait for `Started server: http://0.0.0.0:8080`.

### 5. Start the editor — Terminal 2

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

Open `http://localhost:8000`, click **Load demo**, then **Solve**.

## Features

- Processes, stocks, subsystems, directed flows, connect mode, and drag positioning.
- Multiple layers with per-layer flow data, units, uncertainties, and transfer coefficients.
- Per-layer balances for processes, subsystems, and internal stocks; stock start/end contents.
- Concentration links between layers, exported as bilinear equations.
- **Validation**: equation/unknown counts, TC-without-input errors, one-in/one-out TC warnings, invalid values and uncertainties.
- **Uncertainty diagnostics**: normalized shift Δ/σ for measured variables; |Δ/σ| > 2 is highlighted.
- **CSV import**: columns `name,layer,type,value,uncertainty,unit`; updates matching flows by name and layer.
- **Unit conversion**: mass (t, kg, g, lb) and energy (MJ, GJ, kWh, MWh) conversion in the flow panel.
- **Sankey view**: toggle scales flow widths by active-layer reconciled or entered values.
- Autosave, project save/open, solver-JSON export, and result diagnostics.

## Boundary stocks

Mark a stock as **Boundary stock** for system inputs/outputs; it has no balance equation. Internal stocks use:

```text
inputs - outputs - end_content + start_content = 0
```

## Transfer coefficients

A TC needs at least one input. With exactly one input and one output, the balance and TC equation over-constrain the system; add a loss/split outlet.

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
