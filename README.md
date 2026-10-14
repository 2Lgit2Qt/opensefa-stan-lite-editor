# OpenSEFA STAN-lite Editor

A dependency-free browser editor for simple MFA/SEFA flow models. It exports JSON compatible with the OpenSEFA.jl `/solve` HTTP endpoint, including linear mass balances and bilinear transfer-coefficient equations.

## Run locally

1. Start the OpenSEFA.jl solver:
   `julia --project -e "using OpenSEFA; start_server()"`
2. Serve this folder (avoid `file://` due to CORS):
   `python -m http.server 8000`
3. Open http://localhost:8000

## Usage

- Add processes/stocks, use **Connect** then click two nodes to create a flow.
- Select a flow to set measured/unmeasured/fixed, value, and uncertainty.
- Select a **process** to define transfer coefficients for its outgoing flows. Each enabled TC adds:
  `output_flow - tc * sum(input_flows) = 0`
  exported as bilinear terms in the OpenSEFA JSON format.
- **Export JSON** shows the `/solve` payload; **Solve** posts it to the solver URL.

## License

MIT for this editor. OpenSEFA.jl remains under its own PolyForm Noncommercial 1.0.0 license.
