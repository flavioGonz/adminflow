"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const shortcuts: KeyboardShortcut[] = [
            // Navigation shortcuts
            {
                key: "h",
                ctrl: true,
                action: () => router.push("/dashboard"),
                description: "Ir al Dashboard (Home)",
            },
            {
                key: "c",
                ctrl: true,
                shift: true,
                action: () => router.push("/clients"),
                description: "Ir a Clientes",
            },
            {
                key: "t",
                ctrl: true,
                shift: true,
                action: () => router.push("/tickets"),
                description: "Ir a Tickets",
            },
            {
                key: "p",
                ctrl: true,
                shift: true,
                action: () => router.push("/payments"),
                description: "Ir a Pagos",
            },
            {
                key: "b",
                ctrl: true,
                shift: true,
                action: () => router.push("/budgets"),
                description: "Ir a Presupuestos",
            },
            {
                key: "r",
                ctrl: true,
                shift: true,
                action: () => router.push("/repository"),
                description: "Ir a Repositorio",
            },
            {
                key: "e",
                ctrl: true,
                shift: true,
                action: () => router.push("/calendar"),
                description: "Ir a Calendario (Events)",
            },
            // Quick actions
            {
                key: "n",
                ctrl: true,
                action: () => {
                    toast.info("Usa el botón 'Nuevo' en la sección activa para crear registros");
                },
                description: "Nuevo registro",
            },
            // Utility shortcuts
            {
                key: "/",
                ctrl: true,
                action: () => {
                    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                    } else {
                        toast.info("No hay campo de búsqueda en esta página");
                    }
                },
                description: "Enfocar búsqueda",
            },
        ];

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

            if (isInput) {
                return;
            }

            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey;

                if (
                    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    ctrlMatch &&
                    shiftMatch &&
                    altMatch
                ) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [router]);
}

// Hook to show keyboard shortcuts help
export function useShowKeyboardHelp() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "?" && e.shiftKey) {
                e.preventDefault();
                toast.info(
                    "Atajos de teclado disponibles:\n" +
                    "• Ctrl+H: Dashboard\n" +
                    "• Ctrl+Shift+C: Clientes\n" +
                    "• Ctrl+Shift+T: Tickets\n" +
                    "• Ctrl+Shift+P: Pagos\n" +
                    "• Ctrl+Shift+B: Presupuestos\n" +
                    "• Ctrl+Shift+R: Repositorio\n" +
                    "• Ctrl+Shift+E: Calendario\n" +
                    "• Ctrl+/: Enfocar búsqueda",
                    { duration: 10000 }
                );
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
}
