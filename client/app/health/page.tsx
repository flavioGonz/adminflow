"use client";

import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { ShinyText } from "@/components/ui/shiny-text";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Server,
  Wifi,
  Clock
} from "lucide-react";
import { API_URL } from "@/lib/http";

interface HealthData {
  api: {
    status: "online" | "offline" | "checking";
    url: string;
    responseTime?: number;
  };
  database: {
    status: "connected" | "disconnected" | "checking";
    engine?: string;
    uri?: string;
    dbName?: string;
  };
  lastCheckTs?: number; // timestamp to avoid SSR locale mismatch
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData>({
    api: {
      status: "checking",
      url: API_URL,
    },
    database: {
      status: "checking",
    },
    // do not set localized date during SSR to avoid hydration mismatch
  });
  const [lastCheckStr, setLastCheckStr] = useState<string>("");

  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    setRefreshing(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_URL}/system/database`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        setHealth({
          api: {
            status: "online",
            url: API_URL,
            responseTime,
          },
          database: {
            status: data.engine ? "connected" : "disconnected",
            engine: data.engine,
            uri: data.data?.mongoUri || data.data?.sqlitePath,
            dbName: data.data?.mongoDb,
          },
          lastCheckTs: Date.now(),
        });
        setLastCheckStr(new Date().toLocaleString("es-UY"));
      } else {
        setHealth({
          api: {
            status: "online",
            url: API_URL,
            responseTime,
          },
          database: {
            status: "disconnected",
          },
          lastCheckTs: Date.now(),
        });
        setLastCheckStr(new Date().toLocaleString("es-UY"));
      }
    } catch (error: any) {
      setHealth({
        api: {
          status: "offline",
          url: API_URL,
        },
        database: {
          status: "disconnected",
        },
        lastCheckTs: Date.now(),
      });
      setLastCheckStr(new Date().toLocaleString("es-UY"));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "offline":
      case "disconnected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "checking":
        return <AlertCircle className="h-6 w-6 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Conectado
          </span>
        );
      case "offline":
      case "disconnected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Desconectado
          </span>
        );
      case "checking":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Verificando...
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Desconocido
          </span>
        );
    }
  };

  return (
    <PageTransition>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <ShinyText size="3xl" weight="bold">Estado del Sistema</ShinyText>
              </h1>
              <p className="text-sm text-muted-foreground">
                Diagnóstico de conectividad y servicios
              </p>
            </div>
          </div>
          <button
            onClick={checkHealth}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? "Verificando..." : "Actualizar"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* API Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Servidor API</h2>
              </div>
              {getStatusIcon(health.api.status)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estado:</span>
                {getStatusBadge(health.api.status)}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">URL:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {health.api.url}
                </code>
              </div>

              {health.api.responseTime !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo de respuesta:</span>
                  <span className="text-sm font-medium">
                    {health.api.responseTime}ms
                  </span>
                </div>
              )}
            </div>

            {health.api.status === "offline" && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ No se puede conectar con el servidor. Verifica que el backend esté corriendo en <code className="font-mono">{health.api.url}</code>
                </p>
              </div>
            )}
          </div>

          {/* Database Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold">Base de Datos</h2>
              </div>
              {getStatusIcon(health.database.status)}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estado:</span>
                {getStatusBadge(health.database.status)}
              </div>

              {health.database.engine && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Motor:</span>
                  <span className="text-sm font-medium capitalize">
                    {health.database.engine}
                  </span>
                </div>
              )}

              {health.database.uri && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">URI:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-xs">
                    {health.database.uri}
                  </code>
                </div>
              )}

              {health.database.dbName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Base:</span>
                  <span className="text-sm font-medium">
                    {health.database.dbName}
                  </span>
                </div>
              )}
            </div>

            {health.database.status === "disconnected" && health.api.status === "online" && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  ⚠️ El servidor está online pero no hay conexión con la base de datos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Last Check Info */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Última verificación: <span className="font-medium">{lastCheckStr || "—"}</span>
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            Actualización automática cada 10 segundos
          </span>
        </div>

        {/* Troubleshooting Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Solución de Problemas
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Si el servidor está offline:</strong> Ejecuta <code className="bg-blue-100 px-2 py-0.5 rounded">node server/index.js</code> desde el directorio del proyecto.
            </p>
            <p>
              <strong>Si la base de datos está desconectada:</strong> Verifica la configuración en <code className="bg-blue-100 px-2 py-0.5 rounded">server/.selected-db.json</code> y que MongoDB esté accesible.
            </p>
            <p>
              <strong>Puerto incorrecto:</strong> Asegúrate de que <code className="bg-blue-100 px-2 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> en <code className="bg-blue-100 px-2 py-0.5 rounded">client/.env.local</code> apunte al puerto correcto (ej: http://localhost:5000/api).
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
