import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Minus, Plus, UserSquare2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FONT_FAMILIES, DEFAULT_STROKE_WIDTH, type BoardElement } from './types';
import type { Player as RosterPlayer } from '@shared/schema';
import { useI18n, translateWithParams } from '@/contexts/I18nContext';

interface PropertiesPanelProps {
    element: BoardElement | null;
    onUpdate: (id: string, updates: Partial<BoardElement>) => void;
    onDelete: (id: string) => void;
    onClose?: () => void;
    colorblindMode?: boolean;
    // Players currently placed on the board, offered as connection targets
    // so a line/arrow/curve endpoint can track a player as they move.
    players?: BoardElement[];
}

// Drawing subtypes with a distinct start and end point (as opposed to
// square/circle, which don't have a "start"/"end" to attach to a player).
const ENDPOINT_SUBTYPES = new Set(['line', 'dribble', 'arrow', 'curve']);

export interface PropertiesPanelHandle {
    // Applies any staged (not-yet-OK'd) edits, e.g. typed text, as a single
    // update. The parent calls this right before it deselects the element
    // from underneath this panel (clicking away, picking another tool) so
    // that flow no longer silently discards in-progress edits the way
    // relying on the OK button alone did.
    commitPending: () => void;
}

const POSITION_ABBREVIATIONS: Record<string, string> = {
    goalkeeper: 'GK',
    defender: 'DF',
    midfielder: 'MF',
    forward: 'FW',
};

function abbreviatePosition(position: string): string {
    return POSITION_ABBREVIATIONS[position.toLowerCase()] || position.slice(0, 2).toUpperCase();
}

// Bold/italic are independent toggles that both live in Konva's single
// `fontStyle` string ('normal' | 'bold' | 'italic' | 'italic bold').
function toggleFontStyle(current: BoardElement['fontStyle'], toggle: 'bold' | 'italic'): BoardElement['fontStyle'] {
    const hasBold = current === 'bold' || current === 'italic bold';
    const hasItalic = current === 'italic' || current === 'italic bold';
    const nextBold = toggle === 'bold' ? !hasBold : hasBold;
    const nextItalic = toggle === 'italic' ? !hasItalic : hasItalic;
    if (nextBold && nextItalic) return 'italic bold';
    if (nextBold) return 'bold';
    if (nextItalic) return 'italic';
    return 'normal';
}

// Maps a board element's internal type/subtype identifiers to a translated,
// human-readable description shown in the panel header.
const TYPE_LABEL_KEYS: Record<string, string> = {
    player: 'board.type.player',
    equipment: 'board.type.equipment',
    text: 'board.type.text',
    drawing: 'board.type.drawing',
};

const SUBTYPE_LABEL_KEYS: Record<string, string> = {
    ball: 'board.equipment.football',
    cone: 'board.equipment.cone',
    goal: 'board.equipment.goal',
    line: 'board.lines.straightLine',
    arrow: 'board.lines.arrow',
    curve: 'board.lines.curvedLine',
    dribble: 'board.lines.dribbleLine',
    square: 'board.lines.rectangleZone',
    circle: 'board.lines.circleZone',
    title: 'board.text.title',
    paragraph: 'board.text.paragraph',
};

