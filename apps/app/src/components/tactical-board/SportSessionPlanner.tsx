import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useSearch } from 'wouter';
import { TacticalBoardLayout } from './TacticalBoardLayout';
import { SidebarTools } from './SidebarTools';
import { BoardCanvas, BoardCanvasHandle } from './BoardCanvas';
import { PropertiesPanel, PropertiesPanelHandle } from './PropertiesPanel';
import { SaveBoardDialog } from './SaveBoardDialog';
import { LoadBoardDialog } from './LoadBoardDialog';
import { HelpDialog } from './HelpDialog';
import { Button } from '@/components/ui/button';
import {
    Save, FolderOpen, Download, Undo2, Redo2, Trash2, ZoomIn, ZoomOut,
    Link as LinkIcon, HelpCircle, Eye, FlipHorizontal, ChevronDown, Image as ImageIcon, FileCode,
    CheckCircle2, MoreVertical
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { elementsToSvgString, downloadSvg } from '@/lib/tactical-board-svg-export';
import type { Formation } from '@/stores/tacticalBoardStore';
import { BoardElement, BackgroundType, Team, TextSubtype, PITCH_WIDTH, PITCH_HEIGHT, TEAM_COLORS, GK_COLOR, CONTENT_SCALE, TEXT_PRESETS } from './types';

const COLORBLIND_STORAGE_KEY = 'tactical-board-colorblind-mode';

// Generic past/present/future history so every discrete board mutation
// (drop, draw, drag-end, delete, formation apply) is one undo step.
function useHistoryState<T>(initial: T) {
    const [past, setPast] = useState<T[]>([]);
    const [present, setPresent] = useState<T>(initial);
    const [future, setFuture] = useState<T[]>([]);

    const set = useCallback((updater: T | ((prev: T) => T)) => {
        setPresent((prev) => {
            const next = typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
            setPast((p) => [...p, prev]);
            setFuture([]);
            return next;
        });
    }, []);

    // Replace current state without recording a history entry (used when loading a board).
    const reset = useCallback((value: T) => {
        setPast([]);
        setFuture([]);
        setPresent(value);
    }, []);

    const undo = useCallback(() => {
        setPast((p) => {
            if (p.length === 0) return p;
            const previous = p[p.length - 1];
            setFuture((f) => [present, ...f]);
            setPresent(previous);
            return p.slice(0, -1);
        });
    }, [present]);

    const redo = useCallback(() => {
        setFuture((f) => {
            if (f.length === 0) return f;
            const next = f[0];
            setPast((p) => [...p, present]);
            setPresent(next);
            return f.slice(1);
        });
    }, [present]);

    return { value: present, set, reset, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

function formationPlayerToPixel(p: { x: number; y: number }, team: Team): { x: number; y: number } {
    const halfW = PITCH_WIDTH / 2;
    // Formation presets use a vertical (0-100%) layout where y=90 is deepest
    // (near own goal) and y=25 is furthest forward. The board pitch is
    // landscape, so depth maps to X (each team occupying its own half) and
    // the preset's x (left-right spread) maps to Y.
    const depth = (100 - p.y) / 100; // 0 = own goal, ~0.75 = forward
    const x = team === 'home' ? depth * halfW : PITCH_WIDTH - depth * halfW;
    const y = (p.x / 100) * PITCH_HEIGHT;
    return { x, y };
}

export default function SportSessionPlanner() {
    const { toast } = useToast();
    const canvasRef = useRef<BoardCanvasHandle>(null);
    const propertiesPanelRef = useRef<PropertiesPanelHandle>(null);
    const search = useSearch();
    // Opened from the training session's "Open Tactical Board" button — on save,
    // the drawing is sent back to that tab instead of only living here.
    const returnParams = new URLSearchParams(search);
    const isTrainingReturn = returnParams.get('returnTo') === 'training-image' && !!window.opener;
    const trainingReturnToken = returnParams.get('token');

    const [zoom, setZoom] = useState(1);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const { value: elements, set: setElements, reset: resetElements, undo, redo, canUndo, canRedo } = useHistoryState<BoardElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // Which element's Properties panel is showing - deliberately separate
    // from selectedId. Clicking a player or the ball just selects it (for
    // dragging/highlight) without popping the panel open, so repositioning
    // a lot of players in a row stays fast; a double-click on a player
    // explicitly opens it. Every other element type still opens on a plain
    // click, same as before.
    const [propertiesOpenForId, setPropertiesOpenForId] = useState<string | null>(null);
    const [backgroundType, setBackgroundType] = useState<BackgroundType>('full');
    const [halfSide, setHalfSide] = useState<'left' | 'right'>('left');
    const [drawColor, setDrawColor] = useState('white');

    const [colorblindMode, setColorblindMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(COLORBLIND_STORAGE_KEY) === 'true';
    });

    const [isSaveOpen, setIsSaveOpen] = useState(false);
    const [isLoadOpen, setIsLoadOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentBoardId, setCurrentBoardId] = useState<number | null>(null);
    const [currentBoardName, setCurrentBoardName] = useState('');
    const [currentBoardIsPublic, setCurrentBoardIsPublic] = useState(false);

    const propertiesOpenElement = elements.find(el => el.id === propertiesOpenForId) || null;

    useEffect(() => {
        window.localStorage.setItem(COLORBLIND_STORAGE_KEY, String(colorblindMode));
    }, [colorblindMode]);

    // Load a board referenced by ?board=<id> in the URL (shared link).
    useEffect(() => {
        const params = new URLSearchParams(search);
        const boardId = params.get('board');
        if (!boardId) return;

        (async () => {
            try {
                const board = await apiRequest('GET', `/api/tactical-boards/${boardId}`);
                resetElements(board.drawingElements || []);
                setCurrentBoardId(board.id);
                setCurrentBoardName(board.name);
                setCurrentBoardIsPublic(!!board.isPublic);
                toast({ title: 'Board Loaded', description: `Loaded "${board.name}" from shared link.` });
            } catch (error) {
                console.error(error);
                toast({ title: 'Error', description: 'Could not load the shared tactical board.', variant: 'destructive' });
            }
        })();
        // Only run on initial mount / when the URL search string actually changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Selecting a shape on the canvas exits draw mode - otherwise the
    // element would show as selected while a drawing tool is still "active",
    // which is confusing (clicking empty pitch again would start a new
    // drawing instead of doing nothing).
    const handleSelect = useCallback((id: string | null) => {
        // Selecting a different element or clicking away both drop whatever
        // was selected before - apply any edits still staged in the
        // Properties panel first instead of silently losing them.
        propertiesPanelRef.current?.commitPending();
        setSelectedId(id);
        if (id) setActiveTool(null);

        if (!id) {
            setPropertiesOpenForId(null);
            return;
        }
        const el = elements.find(e => e.id === id);
        // Players and the ball don't pop the panel open on a plain click -
        // see the propertiesOpenForId comment above.
        const suppressAutoOpen = el?.type === 'player' || (el?.type === 'equipment' && el.subtype === 'ball');
        setPropertiesOpenForId(suppressAutoOpen ? null : id);
    }, [elements]);

    // Explicit "show properties now" request - currently only reachable by
    // double-clicking a player on the canvas.
    const handleOpenProperties = useCallback((id: string) => {
        setSelectedId(id);
        setActiveTool(null);
        setPropertiesOpenForId(id);
    }, []);

    const handleClosePropertiesPanel = useCallback(() => {
        setSelectedId(null);
        setPropertiesOpenForId(null);
    }, []);

    const handleToolSelect = (tool: string) => {
        if (tool === 'bg-full') {
            setBackgroundType('full');
        } else if (tool === 'bg-half') {
            setBackgroundType('half');
        } else if (tool === 'bg-flip') {
            setHalfSide(s => s === 'left' ? 'right' : 'left');
        } else {
            propertiesPanelRef.current?.commitPending();
            setActiveTool(current => current === tool ? null : tool);
            setSelectedId(null);
            setPropertiesOpenForId(null);
        }
    };

    const handleApplyFormation = (formation: Formation, team: Team) => {
        const newPlayers: BoardElement[] = formation.players.map((p, i) => {
            const pos = formationPlayerToPixel(p, team);
            const isGoalkeeper = p.position === 'Goalkeeper' || p.name === 'GK';
            return {
                id: `formation-${Date.now()}-${i}`,
                type: 'player',
                x: pos.x,
                y: pos.y,
                color: isGoalkeeper ? GK_COLOR : TEAM_COLORS[team],
                team,
                number: p.number,
                positionLabel: p.position,
                rotation: 0,
            };
        });

        setElements(prev => [...prev.filter(el => !(el.type === 'player' && el.team === team)), ...newPlayers]);
        setSelectedId(null);
        setPropertiesOpenForId(null);
        toast({ title: 'Formation Applied', description: `${formation.name} applied to ${team === 'home' ? 'Home' : 'Away'} team.` });
    };

    // Lets a sidebar item be placed on the pitch with a double-click, as an
    // alternative to drag-and-drop. Lands near the center of the currently
    // visible pitch (full or half), with a small random offset so repeated
    // double-clicks don't stack exactly on top of each other.
    const addElementFromPalette = (data: { type: BoardElement['type']; subtype?: BoardElement['subtype']; color?: string; team?: Team; number?: number }) => {
        const centerX = backgroundType === 'half' ? PITCH_WIDTH / 4 : PITCH_WIDTH / 2;
        const centerY = PITCH_HEIGHT / 2;
        const jitter = () => (Math.random() - 0.5) * 50 * CONTENT_SCALE;
        const textPreset = data.type === 'text' ? TEXT_PRESETS[data.subtype as TextSubtype] : undefined;

        const newElement: BoardElement = {
            id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: data.type,
            subtype: data.subtype,
            x: centerX + jitter(),
            y: centerY + jitter(),
            color: data.color || (textPreset ? 'white' : undefined),
            team: data.team,
            number: data.number,
            rotation: 0,
            ...textPreset,
        };

        setElements(prev => [...prev, newElement]);
        setSelectedId(newElement.id);
        setActiveTool(null);
        // Same player/ball exception as handleSelect - everything else (text,
        // cones, goals) still opens its Properties panel right away so it
        // can be tweaked immediately after being placed.
        const suppressAutoOpen = newElement.type === 'player' || (newElement.type === 'equipment' && newElement.subtype === 'ball');
        setPropertiesOpenForId(suppressAutoOpen ? null : newElement.id);
    };

    const updateElement = (id: string, updates: Partial<BoardElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElement = useCallback((id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
        setSelectedId(current => current === id ? null : current);
        setPropertiesOpenForId(current => current === id ? null : current);
    }, [setElements]);

    const handleClearBoard = () => {
        if (window.confirm('Are you sure you want to clear the board?')) {
            setElements([]);
            setSelectedId(null);
            setPropertiesOpenForId(null);
        }
    };

    // Keyboard shortcuts: undo/redo and delete-selected.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (isTyping) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault();
                deleteElement(selectedId);
            } else if (e.key === 'Escape') {
                // Deselect whichever shape is selected, and cancel the active drawing tool.
                setSelectedId(null);
                setPropertiesOpenForId(null);
                setActiveTool(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, undo, redo, deleteElement]);

    const handleExportPng = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL();
        const link = document.createElement('a');
        link.download = `${currentBoardName || 'tactical-board'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportSvg = () => {
        const svg = elementsToSvgString(elements, backgroundType, PITCH_WIDTH, PITCH_HEIGHT, halfSide);
        downloadSvg(svg, `${currentBoardName || 'tactical-board'}.svg`);
    };

    const handleSave = async (data: { name: string; description: string; tags: string[]; isPublic: boolean; imageType?: string }) => {
        if (!canvasRef.current) return;

        setIsSaving(true);
        try {
            const thumbnail = canvasRef.current.toDataURL();

            const payload = {
                name: data.name,
                description: data.description,
                tags: data.tags,
                drawingElements: elements,
                thumbnail,
                formation: 'custom',
                isPublic: data.isPublic,
            };

            const saved = currentBoardId
                ? await apiRequest('PUT', `/api/tactical-boards/${currentBoardId}`, payload)
                : await apiRequest('POST', '/api/tactical-boards', payload);

            setCurrentBoardId(saved.id);
            setCurrentBoardName(saved.name);
            setCurrentBoardIsPublic(saved.isPublic);

            if (isTrainingReturn) {
                window.opener.postMessage(
                    { type: 'tactical-board-saved', url: thumbnail, name: saved.name, token: trainingReturnToken, imageType: data.imageType },
                    window.location.origin
                );
                toast({ title: 'Sent to Training Session', description: 'Your drawing was added to the training session. You can return to that tab now.' });
            } else {
                toast({ title: 'Session Saved', description: 'Your tactical session has been saved successfully.' });
            }
            queryClient.invalidateQueries({ queryKey: ['tactical-boards'] });
            setIsSaveOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to save session.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoad = (board: any) => {
        if (elements.length === 0 || window.confirm('Loading a session will replace your current board. Continue?')) {
            resetElements(board.drawingElements || []);
            setSelectedId(null);
            setPropertiesOpenForId(null);
            setCurrentBoardId(board.id);
            setCurrentBoardName(board.name);
            setCurrentBoardIsPublic(!!board.isPublic);
            setIsLoadOpen(false);
            toast({ title: 'Session Loaded', description: `Loaded "${board.name}"` });
        }
    };

    const handleCopyLink = async () => {
        if (!currentBoardId) {
            toast({ title: 'Save first', description: 'Save the board before copying a share link.', variant: 'destructive' });
            return;
        }
        const url = `${window.location.origin}/interactive-tactical-board?board=${currentBoardId}`;
        try {
            await navigator.clipboard.writeText(url);
            toast({ title: 'Link Copied', description: currentBoardIsPublic ? 'Anyone with this link can view the board.' : 'Only your account can open this link (board is private).' });
        } catch {
            toast({ title: 'Copy Failed', description: url });
        }
    };

    return (
        <>
            <TacticalBoardLayout
                toolbar={
                    <>
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <h2 className="font-bold text-base sm:text-lg mr-1 sm:mr-2 shrink-0">Session Planner</h2>
                            {activeTool && !activeTool.startsWith('bg-') && (
                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase border border-primary/20 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    {activeTool}
                                </div>
                            )}
                            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
                                    <Redo2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Clear Board"
                                    onClick={handleClearBoard}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
                            <Toggle
                                pressed={colorblindMode}
                                onPressedChange={setColorblindMode}
                                size="sm"
                                className="gap-2 text-xs"
                                title="Render teams with distinct patterns, not just color"
                            >
                                <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Colorblind Mode</span>
                            </Toggle>
                            {backgroundType === 'half' && (
                                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleToolSelect('bg-flip')}>
                                    <FlipHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Flip Half</span>
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs w-10 sm:w-12 text-center">{Math.round(zoom * 100)}%</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Full action set - visible from md up */}
                            <div className="hidden md:flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Help" onClick={() => setIsHelpOpen(true)}>
                                    <HelpCircle className="h-4 w-4" />
                                </Button>

                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsLoadOpen(true)}>
                                    <FolderOpen className="h-4 w-4" />
                                    Load
                                </Button>

                                <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyLink}>
                                    <LinkIcon className="h-4 w-4" />
                                    Copy Link
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Export
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleExportPng} className="gap-2">
                                            <ImageIcon className="h-4 w-4" /> PNG image
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportSvg} className="gap-2">
                                            <FileCode className="h-4 w-4" /> SVG vector
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Collapsed action set - phones/tablets */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 md:hidden" title="More actions">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="md:hidden">
                                    <DropdownMenuItem onClick={() => setIsHelpOpen(true)} className="gap-2">
                                        <HelpCircle className="h-4 w-4" /> Help
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsLoadOpen(true)} className="gap-2">
                                        <FolderOpen className="h-4 w-4" /> Load
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                                        <LinkIcon className="h-4 w-4" /> Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportPng} className="gap-2">
                                        <ImageIcon className="h-4 w-4" /> Export PNG
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportSvg} className="gap-2">
                                        <FileCode className="h-4 w-4" /> Export SVG
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button size="sm" className="gap-2" onClick={() => setIsSaveOpen(true)}>
                                <Save className="h-4 w-4" />
                                <span className="hidden sm:inline">Save Session</span>
                            </Button>

                            {isTrainingReturn && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="gap-2"
                                    title="Save first, then finish to return to the training session tab"
                                    onClick={() => window.close()}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Done
                                </Button>
                            )}
                        </div>
                    </>
                }
                sidebar={
                    <SidebarTools
                        onToolSelect={handleToolSelect}
                        onApplyFormation={handleApplyFormation}
                        onAddItem={addElementFromPalette}
                        drawColor={drawColor}
                        onDrawColorChange={setDrawColor}
                    />
                }
                canvas={
                    <div className="flex items-center justify-center p-2 bg-zinc-900/50 min-h-full w-full">
                        <BoardCanvas
                            ref={canvasRef}
                            zoom={zoom}
                            onZoomChange={setZoom}
                            activeTool={activeTool}
                            elements={elements}
                            onElementsChange={setElements}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            onOpenProperties={handleOpenProperties}
                            backgroundType={backgroundType}
                            halfSide={halfSide}
                            colorblindMode={colorblindMode}
                            drawColor={drawColor}
                            onToolUsed={() => setActiveTool(null)}
                        />
                    </div>
                }
                propertiesPanel={
                    propertiesOpenElement && (
                        <PropertiesPanel
                            ref={propertiesPanelRef}
                            element={propertiesOpenElement}
                            onUpdate={updateElement}
                            onDelete={deleteElement}
                            onClose={handleClosePropertiesPanel}
                            colorblindMode={colorblindMode}
                            players={elements.filter(el => el.type === 'player')}
                        />
                    )
                }
            />

            <SaveBoardDialog
                isOpen={isSaveOpen}
                onClose={() => setIsSaveOpen(false)}
                onSave={handleSave}
                isSaving={isSaving}
                initialName={currentBoardName}
                initialIsPublic={currentBoardIsPublic}
                requireImageType={isTrainingReturn}
            />

            <LoadBoardDialog
                isOpen={isLoadOpen}
                onClose={() => setIsLoadOpen(false)}
                onLoad={handleLoad}
            />

            <HelpDialog isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </>
    );
}
