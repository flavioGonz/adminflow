import { useEffect, useState } from "react";
import {
    Loader2, Save, MessageCircle, Link2, Copy, Zap,
    Activity, Settings, BookOpen, Layers, Cpu, Radio,
    ShieldCheck, CheckCircle2, XCircle, Terminal,
    Globe, Database, CreditCard, Calendar, Ticket, Key, Users,
    ChevronRight, ArrowUpRight, Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatbotConfigData {
    enabled: boolean;
    waha_url: string;
    waha_session: string;
    waha_api_key: string;
    reply_delay: number;
    allowed_numbers?: string[];
    modules: {
        clients: boolean;
        payments: boolean;
        scheduling: boolean;
        tickets: boolean;
        passwords: boolean;
        users: boolean;
    };
}

interface ChatbotConfigProps {
    initialConfig?: ChatbotConfigData;
    onSave?: (config: ChatbotConfigData) => void;
}

const MODULES_INFO = [
    { id: 'clients', label: 'Clientes', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Sincronización de base de clientes' },
    { id: 'payments', label: 'Pagos', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: 'Gestión de cobros y facturas' },
    { id: 'scheduling', label: 'Agenda', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Visitas y turnos preventivos' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, color: 'text-amber-400', bg: 'bg-amber-500/10', desc: 'Soporte técnico y reclamos' },
    { id: 'passwords', label: 'Security', icon: Key, color: 'text-rose-400', bg: 'bg-rose-500/10', desc: 'Acceso a credenciales seguras' },
    { id: 'users', label: 'Staff', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', desc: 'Gestión de técnicos y roles' }
];

export function ChatbotConfig({ onSave }: ChatbotConfigProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<ChatbotConfigData>({
        enabled: false,
        waha_url: "http://192.168.99.104:3000",
        waha_session: "default",
        waha_api_key: "",
        reply_delay: 4000,
        allowed_numbers: [],
        modules: {
            clients: true,
            payments: true,
            scheduling: true,
            tickets: true,
            passwords: true,
            users: true
        }
    });

    const [logs, setLogs] = useState<any[]>([]);
    const [newNumber, setNewNumber] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');

    useEffect(() => {
        loadConfig();
        const interval = setInterval(loadLogs, 3000);
        return () => clearInterval(interval);
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/chatbot/config`);
            if (res.ok) {
                const data = await res.json();
                setConfig(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            console.error("Error loading config:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        try {
            const res = await fetch(`${API_URL}/chatbot/logs`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) { }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/chatbot/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                toast.success("Sistema actualizado correctamente");
                onSave?.(config);
            }
        } catch (error) {
            toast.error("Error al sincronizar configuración");
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/chatbot/test`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (data.success) {
                setConnectionStatus('connected');
                toast.success("Conexión con WAHA establecida");
            } else {
                setConnectionStatus('disconnected');
                toast.error("Fallo de enlace con WAHA");
            }
        } catch (error) {
            setConnectionStatus('disconnected');
        } finally {
            setSaving(false);
        }
    };

    const toggleModule = (id: string) => {
        const mid = id as keyof typeof config.modules;
        setConfig(prev => ({
            ...prev,
            modules: { ...prev.modules, [mid]: !prev.modules[mid] }
        }));
    };

    const addNumber = () => {
        const num = newNumber.trim().replace(/\D/g, '');
        if (num && !config.allowed_numbers?.includes(num)) {
            setConfig(prev => ({
                ...prev,
                allowed_numbers: [...(prev.allowed_numbers || []), num]
            }));
            setNewNumber("");
        }
    };

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="min-h-screen p-0 lg:p-4 space-y-6 animate-in fade-in duration-700">
            {/* TOP COMMAND BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "p-3.5 rounded-xl transition-all duration-500 shadow-sm",
                        config.enabled ? "bg-emerald-500 shadow-emerald-200/50" : "bg-slate-200 shadow-slate-100"
                    )}>
                        <Cpu className={cn("h-8 w-8 text-white", config.enabled && "animate-pulse")} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Neural Core <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-mono">v2.4.0</Badge>
                        </h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            {config.enabled ? "Sistemas operativos y en escucha activa" : "Núcleo en modo hibernación"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4 hidden lg:flex">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Estado de Enlace</span>
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", connectionStatus === 'connected' ? "bg-emerald-500" : "bg-rose-500")} />
                            <span className="font-bold text-sm text-slate-700 uppercase">{connectionStatus === 'connected' ? 'En línea' : 'Desconectado'}</span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={testConnection}
                        className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold gap-2 h-12 text-sm"
                    >
                        <Signal className="h-4 w-4 text-blue-500" /> Test
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-slate-900 hover:bg-black text-white px-6 font-bold gap-2 h-12 text-sm shadow-lg shadow-slate-900/10"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Sincronizar
                    </Button>
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* COLUMN 1: CONFIG & SECURITY (4 Units) */}
                <div className="xl:col-span-4 space-y-6">
                    {/* HUB SETTINGS */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden group">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Connectivity Hub</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider opacity-60">Parámetros WAHA API</p>
                                </div>
                                <Switch
                                    checked={config.enabled}
                                    onCheckedChange={(c) => setConfig({ ...config, enabled: c })}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase ml-1">Instancia Host</Label>
                                    <div className="relative">
                                        <Input
                                            value={config.waha_url}
                                            onChange={(e) => setConfig({ ...config, waha_url: e.target.value })}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-bold transition-all pl-12"
                                            placeholder="http://server-ip:3000"
                                        />
                                        <Globe className="h-5 w-5 absolute left-4 top-3.5 text-slate-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black text-slate-500 uppercase ml-1">Sesión</Label>
                                        <Input
                                            value={config.waha_session}
                                            onChange={(e) => setConfig({ ...config, waha_session: e.target.value })}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black text-slate-500 uppercase ml-1">Latencia (ms)</Label>
                                        <Input
                                            type="number"
                                            value={config.reply_delay}
                                            onChange={(e) => setConfig({ ...config, reply_delay: parseInt(e.target.value) })}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-bold transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-500 uppercase ml-1">API Key de Seguridad</Label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            value={config.waha_api_key}
                                            onChange={(e) => setConfig({ ...config, waha_api_key: e.target.value })}
                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-blue-500 font-bold transition-all pl-12"
                                        />
                                        <ShieldCheck className="h-5 w-5 absolute left-4 top-3.5 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* WHITE LIST */}
                    <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <ShieldCheck className="h-20 w-20" />
                        </div>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Guardian Protocol</h2>
                                <p className="text-xs text-rose-500 font-black uppercase tracking-wider">Lista Blanca de Acceso</p>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="598..."
                                    value={newNumber}
                                    onChange={(e) => setNewNumber(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                />
                                <Button onClick={addNumber} className="h-12 rounded-xl bg-blue-600 px-6 font-bold">Add</Button>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {config.allowed_numbers?.map(num => (
                                    <div key={num} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <span className="font-mono font-bold text-slate-600">+{num}</span>
                                        <button
                                            onClick={() => setConfig(prev => ({ ...prev, allowed_numbers: prev.allowed_numbers?.filter(n => n !== num) }))}
                                            className="text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMN 2: MODULES (5 Units) */}
                <div className="xl:col-span-5 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {MODULES_INFO.map(module => {
                            const isEnabled = config.modules[module.id as keyof typeof config.modules];
                            return (
                                <motion.div
                                    key={module.id}
                                    whileHover={{ scale: 0.98 }}
                                    onClick={() => toggleModule(module.id)}
                                    className={cn(
                                        "p-5 rounded-2xl cursor-pointer transition-all duration-300 border select-none h-full flex flex-col justify-between",
                                        isEnabled
                                            ? "bg-white border-blue-500 shadow-md shadow-blue-100/50"
                                            : "bg-slate-50/50 border-slate-200 opacity-60 grayscale"
                                    )}
                                >
                                    <div className="space-y-3">
                                        <div className={cn("p-3 rounded-xl w-fit", module.bg)}>
                                            <module.icon className={cn("h-5 w-5", module.color)} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-slate-800 tracking-tight">{module.label}</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight mt-1">{module.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <Badge variant={isEnabled ? "default" : "secondary"} className={cn("rounded-md text-[10px]", isEnabled && "bg-blue-500")}>
                                            {isEnabled ? "ACTIVO" : "OFF"}
                                        </Badge>
                                        <div className={cn("h-1.5 w-1.5 rounded-full", isEnabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300")} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* QUICK MANUAL / HELP (Tabs inside Column) */}
                    <Card className="rounded-2xl border-none shadow-xl bg-slate-900 overflow-hidden text-white">
                        <CardContent className="p-0">
                            <Tabs defaultValue="base" className="w-full">
                                <TabsList className="w-full h-14 bg-white/5 p-3 gap-3 border-b border-white/5 rounded-none">
                                    <TabsTrigger value="base" className="flex-1 rounded-lg data-[state=active]:bg-white/10 text-[10px] font-black tracking-widest uppercase">Consultas</TabsTrigger>
                                    <TabsTrigger value="actions" className="flex-1 rounded-lg data-[state=active]:bg-white/10 text-[10px] font-black tracking-widest uppercase">Acciones</TabsTrigger>
                                </TabsList>
                                <div className="p-6">
                                    <TabsContent value="base" className="mt-0 space-y-3">
                                        {[
                                            { cmd: 'resumen', desc: 'Vista global técnica' },
                                            { cmd: 'tickets [clie]', desc: 'Historial de cliente' },
                                            { cmd: 'pass [clie]', desc: 'Accesos remotos' }
                                        ].map(item => (
                                            <div key={item.cmd} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                                                <code className="text-blue-400 font-mono text-xs font-bold">{item.cmd}</code>
                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{item.desc}</span>
                                            </div>
                                        ))}
                                    </TabsContent>
                                    <TabsContent value="actions" className="mt-0 space-y-3">
                                        {[
                                            { cmd: 'ticket nuevo', desc: 'Asistente apertura' },
                                            { cmd: 'pago nuevo', desc: 'Registro financiero' },
                                            { cmd: 'pago conf', desc: 'Validación de cobros' }
                                        ].map(item => (
                                            <div key={item.cmd} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                                                <code className="text-emerald-400 font-mono text-xs font-bold">{item.cmd}</code>
                                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{item.desc}</span>
                                            </div>
                                        ))}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMN 3: LIVE TERMINAL (3 Units) */}
                <div className="xl:col-span-3">
                    <Card className="rounded-2xl border-none shadow-xl bg-slate-950 overflow-hidden h-full flex flex-col">
                        <div className="p-5 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Terminal className="h-4 w-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Stream</span>
                            </div>
                            <div className="flex gap-1.5 leading-none">
                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <ScrollArea className="h-[600px] xl:h-[750px] w-full">
                                <div className="p-5 space-y-5">
                                    {logs.length === 0 ? (
                                        <div className="py-20 text-center space-y-4 opacity-20">
                                            <Radio className="h-12 w-12 mx-auto animate-ping" />
                                            <p className="text-[10px] uppercase font-black tracking-widest">Awaiting Events...</p>
                                        </div>
                                    ) : (
                                        logs.slice(0, 40).map((log, i) => (
                                            <div key={log.id || i} className="space-y-2 group">
                                                <div className="flex items-center justify-between">
                                                    <Badge className={cn(
                                                        "text-[8px] font-black h-4 px-1.5 border-none",
                                                        log.type === 'inbound' ? "bg-blue-500/20 text-blue-400" :
                                                            log.type === 'outbound' ? "bg-emerald-500/20 text-emerald-400" :
                                                                "bg-rose-500/20 text-rose-400"
                                                    )}>
                                                        {log.type?.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-[9px] font-mono text-slate-600 font-bold">
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                                    </span>
                                                </div>
                                                <div className="pl-2 border-l border-white/5 py-1">
                                                    <p className="text-[11px] leading-relaxed text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                                                        {log.details || log.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <div className="p-4 bg-slate-900/30 text-[9px] font-black uppercase text-slate-700 tracking-widest text-center border-t border-white/5">
                            AdminFlow Intelligence Relay
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}
