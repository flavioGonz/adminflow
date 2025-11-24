"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import {
  Activity,
  CheckCircle,
  Clock,
  Database,
  GitCompareArrows,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  getDatabaseConfig,
  updateDatabaseConfig,
  selectDatabaseEngine,
  syncDatabase,
  resetDatabase,
  migrateToMongo,
  verifyDatabaseConnection,
  getDatabaseOverview,
  type DbEngine,
} from "@/lib/api-database";
import { cn } from "@/lib/utils";

type DatabaseConfig = {
  engine: DbEngine;
  mongoUri?: string;
  mongoDb?: string;
  sqlitePath?: string;
};

type OverviewResponse = {
  sqlite: {
    tables: Record<string, number>;
    status: string;
  };
  mongo: {
    collections: { name: string; count: number }[];
    size: number;
    error?: string;
  };
  engine: DbEngine;
};

type ConnectionState = "idle" | "pending" | "success" | "error";

type ConnectionStatus = {
  state: ConnectionState;
  message?: string;
  latency?: number;
};

const initialConnectionStatus: Record<DbEngine, ConnectionStatus> = {
  sqlite: { state: "idle" },
  mongodb: { state: "idle" },
};

export default function DatabasePage() {
  const [config, setConfig] = useState<DatabaseConfig | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [selectedDb, setSelectedDb] = useState<DbEngine>("mongodb");
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    mongoUri: "",
    mongoDb: "",
    sqlitePath: "",
  });
  const [connectionStatus, setConnectionStatus] = useState<Record<DbEngine, ConnectionStatus>>(
    initialConnectionStatus
  );

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await getDatabaseConfig();
      const payload = response?.data ?? {};
      setConfig(payload);
      if (response?.engine) {
        setSelectedDb(response.engine);
      } else if (payload.engine) {
        setSelectedDb(payload.engine);
      }
      setFormValues({
        mongoUri: payload.mongoUri ?? "",
        mongoDb: payload.mongoDb ?? "",
        sqlitePath: payload.sqlitePath ?? "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la configuración.");
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const response = await getDatabaseOverview();
      setOverview(response);
      if (response?.engine) {
        setSelectedDb(response.engine);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el estado de base.");
    } finally {
      setIsLoadingOverview(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchOverview();

    // Auto-refresh overview every 30 seconds
    const interval = setInterval(() => {
      fetchOverview();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshOverview = () => {
    fetchOverview();
  };

  const totalTables = useMemo(
    () => Object.values(overview?.sqlite.tables ?? {}).reduce((total, count) => total + count, 0),
    [overview]
  );

  const totalCollections = useMemo(
    () => overview?.mongo.collections?.length ?? 0,
    [overview?.mongo.collections]
  );

  const totalDocuments = useMemo(
    () => overview?.mongo.collections?.reduce((sum, col) => sum + col.count, 0) ?? 0,
    [overview?.mongo.collections]
  );

  const updateConnectionStatus = (engine: DbEngine, state: ConnectionState, message?: string, latency?: number) => {
    setConnectionStatus((prev) => ({
      ...prev,
      [engine]: { state, message, latency },
    }));
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setActionLoading("save-config");
    try {
      const payload = {
        ...config,
        engine: selectedDb,
        mongoUri: formValues.mongoUri,
        mongoDb: formValues.mongoDb,
        sqlitePath: formValues.sqlitePath,
      };
      const response = await updateDatabaseConfig(payload);
      const updatedConfig = response?.data ?? payload;
      setConfig(updatedConfig);
      toast.success("Configuración guardada correctamente");
      refreshOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEngineSwitch = async (engine: DbEngine) => {
    setActionLoading(`switch-${engine}`);
    try {
      const response = await selectDatabaseEngine(engine);
      setSelectedDb(engine);
      const payload: any = (response as any)?.data ?? response;
      if (payload) {
        setConfig(payload);
        setFormValues({
          mongoUri: payload.mongoUri ?? formValues.mongoUri,
          mongoDb: payload.mongoDb ?? formValues.mongoDb,
          sqlitePath: payload.sqlitePath ?? formValues.sqlitePath,
        });
      }
      toast.success((response as any)?.message ?? `Motor cambiado a ${engine}`);
      refreshOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el motor.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (action: "sync" | "reset", engine: DbEngine) => {
    setActionLoading(`${action}-${engine}`);
    try {
      const result =
        action === "sync" ? await syncDatabase(engine) : await resetDatabase(engine);
      toast.success(result.message);
      refreshOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `No se pudo ${action}ar ${engine}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMigrate = async () => {
    setActionLoading("migrate");
    try {
      const result = await migrateToMongo();
      toast.success(result.message);
      refreshOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo migrar la data.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyConnection = async (engine: DbEngine) => {
    if (engine === "mongodb" && !formValues.mongoUri.trim()) {
      toast.error("Indica la URI de MongoDB antes de verificar.");
      return;
    }
    if (engine === "sqlite" && !formValues.sqlitePath.trim()) {
      toast.error("Indica la ruta al archivo SQLite antes de verificar.");
      return;
    }

    updateConnectionStatus(engine, "pending");
    const startTime = Date.now();

    try {
      const payload =
        engine === "mongodb"
          ? {
            engine,
            mongoUri: formValues.mongoUri,
            mongoDb: formValues.mongoDb,
          }
          : {
            engine,
            sqlitePath: formValues.sqlitePath,
          };
      const result = await verifyDatabaseConnection(payload);
      const latency = Date.now() - startTime;
      updateConnectionStatus(engine, "success", result.info ?? result.message, latency);
      toast.success(result.info ?? result.message ?? "Conexión verificada.");
      refreshOverview();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error verificando conexión.";
      updateConnectionStatus(engine, "error", message);
      toast.error(message);
    }
  };

  const isConnected = (engine: DbEngine) => {
    return connectionStatus[engine].state === "success";
  };

  if (isLoadingConfig && !config) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Datos</h1>
          <p className="text-muted-foreground">
            Administra conexiones, monitorea estadísticas y sincroniza datos
          </p>
        </div>
        <Button onClick={refreshOverview} variant="outline" size="sm">
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingOverview && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Engine Selector Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* SQLite Card */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            selectedDb === "sqlite" && "border-2 border-blue-500 shadow-lg"
          )}
          onClick={() => handleEngineSwitch("sqlite")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <HardDrive className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">SQLite Local</CardTitle>
                  <CardDescription>Base de datos embebida</CardDescription>
                </div>
              </div>
              {isConnected("sqlite") ? (
                <Wifi className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estado</span>
              <Badge
                variant={isConnected("sqlite") ? "default" : "secondary"}
                className={cn(
                  "gap-1",
                  isConnected("sqlite") && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {connectionStatus.sqlite.state === "pending" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando
                  </>
                ) : isConnected("sqlite") ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Conectado
                  </>
                ) : (
                  "Desconectado"
                )}
              </Badge>
            </div>
            {connectionStatus.sqlite.latency && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Latencia</span>
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {connectionStatus.sqlite.latency}ms
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tablas</span>
              <span className="font-medium">{Object.keys(overview?.sqlite.tables ?? {}).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Registros</span>
              <span className="font-medium">{totalTables.toLocaleString("es-UY")}</span>
            </div>
          </CardContent>
        </Card>

        {/* MongoDB Card */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg",
            selectedDb === "mongodb" && "border-2 border-emerald-500 shadow-lg"
          )}
          onClick={() => handleEngineSwitch("mongodb")}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <Database className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">MongoDB</CardTitle>
                  <CardDescription>Base de datos remota</CardDescription>
                </div>
              </div>
              {isConnected("mongodb") ? (
                <Wifi className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estado</span>
              <Badge
                variant={isConnected("mongodb") ? "default" : "secondary"}
                className={cn(
                  "gap-1",
                  isConnected("mongodb") && "bg-emerald-500 hover:bg-emerald-600"
                )}
              >
                {connectionStatus.mongodb.state === "pending" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando
                  </>
                ) : isConnected("mongodb") ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    Conectado
                  </>
                ) : overview?.mongo.error ? (
                  "Error"
                ) : (
                  "Desconectado"
                )}
              </Badge>
            </div>
            {connectionStatus.mongodb.latency && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Latencia</span>
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {connectionStatus.mongodb.latency}ms
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Colecciones</span>
              <span className="font-medium">{totalCollections}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documentos</span>
              <span className="font-medium">{totalDocuments.toLocaleString("es-UY")}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tamaño</span>
              <span className="font-medium">{formatBytes(overview?.mongo.size ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Engine Banner */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Motor Activo</p>
              <p className="text-xs text-muted-foreground">
                Todas las operaciones se realizan en {selectedDb === "sqlite" ? "SQLite" : "MongoDB"}
              </p>
            </div>
          </div>
          <Badge className="gap-2 bg-primary text-primary-foreground">
            <Activity className="h-3 w-3" />
            {selectedDb.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configuración de Conexión
          </CardTitle>
          <CardDescription>
            Configura las credenciales y rutas para cada motor de base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MongoDB Config */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold">MongoDB</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mongoUri">URI de Conexión</Label>
                <Input
                  id="mongoUri"
                  value={formValues.mongoUri}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, mongoUri: e.target.value }))
                  }
                  placeholder="mongodb://usuario:pass@host:puerto"
                  disabled={isLoadingConfig}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mongoDb">Nombre de Base de Datos</Label>
                <Input
                  id="mongoDb"
                  value={formValues.mongoDb}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, mongoDb: e.target.value }))
                  }
                  placeholder="adminflow"
                  disabled={isLoadingConfig}
                />
              </div>
            </div>
            <Button
              onClick={() => handleVerifyConnection("mongodb")}
              disabled={connectionStatus.mongodb.state === "pending"}
              variant="outline"
              size="sm"
            >
              {connectionStatus.mongodb.state === "pending" ? (
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
          </div>

          <Separator />

          {/* SQLite Config */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">SQLite</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqlitePath">Ruta del Archivo</Label>
              <Input
                id="sqlitePath"
                value={formValues.sqlitePath}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, sqlitePath: e.target.value }))
                }
                placeholder="./database.db"
                disabled={isLoadingConfig}
              />
            </div>
            <Button
              onClick={() => handleVerifyConnection("sqlite")}
              disabled={connectionStatus.sqlite.state === "pending"}
              variant="outline"
              size="sm"
            >
              {connectionStatus.sqlite.state === "pending" ? (
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
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={actionLoading === "save-config" || isLoadingConfig}
            >
              {actionLoading === "save-config" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Configuración"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* SQLite Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-blue-600" />
              Acciones SQLite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleAction("sync", "sqlite")}
              disabled={actionLoading === "sync-sqlite"}
            >
              {actionLoading === "sync-sqlite" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => handleAction("reset", "sqlite")}
              disabled={actionLoading === "reset-sqlite"}
            >
              {actionLoading === "reset-sqlite" ? "Reiniciando..." : "Recrear Tablas"}
            </Button>
          </CardContent>
        </Card>

        {/* MongoDB Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-emerald-600" />
              Acciones MongoDB
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleAction("sync", "mongodb")}
              disabled={actionLoading === "sync-mongodb"}
            >
              {actionLoading === "sync-mongodb" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => handleAction("reset", "mongodb")}
              disabled={actionLoading === "reset-mongodb"}
            >
              {actionLoading === "reset-mongodb" ? "Reseteando..." : "Borrar Colecciones"}
            </Button>
          </CardContent>
        </Card>

        {/* Migration */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompareArrows className="h-4 w-4 text-primary" />
              Migración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={handleMigrate}
              disabled={actionLoading === "migrate"}
            >
              {actionLoading === "migrate" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrando...
                </>
              ) : (
                "SQLite → MongoDB"
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Migra todos los datos de SQLite a MongoDB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* SQLite Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              Tablas SQLite
            </CardTitle>
            <CardDescription>
              {Object.keys(overview?.sqlite.tables ?? {}).length} tablas con {totalTables.toLocaleString("es-UY")} registros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(overview?.sqlite.tables ?? {})
              .sort(([, a], [, b]) => b - a)
              .map(([table, count]) => (
                <div
                  key={table}
                  className="flex items-center justify-between rounded-lg border bg-slate-50/50 px-3 py-2"
                >
                  <span className="font-medium">{table}</span>
                  <Badge variant="secondary">{count.toLocaleString("es-UY")}</Badge>
                </div>
              ))}
            {Object.keys(overview?.sqlite.tables ?? {}).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No hay tablas disponibles
              </p>
            )}
          </CardContent>
        </Card>

        {/* MongoDB Collections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              Colecciones MongoDB
            </CardTitle>
            <CardDescription>
              {totalCollections} colecciones con {totalDocuments.toLocaleString("es-UY")} documentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview?.mongo.error ? (
              <p className="text-center text-sm text-rose-600 py-4">
                Error: {overview.mongo.error}
              </p>
            ) : (
              <>
                {overview?.mongo.collections
                  ?.sort((a, b) => b.count - a.count)
                  .map((collection) => (
                    <div
                      key={collection.name}
                      className="flex items-center justify-between rounded-lg border bg-emerald-50/50 px-3 py-2"
                    >
                      <span className="font-medium">{collection.name}</span>
                      <Badge variant="secondary">{collection.count.toLocaleString("es-UY")}</Badge>
                    </div>
                  ))}
                {totalCollections === 0 && !overview?.mongo.error && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No hay colecciones disponibles
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Update Info */}
      <Card className="bg-slate-50/50">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Última actualización: {new Date().toLocaleString("es-UY")}</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Auto-refresh: 30s
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let index = -1;
  let value = bytes;
  do {
    value /= 1024;
    index += 1;
  } while (value >= 1024 && index < units.length - 1);
  return `${value.toFixed(1)} ${units[index]}`;
};
