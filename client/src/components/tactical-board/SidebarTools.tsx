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
import { useI18n } from '@/contexts/I18nContext';

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
    const { t, isRtl } = useI18n();

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
        <div className="h-full flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">{t('board.toolsLibrary.title')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('board.toolsLibrary.subtitle')}</p>
            </div>

            <ScrollArea className="flex-1">
                <Accordion type="multiple" defaultValue={['players', 'formations', 'equipment', 'lines']} className="w-full">
                    {/* Players Section */}
                    <AccordionItem value="players">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{t('board.players.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <DraggableItem type="player" team="home" color="#2563eb" number={10} label={t('board.players.home')} icon={<div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">10</div>} onAdd={() => onAddItem({ type: 'player', team: 'home', color: '#2563eb', number: 10 })} />
                                <DraggableItem type="player" team="away" color="#f97316" number={10} label={t('board.players.away')} icon={<div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">10</div>} onAdd={() => onAddItem({ type: 'player', team: 'away', color: '#f97316', number: 10 })} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">{t('board.players.help')}</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Formations Section */}
                    <AccordionItem value="formations">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                <span>{t('board.formations.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="space-y-3">
                                <Select value={selectedFormationId} onValueChange={setSelectedFormationId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('board.formations.choosePlaceholder')} />
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
                                                {t('board.formations.applyHome')}
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-xs" onClick={() => onApplyFormation(selectedFormation, 'away')}>
                                                {t('board.formations.applyAway')}
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
                                            {isDefault ? t('board.formations.defaultFormation') : t('board.formations.setDefault')}
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
                                <span>{t('board.equipment.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-3 gap-2">
                                <DraggableItem type="equipment" subtype="ball" label={t('board.equipment.football')} icon={<img src={footballBallSvg} alt={t('board.equipment.football')} className="w-6 h-6" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'ball' })} />
                                <DraggableItem type="equipment" subtype="cone" label={t('board.equipment.cone')} icon={<div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-orange-500" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'cone' })} />
                                <DraggableItem type="equipment" subtype="goal" label={t('board.equipment.goal')} icon={<div className="w-8 h-6 border-2 border-black bg-white/50" />} onAdd={() => onAddItem({ type: 'equipment', subtype: 'goal' })} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">{t('board.equipment.help')}</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Lines & Shapes */}
                    <AccordionItem value="lines">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Minus className="h-4 w-4" />
                                <span>{t('board.lines.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="mb-3">
                                <span className="text-xs text-muted-foreground mb-2 block">{t('board.lines.colorLabel')}</span>
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
                                    <Minus className="h-4 w-4" /> {t('board.lines.straightLine')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('arrow')}>
                                    <div className="flex items-center"><Minus className="h-4 w-4" /><div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-current"></div></div> {t('board.lines.arrow')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('doubleArrow')}>
                                    <div className="flex items-center"><div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-current"></div><Minus className="h-4 w-4" /><div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-current"></div></div> {t('board.lines.doubleArrow')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('curve')}>
                                    <div className="h-4 w-4 border-t-2 border-current rounded-full" /> {t('board.lines.curvedLine')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('dribble')}>
                                    <div className="h-4 w-4 border-t-2 border-dashed border-current rounded-full" /> {t('board.lines.dribbleLine')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('square')}>
                                    <div className="w-4 h-4 border-2 border-current" /> {t('board.lines.rectangleZone')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('circle')}>
                                    <div className="w-4 h-4 border-2 border-current rounded-full" /> {t('board.lines.circleZone')}
                                </Button>
                                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2" onClick={() => onToolSelect('pan')}>
                                    <div className="h-4 w-4 flex items-center justify-center text-xs">✋</div> {t('board.lines.panTool')}
                                </Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Text Section */}
                    <AccordionItem value="text">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                <span>{t('board.text.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <DraggableItem
                                    type="text"
                                    subtype="title"
                                    label={t('board.text.title')}
                                    icon={<span className="text-sm font-bold leading-none">{t('board.text.title')}</span>}
                                    onAdd={() => onAddItem({ type: 'text', subtype: 'title' })}
                                />
                                <DraggableItem
                                    type="text"
                                    subtype="paragraph"
                                    label={t('board.text.paragraph')}
                                    icon={<span className="text-[10px] leading-tight text-center">{t('board.text.paragraphPreview')}</span>}
                                    onAdd={() => onAddItem({ type: 'text', subtype: 'paragraph' })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">{t('board.text.help')}</p>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Backgrounds */}
                    <AccordionItem value="backgrounds">
                        <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span>{t('board.pitchView.section')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="aspect-video bg-green-700 border rounded cursor-pointer hover:ring-2 ring-primary flex items-center justify-center text-[10px] text-white" onClick={() => onToolSelect('bg-full')}>{t('board.pitchView.fullPitch')}</div>
                                <div className="aspect-[3/4] bg-green-700 border rounded cursor-pointer hover:ring-2 ring-primary flex items-center justify-center text-[10px] text-white" onClick={() => onToolSelect('bg-half')}>{t('board.pitchView.halfPitch')}</div>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onToolSelect('bg-flip')}>
                                {t('board.pitchView.flipHalfSide')}
                            </Button>
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </ScrollArea>
        </div>
    );
}
