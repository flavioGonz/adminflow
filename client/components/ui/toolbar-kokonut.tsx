"use client";

import {
    Bell,
    CircleUserRound,
    Edit2,
    FileDown,
    Frame,
    Layers,
    Lock,
    type LucideIcon,
    MousePointer2,
    Move,
    Palette,
    Shapes,
    Share2,
    SlidersHorizontal,
    Search,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ToolbarItem {
    id: string;
    title: string;
    icon: LucideIcon;
    type?: never;
}

interface ToolbarProps {
    className?: string;
    activeColor?: string;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    items?: { id: string; title: string; icon: LucideIcon; onClick?: () => void }[];
    children?: React.ReactNode;
}

const buttonVariants = {
    initial: {
        gap: 0,
        paddingLeft: ".5rem",
        paddingRight: ".5rem",
    },
    animate: (isSelected: boolean) => ({
        gap: isSelected ? ".5rem" : 0,
        paddingLeft: isSelected ? "1rem" : ".5rem",
        paddingRight: isSelected ? "1rem" : ".5rem",
    }),
};

const spanVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { width: "auto", opacity: 1 },
    exit: { width: 0, opacity: 0 },
};

const transition = { type: "spring", bounce: 0, duration: 0.4 };

export function Toolbar({
    className,
    activeColor = "text-primary",
    searchTerm,
    onSearchChange,
    items = [],
    children,
}: ToolbarProps) {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [isSearchVisible, setIsSearchVisible] = React.useState(false);

    const handleItemClick = (itemId: string, onClick?: () => void) => {
        setSelected(selected === itemId ? null : itemId);
        if (onClick) onClick();
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <motion.div
                layout
                className={cn(
                    "relative flex items-center gap-2 p-1.5",
                    "bg-white/80 backdrop-blur-md",
                    "rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/50",
                    "transition-all duration-300"
                )}
            >
                {/* Search Area */}
                <div className="flex items-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsSearchVisible(!isSearchVisible)}
                        className={cn(
                            "p-2.5 rounded-xl transition-colors",
                            isSearchVisible ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                        )}
                    >
                        <Search size={18} />
                    </motion.button>

                    <AnimatePresence>
                        {isSearchVisible && (
                            <motion.div
                                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                animate={{ width: 240, opacity: 1, marginLeft: 8 }}
                                exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                className="overflow-hidden relative"
                            >
                                <Input
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    placeholder="Buscar..."
                                    className="h-10 border-none bg-slate-100/50 focus:ring-0 rounded-xl pr-8"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => onSearchChange?.("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="w-px h-6 bg-slate-200/60 mx-1" />

                {/* Action Items */}
                <div className="flex items-center gap-1.5">
                    {items.map((item) => (
                        <motion.button
                            key={item.id}
                            variants={buttonVariants}
                            animate="animate"
                            custom={selected === item.id}
                            onClick={() => handleItemClick(item.id, item.onClick)}
                            className={cn(
                                "relative flex items-center h-10 rounded-xl font-medium text-sm transition-all duration-300",
                                selected === item.id
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <item.icon size={18} className={cn(selected === item.id ? "text-white" : "text-slate-500")} />
                            <AnimatePresence initial={false}>
                                {selected === item.id && (
                                    <motion.span
                                        variants={spanVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        transition={transition}
                                        className="whitespace-nowrap overflow-hidden pr-1"
                                    >
                                        {item.title}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>

                {/* Custom Content slot (like dropdowns) */}
                {children && (
                    <>
                        <div className="w-px h-6 bg-slate-200/60 mx-1" />
                        <div className="flex items-center gap-1.5 px-1">
                            {children}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
