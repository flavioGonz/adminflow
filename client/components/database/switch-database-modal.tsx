"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwitchDatabaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentServer: any | null;
  targetServer: any | null;
  loading: boolean;
  onConfirm: () => void;
}

export function SwitchDatabaseModal({
  open,
  onOpenChange,
  currentServer,
  targetServer,
  loading,
  onConfirm,
}: SwitchDatabaseModalProps) {
  if (!currentServer || !targetServer) {
    return null;
  }

  const getStatusColor = (status: string) => {
    return status === "online" ? "text-emerald-600" : "text-red-600";
  };

  const getStatusBg = (status: string) => {
    return status === "online" ? "bg-emerald-50" : "bg-red-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-slate-900 animate-pulse" />
            Cambiar Base de Datos Primaria
          </DialogTitle>
          <DialogDescription>
            Revisa los detalles antes de activar la nueva base como primaria. Esta acción no elimina datos.
          </DialogDescription>
        </DialogHeader>

        {/* Comparación lado a lado */}
        <div className="grid grid-cols-2 gap-4 py-6">
          {/* Base actual */}
          <div className={cn(
            "rounded-lg border-2 p-4 transition-all duration-300",
            currentServer.current ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50"
          )}>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Base Actual</p>
                <h3 className="text-lg font-bold text-slate-900">{currentServer.name}</h3>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Activa</Badge>
            </div>

            <div className="space-y-3">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Host</p>
                <p className="text-sm font-mono text-slate-900">{currentServer.host}:{currentServer.port}</p>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Base de Datos</p>
                <p className="text-sm font-mono text-slate-900">{currentServer.database}</p>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", getStatusColor(currentServer.connectionStatus) === "text-emerald-600" ? "bg-emerald-600" : "bg-red-600")} />
                  <p className={cn("text-sm font-semibold", getStatusColor(currentServer.connectionStatus))}>
                    {currentServer.connectionStatus === "online" ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Colecciones</p>
                {currentServer.collections ? (
                  <div className="flex items-center gap-2">
                    {currentServer.collections.complete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm text-emerald-700 font-semibold">Todas completas ({currentServer.collections.total})</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-700 font-semibold">{currentServer.collections.missing.length} faltantes</p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Flecha de cambio */}
          <div className="flex items-center justify-center">
            <div className="relative w-full h-1 bg-gradient-to-r from-blue-300 via-slate-300 to-emerald-300 rounded-full mb-8">
              <ArrowRight className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-slate-700 bg-white rounded-full p-1" />
            </div>
          </div>

          {/* Base nueva */}
          <div className={cn(
            "rounded-lg border-2 p-4 transition-all duration-300",
            "border-emerald-300 bg-emerald-50"
          )}>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nueva Primaria</p>
                <h3 className="text-lg font-bold text-slate-900">{targetServer.name}</h3>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">Será primaria</Badge>
            </div>

            <div className="space-y-3">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Host</p>
                <p className="text-sm font-mono text-slate-900">{targetServer.host}:{targetServer.port}</p>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Base de Datos</p>
                <p className="text-sm font-mono text-slate-900">{targetServer.database}</p>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", getStatusColor(targetServer.connectionStatus) === "text-emerald-600" ? "bg-emerald-600" : "bg-red-600")} />
                  <p className={cn("text-sm font-semibold", getStatusColor(targetServer.connectionStatus))}>
                    {targetServer.connectionStatus === "online" ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-white p-3">
                <p className="text-xs text-slate-600 font-semibold mb-1">Colecciones</p>
                {targetServer.collections ? (
                  <div className="flex items-center gap-2">
                    {targetServer.collections.complete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm text-emerald-700 font-semibold">Todas completas ({targetServer.collections.total})</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm text-red-700 font-semibold">{targetServer.collections.missing.length} faltantes</p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Nota:</span> Se creará automáticamente cualquier colección faltante en la nueva primaria. Los datos no serán eliminados.
          </p>
        </div>

        {/* Actions */}
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Cambiando..." : "Confirmar cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
