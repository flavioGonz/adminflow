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
} from "lucide-react";
import { cn } from "@/lib/utils";
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
}: EditTicketDialogProps) {
  const isEditMode = mode === "edit";
  const isPageVariant = variant === "page";
  const [isOpen, setIsOpen] = useState(isPageVariant);
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
  const [clientName, setClientName] = useState(initialState.clientName);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialState.selectedClientId
  );
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
          id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
      setAttachments(initialState.attachments);
      setAudioNotes(initialState.audioNotes);
      setAssignedTo(initialState.assignedTo);
      setAssignedGroupId(initialState.assignedGroupId);
      setNotes("");
    }
  }, [isEditMode, initialState]);

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
    Visita: User,
    Resuelto: BadgeDollarSign,
    Facturar: BadgeDollarSign,
    Pagado: BadgeDollarSign,
  };

  const statusIconClasses: Record<Ticket["status"], string> = {
    Nuevo: "text-sky-500",
    Abierto: "text-blue-500",
    "En proceso": "text-amber-500",
    Visita: "text-purple-500",
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

  const formContent = (
    <form id="ticket-form" onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[3fr_1fr]">
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: isPageVariant ? "auto" : "calc(90vh - 200px)" }}>
          <Card className="space-y-2 rounded-2xl border border-border/70 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-base font-semibold text-foreground">Ficha del ticket</p>
                  <p className="text-sm text-muted-foreground">
                    Gestiona los campos clave antes de registrar la labor.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Switch
                    checked={visit}
                    onCheckedChange={(checked) => setVisit(Boolean(checked))}
                  />
                  <span>Visita</span>
                </div>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
              <div className="space-y-0.5">
                <Label htmlFor="ticket-title" className="flex items-center gap-2 text-sm font-semibold">
                  <TicketIcon className="h-4 w-4 text-muted-foreground" />
                  Título del ticket
                </Label>
                <Input
                  id="ticket-title"
                  placeholder="Ej: Problema con conexión VPN"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Cliente
                  {hasContract && (
                    <Badge variant="outline" className="ml-2 border-green-500 text-green-600 bg-green-50 h-5 px-1.5 text-[10px]">
                      Con Contrato
                    </Badge>
                  )}
                </Label>
                <Popover open={clientMenuOpen} onOpenChange={setClientMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientMenuOpen}
                      className="w-full justify-between font-normal"
                    >
                      {clientName ? clientName : "Seleccionar cliente..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={(currentValue) => {
                                handleClientSelect(client);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col text-left">
                                <div className="flex items-center gap-2">
                                  <span>{client.name}</span>
                                  {client.contract && (
                                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 h-4 px-1 text-[9px]">
                                      Contrato
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">#{client.id}</span>
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
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                  Monto estimado
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={amountCurrency}
                    onValueChange={(val) => setAmountCurrency(val as "UYU" | "USD")}
                  >
                    <SelectTrigger className="w-[140px] text-left">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            svg
                            countryCode={amountCurrency === "USD" ? "US" : "UY"}
                            className="h-4 w-5"
                            aria-label={amountCurrency}
                          />
                          <span className="text-sm font-semibold">{amountCurrency}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UYU">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag svg countryCode="UY" className="h-4 w-5" aria-label="UYU" />
                          <span>UYU</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USD">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag svg countryCode="US" className="h-4 w-5" aria-label="USD" />
                          <span>USD</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="ticket-amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                  />
                </div>
              </div>
            )}
            <div className="grid gap-2 lg:grid-cols-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Ticket["status"])}>
                  <SelectTrigger>
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
                            <span>{option}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Grupo asignado</Label>
                <Select
                  value={assignedGroupId ?? "none"}
                  onValueChange={(value) =>
                    setAssignedGroupId(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {assignedGroupId
                            ? groups.find((group) => group._id === assignedGroupId)?.name ||
                              "Grupo"
                            : "Sin grupo"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Sin grupo</span>
                      </div>
                    </SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group._id} value={group._id}>
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
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as Ticket["priority"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => {
                      const meta = priorityMeta[option];
                      const Icon = meta.Icon;
                      return (
                        <SelectItem key={option} value={option}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${meta.color}`} />
                            <span>{option}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Asignado a</Label>
                <Select value={assignedTo || "unassigned"} onValueChange={(value) => setAssignedTo(value === "unassigned" ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar">
                      {assignedTo ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const user = users.find((u) => u.email === assignedTo);
                            if (!user) return assignedTo;
                            const avatarUrl = (user as any).avatar;
                            return (
                              <>
                                {avatarUrl ? (
                                  <img
                                    src={
                                      avatarUrl.startsWith("http")
                                        ? avatarUrl
                                        : `${API_URL.replace('/api', '')}${avatarUrl}`
                                    }
                                    alt={user.name}
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate">{user.name}</span>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        "Sin asignar"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.email}>
                        <div className="flex items-center gap-2">
                          {user.avatar ? (
                            <img
                              src={
                                user.avatar.startsWith("http")
                                  ? user.avatar
                                  : `${API_URL.replace('/api', '')}${user.avatar}`
                              }
                              alt={user.name}
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{user.name} ({user.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="ticket-description" className="text-sm font-semibold">
                  Descripción
                </Label>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <button
                    type="button"
                    aria-label={isRecording ? "Detener grabación" : "Grabar nota de voz"}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/10 text-muted-foreground transition hover:border-primary"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4 text-red-500" />
                    ) : (
                      <Mic className="h-4 w-4 text-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Adjuntar archivos"
                    onClick={() => document.getElementById(fileInputId)?.click()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/10 text-muted-foreground transition hover:border-primary"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-border/80 bg-white">
                <TextEditor value={description} onChange={setDescription} placeholder="Describe el incidente con detalle. Puedes subir imágenes." />
              </div>
            </div>
            <input
              id={fileInputId}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
            />
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
                    className="text-destructive"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Card className="space-y-2 rounded-2xl border border-border/70 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Notas internas</p>
            </div>
            <Textarea
              placeholder="Notas internas para el equipo."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

          </Card>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Historial del Cliente</p>
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            {clientsLoading || clientTicketsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : clientTickets.length > 0 ? (
              <div className="divide-y divide-border/50">
                {clientTickets.map((t) => {
                  const StatusIcon = statusIcons[t.status] || FileText;
                  const statusColor = statusIconClasses[t.status] || "text-slate-500";

                  return (
                    <Link
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="group flex flex-col gap-2 p-3 transition-all hover:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 overflow-hidden">
                          <div className={`mt-0.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-inset ring-slate-200`}>
                            <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                          </div>
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors" title={t.title}>
                              {t.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-8">
                        <Badge variant={getStatusBadgeVariant(t.status)} className="h-4 px-1.5 text-[10px] font-normal">
                          {t.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground opacity-70">#{t.id.slice(0, 8)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                <FileText className="mb-2 h-8 w-8 opacity-20" />
                <p className="text-xs">No hay tickets previos</p>
              </div>
            )}
          </div>
        </div>
      </div>
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
        className="w-[96vw] max-w-[1500px] overflow-hidden border border-border/50 bg-background p-0"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex h-[90vh] flex-col">
          <DialogHeader className="flex flex-row items-start justify-between gap-6 border-b px-8 py-6">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-semibold">
                {isEditMode ? "Editar ticket" : "Nuevo ticket"}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {isEditMode
                  ? "Actualiza los datos del ticket."
                  : "Completa la información para registrar un nuevo ticket."}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
                onClick={handleClose}
              >
                &times;
              </button>
            </DialogClose>
          </DialogHeader>
          {formContent}
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
