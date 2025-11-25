"use client";

import { Fragment, ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from "@/lib/http";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Camera,
  FileText,
  HardDrive,
  ShieldCheck,
  Cloud,
  Eye,
  FileArchive,
  Trash2,
  Edit,
  Upload,
  FolderArchive,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { toast } from "sonner";
import { Client } from "@/types/client";
import {
  RepositoryCategory,
  RepositoryEntry,
  RepositoryEntryPayload,
  fetchRepositoryEntries,
  createRepositoryEntry,
  updateRepositoryEntry,
  deleteRepositoryEntry,
} from "@/lib/api-repository";

const categoryIcons = {
  Foto: Camera,
  Documento: FileText,
  Backup: HardDrive,
  Credencial: ShieldCheck,
  Otro: Cloud,
};

const categoryHighlights = {
  Foto: "bg-pink-100 text-pink-700",
  Documento: "bg-cyan-100 text-cyan-700",
  Backup: "bg-amber-100 text-amber-700",
  Credencial: "bg-emerald-100 text-emerald-700",
  Otro: "bg-slate-100 text-slate-700",
};

const getDefaultPayload = (): RepositoryEntryPayload => ({
  name: "",
  type: "",
  category: "Documento",
  format: "Texto plano",
  credential: "",
  notes: "",
  content: "",
  fileName: "",
});

const entryToPayload = (entry: RepositoryEntry): RepositoryEntryPayload => ({
  name: entry.name,
  type: entry.type,
  category: entry.category,
  format: entry.format,
  credential: entry.credential,
  notes: entry.notes,
  content: entry.content,
  fileName: entry.fileName,
});

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntry?: RepositoryEntry;
  onSave: (payload: RepositoryEntryPayload, entryId?: string) => void;
}

