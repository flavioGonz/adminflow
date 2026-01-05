"use client";

import { useMemo, useState, useEffect } from "react";
import {
    Circle,
    CheckCircle2,
    Clock,
    MapPin,
    Receipt,
    DollarSign,
    FolderOpen,
    AlertCircle,
    Flag,
    Loader2
} from "lucide-react";
import { API_URL } from "@/lib/http";
import { TicketStatus } from "@/types/ticket";

export const getStatusConfig = (label: string) => {
    const normalized = label?.toLowerCase() || "";
    if (normalized.includes("nuevo")) return { icon: Circle, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" };
    if (normalized.includes("abierto")) return { icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
    if (normalized.includes("proceso")) return { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
    if (normalized.includes("visita")) return { icon: MapPin, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" };
    if (normalized.includes("resuelto")) return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (normalized.includes("cerrado")) return { icon: CheckCircle2, color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" };
    if (normalized.includes("factura")) return { icon: Receipt, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    if (normalized.includes("pago") || normalized.includes("pagado")) return { icon: DollarSign, color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-200" };
    if (normalized.includes("pendiente")) return { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };

    return { icon: Flag, color: "text-slate-500", bg: "bg-white", border: "border-slate-200" };
};

export const isVisitStatus = (label: string) => (label?.toLowerCase() || "").includes("visita");

// Hook to fetch and manage status list AND transitions
export const useTicketStatuses = () => {
    const [statuses, setStatuses] = useState<TicketStatus[]>([
        "Nuevo", "Abierto", "En proceso", "Visita",
        "Resuelto", "Facturar", "Pagado"
    ]); // Fallback default
    const [transitions, setTransitions] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchStatuses = async () => {
        try {
            const response = await fetch(`${API_URL}/workflows/tickets`);
            if (response.ok) {
                const data = await response.json();

                // Process Nodes
                if (data.nodes && Array.isArray(data.nodes)) {
                    const extracted = data.nodes.map((n: any) => n.data.label).filter(Boolean);
                    if (extracted.length > 0) {
                        setStatuses(extracted);
                    }
                }

                // Process Edges for Transitions
                if (data.edges && Array.isArray(data.edges) && data.nodes) {
                    const transitionMap: Record<string, string[]> = {};
                    const nodeMap = new Map<string, string>(data.nodes.map((n: any) => [n.id, String(n.data.label || "")]));

                    data.edges.forEach((edge: any) => {
                        const fromLabel = nodeMap.get(edge.source);
                        const toLabel = nodeMap.get(edge.target);
                        if (fromLabel && toLabel) {
                            if (!transitionMap[fromLabel]) transitionMap[fromLabel] = [];
                            if (!transitionMap[fromLabel].includes(toLabel)) {
                                transitionMap[fromLabel].push(toLabel);
                            }
                        }
                    });
                    setTransitions(transitionMap);
                }
            }
        } catch (error) {
            console.error("Failed to fetch ticket statuses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatuses();

        // Listen for updates from the editor
        const handleUpdate = () => fetchStatuses();
        window.addEventListener('ticket_statuses_updated', handleUpdate);
        return () => window.removeEventListener('ticket_statuses_updated', handleUpdate);
    }, []);

    const statusOptions = useMemo(() => statuses, [statuses]);

    return { statusOptions, transitions, loading };
};
