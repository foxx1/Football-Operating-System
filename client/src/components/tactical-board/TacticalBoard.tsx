import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Download, 
  Edit, 
  Move, 
  Pencil, 
  ArrowRight,
  Circle,
  Square,
  Trash2,
  Save
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface Player {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  team: 'home' | 'away';
}

interface DrawingElement {
  id: string;
  type: 'line' | 'arrow' | 'circle' | 'rectangle';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
}

type Tool = 'select' | 'draw' | 'line' | 'arrow' | 'circle' | 'rectangle';

const TacticalBoard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Initialize with default formation (4-4-2 vs 4-3-3)
  useEffect(() => {
    const defaultFormation: Player[] = [
      // Home team (blue) - 4-4-2
      { id: '1', name: 'GK', number: 1, x: 50, y: 90, team: 'home' },
      { id: '2', name: 'RB', number: 2, x: 80, y: 70, team: 'home' },
      { id: '3', name: 'CB', number: 3, x: 60, y: 70, team: 'home' },
      { id: '4', name: 'CB', number: 4, x: 40, y: 70, team: 'home' },
      { id: '5', name: 'LB', number: 5, x: 20, y: 70, team: 'home' },
      { id: '6', name: 'RM', number: 6, x: 75, y: 45, team: 'home' },
      { id: '7', name: 'CM', number: 7, x: 55, y: 45, team: 'home' },
      { id: '8', name: 'CM', number: 8, x: 45, y: 45, team: 'home' },
      { id: '9', name: 'LM', number: 9, x: 25, y: 45, team: 'home' },
      { id: '10', name: 'ST', number: 10, x: 60, y: 25, team: 'home' },
      { id: '11', name: 'ST', number: 11, x: 40, y: 25, team: 'home' },
      // Away team (red) - 4-3-3
      { id: '12', name: 'GK', number: 1, x: 50, y: 10, team: 'away' },
      { id: '13', name: 'RB', number: 2, x: 20, y: 30, team: 'away' },
      { id: '14', name: 'CB', number: 3, x: 40, y: 30, team: 'away' },
      { id: '15', name: 'CB', number: 4, x: 60, y: 30, team: 'away' },
      { id: '16', name: 'LB', number: 5, x: 80, y: 30, team: 'away' },
      { id: '17', name: 'CDM', number: 6, x: 50, y: 45, team: 'away' },
      { id: '18', name: 'CM', number: 8, x: 35, y: 55, team: 'away' },
      { id: '19', name: 'CM', number: 10, x: 65, y: 55, team: 'away' },
      { id: '20', name: 'LW', number: 7, x: 25, y: 75, team: 'away' },
      { id: '21', name: 'ST', number: 9, x: 50, y: 75, team: 'away' },
      { id: '22', name: 'RW', number: 11, x: 75, y: 75, team: 'away' },
    ];
    setPlayers(defaultFormation);
  }, []);

  const getBoardCoordinates = (clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    
    if (selectedTool === 'select') return;
    
    if (['line', 'arrow', 'circle', 'rectangle'].includes(selectedTool)) {
      setIsDrawing(true);
      const newElement: DrawingElement = {
        id: Date.now().toString(),
        type: selectedTool as 'line' | 'arrow' | 'circle' | 'rectangle',
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: '#ef4444',
        strokeWidth: 2
      };
      setCurrentDrawing(newElement);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    setCurrentDrawing({
      ...currentDrawing,
      endX: x,
      endY: y
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawingElements(prev => [...prev, currentDrawing]);
      setCurrentDrawing(null);
      setIsDrawing(false);
    }
  };

  const handlePlayerMouseDown = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    if (selectedTool !== 'select') return;
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    setDraggedPlayer(playerId);
    setDragOffset({
      x: x - player.x,
      y: y - player.y
    });
    setSelectedPlayer(playerId);
  };

  const handlePlayerDrag = (e: React.MouseEvent) => {
    if (!draggedPlayer) return;
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    setPlayers(prev => prev.map(player => 
      player.id === draggedPlayer 
        ? { ...player, x: x - dragOffset.x, y: y - dragOffset.y }
        : player
    ));
  };

  const handlePlayerDragEnd = () => {
    setDraggedPlayer(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const addPlayer = () => {
    if (!newPlayerName || !newPlayerNumber) {
      toast({
        title: "Error",
        description: "Please enter both name and number",
        variant: "destructive"
      });
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName,
      number: parseInt(newPlayerNumber),
      x: 50,
      y: 50,
      team: selectedTeam
    };

    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
    setNewPlayerNumber('');
    toast({
      title: "Player added",
      description: `${newPlayerName} (#${newPlayerNumber}) added to ${selectedTeam} team`
    });
  };

  const removePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    if (selectedPlayer === playerId) {
      setSelectedPlayer(null);
    }
  };

  const clearBoard = () => {
    setDrawingElements([]);
    setSelectedPlayer(null);
  };

  const exportToPNG = async () => {
    if (!boardRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(boardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#15803d'
      });
      
      const link = document.createElement('a');
      link.download = `tactical-board-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export successful",
        description: "Tactical board exported as PNG"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export the tactical board",
        variant: "destructive"
      });
    }
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  const renderDrawingElement = (element: DrawingElement) => {
    const { startX, startY, endX, endY, color, strokeWidth } = element;
    
    switch (element.type) {
      case 'line':
        return (
          <line
            key={element.id}
            x1={`${startX}%`}
            y1={`${startY}%`}
            x2={`${endX}%`}
            y2={`${endY}%`}
            stroke={color}
            strokeWidth={strokeWidth}
            className="pointer-events-none"
          />
        );
      case 'arrow':
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 3;
        const arrowAngle = Math.PI / 6;
        
        return (
          <g key={element.id}>
            <line
              x1={`${startX}%`}
              y1={`${startY}%`}
              x2={`${endX}%`}
              y2={`${endY}%`}
              stroke={color}
              strokeWidth={strokeWidth}
              className="pointer-events-none"
            />
            <polygon
              points={`${endX},${endY} ${endX - arrowLength * Math.cos(angle - arrowAngle)},${endY - arrowLength * Math.sin(angle - arrowAngle)} ${endX - arrowLength * Math.cos(angle + arrowAngle)},${endY - arrowLength * Math.sin(angle + arrowAngle)}`}
              fill={color}
              className="pointer-events-none"
            />
          </g>
        );
      case 'circle':
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
        return (
          <circle
            key={element.id}
            cx={`${(startX + endX) / 2}%`}
            cy={`${(startY + endY) / 2}%`}
            r={`${radius}%`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            className="pointer-events-none"
          />
        );
      case 'rectangle':
        return (
          <rect
            key={element.id}
            x={`${Math.min(startX, endX)}%`}
            y={`${Math.min(startY, endY)}%`}
            width={`${Math.abs(endX - startX)}%`}
            height={`${Math.abs(endY - startY)}%`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            className="pointer-events-none"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tactical Board</h1>
          <p className="text-muted-foreground">Design your team formations and tactics</p>
        </div>
        
        {/* Export and Zoom Controls */}
        <div className="flex gap-2">
          <Button onClick={zoomOut} variant="outline" size="sm">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm bg-muted rounded flex items-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button onClick={zoomIn} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
          <Button onClick={exportToPNG} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Control Panel */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tools */}
            <div>
              <h3 className="font-semibold mb-3">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedTool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('select')}
                  className="flex flex-col h-auto py-2"
                >
                  <Move className="h-4 w-4 mb-1" />
                  <span className="text-xs">Select</span>
                </Button>
                <Button
                  variant={selectedTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('line')}
                  className="flex flex-col h-auto py-2"
                >
                  <Pencil className="h-4 w-4 mb-1" />
                  <span className="text-xs">Line</span>
                </Button>
                <Button
                  variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('arrow')}
                  className="flex flex-col h-auto py-2"
                >
                  <ArrowRight className="h-4 w-4 mb-1" />
                  <span className="text-xs">Arrow</span>
                </Button>
                <Button
                  variant={selectedTool === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('circle')}
                  className="flex flex-col h-auto py-2"
                >
                  <Circle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Circle</span>
                </Button>
                <Button
                  variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool('rectangle')}
                  className="flex flex-col h-auto py-2 col-span-2"
                >
                  <Square className="h-4 w-4 mb-1" />
                  <span className="text-xs">Rectangle</span>
                </Button>
              </div>
            </div>

            {/* Add Player */}
            <div>
              <h3 className="font-semibold mb-3">Add Player</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTeam === 'home' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam('home')}
                  >
                    Home
                  </Button>
                  <Button
                    variant={selectedTeam === 'away' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTeam('away')}
                  >
                    Away
                  </Button>
                </div>
                <Input
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Number"
                  value={newPlayerNumber}
                  onChange={(e) => setNewPlayerNumber(e.target.value)}
                />
                <Button onClick={addPlayer} className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={clearBoard} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Drawings
                </Button>
              </div>
            </div>

            {/* Player List */}
            <div>
              <h3 className="font-semibold mb-3">Players</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {players.map(player => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      selectedPlayer === player.id ? 'bg-primary/10' : 'bg-muted/50'
                    }`}
                  >
                    <span className={`font-medium ${
                      player.team === 'home' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      #{player.number} {player.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePlayer(player.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Football Field */}
        <Card className="xl:col-span-3">
          <CardContent className="p-0">
            <div 
              ref={boardRef}
              className="relative w-full bg-green-600 aspect-[3/2] overflow-hidden rounded-lg cursor-crosshair"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Field markings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Field lines */}
                <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="white" strokeWidth="2" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" />
                <circle cx="50%" cy="50%" r="15%" fill="none" stroke="white" strokeWidth="2" />
                <circle cx="50%" cy="50%" r="1%" fill="white" />
                
                {/* Goal areas */}
                <rect x="35%" y="0" width="30%" height="15%" fill="none" stroke="white" strokeWidth="2" />
                <rect x="35%" y="85%" width="30%" height="15%" fill="none" stroke="white" strokeWidth="2" />
                
                {/* Penalty areas */}
                <rect x="25%" y="0" width="50%" height="25%" fill="none" stroke="white" strokeWidth="2" />
                <rect x="25%" y="75%" width="50%" height="25%" fill="none" stroke="white" strokeWidth="2" />
                
                {/* Penalty spots */}
                <circle cx="50%" cy="18%" r="0.8%" fill="white" />
                <circle cx="50%" cy="82%" r="0.8%" fill="white" />
                
                {/* Corner arcs */}
                <path d="M 0 0 A 5 5 0 0 0 5% 5%" fill="none" stroke="white" strokeWidth="2" />
                <path d="M 100% 0 A 5 5 0 0 1 95% 5%" fill="none" stroke="white" strokeWidth="2" />
                <path d="M 0 100% A 5 5 0 0 1 5% 95%" fill="none" stroke="white" strokeWidth="2" />
                <path d="M 100% 100% A 5 5 0 0 0 95% 95%" fill="none" stroke="white" strokeWidth="2" />

                {/* Drawing elements */}
                {drawingElements.map(renderDrawingElement)}
                {currentDrawing && renderDrawingElement(currentDrawing)}
              </svg>

              {/* Players */}
              {players.map(player => (
                <div
                  key={player.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none ${
                    selectedPlayer === player.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                    zIndex: 10
                  }}
                  onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
                  onMouseMove={handlePlayerDrag}
                  onMouseUp={handlePlayerDragEnd}
                >
                  <div className={`
                    w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-lg
                    ${player.team === 'home' ? 'bg-blue-600' : 'bg-red-600'}
                    hover:scale-110 transition-transform
                  `}>
                    {player.number}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                    <span className="bg-black/70 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
                      {player.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TacticalBoard;