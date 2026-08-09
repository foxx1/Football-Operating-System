import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for the tactical board state
export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  color: string;
  icon: string;
}

export interface DrawingElement {
  id: string;
  type: 'line' | 'arrow' | 'circle' | 'rectangle';
  coordinates: number[];
  color: string;
  width: number;
  opacity?: number;
}

export interface Formation {
  id: string;
  name: string;
  description: string;
  players: Player[];
  category: 'attacking' | 'defensive' | 'balanced' | 'custom';
  popularity: number;
}

export interface TacticalBoardState {
  // Players state
  players: Player[];
  selectedPlayer: Player | null;
  
  // Drawing state
  drawingElements: DrawingElement[];
  currentTool: 'select' | 'line' | 'arrow' | 'circle' | 'rectangle';
  currentColor: string;
  currentWidth: number;
  isDrawing: boolean;
  
  // Formations state
  formations: Formation[];
  currentFormation: Formation | null;
  
  // Board state
  zoomLevel: number;
  panOffset: { x: number; y: number };
  
  // Actions
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setSelectedPlayer: (player: Player | null) => void;
  
  addDrawingElement: (element: DrawingElement) => void;
  updateDrawingElement: (id: string, updates: Partial<DrawingElement>) => void;
  removeDrawingElement: (id: string) => void;
  clearDrawings: () => void;
  
  setCurrentTool: (tool: 'select' | 'line' | 'arrow' | 'circle' | 'rectangle') => void;
  setCurrentColor: (color: string) => void;
  setCurrentWidth: (width: number) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  
  addFormation: (formation: Formation) => void;
  removeFormation: (id: string) => void;
  loadFormation: (formation: Formation) => void;
  setCurrentFormation: (formation: Formation | null) => void;
  
  setZoomLevel: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  resetView: () => void;
  clearBoard: () => void;
}

