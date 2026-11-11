# Altglas as a standalone project

The Altglas model is demonstration data, not a built-in editor action.

1. Download `altglas-demo.json` from this directory to your computer (use GitHub's raw download, not the HTML page).
2. Open the editor.
3. Choose **Datei → Öffnen** and select the downloaded JSON file.
4. If the file has no system boundary, draw one around Annahme, Eingangslager and Sortierung. Keep Anlieferung and all recipient nodes outside.
5. Save the project to retain your boundary and model edits.

Imports and exports follow the node centres relative to the boundary, independently of the example's names. After drawing, the boundary returns to gray. Click its dashed outline to select it and expose resize handles; click away or press Escape to deselect it.

Implementation note: the compatibility layer removes the legacy Altglas toolbar element and detaches its handler after UI initialization. The old loader source remains in presentation.js, but is not exposed as an editor action.
