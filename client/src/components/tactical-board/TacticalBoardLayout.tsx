import React from 'react';
import { cn } from '@/lib/utils';

interface TacticalBoardLayoutProps {
    sidebar: React.ReactNode;
    canvas: React.ReactNode;
    propertiesPanel?: React.ReactNode;
    toolbar: React.ReactNode;
    className?: string;
}

export const TacticalBoardLayout: React.FC<TacticalBoardLayoutProps> = ({
    sidebar,
    canvas,
    propertiesPanel,
    toolbar,
    className
}) => {
    return (
        <div className={cn("flex flex-col h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden", className)}>
            {/* Top Toolbar */}
            <div className="h-14 border-b bg-card flex items-center px-4 justify-between shrink-0 z-10 shadow-sm">
                {toolbar}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-64 border-r bg-card flex flex-col shrink-0 overflow-y-auto">
                    {sidebar}
                </div>

                {/* Center - Canvas. Takes the full remaining width; the */}
                {/* properties panel (when present) floats over it instead */}
                {/* of reserving its own permanent column. */}
                <div className="flex-1 bg-muted/30 relative overflow-hidden flex flex-col">
                    <div className="flex-1 relative overflow-auto flex items-center justify-center p-2">
                        {canvas}
                    </div>

                    {propertiesPanel && (
                        <div className="absolute top-4 right-4 bottom-4 w-72 max-w-[calc(100%-2rem)] bg-card border rounded-lg shadow-xl flex flex-col overflow-y-auto z-20 animate-in fade-in slide-in-from-right-4 duration-150">
                            {propertiesPanel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
