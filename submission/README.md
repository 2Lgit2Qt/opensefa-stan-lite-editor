# Thema 6: Vibe-Coding eines Prototyps – Abgabe und Demo

## Vier Minuten plus eine Minute Reserve
0:00-0:30 Person 1: Problem und Zielgruppe. Lokal betreibbares browserbasiertes MFA-Lernwerkzeug; kein behaupteter erster oder vollstaendiger STAN-Ersatz.
0:30-1:00 Person 2: KI-Dialog, echte Iterationen und erkannte Grenzen.
1:00-2:00 Person 3: Python liefert die Oberflaeche auf localhost:8000; Julia/OpenSEFA rechnet auf :8080/solve; JSON verbindet beides. Keine Liveinstallation.
2:00-3:00 Person 4: Altglasmodell, 100 t/a Eingang, F1-Wert/Unsicherheit/Quelle und Sortierungs-TCs zeigen.
3:00-3:45 Person 5: unbekannte Ausgaenge und Bilanz erklaeren. Optional Darstellung/Export zeigen.
3:45-4:00 Person 5: Calculate; 50 Weiss + 30 Gruen + 15 Braun + 5 Fehlwuerfe = 100 t/a.
4:00-5:00 Reserve. Eine Person bedient durchgehend; kein Laptopwechsel.

## Start vor der Vorfuehrung
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
15 Sekunden sind ein Vorfuehrfenster, keine Laufzeitgarantie. Unabhaengige lineare Bilanzpruefung bestanden; Browser-/Julia-End-to-End-Test auf Vorfuehrhardware noch offen.

## Abgabe
Das separate Downloadpaket aus dem Dialog enthaelt vier PPTX-Folien, PDF-Entwurf, editierbare Markdown-Dokumente und das Demo-JSON. Es ersetzt nicht den vollstaendigen Prototypcode. Einreichen: lauffaehiger Prototyp mit Lesezugriff oder Repository-ZIP; max. eine Seite Anforderungen; echte Screenshots; Grenzenbewertung; KI-Logbuch 1-2 Seiten mit woertlichen Prompts und mindestens drei dokumentierten Iterationen; Test mit 2-3 externen Personen und eingearbeiteter Rueckmeldung; 5-Minuten-Demo. Alle fuenf Namen und finalen Commit ergaenzen.
Noch real zu erledigen: externe Tests und drei Screenshots (Modell, Eingabe/TC, berechnetes Ergebnis). Keine Testergebnisse, Screenshots oder erledigten Arbeiten erfinden.

## Rollen (Vorschlag)
1 Anforderungen/Problem; 2 Logbuch/Reflexion; 3 Technik/Laptop; 4 Modell/Quellen; 5 externe Tests/Screenshots/Timing. Sprecherzeiten siehe oben.

## Kritische Bewertung
Echte Iterationen: Nullfluss durch falsche Stock-Grenzbedingungen; widerspruechlicher Ein-/Ausgang mit TC; blockierender CSS-Modal; Syntaxfehler trotz Erfolgsmeldungen. Dateigroesse beweist keine Byteidentitaet. KI beschleunigt, ersetzt aber keine Fachpruefung oder Browserabnahme.
Nicht alle Roadmappunkte sind wirklich implementiert: Kopplung von Subsystemgrenzen, konsistente Einheitenumrechnung, echte Layertrennung fuer Konzentrationen, Data-Explorer-Layer-IDs, Skalierung und strenge Sankeyproportionalitaet brauchen weitere Arbeit. Ein FEASIBLE-Ergebnis beweist keine reale Modellgueltigkeit. Der gewaehlte kleine Demo-Pfad umgeht bekannte Problempfade, behebt sie aber nicht.
Datenschutz: nur synthetische Daten. Sicherheit: keine Ports oeffentlich freigeben, keine unbekannten Projektdateien laden; HTML-Escaping/Validierung und Serverbindung sind keine umfassend geprueften Sicherheitsmechanismen. Kein Produktionsbetrieb. OpenSEFA.jl separat unter PolyForm Noncommercial lizenziert.

## Quellen
Aufgabenblatt Gruppen-Projektarbeit KI-Praxis Digitalisierung, Thema 6 und allgemeines KI-Logbuch; STAN 2.8 User Manual (TU Wien, August 2026) als Funktionsreferenz; OpenSEFA-Unterlagen und GitHub-Code als technische Referenz. Zahlen der Demo sind ausschliesslich Gruppenannahmen.
