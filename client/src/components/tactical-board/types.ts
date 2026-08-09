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

// Turns raw SVG source (from a `?raw` import) into a data URI. Used instead
// of a plain asset import so the resulting URL is self-contained - it works
// identically in dev and in a built bundle, and can be embedded directly in
// a standalone exported SVG file without depending on the app's asset host.
export function svgToDataUri(rawSvg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}
