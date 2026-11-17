# Thema 6: Vibe-Coding eines Prototyps – Demo und technische Hinweise

## Start vor der Vorfuehrung
Einrichtung von Python 3 und Julia 1.10.x: [Anleitung in der Haupt-README](../README.md#prepare-python-and-julia-macos).

Terminal A (Juliaup/Kanal 1.10 und Pakete vorher bereitstellen):
```bash
cd ~/Projects/opensefa-reconciliation-solver
julia +1.10 --project -e 'using Pkg; Pkg.instantiate()'
julia +1.10 --project -e 'using OpenSEFA; start_server()'
```
Terminal B:
```bash
cd ~/Projects/opensefa-stan-lite-editor
git pull --ff-only
python3 -m http.server 8000 --bind 127.0.0.1
```
http://localhost:8000, Cmd+Shift+R, File -> Open -> examples/altglas-demo.json. Falls der Canvas schmal ist, Browser auf 80% zoomen. Nicht die eingebauten Beispielbuttons verwenden. Solver einmal vorwaermen, danach Demo neu oeffnen. Ctrl+C stoppt die Prozesse. Verschiedene Ports sind unterschiedliche Origins; Python allein behebt keine CORS-Probleme.

## Demo
Synthetischer Jahresfall 2026. Annahme und Sortierung innerhalb; Anlieferung und vier Empfaenger als unbilanzierte Umgebung. Keine Lageraenderung, eine Gueterschicht t/a. Kein Nachweis einer realen Altglassortieranlage. F1=100 +/-5 und F3=50 +/-2.5 sind konsistente Messvorgaben. F3-TC=.50, F4-TC=.30, F5-TC=.15 sind feste Modellannahmen; F6 wird durch die Bilanz ergaenzt. Soll: F1/F2=100, F3=50, F4=30, F5=15, F6=5. Unbekannt bedeutet nicht als null gemessen.
Klickfolge: F1 -> Values -> Quelle/Unsicherheit; Sortierung -> Values -> TCs; Toolbar Calculate; Resultate lesen. Optional File -> Export diagram (SVG). Skalierung aus. Keine Subsysteme, Konzentrationen oder Data-Explorer-Edits in dieser Demo.
Unabhaengige lineare Bilanzpruefung bestanden; Browser-/Julia-End-to-End-Test auf Vorfuehrhardware noch offen.

## Kritische Bewertung
Echte Iterationen: Nullfluss durch falsche Stock-Grenzbedingungen; widerspruechlicher Ein-/Ausgang mit TC; blockierender CSS-Modal; Syntaxfehler trotz Erfolgsmeldungen. Dateigroesse beweist keine Byteidentitaet. KI beschleunigt, ersetzt aber keine Fachpruefung oder Browserabnahme.
Nicht alle Roadmappunkte sind wirklich implementiert: Kopplung von Subsystemgrenzen, konsistente Einheitenumrechnung, echte Layertrennung fuer Konzentrationen, Data-Explorer-Layer-IDs, Skalierung und strenge Sankeyproportionalitaet brauchen weitere Arbeit. Ein FEASIBLE-Ergebnis beweist keine reale Modellgueltigkeit. Der gewaehlte kleine Demo-Pfad umgeht bekannte Problempfade, behebt sie aber nicht.
Datenschutz: nur synthetische Daten. Sicherheit: keine Ports oeffentlich freigeben, keine unbekannten Projektdateien laden; HTML-Escaping/Validierung und Serverbindung sind keine umfassend geprueften Sicherheitsmechanismen. Kein Produktionsbetrieb. OpenSEFA.jl separat unter PolyForm Noncommercial lizenziert.

## Quellen
Aufgabenblatt Gruppen-Projektarbeit KI-Praxis Digitalisierung, Thema 6 und allgemeines KI-Logbuch; STAN 2.8 User Manual (TU Wien, August 2026) als Funktionsreferenz; OpenSEFA-Unterlagen und GitHub-Code als technische Referenz. Zahlen der Demo sind ausschliesslich Gruppenannahmen.
