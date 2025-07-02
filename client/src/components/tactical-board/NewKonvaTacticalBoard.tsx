import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Stage, Layer, Image, Group, Line, Circle, Rect, Text, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as StageType } from 'konva/lib/Stage';
import { Vector2d } from 'konva/lib/types';
import { Group as GroupType } from 'konva/lib/Group';
import { Transformer as TransformerType } from 'konva/lib/shapes/Transformer';
import useImage from 'use-image';
import { 
  ArrowRight, 
  ArrowDownRight, 
  ArrowUpRight, 
  Minus, 
  MoreHorizontal, 
  Circle as CircleIcon,
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2, 
  Download, 
  Move3D, 
  MousePointer, 
  Edit3,
  Move,
  Palette,
  Sliders,
  Settings,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Library,
  FileImage,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import footballPitchSvg from '@/assets/football-pitch.svg';
import classicFootballSvg from '@/assets/classic-football.svg';
import coneSvg from '@/assets/tactical-icons/cone.svg';
import flagSvg from '@/assets/tactical-icons/flag.svg';

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
  length?: number;
  radius?: number;
  dashed?: boolean;
}

interface DrawingTool {
  id: string;
  type: 'arrow' | 'line' | 'circle' | 'square' | 'cone' | 'ball' | 'flag';
  name: string;
  icon: React.ReactNode;
  dashed?: boolean;
}

