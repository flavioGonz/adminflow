"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cpu, Gauge, MemoryStick, RefreshCcw, Server, ServerCog, TerminalSquare } from "lucide-react";
import { PageTransition } from "@/components/ui/page-transition";
import { ShinyText } from "@/components/ui/shiny-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/http";

const formatBytes = (value?: number) => {
  if (!value && value !== 0) return "–";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let idx = 0;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx++;
  }
  return `${size.toFixed(1)} ${units[idx]}`;
};

const formatSeconds = (seconds?: number | null) => {
  if (!seconds && seconds !== 0) return "–";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${mins}m`);
  return parts.join(" ");
};

const formatLoad = (load?: number[]) => {
  if (!load || !load.length) return "–";
  return `${load[0].toFixed(2)} / ${load[1].toFixed(2)} / ${load[2].toFixed(2)}`;
};

type StatusOverview = {
  node?: {
    version?: string;
    uptimeSeconds?: number;
    env?: string;
    memory?: { rss?: number; heapUsed?: number; heapTotal?: number; external?: number };
    cpuUsage?: { user?: number; system?: number };
  };
  system?: {
    platform?: string;
    release?: string;
    arch?: string;
    load?: number[];
    cpuCount?: number;
    totalMem?: number;
    freeMem?: number;
    uptimeSeconds?: number | null;
  };
  backend?: { name?: string; version?: string | null };
  frontend?: { name?: string; version?: string | null; react?: string | null; next?: string | null };
  database?: { engine?: string | null; connected?: boolean; name?: string | null };
  logs?: string[];
  timestamp?: string;
};

export default function SystemStatusPage() {
  const [status, setStatus] = useState<StatusOverview | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${API_URL}/status/overview`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const data = (await response.json()) as StatusOverview;
      setStatus(data);
      setLogs(data.logs || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "No se pudo obtener el estado");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/status/logs?limit=120`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data.lines)) {
        setLogs(data.lines);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const memoryUsage = useMemo(() => {
    const total = status?.system?.totalMem;
    const free = status?.system?.freeMem;
    const used = total && free !== undefined ? total - free : undefined;
    return { total, free, used };
  }, [status]);

  const backendStatusBadge = status?.database?.connected ? (
    <Badge className="bg-emerald-100 text-emerald-800" variant="outline">Activo</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800" variant="outline">Desconectado</Badge>
  );

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Ayuda y soporte</p>
            <h1 className="text-3xl font-bold text-slate-900">
              <ShinyText size="3xl" weight="bold">Estado del sistema</ShinyText>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Salud de Node, React, base de datos y logs en vivo. Actualiza cada 8 segundos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchLogs} disabled={refreshing}>
              <TerminalSquare className="h-4 w-4 mr-2" />
              Solo logs
            </Button>
            <Button onClick={fetchStatus} disabled={refreshing}>
              <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Actualizando" : "Actualizar"}
            </Button>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Node</CardTitle>
              <Cpu className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">{status?.node?.version || "–"}</p>
              <p className="text-xs text-slate-500">Uptime {formatSeconds(status?.node?.uptimeSeconds)}</p>
              <p className="text-xs text-slate-500">Env {status?.node?.env || "N/D"}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Frontend (React / Next)</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-slate-900">React {status?.frontend?.react || "–"}</p>
              <p className="text-sm text-slate-700">Next {status?.frontend?.next || "–"}</p>
              <p className="text-xs text-slate-500">Build {status?.frontend?.version || "N/D"}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Base de datos</CardTitle>
              <Server className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-900">
                {backendStatusBadge}
                <span className="font-semibold">{status?.database?.engine || "N/D"}</span>
              </div>
              <p className="text-xs text-slate-500">Base: {status?.database?.name || "–"}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Servidor</CardTitle>
              <ServerCog className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{status?.system?.platform} {status?.system?.release}</p>
              <p className="text-xs text-slate-500">Arch: {status?.system?.arch}</p>
              <p className="text-xs text-slate-500">CPUs: {status?.system?.cpuCount ?? "–"}</p>
              <p className="text-xs text-slate-500">Uptime OS: {formatSeconds(status?.system?.uptimeSeconds)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">CPU</CardTitle>
              <Gauge className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-900">Load avg: {formatLoad(status?.system?.load)}</p>
              <p className="text-xs text-slate-500">Uso user/system: {status?.node?.cpuUsage ? `${Math.round((status.node.cpuUsage.user || 0) / 1000)}ms / ${Math.round((status.node.cpuUsage.system || 0) / 1000)}ms` : "–"}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Memoria</CardTitle>
              <MemoryStick className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-900">
              <p>Uso proceso: {formatBytes(status?.node?.memory?.rss)}</p>
              <p>Heap usado: {formatBytes(status?.node?.memory?.heapUsed)} / {formatBytes(status?.node?.memory?.heapTotal)}</p>
              <p>Servidor: {formatBytes(memoryUsage.used)} / {formatBytes(memoryUsage.total)}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Marca de tiempo</CardTitle>
              <RefreshCcw className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-900">
              <p>Última lectura: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : "–"}</p>
              <p>Auto-refresh cada 8s</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <TerminalSquare className="h-5 w-5" />
              Logs en vivo (error.log)
            </CardTitle>
            <CardDescription className="text-slate-600">
              Últimas líneas combinadas de los archivos de log disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-950/95 text-slate-100 text-xs font-mono p-3">
              {logs.length === 0 && <p className="text-slate-400">Sin registros recientes.</p>}
              {logs.map((line, idx) => (
                <div key={`${line}-${idx}`} className="whitespace-pre">
                  {line}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
