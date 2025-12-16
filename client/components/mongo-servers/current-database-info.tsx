"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MongoServer {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  uri: string;
  active: boolean;
  description?: string;
}

interface ServerStatus {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  active: boolean;
  current: boolean;
  connectionStatus: 'online' | 'offline' | 'error' | 'unknown';
  collections: {
    existing: string[];
    missing: string[];
    required: string[];
    total: number;
    complete: boolean;
  } | null;
  description?: string;
}

interface CurrentDatabaseInfoProps {
  currentServer: MongoServer | null;
  currentStatus: ServerStatus | null;
  onMirrorToggle: (enabled: boolean) => void;
  onBackupToggle: (enabled: boolean) => void;
  onCopyData: () => void;
  mirrorEnabled: boolean;
  backupEnabled: boolean;
  isLoading?: boolean;
}

export function CurrentDatabaseInfo({
  currentServer,
  currentStatus,
  onMirrorToggle,
  onBackupToggle,
  onCopyData,
  mirrorEnabled,
  backupEnabled,
  isLoading = false,
}: CurrentDatabaseInfoProps) {
  const isOnline = currentStatus?.connectionStatus === 'online';

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Base de Datos Actual</CardTitle>
              <CardDescription>
                Información de la instancia MongoDB conectada
              </CardDescription>
            </div>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"} className="gap-1.5">
            {isOnline ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                En línea
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                Sin conexión
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Información del Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <div className="flex items-start gap-3">
              <Server className="h-5 w-5 text-slate-600 mt-1" />
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-semibold text-slate-900">
                  Servidor
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  {currentServer?.name || "No disponible"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <div>
              <Label className="text-sm font-semibold text-slate-900">
                Ubicación
              </Label>
              <p className="text-sm text-slate-600 mt-1 font-mono">
                {currentServer?.host}:{currentServer?.port}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <div>
              <Label className="text-sm font-semibold text-slate-900">
                Base de Datos
              </Label>
              <p className="text-sm text-slate-600 mt-1 font-mono">
                {currentServer?.database || "No especificada"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 bg-white">
            <div>
              <Label className="text-sm font-semibold text-slate-900">
                Colecciones
              </Label>
              <p className="text-sm text-slate-600 mt-1">
                {currentStatus?.collections
                  ? `${currentStatus.collections.existing.length} / ${currentStatus.collections.total}`
                  : "Cargando..."}
              </p>
            </div>
          </div>
        </div>

        {currentServer?.description && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Label className="text-sm font-semibold text-slate-900">
              Descripción
            </Label>
            <p className="text-sm text-slate-600 mt-2">
              {currentServer.description}
            </p>
          </div>
        )}

        {/* Controles de Modo */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">
                Espejo de Datos
              </Label>
              <p className="text-sm text-slate-600">
                Sincronizar datos entre bases en tiempo real
              </p>
            </div>
            <Switch
              checked={mirrorEnabled}
              onCheckedChange={onMirrorToggle}
              disabled={isLoading || !isOnline}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex-1">
              <Label className="font-medium text-slate-900">
                Modo Respaldo
              </Label>
              <p className="text-sm text-slate-600">
                Activar respaldos automáticos periódicos
              </p>
            </div>
            <Switch
              checked={backupEnabled}
              onCheckedChange={onBackupToggle}
              disabled={isLoading || !isOnline}
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button
            onClick={onCopyData}
            disabled={isLoading || !isOnline}
            className="flex-1 gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Datos
          </Button>
          <Button
            variant="outline"
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {/* Estado de Toggles */}
        {(mirrorEnabled || backupEnabled) && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div className="text-sm text-emerald-800">
                {mirrorEnabled && <p>✓ Espejo de datos activo</p>}
                {backupEnabled && <p>✓ Respaldos automáticos activos</p>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
