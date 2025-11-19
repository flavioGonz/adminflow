"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock4,
  Edit,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Mic,
  Paperclip,
  PlayCircle,
  Send,
  Trash2,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import {
  Ticket,
  TicketAttachment,
  TicketAudioNote,
  TicketPriority,
  TicketStatus,
} from "@/types/ticket";
import { API_URL } from "@/lib/http";

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("es-AR", {
      timeZone: "America/Montevideo",
    })
    : "--";

const formatBytes = (value?: number) => {
  if (!value || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let size = value;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${Math.round(size)} ${units[index]}`;
};

type TicketAnnotation = NonNullable<Ticket["annotations"]>[number];

const getStatusBadgeVariant = (value: TicketStatus) => {
  if (value === "Resuelto") return "secondary";
  if (value === "Facturar") return "destructive";
  if (value === "Visita") return "outline";
  return "default";
};

const getPriorityBadgeVariant = (value: TicketPriority) => {
  if (value === "Alta") return "destructive";
  if (value === "Media") return "outline";
  return "secondary";
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<TicketStatus>("Nuevo");
  const [formPriority, setFormPriority] = useState<TicketPriority>("Media");
  const [formVisit, setFormVisit] = useState(false);
  const [formAmount, setFormAmount] = useState<number | undefined>();
  const [formCurrency, setFormCurrency] = useState<"UYU" | "USD">("UYU");
  const [formDescription, setFormDescription] = useState("");
  const [formAnnotations, setFormAnnotations] = useState<Ticket["annotations"]>(
    []
  );
  const [notifyClient, setNotifyClient] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    TicketAttachment[]
  >([]);
  const [pendingAudioNotes, setPendingAudioNotes] = useState<
    TicketAudioNote[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TicketAnnotation | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteDialogNote, setDeleteDialogNote] = useState<TicketAnnotation | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number>(0);

  const toggleLock = useCallback(() => {
    setIsLocked((prev) => !prev);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTicket = async () => {
      if (!params?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/tickets/${params.id}`,
          {
            signal: controller.signal,
          }
        );
        if (!response.ok) {
          throw new Error("No se pudo cargar el ticket solicitado.");
        }
        const data = (await response.json()) as Ticket;
        setTicket(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar el ticket.";
        setError(message);
        toast.error(message);
        console.error("Error fetching ticket:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
    return () => controller.abort();
  }, [params?.id]);

  useEffect(() => {
    if (!ticket) return;
    setFormStatus(ticket.status);
    setFormPriority(ticket.priority);
    setFormVisit(Boolean(ticket.visit));
    setFormAmount(ticket.amount);
    setFormCurrency(ticket.amountCurrency ?? "UYU");
    setFormDescription(ticket.description ?? "");
    setFormAnnotations(ticket.annotations ?? []);
  }, [ticket]);

  const metrics = useMemo(
    () => [
      {
        label: "Anotaciones",
        value: `${formAnnotations?.length ?? 0}`,
        meta: "registros",
      },
      {
        label: "Adjuntos",
        value: `${pendingAttachments.length}`,
        meta: "archivos en cola",
      },
      {
        label: "Notas de audio",
        value: `${pendingAudioNotes.length}`,
        meta: "grabaciones en cola",
      },
      {
        label: "Visita",
        value: formVisit ? "Programada" : "Pendiente",
        meta: "estado",
      },
    ],
    [
      formAnnotations,
      pendingAttachments.length,
      pendingAudioNotes.length,
      formVisit,
    ]
  );

  const sortedAnnotations = useMemo(() => {
    return [...(formAnnotations ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [formAnnotations]);

  const handleSave = useCallback(
    async (overrides?: { annotations?: Ticket["annotations"] }) => {
      if (!ticket) return;
      setIsSaving(true);
      try {
        const response = await fetch(
          `${API_URL}/tickets/${ticket.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: formStatus,
              priority: formPriority,
              visit: formVisit,
              amount: formAmount,
              amountCurrency: formCurrency,
              description: formDescription,
              annotations: overrides?.annotations ?? formAnnotations,
              notifyClient,
            }),
          }
        );
        if (!response.ok) {
          const serverMessage = await response.text();
          throw new Error(
            serverMessage || "No se pudo guardar el ticket."
          );
        }
        const updated = (await response.json()) as Ticket;
        setTicket(updated);
        setFormAnnotations(updated.annotations ?? []);
        setFormStatus(updated.status);
        setFormPriority(updated.priority);
        setFormVisit(Boolean(updated.visit));
        setFormAmount(updated.amount);
        setFormCurrency(updated.amountCurrency ?? "UYU");
        setFormDescription(updated.description ?? "");
        toast.success("Ficha actualizada correctamente.");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al guardar los cambios.";
        toast.error(message);
        console.error("Error saving ticket:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [
      ticket,
      formStatus,
      formPriority,
      formVisit,
      formAmount,
      formCurrency,
      formDescription,
      formAnnotations,
      notifyClient,
    ]
  );

  const handleRegisterNote = useCallback(() => {
    const cleaned = noteDraft.replace(/<[^>]+>/g, "").trim();
    const hasContent =
      Boolean(cleaned) ||
      pendingAttachments.length > 0 ||
      pendingAudioNotes.length > 0;

    if (!hasContent) {
      toast.error(
        "Agrega texto, archivos o notas de voz antes de registrar la actividad."
      );
      return;
    }

    const newAnnotation = {
      text: noteDraft,
      createdAt: new Date().toISOString(),
      user: "Técnico Admin",
      attachments: pendingAttachments,
      audioNotes: pendingAudioNotes,
    };

    const updatedAnnotations = [newAnnotation, ...(formAnnotations ?? [])];
    setFormAnnotations(updatedAnnotations);
    void handleSave({ annotations: updatedAnnotations }).then(() => {
      setNoteDraft("");
      setPendingAttachments([]);
      setPendingAudioNotes([]);
    });
  }, [
    noteDraft,
    pendingAttachments,
    pendingAudioNotes,
    formAnnotations,
    handleSave,
  ]);

  const handleOpenEditDialog = useCallback(
    (note: TicketAnnotation) => {
      setEditingNote(note);
      setEditDraft(note.text);
      setEditDialogOpen(true);
    },
    []
  );

  const handleSaveEditedNote = useCallback(() => {
    if (!editingNote) return;
    const updated = formAnnotations?.map((annotation) =>
      annotation.createdAt === editingNote.createdAt
        ? { ...annotation, text: editDraft }
        : annotation
    );
    setFormAnnotations(updated ?? []);
    setEditDialogOpen(false);
    setEditingNote(null);
    void handleSave({ annotations: updated });
  }, [editDraft, editingNote, formAnnotations, handleSave]);

  const handleOpenDeleteDialog = useCallback(
    (note: TicketAnnotation) => {
      setDeleteDialogNote(note);
      setConfirmDeleteOpen(true);
    },
    []
  );

  const handleDeleteAnnotation = useCallback(
    (createdAt: string) => {
      const updated =
        formAnnotations?.filter(
          (annotation) => annotation.createdAt !== createdAt
        ) ?? [];
      setFormAnnotations(updated);
      void handleSave({ annotations: updated });
    },
    [formAnnotations, handleSave]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteDialogNote) return;
    handleDeleteAnnotation(deleteDialogNote.createdAt);
    setConfirmDeleteOpen(false);
    setDeleteDialogNote(null);
  }, [deleteDialogNote, handleDeleteAnnotation]);

  const uploadAttachments = useCallback(async (files: FileList) => {
    try {
      const readers = Array.from(files).map(
        (file) =>
          new Promise<TicketAttachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: reader.result as string,
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );
      const newFiles = await Promise.all(readers);
      setPendingAttachments((prev) => [...prev, ...newFiles]);
    } catch (err) {
      console.error("Attachment upload error:", err);
      toast.error("No se pudieron subir los archivos.");
    }
  }, []);

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      uploadAttachments(files);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length) {
      uploadAttachments(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartRef.current = Date.now();

      recorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const duration = recordingStartRef.current
          ? Math.round((Date.now() - recordingStartRef.current) / 1000)
          : undefined;
        const newNote: TicketAudioNote = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          dataUrl: url,
          durationSeconds: duration,
        };
        setPendingAudioNotes((prev) => [...prev, newNote]);
      });

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("No se pudo iniciar la grabación.");
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
    setIsRecording(false);
  }, []);

  const handlePlayAudio = useCallback((note: TicketAudioNote) => {
    const source = note.url ?? note.dataUrl;
    if (!source) {
      toast.error("No encontramos el audio para reproducir.");
      return;
    }
    const audio = new Audio(source);
    audio.play().catch((err) => {
      console.error("Audio playback error:", err);
      toast.error("No se pudo reproducir la nota de voz.");
    });
  }, []);

  const handleOpenAttachment = useCallback((attachment: TicketAttachment) => {
    window.open(attachment.url ?? attachment.dataUrl ?? "#", "_blank");
  }, []);

  const handleRemovePendingAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== id)
    );
  }, []);

  const handleRemovePendingAudio = useCallback((id: string) => {
    setPendingAudioNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <Button
          variant="link"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/tickets")}
        >
          Volver al listado
        </Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No encontramos el ticket solicitado.{" "}
        <button
          type="button"
          className="text-primary underline"
          onClick={() => router.push("/tickets")}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const contractTitle = ticket.contractTitle ?? "Sin contrato activo";
  const contractSla = ticket.contractSla ?? "SLA pendiente";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/tickets">
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 rounded-full border border-slate-200 px-3 py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground">ID: {ticket.id}</p>
            <p className="text-sm text-muted-foreground">
              Cliente: {ticket.clientName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge
            variant={getStatusBadgeVariant(formStatus)}
            className="text-sm uppercase"
          >
            {formStatus}
          </Badge>
          <Badge
            variant={getPriorityBadgeVariant(formPriority)}
            className="text-sm uppercase"
          >
            {formPriority}
          </Badge>
          {formVisit && (
            <Badge variant="outline" className="text-sm uppercase">
              Visita
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col px-4 py-1 text-left text-sm text-slate-700"
            >
              <span className="text-lg font-semibold text-slate-900">
                {metric.value}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                {metric.label}
              </span>
              <span className="text-[10px] text-slate-500">{metric.meta}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => handleSave()} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Registrar actividad</p>
              <p className="text-xs text-muted-foreground">
                Documenta cada paso del técnico en el ticket.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Último registro {sortedAnnotations[0] ? formatDateTime(sortedAnnotations[0].createdAt) : "--"}
            </span>
          </div>
          <RichTextEditor
            value={noteDraft}
            onChange={setNoteDraft}
            placeholder="Describe la intervención, acciones, resultados o bloqueos."
            direction="ltr"
            className="min-h-[220px]"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="gap-2"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
              >
                <Mic className="h-4 w-4" />
                {isRecording ? "Detener grabación" : "Grabar nota de voz"}
              </Button>

              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
                <Checkbox
                  id="notifyClient"
                  checked={notifyClient}
                  onCheckedChange={(checked) => setNotifyClient(Boolean(checked))}
                />
                <Label htmlFor="notifyClient" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                  <Send className="h-3 w-3 text-muted-foreground" />
                  Notificar al cliente
                </Label>
              </div>
            </div>
            <Button
              className="ml-auto"
              onClick={handleRegisterNote}
              disabled={isSaving || isRecording}
            >
              Registrar actividad
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 p-4 text-center text-sm text-muted-foreground transition hover:border-primary/70"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileInputChange}
                />
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <p>Arrastra archivos o toca para seleccionarlos</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  Subir adjuntos
                </Button>
              </label>
              <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-slate-50 px-3 py-3 text-sm text-slate-700 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">
                    Adjuntos
                  </span>
                  <span>{pendingAttachments.length} en cola</span>
                </div>
                <div className="space-y-2 overflow-y-auto">
                  {pendingAttachments.length ? (
                    pendingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"
                      >
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4 text-slate-500" />
                          <div>
                            <p className="font-medium text-slate-900">
                              {attachment.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatBytes(attachment.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() =>
                            handleRemovePendingAttachment(attachment.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sin adjuntos todavía.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-border/70 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">
                  Notas de voz
                </span>
                <span>{pendingAudioNotes.length} grabaciones</span>
              </div>
              <div className="space-y-2">
                {pendingAudioNotes.length ? (
                  pendingAudioNotes.map((audio) => (
                    <div
                      key={audio.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"
                    >
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-slate-500" />
                        <div className="text-[11px]">
                          {formatDateTime(audio.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayAudio(audio)}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemovePendingAudio(audio.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No hay notas de voz grabadas.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Detalles del ticket</p>
              <p className="text-xs text-muted-foreground">
                Los campos están {isLocked ? "bloqueados" : "listos para editar"}.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={toggleLock}
            >
              {isLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formStatus}
                  onValueChange={(value) =>
                    setFormStatus(value as TicketStatus)
                  }
                  disabled={isLocked}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Nuevo", "Abierto", "En proceso", "Visita", "Resuelto", "Facturar"].map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formPriority}
                  onValueChange={(value) =>
                    setFormPriority(value as TicketPriority)
                  }
                  disabled={isLocked}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Selecciona prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Alta", "Media", "Baja"].map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-name">Cliente</Label>
                <Input
                  id="client-name"
                  value={ticket.clientName}
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto estimado</Label>
                <div className="flex gap-3">
                  <Input
                    id="amount"
                    type="number"
                    value={formAmount ?? ""}
                    onChange={(event) =>
                      setFormAmount(
                        event.target.value
                          ? Number(event.target.value)
                          : undefined
                      )
                    }
                    placeholder="Ej: 2500"
                    disabled={isLocked}
                  />
                  <Select
                    value={formCurrency}
                    onValueChange={(value) =>
                      setFormCurrency(value as "UYU" | "USD")
                    }
                    disabled={isLocked}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYU">UYU</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-description">Descripción</Label>
              <Textarea
                id="ticket-description"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                rows={5}
                placeholder="Documenta el problema, pasos relevantes y prioridades."
                disabled={isLocked}
              />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock4 className="h-3 w-3 text-slate-400" />
                Creado el {formatDateTime(ticket.createdAt)}
              </Badge>
              <Badge
                variant={
                  ticket.hasActiveContract ? "secondary" : "outline"
                }
                className="flex items-center gap-2"
              >
                <FileText className="h-3 w-3 text-slate-400" />
                Contrato: {contractTitle}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-slate-400" />
                SLA: {contractSla}
              </Badge>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Timeline de notas</p>
            <p className="text-xs text-muted-foreground">
              Anotaciones ordenadas por fecha (último registro primero).
            </p>
          </div>
        </div>
        <div className="mt-4 max-h-[360px] overflow-y-auto pr-2">
          {sortedAnnotations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay registros.
            </p>
          ) : (
            sortedAnnotations.map((annotation, index) => (
              <div
                key={annotation.createdAt}
                className="flex gap-3 border-b border-slate-200/70 py-3 last:border-b-0"
              >
                <div className="flex flex-col items-center text-[11px] text-slate-400">
                  <div className="h-6 w-[2px] bg-slate-200" />
                  <span>Paso {sortedAnnotations.length - index}</span>
                </div>
                <div className="flex-1 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {annotation.user ?? "Técnico"}
                      </span>
                      <span>{formatDateTime(annotation.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary"
                        onClick={() => handleOpenEditDialog(annotation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleOpenDeleteDialog(annotation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className="text-sm leading-relaxed text-slate-600"
                    dangerouslySetInnerHTML={{ __html: annotation.text }}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {annotation.attachments?.length ? (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() =>
                          handleOpenAttachment(annotation.attachments![0])
                        }
                      >
                        <Paperclip className="h-4 w-4" />
                        {annotation.attachments?.length} adjuntos
                      </button>
                    ) : null}
                    {annotation.audioNotes?.length ? (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() =>
                          handlePlayAudio(annotation.audioNotes![0])
                        }
                      >
                        <Mic className="h-4 w-4" />
                        {annotation.audioNotes?.length} audios
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
            <DialogDescription>
              Actualiza la anotación antes de guardar.
            </DialogDescription>
          </DialogHeader>
          <RichTextEditor
            value={editDraft}
            onChange={setEditDraft}
            placeholder="Actualiza el contenido de la nota"
            direction="ltr"
          />
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveEditedNote}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar nota</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta nota? La acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
