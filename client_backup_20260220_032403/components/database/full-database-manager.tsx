"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Download,
    FileJson,
    HardDrive,
    RefreshCw,
    Search,
    Trash2,
    Upload,
    Eye,
    GitCompare,
    Loader2,
    X,
    Plus,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { cn } from "@/lib/utils";
import { ImportBackupDialog } from "@/components/database/import-backup-dialog";
import { CollectionViewerDialog } from "@/components/database/collection-viewer-dialog";
import { SwitchDatabaseModal } from "@/components/database/switch-database-modal";

type CollectionInfo = {
    name: string;
    count: number;
    size: number;
};

type MongoOverview = {
    collections: CollectionInfo[];
    totalSize: number;
    dbName: string;
    connected: boolean;
    error?: string;
    mongoUri?: string;
};

type ConnectionStatus = {
    state: "idle" | "pending" | "success" | "error";
    message?: string;
    latency?: number;
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export function FullDatabaseManager() {
    const [overview, setOverview] = useState<MongoOverview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: "idle" });
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [serversStatus, setServersStatus] = useState<any[]>([]);
    const [currentServer, setCurrentServer] = useState<any | null>(null);
    const [switchModalOpen, setSwitchModalOpen] = useState(false);
    const [switchTargetServer, setSwitchTargetServer] = useState<any | null>(null);
    const [viewingCollection, setViewingCollection] = useState<string | null>(null);

    // Backup states
    const [backups, setBackups] = useState<any[]>([]);

    // Load data on mount
    useEffect(() => {
        fetchOverview();
        loadServers();
        loadBackups();

        const interval = setInterval(fetchOverview, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchOverview = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/database/overview");
            const data = await response.json();

            if (response.ok) {
                setOverview(data);
                setConnectionStatus({ state: "success", latency: 45 });
            } else {
                setConnectionStatus({ state: "error", message: data.error });
            }
        } catch (error) {
            setConnectionStatus({ state: "error", message: "Error de conexión" });
        } finally {
            setIsLoading(false);
            setLastUpdate(new Date());
        }
    };

    const normalizeStatuses = (data: any) => {
        const rawStatuses = Array.isArray(data?.status)
            ? data.status
            : Array.isArray(data)
                ? data
                : [];

        return rawStatuses.map((status: any) => ({
            ...status,
            isPrimary: status?.isPrimary ?? (status?.role === "primary" || status?.current === true),
        }));
    };

    const loadServers = async () => {
        try {
            const response = await fetch("/api/mongo-servers");
            if (!response.ok) throw new Error("Error al cargar servidores");

            const statusResponse = await fetch("/api/mongo-servers/status");
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                const statusesArray = normalizeStatuses(statusData);
                setServersStatus(statusesArray);
                const current = statusesArray.find((s: any) => s.isPrimary);
                setCurrentServer(current || null);
            }
        } catch (error) {
            toast.error("Error al cargar servidores");
        }
    };

    const loadBackups = async () => {
        try {
            const response = await fetch("/api/database/backup/list");
            if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data?.backups) ? data.backups : [];
                setBackups(list);
            }
        } catch (error) {
            console.error("Error loading backups", error);
        }
    };

    const handleExportCollection = async (collectionName: string) => {
        setActionLoading(`export-${collectionName}`);
        try {
            const response = await fetch(`/api/database/collections/${collectionName}`, {
                headers: { Accept: "application/json" },
            });

            if (!response.ok) throw new Error("Error al exportar");

            const data = await response.blob();
            const url = URL.createObjectURL(data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${collectionName}.json`;
            a.click();

            toast.success(`Colección ${collectionName} exportada`);
        } catch (error) {
            toast.error("Error al exportar colección");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDropCollection = async (collectionName: string) => {
        if (!confirm(`¿Eliminar la colección ${collectionName}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setActionLoading(`drop-${collectionName}`);
        try {
            const response = await fetch(`/api/database/collections/${collectionName}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Error al eliminar colección");

            toast.success(`Colección ${collectionName} eliminada`);
            fetchOverview();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al eliminar");
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateBackup = async () => {
        setActionLoading("creating-backup");
        try {
            const response = await fetch("/api/system/backups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error("Error al crear respaldo");

            toast.success("Respaldo creado correctamente");
            await loadBackups();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al crear respaldo");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteBackup = async (backupName: string) => {
        if (!confirm(`¿Estás seguro de eliminar el respaldo "${backupName}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        setActionLoading(`delete-backup-${backupName}`);
        try {
            const response = await fetch(`/api/system/backups/${backupName}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Error al eliminar respaldo");

            toast.success("Respaldo eliminado correctamente");
            loadBackups();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al eliminar respaldo");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestoreBackup = async (backupName: string) => {
        setActionLoading(`restore-backup-${backupName}`);
        try {
            const response = await fetch("/api/database/backup/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backupName }),
            });
            const data = await response.json();
            if (!response.ok || data.success === false) {
                throw new Error(data.message || data.error || "Error al restaurar respaldo");
            }
            toast.success("Respaldo restaurado correctamente");
            fetchOverview();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al restaurar respaldo");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadBackup = (backupName: string) => {
        const url = `/api/database/backup/download/${backupName}`;
        window.open(url, "_blank");
    };

    const handleSwitchServer = async (serverId: string) => {
        const target = serversStatus.find((s) => s.id === serverId);
        setSwitchTargetServer(target);
        setSwitchModalOpen(true);
    };

    const handleConfirmSwitch = async () => {
        if (!switchTargetServer) return;

        setActionLoading("switch");
        try {
            const response = await fetch(`/api/mongo-servers/${switchTargetServer.id}/switch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ autoCreate: true }),
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.error || data.message || "Error al cambiar de servidor");
            }

            toast.success("Base de datos primaria cambiada exitosamente");
            setSwitchModalOpen(false);
            setSwitchTargetServer(null);
            await fetchOverview();
            await loadServers();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al cambiar servidor");
        } finally {
            setActionLoading(null);
        }
    };

    const totalDocuments = overview?.collections?.reduce((sum, col) => sum + col.count, 0) ?? 0;

    const filteredCollections = overview?.collections?.filter(col =>
        col.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm border-none bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Documentos Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDocuments.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm border-none bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <HardDrive className="h-4 w-4" />
                            Tamaño de Datos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(overview?.totalSize ?? 0)}</div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm border-none bg-slate-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Estado Conexión
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge className={cn(overview?.connected ? "bg-emerald-500" : "bg-red-500")}>
                            {overview?.connected ? "Conectado" : "Desconectado"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Servidores */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5 text-emerald-600" />
                        Servidores MongoDB
                    </CardTitle>
                    <CardDescription>
                        Gestión de instancias y replicación
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-slate-900 font-bold">Nombre</TableHead>
                                <TableHead className="text-slate-900 font-bold">Host</TableHead>
                                <TableHead className="text-slate-900 font-bold">Estado</TableHead>
                                <TableHead className="text-slate-900 font-bold">Rol</TableHead>
                                <TableHead className="text-right text-slate-900 font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {serversStatus.map((server) => (
                                <TableRow key={server.id} className="border-slate-100">
                                    <TableCell className="font-medium">{server.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{server.host}:{server.port}</TableCell>
                                    <TableCell>
                                        <Badge variant={server.connectionStatus === "online" ? "default" : "destructive"} className="text-[10px] h-5">
                                            {server.connectionStatus === "online" ? "Online" : "Offline"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("h-2 w-2 rounded-full", server.isPrimary ? "bg-emerald-500" : "bg-slate-300")} />
                                            <span className="text-xs font-medium">{server.isPrimary ? "Primaria" : "Secundaria"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!server.isPrimary && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => handleSwitchServer(server.id)}
                                            >
                                                Usar Primaria
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Colecciones & Respaldos Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colecciones */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Colecciones</CardTitle>
                            <CardDescription>Explora los datos del sistema</CardDescription>
                        </div>
                        <div className="relative w-48">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Buscar..."
                                className="h-8 pl-8 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {filteredCollections.map((collection) => (
                                    <div key={collection.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{collection.name}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {collection.count.toLocaleString()} docs • {formatBytes(collection.size)}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewingCollection(collection.name)}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleExportCollection(collection.name)}>
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Respaldos */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg">Respaldos</CardTitle>
                            <CardDescription>Copia de seguridad y restauración</CardDescription>
                        </div>
                        <Button size="sm" onClick={handleCreateBackup} disabled={actionLoading === "creating-backup"}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {backups.map((backup) => (
                                    <div key={backup.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{backup.name}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {new Date(backup.date).toLocaleString()} • {formatBytes(backup.size)}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleRestoreBackup(backup.name)}>
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownloadBackup(backup.name)}>
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleDeleteBackup(backup.name)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {switchTargetServer && (
                <SwitchDatabaseModal
                    open={switchModalOpen}
                    onOpenChange={setSwitchModalOpen}
                    currentServer={currentServer}
                    targetServer={switchTargetServer}
                    onConfirm={handleConfirmSwitch}
                    loading={actionLoading === "switch"}
                />
            )}

            {viewingCollection && (
                <CollectionViewerDialog
                    isOpen={!!viewingCollection}
                    collectionName={viewingCollection}
                    onClose={() => setViewingCollection(null)}
                />
            )}
        </div>
    );
}
