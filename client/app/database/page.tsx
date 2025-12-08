"use client";

import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileJson,
  HardDrive,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Trash2,
  Upload,
  Wifi,
  Zap,
  Eye,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { cn } from "@/lib/utils";
import { ImportBackupDialog } from "@/components/database/import-backup-dialog";
import { CollectionViewerDialog } from "@/components/database/collection-viewer-dialog";

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
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDb, setMongoDb] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ state: "idle" });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Backup states
  const [backups, setBackups] = useState<any[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

  // Collection Viewer state
  const [viewingCollection, setViewingCollection] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/database/overview");
      if (!response.ok) throw new Error("Error al obtener información");
      const data = await response.json();
      setOverview(data);
      setMongoUri(data.mongoUri || "");
      setMongoDb(data.dbName || "");
      setLastUpdate(new Date());

      if (data.connected) {
        setConnectionStatus({ state: "success", message: "Conectado correctamente" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar datos");
      setConnectionStatus({ state: "error", message: "Error de conexión" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    loadBackups();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOverview();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleVerifyConnection = async () => {
    if (!mongoUri.trim()) {
      toast.error("Indica la URI de MongoDB");
      return;
    }

    setConnectionStatus({ state: "pending" });
    const startTime = Date.now();

    try {
      const response = await fetch("/api/database/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mongoUri, mongoDb }),
      });

      if (!response.ok) throw new Error("Error al verificar conexión");

      const result = await response.json();
      const latency = Date.now() - startTime;

      setConnectionStatus({
        state: "success",
        message: result.message || "Conexión exitosa",
        latency
      });
      toast.success("Conexión verificada correctamente");
      fetchOverview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error verificando conexión";
      setConnectionStatus({ state: "error", message });
      toast.error(message);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading("backup");
    try {
      const response = await fetch("/api/system/backups", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear respaldo");
      }

      const result = await response.json();
      toast.success(`Respaldo creado: ${result.backupName}`);
      loadBackups(); // Reload backups list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear respaldo");
    } finally {
      setActionLoading(null);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch("/api/system/backups");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al cargar respaldos");
      }
      const data = await response.json();
      setBackups(data);
    } catch (error) {
      console.error("Error loading backups:", error);
      // Optional: toast.error("No se pudieron cargar los respaldos");
    }
  };

  const handleDownloadBackup = async (backupName: string) => {
    setActionLoading(`download-${backupName}`);
    try {
      const response = await fetch(`/api/system/backups/${backupName}/download`);

      if (!response.ok) throw new Error("Error al descargar respaldo");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${backupName}.tar.gz`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Respaldo descargado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al descargar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setActionLoading("restore");
    try {
      const response = await fetch("/api/system/backups/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupName: selectedBackup.name }),
      });

      if (!response.ok) throw new Error("Error al restaurar respaldo");

      const result = await response.json();
      toast.success("Base de datos restaurada exitosamente");
      setShowRestoreModal(false);
      setSelectedBackup(null);
      fetchOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restaurar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCollection = async (collectionName: string) => {
    setActionLoading(`export-${collectionName}`);
    try {
      const response = await fetch(`/api/database/export/${collectionName}`);

      if (!response.ok) throw new Error("Error al exportar colección");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${collectionName}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Colección ${collectionName} exportada`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al exportar");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDropCollection = async (collectionName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la colección "${collectionName}"? Esta acción no se puede deshacer.`)) {
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

  const totalDocuments = overview?.collections?.reduce((sum, col) => sum + col.count, 0) ?? 0;
  const isConnected = connectionStatus.state === "success";

  const filteredCollections = overview?.collections?.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
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
              Panel de control y gestión de MongoDB
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column: Stats & Config */}
        <div className="xl:col-span-1 space-y-6">
          {/* Connection Status Card */}
          <Card className={cn(
            "border-0 shadow-md transition-all duration-300 overflow-hidden relative",
            isConnected ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white" : "bg-white"
          )}>
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Wifi className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Activity className="h-4 w-4" /> Estado de Conexión
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold tracking-tight">
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
                {connectionStatus.state === "pending" && <Loader2 className="h-6 w-6 animate-spin" />}
                {isConnected && (
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                )}
              </div>

              <div className="flex items-center gap-3 text-sm opacity-90">
                {connectionStatus.latency && (
                  <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm">
                    <Zap className="h-3.5 w-3.5" />
                    <span className="font-semibold">{connectionStatus.latency}ms</span>
                  </div>
                )}
                <span className="truncate max-w-[150px]" title={mongoDb}>
                  DB: {mongoDb || "Sin seleccionar"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <Server className="h-4 w-4 text-slate-500" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mongoUri" className="text-xs font-medium text-slate-500 uppercase tracking-wider">URI de Conexión</Label>
                <div className="relative">
                  <Input
                    id="mongoUri"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb://..."
                    className="h-9 text-xs font-mono bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-500" : "bg-slate-300")} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mongoDb" className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base de Datos</Label>
                <Input
                  id="mongoDb"
                  value={mongoDb}
                  onChange={(e) => setMongoDb(e.target.value)}
                  placeholder="adminflow"
                  className="h-9 text-xs font-mono bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <Button
                onClick={handleVerifyConnection}
                disabled={connectionStatus.state === "pending"}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                size="sm"
              >
                {connectionStatus.state === "pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Probar Conexión</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Grid (Mobile/Tablet only, hidden on XL) */}
          <div className="grid grid-cols-2 gap-4 xl:hidden">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-2">
                  <Database className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{overview?.collections?.length ?? 0}</div>
                <p className="text-xs text-slate-500 font-medium">Colecciones</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="p-2 rounded-full bg-indigo-50 text-indigo-600 mb-2">
                  <FileJson className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalDocuments.toLocaleString("es-UY")}</div>
                <p className="text-xs text-slate-500 font-medium">Documentos</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Middle Column: Collections */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Row (Visible only on XL) */}
          <div className="hidden xl:grid grid-cols-3 gap-4">
            <Card className="shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Colecciones</p>
                  <div className="text-2xl font-bold text-slate-900">{overview?.collections?.length ?? 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileJson className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Documentos</p>
                  <div className="text-2xl font-bold text-slate-900">{totalDocuments.toLocaleString("es-UY")}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tamaño</p>
                  <div className="text-2xl font-bold text-slate-900">{formatBytes(overview?.totalSize ?? 0)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collections List */}
          <Card className="border-slate-200 shadow-sm h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                  <Database className="h-4 w-4 text-emerald-600" />
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
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {filteredCollections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No se encontraron colecciones</p>
                    </div>
                  ) : (
                    filteredCollections
                      .sort((a, b) => b.count - a.count)
                      .map((collection) => (
                        <div
                          key={collection.name}
                          className="group flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 hover:border-emerald-200 hover:shadow-sm hover:bg-emerald-50/10 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4 min-w-0">
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
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Backups */}
        <div className="xl:col-span-1">
          <Card className="border-slate-200 shadow-sm h-full flex flex-col bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <HardDrive className="h-4 w-4 text-sky-600" />
                Respaldos
              </CardTitle>
              <CardDescription className="text-xs">
                Gestión de copias de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCreateBackup}
                  disabled={actionLoading === "backup"}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-200"
                  size="sm"
                >
                  {actionLoading === "backup" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Crear
                    </>
                  )}
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

              <div className="flex-1 overflow-hidden relative rounded-xl border border-slate-100 bg-slate-50/50">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {backups.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <HardDrive className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No hay respaldos</p>
                        <p className="text-xs opacity-70">Crea uno nuevo para empezar</p>
                      </div>
                    ) : (
                      backups.map((backup) => (
                        <div
                          key={backup.name}
                          className="group relative rounded-lg border border-slate-200 bg-white p-3 hover:border-sky-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
                              <FileJson className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 truncate" title={backup.name}>
                                {backup.name.replace('adminflow_', '').split('_')[0]}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {new Date(backup.createdAt).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatBytes(backup.size)}
                              </p>
                            </div>
                          </div>

                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-slate-200 hover:bg-slate-50"
                              onClick={() => handleDownloadBackup(backup.name)}
                              title="Descargar"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              title="Restaurar"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                              onClick={() => handleDeleteBackup(backup.name)}
                              disabled={actionLoading === `delete-backup-${backup.name}`}
                              title="Eliminar"
                            >
                              {actionLoading === `delete-backup-${backup.name}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Restore Backup Modal (Local) */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="sm:max-w-md overflow-hidden border-0 shadow-2xl">
          <div className="absolute inset-0 bg-amber-50/50 backdrop-blur-sm -z-10" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              Restaurar Respaldo Local
            </DialogTitle>
            <DialogDescription className="text-amber-800/80">
              Esta acción reemplazará todos los datos actuales con la versión seleccionada.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="p-4 rounded-xl bg-white border border-amber-100 shadow-sm space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Database className="h-4 w-4 text-slate-400" />
                <span>Base de datos actual será eliminada</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <RotateCcw className="h-4 w-4 text-slate-400" />
                <span>Se restaurará la versión:</span>
              </div>
              {selectedBackup && (
                <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-100 text-xs font-mono text-slate-600 break-all">
                  {selectedBackup.name}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowRestoreModal(false)} className="hover:bg-amber-100 hover:text-amber-900">
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleRestoreBackup}
              disabled={actionLoading === "restore"}
              className="bg-amber-600 hover:bg-amber-700 text-white border-0"
            >
              {actionLoading === "restore" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Confirmar Restauración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CollectionViewerDialog
        collectionName={viewingCollection}
        isOpen={!!viewingCollection}
        onClose={() => setViewingCollection(null)}
      />
    </div>
  );
}
