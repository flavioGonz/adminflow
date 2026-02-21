import { useEffect, useState } from "react";
import {
    Loader2, Save, MessageCircle, Globe, Shield, CreditCard,
    Calendar, Ticket, Key, Users, Activity, CheckCircle2,
    XCircle, RefreshCw, Terminal, Plus, Trash2, Smartphone,
    Server, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    { id: 'clients', label: 'Clientes', icon: Globe, desc: 'Consultas de saldo y datos' },
    { id: 'payments', label: 'Pagos', icon: CreditCard, desc: 'Registro y confirmación' },
    { id: 'scheduling', label: 'Agenda', icon: Calendar, desc: 'Gestión de visitas' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, desc: 'Creación y seguimiento' },
    { id: 'passwords', label: 'Security', icon: Key, desc: 'Gestión de claves' },
    { id: 'users', label: 'Staff', icon: Users, desc: 'Herramientas internas' }
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
                toast.success("Configuración guardada", {
                    description: "El chatbot se ha actualizado correctamente."
                });
                onSave?.(config);
            }
        } catch (error) {
            toast.error("Error al guardar");
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
                toast.success("Conexión exitosa", { description: "WAHA responde correctamente." });
            } else {
                setConnectionStatus('disconnected');
                toast.error("Error de conexión", { description: "No se pudo conectar con WAHA." });
            }
        } catch (error) {
            setConnectionStatus('disconnected');
            toast.error("Error de conexión");
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
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
    );

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 p-2 lg:p-6">
            {/* Header / Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800 pb-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                        <MessageCircle className="h-8 w-8 text-zinc-800" />
                        Chatbot Config
                    </h2>
                    <p className="text-base text-zinc-500 dark:text-zinc-400">
                        Gestiona la integración con WhatsApp y los módulos automáticos.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <div className={cn("h-2.5 w-2.5 rounded-full", config.enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-400")} />
                        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                            {config.enabled ? "Sistema Activo" : "Sistema Inactivo"}
                        </span>
                        <Switch
                            checked={config.enabled}
                            onCheckedChange={(c) => setConfig({ ...config, enabled: c })}
                            className="ml-2 scale-90"
                        />
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-semibold px-6"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Settings (Main) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Connection Settings */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-800">
                                        <Server className="h-5 w-5 text-indigo-600" />
                                        Conexión WAHA
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">Parámetros de conexión con la instancia de WhatsApp API.</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={testConnection}
                                    className="rounded-xl border-zinc-200 hover:bg-white text-zinc-700 bg-white shadow-sm"
                                >
                                    <Zap className={cn("mr-2 h-4 w-4", connectionStatus === 'connected' ? "text-emerald-500" : "text-zinc-400")} />
                                    {connectionStatus === 'connected' ? 'Conectado' : 'Probar Conexión'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Host URL</Label>
                                    <div className="relative group">
                                        <Server className="h-4 w-4 absolute left-4 top-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                        <Input
                                            value={config.waha_url}
                                            onChange={(e) => setConfig({ ...config, waha_url: e.target.value })}
                                            className="h-12 pl-11 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            placeholder="http://localhost:3000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Sesión ID</Label>
                                    <Input
                                        value={config.waha_session}
                                        onChange={(e) => setConfig({ ...config, waha_session: e.target.value })}
                                        className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium px-4"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">API Key (Opcional)</Label>
                                    <div className="relative group">
                                        <Input
                                            type="password"
                                            value={config.waha_api_key}
                                            onChange={(e) => setConfig({ ...config, waha_api_key: e.target.value })}
                                            className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all pl-11"
                                        />
                                        <Key className="h-4 w-4 absolute left-4 top-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Latencia (ms)</Label>
                                    <Input
                                        type="number"
                                        value={config.reply_delay}
                                        onChange={(e) => setConfig({ ...config, reply_delay: parseInt(e.target.value) })}
                                        className="h-12 rounded-2xl border-zinc-200 bg-zinc-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium px-4"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Modules Grid */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                            <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-800">
                                <Activity className="h-5 w-5 text-emerald-600" />
                                Módulos Activos
                            </CardTitle>
                            <CardDescription className="text-base mt-1">Habilita o deshabilita funciones específicas del chatbot.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {MODULES_INFO.map(module => {
                                    const isEnabled = config.modules[module.id as keyof typeof config.modules];
                                    const Icon = module.icon;
                                    return (
                                        <div
                                            key={module.id}
                                            onClick={() => toggleModule(module.id)}
                                            className={cn(
                                                "flex items-start gap-5 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group hover:shadow-lg",
                                                isEnabled
                                                    ? "bg-white border-zinc-100 shadow-md"
                                                    : "bg-zinc-50 border-transparent opacity-75 grayscale hover:grayscale-0"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-1 p-3 rounded-xl transition-colors",
                                                isEnabled ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20" : "bg-zinc-200 text-zinc-400 group-hover:bg-zinc-300"
                                            )}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("font-bold text-base", isEnabled ? "text-zinc-900" : "text-zinc-500")}>{module.label}</p>
                                                    <Switch checked={isEnabled} className={cn("scale-90 data-[state=checked]:bg-zinc-900", !isEnabled && "opacity-50")} />
                                                </div>
                                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{module.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Whitelist & Logs (Sidebar) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Whitelist */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="pb-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                                <Shield className="h-5 w-5 text-rose-500" />
                                Lista Blanca
                            </CardTitle>
                            <CardDescription className="text-sm">Números autorizados (+Código...)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="flex gap-2">
                                <Input
                                    value={newNumber}
                                    onChange={(e) => setNewNumber(e.target.value)}
                                    placeholder="59899123456"
                                    className="h-11 rounded-xl bg-zinc-50 border-zinc-200 font-medium"
                                />
                                <Button onClick={addNumber} size="icon" className="h-11 w-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shrink-0 shadow-lg shadow-zinc-900/20">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            <ScrollArea className="h-[200px] pr-4 -mr-4">
                                <div className="flex flex-wrap gap-2">
                                    {config.allowed_numbers?.length === 0 && (
                                        <div className="w-full text-center py-8 opacity-40">
                                            <Shield className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                                            <p className="text-xs font-semibold text-zinc-400">Sin números registrados</p>
                                        </div>
                                    )}
                                    {config.allowed_numbers?.map(num => (
                                        <div key={num} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors group">
                                            <span className="text-xs font-bold text-zinc-600 font-mono">{num}</span>
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, allowed_numbers: prev.allowed_numbers?.filter(n => n !== num) }))}
                                                className="h-5 w-5 flex items-center justify-center rounded-md text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Live Logs */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl bg-white dark:bg-zinc-900 flex flex-col h-[600px] overflow-hidden">
                        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
                            <CardTitle className="text-sm font-bold flex items-center justify-between text-zinc-700">
                                <span className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-zinc-400" />
                                    Actividad Reciente
                                </span>
                                {logs.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Live</span>
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-4 bg-zinc-50/30">
                            <div className="space-y-3">
                                {logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-zinc-300 space-y-3">
                                        <RefreshCw className="h-10 w-10 opacity-20" />
                                        <p className="text-xs font-medium uppercase tracking-widest opacity-60">Esperando eventos...</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="mt-1 shrink-0">
                                                {log.type === 'inbound' ? (
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                                ) : log.type === 'outbound' ? (
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-50" />
                                                )}
                                            </div>
                                            <div className="grid gap-1 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                                        {log.type}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-medium text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-700 dark:text-zinc-300 text-xs font-medium leading-relaxed">
                                                    {log.details || log.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </Card>

                </div>
            </div>
        </div>
    );
}
