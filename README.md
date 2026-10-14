# OpenSEFA STAN-lite Editor

A dependency-free browser editor for multi-layer MFA/SEFA flow models, connected to the OpenSEFA.jl reconciliation solver.

## Launch locally on an Apple-silicon (M1/M2/M3/M4) Mac

### 1. Install Homebrew and prerequisites

Open **Terminal** and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install Julia and Git:

```bash
brew install --cask julia
brew install git
```

Verify:

```bash
julia --version
git --version
```

Julia must be version 1.10 or later.

### 2. Get the two repositories

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/MatplusGmbH/opensefa-reconciliation-solver.git
git clone https://github.com/2Lgit2Qt/opensefa-stan-lite-editor.git
```

### 3. Start the OpenSEFA solver — Terminal 1

```bash
cd ~/Projects/opensefa-reconciliation-solver
julia --project -e "using OpenSEFA; start_server()"
```

The first run downloads and precompiles Julia packages and can take several minutes. When it is ready you should see output similar to:

```text
Started server: http://0.0.0.0:8080
```

Leave this Terminal window open.

### 4. Start the editor — Terminal 2

Open a **second** Terminal window (`Cmd+N` in Terminal), then run:

```bash
cd ~/Projects/opensefa-stan-lite-editor
python3 -m http.server 8000
```

macOS includes Python 3. If `python3` is missing, install it with:

```bash
brew install python
```

Then open this address in Safari or Chrome:

```text
http://localhost:8000
```

### 5. Solve the demo model

1. Click **Load demo**.
2. Confirm the Solver URL is:

```text
http://localhost:8080/solve
```

3. Click **Solve**.

## Troubleshooting

- **CORS or network error in the browser:** Do not open `index.html` directly with `file://`. Always serve the editor with `python3 -m http.server 8000`.
- **Port 8080 already in use:** Find and stop the process:

```bash
lsof -i :8080
kill -9 <PID>
```

Then restart the Julia server.

- **Port 8000 already in use:** Use another port:

```bash
python3 -m http.server 8081
```

Then open `http://localhost:8081`.

- **First Julia start is slow:** This is normal; Julia downloads and precompiles dependencies once.
- **`julia: command not found`:** Install it with `brew install --cask julia`, then open a new Terminal window and try again.
- **Solver returns an error:** Click **Solver JSON** in the editor to inspect the exact payload sent to `/solve`.

## Features

- Processes, stocks, subsystems, directed flows, connect mode, and drag positioning.
- Multiple layers with per-layer flow data, units, uncertainties, and transfer coefficients.
- Per-layer balances for processes, subsystems, and stocks; stock start/end contents.
- Concentration links between layers, exported as bilinear equations.
- Autosave, project save/open, solver-JSON export, and result display.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
