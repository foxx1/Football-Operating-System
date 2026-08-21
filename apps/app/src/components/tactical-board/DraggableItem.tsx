import React from 'react';
import { cn } from '@/lib/utils';
import { useI18n, translateWithParams } from '@/contexts/I18nContext';

interface DraggableItemProps {
    type: string;
    subtype?: string;
    color?: string;
    team?: 'home' | 'away';
    number?: number;
    icon: React.ReactNode;
    label?: string;
    className?: string;
    onAdd?: () => void;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
    type,
    subtype,
    color,
    team,
    number,
    icon,
    label,
    className,
    onAdd
}) => {
    const { t } = useI18n();
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('type', type);
        if (subtype) e.dataTransfer.setData('subtype', subtype);
        if (color) e.dataTransfer.setData('color', color);
        if (team) e.dataTransfer.setData('team', team);
        if (number != null) e.dataTransfer.setData('number', String(number));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md border bg-card hover:bg-accent cursor-grab active:cursor-grabbing transition-colors",
                onAdd && "cursor-pointer",
                className
            )}
            draggable
            onDragStart={handleDragStart}
            onClick={onAdd}
            title={onAdd ? translateWithParams(t, 'board.draggable.hint', { label: label || '' }) : label}
        >
            <div className="mb-2 pointer-events-none">
                {icon}
            </div>
            {label && <span className="text-xs font-medium text-center text-muted-foreground pointer-events-none">{label}</span>}
        </div>
    );
}
