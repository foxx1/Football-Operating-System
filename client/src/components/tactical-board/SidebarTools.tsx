import React from 'react';
import {
    Users,
    Target,
    Minus,
    Image as ImageIcon,
    LayoutGrid,
    Type,
    Star,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DraggableItem } from './DraggableItem';
import { useTacticalBoard } from '@/stores/tacticalBoardStore';
import type { Formation } from '@/stores/tacticalBoardStore';
import { PLAYER_PALETTE, svgToDataUri, type Team, type BoardElement } from './types';
import footballBallSvgRaw from '@/assets/tactical-icons/football-ball.svg?raw';

const footballBallSvg = svgToDataUri(footballBallSvgRaw);

const DEFAULT_FORMATION_STORAGE_KEY = 'tactical-board-default-formation';

type PaletteItem = { type: BoardElement['type']; subtype?: BoardElement['subtype']; color?: string; team?: Team; number?: number };

interface SidebarToolsProps {
    onToolSelect: (tool: string) => void;
    onApplyFormation: (formation: Formation, team: Team) => void;
    onAddItem: (item: PaletteItem) => void;
    drawColor: string;
    onDrawColorChange: (color: string) => void;
}

export const SidebarTools: React.FC<SidebarToolsProps> = ({ onToolSelect, onApplyFormation, onAddItem, drawColor, onDrawColorChange }) => {
    const formations = useTacticalBoard((s) => s.formations);

    // Remembers the user's preferred formation across visits (per browser).
    // Picking one from the dropdown just previews it here; "Set as Default"
    // is what persists it and pre-selects it next time the board is opened.
    const [defaultFormationId, setDefaultFormationId] = React.useState<string>(() => {
        if (typeof window === 'undefined') return '';
        return window.localStorage.getItem(DEFAULT_FORMATION_STORAGE_KEY) || '';
    });
    const [selectedFormationId, setSelectedFormationId] = React.useState<string>(
        () => defaultFormationId || formations[0]?.id || ''
    );
    const selectedFormation = formations.find((f) => f.id === selectedFormationId) || formations[0];
    const isDefault = !!selectedFormation && selectedFormation.id === defaultFormationId;

    const handleSetDefaultFormation = () => {
        if (!selectedFormation) return;
        window.localStorage.setItem(DEFAULT_FORMATION_STORAGE_KEY, selectedFormation.id);
        setDefaultFormationId(selectedFormation.id);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Tools & Library</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Players, formations, equipment, and drawing tools for building your tactic</p>
            </div>

            <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={['players', 'formations', 'equipment', 'lines']} className="w-full">
                    {/* Players Section */}
                    <AccordionItem value="players">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Players</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <DraggableItem type="player" team="home" color="#2563eb" number={10} label="Home" icon={<div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">10</div>} onAdd={() => onAddItem({ type: 'player', team: 'home', color: '#2563eb', number: 10 })} />
                                <DraggableItem type="player" team="away" color="#f97316" number={10} label="Away" icon={<div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">10</div>} onAdd={() => onAddItem({ type: 'player', team: 'away', color: '#f97316', number: 10 })} />
                                <DraggableItem type="player" team="home" color="yellow" number={1} label="Home GK" icon={<div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white shadow-sm flex items-center justify-center text-black text-xs font-bold">1</div>} onAdd={() => onAddItem({ type: 'player', team: 'home', color: 'yellow', number: 1 })} />
                                <DraggableItem type="player" team="away" color="yellow" number={1} label="Away GK" icon={<div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white shadow-sm flex items-center justify-center text-black text-xs font-bold">1</div>} onAdd={() => onAddItem({ type: 'player', team: 'away', color: 'yellow', number: 1 })} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Drag a player onto the pitch, or double-click to place it instantly. Select a placed player to edit their number and position.</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Formations Section */}
                    <AccordionItem value="formations">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                <span>Formations</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="space-y-3">
                                <Select value={selectedFormationId} onValueChange={setSelectedFormationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a formation…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {formations.map((formation) => (
                                            <SelectItem key={formation.id} value={formation.id}>
                                                {formation.id === defaultFormationId ? '★ ' : ''}{formation.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedFormation && (
                                    <div className="border rounded-md p-2">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="text-sm font-medium leading-tight" title={selectedFormation.name}>{selectedFormation.name}</span>
                                            <Badge variant="outline" className="text-[10px] capitalize shrink-0">{selectedFormation.category}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{selectedFormation.description}</p>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <Button size="sm" variant="outline" className="text-xs" onClick={() => onApplyFormation(selectedFormation, 'home')}>
                                                Apply Home
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-xs" onClick={() => onApplyFormation(selectedFormation, 'away')}>
                                                Apply Away
                                            </Button>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={isDefault ? 'secondary' : 'ghost'}
                                            className="w-full text-xs gap-1.5"
                                            onClick={handleSetDefaultFormation}
                                            disabled={isDefault}
                                        >
                                            <Star className={`h-3 w-3 ${isDefault ? 'fill-current' : ''}`} />
                                            {isDefault ? 'Default Formation' : 'Set as Default'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Equipment Section */}
                    <AccordionItem value="equipment">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                <span>Equipment</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-3 gap-2">
                                <DraggableItem type="equipment" subtype="ball" label="Football" icon={<img src={footballBallSvg} alt="Football" className="w-6 h-6" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'ball' })} />
                                <DraggableItem type="equipment" subtype="cone" label="Cone" icon={<div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-orange-500" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'cone' })} />
                                <DraggableItem type="equipment" subtype="goal" label="Goal" icon={<div className="w-8 h-6 border-2 border-black bg-white/50" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'goal' })} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Drag onto the pitch, or double-click to place instantly.</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Lines & Shapes */}
                    <AccordionItem value="lines">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Minus className="h-4 w-4" />
                                <span>Lines & Shapes</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="mb-3">
                                <span className="text-xs text-muted-foreground mb-2 block">Line / Shape Color</span>
                                <div className="grid grid-cols-8 gap-1.5">
                                    {PLAYER_PALETTE.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            title={c}
                                            className={`w-full aspect-square rounded-full border shadow-sm transition-all ${drawColor === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : 'border-muted-foreground/30'}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => onDrawColorChange(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('line')}>
                                    <Minus className="h-4 w-4" /> Straight Line
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('arrow')}>
                                    <div className="flex items-center"><Minus className="h-4 w-4" /><div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-current"></div></div> Arrow
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('curve')}>
                                    <div className="h-4 w-4 border-t-2 border-current rounded-full" /> Curved Line
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('dribble')}>
                                    <div className="h-4 w-4 border-t-2 border-dashed border-current rounded-full" /> Dribble Line
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('square')}>
                                    <div className="w-4 h-4 border-2 border-current" /> Rectangle / Zone
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('circle')}>
                                    <div className="w-4 h-4 border-2 border-current rounded-full" /> Circle / Zone
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('pan')}>
                                    <div className="h-4 w-4 flex items-center justify-center text-xs">✋</div> Pan Tool
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Text Section */}
                    <AccordionItem value="text">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                <span>Text</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <DraggableItem
                                    type="text"
                                    subtype="title"
                                    label="Title"
                                    icon={<span className="text-sm font-bold leading-none">Title</span>}
                                    onAdd={() => onAddItem({ type: 'text', subtype: 'title' })}
                                />
                                <DraggableItem
                                    type="text"
                                    subtype="paragraph"
                                    label="Paragraph"
                                    icon={<span className="text-[10px] leading-tight text-center">Paragraph text</span>}
                                    onAdd={() => onAddItem({ type: 'text', subtype: 'paragraph' })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">Drag onto the pitch, or double-click to place instantly. Drag the text box to reposition it, and select it to edit content, font, style, color, size, and alignment in the Properties panel.</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Backgrounds */}
                    <AccordionItem value="backgrounds">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>Pitch View</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="aspect-video bg-green-700 border rounded cursor-pointer hover:ring-2 ring-primary flex items-center justify-center text-[10px] text-white" onClick={() => onToolSelect('bg-full')}>Full Pitch</div>
                                <div className="aspect-[3/4] bg-green-700 border rounded cursor-pointer hover:ring-2 ring-primary flex items-center justify-center text-[10px] text-white" onClick={() => onToolSelect('bg-half')}>Half Pitch</div>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onToolSelect('bg-flip')}>
                                Flip Half Side
                            </Button>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </ScrollArea>
        </div>
    );
}
