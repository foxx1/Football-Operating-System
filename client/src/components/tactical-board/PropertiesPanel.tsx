import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Minus, Plus, UserSquare2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FONT_FAMILIES, type BoardElement } from './types';
import type { Player as RosterPlayer } from '@shared/schema';

interface PropertiesPanelProps {
    element: BoardElement | null;
    onUpdate: (id: string, updates: Partial<BoardElement>) => void;
    onDelete: (id: string) => void;
    onClose?: () => void;
    colorblindMode?: boolean;
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

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    element,
    onUpdate,
    onDelete,
    onClose,
    colorblindMode = false,
}) => {
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

    if (!element) {
        return (
            <div className="p-4 h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                <p className="text-center text-sm">Select an element on the board to edit its properties</p>
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

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Properties</h3>
                <p className="text-xs text-muted-foreground capitalize">{view.type} {view.subtype ? `— ${view.subtype}` : ''}</p>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">

                {/* Player-specific fields */}
                {view.type === 'player' && (
                    <>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <UserSquare2 className="h-3.5 w-3.5" /> Select from Team Roster
                            </Label>
                            <Select onValueChange={applyRosterPlayer}>
                                <SelectTrigger>
                                    <SelectValue placeholder={rosterPlayers.length ? 'Choose a player…' : 'No players in roster'} />
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
                                Fills in the jersey number, name, and position below automatically - all still editable by hand.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Jersey Number</Label>
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
                            <Label>Name (optional)</Label>
                            <Input
                                value={view.playerName || ''}
                                onChange={(e) => set({ playerName: e.target.value })}
                                placeholder="Shown under the marker"
                                maxLength={30}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Position (optional, e.g. CB, ST, GK)</Label>
                            <Input
                                value={view.positionLabel || ''}
                                onChange={(e) => set({ positionLabel: e.target.value })}
                                maxLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Team</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={view.team === 'home' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ team: 'home' })}
                                >
                                    Home
                                </Button>
                                <Button
                                    variant={view.team === 'away' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => set({ team: 'away' })}
                                >
                                    Away
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
                            <Label>Text Content</Label>
                            <Textarea
                                value={view.text || ''}
                                onChange={(e) => set({ text: e.target.value })}
                                placeholder="Enter title or paragraph text…"
                                rows={view.subtype === 'title' ? 2 : 5}
                                maxLength={1000}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Font</Label>
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
                            <Label>Style</Label>
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
                            <Label>Alignment</Label>
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
                            <Label>Font Size ({view.fontSize ?? 24}px)</Label>
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
                            <Label>Text Box Width ({view.width ?? 360}px)</Label>
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

                {/* Color Picker: hidden for players in colorblind mode, since team identity there is */}
                {/* conveyed by shape/pattern rather than a freely-chosen color. */}
                {!(view.type === 'player' && colorblindMode) && (
                    <div className="space-y-2">
                        <Label>Color</Label>
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

                {/* Shaded zone opacity (filled shapes only) */}
                {view.type === 'drawing' && (view.subtype === 'square' || view.subtype === 'circle') && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Shaded Zone</Label>
                            <Button
                                variant={view.fill ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => set({ fill: !view.fill })}
                            >
                                {view.fill ? 'On' : 'Off'}
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
                    <Label>Rotation ({Math.round(view.rotation || 0)}°)</Label>
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
                    <Check className="h-4 w-4" /> OK
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={handleCancel}>
                    <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => onDelete(element.id)}
                >
                    <Trash2 className="h-4 w-4" /> Delete
                </Button>
            </div>
        </div>
    );
};
