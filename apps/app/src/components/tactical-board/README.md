# Tactical Board Components

Renders `/interactive-tactical-board`. The active flow is:

- `SportSessionPlanner.tsx` — page orchestrator: undo/redo history, save/load,
  export (PNG/SVG), share links, formation apply, colorblind mode toggle.
- `TacticalBoardLayout.tsx` — toolbar/sidebar/canvas/properties shell.
- `SidebarTools.tsx` — drag sources for players/equipment, drawing tool picker,
  formation presets (sourced from `stores/tacticalBoardStore.ts`), pitch view controls.
- `BoardCanvas.tsx` — the Konva stage: drag-and-drop placement, freehand drawing,
  pan/zoom, full/half pitch background.
- `PropertiesPanel.tsx` — edit the selected element (jersey number, position,
  team, color, shaded-zone opacity, rotation).
- `SaveBoardDialog.tsx` / `LoadBoardDialog.tsx` — persistence UI against
  `/api/tactical-boards`.
- `HelpDialog.tsx` — in-app usage guide and keyboard shortcuts.
- `types.ts` — shared `BoardElement` model and pitch constants.
- `../../lib/tactical-board-svg-export.ts` — serializes the element list to a
  standalone vector SVG (Konva's canvas stage can only export raster PNG).

The older prototypes previously noted here (`TacticalBoard.tsx`,
`InteractiveTacticalBoard.tsx`, `NewKonvaTacticalBoard.tsx`, `KonvaTacticalBoard.tsx`,
`KonvaDrawingElement.tsx`, `TacticalToolbar.tsx`) had zero importers anywhere in the
app and were removed.
