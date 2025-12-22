"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  HardDrive,
  Download,
  Trash2,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { API_URL } from "@/lib/http";

interface Backup {
  name: string;
  createdAt: string;
  metadata?: {
    database?: string;
    timestamp?: string;
    collections?: Record<string, { documents?: number; error?: string }>;
  };
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/database/backup/list`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        toast.error("Error al cargar respaldos");
      }
    } catch (error) {
      console.error("Error loading backups:", error);
      toast.error("Error al cargar respaldos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/database/backup/create`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("No se pudo crear el respaldo");
      }

      const data = await response.json();
      toast.success(`Respaldo creado: ${data.backupName}`);
      
      // Reload backups
      await loadBackups();
    } catch (error: any) {
      console.error("Error creating backup:", error);
      toast.error(error.message || "Error al crear respaldo");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!deleteTarget) return;

    try {
      const response = await fetch(
        `${API_URL}/database/backup/delete/${deleteTarget}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar el respaldo");
      }

      toast.success("Respaldo eliminado");
      setDeleteDialog(false);
      setDeleteTarget(null);
      await loadBackups();
    } catch (error: any) {
      console.error("Error deleting backup:", error);
      toast.error(error.message || "Error al eliminar respaldo");
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreTarget) return;

    try {
      const response = await fetch(`${API_URL}/database/backup/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupName: restoreTarget }),
      });

      if (!response.ok) {
        throw new Error("No se pudo restaurar el respaldo");
      }

      const data = await response.json();
      toast.success("Base de datos restaurada correctamente");
      setRestoreDialog(false);
      setRestoreTarget(null);
    } catch (error: any) {
      console.error("Error restoring backup:", error);
      toast.error(error.message || "Error al restaurar respaldo");
    }
  };

  const handleDownloadBackup = (backupName: string) => {
    const link = document.createElement("a");
    link.href = `${API_URL}/database/backup/download/${backupName}`;
    link.download = `${backupName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Crear Respaldo
              </CardTitle>
              <CardDescription>
                Crea un respaldo completo de la base de datos actual
              </CardDescription>
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={creating}
              size="lg"
              className="gap-2"
            >
              {creating && <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {creating ? "Creando..." : "Crear Respaldo"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Respaldos Disponibles</CardTitle>
          <CardDescription>
            {backups.length} respaldo{backups.length !== 1 ? "s" : ""} guardado{backups.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <HardDrive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay respaldos guardados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.name}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-slate-50 transition"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{backup.name}</p>
                      {backup.metadata?.collections && (
                        <Badge variant="secondary" className="text-xs">
                          {Object.keys(backup.metadata.collections).length} colecciones
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(backup.createdAt)}
                      </span>
                      {backup.metadata?.collections && (
                        <span>
                          📊{" "}
                          {Object.values(backup.metadata.collections).reduce(
                            (sum, col) => sum + (col.documents || 0),
                            0
                          )}{" "}
                          documentos
                        </span>
                      )}
                    </div>

                    {/* Collections Summary */}
                    {backup.metadata?.collections && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-slate-600">Colecciones:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(backup.metadata.collections).map(
                            ([name, info]) => (
                              <div
                                key={name}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-xs text-slate-700"
                              >
                                {info.error ? (
                                  <>
                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                    {name}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {name} ({info.documents || 0})
                                  </>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadBackup(backup.name)}
                      title="Descargar respaldo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRestoreTarget(backup.name);
                        setRestoreDialog(true);
                      }}
                      title="Restaurar respaldo"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDeleteTarget(backup.name);
                        setDeleteDialog(true);
                      }}
                      title="Eliminar respaldo"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Eliminar Respaldo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el respaldo "{deleteTarget}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog(false);
                setDeleteTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBackup}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              Restaurar Respaldo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas restaurar el respaldo "{restoreTarget}"?
              Esto sobrescribirá los datos actuales de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialog(false);
                setRestoreTarget(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRestoreBackup}
            >
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
