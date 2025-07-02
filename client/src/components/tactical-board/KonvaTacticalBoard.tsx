import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as StageType } from 'konva/lib/Stage';
import { Vector2d } from 'konva/lib/types';
import useImage from 'use-image';
import footballPitchSvg from '@/assets/football-pitch.svg';
import { DrawingElement } from './types';
import { KonvaDrawingElement } from './KonvaDrawingElement';
import { useToast } from '@/hooks/use-toast';

interface KonvaTacticalBoardProps {
  drawingElements: DrawingElement[];
  setDrawingElements: React.Dispatch<React.SetStateAction<DrawingElement[]>>;
  selectedTool: any;
  currentMode: string;
  toolColor: string;
  toolSize: number;
  zoomLevel: number;
  isDrawingShape: boolean;
  setIsDrawingShape: React.Dispatch<React.SetStateAction<boolean>>;
  onElementsChange?: (elements: DrawingElement[]) => void;
}

export const KonvaTacticalBoard: React.FC<KonvaTacticalBoardProps> = ({
  drawingElements,
  setDrawingElements,
  selectedTool,
  currentMode,
  toolColor,
  toolSize,
  zoomLevel,
  isDrawingShape,
  setIsDrawingShape,
  onElementsChange
}) => {
  const [fieldImage] = useImage(footballPitchSvg);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState<Vector2d>({ x: 0, y: 0 });
  const [previewElement, setPreviewElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const stageRef = useRef<StageType>(null);
  const { toast } = useToast();

  const FIELD_WIDTH = 800;
  const FIELD_HEIGHT = 520;

  // Undo/Redo functionality
  const saveToHistory = useCallback((elements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...elements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDrawingElements(history[newIndex]);
      setSelectedId(null);
    }
  }, [historyIndex, history, setDrawingElements]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDrawingElements(history[newIndex]);
      setSelectedId(null);
    }
  }, [historyIndex, history, setDrawingElements]);

  // Keyboard event handler
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
  }, [selectedId, drawingElements, setDrawingElements, saveToHistory, undo, redo, toast]);

  // Handle stage click
  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      setSelectedId(null);
      
      // Handle drawing mode
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
  }, [currentMode, selectedTool, toolColor, toolSize, isDrawing, drawingElements, setDrawingElements, saveToHistory, toast]);

  // Handle mouse move
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

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDrawing && previewElement) {
      const distance = Math.sqrt(
        Math.pow((previewElement.endX || previewElement.x) - drawingStart.x, 2) + 
        Math.pow((previewElement.endY || previewElement.y) - drawingStart.y, 2)
      );

      if (distance > 10) { // Minimum size
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
  }, [isDrawing, previewElement, drawingStart, drawingElements, setDrawingElements, saveToHistory, selectedTool, toast]);

  // Handle element selection
  const handleElementSelect = useCallback((id: string) => {
    setSelectedId(selectedId === id ? null : id);
  }, [selectedId]);

  // Handle element drag
  const handleElementDrag = useCallback((id: string, newPos: Vector2d) => {
    setDrawingElements(prev => prev.map(el => 
      el.id === id ? { ...el, x: newPos.x, y: newPos.y } : el
    ));
  }, [setDrawingElements]);

  // Handle element drag end
  const handleElementDragEnd = useCallback(() => {
    saveToHistory(drawingElements);
  }, [drawingElements, saveToHistory]);

  // Bring forward/send backward
  const bringForward = useCallback(() => {
    if (!selectedId) return;
    
    const index = drawingElements.findIndex(el => el.id === selectedId);
    if (index === -1 || index === drawingElements.length - 1) return;
    
    const newElements = [...drawingElements];
    [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
    setDrawingElements(newElements);
    saveToHistory(newElements);
  }, [selectedId, drawingElements, setDrawingElements, saveToHistory]);

  const sendBackward = useCallback(() => {
    if (!selectedId) return;
    
    const index = drawingElements.findIndex(el => el.id === selectedId);
    if (index <= 0) return;
    
    const newElements = [...drawingElements];
    [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
    setDrawingElements(newElements);
    saveToHistory(newElements);
  }, [selectedId, drawingElements, setDrawingElements, saveToHistory]);

  return (
    <div className="relative">
      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 text-sm"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50 text-sm"
        >
          Redo
        </button>
        {selectedId && (
          <>
            <button
              onClick={bringForward}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Forward
            </button>
            <button
              onClick={sendBackward}
              className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
            >
              Backward
            </button>
          </>
        )}
      </div>

      <Stage
        ref={stageRef}
        width={FIELD_WIDTH * zoomLevel}
        height={FIELD_HEIGHT * zoomLevel}
        scaleX={zoomLevel}
        scaleY={zoomLevel}
        onClick={handleStageClick}
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
          {drawingElements.map((element) => (
            <KonvaDrawingElement
              key={element.id}
              element={element}
              isSelected={selectedId === element.id}
              onSelect={handleElementSelect}
              onDrag={handleElementDrag}
              onDragEnd={handleElementDragEnd}
            />
          ))}

          {/* Preview element during drawing */}
          {previewElement && (
            <KonvaDrawingElement
              element={previewElement}
              isSelected={false}
              onSelect={() => {}}
              onDrag={() => {}}
              onDragEnd={() => {}}
              isPreview={true}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};