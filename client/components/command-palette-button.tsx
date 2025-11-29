"use client";

import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function CommandPaletteButton() {
    const handleClick = () => {
        // Trigger the keyboard event to open command palette
        const event = new KeyboardEvent("keydown", {
            key: "k",
            ctrlKey: true,
            bubbles: true,
        });
        document.dispatchEvent(event);
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClick}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <Command className="h-4 w-4" />
                        <span className="hidden sm:inline">Buscar</span>
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Abrir Command Palette (Ctrl+K)</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
