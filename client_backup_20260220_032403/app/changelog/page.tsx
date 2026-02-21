"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { PageTransition } from "@/components/ui/page-transition";
import { ShinyText } from "@/components/ui/shiny-text";
import {
    Zap,
    Filter,
    Search,
    Layout,
    Sparkles,
    CreditCard,
    ShieldCheck,
    Palette,
    Terminal,
    Copy,
    Check,
    Calendar,
    ArrowRight,
    FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const changelogData = [
    {
        version: "1.2.1",
        tag: "release-v1.2.1",
        date: "31 de Enero, 2026",
        title: "Corrección de Endpoints & Swagger",
        description: "Estabilización de las APIs de cobros y actualización de documentación técnica.",
        items: [
            {
                icon: ShieldCheck,
                title: "Fix Pagos (404 Not Found)",
                text: "Implementación de rutas PUT y DELETE para el módulo de cobranzas en el servidor.",
                type: "bugfix"
            },
            {
                icon: FileText,
                title: "Swagger Autodocumentado",
                text: "Esquemas de pagos completados y rutas de gestión añadidas a la documentación oficial.",
                type: "improvement"
            }
        ]
    },
    {
        version: "1.2.0",
        tag: "release-v1.2.0",
        date: "31 de Enero, 2026",
        title: "Reinvención de Filtros & UI Premium",
        description: "Transformación radical de la experiencia de filtrado y búsqueda en toda la plataforma.",
        items: [
            {
                icon: Filter,
                title: "Nuevo FilterToolbar Pro",
                text: "Barra de herramientas con efectos de glassmorphism y micro-animaciones fluidas.",
                type: "feature"
            },
            {
                icon: Search,
                title: "Búsqueda Inteligente",
                text: "Entrada expandible que optimiza el espacio de trabajo dinámicamente.",
                type: "improvement"
            },
            {
                icon: Layout,
                title: "Alineación Ergonómica",
                text: "Filtros y acciones ahora se alinean a la derecha para un flujo visual más natural.",
                type: "ux"
            },
            {
                icon: Sparkles,
                title: "ToolbarButtons",
                text: "Etiquetas inteligentes que aparecen solo cuando la acción está activa.",
                type: "ui"
            }
        ]
    },
    {
        version: "1.1.5",
        tag: "release-v1.1.5",
        date: "30 de Enero, 2026",
        title: "Pagos & Notificaciones",
        items: [
            {
                icon: CreditCard,
                title: "Módulo de Pagos",
                text: "Seguimiento de cobranzas con filtros multi-moneda.",
                type: "feature"
            },
            {
                icon: Zap,
                title: "WebPush",
                text: "Alertas en tiempo real vía notificaciones de navegador.",
                type: "feature"
            }
        ]
    },
    {
        version: "1.1.0",
        tag: "release-v1.1.0",
        date: "26 de Enero, 2026",
        title: "Arquitectura Core",
        items: [
            {
                icon: ShieldCheck,
                title: "Sincronización DB",
                text: "Optimización de redundancia en servidores MongoDB.",
                type: "performance"
            },
            {
                icon: Palette,
                title: "Sistema de Iconos",
                text: "Migración completa a Lucide React v0.552.",
                type: "ui"
            }
        ]
    }
];

function GitBadge({ tag }: { tag: string }) {
    const [copied, setCopied] = useState(false);
    const command = `git checkout tags/${tag}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        toast.success("Comando copiado");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
        >
            <Terminal className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
            <code className="text-[10px] font-mono font-bold text-slate-600 group-hover:text-indigo-600">{command}</code>
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </button>
    );
}

const typeColors: Record<string, string> = {
    feature: "bg-emerald-50 text-emerald-600 border-emerald-100",
    improvement: "bg-blue-50 text-blue-600 border-blue-100",
    ux: "bg-purple-50 text-purple-600 border-purple-100",
    ui: "bg-indigo-50 text-indigo-600 border-indigo-100",
    performance: "bg-amber-50 text-amber-600 border-amber-100",
    bugfix: "bg-rose-50 text-rose-600 border-rose-100"
};

export default function ChangelogPage() {
    return (
        <DashboardLayout>
            <PageTransition>
                <div className="max-w-5xl mx-auto px-6 py-12">
                    {/* Minimalist Header */}
                    <div className="mb-20 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]">
                            <span className="w-8 h-px bg-indigo-600" />
                            Actualizaciones del Sistema
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                            Lo nuevo en AdminFlow
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl">
                            Explora las últimas mejoras funcionales, actualizaciones de diseño y optimizaciones técnicas que hemos implementado.
                        </p>
                    </div>

                    {/* Clean Vertical Timeline */}
                    <div className="space-y-24">
                        {changelogData.map((entry, index) => (
                            <motion.div
                                key={entry.version}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="relative grid md:grid-cols-[200px_1fr] gap-12"
                            >
                                {/* Left Side: Version & Date */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold leading-none">
                                            v{entry.version}
                                        </div>
                                        {index === 0 && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                        <Calendar className="h-4 w-4" />
                                        {entry.date}
                                    </div>
                                    <GitBadge tag={entry.tag} />
                                </div>

                                {/* Right Side: Content */}
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                            {entry.title}
                                        </h2>
                                        {entry.description && (
                                            <p className="text-slate-500 leading-relaxed">
                                                {entry.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {entry.items.map((item, i) => (
                                            <div
                                                key={i}
                                                className="group p-5 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                                        <item.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                                        typeColors[item.type]
                                                    )}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-slate-900">
                                                    {item.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 leading-relaxed">
                                                    {item.text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Vertical Connector Line */}
                                {index !== changelogData.length - 1 && (
                                    <div className="absolute left-[15px] top-10 w-px h-[calc(100%+96px)] bg-slate-100 hidden md:block" />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Clean Footer */}
                    <div className="mt-32 pt-12 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-400 font-medium flex items-center justify-center gap-2">
                            AdminFlow System • <span className="text-slate-900">v1.2.1 Stable</span>
                        </p>
                    </div>
                </div>
            </PageTransition>
        </DashboardLayout>
    );
}
