// components/tickets/edit-ticket-dialog.tsx

"use client";

import React, { useEffect, useMemo, useRef, useState, useId, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  FilePlus,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Trash2,
  User,
  Users,
  Search,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  PlusCircle,
  Check,
  ChevronsUpDown,
  X,
  Save,
  Lock,
  Network,
  FolderArchive,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { cn, generateId } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Ticket, TicketAttachment, TicketAudioNote } from "@/types/ticket";
import { Group } from "@/types/group";
import { Client } from "@/types/client";
import { API_URL } from "@/lib/http";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import dynamic from "next/dynamic";
import ReactCountryFlag from "react-country-flag";

const TextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false }
);

type DialogMode = "edit" | "create";

interface BaseProps {
  children?: React.ReactNode;
  mode?: DialogMode;
  variant?: "modal" | "page";
  onClose?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialClientId?: string;
  initialClientName?: string;
  initialClient?: Client;
}

interface EditModeProps extends BaseProps {
  mode?: "edit";
  ticket: Ticket;
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketCreated?: never;
}

interface CreateModeProps extends BaseProps {
  mode: "create";
  ticket?: never;
  onTicketUpdated?: never;
  onTicketCreated: (ticket: Ticket) => void;
}

type EditTicketDialogProps = EditModeProps | CreateModeProps;