function EntryModal({
  open,
  onOpenChange,
  initialEntry,
  onSave,
}: EntryModalProps) {
  const [form, setForm] = useState<RepositoryEntryPayload>(getDefaultPayload);

  useEffect(() => {
    if (!open) return;
    if (initialEntry) {
      setForm(entryToPayload(initialEntry));
    } else {
      setForm(getDefaultPayload());
    }
  }, [initialEntry, open]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        format: `${file.type || "Archivo"} · ${Math.round(file.size / 1024)}KB`,
      }));
    }
  };

  const handleSubmit = () => {
    onSave(form, initialEntry?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialEntry ? "Editar documento del repositorio" : "Nuevo archivo del repositorio"}
          </DialogTitle>
          <DialogDescription>
            Puedes subir fotos, textos enriquecidos (Markdown/TXT), backups o credenciales. Los contenidos se guardan
            directamente en la base y pueden editarse en línea.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Nombre descriptivo"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            placeholder="Tipo (ej. Respaldo, Acceso)"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded-md border px-3 py-2"
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value as RepositoryCategory,
                })
              }
            >
              {(["Foto", "Documento", "Backup", "Credencial", "Otro"] as RepositoryCategory[]).map(
                (category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                )
              )}
            </select>
            <Input
              placeholder="Formato (ej. JPEG · 24MB)"
              value={form.format}
              onChange={(event) => setForm({ ...form, format: event.target.value })}
            />
            <Input
              placeholder="Credencial / ruta / link"
              value={form.credential}
              onChange={(event) => setForm({ ...form, credential: event.target.value })}
            />
          </div>
          <Input type="file" onChange={handleFileChange} />
          <Textarea
            className="min-h-[120px]"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            placeholder="Escribe aquí documentación enriquecida o markdown que la app debe recordar."
          />
          <Textarea
            className="min-h-[80px]"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Notas, contexto o recordatorios para el equipo técnico."
          />
        </div>
        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {form.fileName ? `Archivo seleccionado: ${form.fileName}` : "Sin archivo adjunto aún"}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <Upload className="mr-1 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RepositoryPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Record<string, RepositoryEntry[]>>({});
  const [modalState, setModalState] = useState<{
    open: boolean;
    clientId: string;
    entry?: RepositoryEntry;
  }>({ open: false, clientId: "" });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    clientId: string;
    entry?: RepositoryEntry;
  }>({ open: false, clientId: "" });

  const filtered = useMemo(() => {
    if (!query) return clients;
    return clients.filter((client) => client.name.toLowerCase().includes(query.toLowerCase()));
  }, [clients, query]);

  const loadRepositoryForClient = useCallback(async (clientId: string) => {
    try {
      const data = await fetchRepositoryEntries(clientId);
      setEntries((prev) => ({ ...prev, [clientId]: data }));
    } catch (error) {
      console.error("Error al cargar el repositorio del cliente", error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los clientes");
        setClients(await response.json());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error al cargar clientes del repositorio", error);
      }
    };
    loadClients();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!filtered.length) return;
    filtered.forEach((client) => {
      loadRepositoryForClient(client.id);
    });
  }, [filtered, loadRepositoryForClient]);

  const openNewEntryModal = (clientId: string) => {
    setModalState({ open: true, clientId });
  };

  const openEditEntryModal = (clientId: string, entry: RepositoryEntry) => {
    setModalState({ open: true, clientId, entry });
  };

  const totalEntries = useMemo(() => {
    return filtered.reduce((acc, client) => acc + (entries[client.id]?.length ?? 0), 0);
  }, [filtered, entries]);

  const handleSaveEntry = async (payload: RepositoryEntryPayload, entryId?: string) => {
    const name = payload.name.trim();
    const type = payload.type.trim();
    if (!name || !type) {
      toast.error("Debes completar el nombre y el tipo del archivo.");
      return;
    }
    payload = { ...payload, name, type };
    const clientId = modalState.clientId;
    try {
      const saved = entryId
        ? await updateRepositoryEntry(entryId, payload)
        : await createRepositoryEntry(clientId, payload);
      setEntries((prev) => {
        const list = prev[clientId] ?? [];
        const exists = list.some((item) => item.id === saved.id);
        const updated = exists ? list.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...list];
        return { ...prev, [clientId]: updated };
      });
    } catch (error) {
      toast.error("No se pudo guardar el archivo del repositorio.");
      console.error("Save repository entry failed", error);
    }
  };

  const handleDeleteEntry = async (clientId: string, entryId: string) => {
    try {
      await deleteRepositoryEntry(entryId);
      setEntries((prev) => {
        const list = prev[clientId] ?? [];
        return { ...prev, [clientId]: list.filter((entry) => entry.id !== entryId) };
      });
    } catch (error) {
      toast.error("No se pudo eliminar el archivo.");
      console.error("Delete repository entry failed", error);
    }
  };

  const confirmDeleteEntry = async () => {
    if (deleteState.entry) {
      await handleDeleteEntry(deleteState.clientId, deleteState.entry.id);
    }
    setDeleteState({ open: false, clientId: "", entry: undefined });
  };

  return (
    <DashboardLayout>
      <EntryModal
        open={modalState.open}
        onOpenChange={(open) =>
          setModalState((state) => ({
            ...state,
            open,
            entry: open ? state.entry : undefined,
          }))
        }
        initialEntry={modalState.entry}
        onSave={handleSaveEntry}
      />
      <AlertDialog
        open={deleteState.open}
        onOpenChange={(open) => setDeleteState((state) => ({ ...state, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo del repositorio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el archivo{" "}
              <span className="font-semibold">{deleteState.entry?.name}</span>
              <br />
              y su historial de notas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDeleteEntry}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600">
              <FolderArchive className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <ShinyText size="3xl" weight="bold">Bóveda de archivos</ShinyText>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Fotos · Backups · Credenciales</Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Esta sección es la bóveda del cliente: aquí se respaldan imágenes, documentos,
            copias de configuración y credenciales seguras. Todo queda listo para restaurar
            dispositivos o compartir accesos desde el panel sin salir del flujo.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <Cloud className="h-3.5 w-3.5" />
              {totalEntries} archivos disponibles
            </span>
            <span className="flex items-center gap-1">
              <FileArchive className="h-3.5 w-3.5" />
              Actualizados continuamente
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Control de accesos y notas descriptivas
            </span>
          </div>
        </div>
        <div className="relative max-w-md">
          <Input
            placeholder="Buscar cliente..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pr-10"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => filtered[0] && openNewEntryModal(filtered[0].id)}
            disabled={!filtered.length}
          >
            <Upload className="h-4 w-4" />
            Subir foto / documento
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => filtered[0] && openNewEntryModal(filtered[0].id)}
            disabled={!filtered.length}
          >
            <ShieldCheck className="h-4 w-4" />
            Registrar credenciales
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="border-slate-200 bg-gradient-to-bl from-white via-slate-50 to-slate-100 shadow-lg"
            >
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{client.name}</CardTitle>
                <Badge variant="secondary">{entries[client.id]?.length ?? 0} registros</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs uppercase text-slate-500">
                  <span>
                    {entries[client.id]?.length ? "Contenidos sincronizados" : "Sin archivos aún"}
                  </span>
                  <span>Actualizado {new Date().toLocaleDateString()}</span>
                </div>
                <div className="space-y-3">
                  {(entries[client.id] ?? []).map((entry) => {
                    const Icon = categoryIcons[entry.category] ?? Cloud;
                    const highlight = categoryHighlights[entry.category];
                    return (
                      <Fragment key={entry.id}>
                        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${highlight}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{entry.name}</p>
                                <p className="text-xs text-muted-foreground">{entry.format}</p>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500">{entry.updatedAt}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{entry.category}</Badge>
                            <Badge variant="outline">{entry.type}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-slate-600">{entry.notes}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">{entry.credential}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Contenido: {entry.content.slice(0, 80)}...</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditEntryModal(client.id, entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setDeleteState({ open: true, clientId: client.id, entry })
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                  {!entries[client.id]?.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
                      No hay archivos aún. Usa “Subir foto / documento” para agregar respaldos, fotos o cronogramas de configuración.
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openNewEntryModal(client.id)}>
                    Nueva captura
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openNewEntryModal(client.id)}>
                    Editar repositorio completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
