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
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header / Hero Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-zinc-500" />
                        Chatbot Config
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Gestiona la integración con WhatsApp y los módulos automáticos.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                        <div className={cn("h-2 w-2 rounded-full", config.enabled ? "bg-emerald-500" : "bg-zinc-400")} />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {config.enabled ? "Activo" : "Inactivo"}
                        </span>
                        <Switch
                            checked={config.enabled}
                            onCheckedChange={(c) => setConfig({ ...config, enabled: c })}
                            className="ml-2 scale-75"
                        />
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Settings */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Connection Settings */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Server className="h-5 w-5 text-zinc-500" />
                                Conexión WAHA
                            </CardTitle>
                            <CardDescription>Parámetros de conexión con la instancia de WhatsApp API.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase">Host URL</Label>
                                    <Input
                                        value={config.waha_url}
                                        onChange={(e) => setConfig({ ...config, waha_url: e.target.value })}
                                        className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
                                        placeholder="http://localhost:3000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase">Sesión ID</Label>
                                    <Input
                                        value={config.waha_session}
                                        onChange={(e) => setConfig({ ...config, waha_session: e.target.value })}
                                        className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase">API Key (Opcional)</Label>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            value={config.waha_api_key}
                                            onChange={(e) => setConfig({ ...config, waha_api_key: e.target.value })}
                                            className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all pl-9"
                                        />
                                        <Key className="h-4 w-4 absolute left-3 top-3 text-zinc-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-zinc-500 uppercase">Latencia (ms)</Label>
                                    <Input
                                        type="number"
                                        value={config.reply_delay}
                                        onChange={(e) => setConfig({ ...config, reply_delay: parseInt(e.target.value) })}
                                        className="rounded-xl border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={testConnection}
                                    className="rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                                >
                                    <Zap className={cn("mr-2 h-4 w-4", connectionStatus === 'connected' ? "text-emerald-500" : "text-zinc-400")} />
                                    {connectionStatus === 'connected' ? 'Conectado' : 'Probar Conexión'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Modules Grid */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Activity className="h-5 w-5 text-zinc-500" />
                                Módulos Activos
                            </CardTitle>
                            <CardDescription>Habilita o deshabilita funciones específicas del bot.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {MODULES_INFO.map(module => {
                                    const isEnabled = config.modules[module.id as keyof typeof config.modules];
                                    const Icon = module.icon;
                                    return (
                                        <div
                                            key={module.id}
                                            onClick={() => toggleModule(module.id)}
                                            className={cn(
                                                "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                                isEnabled
                                                    ? "bg-zinc-50 border-zinc-200 shadow-sm"
                                                    : "bg-transparent border-transparent hover:bg-zinc-50"
                                            )}
                                        >
                                            <div className={cn("mt-1 p-2 rounded-lg", isEnabled ? "bg-white shadow-sm text-zinc-900" : "bg-zinc-100 text-zinc-400")}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={cn("font-medium text-sm", isEnabled ? "text-zinc-900" : "text-zinc-500")}>{module.label}</p>
                                                    <Switch checked={isEnabled} className="scale-75" />
                                                </div>
                                                <p className="text-xs text-zinc-500">{module.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Whitelist & Logs */}
                <div className="space-y-6">

                    {/* Whitelist */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Shield className="h-5 w-5 text-zinc-500" />
                                Lista Blanca
                            </CardTitle>
                            <CardDescription>Números autorizados (+Código...)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newNumber}
                                    onChange={(e) => setNewNumber(e.target.value)}
                                    placeholder="59899123456"
                                    className="rounded-xl bg-zinc-50 border-zinc-200"
                                />
                                <Button onClick={addNumber} size="icon" className="rounded-xl aspect-square shrink-0">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                            <ScrollArea className="h-32 pr-4">
                                <div className="flex flex-wrap gap-2">
                                    {config.allowed_numbers?.length === 0 && (
                                        <p className="text-xs text-zinc-400 w-full text-center py-4">Sin números registrados</p>
                                    )}
                                    {config.allowed_numbers?.map(num => (
                                        <div key={num} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full border border-zinc-200">
                                            <Smartphone className="h-3 w-3 text-zinc-400" />
                                            <span className="text-xs font-medium text-zinc-700">{num}</span>
                                            <button
                                                onClick={() => setConfig(prev => ({ ...prev, allowed_numbers: prev.allowed_numbers?.filter(n => n !== num) }))}
                                                className="ml-1 text-zinc-400 hover:text-rose-500 transition-colors"
                                            >
                                                <XCircle className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Live Logs */}
                    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-900 flex flex-col h-[500px]">
                        <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
                            <CardTitle className="text-base font-medium flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-zinc-500" />
                                    Actividad Reciente
                                </span>
                                {logs.length > 0 && (
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {logs.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
                                        <RefreshCw className="h-8 w-8 opacity-20" />
                                        <p className="text-xs">Esperando eventos...</p>
                                    </div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex gap-3 text-sm group">
                                            <div className="mt-0.5 shrink-0">
                                                {log.type === 'inbound' ? (
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                                ) : log.type === 'outbound' ? (
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-50" />
                                                )}
                                            </div>
                                            <div className="grid gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                                                        {log.type}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
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
