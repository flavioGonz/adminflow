"use client";

import * as React from "react"
import { Search, X, LucideIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface FilterToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    searchTerm?: string
    onSearchChange?: (value: string) => void
    searchPlaceholder?: string
    children?: React.ReactNode
}

const transition = { type: "spring", bounce: 0, duration: 0.4 };

export function FilterToolbar({
    searchTerm,
    onSearchChange,
    searchPlaceholder = "Filtrar...",
    children,
    className,
    ...props
}: FilterToolbarProps) {
    const [isSearchExpanded, setIsSearchExpanded] = React.useState(!!searchTerm);

    return (
        <div
            className={cn(
                "flex flex-col gap-4 mb-6",
                className
            )}
            {...props}
        >
            <div className="flex flex-col md:flex-row items-center w-full gap-3">
                <motion.div
                    layout
                    className="flex items-center gap-2 p-1.5 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ml-auto"
                >
                    {/* Search Area - Now on the LEFT of children */}
                    {onSearchChange && (
                        <div className="flex items-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                className={cn(
                                    "p-2.5 rounded-xl transition-colors duration-200",
                                    isSearchExpanded ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <Search className="h-[18px] w-[18px]" />
                            </motion.button>

                            <AnimatePresence>
                                {isSearchExpanded && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                        animate={{ width: 260, opacity: 1, marginLeft: 8 }}
                                        exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                        transition={transition}
                                        className="overflow-hidden relative"
                                    >
                                        <Input
                                            type="text"
                                            placeholder={searchPlaceholder}
                                            value={searchTerm}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                            className="h-10 w-full border-none bg-slate-100/50 focus:ring-0 rounded-xl pr-9 text-sm font-medium placeholder:text-slate-400"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => onSearchChange("")}
                                                className="absolute inset-y-0 right-1 px-2 flex items-center text-slate-400 hover:text-slate-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Separator if search is enabled and there are children */}
                    {onSearchChange && children && <div className="hidden md:block w-px h-6 bg-slate-200/60 mx-1" />}

                    {/* Filters & Actions Area - Following search */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

/**
 * Reusable Toolbar Button that follows the Kokonut UI style (expand on active/selected)
 */
export function ToolbarButton({
    icon: Icon,
    label,
    isActive,
    onClick,
    className,
    variant = "default",
    ...props
}: {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
    variant?: "default" | "warning" | "error" | "success" | "info";
}) {
    const variants = {
        default: isActive ? "bg-indigo-600 text-white shadow-indigo-200" : "text-slate-500 hover:bg-slate-100",
        warning: isActive ? "bg-amber-500 text-white shadow-amber-200" : "text-slate-500 hover:bg-amber-50 hover:text-amber-600",
        error: isActive ? "bg-rose-500 text-white shadow-rose-200" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600",
        success: isActive ? "bg-emerald-500 text-white shadow-emerald-200" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
        info: isActive ? "bg-sky-500 text-white shadow-sky-200" : "text-slate-500 hover:bg-sky-50 hover:text-sky-600",
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <motion.button
                    layout
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClick}
                    className={cn(
                        "relative flex items-center h-10 px-3 rounded-xl font-medium text-sm transition-all duration-300 gap-0",
                        isActive && "gap-2 shadow-lg",
                        variants[variant],
                        className
                    )}
                    {...props}
                >
                    <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-white" : "")} />
                    <AnimatePresence initial={false}>
                        {isActive && (
                            <motion.span
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: "auto", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={transition}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </TooltipTrigger>
            {!isActive && (
                <TooltipContent className="animate-in fade-in-50 zoom-in-95">
                    <p className="text-xs font-medium">{label}</p>
                </TooltipContent>
            )}
        </Tooltip>
    )
}
