import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface TacticalBoard {
    id: number;
    name: string;
    description: string;
    thumbnail: string | null;
    updatedAt: string;
    drawingElements: any[];
}

interface LoadBoardDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (board: TacticalBoard) => void;
}

export function LoadBoardDialog({ isOpen, onClose, onLoad }: LoadBoardDialogProps) {
    // We fetch boards directly here
    const { data: boards, isLoading, error } = useQuery<TacticalBoard[]>({
        queryKey: ['tactical-boards'],
        queryFn: async () => {
            const res = await fetch('/api/tactical-boards');
            if (!res.ok) throw new Error('Failed to fetch boards');
            return res.json();
        },
        enabled: isOpen,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Load Session</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-2">
                    {isLoading && <div className="text-center py-10">Loading sessions...</div>}
                    {error && <div className="text-center py-10 text-red-500">Failed to load sessions.</div>}

                    {!isLoading && boards?.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No saved sessions found.
                        </div>
                    )}

                    <ScrollArea className="h-full pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boards?.map(board => (
                                <div
                                    key={board.id}
                                    className="bg-card border rounded-lg overflow-hidden hover:border-primary cursor-pointer transition-all shadow-sm hover:shadow-md group"
                                    onClick={() => onLoad(board)}
                                >
                                    <div className="aspect-video bg-muted relative">
                                        {board.thumbnail ? (
                                            <img src={board.thumbnail} alt={board.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                                                No Preview
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">Load</span>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold truncate" title={board.name}>{board.name}</h3>
                                        <p className="text-xs text-muted-foreground truncate mb-2">{board.description || "No description"}</p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(board.updatedAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
