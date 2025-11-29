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
  Server,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { cn } from "@/lib/utils";
import { ImportBackupDialog } from "@/components/database/import-backup-dialog";

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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Backup states
  const [backups, setBackups] = useState<any[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);

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

      if (!response.ok) throw new Error("Error al crear respaldo");

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
      if (!response.ok) throw new Error("Error al cargar respaldos");
      const data = await response.json();
      setBackups(data);
    } catch (error) {
      console.error("Error loading backups:", error);
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

  const totalDocuments = overview?.collections?.reduce((sum, col) => sum + col.count, 0) ?? 0;
  const isConnected = connectionStatus.state === "success";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <ShinyText size="3xl" weight="bold">Base de Datos</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Panel de control y gestión de MongoDB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            <span>Actualizado: {lastUpdate.toLocaleTimeString("es-UY")}</span>
          </div>
          <Button onClick={fetchOverview} variant="outline" size="sm">
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">

        {/* Column 1: Connection & Config */}
        <div className="space-y-6">
          <Card className={cn(
            "border-l-4 shadow-sm",
            isConnected ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-slate-300"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" /> Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-2xl font-bold",
                  isConnected ? "text-emerald-700" : "text-slate-500"
                )}>
                  {isConnected ? "Conectado" : "Desconectado"}
                </span>
                {connectionStatus.state === "pending" && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {connectionStatus.message || "Esperando verificación..."}
              </p>
              {connectionStatus.latency && (
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md w-fit">
                  <Zap className="h-3 w-3" />
                  {connectionStatus.latency}ms latencia
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4 text-slate-500" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mongoUri" className="text-xs">URI de Conexión</Label>
                <Input
                  id="mongoUri"
                  value={mongoUri}
                  onChange={(e) => setMongoUri(e.target.value)}
                  placeholder="mongodb://..."
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mongoDb" className="text-xs">Base de Datos</Label>
                <Input
                  id="mongoDb"
                  value={mongoDb}
                  onChange={(e) => setMongoDb(e.target.value)}
                  placeholder="adminflow"
                  className="h-8 text-xs font-mono"
                />
              </div>
              <Button
                onClick={handleVerifyConnection}
                disabled={connectionStatus.state === "pending"}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {connectionStatus.state === "pending" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Probar Conexión</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Stats */}
        <div className="space-y-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colecciones</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.collections?.length ?? 0}</div>
              <p className="text-xs text-muted-foreground">Estructuras de datos</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos</CardTitle>
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments.toLocaleString("es-UY")}</div>
              <p className="text-xs text-muted-foreground">Registros totales</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Almacenamiento</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(overview?.totalSize ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Espacio en disco</p>
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Collections List */}
        <Card className="shadow-sm h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-emerald-600" />
              Colecciones
            </CardTitle>
            <CardDescription className="text-xs">
              Gestión de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[500px] pr-2 space-y-2">
            {overview?.collections
              ?.sort((a, b) => b.count - a.count)
              .map((collection) => (
                <div
                  key={collection.name}
                  className="group flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 hover:bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" title={collection.name}>{collection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(collection.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1 h-5">
                      {collection.count}
                    </Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleExportCollection(collection.name)}
                        disabled={actionLoading === `export-${collection.name}`}
                        title="Exportar"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDropCollection(collection.name)}
                        disabled={actionLoading === `drop-${collection.name}`}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Column 4: Backups */}
        <Card className="shadow-sm h-full flex flex-col border-t-4 border-t-sky-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-sky-600" />
              Respaldos
            </CardTitle>
            <CardDescription className="text-xs">
              Copias de seguridad y restauración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCreateBackup}
                disabled={actionLoading === "backup"}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
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
                  className="w-full border-sky-200 text-sky-700 hover:bg-sky-50"
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </ImportBackupDialog>
            </div>

            <Separator />

            <div className="space-y-2 overflow-auto max-h-[400px] pr-1">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="rounded-lg border bg-slate-50 p-3 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-sky-100 text-sky-600">
                        <Database className="h-3 w-3" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium truncate w-[120px]" title={backup.name}>
                          {backup.name.replace('adminflow_', '').split('_')[0]}...
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(backup.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleDownloadBackup(backup.name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Bajar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreModal(true);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Restaurar
                    </Button>
                  </div>
                </div>
              ))}
              {backups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No hay respaldos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restore Backup Modal (Local) */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                Restaurar Respaldo Local
              </DialogTitle>
              <DialogDescription>
                Esta acción reemplazará todos los datos actuales
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    ⚠️ Advertencia: Irreversible
                  </p>
                  {selectedBackup && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Archivo:</span> {selectedBackup.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRestoreModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleRestoreBackup}
                disabled={actionLoading === "restore"}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {actionLoading === "restore" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Restaurar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
