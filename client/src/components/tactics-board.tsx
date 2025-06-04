import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, Pen, Circle, ArrowRight, Square } from "lucide-react";
import type { TacticalFormation } from "@shared/schema";

interface TacticsBoardProps {
  formation: TacticalFormation;
  players: any[];
  onSave: (positions: any[], notes: string) => void;
  onPositionsChange?: (positions: any[]) => void;
}

export default function TacticsBoard({ formation, players, onSave, onPositionsChange }: TacticsBoardProps) {
  const [positions, setPositions] = useState(formation.positions || []);
  const [notes, setNotes] = useState(formation.notes || "");
  const [drawingMode, setDrawingMode] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [draggedPosition, setDraggedPosition] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setPositions(formation.positions || []);
    setNotes(formation.notes || "");
  }, [formation]);

  const handlePositionDrag = (positionId: string, newX: number, newY: number) => {
    const updatedPositions = positions.map(pos => 
      pos.id === positionId ? { ...pos, x: newX, y: newY } : pos
    );
    setPositions(updatedPositions);
    onPositionsChange?.(updatedPositions);
  };

  const handlePlayerAssignment = (positionId: string, playerId: string | null) => {
    const updatedPositions = positions.map(pos => 
      pos.id === positionId ? { ...pos, playerId: playerId ? parseInt(playerId) : null } : pos
    );
    setPositions(updatedPositions);
    onPositionsChange?.(updatedPositions);
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'goalkeeper':
        return '#fbbf24'; // yellow
      case 'defender':
        return '#3b82f6'; // blue
      case 'midfielder':
        return '#10b981'; // green
      case 'forward':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getAssignedPlayer = (playerId: number | null) => {
    if (!playerId) return null;
    return players.find(p => p.player?.id === playerId)?.player || players.find(p => p.id === playerId);
  };

  const resetPositions = () => {
    setPositions(formation.positions || []);
    setDrawings([]);
    onPositionsChange?.(formation.positions || []);
  };

  const handleSave = () => {
    onSave(positions, notes);
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingMode) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newDrawing = {
      id: Date.now(),
      type: drawingMode,
      x,
      y,
      x2: x + 10, // For arrows
      y2: y + 5,
    };

    setDrawings([...drawings, newDrawing]);
  };

  const clearDrawings = () => {
    setDrawings([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{formation.name}</span>
                <Badge variant="outline">{formation.formation}</Badge>
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={resetPositions}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Drawing Tools */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Drawing Tools</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={drawingMode === 'cone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'cone' ? null : 'cone')}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={drawingMode === 'arrow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'arrow' ? null : 'arrow')}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={drawingMode === 'area' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'area' ? null : 'area')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDrawings}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Player Assignment */}
              <div>
                <Label className="text-sm font-medium">Player Assignments</Label>
                <div className="space-y-2 mt-2 max-h-80 overflow-y-auto">
                  {positions.map((pos) => {
                    const assignedPlayer = getAssignedPlayer(pos.playerId);
                    return (
                      <div key={pos.id} className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getPositionColor(pos.position) }}
                          ></div>
                          <span className="text-xs font-medium capitalize">
                            {pos.position} {pos.id.includes('-') && `${pos.id.split('-')[1]}`}
                          </span>
                        </div>
                        <Select
                          value={pos.playerId?.toString() || ""}
                          onValueChange={(value) => handlePlayerAssignment(pos.id, value || null)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign player" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {players
                              .filter(p => {
                                const player = p.player || p;
                                return player.position.toLowerCase() === pos.position.toLowerCase();
                              })
                              .map(p => {
                                const player = p.player || p;
                                return (
                                  <SelectItem key={player.id} value={player.id.toString()}>
                                    {player.firstName} {player.lastName}
                                    {player.shirtNumber && ` (#${player.shirtNumber})`}
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Football Pitch */}
            <div className="lg:col-span-3">
              <div className="relative bg-green-600 rounded-lg overflow-hidden aspect-[2/3] max-h-[600px]">
                <svg
                  ref={svgRef}
                  className="w-full h-full cursor-crosshair"
                  viewBox="0 0 100 100"
                  onClick={handleSVGClick}
                  style={{ cursor: drawingMode ? 'crosshair' : 'default' }}
                >
                  {/* Pitch markings */}
                  <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="9.15" fill="none" stroke="white" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="0.3" fill="white" />
                  
                  {/* Goals */}
                  <rect x="35" y="0" width="30" height="5.5" fill="none" stroke="white" strokeWidth="0.3" />
                  <rect x="35" y="94.5" width="30" height="5.5" fill="none" stroke="white" strokeWidth="0.3" />
                  
                  {/* Penalty areas */}
                  <rect x="20" y="0" width="60" height="16.5" fill="none" stroke="white" strokeWidth="0.3" />
                  <rect x="20" y="83.5" width="60" height="16.5" fill="none" stroke="white" strokeWidth="0.3" />
                  
                  {/* 6-yard boxes */}
                  <rect x="35" y="0" width="30" height="5.5" fill="none" stroke="white" strokeWidth="0.3" />
                  <rect x="35" y="94.5" width="30" height="5.5" fill="none" stroke="white" strokeWidth="0.3" />

                  {/* Corner arcs */}
                  <path d="M 0 0 A 1 1 0 0 0 1 1" fill="none" stroke="white" strokeWidth="0.3" />
                  <path d="M 100 0 A 1 1 0 0 1 99 1" fill="none" stroke="white" strokeWidth="0.3" />
                  <path d="M 0 100 A 1 1 0 0 1 1 99" fill="none" stroke="white" strokeWidth="0.3" />
                  <path d="M 100 100 A 1 1 0 0 0 99 99" fill="none" stroke="white" strokeWidth="0.3" />

                  {/* Drawings */}
                  {drawings.map((drawing) => {
                    if (drawing.type === 'cone') {
                      return (
                        <circle
                          key={drawing.id}
                          cx={drawing.x}
                          cy={drawing.y}
                          r="1"
                          fill="orange"
                          stroke="darkorange"
                          strokeWidth="0.2"
                        />
                      );
                    }
                    if (drawing.type === 'arrow') {
                      return (
                        <g key={drawing.id}>
                          <line
                            x1={drawing.x}
                            y1={drawing.y}
                            x2={drawing.x2}
                            y2={drawing.y2}
                            stroke="yellow"
                            strokeWidth="0.5"
                            markerEnd="url(#arrowhead)"
                          />
                        </g>
                      );
                    }
                    if (drawing.type === 'area') {
                      return (
                        <rect
                          key={drawing.id}
                          x={drawing.x}
                          y={drawing.y}
                          width="8"
                          height="6"
                          fill="rgba(255,255,0,0.3)"
                          stroke="yellow"
                          strokeWidth="0.3"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Arrow marker */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="yellow"
                      />
                    </marker>
                  </defs>

                  {/* Player positions */}
                  {positions.map((pos) => {
                    const assignedPlayer = getAssignedPlayer(pos.playerId);
                    return (
                      <g
                        key={pos.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        style={{ cursor: 'move' }}
                        onMouseDown={(e) => {
                          setDraggedPosition(pos.id);
                          e.preventDefault();
                        }}
                      >
                        <circle
                          r="2.5"
                          fill={getPositionColor(pos.position)}
                          stroke="white"
                          strokeWidth="0.3"
                        />
                        {assignedPlayer && (
                          <>
                            <text
                              textAnchor="middle"
                              dy="0.5"
                              fontSize="1.5"
                              fill="white"
                              fontWeight="bold"
                            >
                              {assignedPlayer.shirtNumber || pos.id.toUpperCase()}
                            </text>
                            <text
                              textAnchor="middle"
                              dy="4"
                              fontSize="1"
                              fill="white"
                            >
                              {assignedPlayer.lastName}
                            </text>
                          </>
                        )}
                        {!assignedPlayer && (
                          <text
                            textAnchor="middle"
                            dy="0.5"
                            fontSize="1"
                            fill="white"
                            fontWeight="bold"
                          >
                            {pos.position[0].toUpperCase()}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <Label htmlFor="notes" className="text-sm font-medium">Formation Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add tactical notes, instructions, or observations..."
              className="mt-2 form-input"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mouse event handlers for dragging */}
      <div
        className="fixed inset-0 pointer-events-none"
        onMouseMove={(e) => {
          if (draggedPosition && svgRef.current) {
            const svg = svgRef.current;
            const rect = svg.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
            handlePositionDrag(draggedPosition, x, y);
          }
        }}
        onMouseUp={() => {
          setDraggedPosition(null);
        }}
      />
    </div>
  );
}
