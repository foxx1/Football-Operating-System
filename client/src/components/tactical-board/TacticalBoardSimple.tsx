import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Download, 
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
import { useTacticalBoard, type Player, type DrawingElement } from '@/stores/tacticalBoardStore';
import footballPitchSvg from '@/assets/football-pitch.svg';

const TacticalBoardSimple: React.FC = () => {
  // Zustand store state
  const {
    players,
    selectedPlayer,
    drawingElements,
    currentTool,
    currentColor,
    currentWidth,
    isDrawing,
    zoomLevel,
    formations,
    setPlayers,
    addPlayer,
    updatePlayer,
    removePlayer,
    setSelectedPlayer,
    addDrawingElement,
    clearDrawings,
    setCurrentTool,
    setCurrentColor,
    setCurrentWidth,
    setIsDrawing,
    setZoomLevel,
    resetView,
    loadFormation
  } = useTacticalBoard();

  // Local component state for UI interactions
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  
  const boardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getBoardCoordinates = (clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handlePlayerMouseDown = (playerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    setDraggedPlayer(playerId);
    setSelectedPlayer(player);
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: x - player.x,
      y: y - player.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedPlayer) return;
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    
    updatePlayer(draggedPlayer, {
      x: Math.max(0, Math.min(100, newX)),
      y: Math.max(0, Math.min(100, newY))
    });
  };

  const handleMouseUp = () => {
    setDraggedPlayer(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleAddPlayer = () => {
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
      position: selectedTeam === 'home' ? 'Player' : 'Player',
      x: 50,
      y: 50,
      team: selectedTeam,
      color: selectedTeam === 'home' ? '#3b82f6' : '#ef4444',
      icon: '⚽'
    };

    addPlayer(newPlayer);
    setNewPlayerName('');
    setNewPlayerNumber('');
    toast({
      title: "Player added",
      description: `${newPlayerName} (#${newPlayerNumber}) added to ${selectedTeam} team`
    });
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayer(playerId);
    if (selectedPlayer?.id === playerId) {
      setSelectedPlayer(null);
    }
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Football Field */}
      <div className="flex-1">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              Football Tactical Board
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Control Bar */}
            <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Button
                variant={currentTool === 'select' ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool('select')}
              >
                <Move className="w-4 h-4 mr-1" />
                Select
              </Button>
              <Button
                variant={currentTool === 'line' ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool('line')}
              >
                <Minus className="w-4 h-4 mr-1" />
                Line
              </Button>
              <Button
                variant={currentTool === 'arrow' ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool('arrow')}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Arrow
              </Button>
              <Button
                variant={currentTool === 'circle' ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool('circle')}
              >
                <Circle className="w-4 h-4 mr-1" />
                Circle
              </Button>
              <Button
                variant={currentTool === 'rectangle' ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool('rectangle')}
              >
                <Square className="w-4 h-4 mr-1" />
                Rectangle
              </Button>
              
              <div className="border-l mx-2"></div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(zoomLevel + 0.1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2 py-1">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(zoomLevel - 0.1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              
              <Button variant="outline" size="sm" onClick={clearDrawings}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportToPNG}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>

            {/* Football Field */}
            <div 
              ref={boardRef}
              className="relative w-full rounded-lg overflow-hidden shadow-inner"
              style={{ 
                paddingBottom: '66.67%', // 3:2 aspect ratio to match SVG
                backgroundImage: `url(${footballPitchSvg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >

              {/* Players */}
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`absolute w-8 h-8 rounded-full border-2 border-white cursor-move flex items-center justify-center text-white text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${
                    selectedPlayer?.id === player.id ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                  }`}
                  style={{
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                    backgroundColor: player.color
                  }}
                  onMouseDown={(e) => handlePlayerMouseDown(player.id, e)}
                  title={`${player.name} (#${player.number})`}
                >
                  {player.number}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Panel */}
      <div className="w-full lg:w-80 space-y-6">
        {/* Formation Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Formations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {formations.slice(0, 3).map((formation) => (
              <Button
                key={formation.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loadFormation(formation)}
              >
                {formation.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Add Player */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedTeam === 'home' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTeam('home')}
              >
                Home
              </Button>
              <Button
                variant={selectedTeam === 'away' ? "default" : "outline"}
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
              placeholder="Number"
              type="number"
              value={newPlayerNumber}
              onChange={(e) => setNewPlayerNumber(e.target.value)}
            />
            <Button onClick={handleAddPlayer} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </CardContent>
        </Card>

        {/* Player List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Players ({players.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-48 overflow-y-auto space-y-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    selectedPlayer?.id === player.id ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-xs text-white font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.number}
                    </div>
                    <span>{player.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePlayer(player.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TacticalBoardSimple;