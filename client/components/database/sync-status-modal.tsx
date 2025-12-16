"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, ArrowDown, CheckCircle2, AlertCircle, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SyncStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceServer: any | null;
  targetServers: any[];
  syncing: boolean;
  syncProgress?: number;
  onConfirm: () => void;
}

interface ServerComparison {
  id: string;
  name: string;
  host: string;
  database: string;
  status: "online" | "offline";
  collections: {
    total: number;
    synced: number;
  };
  needsSync: boolean;
}

export function SyncStatusModal({
  open,
  onOpenChange,
  sourceServer,
  targetServers,
  syncing,
  syncProgress = 0,
  onConfirm,
}: SyncStatusModalProps) {
  if (!sourceServer) {
    return null;
  }

  const getSyncStatusColor = (needsSync: boolean) => {
    return needsSync ? "text-amber-600" : "text-emerald-600";
  };

  const getSyncStatusBg = (needsSync: boolean) => {
    return needsSync ? "bg-amber-50" : "bg-emerald-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-slate-900" />
            Sincronizar Bases de Datos
          </DialogTitle>
          <DialogDescription>
            Copia los datos desde la primaria a los servidores secundarios seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Servidor Primaria */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Servidor Primario (Origen)
            </h3>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-lg border-2 border-emerald-500 p-4",
                "bg-gradient-to-br from-emerald-50 to-emerald-50/50"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{sourceServer.name}</div>
                  <div className="text-sm text-slate-600 font-mono">
                    {sourceServer.host}:{sourceServer.port} / {sourceServer.database}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    {sourceServer.collections?.total || 0} colecciones • {sourceServer.collections?.total ? (sourceServer.collections.total * 100).toFixed(0) : 0}% completadas
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white">
                  {sourceServer.connectionStatus === "online" ? "Online" : "Offline"}
                </Badge>
              </div>
            </motion.div>
          </div>

          {/* Servidores Secundarios */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-400" />
              Servidores Secundarios (Destinos)
            </h3>
            
            <div className="space-y-3">
              {targetServers.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-500">
                  Selecciona servidores para sincronizar
                </div>
              ) : (
                targetServers.map((server, index) => {
                  const needsSync = server.collections?.synced < server.collections?.total;
                  
                  return (
                    <motion.div
                      key={server.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "rounded-lg border p-4 transition-all",
                        needsSync
                          ? "border-amber-200 bg-amber-50/50"
                          : "border-emerald-200 bg-emerald-50/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900">{server.name}</div>
                            <Badge 
                              className={cn(
                                "text-xs",
                                needsSync
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              )}
                            >
                              {needsSync ? "Pendiente" : "Sincronizado"}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 font-mono mt-1">
                            {server.host}:{server.port} / {server.database}
                          </div>

                          {/* Barra de progreso de sincronización */}
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>Colecciones sincronizadas</span>
                              <span className="font-semibold">
                                {server.collections?.synced || 0}/{server.collections?.total || 0}
                              </span>
                            </div>
                            <Progress
                              value={
                                server.collections?.total
                                  ? (server.collections.synced / server.collections.total) * 100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        </div>

                        {/* Estado de conexión */}
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "border-current text-xs",
                              server.connectionStatus === "online"
                                ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                                : "border-red-500 text-red-700 bg-red-50"
                            )}
                          >
                            {server.connectionStatus === "online" ? "Conectado" : "Desconectado"}
                          </Badge>

                          {needsSync && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs font-semibold">Necesita sync</span>
                            </div>
                          )}
                          {!needsSync && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-semibold">Al día</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Estado de sincronización en tiempo real */}
          {syncing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-sky-200 bg-sky-50 p-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-5 w-5 text-sky-600" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-sky-900 text-sm">Sincronizando datos...</p>
                  <p className="text-xs text-sky-700 mt-1">Copiando colecciones desde primaria a servidores secundarios</p>
                  <Progress
                    value={syncProgress}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-sky-700 mt-1">{syncProgress}% completado</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Nota informativa */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">💡 Nota:</span> Se copiarán todas las colecciones de la base primaria. Los datos existentes en los servidores secundarios serán reemplazados.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={syncing}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={syncing || targetServers.length === 0}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <ArrowDown className="mr-2 h-4 w-4" />
                Iniciar Sincronización
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
