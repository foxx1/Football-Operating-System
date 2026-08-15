// Shared types and constants for the interactive tactical board.

// Pitch coordinate space: a fixed 16:9 (1920x1080) design resolution. The
// canvas always stretches to fill the available width and scales this space
// to fit, so every element position/size is authored against this reference
// regardless of the viewer's actual screen size.
export const PITCH_WIDTH = 1920;
export const PITCH_HEIGHT = 1080;

// Fixed pixel sizes (player radius, stroke widths, icon sizes, etc.) were
// originally tuned for an 800-wide pitch. Scale them by this factor so they
// stay visually proportional at the new reference resolution.
export const CONTENT_SCALE = PITCH_WIDTH / 800;

// Default stroke width (in pre-scale units, multiply by CONTENT_SCALE when
// rendering) for freshly drawn lines/arrows/curves/shapes.
export const DEFAULT_STROKE_WIDTH = 2.5;

// Default equipment marker sizes (already scaled by CONTENT_SCALE), used
// when an older/unresized element has no explicit width/height.
export const DEFAULT_CONE_DIAMETER = 16 * CONTENT_SCALE;
export const DEFAULT_GOAL_WIDTH = 40 * CONTENT_SCALE;
export const DEFAULT_GOAL_HEIGHT = 10 * CONTENT_SCALE;

export type Team = 'home' | 'away';

export type DrawingSubtype =
  | 'line'
  | 'arrow'
  | 'curve'
  | 'dribble'
  | 'square'
  | 'circle';

export type EquipmentSubtype = 'ball' | 'cone' | 'goal';

export type TextSubtype = 'title' | 'paragraph';

export type BackgroundType = 'full' | 'half';

export interface BoardElement {
  id: string;
  type: 'player' | 'equipment' | 'drawing' | 'text';
  subtype?: DrawingSubtype | EquipmentSubtype | TextSubtype;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  rotation?: number;
  color?: string;
  fill?: boolean;
  opacity?: number;
  dashed?: boolean;
  // Drawing-specific (lines/arrows/curves/shapes)
  strokeWidth?: number;
  // When set, this endpoint tracks a player element's live position instead
  // of the stored point - so the line keeps following that player as they're
  // dragged around the pitch. Only meaningful for line/arrow/dribble/curve.
  startPlayerId?: string;
  endPlayerId?: string;
  // Player-specific
  team?: Team;
  number?: number;
  positionLabel?: string;
  playerName?: string;
  label?: string;
  // Text-specific
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'italic bold';
  textDecoration?: 'underline' | '';
  textAlign?: 'left' | 'center' | 'right';
}

// Default team colors chosen to be distinguishable for the most common
// forms of color blindness (deuteranopia/protanopia): blue vs. orange
// rather than red vs. green.
export const TEAM_COLORS: Record<Team, string> = {
  home: '#2563eb',
  away: '#f97316',
};

// Goalkeepers always stand out from their own team's outfield color.
export const GK_COLOR = 'yellow';

export const PLAYER_PALETTE = [
  'white', 'black', 'red', 'blue', 'yellow', 'green', 'orange', 'purple',
] as const;

export const FONT_FAMILIES = [
  'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Courier New', 'Impact',
] as const;

// Starting content/size/width for a freshly placed text element, keyed by
// which palette item (Title vs. Paragraph) the user dragged/clicked.
export const TEXT_PRESETS: Record<TextSubtype, Pick<BoardElement, 'text' | 'fontSize' | 'fontStyle' | 'width' | 'textAlign'>> = {
  title: { text: 'Title', fontSize: 48, fontStyle: 'bold', width: 400, textAlign: 'left' },
  paragraph: { text: 'Add your text here…', fontSize: 24, fontStyle: 'normal', width: 360, textAlign: 'left' },
};

// A line/arrow/dribble/curve endpoint tied to a player (startPlayerId /
// endPlayerId) tracks that player's live position instead of its own stored
// point. Shared between the canvas renderer and the SVG exporter so a
// connected line always follows the player in both places, not just on
// screen.
export function resolveEffectivePoints(el: BoardElement, elements: BoardElement[]): number[] {
  const pts = el.points ? [...el.points] : [0, 0];
  if (el.startPlayerId) {
    const player = elements.find(e => e.id === el.startPlayerId);
    if (player) {
      pts[0] = player.x - el.x;
      pts[1] = player.y - el.y;
    }
  }
  if (el.endPlayerId) {
    const player = elements.find(e => e.id === el.endPlayerId);
    if (player && pts.length >= 2) {
      pts[pts.length - 2] = player.x - el.x;
      pts[pts.length - 1] = player.y - el.y;
    }
  }
  return pts;
}

// Turns raw SVG source (from a `?raw` import) into a data URI. Used instead
// of a plain asset import so the resulting URL is self-contained - it works
// identically in dev and in a built bundle, and can be embedded directly in
// a standalone exported SVG file without depending on the app's asset host.
export function svgToDataUri(rawSvg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}
