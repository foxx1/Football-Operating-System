import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRAINING_IMAGE_TYPES } from '@/lib/training-image-types';

interface SaveBoardDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string; tags: string[]; isPublic: boolean; imageType?: string }) => void;
    isSaving?: boolean;
    initialName?: string;
    initialIsPublic?: boolean;
    // True when this board was opened from a training session's image picker
    // (see SportSessionPlanner's isTrainingReturn) - the resulting image needs
    // a category so it slots into the Training Image Library's taxonomy
    // instead of landing as an uncategorized "Created" entry.
    requireImageType?: boolean;
}

export function SaveBoardDialog({ isOpen, onClose, onSave, isSaving, initialName, initialIsPublic, requireImageType }: SaveBoardDialogProps) {
    const [name, setName] = useState(initialName || '');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isPublic, setIsPublic] = useState(initialIsPublic ?? false);
    const [imageType, setImageType] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (requireImageType && !imageType) return;

        onSave({
            name,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            isPublic,
            imageType: requireImageType ? imageType : undefined,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Session</DialogTitle>
                    <DialogDescription>
                        Save your current tactical board session to your library.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Session Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Match Prep vs Team X"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief details about this session..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma separated)</Label>
                        <Input
                            id="tags"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="e.g., attacking, corners, u18"
                        />
                    </div>
                    {requireImageType && (
                        <div className="space-y-2">
                            <Label htmlFor="imageType">Training Image Category</Label>
                            <Select value={imageType} onValueChange={setImageType}>
                                <SelectTrigger id="imageType">
                                    <SelectValue placeholder="Choose a category…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRAINING_IMAGE_TYPES.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Matches this drawing to the same categories used in the Training Image Library.
                            </p>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                            className="rounded"
                        />
                        <Label htmlFor="isPublic" className="cursor-pointer">Make public (shareable link works for anyone)</Label>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                        <Button type="submit" disabled={isSaving || (requireImageType && !imageType)}>
                            {isSaving ? 'Saving...' : 'Save Session'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
