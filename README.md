# OpenSEFA STAN-lite Editor

A dependency-free browser editor for MFA/SEFA flow models. It exports JSON compatible with the OpenSEFA.jl `/solve` HTTP endpoint, including linear mass balances and bilinear transfer-coefficient equations.

## Run locally

1. Start the OpenSEFA.jl solver:
   `julia --project -e "using OpenSEFA; start_server()"`
2. Serve this folder (avoid `file://` due to CORS):
   `python -m http.server 8000`
3. Open http://localhost:8000

## Features

- Processes, stocks, directed flows, connect mode, and drag positioning.
- Flow units, measured/unmeasured/fixed types, values, and uncertainties.
- Per-process transfer coefficients, exported as bilinear equations:
  `output_flow - tc * sum(input_flows) = 0`.
- Autosave in the browser, project save/open as JSON, and solver-JSON export.
- Solver result display with a reconciled-values table when available.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