// Example formations data
const defaultFormations: Formation[] = [
  {
    id: '4-4-2',
    name: '1-4-4-2 Classic',
    description: 'Balanced formation with two strikers and four midfielders',
    category: 'balanced',
    popularity: 95,
    players: [
      { id: '1', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#3b82f6', icon: '🥅' },
      { id: '2', name: 'RB', number: 2, position: 'Right Back', x: 80, y: 70, team: 'home', color: '#3b82f6', icon: '🛡️' },
      { id: '3', name: 'CB', number: 3, position: 'Center Back', x: 60, y: 70, team: 'home', color: '#3b82f6', icon: '🛡️' },
      { id: '4', name: 'CB', number: 4, position: 'Center Back', x: 40, y: 70, team: 'home', color: '#3b82f6', icon: '🛡️' },
      { id: '5', name: 'LB', number: 5, position: 'Left Back', x: 20, y: 70, team: 'home', color: '#3b82f6', icon: '🛡️' },
      { id: '6', name: 'RM', number: 6, position: 'Right Midfielder', x: 75, y: 45, team: 'home', color: '#3b82f6', icon: '⚙️' },
      { id: '7', name: 'CM', number: 7, position: 'Central Midfielder', x: 55, y: 45, team: 'home', color: '#3b82f6', icon: '⚙️' },
      { id: '8', name: 'CM', number: 8, position: 'Central Midfielder', x: 45, y: 45, team: 'home', color: '#3b82f6', icon: '⚙️' },
      { id: '9', name: 'LM', number: 9, position: 'Left Midfielder', x: 25, y: 45, team: 'home', color: '#3b82f6', icon: '⚙️' },
      { id: '10', name: 'ST', number: 10, position: 'Striker', x: 60, y: 25, team: 'home', color: '#3b82f6', icon: '⚽' },
      { id: '11', name: 'ST', number: 11, position: 'Striker', x: 40, y: 25, team: 'home', color: '#3b82f6', icon: '⚽' },
    ]
  },
  {
    id: '4-3-3',
    name: '1-4-3-3 Attack',
    description: 'Attacking formation with three forwards and creative midfield',
    category: 'attacking',
    popularity: 88,
    players: [
      { id: '12', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 10, team: 'away', color: '#ef4444', icon: '🥅' },
      { id: '13', name: 'RB', number: 2, position: 'Right Back', x: 20, y: 30, team: 'away', color: '#ef4444', icon: '🛡️' },
      { id: '14', name: 'CB', number: 3, position: 'Center Back', x: 40, y: 30, team: 'away', color: '#ef4444', icon: '🛡️' },
      { id: '15', name: 'CB', number: 4, position: 'Center Back', x: 60, y: 30, team: 'away', color: '#ef4444', icon: '🛡️' },
      { id: '16', name: 'LB', number: 5, position: 'Left Back', x: 80, y: 30, team: 'away', color: '#ef4444', icon: '🛡️' },
      { id: '17', name: 'CDM', number: 6, position: 'Defensive Midfielder', x: 50, y: 45, team: 'away', color: '#ef4444', icon: '⚙️' },
      { id: '18', name: 'CM', number: 8, position: 'Central Midfielder', x: 35, y: 55, team: 'away', color: '#ef4444', icon: '⚙️' },
      { id: '19', name: 'CM', number: 10, position: 'Attacking Midfielder', x: 65, y: 55, team: 'away', color: '#ef4444', icon: '⚙️' },
      { id: '20', name: 'LW', number: 7, position: 'Left Winger', x: 25, y: 75, team: 'away', color: '#ef4444', icon: '🏃' },
      { id: '21', name: 'ST', number: 9, position: 'Striker', x: 50, y: 75, team: 'away', color: '#ef4444', icon: '⚽' },
      { id: '22', name: 'RW', number: 11, position: 'Right Winger', x: 75, y: 75, team: 'away', color: '#ef4444', icon: '🏃' },
    ]
  },
  {
    id: '3-5-2',
    name: '1-3-5-2 Wing-backs',
    description: 'Formation with wing-backs providing width and two strikers',
    category: 'balanced',
    popularity: 72,
    players: [
      { id: '23', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#10b981', icon: '🥅' },
      { id: '24', name: 'CB', number: 2, position: 'Center Back', x: 65, y: 70, team: 'home', color: '#10b981', icon: '🛡️' },
      { id: '25', name: 'CB', number: 3, position: 'Center Back', x: 50, y: 70, team: 'home', color: '#10b981', icon: '🛡️' },
      { id: '26', name: 'CB', number: 4, position: 'Center Back', x: 35, y: 70, team: 'home', color: '#10b981', icon: '🛡️' },
      { id: '27', name: 'RWB', number: 5, position: 'Right Wing-back', x: 85, y: 50, team: 'home', color: '#10b981', icon: '🏃' },
      { id: '28', name: 'CM', number: 6, position: 'Central Midfielder', x: 65, y: 45, team: 'home', color: '#10b981', icon: '⚙️' },
      { id: '29', name: 'CM', number: 8, position: 'Central Midfielder', x: 50, y: 45, team: 'home', color: '#10b981', icon: '⚙️' },
      { id: '30', name: 'CM', number: 10, position: 'Central Midfielder', x: 35, y: 45, team: 'home', color: '#10b981', icon: '⚙️' },
      { id: '31', name: 'LWB', number: 7, position: 'Left Wing-back', x: 15, y: 50, team: 'home', color: '#10b981', icon: '🏃' },
      { id: '32', name: 'ST', number: 9, position: 'Striker', x: 60, y: 25, team: 'home', color: '#10b981', icon: '⚽' },
      { id: '33', name: 'ST', number: 11, position: 'Striker', x: 40, y: 25, team: 'home', color: '#10b981', icon: '⚽' },
    ]
  },
  {
    id: '5-4-1',
    name: '1-5-4-1 Defensive',
    description: 'Defensive formation with five defenders and solid midfield',
    category: 'defensive',
    popularity: 65,
    players: [
      { id: '34', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#8b5cf6', icon: '🥅' },
      { id: '35', name: 'RB', number: 2, position: 'Right Back', x: 85, y: 70, team: 'home', color: '#8b5cf6', icon: '🛡️' },
      { id: '36', name: 'CB', number: 3, position: 'Center Back', x: 65, y: 70, team: 'home', color: '#8b5cf6', icon: '🛡️' },
      { id: '37', name: 'CB', number: 4, position: 'Center Back', x: 50, y: 70, team: 'home', color: '#8b5cf6', icon: '🛡️' },
      { id: '38', name: 'CB', number: 5, position: 'Center Back', x: 35, y: 70, team: 'home', color: '#8b5cf6', icon: '🛡️' },
      { id: '39', name: 'LB', number: 6, position: 'Left Back', x: 15, y: 70, team: 'home', color: '#8b5cf6', icon: '🛡️' },
      { id: '40', name: 'RM', number: 7, position: 'Right Midfielder', x: 75, y: 45, team: 'home', color: '#8b5cf6', icon: '⚙️' },
      { id: '41', name: 'CM', number: 8, position: 'Central Midfielder', x: 60, y: 45, team: 'home', color: '#8b5cf6', icon: '⚙️' },
      { id: '42', name: 'CM', number: 10, position: 'Central Midfielder', x: 40, y: 45, team: 'home', color: '#8b5cf6', icon: '⚙️' },
      { id: '43', name: 'LM', number: 11, position: 'Left Midfielder', x: 25, y: 45, team: 'home', color: '#8b5cf6', icon: '⚙️' },
      { id: '44', name: 'ST', number: 9, position: 'Striker', x: 50, y: 25, team: 'home', color: '#8b5cf6', icon: '⚽' },
    ]
  },
  {
    id: '4-2-3-1',
    name: '1-4-2-3-1 Modern',
    description: 'Modern formation with two holding midfielders and attacking trio',
    category: 'attacking',
    popularity: 85,
    players: [
      { id: '45', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#f59e0b', icon: '🥅' },
      { id: '46', name: 'RB', number: 2, position: 'Right Back', x: 80, y: 70, team: 'home', color: '#f59e0b', icon: '🛡️' },
      { id: '47', name: 'CB', number: 3, position: 'Center Back', x: 60, y: 70, team: 'home', color: '#f59e0b', icon: '🛡️' },
      { id: '48', name: 'CB', number: 4, position: 'Center Back', x: 40, y: 70, team: 'home', color: '#f59e0b', icon: '🛡️' },
      { id: '49', name: 'LB', number: 5, position: 'Left Back', x: 20, y: 70, team: 'home', color: '#f59e0b', icon: '🛡️' },
      { id: '50', name: 'CDM', number: 6, position: 'Defensive Midfielder', x: 40, y: 55, team: 'home', color: '#f59e0b', icon: '⚙️' },
      { id: '51', name: 'CDM', number: 8, position: 'Defensive Midfielder', x: 60, y: 55, team: 'home', color: '#f59e0b', icon: '⚙️' },
      { id: '52', name: 'LW', number: 7, position: 'Left Winger', x: 25, y: 35, team: 'home', color: '#f59e0b', icon: '🏃' },
      { id: '53', name: 'CAM', number: 10, position: 'Attacking Midfielder', x: 50, y: 35, team: 'home', color: '#f59e0b', icon: '🎯' },
      { id: '54', name: 'RW', number: 11, position: 'Right Winger', x: 75, y: 35, team: 'home', color: '#f59e0b', icon: '🏃' },
      { id: '55', name: 'ST', number: 9, position: 'Striker', x: 50, y: 20, team: 'home', color: '#f59e0b', icon: '⚽' },
    ]
  },
  {
    id: '3-4-3',
    name: '1-3-4-3 Possession',
    description: 'Three center-backs, a flat midfield four, and a front three for total width',
    category: 'attacking',
    popularity: 60,
    players: [
      { id: '56', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#06b6d4', icon: '🥅' },
      { id: '57', name: 'CB', number: 2, position: 'Center Back', x: 68, y: 72, team: 'home', color: '#06b6d4', icon: '🛡️' },
      { id: '58', name: 'CB', number: 3, position: 'Center Back', x: 50, y: 75, team: 'home', color: '#06b6d4', icon: '🛡️' },
      { id: '59', name: 'CB', number: 4, position: 'Center Back', x: 32, y: 72, team: 'home', color: '#06b6d4', icon: '🛡️' },
      { id: '60', name: 'RM', number: 7, position: 'Right Midfielder', x: 82, y: 50, team: 'home', color: '#06b6d4', icon: '⚙️' },
      { id: '61', name: 'CM', number: 8, position: 'Central Midfielder', x: 58, y: 50, team: 'home', color: '#06b6d4', icon: '⚙️' },
      { id: '62', name: 'CM', number: 6, position: 'Central Midfielder', x: 42, y: 50, team: 'home', color: '#06b6d4', icon: '⚙️' },
      { id: '63', name: 'LM', number: 11, position: 'Left Midfielder', x: 18, y: 50, team: 'home', color: '#06b6d4', icon: '⚙️' },
      { id: '64', name: 'RW', number: 9, position: 'Right Winger', x: 75, y: 25, team: 'home', color: '#06b6d4', icon: '🏃' },
      { id: '65', name: 'ST', number: 10, position: 'Striker', x: 50, y: 20, team: 'home', color: '#06b6d4', icon: '⚽' },
      { id: '66', name: 'LW', number: 17, position: 'Left Winger', x: 25, y: 25, team: 'home', color: '#06b6d4', icon: '🏃' },
    ]
  },
  {
    id: '5-2-3',
    name: '1-5-2-3 Ultra-Attacking Wing-backs',
    description: 'Five defenders with attacking wing-backs bombing forward to support a front three',
    category: 'attacking',
    popularity: 40,
    players: [
      { id: '67', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#ec4899', icon: '🥅' },
      { id: '68', name: 'RWB', number: 2, position: 'Right Wing-back', x: 85, y: 62, team: 'home', color: '#ec4899', icon: '🏃' },
      { id: '69', name: 'CB', number: 3, position: 'Center Back', x: 65, y: 74, team: 'home', color: '#ec4899', icon: '🛡️' },
      { id: '70', name: 'CB', number: 4, position: 'Center Back', x: 50, y: 76, team: 'home', color: '#ec4899', icon: '🛡️' },
      { id: '71', name: 'CB', number: 5, position: 'Center Back', x: 35, y: 74, team: 'home', color: '#ec4899', icon: '🛡️' },
      { id: '72', name: 'LWB', number: 6, position: 'Left Wing-back', x: 15, y: 62, team: 'home', color: '#ec4899', icon: '🏃' },
      { id: '73', name: 'CM', number: 8, position: 'Central Midfielder', x: 60, y: 48, team: 'home', color: '#ec4899', icon: '⚙️' },
      { id: '74', name: 'CM', number: 10, position: 'Central Midfielder', x: 40, y: 48, team: 'home', color: '#ec4899', icon: '⚙️' },
      { id: '75', name: 'RW', number: 7, position: 'Right Winger', x: 75, y: 25, team: 'home', color: '#ec4899', icon: '🏃' },
      { id: '76', name: 'ST', number: 9, position: 'Striker', x: 50, y: 20, team: 'home', color: '#ec4899', icon: '⚽' },
      { id: '77', name: 'LW', number: 11, position: 'Left Winger', x: 25, y: 25, team: 'home', color: '#ec4899', icon: '🏃' },
    ]
  },
  {
    id: '4-1-4-1',
    name: '1-4-1-4-1 Balanced',
    description: 'A lone defensive midfielder shields the back four, supporting a wide attacking midfield band',
    category: 'defensive',
    popularity: 55,
    players: [
      { id: '78', name: 'GK', number: 1, position: 'Goalkeeper', x: 50, y: 90, team: 'home', color: '#84cc16', icon: '🥅' },
      { id: '79', name: 'RB', number: 2, position: 'Right Back', x: 80, y: 72, team: 'home', color: '#84cc16', icon: '🛡️' },
      { id: '80', name: 'CB', number: 3, position: 'Center Back', x: 60, y: 74, team: 'home', color: '#84cc16', icon: '🛡️' },
      { id: '81', name: 'CB', number: 4, position: 'Center Back', x: 40, y: 74, team: 'home', color: '#84cc16', icon: '🛡️' },
      { id: '82', name: 'LB', number: 5, position: 'Left Back', x: 20, y: 72, team: 'home', color: '#84cc16', icon: '🛡️' },
      { id: '83', name: 'CDM', number: 6, position: 'Defensive Midfielder', x: 50, y: 58, team: 'home', color: '#84cc16', icon: '⚙️' },
      { id: '84', name: 'RM', number: 7, position: 'Right Midfielder', x: 80, y: 38, team: 'home', color: '#84cc16', icon: '⚙️' },
      { id: '85', name: 'CM', number: 8, position: 'Central Midfielder', x: 58, y: 40, team: 'home', color: '#84cc16', icon: '⚙️' },
      { id: '86', name: 'CM', number: 10, position: 'Central Midfielder', x: 42, y: 40, team: 'home', color: '#84cc16', icon: '⚙️' },
      { id: '87', name: 'LM', number: 11, position: 'Left Midfielder', x: 20, y: 38, team: 'home', color: '#84cc16', icon: '⚙️' },
      { id: '88', name: 'ST', number: 9, position: 'Striker', x: 50, y: 20, team: 'home', color: '#84cc16', icon: '⚽' },
    ]
  }
];

// Create the Zustand store with persistence
export const useTacticalBoard = create<TacticalBoardState>()(
  persist(
    (set, get) => ({
      // Initial state
      players: defaultFormations[0].players,
      selectedPlayer: null,
      
      drawingElements: [],
      currentTool: 'select',
      currentColor: '#ffffff',
      currentWidth: 2,
      isDrawing: false,
      
      formations: defaultFormations,
      currentFormation: defaultFormations[0],
      
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
      
      // Player actions
      setPlayers: (players) => set({ players }),
      
      addPlayer: (player) => set((state) => ({
        players: [...state.players, player]
      })),
      
      updatePlayer: (id, updates) => set((state) => ({
        players: state.players.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),
      
      removePlayer: (id) => set((state) => ({
        players: state.players.filter(p => p.id !== id),
        selectedPlayer: state.selectedPlayer?.id === id ? null : state.selectedPlayer
      })),
      
      setSelectedPlayer: (player) => set({ selectedPlayer: player }),
      
      // Drawing actions
      addDrawingElement: (element) => set((state) => ({
        drawingElements: [...state.drawingElements, element]
      })),
      
      updateDrawingElement: (id, updates) => set((state) => ({
        drawingElements: state.drawingElements.map(el => 
          el.id === id ? { ...el, ...updates } : el
        )
      })),
      
      removeDrawingElement: (id) => set((state) => ({
        drawingElements: state.drawingElements.filter(el => el.id !== id)
      })),
      
      clearDrawings: () => set({ drawingElements: [] }),
      
      // Tool actions
      setCurrentTool: (tool) => set({ currentTool: tool }),
      setCurrentColor: (color) => set({ currentColor: color }),
      setCurrentWidth: (width) => set({ currentWidth: width }),
      setIsDrawing: (isDrawing) => set({ isDrawing }),
      
      // Formation actions
      addFormation: (formation) => set((state) => ({
        formations: [...state.formations, formation]
      })),
      
      removeFormation: (id) => set((state) => ({
        formations: state.formations.filter(f => f.id !== id),
        currentFormation: state.currentFormation?.id === id ? null : state.currentFormation
      })),
      
      loadFormation: (formation) => set({
        players: formation.players,
        currentFormation: formation
      }),
      
      setCurrentFormation: (formation) => set({ currentFormation: formation }),
      
      // View actions
      setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(3, zoom)) }),
      setPanOffset: (offset) => set({ panOffset: offset }),
      resetView: () => set({ zoomLevel: 1, panOffset: { x: 0, y: 0 } }),
      
      // Utility actions
      clearBoard: () => set({
        players: [],
        drawingElements: [],
        selectedPlayer: null,
        currentFormation: null
      })
    }),
    {
      name: 'tactical-board-storage',
      partialize: (state) => ({
        formations: state.formations,
        currentFormation: state.currentFormation,
        zoomLevel: state.zoomLevel,
        panOffset: state.panOffset
      })
    }
  )
);

// Helper functions for working with formations
export const getFormationsByCategory = (category: Formation['category']) => {
  return useTacticalBoard.getState().formations.filter(f => f.category === category);
};

export const getPopularFormations = (limit = 3) => {
  return useTacticalBoard.getState().formations
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

export const createCustomFormation = (name: string, description: string, players: Player[]): Formation => {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    players,
    category: 'custom',
    popularity: 0
  };
};