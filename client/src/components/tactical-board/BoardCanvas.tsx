import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Stage, Layer, Image, Group, Circle, Rect, Line, Text, Arrow } from 'react-konva';
import { Stage as StageType } from 'konva/lib/Stage';
import { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import footballPitchSvg from '@/assets/football-pitch.svg';
import footballBallSvgRaw from '@/assets/tactical-icons/football-ball.svg?raw';
import { BoardElement, BackgroundType, TextSubtype, PITCH_WIDTH, PITCH_HEIGHT, TEAM_COLORS, CONTENT_SCALE, TEXT_PRESETS, svgToDataUri } from './types';

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

export const BoardCanvas = forwardRef<BoardCanvasHandle, BoardCanvasProps>(({
    zoom = 1,
    onZoomChange,
    activeTool,
    elements,
    onElementsChange,
    selectedId,
    onSelect,
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

        if (activeTool === 'line' || activeTool === 'dribble' || activeTool === 'arrow' || activeTool === 'curve') {
            const dx = pos.x - drawingStart.x;
            const dy = pos.y - drawingStart.y;
            setPreviewElement({ ...previewElement, points: [0, 0, dx, dy] });
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

        if (onToolUsed) onToolUsed();
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

    const handleElementDblClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        e.cancelBubble = true;
        onSelect(null);
    }, [onSelect]);

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
            onDblClick: handleElementDblClick,
            onDblTap: handleElementDblClick,
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
                return <Circle {...baseProps} radius={8 * S} fill="orange" stroke="black" strokeWidth={S} shadowBlur={isSelected ? 6 * S : 0} />;
            }
            if (el.subtype === 'goal') {
                return <Rect {...baseProps} width={40 * S} height={10 * S} fill="white" stroke="black" strokeWidth={S} opacity={0.5} shadowBlur={isSelected ? 6 * S : 0} />;
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
            const shadow = isSelected ? { shadowBlur: 6 * S, shadowColor: '#3b82f6' } : {};

            if (el.subtype === 'line' || el.subtype === 'dribble') {
                return (
                    <Line
                        {...baseProps}
                        points={el.points || [0, 0]}
                        stroke={strokeColor}
                        strokeWidth={2.5 * S}
                        dash={el.subtype === 'dribble' ? [6 * S, 5 * S] : undefined}
                        tension={el.subtype === 'dribble' ? 0.5 : 0}
                        {...shadow}
                    />
                );
            }
            if (el.subtype === 'curve') {
                const pts = el.points || [0, 0, 0, 0];
                return (
                    <Line
                        {...baseProps}
                        points={pts}
                        stroke={strokeColor}
                        strokeWidth={2.5 * S}
                        tension={0.5}
                        {...shadow}
                    />
                );
            }
            if (el.subtype === 'arrow') {
                return (
                    <Arrow
                        {...baseProps}
                        points={el.points || [0, 0]}
                        stroke={strokeColor}
                        strokeWidth={2.5 * S}
                        fill={strokeColor}
                        pointerLength={10 * S}
                        pointerWidth={10 * S}
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
                        strokeWidth={2.5 * S}
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
                        strokeWidth={2.5 * S}
                        fill={el.fill ? strokeColor : undefined}
                        opacity={el.fill ? (el.opacity ?? zoneOpacity) : 1}
                        {...shadow}
                    />
                );
            }
        }

        return null;
    };

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
                    onWheel={handleWheel}
                    style={{ cursor: isPanning ? 'grab' : isDrawingTool ? 'crosshair' : 'default' }}
                >
                    <Layer>
                        {fieldImage ? (
                            <Image image={fieldImage} width={pitchWidth} height={pitchHeight} crop={getBackgroundCrop()} />
                        ) : (
                            <Rect width={pitchWidth} height={pitchHeight} fill="#2d5016" />
                        )}

                        {elements.map((el) => renderElement(el, el.id === selectedId))}
                        {previewElement && renderElement(previewElement, false)}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
});

BoardCanvas.displayName = 'BoardCanvas';
