import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface HelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts: Array<[string, string]> = [
    ['Ctrl/Cmd + Z', 'Undo'],
    ['Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y', 'Redo'],
    ['Delete / Backspace', 'Delete selected element'],
    ['Ctrl/Cmd + Wheel', 'Zoom in / out'],
];

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tactical Board Help</DialogTitle>
                    <DialogDescription>A quick guide to building and sharing tactics.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold mb-1">Getting started</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Drag players or equipment from the left sidebar onto the pitch.</li>
                            <li>Use "Apply Home" / "Apply Away" under Formations to place a full 11-player shape instantly.</li>
                            <li>Pick a drawing tool (line, arrow, curve, dribble, rectangle/circle zone) then click-drag on the pitch.</li>
                            <li>Switch to the Pan tool to drag the pitch around when zoomed in.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-1">Editing elements</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Click an element (with no tool active) to select it and edit it in the right-hand Properties panel.</li>
                            <li>Rectangle/circle drawings can be turned into shaded zones with adjustable opacity.</li>
                            <li>Drag any selected, placed element to reposition it.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-1">Saving & sharing</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Save stores the board (and a thumbnail) to your library for later editing.</li>
                            <li>Copy Link generates a URL that reopens this exact board for teammates.</li>
                            <li>Export as PNG (image) or SVG (vector, editable in design tools).</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Keyboard shortcuts</h4>
                        <div className="space-y-1.5">
                            {shortcuts.map(([keys, desc]) => (
                                <div key={keys} className="flex items-center justify-between">
                                    <span className="text-muted-foreground">{desc}</span>
                                    <Badge variant="outline" className="font-mono text-[10px]">{keys}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-1">Accessibility</h4>
                        <p className="text-muted-foreground">
                            Turn on Colorblind Mode in the toolbar to render the away team with a distinct dashed
                            ring pattern in addition to color, so teams stay distinguishable without relying on color alone.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