export function EditTicketDialog({
  ticket,
  onTicketUpdated,
  onTicketCreated,
  children,
  mode = "edit",
  variant = "modal",
  onClose,
  isOpen: controlledOpen,
  onOpenChange,
  initialClientId,
  initialClientName,
  initialClient,
}: EditTicketDialogProps) {
  const isEditMode = mode === "edit";
  const isPageVariant = variant === "page";
  const [internalOpen, setInternalOpen] = useState(isPageVariant);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) onOpenChange(open);
    else setInternalOpen(open);
  }, [onOpenChange]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [isAttachmentProcessing, setIsAttachmentProcessing] = useState(false);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [clientTickets, setClientTickets] = useState<Ticket[]>([]);
  const [clientTicketsLoading, setClientTicketsLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(ticket?.assignedTo ?? null);
  const [assignedGroupId, setAssignedGroupId] = useState<string | null>(ticket?.assignedGroupId ?? null);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);



  const initialState = useMemo(() => {
    const isVisitStatus =
      typeof ticket?.status === "string" &&
      ticket.status.toLowerCase() === "visita";

    return {
      title: ticket?.title ?? "",
      clientName: ticket?.clientName ?? "",

      selectedClientId: ticket?.clientId ?? null,
      hasActiveContract: ticket?.hasActiveContract ?? false,
      status: ticket?.status ?? "Nuevo",
      priority: ticket?.priority ?? "Media",
      amount: ticket?.amount ?? 0,
      amountCurrency: ticket?.amountCurrency ?? "UYU",
      visit: isVisitStatus || Boolean(ticket?.visit),
      annotations: Array.isArray(ticket?.annotations) ? ticket.annotations : [],
      description: ticket?.description ?? "",
      attachments: Array.isArray(ticket?.attachments)
        ? (ticket.attachments as TicketAttachment[])
        : [],

      audioNotes: Array.isArray(ticket?.audioNotes)
        ? (ticket.audioNotes as TicketAudioNote[])
        : [],
      assignedTo: ticket?.assignedTo ?? null,
      assignedGroupId: ticket?.assignedGroupId ?? null,
    };
  }, [ticket]);

  const [title, setTitle] = useState(initialState.title);
  const [clientName, setClientName] = useState(initialClientName ?? initialState.clientName);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialClientId ?? initialState.selectedClientId
  );
  const currentClient = useMemo(() => {
    if (!selectedClientId) return initialClient;
    const found = clients.find(c => String(c.id) === String(selectedClientId));
    return found || (String(initialClient?.id) === String(selectedClientId) ? initialClient : undefined);
  }, [clients, selectedClientId, initialClient]);
  const [hasContract, setHasContract] = useState(initialState.hasActiveContract);
  const [status, setStatus] = useState<Ticket["status"]>(initialState.status);
  const [priority, setPriority] = useState<Ticket["priority"]>(
    initialState.priority
  );
  const [amount, setAmount] = useState(initialState.amount);
  const [amountCurrency, setAmountCurrency] = useState<"UYU" | "USD">(initialState.amountCurrency ?? "UYU");
  const [visit, setVisit] = useState(initialState.visit);
  const [notes, setNotes] = useState("");
  const [annotations, setAnnotations] = useState(initialState.annotations);
  const [description, setDescription] = useState(initialState.description);
  const [attachments, setAttachments] = useState<TicketAttachment[]>(
    initialState.attachments
  );
  const [audioNotes, setAudioNotes] = useState<TicketAudioNote[]>(
    initialState.audioNotes
  );
  const [isRecording, setIsRecording] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const attachmentObjectUrls = useRef<string[]>([]);
  const audioObjectUrls = useRef<string[]>([]);
  const clientInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedClientId) {
      setClientTicketsLoading(true);
      fetch(`${API_URL}/tickets`)
        .then((res) => res.json())
        .then((data: any[]) => {
          const tickets = data
            .map((t) => ({
              ...t,
              createdAt: t.createdAt || new Date().toISOString(),
              status: t.status || "Nuevo",
            }))
            .filter(
              (t: Ticket) =>
                t.clientId === selectedClientId ||
                (t.clientName && clientName && t.clientName.toLowerCase() === clientName.toLowerCase())
            );
          tickets.sort(
            (a: Ticket, b: Ticket) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setClientTickets(tickets);
        })
        .catch((err) => console.error(err))
        .finally(() => setClientTicketsLoading(false));
    } else {
      setClientTickets([]);
    }
  }, [selectedClientId, clientName]);

  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const fileInputId = useId();
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        const newNote: TicketAudioNote = {
          id: generateId(),
          name: `nota-${audioNotes.length + 1}.webm`,
          size: audioBlob.size,
          type: audioBlob.type,
          url,
          durationSeconds: 0,
          createdAt: new Date().toISOString(),
        };
        audioObjectUrls.current.push(url);
        setAudioNotes((prev) => [...prev, newNote]);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      toast.error("No se pudo iniciar la grabación");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClientInputChange = (value: string) => {
    setClientName(value);
    setSelectedClientId(null);
    if (!clientsLoaded) {
      fetchClients();
    }
  };

  const handleClientInputPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    event.preventDefault();
    setClientMenuOpen(true);
    clientInputRef.current?.focus();
  };

  const handleClientSelect = (client: Client) => {
    setClientName(client.name);
    setSelectedClientId(client.id);
    setHasContract(client.contract ?? false);
    setClientMenuOpen(false);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setIsAttachmentProcessing(true);
    const newOnes: TicketAttachment[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      attachmentObjectUrls.current.push(url);
      return {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        url,
      };
    });
    setAttachments((prev) => [...prev, ...newOnes]);
    setIsAttachmentProcessing(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) handleClose();
  };

  const fetchClients = useCallback(async () => {
    if (clientsLoaded) return;
    setClientsLoading(true);
    try {
      const response = await fetch(`${API_URL}/clients`);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as Client[];
      setClients(data);
      setClientsLoaded(true);
    } catch {
      toast.error("No se pudieron cargar los clientes.");
    } finally {
      setClientsLoading(false);
    }
  }, [clientsLoaded]);

  useEffect(() => {
    if (isOpen && !clientsLoaded) {
      fetchClients();
    }
  }, [isOpen, clientsLoaded, fetchClients]);

  useEffect(() => {
    if (clientMenuOpen && !clientsLoaded) {
      fetchClients();
    }
  }, [clientMenuOpen, clientsLoaded, fetchClients]);

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          console.warn("No se pudieron cargar los grupos:", response.status);
          toast.error("No se pudieron cargar los grupos.");
          setGroups([]);
          return;
        }
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        console.error("Error fetching groups:", err);
      }
    };
    loadGroups();
    return () => controller.abort();
  }, []);


  useEffect(() => {
    return () => {
      attachmentObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      audioObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setTitle(initialState.title);
      setClientName(initialState.clientName);
      setSelectedClientId(initialState.selectedClientId);
      setHasContract(initialState.hasActiveContract);
      setStatus(initialState.status);
      setPriority(initialState.priority);
      setAmount(initialState.amount);
      setAmountCurrency(initialState.amountCurrency ?? "UYU");
      setVisit(initialState.visit);
      setAnnotations(initialState.annotations);
      setDescription(initialState.description);
      setAttachments(initialState.attachments);
      setAudioNotes(initialState.audioNotes);
      setAssignedTo(initialState.assignedTo);
      setAssignedGroupId(initialState.assignedGroupId);
      setNotes("");
    } else if (isOpen) {
      // Logic for create mode when dialog opens
      setTitle("");
      setClientName(initialClientName ?? "");
      setSelectedClientId(initialClientId ?? null);
      setHasContract(false);
      setStatus("Nuevo");
      setPriority("Media");
      setAmount(0);
      setAmountCurrency("UYU");
      setVisit(false);
      setAnnotations([]);
      setDescription("");
      setAttachments([]);
      setAudioNotes([]);
      setAssignedTo(null);
      setAssignedGroupId(null);
      setNotes("");
    }
  }, [isEditMode, initialState, isOpen, initialClientId, initialClientName]);

  const resetForm = () => {
    setTitle(initialState.title);
    setClientName(initialState.clientName);
    setSelectedClientId(initialState.selectedClientId);
    setHasContract(initialState.hasActiveContract);
    setStatus(initialState.status);
    setPriority(initialState.priority);
    setAmount(initialState.amount);
    setAmountCurrency(initialState.amountCurrency ?? "UYU");
    setVisit(initialState.visit);
    setAnnotations(initialState.annotations);
    setDescription(initialState.description);
    setAttachments(initialState.attachments);
    setAudioNotes(initialState.audioNotes);
    setAssignedTo(initialState.assignedTo);
    setAssignedGroupId(initialState.assignedGroupId);
    setNotes("");
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
    setClientMenuOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error("Seleccione o escriba un cliente para continuar.");
      return;
    }

    const visitFlag = status === "Visita";
    const sanitizedNotes = notes.trim();
    const noteAnnotation = sanitizedNotes
      ? {
        text: `<p>${sanitizedNotes}</p>`,
        createdAt: new Date().toISOString(),
        user: "Operador",
      }
      : null;

    const sanitizeAttachments = () =>
      attachments.map(({ id, name, size, type, url }) => ({
        id,
        name,
        size,
        type,
        url,
      }));

    const sanitizeAudioNotes = () =>
      audioNotes.map(({ id, name, size, type, url, durationSeconds }) => ({
        id,
        name,
        size,
        type,
        url,
        durationSeconds,
      }));

    const payload = {
      title,
      clientId: selectedClientId ?? ticket?.clientId,
      priority,
      status,
      visit: visitFlag,
      amount,
      amountCurrency,
      annotations: noteAnnotation ? [noteAnnotation, ...annotations] : annotations,
      description,
      attachments: sanitizeAttachments(),
      audioNotes: sanitizeAudioNotes(),
      assignedTo,
      assignedGroupId,
    };

    if (isEditMode) {
      if (!ticket || !onTicketUpdated) {
        toast.error("No se pudo actualizar el ticket.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Error al actualizar el ticket");
        }

        const updatedTicket: Ticket = await response.json();

        onTicketUpdated(updatedTicket);
        toast.success("Ticket actualizado con éxito");
        setNotes("");
        handleClose();
      } catch (error) {
        console.error("Error updating ticket:", error);
        toast.error("No se pudo actualizar el ticket.");
      }
    } else {
      try {
        const response = await fetch(`${API_URL}/tickets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Error al crear el ticket");
        }

        const createdTicket: Ticket = await response.json();

        if (onTicketCreated) {
          onTicketCreated(createdTicket);
        }
        toast.success("Ticket creado con éxito");
        resetForm();
      } catch (error) {
        console.error("Error creating ticket:", error);
        toast.error("Error al crear el ticket.");
      }
    }
  };

  const getStatusBadgeVariant = (value: Ticket["status"]) => {
    if (value === "Resuelto") return "secondary";
    if (value === "Facturar") return "destructive";
    if (value === "Visita") return "outline";
    return "default";
  };

  const getPriorityBadgeVariant = (value: Ticket["priority"]) => {
    if (value === "Alta") return "destructive";
    if (value === "Media") return "outline";
    return "secondary";
  };

  const statusOptions: Ticket["status"][] = ["Nuevo", "Abierto", "En proceso", "Visita", "Resuelto", "Facturar", "Pagado"];

  const statusIcons: Record<Ticket["status"], React.ComponentType<{ className?: string }>> = {
    Nuevo: FilePlus,
    Abierto: FileText,
    "En proceso": Loader2,
    "En proceso de soporte": Loader2,
    Visita: User,
    "Visita - Coordinar": User,
    "Visita Programada": User,
    "Visita Realizada": User,
    "Revision Cerrar Visita": CheckCircle2,
    "Pendiente de Coordinación": Clock,
    "Pendiente de Cliente": Clock,
    "Pendiente de Tercero": Clock,
    "Pendiente de Facturación": BadgeDollarSign,
    "Pendiente de Pago": BadgeDollarSign,
    Cerrado: CheckCircle2,
    Resuelto: BadgeDollarSign,
    Facturar: BadgeDollarSign,
    Pagado: BadgeDollarSign,
  };

  const statusIconClasses: Record<Ticket["status"], string> = {
    Nuevo: "text-sky-500",
    Abierto: "text-blue-500",
    "En proceso": "text-amber-500",
    "En proceso de soporte": "text-amber-400",
    Visita: "text-purple-500",
    "Visita - Coordinar": "text-purple-400",
    "Visita Programada": "text-purple-300",
    "Visita Realizada": "text-purple-600",
    "Revision Cerrar Visita": "text-green-400",
    "Pendiente de Coordinación": "text-gray-400",
    "Pendiente de Cliente": "text-gray-500",
    "Pendiente de Tercero": "text-gray-600",
    "Pendiente de Facturación": "text-orange-400",
    "Pendiente de Pago": "text-orange-300",
    Cerrado: "text-zinc-400",
    Resuelto: "text-emerald-600",
    Facturar: "text-orange-500",
    Pagado: "text-lime-600",
  };

  const priorityOptions: Ticket["priority"][] = ["Alta", "Media", "Baja"];

  const priorityMeta: Record<
    Ticket["priority"],
    { Icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    Alta: { Icon: AlertTriangle, color: "text-rose-500" },
    Media: { Icon: Activity, color: "text-amber-500" },
    Baja: { Icon: CheckCircle2, color: "text-emerald-600" },
  };

  const getPriorityMeta = (priority: Ticket["priority"]) => {
    return priorityMeta[priority as keyof typeof priorityMeta] || priorityMeta["Media"];
  };

  const formContent = (
    <form id="ticket-form" onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 gap-4 overflow-hidden lg:grid-cols-[3fr_1.2fr] px-8 py-6">
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: isPageVariant ? "auto" : "calc(95vh - 220px)" }}>
          <Card className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground">Detalles del Ticket</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Información principal y clasificación.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <Switch
                    checked={visit}
                    onCheckedChange={(checked) => setVisit(Boolean(checked))}
                    id="visit-toggle"
                  />
                  <Label htmlFor="visit-toggle" className="text-xs font-bold text-slate-600 cursor-pointer">VISITA</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-title" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <TicketIcon className="h-3 w-3" />
                  Título
                </Label>
                <Input
                  id="ticket-title"
                  placeholder="Ej: Problema con conexión VPN"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-10 border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all font-medium py-2 px-3"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Users className="h-3 w-3" />
                  Cliente
                  {hasContract && (
                    <Badge variant="outline" className="ml-auto border-emerald-500 text-emerald-600 bg-emerald-50 h-5 px-1.5 text-[9px] font-bold">
                      CON CONTRATO
                    </Badge>
                  )}
                </Label>
                <Popover open={clientMenuOpen} onOpenChange={setClientMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientMenuOpen}
                      className="w-full justify-between font-medium border-slate-200 h-10 bg-white hover:bg-slate-50"
                    >
                      {clientName ? (
                        <span className="truncate">{clientName}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">Seleccionar cliente...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0 shadow-xl border-slate-200">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." className="h-10" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => handleClientSelect(client)}
                              className="px-3 py-2 cursor-pointer"
                            >
                              <div className="flex flex-1 items-center justify-between">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{client.name}</span>
                                    {client.contract && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">ID: {client.id}</span>
                                </div>
                                {selectedClientId === client.id && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {status === "Facturar" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                <Label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <BadgeDollarSign className="h-3 w-3" />
                  Monto Estimado
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={amountCurrency}
                    onValueChange={(val) => setAmountCurrency(val as "UYU" | "USD")}
                  >
                    <SelectTrigger className="w-[120px] border-slate-200 h-10 font-bold bg-slate-50/50">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            svg
                            countryCode={amountCurrency === "USD" ? "US" : "UY"}
                            className="h-3.5 w-4.5 rounded-[2px]"
                            aria-label={amountCurrency}
                          />
                          <span className="text-sm">{amountCurrency}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYU" className="font-medium">UYU (Pesos)</SelectItem>
                      <SelectItem value="USD" className="font-medium">USD (Dólares)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <Input
                      id="ticket-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                      className="h-10 pl-7 border-slate-200 focus:ring-2 focus:ring-primary/20 font-bold text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Ticket["status"])}>
                  <SelectTrigger className="h-10 border-slate-200 font-medium">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => {
                      const Icon = statusIcons[option] ?? FileText;
                      const color = statusIconClasses[option] ?? "text-slate-500";
                      return (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${color}`} />
                            <span className="font-medium">{option}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Ticket["priority"])}>
                  <SelectTrigger className="h-10 border-slate-200 font-medium">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => {
                      const meta = getPriorityMeta(option);
                      const Icon = meta.Icon;
                      return (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                            <span className="font-medium">{option}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Asignación
                </Label>
                <Popover open={assignmentMenuOpen} onOpenChange={setAssignmentMenuOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={assignmentMenuOpen}
                      className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white h-10 px-3 py-2 text-sm font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {assignedTo ? (
                          (() => {
                            const user = users.find((u) => u.email === assignedTo);
                            if (!user) return <span className="text-xs truncate">{assignedTo}</span>;
                            const avatarUrl = (user as any).avatar;
                            return (
                              <>
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl.startsWith("http") ? avatarUrl : `${API_URL.replace('/api', '')}${avatarUrl}`}
                                    alt={user.name}
                                    className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-100"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate text-xs font-semibold text-slate-700">{user.name}</span>
                              </>
                            );
                          })()
                        ) : assignedGroupId ? (
                          (() => {
                            const group = groups.find((g) => g._id === assignedGroupId);
                            return (
                              <>
                                <div className="h-5 w-5 rounded bg-amber-100 flex items-center justify-center ring-1 ring-amber-100">
                                  <Users className="h-3 w-3 text-amber-600" />
                                </div>
                                <span className="truncate text-xs font-semibold text-slate-700">{group?.name || "Grupo"}</span>
                              </>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground font-normal">Asignar a...</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 shadow-2xl border-slate-200 rounded-xl overflow-hidden" align="start">
                    <Command className="rounded-xl">
                      <CommandInput placeholder="Buscar usuario o grupo..." className="h-10" />
                      <CommandList className="max-h-[350px] custom-scrollbar">
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                        <CommandGroup heading="ACCIONES">
                          <CommandItem
                            onSelect={() => {
                              setAssignedTo(null);
                              setAssignedGroupId(null);
                              setAssignmentMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-slate-500 hover:text-slate-900"
                          >
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                              <X className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Sin asignar</span>
                          </CommandItem>
                        </CommandGroup>

                        <CommandGroup heading="GRUPOS">
                          {groups.map((group) => (
                            <CommandItem
                              key={group._id}
                              onSelect={() => {
                                setAssignedGroupId(group._id);
                                setAssignedTo(null);
                                setAssignmentMenuOpen(false);
                              }}
                              className="px-3 py-2 cursor-pointer hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                  <Users className="h-4.5 w-4.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-xs text-slate-800">{group.name}</span>
                                  {group.description && (
                                    <span className="text-[10px] text-muted-foreground truncate line-clamp-1">
                                      {group.description}
                                    </span>
                                  )}
                                </div>
                                {(assignedGroupId === group._id) && (
                                  <Check className="ml-auto h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        <CommandGroup heading="USUARIOS">
                          {users.map((user: any) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => {
                                setAssignedTo(user.email);
                                setAssignedGroupId(null);
                                setAssignmentMenuOpen(false);
                              }}
                              className="px-3 py-2 cursor-pointer hover:bg-slate-50"
                            >
                              <div className="flex items-center gap-3 w-full">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar.startsWith("http") ? user.avatar : `${API_URL.replace('/api', '')}${user.avatar}`}
                                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-100"
                                    alt=""
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 ring-1 ring-blue-100">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-xs text-slate-800">{user.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                </div>
                                {(assignedTo === user.email) && (
                                  <Check className="ml-auto h-4 w-4 text-primary" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          {attachments.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">{attachment.name}</p>
                      <p className="text-[11px] text-slate-500">{formatBytes(attachment.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <Label htmlFor="ticket-description" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Descripción Detallada
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => document.getElementById(fileInputId)?.click()}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold transition-colors"
                >
                  <Paperclip className="h-3 w-3" />
                  ADJUNTAR
                </button>
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  )}
                >
                  {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  {isRecording ? "DETENER" : "NOTA VOZ"}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <TextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe el incidente con detalle. Puedes arrastrar imágenes aquí o usar el botón de adjuntar."
              />
            </div>
          </div>

          <Card className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Anotaciones del operador (Privado)</p>
            </div>
            <Textarea
              placeholder="Añade una nota interna sobre este ticket..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-white border-slate-200 focus:ring-2 focus:ring-primary/20 transition-all font-medium py-2 px-3 text-sm"
            />
          </Card>
        </div>

        {/* Right Column: History */}
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
            <div className="p-1.5 rounded-lg bg-slate-200/50">
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 tracking-tight">Historial</p>
              <p className="text-[10px] text-slate-500 font-medium">Tickets recientes del cliente</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {clientsLoading || clientTicketsLoading ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cargando...</p>
              </div>
            ) : clientTickets.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {clientTickets.map((t) => {
                  const StatusIcon = statusIcons[t.status] || FileText;
                  const statusColor = statusIconClasses[t.status] || "text-slate-500";

                  return (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="group flex flex-col gap-2 p-4 transition-all hover:bg-slate-50/80"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-1 rounded-lg p-1.5 bg-white shadow-sm ring-1 ring-slate-100", statusColor)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                          <span className="truncate text-xs font-bold text-slate-700 group-hover:text-primary transition-colors" title={t.title}>
                            {t.title}
                          </span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                            <Badge variant={getStatusBadgeVariant(t.status)} className="h-4 px-1.5 text-[9px] font-bold tracking-tight">
                              {t.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50/20">
                <div className="mb-4 p-4 rounded-full bg-slate-100">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-500">SIN HISTORIAL</p>
                <p className="text-[10px] text-slate-400 mt-1">Este cliente no tiene registros previos.</p>
              </div>
            )}
          </div>

          {/* Bloque de Acceso Rápido */}
          {currentClient && (currentClient.hasAccess || currentClient.hasDiagram || currentClient.hasFiles || currentClient.hasImplementation) && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recursos del cliente</p>
                {currentClient.contract && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700 uppercase">Protegido</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {currentClient.hasAccess && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/clients/${currentClient.id}/repository/access`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 group transition-all"
                        >
                          <Lock className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Accesos</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">Datos de Acceso y Contraseñas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {currentClient.hasImplementation && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/clients/${currentClient.id}/implementation`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 group transition-all"
                        >
                          <Rocket className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Implement.</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">Planilla de Implementación</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {currentClient.hasDiagram && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/clients/${currentClient.id}/diagram`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 group transition-all"
                        >
                          <Network className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Diagrama</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">Diagramas de Red / Topología</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {currentClient.hasFiles && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/repository?search=${encodeURIComponent(currentClient.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 group transition-all"
                        >
                          <FolderArchive className="h-4 w-4 text-slate-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Archivos</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top">Repositorio de Archivos</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isPageVariant && (
        <div className="flex items-center justify-between border-t bg-slate-50/50 px-8 py-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Borrador en edición
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="h-10 text-slate-500 hover:text-slate-800 font-bold text-xs"
            >
              CANCELAR
            </Button>
            <Button
              type="submit"
              disabled={isRecording || isAttachmentProcessing}
              className="h-10 bg-primary hover:bg-primary/90 px-8 font-bold text-xs shadow-lg shadow-primary/20 gap-2"
            >
              {isEditMode ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {isEditMode ? "GUARDAR CAMBIOS" : "CREAR TICKET"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );

  if (isPageVariant) {
    return (
      <div className="min-h-screen p-6">
        <PageHeader
          title={isEditMode ? "Editar ticket" : "Nuevo ticket"}
          subtitle="Registra la solicitud con cliente, prioridad, monto y adjuntos."
          backHref="/tickets"
          leadingIcon={<TicketIcon className="h-6 w-6 text-slate-800" />}
          breadcrumbs={[
            { label: "Tickets", href: "/tickets", icon: <TicketIcon className="h-3 w-3 text-slate-500" /> },
            { label: isEditMode ? "Editar" : "Nuevo", icon: <FilePlus className="h-3 w-3 text-slate-500" /> },
          ]}
          actions={null}
          breadcrumbAction={
            <div className="flex items-center gap-2">
              {(() => {
                const StatusIcon = statusIcons[status] ?? FileText;
                const statusColor = statusIconClasses[status] ?? "text-slate-500";
                return (
                  <Badge variant="outline" className="flex items-center gap-1.5 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                    <StatusIcon className={`h-3.5 w-3.5 ${statusColor}`} />
                    {status}
                  </Badge>
                );
              })()}

              {(() => {
                const meta = priorityMeta[priority];
                const PriorityIcon = meta.Icon;
                return (
                  <Badge variant="outline" className="flex items-center gap-1.5 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                    <PriorityIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                    {priority}
                  </Badge>
                );
              })()}

              {visit && (
                <Badge variant="outline" className="flex items-center gap-1.5 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
                  <User className="h-3.5 w-3.5 text-purple-500" />
                  Visita
                </Badge>
              )}

              <Button
                type="submit"
                form="ticket-form"
                size="sm"
                disabled={isRecording || isAttachmentProcessing}
                className="gap-2 h-8 text-xs ml-2"
              >
                {isEditMode ? <FileText className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                {isEditMode ? "Actualizar" : "Crear Ticket"}
              </Button>
            </div>
          }
        />
        <div className="mt-6">
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent
        className="w-[70vw] sm:max-w-[1024px] h-[95vh] overflow-hidden border-none bg-background p-0 shadow-2xl rounded-3xl"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="flex flex-row items-center justify-between gap-6 border-b bg-white px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TicketIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  {isEditMode ? "Modificar Ticket" : "Registrar Nuevo Ticket"}
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                  {isEditMode ? `Editando registro ${ticket?.id}` : "Apertura de caso de soporte"}
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-red-50 hover:text-red-500"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-50/20">
            {formContent}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
