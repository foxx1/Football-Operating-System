import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

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
    // Below the lg breakpoint the tools sidebar has nowhere to live
    // permanently (it would eat most of a phone's width), so it becomes a
    // slide-over sheet opened from a "Tools" button instead.
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={cn("flex flex-col h-full bg-background overflow-hidden", className)}>
            {/* Top Toolbar */}
            <div className="min-h-14 border-b bg-card flex items-center gap-2 px-2 sm:px-4 py-2 flex-wrap justify-between shrink-0 z-10 shadow-sm">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 lg:hidden"
                    title="Tools & Library"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu className="h-4 w-4" />
                </Button>
                {toolbar}
            </div>

            <div className="flex-1 flex overflow-hidden min-w-0">
                {/* Left Sidebar - Tools (persistent on large screens) */}
                <div className="hidden lg:flex w-64 border-r bg-card flex-col shrink-0 overflow-y-auto">
                    {sidebar}
                </div>

                {/* Left Sidebar - Tools (slide-over on phones/tablets) */}
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col lg:hidden">
                        <SheetTitle className="sr-only">Tools & Library</SheetTitle>
                        {sidebar}
                    </SheetContent>
                </Sheet>

                {/* Center - Canvas. Takes the full remaining width; the */}
                {/* properties panel (when present) floats over it instead */}
                {/* of reserving its own permanent column. */}
                <div className="flex-1 bg-muted/30 relative overflow-hidden flex flex-col min-w-0">
                    <div className="flex-1 relative overflow-auto flex items-center justify-center p-2">
                        {canvas}
                    </div>

                    {propertiesPanel && (
                        <div className="absolute top-2 right-4 bottom-2 w-72 max-w-[calc(100%-2rem)] bg-card border rounded-lg shadow-xl flex flex-col overflow-y-auto z-20 animate-in fade-in slide-in-from-right-4 duration-150">
                            {propertiesPanel}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
