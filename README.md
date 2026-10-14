# OpenSEFA STAN-lite Editor

A dependency-free browser editor for multi-layer MFA/SEFA flow models. It exports JSON compatible with the OpenSEFA.jl `/solve` HTTP endpoint, including linear balances, bilinear transfer-coefficient equations, stock-change balances, subsystem boundaries, and cross-layer concentration links.

## Run locally

1. Start the OpenSEFA.jl solver:
   `julia --project -e "using OpenSEFA; start_server()"`
2. Serve this folder (avoid `file://` due to CORS):
   `python -m http.server 8000`
3. Open http://localhost:8000

## Features

- Processes, stocks, subsystems, directed flows, connect mode, and drag positioning.
- Multiple layers (e.g. goods, substance, energy) with per-layer flow data, units, uncertainties, and transfer coefficients.
- Per-layer balances for processes, subsystems, and stocks.
- Stock start/end contents and stock-change balances.
- Concentration links: `secondary_layer_flow = concentration * primary_layer_flow`, exported as bilinear equations.
- Autosave, project save/open, solver-JSON export, and result table.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
