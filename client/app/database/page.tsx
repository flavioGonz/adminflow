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
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { cn } from "@/lib/utils";
import { ImportBackupDialog } from "@/components/database/import-backup-dialog";
import { CollectionViewerDialog } from "@/components/database/collection-viewer-dialog";
import { SwitchDatabaseModal } from "@/components/database/switch-database-modal";
import { SyncStatusModal } from "@/components/database/sync-status-modal";
import { BackupModal } from "@/components/database/backup-modal";
import { TableRowAnimation, TableListAnimation } from "@/components/animations/table-row-animation";

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

export default function DatabasePage() {
  const [overview, setOverview] = useState<MongoOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: "idle" });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [serversStatus, setServersStatus] = useState<any[]>([]);
  const [currentServer, setCurrentServer] = useState<any | null>(null);
  const [selectedSecondaries, setSelectedSecondaries] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [switchTargetServer, setSwitchTargetServer] = useState<any | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState("60");
  const [scheduleStartAt, setScheduleStartAt] = useState<string>("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  // Backup states
  const [backups, setBackups] = useState<any[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [viewingCollection, setViewingCollection] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    fetchOverview();
    loadServers();
    loadBackups();
    loadSchedule();
    
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
      // Normalize primary flag from multiple possible sources
      isPrimary: status?.isPrimary ?? (status?.role === "primary" || status?.current === true),
    }));
  };

  const loadServers = async () => {
    try {
      const response = await fetch("/api/mongo-servers");
      if (!response.ok) throw new Error("Error al cargar servidores");
      await response.json();

      // Load status
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

  const loadServersStatus = async () => {
    try {
      const response = await fetch("/api/mongo-servers/status");
      if (response.ok) {
        const statusData = await response.json();
        const statusesArray = normalizeStatuses(statusData);
        setServersStatus(statusesArray);
        const current = statusesArray.find((s: any) => s.isPrimary);
        setCurrentServer(current || null);
      }
    } catch (error) {
      console.error("Error loading server status", error);
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

  const loadSchedule = async () => {
    try {
      const response = await fetch("/api/database/sync/schedule");
      if (!response.ok) return;
      const data = await response.json();
      if (data?.enabled !== undefined) {
        setScheduleEnabled(Boolean(data.enabled));
        if (data.intervalMinutes) setScheduleInterval(String(data.intervalMinutes));
        if (data.startAt) setScheduleStartAt(data.startAt);
      }
    } catch (error) {
      console.error("Error loading sync schedule", error);
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

  const handleCreateBackup = async (): Promise<{success: boolean; location?: string; error?: string}> => {
    try {
      const response = await fetch("/api/system/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Error al crear respaldo");

      const data = await response.json();
      await loadBackups();
      
      return {
        success: true,
        location: data.location || "/backups/" + new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear respaldo"
      };
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
      await loadServersStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar servidor");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSecondary = (serverId: string) => {
    setSelectedSecondaries((prev) =>
      prev.includes(serverId) ? prev.filter((id) => id !== serverId) : [...prev, serverId]
    );
  };

  const handleSaveSchedule = async () => {
    if (selectedSecondaries.length === 0) {
      toast.error("Selecciona al menos un servidor secundario para programar");
      return;
    }
    setScheduleSaving(true);
    try {
      const response = await fetch("/api/database/sync/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: scheduleEnabled,
          intervalMinutes: Number(scheduleInterval) || 60,
          startAt: scheduleStartAt || null,
          sourceId: currentServer?.id,
          targetIds: selectedSecondaries,
          dropBeforeInsert: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "No se pudo guardar la programación");
      }

      toast.success(scheduleEnabled ? "Sincronización programada" : "Programación desactivada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al programar sincronización");
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleSyncNow = async () => {
    if (!currentServer || !currentServer.id) {
      toast.error("No hay primaria activa");
      return;
    }
    if (selectedSecondaries.length === 0) {
      toast.error("Selecciona al menos un servidor secundario");
      return;
    }

    setSyncing(true);
    setSyncProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => Math.min(prev + Math.random() * 30, 95));
    }, 500);

    try {
      const response = await fetch("/api/database/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: currentServer.id,
          targetIds: selectedSecondaries,
          dropBeforeInsert: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error en sincronización");

      setSyncProgress(100);
      toast.success("Sincronización completada");
      
      // Refresh servers status
      setTimeout(() => {
        loadServersStatus();
        setSyncModalOpen(false);
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en sincronización");
    } finally {
      clearInterval(progressInterval);
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const totalDocuments = overview?.collections?.reduce((sum, col) => sum + col.count, 0) ?? 0;
  const isConnected = connectionStatus.state === "success";

  const filteredCollections = overview?.collections?.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const secondaryServers = Array.isArray(serversStatus) ? serversStatus.filter((s) => !s.isPrimary) : [];

  return (
    <div className="min-h-screen bg-white p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <Database className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              <ShinyText size="3xl" weight="bold" className="text-slate-900">Base de Datos</ShinyText>
            </h1>
            <p className="text-slate-500 font-medium">
              {currentServer?.name || "Gestión de MongoDB"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            {lastUpdate && (
              <span>Actualizado: {lastUpdate.toLocaleTimeString("es-UY")}</span>
            )}
          </div>
          <Button
            onClick={fetchOverview}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Conexiones MongoDB + Modo de Trabajo side card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              Servidores MongoDB
            </CardTitle>
            <CardDescription>
              Haz clic en una base para ver su contenido. Usa el botón "Usar como primaria" para cambiar de servidor.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {serversStatus.map((server, idx) => (
                      <TableRow
                        key={server.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium whitespace-nowrap">{server.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                          {server.host}:{server.port}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">{server.database}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            className={cn(
                              "text-xs",
                              server.connectionStatus === "online"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {server.connectionStatus === "online" ? "Online" : "Offline"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <span
                              className={cn(
                                "inline-block h-2.5 w-2.5 rounded-full",
                                server.isPrimary ? "bg-emerald-500" : "bg-slate-400"
                              )}
                            />
                            <span>{server.isPrimary ? "Primaria" : "Secundaria"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!server.isPrimary && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleSwitchServer(server.id)}
                              >
                                Usar como primaria
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Side Mode Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden md:col-span-1 min-h-[300px]">
          <div className="flex h-full">
            <div
              className="flex-1 min-w-[40%] bg-cover bg-center"
              style={{
                backgroundImage: secondaryServers.length > 1 ? "url(/db-replica.jpg)" : "url(/db-sync.gif)",
              }}
            />
            <div className="flex-[1.6] p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Modo de Trabajo</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {currentServer?.isPrimary ? "Master-Slave" : secondaryServers.length > 1 ? "Replicación Multibase" : "Sync"}
                  </h3>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/80 shadow-sm">
                  {currentServer?.isPrimary ? (
                    <GitCompare className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Database className="h-5 w-5 text-sky-600" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Colecciones</p>
                  <p className="text-xl font-bold text-slate-900 leading-tight">{overview?.collections?.length ?? 0}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tamaño Total</p>
                  <div>
                    <p className="text-xl font-bold text-slate-900 leading-tight">{formatBytes(overview?.totalSize ?? 0)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Documentos</p>
                  <p className="text-xl font-bold text-slate-900 leading-tight">{totalDocuments.toLocaleString()}</p>
                </div>
              </div>
              <div className="pt-1 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Primaria Actual</p>
                <p className="text-sm font-bold text-slate-900">{currentServer?.name ?? "—"}</p>
                <p className="text-xs text-slate-600">{currentServer ? `${currentServer.host}:${currentServer.port}` : ""}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout: Colecciones, Respaldos, Sincronización */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Colecciones */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-emerald-600" />
                Colecciones
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200">
                  {overview?.collections?.length ?? 0}
                </Badge>
              </CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Buscar..."
                  className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative overflow-hidden">
              {/* Fadeout gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
              
              <ScrollArea className="h-auto max-h-[280px]">
                <div className="space-y-2 pr-4">
                  {filteredCollections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No se encontraron colecciones</p>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {filteredCollections
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 4)
                        .map((collection, idx) => (
                          <motion.div
                            key={collection.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 hover:border-emerald-200 hover:shadow-sm hover:bg-emerald-50/10 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                <Database className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-slate-900 truncate" title={collection.name}>
                                  {collection.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>{formatBytes(collection.size)}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{collection.count.toLocaleString()} docs</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                                onClick={() => setViewingCollection(collection.name)}
                                title="Ver Documentos"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleExportCollection(collection.name)}
                                disabled={actionLoading === `export-${collection.name}`}
                                title="Exportar JSON"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDropCollection(collection.name)}
                                disabled={actionLoading === `drop-${collection.name}`}
                                title="Eliminar Colección"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Respaldos */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="h-5 w-5 text-sky-600" />
              Respaldos
            </CardTitle>
            <CardDescription className="text-xs">
              Crea y restaura copias de seguridad de tu base de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setBackupModalOpen(true)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-200"
                size="sm"
              >
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Crear
                </>
              </Button>

              <ImportBackupDialog
                onImportComplete={() => {
                  fetchOverview();
                  loadBackups();
                }}
                currentStats={{
                  collections: overview?.collections || [],
                  totalSize: overview?.totalSize || 0
                }}
              >
                <Button
                  variant="outline"
                  className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300"
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </ImportBackupDialog>
            </div>

            <div className="flex-1 relative rounded-xl border border-slate-100 bg-slate-50/50">
              <ScrollArea className="h-auto max-h-[400px]">
                {backups.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No hay respaldos disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {backups.map((backup, idx) => (
                      <TableRowAnimation key={backup.name} delay={idx * 0.05}>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 hover:border-sky-200 hover:shadow-sm transition-all group">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{backup.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatBytes(backup.size)} • {new Date(backup.created).toLocaleDateString("es-UY")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleDownloadBackup(backup.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-sky-600 hover:bg-sky-50"
                              onClick={() => handleRestoreBackup(backup.name)}
                              disabled={actionLoading === `restore-backup-${backup.name}`}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteBackup(backup.name)}
                              disabled={actionLoading === `delete-backup-${backup.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableRowAnimation>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Sincronización */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-sky-600" />
              Sincronizar Datos
            </CardTitle>
            <CardDescription>
              Copia los datos desde el servidor primario a los servidores secundarios seleccionados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {secondaryServers.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-500">
                No hay servidores secundarios disponibles
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {secondaryServers.map((server) => (
                    <label
                      key={server.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 hover:border-sky-200 hover:bg-sky-50/20 cursor-pointer transition-all"
                    >
                      <Checkbox
                        checked={selectedSecondaries.includes(server.id)}
                        onCheckedChange={() => toggleSecondary(server.id)}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{server.name}</div>
                        <div className="text-xs text-slate-500">{server.host}:{server.port} · {server.database}</div>
                      </div>
                      <Badge className={server.connectionStatus === "online" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                        {server.connectionStatus === "online" ? "Online" : "Offline"}
                      </Badge>
                    </label>
                  ))}
                </div>

                <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-200 bg-white/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Programar sincronización</p>
                      <p className="text-xs text-slate-500">Ejecuta la sync en segundo plano desde Node</p>
                    </div>
                    <Switch
                      checked={scheduleEnabled}
                      onCheckedChange={(checked) => setScheduleEnabled(Boolean(checked))}
                    />
                  </div>
                  {scheduleEnabled && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-600">Intervalo (minutos)</p>
                        <Input
                          type="number"
                          min={5}
                          value={scheduleInterval}
                          onChange={(e) => setScheduleInterval(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-600">Inicia</p>
                        <Input
                          type="datetime-local"
                          value={scheduleStartAt}
                          onChange={(e) => setScheduleStartAt(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <Button
                          size="sm"
                          onClick={handleSaveSchedule}
                          disabled={scheduleSaving}
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          {scheduleSaving ? "Guardando..." : "Guardar programación"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => setSyncModalOpen(true)} 
                    disabled={syncing || selectedSecondaries.length === 0}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    {syncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Sincronizar ahora
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CollectionViewerDialog
        collectionName={viewingCollection}
        isOpen={!!viewingCollection}
        onClose={() => setViewingCollection(null)}
      />

      <SwitchDatabaseModal
        open={switchModalOpen}
        onOpenChange={setSwitchModalOpen}
        currentServer={currentServer}
        targetServer={switchTargetServer}
        loading={actionLoading === "switch"}
        onConfirm={handleConfirmSwitch}
      />

      <SyncStatusModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        sourceServer={currentServer}
        targetServers={serversStatus.filter((s) => selectedSecondaries.includes(s.id))}
        syncing={syncing}
        syncProgress={syncProgress}
        onConfirm={handleSyncNow}
      />

      <BackupModal
        open={backupModalOpen}
        onOpenChange={setBackupModalOpen}
        onConfirm={handleCreateBackup}
      />
    </div>
  );
}