export const PropertiesPanel = forwardRef<PropertiesPanelHandle, PropertiesPanelProps>(({
    element,
    onUpdate,
    onDelete,
    onClose,
    colorblindMode = false,
    players = [],
}, ref) => {
    const { t, isRtl } = useI18n();

    const playerLabel = (p: BoardElement) => {
        const team = p.team === 'home' ? t('board.players.home') : t('board.players.away');
        const num = p.number != null ? `#${p.number}` : '';
        const name = p.playerName ? ` ${p.playerName}` : '';
        return `${team} ${num}${name}`.trim();
    };

    // Only fetched while a player element is selected - the roster picker
    // is the only consumer of this data in this panel.
    const { data: rosterPlayers = [] } = useQuery<RosterPlayer[]>({
        queryKey: ['/api/players'],
        enabled: element?.type === 'player',
    });

    // Edits made in this panel are staged here rather than applied
    // immediately - OK commits them with a single onUpdate, Cancel just
    // drops this state so nothing was ever written back. Reset whenever
    // the selected element changes (including deselect).
    const [pending, setPending] = useState<Partial<BoardElement>>({});
    useEffect(() => {
        setPending({});
    }, [element?.id]);

    useImperativeHandle(ref, () => ({
        commitPending: () => {
            if (element && Object.keys(pending).length > 0) {
                onUpdate(element.id, pending);
            }
        },
    }), [element, pending, onUpdate]);

    if (!element) {
        return (
            <div className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20" dir={isRtl ? 'rtl' : 'ltr'}>
                <p className="text-center text-sm">{t('board.properties.emptyState')}</p>
            </div>
        );
    }

    const view: BoardElement = { ...element, ...pending };
    const set = (updates: Partial<BoardElement>) => setPending(prev => ({ ...prev, ...updates }));

    const colors = [
        'white', 'black', 'red', 'blue', 'yellow', 'green', 'orange', 'purple'
    ];

    const applyRosterPlayer = (id: string) => {
        const roster = rosterPlayers.find(p => String(p.id) === id);
        if (!roster) return;
        set({
            number: roster.shirtNumber ?? view.number,
            playerName: `${roster.firstName} ${roster.lastName}`,
            positionLabel: abbreviatePosition(roster.position),
        });
    };

    const handleOk = () => {
        if (Object.keys(pending).length > 0) {
            onUpdate(element.id, pending);
        }
        setPending({});
        onClose?.();
    };

    const handleCancel = () => {
        setPending({});
        onClose?.();
    };

    const typeLabel = TYPE_LABEL_KEYS[view.type] ? t(TYPE_LABEL_KEYS[view.type]) : view.type;
    const subtypeLabel = view.subtype && SUBTYPE_LABEL_KEYS[view.subtype] ? t(SUBTYPE_LABEL_KEYS[view.subtype]) : view.subtype;

    return (
        <div className="flex flex-col h-full" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">{t('board.properties.title')}</h3>
                <p className="text-xs text-muted-foreground">{typeLabel}{subtypeLabel ? ` — ${subtypeLabel}` : ''}</p>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">

                {/* Player-specific fields */}
                {view.type === 'player' && (
                    <>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <UserSquare2 className="h-3.5 w-3.5" /> {t('board.properties.rosterLabel')}
                            </Label>
                            <Select onValueChange={applyRosterPlayer}>
                                <SelectTrigger>
                                    <SelectValue placeholder={rosterPlayers.length ? t('board.properties.rosterPlaceholder') : t('board.properties.rosterPlaceholderEmpty')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {rosterPlayers.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.firstName} {p.lastName}{p.shirtNumber != null ? ` — #${p.shirtNumber}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {t('board.properties.rosterHelp')}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.jerseyNumber')}</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => set({ number: Math.max(0, (view.number ?? 0) - 1) })}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                    type="number"
                                    className="text-center"
                                    value={view.number ?? ''}
                                    onChange={(e) => set({ number: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => set({ number: Math.min(99, (view.number ?? 0) + 1) })}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.nameOptional')}</Label>
                            <Input
                                value={view.playerName || ''}
                                onChange={(e) => set({ playerName: e.target.value })}
                                placeholder={t('board.properties.namePlaceholder')}
                                maxLength={30}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.positionOptional')}</Label>
                            <Input
                                value={view.positionLabel || ''}
                                onChange={(e) => set({ positionLabel: e.target.value })}
                                maxLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.team')}</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={view.team === 'home' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ team: 'home' })}
                                >
                                    {t('board.players.home')}
                                </Button>
                                <Button
                                    variant={view.team === 'away' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ team: 'away' })}
                                >
                                    {t('board.players.away')}
                                </Button>
                            </div>
                        </div>

                        <Separator />
                    </>
                )}

                {/* Text-specific fields */}
                {view.type === 'text' && (
                    <>
                        <div className="space-y-2">
                            <Label>{t('board.properties.textContent')}</Label>
                            <Textarea
                                value={view.text || ''}
                                onChange={(e) => set({ text: e.target.value })}
                                placeholder={t('board.properties.textPlaceholder')}
                                rows={view.subtype === 'title' ? 2 : 5}
                                maxLength={1000}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.font')}</Label>
                            <Select value={view.fontFamily || 'Arial'} onValueChange={(v) => set({ fontFamily: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map((f) => (
                                        <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.style')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={view.fontStyle === 'bold' || view.fontStyle === 'italic bold' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ fontStyle: toggleFontStyle(view.fontStyle, 'bold') })}
                                >
                                    <Bold className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={view.fontStyle === 'italic' || view.fontStyle === 'italic bold' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ fontStyle: toggleFontStyle(view.fontStyle, 'italic') })}
                                >
                                    <Italic className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={view.textDecoration === 'underline' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ textDecoration: view.textDecoration === 'underline' ? '' : 'underline' })}
                                >
                                    <Underline className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('board.properties.alignment')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={(view.textAlign || 'left') === 'left' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ textAlign: 'left' })}
                                >
                                    <AlignLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={view.textAlign === 'center' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ textAlign: 'center' })}
                                >
                                    <AlignCenter className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant={view.textAlign === 'right' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ textAlign: 'right' })}
                                >
                                    <AlignRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{translateWithParams(t, 'board.properties.fontSize', { size: String(view.fontSize ?? 24) })}</Label>
                            <input
                                type="range"
                                min="10"
                                max="120"
                                value={view.fontSize ?? 24}
                                onChange={(e) => set({ fontSize: parseInt(e.target.value, 10) })}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{translateWithParams(t, 'board.properties.textBoxWidth', { width: String(view.width ?? 360) })}</Label>
                            <input
                                type="range"
                                min="100"
                                max="900"
                                step="10"
                                value={view.width ?? 360}
                                onChange={(e) => set({ width: parseInt(e.target.value, 10) })}
                                className="w-full"
                            />
                        </div>

                        <Separator />
                    </>
                )}

                {/* Drawing-specific fields (lines, arrows, curves, zones) */}
                {view.type === 'drawing' && (
                    <>
                        <div className="space-y-2">
                            <Label>{translateWithParams(t, 'board.properties.lineWeight', { weight: String(view.strokeWidth ?? DEFAULT_STROKE_WIDTH) })}</Label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.5"
                                value={view.strokeWidth ?? DEFAULT_STROKE_WIDTH}
                                onChange={(e) => set({ strokeWidth: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                        </div>

                        {view.subtype && ENDPOINT_SUBTYPES.has(view.subtype) && (
                            <>
                                <div className="space-y-2">
                                    <Label>{t('board.properties.connectStartTo')}</Label>
                                    <Select value={view.startPlayerId || 'none'} onValueChange={(v) => set({ startPlayerId: v === 'none' ? undefined : v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('board.properties.none')}</SelectItem>
                                            {players.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{playerLabel(p)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('board.properties.connectEndTo')}</Label>
                                    <Select value={view.endPlayerId || 'none'} onValueChange={(v) => set({ endPlayerId: v === 'none' ? undefined : v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('board.properties.none')}</SelectItem>
                                            {players.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{playerLabel(p)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        <p className="text-xs text-muted-foreground">{t('board.properties.resizeHint')}</p>

                        <Separator />
                    </>
                )}

                {/* Color Picker: hidden for players in colorblind mode, since team identity there is */}
                {/* conveyed by shape/pattern rather than a freely-chosen color. */}
                {!(view.type === 'player' && colorblindMode) && (
                    <div className="space-y-2">
                        <Label>{t('board.properties.color')}</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    className={`w-full aspect-square rounded-md border shadow-sm transition-all ${view.color === c ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => set({ color: c })}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Equipment resize hint (ball is fixed-size and never reaches this panel) */}
                {view.type === 'equipment' && (view.subtype === 'cone' || view.subtype === 'goal') && (
                    <p className="text-xs text-muted-foreground">{t('board.properties.resizeHint')}</p>
                )}

                {/* Shaded zone opacity (filled shapes only) */}
                {view.type === 'drawing' && (view.subtype === 'square' || view.subtype === 'circle') && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>{t('board.properties.shadedZone')}</Label>
                            <Button
                                variant={view.fill ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => set({ fill: !view.fill })}
                            >
                                {view.fill ? t('board.properties.on') : t('board.properties.off')}
                            </Button>
                        </div>
                        {view.fill && (
                            <input
                                type="range"
                                min="0.1"
                                max="0.8"
                                step="0.05"
                                value={view.opacity ?? 0.25}
                                onChange={(e) => set({ opacity: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                        )}
                    </div>
                )}

                <Separator />

                {/* Rotation */}
                <div className="space-y-2">
                    <Label>{translateWithParams(t, 'board.properties.rotation', { deg: String(Math.round(view.rotation || 0)) })}</Label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={view.rotation || 0}
                        onChange={(e) => set({ rotation: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

            </div>

            <div className="p-4 border-t bg-muted/20 grid grid-cols-3 gap-2">
                <Button className="gap-1.5" onClick={handleOk}>
                    <Check className="h-4 w-4" /> {t('board.properties.ok')}
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleCancel}>
                    <X className="h-4 w-4" /> {t('board.properties.cancel')}
                </Button>
                <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => onDelete(element.id)}
                >
                    <Trash2 className="h-4 w-4" /> {t('board.properties.delete')}
                </Button>
            </div>
        </div>
    );
});

PropertiesPanel.displayName = 'PropertiesPanel';
