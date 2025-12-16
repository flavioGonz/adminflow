"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { API_URL } from "@/lib/http";

interface HealthStatus {
  api: boolean;
  database: boolean;
  loading: boolean;
  error?: string;
}

export function HealthCheck() {
  const [status, setStatus] = useState<HealthStatus>({
    api: false,
    database: false,
    loading: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/system/database`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus({
            api: true,
            database: data.engine === "mongodb",
            loading: false,
          });
        } else {
          setStatus({
            api: true,
            database: false,
            loading: false,
            error: `API respondió con status ${response.status}`,
          });
        }
      } catch (error: any) {
        setStatus({
          api: false,
          database: false,
          loading: false,
          error: error.message || "No se puede conectar con el servidor",
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        <span>Verificando conexión...</span>
      </div>
    );
  }

  if (!status.api) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <WifiOff className="h-4 w-4" />
        <span>Sin conexión al servidor</span>
        {status.error && (
          <span className="text-xs opacity-75">({status.error})</span>
        )}
      </div>
    );
  }

  if (!status.database) {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <AlertCircle className="h-4 w-4" />
        <span>Base de datos desconectada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span>Sistema operativo</span>
    </div>
  );
}

export function HealthIndicator() {
  const [status, setStatus] = useState<HealthStatus>({
    api: false,
    database: false,
    loading: true,
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/system/database`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus({
            api: true,
            database: data.engine === "mongodb",
            loading: false,
          });
        } else {
          setStatus({
            api: true,
            database: false,
            loading: false,
          });
        }
      } catch (error) {
        setStatus({
          api: false,
          database: false,
          loading: false,
        });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  if (status.loading) {
    return (
      <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Verificando conexión" />
    );
  }

  if (!status.api || !status.database) {
    return (
      <div className="h-2 w-2 rounded-full bg-red-500" title="Sistema desconectado" />
    );
  }

  return (
    <div className="h-2 w-2 rounded-full bg-green-500" title="Sistema conectado" />
  );
}
