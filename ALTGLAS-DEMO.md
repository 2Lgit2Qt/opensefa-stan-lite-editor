# Altglas presentation workflow

Synthetic teaching example, not plant data. This is a focused STAN-inspired prototype, not full STAN feature parity.

## Start
Serve this repository with your existing local web server and open index.html. Hard-refresh after pulling the commit. Click **Altglas-Demo laden** (asks before replacing the saved working model). The Julia solver is still required on localhost:8080 for Calculate.

## Material path
Anlieferung (external) -> Annahme -> Eingangslager -> Sortierung -> external recipients. Storage is on the main path, not a side branch. The same delivery arrow carries glass and residual liquid.

## Seven presentation actions
1. **Prozess**: click, enter name; move the selected node.
2. **Fluss erstellen**: click source then destination.
3. **Transferkoeffizienten**: select Sortierung, click Transferkoeffizienten einstellen. Choose the glass layer. Fixed white/green/brown coefficients are .50/.30/.15; the remaining .05 follows from balance. Values are fractions, not percentages. Do not set all four independently unless consistent.
4. **Systemgrenze: Ein-/Ausgang**: creates an external endpoint, not a real warehouse. On any non-subsystem node use Knotentyp / Systemzugehörigkeit to choose internal process, internal storage or external endpoint. The dashed frame automatically encloses internal nodes. Moving a node does not change membership; keep external endpoints visually outside. This is not a manually resizable STAN boundary tool.
5. **Lager**: create a named warehouse or select Eingangslager. Capacity is visible directly in Properties, separately per layer. Click Lagerbestände und Unsicherheiten einstellen for opening/closing inventory and measurement type. The existing export enforces opening + input - withdrawal = closing.
6. **Unsicherheiten**: select F1, click Menge und Unsicherheit einstellen. Edit absolute standard uncertainty or relative percent; translated type labels now save stable machine values. Fixed values are exact assumptions; measured values require positive standard uncertainty.
7. **Einheiten**: switch layers: Glasmasse (t/a) and Restflüssigkeit (l/a). F1 carries both. No parallel delivery arrow and no automatic mass-volume conversion. L2 is an independent volume balance layer; do not enable subgood summation, which would incorrectly add litres and tonnes. Other generic UI entry points are retained.

## Expected nominal calculation
F1/F2: 100 t/a and 1000 l/a.
Storage: opening 10 t/100 l; closing 20 t/200 l; withdrawal F7 90 t/a and 900 l/a.
Glass F3/F4/F5/F6: 45/27/13.5/4.5 t/a.
Liquid F8: 900 l/a. Glass in F8 and liquid in F3-F6 are fixed zero: ideal separation teaching assumption.
Glass and liquid capacities are 30 t and 300 l. These are independent per-layer inventory limits, not a combined physical tank volume.

## Capacity scope and limits
The editor stores capacities in the project JSON and checks known opening/closing inventories before calculation and returned root-level inventories after calculation. Known violations block Calculate; returned violations are reported in Trace Output. Capacity is NOT sent as an inequality to the optimizer and does NOT constrain reconciliation. Unknown inventories cannot be checked before solving. Annual endpoints do not prove that capacity was respected during the year. Stock amounts use the layer display quantity unit; flows use period-rate units, with one-year periods. Do not change display units without consistently converting inventories and capacities. No density is assumed to combine glass tonnes and liquid litres.

## Manual acceptance checks (not an automated browser test)
- Save/reopen project; verify capacities and both layers survive.
- Set glass closing stock to 31 with capacity 30; Calculate must report capacity error. Restore 20.
- Set capacity 19 with closing stock 20; same error. Restore 30.
- Change a process to internal Lager: inventory fields appear. Change it to external: it is excluded from stock equations and frame membership. Connections remain unchanged; review them.
- In German select gemessen and verify solver JSON uses MeasuredVariable, not an untranslated/invalid type.
- Calculate with Julia; compare nominal results above and ensure Trace Output has no capacity violation.
- Change delivery uncertainty; recalculate. Inspect solver-provided uncertainties rather than presenting entered zero placeholders as calculated values.

Implementation has been prepared by source inspection. Browser operation and end-to-end Julia calculation must be verified locally; no automated or live browser test is claimed.
