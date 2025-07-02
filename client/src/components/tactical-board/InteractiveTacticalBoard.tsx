import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Save,
  MousePointer,
  Palette,
  Settings
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import footballPitchSvg from '@/assets/football-pitch.svg';

interface Player {
  id: string;
  name: string;
  number: number;
  x: number;
  y: number;
  team: 'home' | 'away';
}

interface DrawingTool {
  id: string;
  type: 'arrow' | 'line' | 'circle' | 'square' | 'cone' | 'ball' | 'flag';
  name: string;
  icon: React.ReactNode;
  color: string;
  size: number;
  x: number;
  y: number;
  isDraggable: boolean;
}

interface DrawingElement {
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
  length?: number; // For lines and arrows
  radius?: number; // For circles
}

const InteractiveTacticalBoard: React.FC = () => {
  // Board state
  const [players, setPlayers] = useState<Player[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [selectedTool, setSelectedTool] = useState<DrawingTool | null>(null);
  const [toolColor, setToolColor] = useState('#ffffff');
  const [toolSize, setToolSize] = useState(3);
  const [currentMode, setCurrentMode] = useState<'select' | 'draw' | 'player'>('select');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawingStart, setDrawingStart] = useState({ x: 0, y: 0 });
  const [drawingEnd, setDrawingEnd] = useState({ x: 0, y: 0 });
  const [previewElement, setPreviewElement] = useState<DrawingElement | null>(null);
  
  const boardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Available drawing tools
  const drawingTools: Omit<DrawingTool, 'x' | 'y' | 'id' | 'isDraggable'>[] = [
    { type: 'arrow', name: 'Pass Arrow', icon: <ArrowRight className="w-4 h-4" />, color: '#00ff00', size: 3 },
    { type: 'arrow', name: 'Run Arrow', icon: <ArrowRight className="w-4 h-4 transform rotate-45" />, color: '#ff0000', size: 3 },
    { type: 'line', name: 'Formation Line', icon: <Minus className="w-4 h-4" />, color: '#ffffff', size: 2 },
    { type: 'circle', name: 'Zone Circle', icon: <Circle className="w-4 h-4" />, color: '#ffff00', size: 4 },
    { type: 'square', name: 'Area Marker', icon: <Square className="w-4 h-4" />, color: '#00ffff', size: 4 },
    { type: 'cone', name: 'Training Cone', icon: <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-orange-500" />, color: '#ff8c00', size: 2 },
    { type: 'ball', name: 'Football', icon: <Circle className="w-4 h-4 fill-current" />, color: '#8b4513', size: 2 },
    { type: 'flag', name: 'Corner Flag', icon: <div className="w-1 h-4 bg-yellow-400 relative"><div className="absolute top-0 left-1 w-2 h-2 bg-red-500"></div></div>, color: '#ffff00', size: 1 }
  ];

  // Preset formations
  const formations = {
    '4-4-2': [
      { name: 'GK', number: 1, x: 50, y: 90, team: 'home' as const },
      { name: 'RB', number: 2, x: 75, y: 70, team: 'home' as const },
      { name: 'CB', number: 3, x: 60, y: 70, team: 'home' as const },
      { name: 'CB', number: 4, x: 40, y: 70, team: 'home' as const },
      { name: 'LB', number: 5, x: 25, y: 70, team: 'home' as const },
      { name: 'RM', number: 6, x: 70, y: 45, team: 'home' as const },
      { name: 'CM', number: 7, x: 55, y: 45, team: 'home' as const },
      { name: 'CM', number: 8, x: 45, y: 45, team: 'home' as const },
      { name: 'LM', number: 9, x: 30, y: 45, team: 'home' as const },
      { name: 'ST', number: 10, x: 40, y: 25, team: 'home' as const },
      { name: 'ST', number: 11, x: 60, y: 25, team: 'home' as const }
    ],
    '4-3-3': [
      { name: 'GK', number: 1, x: 50, y: 90, team: 'home' as const },
      { name: 'RB', number: 2, x: 75, y: 70, team: 'home' as const },
      { name: 'CB', number: 3, x: 60, y: 70, team: 'home' as const },
      { name: 'CB', number: 4, x: 40, y: 70, team: 'home' as const },
      { name: 'LB', number: 5, x: 25, y: 70, team: 'home' as const },
      { name: 'CDM', number: 6, x: 50, y: 55, team: 'home' as const },
      { name: 'CM', number: 7, x: 65, y: 45, team: 'home' as const },
      { name: 'CM', number: 8, x: 35, y: 45, team: 'home' as const },
      { name: 'RW', number: 9, x: 75, y: 25, team: 'home' as const },
      { name: 'ST', number: 10, x: 50, y: 20, team: 'home' as const },
      { name: 'LW', number: 11, x: 25, y: 25, team: 'home' as const }
    ]
  };

  const getBoardCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!boardRef.current) return { x: 0, y: 0 };
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, []);

  const handleBoardMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentMode !== 'draw' || !selectedTool) return;
    
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    
    // For shapes that need size adjustment (line, arrow, circle, square)
    if (['line', 'arrow', 'circle', 'square'].includes(selectedTool.type)) {
      setIsDrawingShape(true);
      setDrawingStart({ x, y });
      setDrawingEnd({ x, y });
      
      // Create preview element
      const preview: DrawingElement = {
        id: 'preview',
        type: selectedTool.type,
        x,
        y,
        color: toolColor,
        size: toolSize,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        width: 0,
        height: 0,
        length: 0,
        radius: 0
      };
      setPreviewElement(preview);
    } else {
      // For fixed-size elements (cone, ball, flag)
      const newElement: DrawingElement = {
        id: `element-${Date.now()}`,
        type: selectedTool.type,
        x,
        y,
        color: toolColor,
        size: toolSize
      };

      setDrawingElements(prev => [...prev, newElement]);
      
      toast({
        title: "Drawing Element Added",
        description: `${selectedTool.name} placed on the field`
      });
    }
  }, [currentMode, selectedTool, toolColor, toolSize, getBoardCoordinates, toast]);

  const handleElementMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMode !== 'select') return;
    
    const element = drawingElements.find(el => el.id === elementId);
    if (!element) return;

    setDraggedElement(elementId);
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: x - element.x,
      y: y - element.y
    });
  }, [currentMode, drawingElements, getBoardCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);
    
    // Handle shape drawing
    if (isDrawingShape && previewElement) {
      setDrawingEnd({ x, y });
      
      const startX = drawingStart.x;
      const startY = drawingStart.y;
      const endX = x;
      const endY = y;
      
      // Calculate dimensions based on shape type
      let updatedPreview = { ...previewElement };
      
      if (previewElement.type === 'line' || previewElement.type === 'arrow') {
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX);
        
        updatedPreview = {
          ...previewElement,
          x: startX,
          y: startY,
          endX,
          endY,
          length,
          rotation: angle * (180 / Math.PI)
        };
      } else if (previewElement.type === 'circle') {
        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        updatedPreview = {
          ...previewElement,
          x: startX,
          y: startY,
          radius,
          width: radius * 2,
          height: radius * 2
        };
      } else if (previewElement.type === 'square') {
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        updatedPreview = {
          ...previewElement,
          x: Math.min(startX, endX) + width / 2,
          y: Math.min(startY, endY) + height / 2,
          width,
          height
        };
      }
      
      setPreviewElement(updatedPreview);
      return;
    }
    
    // Handle element dragging
    if (!draggedElement) return;
    
    const newX = x - dragOffset.x;
    const newY = y - dragOffset.y;
    
    setDrawingElements(prev => prev.map(el => 
      el.id === draggedElement 
        ? { ...el, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) }
        : el
    ));
  }, [draggedElement, dragOffset, getBoardCoordinates, isDrawingShape, previewElement, drawingStart]);

  const handleMouseUp = useCallback(() => {
    // Finalize shape drawing
    if (isDrawingShape && previewElement && selectedTool) {
      // Only add if there's meaningful size
      const hasSize = previewElement.length && previewElement.length > 5 || 
                     previewElement.radius && previewElement.radius > 2 ||
                     previewElement.width && previewElement.width > 5;
      
      if (hasSize) {
        const finalElement: DrawingElement = {
          ...previewElement,
          id: `element-${Date.now()}`
        };
        
        setDrawingElements(prev => [...prev, finalElement]);
        
        toast({
          title: "Drawing Element Added",
          description: `${selectedTool.name} created with custom size`
        });
      }
      
      setIsDrawingShape(false);
      setPreviewElement(null);
      setDrawingStart({ x: 0, y: 0 });
      setDrawingEnd({ x: 0, y: 0 });
    }
    
    setDraggedElement(null);
  }, [isDrawingShape, previewElement, selectedTool, toast]);

  const loadFormation = (formation: string) => {
    const formationData = formations[formation as keyof typeof formations];
    if (!formationData) return;

    const newPlayers = formationData.map(player => ({
      id: `player-${player.number}`,
      name: player.name,
      number: player.number,
      x: player.x,
      y: player.y,
      team: player.team
    }));

    setPlayers(newPlayers);
    toast({
      title: "Formation Loaded",
      description: `${formation} formation applied successfully`
    });
  };

  const clearAll = () => {
    setDrawingElements([]);
    setPlayers([]);
    toast({
      title: "Board Cleared",
      description: "All elements removed from the tactical board"
    });
  };

  const exportBoard = async () => {
    if (!boardRef.current) return;
    
    try {
      const dataUrl = await htmlToImage.toPng(boardRef.current);
      const link = document.createElement('a');
      link.download = 'tactical-board.png';
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Export Successful",
        description: "Tactical board exported as PNG image"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not export the tactical board",
        variant: "destructive"
      });
    }
  };

  const renderDrawingElement = (element: DrawingElement) => {
    const baseStyle = {
      position: 'absolute' as const,
      cursor: currentMode === 'select' ? 'move' : 'default',
      zIndex: element.id === 'preview' ? 5 : 10,
      opacity: element.id === 'preview' ? 0.7 : 1
    };

    switch (element.type) {
      case 'arrow':
        if (element.endX !== undefined && element.endY !== undefined && element.rotation !== undefined) {
          // Dynamic arrow with custom length
          const length = element.length || 50;
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${Math.max(length * 2, 20)}px`,
                height: `${element.size * 2}px`,
                transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                transformOrigin: 'center'
              }}
              onMouseDown={(e) => element.id !== 'preview' && handleElementMouseDown(element.id, e)}
            >
              <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(length * 2, 20)} ${element.size * 2}`}>
                <defs>
                  <marker
                    id={`arrowhead-${element.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                    fill={element.color}
                  >
                    <polygon points="0 0, 10 3.5, 0 7" />
                  </marker>
                </defs>
                <line
                  x1="0"
                  y1={element.size}
                  x2={Math.max(length * 2, 20)}
                  y2={element.size}
                  stroke={element.color}
                  strokeWidth={element.size}
                  markerEnd={`url(#arrowhead-${element.id})`}
                  strokeDasharray={element.color === '#ff0000' ? '5,5' : 'none'}
                />
              </svg>
            </div>
          );
        }
        // Fallback for regular arrow
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
            className="flex items-center justify-center"
          >
            <ArrowRight 
              size={element.size * 8} 
              color={element.color}
              className={element.color === '#ff0000' ? 'animate-pulse' : ''}
            />
          </div>
        );
      
      case 'line':
        if (element.endX !== undefined && element.endY !== undefined && element.rotation !== undefined) {
          // Dynamic line with custom length
          const length = element.length || 50;
          return (
            <div
              key={element.id}
              style={{
                ...baseStyle,
                left: `${element.x}%`,
                top: `${element.y}%`,
                width: `${Math.max(length * 2, 10)}px`,
                height: `${element.size}px`,
                backgroundColor: element.color,
                transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                transformOrigin: 'center'
              }}
              onMouseDown={(e) => element.id !== 'preview' && handleElementMouseDown(element.id, e)}
            />
          );
        }
        // Fallback for regular line
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size * 20}px`,
              height: '2px',
              backgroundColor: element.color,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
          />
        );
      
      case 'circle':
        const circleSize = element.radius ? element.radius * 2 : element.size * 15;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${Math.max(circleSize, 10)}px`,
              height: `${Math.max(circleSize, 10)}px`,
              border: `2px solid ${element.color}`,
              borderRadius: '50%',
              backgroundColor: 'transparent',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => element.id !== 'preview' && handleElementMouseDown(element.id, e)}
          />
        );
      
      case 'square':
        const squareWidth = element.width || element.size * 15;
        const squareHeight = element.height || element.size * 15;
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${Math.max(squareWidth, 10)}px`,  
              height: `${Math.max(squareHeight, 10)}px`,
              border: `2px solid ${element.color}`,
              backgroundColor: 'transparent',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => element.id !== 'preview' && handleElementMouseDown(element.id, e)}
          />
        );
      
      case 'cone':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
          >
            <div 
              className="border-l-4 border-r-4 border-b-8 border-transparent"
              style={{
                borderBottomColor: element.color,
                borderLeftWidth: element.size * 3,
                borderRightWidth: element.size * 3,
                borderBottomWidth: element.size * 6
              }}
            />
          </div>
        );
      
      case 'ball':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.size * 10}px`,
              height: `${element.size * 10}px`,
              backgroundColor: element.color,
              borderRadius: '50%',
              border: '1px solid #000',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
          />
        );
      
      case 'flag':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={(e) => handleElementMouseDown(element.id, e)}
            className="flex flex-col items-center"
          >
            <div 
              className="bg-red-500 mb-1"
              style={{
                width: `${element.size * 8}px`,
                height: `${element.size * 6}px`
              }}
            />
            <div 
              className="bg-yellow-400"
              style={{
                width: '2px',
                height: `${element.size * 12}px`
              }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Tools */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tactical Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Mode Selection */}
          <div>
            <h3 className="font-semibold mb-3">Mode</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={currentMode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('select')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <MousePointer className="w-4 h-4" />
                <span className="text-xs">Select</span>
              </Button>
              <Button
                variant={currentMode === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('draw')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Pencil className="w-4 h-4" />
                <span className="text-xs">Draw</span>
              </Button>
              <Button
                variant={currentMode === 'player' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('player')}
                className="flex flex-col items-center gap-1 h-auto py-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs">Player</span>
              </Button>
            </div>
          </div>

          {/* Drawing Tools */}
          <div>
            <h3 className="font-semibold mb-3">Drawing Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {drawingTools.map((tool, index) => (
                <Button
                  key={`${tool.type}-${index}`}
                  variant={selectedTool?.type === tool.type && selectedTool?.name === tool.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTool({
                    ...tool,
                    id: `tool-${index}`,
                    x: 0,
                    y: 0,
                    isDraggable: true
                  })}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  {tool.icon}
                  <span className="text-xs text-center">{tool.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Tool Properties */}
          {selectedTool && (
            <div className="space-y-4">
              <h3 className="font-semibold">Tool Properties</h3>
              
              {/* Color Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff8c00', '#8b4513', '#00ffff'].map(color => (
                    <button
                      key={color}
                      onClick={() => setToolColor(color)}
                      className={`w-8 h-8 rounded border-2 ${toolColor === color ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={toolColor}
                  onChange={(e) => setToolColor(e.target.value)}
                  className="mt-2 w-full h-10"
                />
              </div>

              {/* Size Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Size: {toolSize}</label>
                <Slider
                  value={[toolSize]}
                  onValueChange={(value) => setToolSize(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Formations */}
          <div>
            <h3 className="font-semibold mb-3">Formations</h3>
            <Select onValueChange={loadFormation}>
              <SelectTrigger>
                <SelectValue placeholder="Select Formation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4-4-2">4-4-2</SelectItem>
                <SelectItem value="4-3-3">4-3-3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button onClick={clearAll} variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button onClick={exportBoard} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export PNG
            </Button>
          </div>
        </CardContent>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Interactive Tactical Board</h1>
            <div className="text-sm text-gray-600">
              Mode: <span className="font-medium capitalize">{currentMode}</span>
              {selectedTool && ` | Tool: ${selectedTool.name}`}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(1)}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Football Pitch */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div
            ref={boardRef}
            className="relative bg-green-600 border-4 border-white rounded-lg shadow-2xl cursor-crosshair"
            style={{
              width: `${800 * zoomLevel}px`,
              height: `${520 * zoomLevel}px`,
              backgroundImage: `url(${footballPitchSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            onMouseDown={handleBoardMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Players */}
            {players.map((player) => (
              <div
                key={player.id}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-move border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-20 ${
                  player.team === 'home' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{
                  left: `${player.x}%`,
                  top: `${player.y}%`
                }}
              >
                {player.number}
              </div>
            ))}

            {/* Drawing Elements */}
            {drawingElements.map(renderDrawingElement)}

            {/* Preview Element During Drawing */}
            {previewElement && renderDrawingElement(previewElement)}

            {/* Drawing Instructions */}
            {currentMode === 'draw' && selectedTool && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg text-sm max-w-xs">
                <div className="font-semibold mb-1">Drawing: {selectedTool.name}</div>
                {['line', 'arrow', 'circle', 'square'].includes(selectedTool.type) ? (
                  <div>
                    <div>• Click and drag to set size</div>
                    <div>• Release to place element</div>
                  </div>
                ) : (
                  <div>• Click to place element</div>
                )}
              </div>
            )}

            {/* Select Mode Instructions */}
            {currentMode === 'select' && drawingElements.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-blue-900 bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
                Select Mode: Drag elements to move them
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTacticalBoard;