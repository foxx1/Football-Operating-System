export interface Player {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  team: 'home' | 'away';
}

export interface DrawingTool {
  id: string;
  type: 'arrow' | 'line' | 'circle' | 'square' | 'cone' | 'ball' | 'flag';
  name: string;
  icon: React.ReactNode;
  color: string;
  size: number;
  x: number;
  y: number;
  isDraggable: boolean;
  dashed?: boolean;
}

export interface DrawingElement {
  id: string;
  type: 'arrow' | 'line' | 'circle' | 'square' | 'cone' | 'ball' | 'flag';
  x: number;
  y: number;
  width?: number;
  height?: number;
  color: string;
  size: number;
  rotation?: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  length?: number;
  radius?: number;
  dashed?: boolean;
}

export interface Formation {
  id: string;
  name: string;
  players: Player[];
}