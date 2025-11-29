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
  const [showBackupModal, setShowBackupModal] = useState(false);
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
              <ShinyText size="3xl" weight="bold">Base de Datos MongoDB</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra conexiones, colecciones y respaldos de MongoDB
            </p>
          </div>
        </div>
        <Button onClick={fetchOverview} variant="outline" size="sm">
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card className={cn(
        "border-l-4",
        isConnected ? "border-l-emerald-500 bg-emerald-50/50" : "border-l-slate-300"
      )}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg p-2",
              isConnected ? "bg-emerald-100" : "bg-slate-100"
            )}>
              {isConnected ? (
                <Wifi className="h-5 w-5 text-emerald-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Estado de Conexión</p>
              <p className="text-xs text-muted-foreground">
                {connectionStatus.message || "No conectado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {connectionStatus.latency && (
              <div className="flex items-center gap-1 text-sm">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="font-medium">{connectionStatus.latency}ms</span>
              </div>
            )}
            <Badge className={cn(
              "gap-2",
              isConnected ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-500"
            )}>
              {connectionStatus.state === "pending" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verificando
                </>
              ) : isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Conectado
                </>
              ) : (
                "Desconectado"
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colecciones</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.collections?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de colecciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments.toLocaleString("es-UY")}</div>
            <p className="text-xs text-muted-foreground">
              Total de documentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamaño</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(overview?.totalSize ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              Espacio utilizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configuración de Conexión
          </CardTitle>
          <CardDescription>
            Configura la URI y base de datos de MongoDB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mongoUri">URI de Conexión</Label>
              <Input
                id="mongoUri"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                placeholder="mongodb://usuario:pass@host:puerto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mongoDb">Nombre de Base de Datos</Label>
              <Input
                id="mongoDb"
                value={mongoDb}
                onChange={(e) => setMongoDb(e.target.value)}
                placeholder="adminflow"
              />
            </div>
          </div>
          <Button
            onClick={handleVerifyConnection}
            disabled={connectionStatus.state === "pending"}
            variant="outline"
            size="sm"
          >
            {connectionStatus.state === "pending" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Probar Conexión
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Operaciones de mantenimiento y respaldo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={handleCreateBackup}
            disabled={actionLoading === "backup"}
            variant="outline"
          >
            {actionLoading === "backup" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Crear Respaldo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Collections List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            Colecciones MongoDB
          </CardTitle>
          <CardDescription>
            {overview?.collections?.length ?? 0} colecciones con {totalDocuments.toLocaleString("es-UY")} documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview?.error ? (
            <p className="text-center text-sm text-rose-600 py-4">
              Error: {overview.error}
            </p>
          ) : (
            <>
              {overview?.collections
                ?.sort((a, b) => b.count - a.count)
                .map((collection) => (
                  <div
                    key={collection.name}
                    className="flex items-center justify-between rounded-lg border bg-emerald-50/50 px-4 py-3 hover:bg-emerald-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="font-medium">{collection.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(collection.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {collection.count.toLocaleString("es-UY")} docs
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExportCollection(collection.name)}
                        disabled={actionLoading === `export-${collection.name}`}
                        title="Exportar colección"
                      >
                        {actionLoading === `export-${collection.name}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDropCollection(collection.name)}
                        disabled={actionLoading === `drop-${collection.name}`}
                        title="Eliminar colección"
                        className="text-destructive hover:text-destructive"
                      >
                        {actionLoading === `drop-${collection.name}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              {!overview?.collections?.length && !overview?.error && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No hay colecciones disponibles
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Backups Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-600" />
                Respaldos de MongoDB
              </CardTitle>
              <CardDescription>
                Gestiona los respaldos completos de tu base de datos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateBackup}
                disabled={actionLoading === "backup"}
                variant="outline"
              >
                {actionLoading === "backup" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Crear Respaldo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-center justify-between rounded-lg border bg-blue-50/50 px-4 py-3 hover:bg-blue-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="font-medium">{backup.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(backup.createdAt).toLocaleString("es-UY")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadBackup(backup.name)}
                      disabled={actionLoading === `download-${backup.name}`}
                      title="Descargar respaldo"
                    >
                      {actionLoading === `download-${backup.name}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreModal(true);
                      }}
                      title="Restaurar respaldo"
                      className="text-amber-600 hover:text-amber-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No hay respaldos disponibles
            </p>
          )}
        </CardContent>
      </Card>

      {/* Last Update */}
      <Card className="bg-slate-50/50">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última actualización: {lastUpdate.toLocaleString("es-UY")}</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            MongoDB
          </Badge>
        </CardContent>
      </Card>

      {/* Restore Backup Modal */}
      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="sm:max-w-md">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                Restaurar Respaldo
              </DialogTitle>
              <DialogDescription>
                Esta acción reemplazará todos los datos actuales
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    ⚠️ Advertencia: Esta acción no se puede deshacer
                  </p>
                  {selectedBackup && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Respaldo:</span> {selectedBackup.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Fecha:</span>{" "}
                        {new Date(selectedBackup.createdAt).toLocaleString("es-UY")}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Se restaurarán todas las colecciones y documentos del respaldo seleccionado.
                  Los datos actuales serán reemplazados.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={handleRestoreBackup}
                disabled={actionLoading === "restore"}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {actionLoading === "restore" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
