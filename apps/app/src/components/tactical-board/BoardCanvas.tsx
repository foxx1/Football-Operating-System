import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Stage, Layer, Image, Group, Circle, Rect, Line, Text, Arrow } from 'react-konva';
import { Stage as StageType } from 'konva/lib/Stage';
import { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import footballPitchSvg from '@/assets/football-pitch.svg';
import footballBallSvgRaw from '@/assets/tactical-icons/football-ball.svg?raw';
import {
    BoardElement, BackgroundType, TextSubtype, PITCH_WIDTH, PITCH_HEIGHT, TEAM_COLORS, CONTENT_SCALE,
    DEFAULT_STROKE_WIDTH, DEFAULT_CONE_DIAMETER, DEFAULT_GOAL_WIDTH, DEFAULT_GOAL_HEIGHT,
    resolveEffectivePoints, TEXT_PRESETS, svgToDataUri,
} from './types';

// Short alias: fixed pixel sizes (radii, stroke widths, icon sizes) below
// are tuned against the original 800-wide pitch and multiplied by this so
// they stay visually proportional at the current PITCH_WIDTH.
const S = CONTENT_SCALE;

const footballBallSvg = svgToDataUri(footballBallSvgRaw);

interface BoardCanvasProps {
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    activeTool?: string | null;
    elements: BoardElement[];
    onElementsChange: (elements: BoardElement[]) => void;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onOpenProperties?: (id: string) => void;
    onToolUsed?: () => void;
    backgroundType?: BackgroundType;
    halfSide?: 'left' | 'right';
    colorblindMode?: boolean;
    shadedZone?: boolean;
    zoneOpacity?: number;
    drawColor?: string;
}

export interface BoardCanvasHandle {
    toDataURL: () => string;
    resetPan: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

// A patch applied on top of one element while a handle (resize / reshape /
// curve control point) is actively being dragged. Kept local instead of
// flowing through onElementsChange on every pointer move so a single drag
// doesn't flood undo history with dozens of intermediate steps - the real
// commit only happens once, on drag end.
interface HandleOverride {
    id: string;
    patch: Partial<BoardElement>;
}

export const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(({
    zoom = 1,
    onZoomChange,
    activeTool,
    elements,
    onElementsChange,
    selectedId,
    onSelect,
    onOpenProperties,
    onToolUsed,
    backgroundType = 'full',
    halfSide = 'left',
    colorblindMode = false,
    shadedZone = false,
    zoneOpacity = 0.25,
    drawColor = 'white',
}, ref) => {
    const stageRef = useRef<StageType>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [fitScale, setFitScale] = useState(1);

    const [fieldImage] = useImage(footballPitchSvg);
    const [footballImage] = useImage(footballBallSvg);

    const pitchWidth = backgroundType === 'half' ? PITCH_WIDTH / 2 : PITCH_WIDTH;
    const pitchHeight = PITCH_HEIGHT;
    const scale = fitScale * zoom;
    const isPanning = activeTool === 'pan';
    const isDrawingTool = !!activeTool && !isPanning;

    // Always stretch to fill the available width (no upper cap) - the pitch
    // scales up or down to match its container, keeping its 16:9 aspect
    // ratio. Zoom multiplies on top of this fit scale.
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const availableWidth = entries[0]?.contentRect.width;
            if (!availableWidth) return;
            const next = availableWidth / pitchWidth;
            setFitScale(next > 0 ? next : 1);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [pitchWidth]);

    useImperativeHandle(ref, () => ({
        toDataURL: () => stageRef.current ? stageRef.current.toDataURL({ pixelRatio: 2 }) : '',
        resetPan: () => {
            stageRef.current?.position({ x: 0, y: 0 });
            stageRef.current?.batchDraw();
        },
    }));

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
    const [previewElement, setPreviewElement] = useState<BoardElement | null>(null);

    // Live handle-drag preview (see HandleOverride above).
    const [handleOverride, setHandleOverride] = useState<HandleOverride | null>(null);

    const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
        if (!onZoomChange) return;
        if (!e.evt.ctrlKey && !e.evt.metaKey) return; // require ctrl/cmd+wheel so page scroll still works
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
        onZoomChange(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom + delta) * 10) / 10)));
    }, [zoom, onZoomChange]);

    // Handle Drop (from sidebar drag-and-drop of players/equipment)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        stage.setPointersPositions(e as unknown as MouseEvent);
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;

        const type = e.dataTransfer.getData('type') as BoardElement['type'];
        const subtype = e.dataTransfer.getData('subtype') as BoardElement['subtype'];
        const color = e.dataTransfer.getData('color');
        const team = e.dataTransfer.getData('team') as BoardElement['team'];
        const number = e.dataTransfer.getData('number');
        const textPreset = type === 'text' ? TEXT_PRESETS[subtype as TextSubtype] : undefined;

        const newElement: BoardElement = {
            id: `el-${Date.now()}`,
            type,
            subtype: subtype || undefined,
            x: pos.x,
            y: pos.y,
            color: color || (team ? TEAM_COLORS[team] : 'white'),
            team: team || undefined,
            number: number ? parseInt(number, 10) : undefined,
            rotation: 0,
            ...textPreset,
        };

        onElementsChange([...elements, newElement]);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    // Drawing Handlers
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (isPanning) return;
        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();
        if (!pos) return;

        const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Image';

        if (isDrawingTool) {
            if (clickedOnEmpty) {
                onSelect(null);
                setIsDrawing(true);
                setDrawingStart(pos);

                const isZoneShape = activeTool === 'square' || activeTool === 'circle';
                setPreviewElement({
                    id: 'preview',
                    type: 'drawing',
                    subtype: activeTool as BoardElement['subtype'],
                    x: pos.x,
                    y: pos.y,
                    width: 0,
                    height: 0,
                    points: [0, 0],
                    color: drawColor,
                    strokeWidth: DEFAULT_STROKE_WIDTH,
                    dashed: activeTool === 'dribble',
                    fill: isZoneShape ? shadedZone : false,
                    opacity: zoneOpacity,
                });
            }
        } else if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing || !drawingStart || !previewElement) return;

        const stage = e.target.getStage();
        const pos = stage?.getRelativePointerPosition();
        if (!pos) return;

        if (activeTool === 'line' || activeTool === 'dribble' || activeTool === 'arrow' || activeTool === 'doubleArrow') {
            const dx = pos.x - drawingStart.x;
            const dy = pos.y - drawingStart.y;
            // Straight by default (control point exactly on the midpoint) -
            // the 3-point [start, control, end] shape still matches curve's,
            // so a bend handle becomes available after drawing without
            // changing how these tools look until someone drags it.
            setPreviewElement({ ...previewElement, points: [0, 0, dx / 2, dy / 2, dx, dy] });
        } else if (activeTool === 'curve') {
            const dx = pos.x - drawingStart.x;
            const dy = pos.y - drawingStart.y;
            const length = Math.hypot(dx, dy) || 1;
            // A Konva Line's tension has no visible effect with only two
            // points (start/end) - it needs a third point to bow through,
            // so insert a midpoint offset perpendicular to the line.
            const bow = length * 0.25;
            const midX = dx / 2 - (dy / length) * bow;
            const midY = dy / 2 + (dx / length) * bow;
            setPreviewElement({ ...previewElement, points: [0, 0, midX, midY, dx, dy] });
        } else if (activeTool === 'square' || activeTool === 'circle') {
            setPreviewElement({
                ...previewElement,
                width: pos.x - drawingStart.x,
                height: pos.y - drawingStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing || !previewElement) return;

        setIsDrawing(false);
        setDrawingStart(null);

        const finalElement: BoardElement = { ...previewElement, id: `el-${Date.now()}` };
        onElementsChange([...elements, finalElement]);
        setPreviewElement(null);

        // A shape drawn point-to-point is done being drawn - hand control
        // back to the select tool instead of leaving the drawing tool armed.
        if (onToolUsed) onToolUsed();
    };

    // The pointer leaving the canvas mid-draw (or while a drawing tool is
    // simply armed) reads as "I'm done with this" - cancel any in-progress
    // shape and release the active tool rather than leaving it stuck on.
    const handleMouseLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setDrawingStart(null);
            setPreviewElement(null);
        }
        if (isDrawingTool && onToolUsed) onToolUsed();
    };

    const handleElementDragEnd = (e: KonvaEventObject<DragEvent>) => {
        const id = e.target.id();
        const x = e.target.x();
        const y = e.target.y();
        onElementsChange(elements.map(el => el.id === id ? { ...el, x, y } : el));
    };

    const getBackgroundCrop = () => {
        if (!fieldImage) return undefined;
        if (backgroundType !== 'half') return undefined;
        return {
            x: halfSide === 'left' ? 0 : fieldImage.width / 2,
            y: 0,
            width: fieldImage.width / 2,
            height: fieldImage.height,
        };
    };

    const getEffectivePoints = useCallback((el: BoardElement): number[] => resolveEffectivePoints(el, elements), [elements]);

    const renderPlayer = (el: BoardElement, baseProps: Record<string, unknown>, isSelected: boolean) => {
        const color = el.color || (el.team ? TEAM_COLORS[el.team] : '#2563eb');
        const numberText = el.number != null ? String(el.number) : (el.label || '');
        const textColor = color === 'yellow' || color === 'white' ? 'black' : 'white';

        return (
            <Group {...baseProps}>
                <Circle
                    radius={14 * S}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={2 * S}
                    shadowColor="black"
                    shadowBlur={isSelected ? 10 * S : 5 * S}
                    shadowOpacity={isSelected ? 0.5 : 0.3}
                />
                {colorblindMode && el.team === 'away' && (
                    <Circle radius={10 * S} stroke="#ffffff" strokeWidth={1.5 * S} dash={[3 * S, 2 * S]} listening={false} />
                )}
                <Text
                    text={numberText}
                    fill={textColor}
                    fontSize={10 * S}
                    fontStyle="bold"
                    align="center"
                    verticalAlign="middle"
                    offsetX={6 * S}
                    offsetY={5 * S}
                    listening={false}
                />
                {/* Optional name/position, shown right under the marker */}
                {el.playerName && (
                    <Text
                        text={el.playerName}
                        fill="#ffffff"
                        fontSize={9 * S}
                        fontStyle="600"
                        align="center"
                        width={130 * S}
                        x={-65 * S}
                        y={16 * S}
                        shadowColor="black"
                        shadowBlur={2 * S}
                        shadowOpacity={0.9}
                        listening={false}
                    />
                )}
                {el.positionLabel && (
                    <Text
                        text={el.positionLabel}
                        fill="#e5e7eb"
                        fontSize={7.5 * S}
                        align="center"
                        width={130 * S}
                        x={-65 * S}
                        y={(el.playerName ? 27 : 16) * S}
                        shadowColor="black"
                        shadowBlur={2 * S}
                        shadowOpacity={0.9}
                        listening={false}
                    />
                )}
            </Group>
        );
    };

    // Selecting an element works regardless of which drawing tool (if any)
    // is active - a single click always selects it (this also implicitly
    // cancels the active drawing tool, handled by the parent's onSelect).
    // Deselecting happens explicitly: double-click the shape, click empty
    // pitch, press Escape, or choose another tool/option.
    const handleElementClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
        e.cancelBubble = true;
        onSelect(id);
    }, [onSelect]);

    // Players are clicked constantly while blocking out a formation - popping
    // the Properties panel open on every single click would slow that down,
    // so a plain click only selects/repositions them. A double-click is the
    // explicit "I want to edit this one" signal that opens the panel. Every
    // other element type keeps the original single-click-opens behavior
    // (handled by the parent via onSelect), so double-click on those just
    // deselects, same as before.
    const handleElementDblClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
        e.cancelBubble = true;
        const el = elements.find(x => x.id === id);
        if (el?.type === 'player' && onOpenProperties) {
            onOpenProperties(id);
        } else {
            onSelect(null);
            if (onToolUsed) onToolUsed();
        }
    }, [elements, onSelect, onOpenProperties, onToolUsed]);

    const renderElement = (el: BoardElement, isSelected: boolean) => {
        const baseProps = {
            key: el.id,
            id: el.id,
            x: el.x,
            y: el.y,
            rotation: el.rotation || 0,
            draggable: !activeTool,
            onClick: (e: KonvaEventObject<MouseEvent>) => handleElementClick(e, el.id),
            onTap: (e: KonvaEventObject<TouchEvent>) => handleElementClick(e, el.id),
            onDblClick: (e: KonvaEventObject<MouseEvent>) => handleElementDblClick(e, el.id),
            onDblTap: (e: KonvaEventObject<TouchEvent>) => handleElementDblClick(e, el.id),
            onDragEnd: handleElementDragEnd,
        };

        if (el.type === 'player') {
            return renderPlayer(el, baseProps, isSelected);
        }

        if (el.type === 'equipment') {
            if (el.subtype === 'ball') {
                const size = 20 * S;
                return footballImage ? (
                    <Image
                        {...baseProps}
                        image={footballImage}
                        width={size}
                        height={size}
                        offsetX={size / 2}
                        offsetY={size / 2}
                        shadowColor="black"
                        shadowBlur={isSelected ? 8 * S : 0}
                        shadowOpacity={0.5}
                    />
                ) : (
                    <Group {...baseProps}>
                        <Circle radius={8 * S} fill="white" stroke="black" strokeWidth={S} />
                        <Circle radius={3 * S} fill="black" />
                    </Group>
                );
            }
            if (el.subtype === 'cone') {
                const radius = (el.width ?? DEFAULT_CONE_DIAMETER) / 2;
                return <Circle {...baseProps} radius={radius} fill={el.color || 'orange'} stroke="black" strokeWidth={S} shadowBlur={isSelected ? 6 * S : 0} />;
            }
            if (el.subtype === 'goal') {
                return <Rect {...baseProps} width={el.width ?? DEFAULT_GOAL_WIDTH} height={el.height ?? DEFAULT_GOAL_HEIGHT} fill={el.color || 'white'} stroke="black" strokeWidth={S} opacity={0.5} shadowBlur={isSelected ? 6 * S : 0} />;
            }
        }

        if (el.type === 'text') {
            return (
                <Text
                    {...baseProps}
                    text={el.text || ''}
                    fontSize={el.fontSize ?? 24}
                    fontFamily={el.fontFamily || 'Arial'}
                    fontStyle={el.fontStyle || 'normal'}
                    textDecoration={el.textDecoration || ''}
                    fill={el.color || 'white'}
                    align={el.textAlign || 'left'}
                    width={el.width ?? 360}
                    wrap="word"
                    padding={4 * S}
                    shadowColor={isSelected ? '#3b82f6' : undefined}
                    shadowBlur={isSelected ? 8 * S : 0}
                    shadowOpacity={isSelected ? 0.9 : 0}
                />
            );
        }

        if (el.type === 'drawing') {
            const strokeColor = el.color || 'white';
            const strokeW = (el.strokeWidth ?? DEFAULT_STROKE_WIDTH) * S;
            const shadow = isSelected ? { shadowBlur: 6 * S, shadowColor: '#3b82f6' } : {};

            if (el.subtype === 'line' || el.subtype === 'dribble' || el.subtype === 'curve') {
                return (
                    <Line
                        {...baseProps}
                        points={getEffectivePoints(el)}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        dash={el.subtype === 'dribble' ? [6 * S, 5 * S] : undefined}
                        // A 3-point [start, control, end] line with tension
                        // still renders perfectly straight when the control
                        // sits exactly on the midpoint (the default) - it
                        // only visibly bows once the control is dragged off
                        // it, so this is safe for line/dribble too, not just
                        // the dedicated curve tool.
                        tension={0.5}
                        {...shadow}
                    />
                );
            }
            if (el.subtype === 'arrow' || el.subtype === 'doubleArrow') {
                return (
                    <Arrow
                        {...baseProps}
                        points={getEffectivePoints(el)}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        fill={strokeColor}
                        pointerLength={10 * S}
                        pointerWidth={10 * S}
                        pointerAtBeginning={el.subtype === 'doubleArrow'}
                        pointerAtEnding
                        tension={0.5}
                        {...shadow}
                    />
                );
            }
            if (el.subtype === 'square') {
                return (
                    <Rect
                        {...baseProps}
                        width={el.width}
                        height={el.height}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        fill={el.fill ? strokeColor : undefined}
                        opacity={el.fill ? (el.opacity ?? zoneOpacity) : 1}
                        {...shadow}
                    />
                );
            }
            if (el.subtype === 'circle') {
                const r = Math.max(Math.abs(el.width || 0), Math.abs(el.height || 0)) / 2;
                return (
                    <Circle
                        {...baseProps}
                        x={el.x + (el.width || 0) / 2}
                        y={el.y + (el.height || 0) / 2}
                        radius={r}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        fill={el.fill ? strokeColor : undefined}
                        opacity={el.fill ? (el.opacity ?? zoneOpacity) : 1}
                        {...shadow}
                    />
                );
            }
        }

        return null;
    };

    // --- Selection handles: resize / reshape / curve-bow controls shown
    // only for the currently selected element. Dragging updates a local
    // override for live visual feedback and only commits (and creates an
    // undo step) once, on drag end.
    const commitHandlePatch = (id: string, patch: Partial<BoardElement>) => {
        onElementsChange(elements.map(e => e.id === id ? { ...e, ...patch } : e));
        setHandleOverride(null);
    };

    const renderHandle = (key: string, x: number, y: number, onMove: (x: number, y: number) => void, onEnd: (x: number, y: number) => void) => (
        <Circle
            key={key}
            x={x}
            y={y}
            radius={7 * S}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={1.5 * S}
            draggable
            onClick={(e) => { e.cancelBubble = true; }}
            onTap={(e) => { e.cancelBubble = true; }}
            onDragMove={(e) => onMove(e.target.x(), e.target.y())}
            onDragEnd={(e) => onEnd(e.target.x(), e.target.y())}
        />
    );

    const renderPointHandle = (el: BoardElement, pts: number[], idx: number) => {
        const patchFor = (absX: number, absY: number): Partial<BoardElement> => {
            const newPoints = [...pts];
            newPoints[idx] = absX - el.x;
            newPoints[idx + 1] = absY - el.y;
            return { points: newPoints };
        };
        return renderHandle(
            `pt-${el.id}-${idx}`,
            el.x + pts[idx],
            el.y + pts[idx + 1],
            (x, y) => setHandleOverride({ id: el.id, patch: patchFor(x, y) }),
            (x, y) => commitHandlePatch(el.id, patchFor(x, y)),
        );
    };

    const renderCornerHandle = (el: BoardElement, defaultWidth: number, defaultHeight: number) => {
        const width = el.width ?? defaultWidth;
        const height = el.height ?? defaultHeight;
        const patchFor = (absX: number, absY: number): Partial<BoardElement> => ({ width: absX - el.x, height: absY - el.y });
        return renderHandle(
            `corner-${el.id}`,
            el.x + width,
            el.y + height,
            (x, y) => setHandleOverride({ id: el.id, patch: patchFor(x, y) }),
            (x, y) => commitHandlePatch(el.id, patchFor(x, y)),
        );
    };

    // Radius handle where el.x/el.y is the shape's own center (equipment
    // cone) - only the diameter (stored in `width`) changes on drag.
    const renderCenterRadiusHandle = (el: BoardElement, defaultDiameter: number) => {
        const radius = (el.width ?? defaultDiameter) / 2;
        const patchFor = (absX: number, absY: number): Partial<BoardElement> => {
            const r = Math.max(4 * S, Math.hypot(absX - el.x, absY - el.y));
            return { width: r * 2 };
        };
        return renderHandle(
            `radius-${el.id}`,
            el.x + radius,
            el.y,
            (x, y) => setHandleOverride({ id: el.id, patch: patchFor(x, y) }),
            (x, y) => commitHandlePatch(el.id, patchFor(x, y)),
        );
    };

    // Radius handle where el.x/el.y is a corner and the center is derived
    // from width/height (drawing circle/zone) - keeps the center fixed by
    // moving x/y back out as width/height grow from the drag.
    const renderCenteredRadiusHandle = (el: BoardElement) => {
        const centerX = el.x + (el.width || 0) / 2;
        const centerY = el.y + (el.height || 0) / 2;
        const radius = Math.max(Math.abs(el.width || 0), Math.abs(el.height || 0)) / 2;
        const patchFor = (absX: number, absY: number): Partial<BoardElement> => {
            const r = Math.max(4 * S, Math.hypot(absX - centerX, absY - centerY));
            return { x: centerX - r, y: centerY - r, width: r * 2, height: r * 2 };
        };
        return renderHandle(
            `radius-${el.id}`,
            centerX + radius,
            centerY,
            (x, y) => setHandleOverride({ id: el.id, patch: patchFor(x, y) }),
            (x, y) => commitHandlePatch(el.id, patchFor(x, y)),
        );
    };

    const renderSelectionHandles = (el: BoardElement) => {
        if (el.type === 'drawing') {
            const pts = getEffectivePoints(el);
            if (el.subtype === 'line' || el.subtype === 'dribble' || el.subtype === 'arrow' || el.subtype === 'doubleArrow' || el.subtype === 'curve') {
                return (
                    <>
                        {!el.startPlayerId && renderPointHandle(el, pts, 0)}
                        {renderPointHandle(el, pts, 2)}
                        {!el.endPlayerId && renderPointHandle(el, pts, pts.length - 2)}
                    </>
                );
            }
            if (el.subtype === 'square') {
                return renderCornerHandle(el, 0, 0);
            }
            if (el.subtype === 'circle') {
                return renderCenteredRadiusHandle(el);
            }
        }
        if (el.type === 'equipment') {
            if (el.subtype === 'cone') {
                return renderCenterRadiusHandle(el, DEFAULT_CONE_DIAMETER);
            }
            if (el.subtype === 'goal') {
                return renderCornerHandle(el, DEFAULT_GOAL_WIDTH, DEFAULT_GOAL_HEIGHT);
            }
        }
        return null;
    };

    // A line/arrow/dribble/curve connected to a player is meant to read as
    // coming from underneath that player's marker, not covering it - so
    // connected drawings always render first (bottom), and everything else
    // (including every player) renders after (top), regardless of draw
    // order or which array index each element happens to be at.
    const isConnectedDrawing = (el: BoardElement) => el.type === 'drawing' && !!(el.startPlayerId || el.endPlayerId);
    const backgroundElements = elements.filter(isConnectedDrawing);
    const foregroundElements = elements.filter(el => !isConnectedDrawing(el));

    const renderWithOverride = (el: BoardElement) => renderElement(
        handleOverride?.id === el.id ? { ...el, ...handleOverride.patch } : el,
        el.id === selectedId,
    );

    return (
        <div
            ref={wrapperRef}
            className="w-full flex items-center justify-center"
        >
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="bg-zinc-800 shadow-2xl overflow-hidden rounded-md"
                style={{ width: pitchWidth * scale, height: pitchHeight * scale }}
            >
                <Stage
                    width={pitchWidth * scale}
                    height={pitchHeight * scale}
                    scaleX={scale}
                    scaleY={scale}
                    ref={stageRef}
                    draggable={isPanning}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    style={{ cursor: isPanning ? 'grab' : isDrawingTool ? 'crosshair' : 'default' }}
                >
                    <Layer>
                        {fieldImage ? (
                            <Image image={fieldImage} width={pitchWidth} height={pitchHeight} crop={getBackgroundCrop()} />
                        ) : (
                            <Rect width={pitchWidth} height={pitchHeight} fill="#2d5016" />
                        )}

                        {backgroundElements.map(renderWithOverride)}
                        {foregroundElements.map(renderWithOverride)}
                        {previewElement && renderElement(previewElement, false)}
                        {selectedId && !activeTool && (() => {
                            const selected = elements.find(e => e.id === selectedId);
                            if (!selected) return null;
                            const withOverride = handleOverride?.id === selected.id ? { ...selected, ...handleOverride.patch } : selected;
                            return renderSelectionHandles(withOverride);
                        })()}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
});

BoardCanvas.displayName = 'BoardCanvas';
