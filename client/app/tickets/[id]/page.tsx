"use client";

import { ChangeEvent, DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Clock4,
  History,
  Edit,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Mic,
  Paperclip,
  PlayCircle,
  Receipt,
  Send,
  Trash2,
  Unlock,
  PlusCircle,
  FolderOpen,
  CheckCircle2,
  DollarSign,
  Ticket as TicketIcon,
  Activity,
  AlertTriangle,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import ReactCountryFlag from "react-country-flag";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VisitForm from "@/components/tickets/visit-form";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
import { Group } from "@/types/group";
import { API_URL } from "@/lib/http";
import { TicketsTimeline } from "@/components/tickets/tickets-timeline";

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

const resolveAvatarUrl = (avatarPath?: string | null) => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith("http")) return avatarPath;
  const base = API_URL.replace(/\/api\/?$/, "");
  const normalized = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  return `${base}${normalized}`;
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

const statusIcons: Record<TicketStatus, React.ComponentType<{ className?: string }>> = {
  Nuevo: PlusCircle,
  Abierto: FolderOpen,
  "En proceso": Loader2,
  Visita: MapPin,
  Resuelto: CheckCircle2,
  Facturar: Receipt,
  Pagado: DollarSign,
};

const statusColors: Record<TicketStatus, string> = {
  Nuevo: "text-sky-500",
  Abierto: "text-blue-500",
  "En proceso": "text-amber-500",
  Visita: "text-purple-500",
  Resuelto: "text-emerald-600",
  Facturar: "text-orange-500",
  Pagado: "text-lime-600",
};

const priorityOptions: TicketPriority[] = ["Alta", "Media", "Baja"];