const NewKonvaTacticalBoard: React.FC = () => {
  const [fieldImage] = useImage(footballPitchSvg);
  const [footballImage] = useImage(classicFootballSvg);
  const [coneImage] = useImage(coneSvg);
  const [flagImage] = useImage(flagSvg);
  
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool | null>(null);
  const [currentMode, setCurrentMode] = useState<'select' | 'draw'>('select');
  const [toolColor, setToolColor] = useState('#FFFFFF');
  const [toolSize, setToolSize] = useState(3);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<Vector2d>({ x: 0, y: 0 });
  const [previewElement, setPreviewElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const stageRef = useRef<StageType>(null);
  const transformerRef = useRef<TransformerType>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Save/Open/Export states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveFormation, setSaveFormation] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);

  const FIELD_WIDTH = 800;
  const FIELD_HEIGHT = 520;

  // Drawing tools configuration
  const drawingTools: DrawingTool[] = [
    { id: 'line', type: 'line', name: 'Line', icon: <Minus className="w-4 h-4" /> },
    { id: 'line-dashed', type: 'line', name: 'Dashed Line', icon: <MoreHorizontal className="w-4 h-4" />, dashed: true },
    { id: 'arrow', type: 'arrow', name: 'Arrow', icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'circle', type: 'circle', name: 'Circle', icon: <CircleIcon className="w-4 h-4" /> },
    { id: 'square', type: 'square', name: 'Rectangle', icon: <Square className="w-4 h-4" /> },
    { id: 'cone', type: 'cone', name: 'Cone', icon: <div className="w-3 h-3 bg-orange-500 rounded-full" /> },
    { id: 'ball', type: 'ball', name: 'Football', icon: <div className="w-3 h-3 rounded-full border border-black bg-white flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-black"></div></div> },
    { id: 'flag', type: 'flag', name: 'Flag', icon: <div className="w-3 h-3 bg-red-500" /> }
  ];

  const colorPresets = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500'
  ];

  // API queries for tactical boards library
  const { data: tacticalBoards = [] } = useQuery({
    queryKey: ['/api/tactical-boards'],
    enabled: libraryDialogOpen
  });

  // Save tactical board mutation
  const saveBoardMutation = useMutation({
    mutationFn: async (boardData: any) => {
      if (currentBoardId) {
        return apiRequest(`/api/tactical-boards/${currentBoardId}`, 'PUT', boardData);
      } else {
        return apiRequest('/api/tactical-boards', 'POST', boardData);
      }
    },
    onSuccess: (data) => {
      setCurrentBoardId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/tactical-boards'] });
      setSaveDialogOpen(false);
      toast({
        title: "Board Saved",
        description: `${saveName} has been saved to your library`
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save tactical board. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete tactical board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/tactical-boards/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tactical-boards'] });
      toast({
        title: "Board Deleted",
        description: "Tactical board removed from library"
      });
    }
  });

  // History management
  const saveToHistory = useCallback((elements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Save/Open functions
  const handleSaveBoard = () => {
    if (!saveName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your tactical board",
        variant: "destructive"
      });
      return;
    }

    const boardData = {
      title: saveName,
      description: saveDescription || null,
      formation: saveFormation || null,
      tags: saveTags ? saveTags.split(',').map(tag => tag.trim()) : [],
      isPublic,
      elements: JSON.stringify(drawingElements)
    };

    saveBoardMutation.mutate(boardData);
  };

  const handleLoadBoard = (board: any) => {
    try {
      const loadedElements = JSON.parse(board.elements);
      setDrawingElements(loadedElements);
      saveToHistory(loadedElements);
      setCurrentBoardId(board.id);
      setSaveName(board.title);
      setSaveDescription(board.description || '');
      setSaveFormation(board.formation || '');
      setSaveTags(board.tags ? board.tags.join(', ') : '');
      setIsPublic(board.isPublic);
      setLibraryDialogOpen(false);
      toast({
        title: "Board Loaded",
        description: `${board.title} has been loaded`
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load tactical board",
        variant: "destructive"
      });
    }
  };

  // Export functions
  const handleExportPNG = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      const uri = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${saveName || 'tactical-board'}.png`;
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PNG Exported",
        description: "Tactical board saved as PNG image"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PNG image",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async () => {
    const stage = stageRef.current;
    if (!stage) return;

    try {
      const uri = stage.toDataURL({ pixelRatio: 2 });
      const pdf = new jsPDF('landscape');
      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = 210; // A4 landscape height in mm
      
      pdf.addImage(uri, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${saveName || 'tactical-board'}.pdf`);
      
      toast({
        title: "PDF Exported",
        description: "Tactical board saved as PDF document"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF document",
        variant: "destructive"
      });
    }
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDrawingElements(history[newIndex]);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDrawingElements(history[newIndex]);
      setSelectedId(null);
    }
  }, [historyIndex, history]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        const newElements = drawingElements.filter(el => el.id !== selectedId);
        setDrawingElements(newElements);
        saveToHistory(newElements);
        setSelectedId(null);
        
        toast({
          title: "Element Deleted",
          description: "Drawing element removed from board"
        });
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, drawingElements, saveToHistory, undo, redo, toast]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current && selectedId) {
      const selectedNode = stageRef.current.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  // Clear all elements
  const handleClearAll = () => {
    setDrawingElements([]);
    saveToHistory([]);
    setSelectedId(null);
    toast({
      title: "Board Cleared",
      description: "All drawing elements removed"
    });
  };

  // Stage event handlers
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Allow clicks on field image or stage
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
    
    if (clickedOnEmpty) {
      setSelectedId(null);
      
      if (currentMode === 'draw' && selectedTool) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;

        const resizableTools = ['line', 'arrow', 'circle', 'square'];
        
        if (resizableTools.includes(selectedTool.type)) {
          if (!isDrawing) {
            setIsDrawing(true);
            setDrawingStart(pos);
            setPreviewElement({
              id: 'preview',
              type: selectedTool.type,
              x: pos.x,
              y: pos.y,
              color: toolColor,
              size: toolSize,
              dashed: selectedTool.dashed || false
            });
          }
        } else {
          // Fixed-size elements
          const newElement: DrawingElement = {
            id: `element-${Date.now()}-${Math.random()}`,
            type: selectedTool.type,
            x: pos.x,
            y: pos.y,
            color: toolColor,
            size: toolSize,
            dashed: selectedTool.dashed || false
          };
          
          const newElements = [...drawingElements, newElement];
          setDrawingElements(newElements);
          saveToHistory(newElements);
          
          toast({
            title: "Element Added",
            description: `${selectedTool.name} placed on board`
          });
        }
      }
    }
  }, [currentMode, selectedTool, toolColor, toolSize, isDrawing, drawingElements, saveToHistory, toast]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !previewElement || !selectedTool) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const distance = Math.sqrt(
      Math.pow(pos.x - drawingStart.x, 2) + Math.pow(pos.y - drawingStart.y, 2)
    );
    const angle = Math.atan2(pos.y - drawingStart.y, pos.x - drawingStart.x);

    let updatedPreview = { ...previewElement };

    if (selectedTool.type === 'line' || selectedTool.type === 'arrow') {
      updatedPreview = {
        ...previewElement,
        x: drawingStart.x,
        y: drawingStart.y,
        endX: pos.x,
        endY: pos.y,
        length: distance,
        rotation: angle * (180 / Math.PI)
      };
    } else if (selectedTool.type === 'circle') {
      updatedPreview = {
        ...previewElement,
        x: (drawingStart.x + pos.x) / 2,
        y: (drawingStart.y + pos.y) / 2,
        radius: distance / 2,
        width: distance,
        height: distance
      };
    } else if (selectedTool.type === 'square') {
      const width = Math.abs(pos.x - drawingStart.x);
      const height = Math.abs(pos.y - drawingStart.y);
      updatedPreview = {
        ...previewElement,
        x: Math.min(drawingStart.x, pos.x) + width / 2,
        y: Math.min(drawingStart.y, pos.y) + height / 2,
        width,
        height
      };
    }

    setPreviewElement(updatedPreview);
  }, [isDrawing, previewElement, selectedTool, drawingStart]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isDrawing && previewElement) {
      const distance = Math.sqrt(
        Math.pow((previewElement.endX || previewElement.x) - drawingStart.x, 2) + 
        Math.pow((previewElement.endY || previewElement.y) - drawingStart.y, 2)
      );

      if (distance > 10) {
        const finalElement: DrawingElement = {
          ...previewElement,
          id: `element-${Date.now()}-${Math.random()}`
        };
        
        const newElements = [...drawingElements, finalElement];
        setDrawingElements(newElements);
        saveToHistory(newElements);
        
        toast({
          title: "Element Added",
          description: `${selectedTool?.name} created on board`
        });
      }

      setIsDrawing(false);
      setPreviewElement(null);
    }
  }, [isDrawing, previewElement, drawingStart, drawingElements, saveToHistory, selectedTool, toast]);

  // Element selection
  const handleElementSelect = useCallback((id: string) => {
    setSelectedId(selectedId === id ? null : id);
  }, [selectedId]);

  // Element drag
  const handleElementDrag = useCallback((id: string, newPos: Vector2d) => {
    setDrawingElements(prev => prev.map(el => 
      el.id === id ? { ...el, x: newPos.x, y: newPos.y } : el
    ));
  }, []);

  const handleElementDragEnd = useCallback(() => {
    saveToHistory(drawingElements);
  }, [drawingElements, saveToHistory]);

  // Render drawing element
  const renderElement = (element: DrawingElement, isSelected: boolean, isPreview = false) => {
    const baseProps = {
      stroke: element.color,
      strokeWidth: element.size || 2,
      fill: element.type === 'circle' || element.type === 'square' ? 'transparent' : undefined,
      opacity: isPreview ? 0.7 : 1,
      shadowEnabled: isSelected,
      shadowColor: '#3b82f6',
      shadowBlur: 8,
      shadowOpacity: 0.6,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    };

    const handleClick = (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (!isPreview) {
        handleElementSelect(element.id);
      }
    };

    const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
      const pos = e.target.position();
      handleElementDrag(element.id, pos);
    };

    switch (element.type) {
      case 'line':
        return (
          <Line
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            points={[
              0, 0,
              (element.endX || element.x) - element.x,
              (element.endY || element.y) - element.y
            ]}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          />
        );

      case 'arrow':
        const endX = (element.endX || element.x) - element.x;
        const endY = (element.endY || element.y) - element.y;
        const length = Math.sqrt(endX * endX + endY * endY);
        const arrowSize = Math.min(length * 0.1, 15);
        
        return (
          <Group
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          >
            <Line
              points={[0, 0, endX, endY]}
              {...baseProps}
              dash={element.dashed ? [8, 4] : undefined}
            />
            <Line
              points={[
                endX - arrowSize * Math.cos(Math.atan2(endY, endX) - 0.3),
                endY - arrowSize * Math.sin(Math.atan2(endY, endX) - 0.3),
                endX,
                endY,
                endX - arrowSize * Math.cos(Math.atan2(endY, endX) + 0.3),
                endY - arrowSize * Math.sin(Math.atan2(endY, endX) + 0.3)
              ]}
              {...baseProps}
              fill={element.color}
              closed={true}
            />
          </Group>
        );

      case 'circle':
        return (
          <Circle
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            radius={element.radius || 20}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          />
        );

      case 'square':
        return (
          <Rect
            key={element.id}
            id={element.id}
            x={element.x - (element.width || 40) / 2}
            y={element.y - (element.height || 40) / 2}
            width={element.width || 40}
            height={element.height || 40}
            {...baseProps}
            dash={element.dashed ? [8, 4] : undefined}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          />
        );

      case 'ball':
        return footballImage ? (
          <Image
            key={element.id}
            id={element.id}
            image={footballImage}
            x={element.x - 15}
            y={element.y - 15}
            width={30}
            height={30}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
            shadowEnabled={isSelected}
            shadowColor="#3b82f6"
            shadowBlur={8}
            shadowOpacity={0.6}
          />
        ) : (
          <Circle
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            radius={15}
            fill="#8B4513"
            stroke="#654321"
            strokeWidth={2}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          />
        );

      case 'cone':
        return coneImage ? (
          <Image
            key={element.id}
            id={element.id}
            image={coneImage}
            x={element.x - 12.5}
            y={element.y - 12.5}
            width={25}
            height={25}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
            shadowEnabled={isSelected}
            shadowColor="#3b82f6"
            shadowBlur={8}
            shadowOpacity={0.6}
          />
        ) : (
          <Group
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          >
            <Circle
              radius={12}
              fill="#FF6B35"
              stroke="#FF4500"
              strokeWidth={2}
            />
            <Text
              text="C"
              fontSize={12}
              fill="white"
              offsetX={4}
              offsetY={6}
            />
          </Group>
        );

      case 'flag':
        return flagImage ? (
          <Image
            key={element.id}
            id={element.id}
            image={flagImage}
            x={element.x - 10}
            y={element.y - 15}
            width={20}
            height={30}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
            shadowEnabled={isSelected}
            shadowColor="#3b82f6"
            shadowBlur={8}
            shadowOpacity={0.6}
          />
        ) : (
          <Group
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            draggable={!isPreview}
            onClick={handleClick}
            onDragMove={handleDragMove}
            onDragEnd={handleElementDragEnd}
          >
            <Line
              points={[0, -15, 0, 15]}
              stroke="#8B4513"
              strokeWidth={3}
            />
            <Rect
              x={0}
              y={-15}
              width={20}
              height={12}
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth={1}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Interactive Tactical Board</h2>
          
          {/* Mode Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={currentMode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('select')}
                className="justify-start"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Select
              </Button>
              <Button
                variant={currentMode === 'draw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentMode('draw')}
                className="justify-start"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Draw
              </Button>
            </div>
          </div>

          {/* Drawing Tools */}
          {currentMode === 'draw' && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Drawing Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                {drawingTools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant={selectedTool?.id === tool.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool(tool)}
                    className="justify-start"
                  >
                    {tool.icon}
                    <span className="ml-2 text-xs">{tool.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tool Customization */}
          {currentMode === 'draw' && selectedTool && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Tool Settings</h3>
              
              {/* Color Picker */}
              <div className="mb-4">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">Color</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${
                        toolColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setToolColor(color)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={toolColor}
                  onChange={(e) => setToolColor(e.target.value)}
                  className="w-full h-8 rounded border"
                />
              </div>

              {/* Size Slider */}
              <div className="mb-4">
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-2 block">
                  Size: {toolSize}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={toolSize}
                  onChange={(e) => setToolSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <div className="flex items-center gap-2">
            <Button onClick={undo} disabled={historyIndex <= 0} size="sm" variant="outline">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button onClick={redo} disabled={historyIndex >= history.length - 1} size="sm" variant="outline">
              <Redo2 className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={handleZoomOut} disabled={zoomLevel <= 0.5} size="sm" variant="outline">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
            <Button onClick={handleZoomIn} disabled={zoomLevel >= 2.0} size="sm" variant="outline">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button onClick={handleZoomReset} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Save Tactical Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Board Name *</Label>
                    <Input
                      id="name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Enter board name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      placeholder="Brief description (optional)"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="formation">Formation</Label>
                    <Select value={saveFormation} onValueChange={setSaveFormation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select formation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4-4-2">4-4-2</SelectItem>
                        <SelectItem value="4-3-3">4-3-3</SelectItem>
                        <SelectItem value="3-5-2">3-5-2</SelectItem>
                        <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                        <SelectItem value="3-4-3">3-4-3</SelectItem>
                        <SelectItem value="5-3-2">5-3-2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={saveTags}
                      onChange={(e) => setSaveTags(e.target.value)}
                      placeholder="training, defense, attack (comma separated)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="public">Make public (share with team)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleSaveBoard}
                    disabled={saveBoardMutation.isPending}
                  >
                    {saveBoardMutation.isPending ? 'Saving...' : 'Save Board'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Library className="h-4 w-4 mr-1" />
                  Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tactical Board Library</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tacticalBoards.map((board: any) => (
                    <Card key={board.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{board.title}</h3>
                        {board.description && (
                          <p className="text-sm text-gray-600 mb-2">{board.description}</p>
                        )}
                        {board.formation && (
                          <Badge variant="outline" className="mb-2">{board.formation}</Badge>
                        )}
                        <div className="flex justify-between items-center mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => handleLoadBoard(board)}
                          >
                            Load
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteBoardMutation.mutate(board.id)}
                            disabled={deleteBoardMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="outline" size="sm" onClick={handleExportPNG}>
              <FileImage className="h-4 w-4 mr-1" />
              PNG
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button onClick={handleClearAll} size="sm" variant="outline" className="text-red-600">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {currentMode === 'select' && 'Click to select elements. Selected elements show blue glow and can be dragged. Press Delete to remove selected element.'}
            {currentMode === 'draw' && !selectedTool && 'Select a drawing tool from the sidebar to start drawing'}
            {currentMode === 'draw' && selectedTool && (
              ['line', 'arrow', 'circle', 'square'].includes(selectedTool.type) 
                ? `Click and drag to draw ${selectedTool.name.toLowerCase()}. All elements are draggable and selectable after placement.`
                : `Click to place ${selectedTool.name.toLowerCase()} on the field. Elements can be selected and moved after placement.`
            )}
          </p>
        </div>

        {/* Konva Stage */}
        <div className="p-4 flex items-center justify-center min-h-[600px] overflow-auto">
          <Stage
            ref={stageRef}
            width={FIELD_WIDTH * zoomLevel}
            height={FIELD_HEIGHT * zoomLevel}
            scaleX={zoomLevel}
            scaleY={zoomLevel}
            onClick={handleStageClick}
            onMouseDown={(e) => {
              if (currentMode === 'draw' && selectedTool) {
                const pos = e.target.getStage()?.getPointerPosition();
                if (pos) {
                  handleStageClick(e);
                }
              }
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              cursor: currentMode === 'draw' && selectedTool ? 'crosshair' : 'default',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <Layer>
              {/* Football field background */}
              {fieldImage && (
                <Image
                  image={fieldImage}
                  width={FIELD_WIDTH}
                  height={FIELD_HEIGHT}
                />
              )}

              {/* Drawing elements */}
              {drawingElements.map((element) => 
                renderElement(element, selectedId === element.id)
              )}

              {/* Preview element during drawing */}
              {previewElement && renderElement(previewElement, false, true)}

              {/* Transformer for selected element */}
              {selectedId && (
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 10 || newBox.height < 10) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  enabledAnchors={[
                    'top-left', 'top-right', 'bottom-left', 'bottom-right',
                    'middle-left', 'middle-right', 'top-center', 'bottom-center'
                  ]}
                  rotateEnabled={true}
                  borderStroke="#3b82f6"
                  borderStrokeWidth={2}
                  anchorStroke="#3b82f6"
                  anchorFill="#ffffff"
                  anchorSize={8}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default NewKonvaTacticalBoard;