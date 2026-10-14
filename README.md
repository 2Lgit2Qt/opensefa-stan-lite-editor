# OpenSEFA STAN-lite Editor

A dependency-free browser editor for MFA/SEFA flow models. It exports JSON compatible with the OpenSEFA.jl `/solve` HTTP endpoint, including linear mass balances, bilinear transfer-coefficient equations, stock-change balances, and subsystem boundaries.

## Run locally

1. Start the OpenSEFA.jl solver:
   `julia --project -e "using OpenSEFA; start_server()"`
2. Serve this folder (avoid `file://` due to CORS):
   `python -m http.server 8000`
3. Open http://localhost:8000

## Features

- Processes, stocks, subsystems, directed flows, connect mode, and drag positioning.
- Flow units, measured/unmeasured/fixed types, values, and uncertainties.
- Per-process transfer coefficients, exported as bilinear equations:
  `output_flow - tc * sum(input_flows) = 0`.
- Stocks with start/end contents; stock balances include stock change:
  `inputs - outputs - end_content + start_content = 0`.
- Subsystems use boundary balances: `inputs - outputs = 0`.
- Autosave, project save/open as JSON, solver-JSON export, and a result table.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
