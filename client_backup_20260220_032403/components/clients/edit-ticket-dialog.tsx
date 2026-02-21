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
import { ShinyText } from "@/components/ui/shiny-text";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { UnifiedAssignmentSearch } from "@/components/tickets/unified-assignment-search";
import dynamic from "next/dynamic";
import ReactCountryFlag from "react-country-flag";
import { useSearchParams } from "next/navigation";

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
  const [users, setUsers] = useState<{ id: string; name: string; email: string; avatar?: string }[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(ticket?.assignedTo ?? null);
  const [assignedGroupId, setAssignedGroupId] = useState<string | null>(ticket?.assignedGroupId ?? null);
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);

  const searchParams = useSearchParams();
  const queryClientId = searchParams?.get("clientId");

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
  const fileInputId = useId();

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

  const handleClientSelect = (client: Client) => {
    setClientName(client.name);
    setSelectedClientId(client.id);
    setHasContract(client.contract ?? false);
    setClientMenuOpen(false);
  };

  useEffect(() => {
    if (isOpen && !clientsLoaded) {
      fetchClients();
    }
  }, [isOpen, clientsLoaded, fetchClients]);

  useEffect(() => {
    if (queryClientId && !isEditMode && clientsLoaded) {
      const client = clients.find(c => String(c.id) === String(queryClientId));
      if (client) {
        handleClientSelect(client);
      }
    }
  }, [queryClientId, isEditMode, clientsLoaded, clients]);

  useEffect(() => {
    if (selectedClientId) {
      setClientTicketsLoading(true);
      fetch(`${API_URL}/tickets`)
        .then((res) => res.json())
        .then((data: any[]) => {
          const filtered = data
            .map((t) => ({
              ...t,
              createdAt: t.createdAt || new Date().toISOString(),
              status: t.status || "Nuevo",
            }))
            .filter(
              (t: Ticket) =>
                String(t.clientId) === String(selectedClientId)
            );
          filtered.sort(
            (a: Ticket, b: Ticket) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setClientTickets(filtered);
        })
        .catch((err) => console.error(err))
        .finally(() => setClientTicketsLoading(false));
    } else {
      setClientTickets([]);
    }
  }, [selectedClientId]);

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          signal: controller.signal,
        });
        if (!response.ok) {
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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
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
      toast.error("Seleccione un cliente.");
      return;
    }
    const visitFlag = status === "Visita";
    const noteAnnotation = notes.trim()
      ? { text: `<p>${notes.trim()}</p>`, createdAt: new Date().toISOString(), user: "Operador" }
      : null;

    const payload = {
      title,
      clientId: selectedClientId,
      priority,
      status,
      visit: visitFlag,
      amount,
      amountCurrency,
      annotations: noteAnnotation ? [noteAnnotation, ...annotations] : annotations,
      description,
      attachments: attachments.map(({ id, name, size, type, url }) => ({ id, name, size, type, url })),
      audioNotes: audioNotes.map(({ id, name, size, type, url, durationSeconds }) => ({ id, name, size, type, url, durationSeconds })),
      assignedTo,
      assignedGroupId,
    };

    try {
      const method = isEditMode ? "PUT" : "POST";
      const url = (isEditMode && ticket) ? `${API_URL}/tickets/${ticket.id}` : `${API_URL}/tickets`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error();
      const result: Ticket = await response.json();
      if (isEditMode && onTicketUpdated) onTicketUpdated(result);
      else if (onTicketCreated) onTicketCreated(result);
      toast.success(isEditMode ? "Ticket actualizado" : "Ticket creado");
      if (!isEditMode) resetForm();
      handleClose();
    } catch (error) {
      toast.error("Error al procesar el ticket");
    }
  };

  const getStatusBadgeVariant = (value: Ticket["status"]) => {
    if (value === "Resuelto") return "secondary";
    if (value === "Facturar") return "destructive";
    if (value === "Visita") return "outline";
    return "default";
  };

  const statusOptions: Ticket["status"][] = ["Nuevo", "Abierto", "En proceso", "Visita", "Resuelto", "Facturar", "Pagado"];
  const statusIcons: Record<string, any> = {
    Nuevo: FilePlus, Abierto: FileText, "En proceso": Loader2, Visita: User, Resuelto: CheckCircle2, Facturar: BadgeDollarSign, Pagado: CheckCircle2
  };
  const statusIconClasses: Record<string, string> = {
    Nuevo: "text-sky-500", Abierto: "text-blue-500", "En proceso": "text-amber-500", Visita: "text-purple-500", Resuelto: "text-emerald-600", Facturar: "text-orange-500", Pagado: "text-lime-600"
  };

  const priorityOptions: Ticket["priority"][] = ["Alta", "Media", "Baja"];
  const priorityMeta: Record<string, any> = {
    Alta: { Icon: AlertTriangle, color: "text-rose-500" },
    Media: { Icon: Activity, color: "text-amber-500" },
    Baja: { Icon: CheckCircle2, color: "text-emerald-600" },
  };

  const formContent = (
    <div id="ticket-form" className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 gap-3 overflow-hidden lg:grid-cols-[3fr_1fr]">
        <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: isPageVariant ? "auto" : "calc(90vh - 200px)" }}>
          <Card className="space-y-4 rounded-3xl border border-border/70 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider">Título del ticket</Label>
                <Input
                  className="h-11 rounded-2xl border-slate-200 font-bold"
                  placeholder="¿Qué está pasando?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider">Cliente</Label>
                <Popover open={clientMenuOpen} onOpenChange={setClientMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-11 justify-between rounded-2xl border-slate-200 font-bold">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        {clientName || "Seleccionar cliente..."}
                      </div>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0 rounded-3xl overflow-hidden shadow-2xl border-slate-100">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." className="h-11" />
                      <CommandList>
                        <CommandEmpty>No encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => (
                            <CommandItem key={c.id} value={c.name} onSelect={() => handleClientSelect(c)} className="h-12">
                              <div className="flex flex-col">
                                <span className="font-bold">{c.name}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">#{c.id}</span>
                              </div>
                              {selectedClientId === c.id && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {statusOptions.map(opt => (
                        <SelectItem key={opt} value={opt} className="rounded-xl">
                            <div className="flex items-center gap-2">
                                {React.createElement(statusIcons[opt] || FileText, { className: cn("h-4 w-4", statusIconClasses[opt]) })}
                                {opt}
                            </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Prioridad</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {priorityOptions.map(opt => (
                        <SelectItem key={opt} value={opt} className="rounded-xl">
                            <div className="flex items-center gap-2">
                                {React.createElement(priorityMeta[opt].Icon, { className: cn("h-4 w-4", priorityMeta[opt].color) })}
                                {opt}
                            </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2 space-y-1">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Asignación (Grupo o Usuario)</Label>
                <UnifiedAssignmentSearch 
                   users={users}
                   groups={groups}
                   assignedTo={assignedTo}
                   assignedGroupId={assignedGroupId}
                   onAssign={(type, value) => {
                       if (type === 'user') { setAssignedTo(value); setAssignedGroupId(null); }
                       else if (type === 'group') { setAssignedGroupId(value); setAssignedTo(null); }
                       else { setAssignedTo(null); setAssignedGroupId(null); }
                   }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Descripción del Incidente</Label>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full" type="button" onClick={isRecording ? handleStopRecording : handleStartRecording}>
                        {isRecording ? <MicOff className="h-4 w-4 text-rose-500 animate-pulse" /> : <Mic className="h-4 w-4 text-slate-400" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full" type="button" onClick={() => document.getElementById(fileInputId)?.click()}>
                        <Paperclip className="h-4 w-4 text-slate-400" />
                    </Button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-1">
                <TextEditor value={description} onChange={setDescription} placeholder="Escribe detalles aquí..." />
              </div>
            </div>
            <input id={fileInputId} type="file" className="hidden" multiple onChange={handleFileInputChange} />
          </Card>

          {attachments.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold truncate max-w-[150px]">{att.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleRemoveAttachment(att.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Card className="rounded-3xl border border-slate-200 p-6 space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">Nota interna (Opcional)</Label>
            <Textarea className="rounded-2xl border-slate-100 bg-slate-50/30" placeholder="Solo para el equipo técnico..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Card>
        </div>

        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/30">
          <div className="px-6 py-4 border-b border-slate-200 bg-white/50 backdrop-blur">
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Historial Reciente</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {clientTicketsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /> : clientTickets.length > 0 ? (
              clientTickets.map(t => (
                <Link key={t.id} href={`/tickets/${t.id}`} className="block p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1 mb-2">{t.title}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-[9px] font-bold uppercase border-none px-1.5 h-4", getStatusTone(t.status))}>{t.status}</Badge>
                    <span className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-slate-300">
                <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Sin antecedentes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function getStatusTone(s: string) {
      const lower = s.toLowerCase();
      if (lower.includes('resuelto') || lower.includes('pago')) return "bg-emerald-100 text-emerald-700";
      if (lower.includes('proceso') || lower.includes('abierto')) return "bg-blue-100 text-blue-700";
      return "bg-slate-100 text-slate-500";
  }

  if (isPageVariant) {
    return (
      <div className="min-h-screen p-6 bg-slate-50/50">
        <PageHeader
          title={<ShinyText size="3xl" weight="bold">{isEditMode ? "Editar Ticket" : "Nuevo Ticket"}</ShinyText>}
          subtitle="Registra la labor técnica y asigna responsables."
          backHref="/tickets"
          leadingIcon={<div className="p-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100"><TicketIcon className="h-6 w-6 text-white" /></div>}
          breadcrumbs={[
            { label: "Tickets", href: "/tickets", icon: <TicketIcon className="h-3 w-3 text-slate-500" /> },
            { label: isEditMode ? "Editar" : "Nuevo", icon: <FilePlus className="h-3 w-3 text-slate-500" /> },
          ]}
          breadcrumbAction={
            <Button onClick={handleSubmit} disabled={isAttachmentProcessing} className="h-10 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-100">
              {isEditMode ? "Actualizar Registro" : "Crear Ticket"}
            </Button>
          }
        />
        <div className="mt-8">{formContent}</div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[1400px] h-[90vh] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="flex flex-col h-full bg-white">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight">{isEditMode ? "Editar Ticket" : "Nuevo Ticket"}</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">Panel de gestión de incidencias</DialogDescription>
                  </div>
                  <DialogClose asChild><Button variant="ghost" size="icon" className="rounded-full">×</Button></DialogClose>
              </div>
              <div className="flex-1 overflow-hidden p-8">{formContent}</div>
              <div className="px-8 py-4 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                <Button onClick={handleSubmit} className="h-11 px-10 rounded-2xl font-bold bg-indigo-600 shadow-lg shadow-indigo-100">
                    {isEditMode ? "Guardar Cambios" : "Emitir Ticket"}
                </Button>
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
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