const priorityMeta: Record<
  TicketPriority,
  { Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  Alta: { Icon: AlertTriangle, color: "text-rose-500" },
  Media: { Icon: Activity, color: "text-amber-500" },
  Baja: { Icon: CheckCircle2, color: "text-emerald-600" },
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<TicketStatus>("Nuevo");
  const [formPriority, setFormPriority] = useState<TicketPriority>("Media");
  const [formVisit, setFormVisit] = useState(false);
  const [formAmount, setFormAmount] = useState<number | undefined>();
  const [formCurrency, setFormCurrency] = useState<"UYU" | "USD">("UYU");
  const [formDescription, setFormDescription] = useState("");
  const [formAnnotations, setFormAnnotations] = useState<Ticket["annotations"]>([]);
  const [timelinePeriod, setTimelinePeriod] = useState<"day" | "week">("week");
  const [notifyClient, setNotifyClient] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    TicketAttachment[]
  >([]);
  const [pendingAudioNotes, setPendingAudioNotes] = useState<
    TicketAudioNote[]
  >([]);
  const [clientTickets, setClientTickets] = useState<Ticket[]>([]);
  const [clientTicketsLoading, setClientTicketsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TicketAnnotation | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteDialogNote, setDeleteDialogNote] = useState<TicketAnnotation | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; avatar?: string }[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  // Declaracion de groupsMap al nivel superior del componente
  const groupsMap = useMemo(() => {
    const map: Record<string, Group> = {};
    groups.forEach((group) => {
      if (group._id) {
        map[group._id] = group;
      }
    });
    return map;
  }, [groups]);
  const [formAssignedTo, setFormAssignedTo] = useState<string | null>(null);
  const [formAssignedGroupId, setFormAssignedGroupId] = useState<string | null>(null);
  const currentUserProfile = useMemo(() => {
    const email = session?.user?.email?.toLowerCase();
    if (!email) return null;
    const matched = users.find((user) => user.email?.toLowerCase() === email);
    if (!matched) return null;
    return {
      ...matched,
      avatar: resolveAvatarUrl(matched.avatar),
    };
  }, [session?.user?.email, users]);
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
        const response = await fetch(`${API_URL}/tickets/${params.id}`, {
          signal: controller.signal,
        });
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
          : "Ocurrio un error al cargar el ticket.";
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

    if (ticket.clientId) {
      setClientTicketsLoading(true);
      void fetch(`${API_URL}/tickets?clientId=${ticket.clientId}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudieron cargar los tickets del cliente");
          const data = (await res.json()) as Ticket[];
          setClientTickets(data.filter((t) => t.id !== ticket.id));
        })
        .catch(() => {
          setClientTickets([]);
        })
        .finally(() => setClientTicketsLoading(false));
    } else {
      setClientTickets([]);
    }
  }, [ticket]);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios.");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching users:", err);
      }
    };
    loadUsers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          console.warn("No se pudieron cargar los grupos.", response.status);
          setGroups([]);
          return;
        }
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching groups:", err);
      }
    };

    loadGroups();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (ticket) {
      setFormAssignedTo(ticket.assignedTo ?? null);
      setFormAssignedGroupId(ticket.assignedGroupId ?? null);
    }
  }, [ticket]);
  const assignedUser = useMemo(
    () => users.find((user) => user.email === formAssignedTo) ?? null,
    [users, formAssignedTo]
  );

  const assignmentValue = useMemo(() => {
    if (formAssignedTo) {
      return `user:${formAssignedTo}`;
    }
    if (formAssignedGroupId) {
      return `group:${formAssignedGroupId}`;
    }
    return "none";
  }, [formAssignedGroupId, formAssignedTo]);

  const handleAssignmentChange = useCallback(
    (value: string) => {
      if (value === "none") {
        setFormAssignedTo(null);
        setFormAssignedGroupId(null);
        return;
      }
      if (value.startsWith("user:")) {
        setFormAssignedTo(value.replace(/^user:/, ""));
        setFormAssignedGroupId(null);
        return;
      }
      if (value.startsWith("group:")) {
        setFormAssignedGroupId(value.replace(/^group:/, ""));
        setFormAssignedTo(null);
      }
    },
    [setFormAssignedGroupId, setFormAssignedTo]
  );

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

  const timelineAnnotations = useMemo(() => {
    return [...(formAnnotations ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [formAnnotations]);

  const handleSave = useCallback(
    async (overrides?: { annotations?: Ticket["annotations"] }) => {
      if (!ticket) return;
      setIsSaving(true);
      try {
        let annotationsToSend = overrides?.annotations ?? formAnnotations ?? [];

        if (!overrides?.annotations) {
          const changes: string[] = [];
          if (ticket.status !== formStatus) {
            changes.push(`Estado: <strong>${ticket.status}</strong> → <strong>${formStatus}</strong>`);
          }
          if (ticket.priority !== formPriority) {
            changes.push(`Prioridad: <strong>${ticket.priority}</strong> → <strong>${formPriority}</strong>`);
          }
          if (Boolean(ticket.visit) !== Boolean(formVisit)) {
                changes.push(`Visita: <strong>${ticket.visit ? "Si" : "No"}</strong> → <strong>${formVisit ? "Si" : "No"}</strong>`);
          }
          const currentAmount = ticket.amount ?? 0;
          const currentCurrency = ticket.amountCurrency ?? "UYU";
          const newAmount = formAmount ?? 0;
          const newCurrency = formCurrency ?? "UYU";
          if (currentAmount !== newAmount || currentCurrency !== newCurrency) {
            changes.push(
              `Monto: <strong>${currentAmount} ${currentCurrency}</strong> → <strong>${newAmount} ${newCurrency}</strong>`
            );
          }
          if ((ticket.description ?? "") !== (formDescription ?? "")) {
                changes.push("Descripcion actualizada");
          }
          if ((ticket.assignedTo ?? null) !== (formAssignedTo ?? null)) {
            const oldUser = ticket.assignedTo || "Sin asignar";
            const newUser = formAssignedTo || "Sin asignar";
            changes.push(`Asignado: <strong>${oldUser}</strong> → <strong>${newUser}</strong>`);
          }
          if ((ticket.assignedGroupId ?? null) !== (formAssignedGroupId ?? null)) {
            const oldGroup =
              groupsMap[ticket.assignedGroupId ?? ""]?.name || "Sin grupo";
            const newGroup =
              groupsMap[formAssignedGroupId ?? ""]?.name || "Sin grupo";
            changes.push(`Grupo: <strong>${oldGroup}</strong> → <strong>${newGroup}</strong>`);
          }

          const normalizedNote = noteDraft.trim();
          const isNoteEmpty = !normalizedNote || normalizedNote === "<p><br></p>";
          const hasEditorNote = !isNoteEmpty;
          const hasMedia = pendingAttachments.length > 0 || pendingAudioNotes.length > 0;
          const shouldAddLog = changes.length > 0 || hasEditorNote || hasMedia;

          if (shouldAddLog) {
            const userName = currentUserProfile?.name ?? session?.user?.name ?? "Usuario";
            const userAvatar = currentUserProfile?.avatar ?? session?.user?.image ?? undefined;
            const segments: string[] = [];
            if (changes.length) {
              segments.push(`<p><strong>Cambios del ticket</strong></p><ul>${changes.map((c) => `<li>${c}</li>`).join("")}</ul>`);
            }
            if (hasEditorNote) {
              segments.push(
                `<p class="mt-3 text-[0.7rem] uppercase tracking-[0.3em] text-slate-500">Detalle tecnico</p>${noteDraft}`
              );
            }
            if (!segments.length) {
              segments.push("<p>Cambios registrados</p>");
            }

            const changeNote: TicketAnnotation = {
              text: segments.join("<hr class='my-2 border-t border-slate-200/60' />"),
              createdAt: new Date().toISOString(),
              user: userName,
              avatar: userAvatar,
              attachments: pendingAttachments.length ? [...pendingAttachments] : undefined,
              audioNotes: pendingAudioNotes.length ? [...pendingAudioNotes] : undefined,
            };
            annotationsToSend = [changeNote, ...annotationsToSend];
            setFormAnnotations(annotationsToSend);
          }
        }

        const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
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
            annotations: annotationsToSend,
            assignedTo: formAssignedTo,
            assignedGroupId: formAssignedGroupId,
            notifyClient,
          }),
        });
        if (!response.ok) {
          const serverMessage = await response.text();
          throw new Error(serverMessage || "No se pudo guardar el ticket.");
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
        setFormAssignedTo(updated.assignedTo ?? null);
        setFormAssignedGroupId(updated.assignedGroupId ?? null);
        if (!overrides?.annotations) {
          setNoteDraft("");
          setPendingAttachments([]);
          setPendingAudioNotes([]);
        }
        toast.success("Ficha actualizada correctamente.");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
          : "Ocurrio un error al guardar los cambios.";
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
      formAssignedTo,
      formAssignedGroupId,
      groupsMap,
      notifyClient,
      noteDraft,
      pendingAttachments,
      pendingAudioNotes,
      currentUserProfile,
      session,
    ]
  );

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

  const handleEditorImagePaste = useCallback(
    ({ file, dataUrl }: { file: File; dataUrl: string }) => {
      const attachment: TicketAttachment = {
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `clipboard-${Date.now()}`,
        name: file.name || `clipboard-image-${Date.now()}`,
        size: file.size,
        type: file.type || "image/png",
        dataUrl,
      };
      setPendingAttachments((prev) => [...prev, attachment]);
    },
    []
  );

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
        toast.error("No se pudo iniciar la grabacion.");
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

  // Debug: log ticket and annotation data to diagnose RangeError
  console.log("[DEBUG] Ticket Data:", ticket);
  console.log("[DEBUG] Annotations:", sortedAnnotations);
  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title={ticket.title}
        subtitle={`ID: ${ticket.id} • Cliente: ${ticket.clientName}`}
        backHref="/tickets"
        leadingIcon={<TicketIcon className="h-6 w-6 text-slate-800" />}
        breadcrumbs={[
          { label: "Tickets", href: "/tickets", icon: <TicketIcon className="h-3 w-3 text-slate-500" /> },
          { label: `Ticket ${ticket.id}`, icon: <CheckCircle2 className="h-3 w-3 text-slate-500" /> },
        ]}
        actions={
          null
        }
      />

      <div className="flex items-center gap-4 justify-between">
        {/* Linea horizontal con avatares del timeline */}
        <div className="flex-[0_0_65%] pr-2">
          <div className="relative flex items-center h-14">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-300" />
            {timelineAnnotations.map((annotation, idx) => {
              const total = timelineAnnotations.length;
              let percent = total === 1 ? 0 : (idx / (total - 1)) * 100;
              if (!isFinite(percent) || isNaN(percent)) percent = 0;
              percent = Math.max(0, Math.min(100, percent));
              return (
                <div
                  key={annotation.createdAt}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group"
                  style={{ left: `${percent}%` }}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-white bg-white shadow transition-transform duration-200 group-hover:scale-110">
                      {annotation.avatar ? (
                        <AvatarImage src={annotation.avatar} alt={annotation.user ?? "Usuario"} />
                      ) : (
                        <AvatarFallback>
                          {(annotation.user ?? "Usuario")
                            .split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {annotation.text && (
                      <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className="whitespace-nowrap rounded-lg border border-slate-200 bg-white p-2 text-[10px] font-semibold text-slate-600 shadow-lg"
                            dangerouslySetInnerHTML={{ __html: annotation.text }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.2em] leading-tight">
                    {formatDateTime(annotation.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-[0_0_10%] flex justify-end min-w-[140px]">
          <Button onClick={() => handleSave()} disabled={isSaving} className="w-full">
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Mostrar el formulario de visita solo en estados de visita */}
        {[
          "Visita",
          "Visita - Coordinar",
          "Visita Programada",
          "Visita Realizada",
          "Revision Cerrar Visita"
        ].includes(formStatus) ? (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Formulario de visita</p>
                <p className="text-xs text-muted-foreground">
                  Completa los datos de la visita y registra pendientes o facturacion.
                </p>
              </div>
            </div>
            {/* Componente del formulario de visita */}
            <VisitForm
              value={ticket?.visitData ?? {}}
              onChange={() => {}}
              disabled={isLocked}
            />
          </section>
        ) : (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Documenta la intervencion</p>
                <p className="text-xs text-muted-foreground">
                  Todo lo que escribas, los archivos adjuntos y las notas de audio se registraran cuando guardes los cambios.
                </p>
              </div>
                <span className="text-[11px] text-muted-foreground">
                  Ultimo registro {sortedAnnotations[0] ? formatDateTime(sortedAnnotations[0].createdAt) : "--"}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={isRecording ? "Detener grabacion" : "Grabar nota de voz"}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/10 transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {isRecording ? (
                    <Mic className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4 text-primary" />
                  )}
                </button>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {pendingAudioNotes.length} audios
                </span>
                <button
                  type="button"
                  aria-label="Adjuntar archivos"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/10 transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {pendingAttachments.length} archivos
                </span>
                <button
                  type="button"
                  aria-pressed={notifyClient}
                  aria-label="Notificar al cliente"
                  onClick={() => setNotifyClient((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${notifyClient
                    ? "border-emerald-500 text-emerald-600"
                    : "border-border/60 text-muted-foreground"
                    }`}
                >
                  <Send className="h-4 w-4" />
                </button>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  {notifyClient ? "Notificacion activa" : "Sin notificacion"}
                </span>
              </div>
            </div>
            <RichTextEditor
              value={noteDraft}
              onChange={setNoteDraft}
                placeholder="Describe la intervencion, acciones, resultados o bloqueos."
              direction="ltr"
              className="min-h-[220px]"
              onImagePaste={handleEditorImagePaste}
            />
          </section>
        )}

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Detalles del ticket</p>
              <p className="text-xs text-muted-foreground">
                Los campos estan {isLocked ? "bloqueados" : "listos para editar"}.
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
                  <SelectTrigger id="status" className="w-full text-left">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = statusIcons[formStatus] ?? Loader2;
                          const color = statusColors[formStatus] ?? "text-slate-500";
                          return <Icon className={`h-4 w-4 ${color}`} />;
                        })()}
                        <span className="leading-none">{formStatus}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Nuevo",
                      "Abierto",
                      "En proceso",
                      "En proceso de soporte",
                      "Visita",
                      "Visita - Coordinar",
                      "Visita Programada",
                      "Visita Realizada",
                      "Revision Cerrar Visita",
                      "Pendiente de Coordinacion",
                      "Pendiente de Cliente",
                      "Pendiente de Tercero",
                      "Pendiente de Facturacion",
                      "Pendiente de Pago",
                      "Cerrado",
                      "Resuelto",
                      "Facturar",
                      "Pagado"
                    ].map((status) => {
                      const Icon = statusIcons[status as TicketStatus] ?? Loader2;
                      const color = statusColors[status as TicketStatus] ?? "text-slate-500";
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span className="leading-none">{status}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const meta = priorityMeta[formPriority];
                          const Icon = meta.Icon;
                          return <Icon className={`h-4 w-4 ${meta.color}`} />;
                        })()}
                        <span className="leading-none">{formPriority}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((priority) => {
                      const meta = priorityMeta[priority];
                      const Icon = meta.Icon;
                      return (
                        <SelectItem key={priority} value={priority}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                            <span className="leading-none">{priority}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment">Asignacion</Label>
              <Select
                value={assignmentValue}
                onValueChange={handleAssignmentChange}
                disabled={isLocked}
              >
                <SelectTrigger id="assignment" className="w-full">
                  <SelectValue>{(() => {
                    if (assignedUser) {
                      return (
                        <div className="flex items-center gap-2">
                          {assignedUser.avatar ? (
                            <img
                              src={
                                assignedUser.avatar.startsWith("http")
                                  ? assignedUser.avatar
                                  : `${API_URL.replace("/api", "")}${assignedUser.avatar}`
                              }
                              alt={assignedUser.name}
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                              {assignedUser.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="leading-none">{assignedUser.name}</span>
                        </div>
                      );
                    }
                    if (formAssignedGroupId) {
                      const activeGroup = groupsMap[formAssignedGroupId];
                      return (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{activeGroup?.name ?? "Grupo"}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="leading-none">Sin asignar</span>
                      </div>
                    );
                  })()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Sin asignar</span>
                    </div>
                  </SelectItem>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Grupos</SelectLabel>
                    {groups.map((group) => {
                      const groupValue = group._id || group.id || group.slug;
                      if (!groupValue) return null;
                      return (
                        <SelectItem key={`group-${groupValue}`} value={`group:${groupValue}`}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{group.name}</span>
                            </div>
                            {group.description ? (
                              <span className="text-[11px] text-muted-foreground">
                                {group.description}
                              </span>
                            ) : null}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Usuarios</SelectLabel>
                    {users.map((user) => {
                      const userValue = user.email || user.id;
                      if (!userValue) return null;
                      return (
                        <SelectItem key={`user-${userValue}`} value={`user:${userValue}`}>
                          <div className="flex items-center gap-2">
                            {user.avatar ? (
                              <img
                                src={
                                  user.avatar.startsWith("http")
                                    ? user.avatar
                                    : `${API_URL.replace("/api", "")}${user.avatar}`
                                }
                                alt={user.email}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                                {user.email.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{user.name} ({user.email})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div >

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
                    <SelectTrigger className="w-[130px] text-left">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            svg
                            countryCode={formCurrency === "USD" ? "US" : "UY"}
                            className="inline-block h-4 w-5"
                            aria-label={formCurrency}
                          />
                          <span className="text-sm font-semibold">{formCurrency}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYU">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            svg
                            countryCode="UY"
                            className="inline-block h-4 w-5"
                            aria-label="UYU"
                          />
                          <span>UYU</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            svg
                            countryCode="US"
                            className="inline-block h-4 w-5"
                            aria-label="USD"
                          />
                          <span>USD</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-description">Descripcion</Label>
              <Textarea
                id="ticket-description"
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                rows={5}
                placeholder="Documenta el problema, pasos relevantes y prioridades."
                disabled={isLocked}
              />
            </div>

          </div >
        </section >
      </div >

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Timeline de notas</p>
              <p className="text-xs text-muted-foreground">
                Anotaciones ordenadas por fecha (ultimo registro primero).
              </p>
          </div>
        </div>
        <div className="mt-4 max-h-[360px] overflow-y-auto pr-2">
          {sortedAnnotations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aun no hay registros.
            </p>
          ) : (
            sortedAnnotations.map((annotation, index) => (
              <div
                key={annotation.createdAt}
                className="flex gap-3 border-b border-slate-200/70 py-3 last:border-b-0"
              >
                <div className="flex flex-col items-center text-[11px] text-slate-400">
                  <Avatar
                    className="h-10 w-10 rounded-full border border-slate-200/70 bg-white shadow-sm"
                  >
                    {annotation.avatar ? (
                      <AvatarImage src={annotation.avatar} alt={annotation.user ?? "Usuario"} />
                    ) : (
                      <AvatarFallback>
                        {(annotation.user ?? "Usuario")
                          .split(" ")
                          .map((part) => part.charAt(0))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="mt-2 text-[11px]">{`Paso ${sortedAnnotations.length - index}`}</span>
                  <div className="mt-2 h-6 w-[2px] bg-slate-200" />
                </div>
                <div className="flex-1 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {annotation.user ?? "Tecnico"}
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
              Actualiza la anotacion antes de guardar.
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
              Estas seguro de eliminar esta nota? La accion no se puede deshacer.
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
    </div >
  );
}

