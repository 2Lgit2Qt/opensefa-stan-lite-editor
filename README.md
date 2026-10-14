# OpenSEFA STAN-lite Editor

A dependency-free browser editor for multi-layer MFA/SEFA flow models, connected to the OpenSEFA.jl reconciliation solver.

## Launch locally on an Apple-silicon (M1/M2/M3/M4) Mac

### 1. Install Homebrew

Open **Terminal** and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Julia with Juliaup

If you previously installed Julia with Homebrew, remove it first to avoid conflicts:

```bash
brew uninstall --cask julia
```

Install Juliaup and Julia 1.10 LTS:

```bash
brew install juliaup
juliaup add 1.10
juliaup default 1.10
```

Close and reopen Terminal, then verify:

```bash
which julia
julia --version
```

`julia --version` should report `1.10.x`.

### 3. Get the two repositories

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/MatplusGmbH/opensefa-reconciliation-solver.git
git clone https://github.com/2Lgit2Qt/opensefa-stan-lite-editor.git
```

### 4. Start the OpenSEFA solver — Terminal 1

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e 'using Pkg; Pkg.instantiate()'
julia --project -e 'using Pkg; Pkg.precompile()'
julia --project -e "using OpenSEFA; start_server()"
```

The first run downloads and precompiles Julia packages and can take several minutes. When ready, you should see output similar to:

```text
Started server: http://0.0.0.0:8080
```

Leave this Terminal window open.

### 5. Start the editor — Terminal 2

Open a second Terminal window (`Cmd+N`), then run:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

If `python3` is missing:

```bash
brew install python
```

Then open:

```text
http://localhost:8000
```

### 6. Solve the demo model

1. Click **Load demo**.
2. Confirm the Solver URL is `http://localhost:8080/solve`.
3. Click **Solve**.

## Troubleshooting

### `failed to find source of parent package: StructUtils`

This usually means Julia is too new for the project’s locked dependencies. Use Julia 1.10 through Juliaup:

```bash
brew install juliaup
juliaup add 1.10
juliaup default 1.10
```

Close and reopen Terminal, then rebuild:

```bash
cd ~/Projects/opensefa-reconciliation-solver
rm -rf ~/.julia/compiled
julia --project -e 'using Pkg; Pkg.instantiate()'
julia --project -e 'using Pkg; Pkg.precompile()'
julia --project -e "using OpenSEFA; start_server()"
```

### Other issues

- **CORS or network error in the browser:** Do not open `index.html` via `file://`; serve it with `python3 -m http.server 8000`.
- **Port 8080 in use:** Run `lsof -i :8080`, stop that process (`kill -9 <PID>`), and restart the Julia server.
- **Port 8000 in use:** Use `python3 -m http.server 8081` and open `http://localhost:8081`.
- **`julia: command not found`:** Open a new Terminal window after installing Juliaup, or run `exec zsh`.
- **Solver returns an error:** Click **Solver JSON** in the editor to inspect the payload sent to `/solve`.

## Features

- Processes, stocks, subsystems, directed flows, connect mode, and drag positioning.
- Multiple layers with per-layer flow data, units, uncertainties, and transfer coefficients.
- Per-layer balances for processes, subsystems, and stocks; stock start/end contents.
- Concentration links between layers, exported as bilinear equations.
- Autosave, project save/open, solver-JSON export, and result display.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
