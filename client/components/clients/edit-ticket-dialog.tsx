// components/tickets/edit-ticket-dialog.tsx

"use client";



import React, { useEffect, useMemo, useRef, useState, useId } from "react";

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

  BadgeDollarSign,

  FilePlus,

  FileText,

  Loader2,

  Mic,

  MicOff,

  Paperclip,

  PlayCircle,

  Trash2,

  User,

} from "lucide-react";

import { toast } from "sonner";

import {
  Ticket,
  TicketAttachment,
  TicketAudioNote,
} from "@/types/ticket";

import { Client } from "@/types/client";
import { API_URL } from "@/lib/http";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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



  const initialState = useMemo(() => {
    const isVisitStatus =
      typeof ticket?.status === "string" &&
      ticket.status.toLowerCase() === "visita";

    return {
      title: ticket?.title ?? "",
      clientName: ticket?.clientName ?? "",
      selectedClientId: ticket?.clientId ?? null,
      status: ticket?.status ?? "Nuevo",
      priority: ticket?.priority ?? "Media",
      amount: ticket?.amount ?? 0,
      visit: isVisitStatus || Boolean(ticket?.visit),
      annotations: Array.isArray(ticket?.annotations)
        ? ticket.annotations
        : [],
      description: ticket?.description ?? "",
      attachments: Array.isArray(ticket?.attachments)
        ? (ticket.attachments as TicketAttachment[])
        : [],
      audioNotes: Array.isArray(ticket?.audioNotes)
        ? (ticket.audioNotes as TicketAudioNote[])
        : [],
    };
  }, [ticket]);



  const [title, setTitle] = useState(initialState.title);

  const [clientName, setClientName] = useState(initialState.clientName);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(

    initialState.selectedClientId

  );

  const [status, setStatus] = useState<Ticket["status"]>(initialState.status);

  const [priority, setPriority] = useState<Ticket["priority"]>(

    initialState.priority

  );

  const [amount, setAmount] = useState(initialState.amount);

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

  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  const fileInputId = useId();



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

      setStatus(initialState.status);

      setPriority(initialState.priority);

      setAmount(initialState.amount);

      setVisit(initialState.visit);

      setAnnotations(initialState.annotations);

      setDescription(initialState.description);

      setAttachments(initialState.attachments);

      setAudioNotes(initialState.audioNotes);

      setNotes("");

    }

  }, [initialState, isEditMode]);



  const resetForm = () => {

    setTitle("");

    setClientName("");

    setSelectedClientId(null);

    setStatus("Nuevo");

    setPriority("Media");

    setAmount(0);

    setVisit(false);

    setNotes("");

    setAnnotations([]);

    setDescription("");

    setAttachments([]);

    setAudioNotes([]);

  };

  const titleText = isEditMode && ticket
    ? `Editar Ticket #${ticket.id}`
    : "Crear Ticket";
  const descriptionText = isEditMode
    ? "Actualice la información del ticket y registre la actividad relevante."
    : "Complete la información del ticket antes de guardarlo.";

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



  useEffect(() => {

    if (!isPageVariant && !isOpen) {

      if (!isEditMode) {

        resetForm();

      }

      return;

    }



    const fetchClients = async () => {

      try {

        setClientsLoading(true);

        const response = await fetch(`${API_URL}/clients`);

        if (!response.ok) {

          throw new Error("Error al obtener los clientes");

        }

        const data = await response.json();

        setClients(data);

      } catch (error) {

        console.error("Error fetching clients:", error);

        toast.error("No se pudieron cargar los clientes.");

      } finally {

        setClientsLoading(false);

      }

    };



    fetchClients();

  }, [isOpen, isEditMode, isPageVariant]);

  const filteredClients = useMemo(() => {
    const query = clientName.trim().toLowerCase();
    if (!query) {
      return clients;
    }
    return clients.filter((client) => {
      const name = client.name?.toLowerCase() ?? "";
      const alias = client.alias?.toLowerCase() ?? "";
      return name.includes(query) || alias.includes(query);
    });
  }, [clients, clientName]);



  const fileToDataUrl = (file: File) =>

    new Promise<string>((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);

      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(file);

    });



  const addAttachmentsFromFiles = async (files: FileList | File[]) => {

    const incomingFiles = Array.from(files).filter((file) => file.size > 0);

    if (!incomingFiles.length) {

      return;

    }

    setIsAttachmentProcessing(true);

    try {

      const processed = await Promise.all(

        incomingFiles.map(async (file) => {

          const dataUrl = await fileToDataUrl(file);

          const previewUrl = URL.createObjectURL(file);

          attachmentObjectUrls.current.push(previewUrl);

          return {

            id: crypto.randomUUID(),

            name: file.name,

            size: file.size,

            type: file.type,

            dataUrl,

            url: previewUrl,

          } as TicketAttachment;

        })

      );

      setAttachments((prev) => [...prev, ...processed]);

      logAttachmentNote(processed.map((attachment) => attachment.name));

    } catch (error) {

      console.error("Error al procesar adjuntos:", error);

      toast.error("No se pudieron adjuntar algunos archivos.");

    } finally {

      setIsAttachmentProcessing(false);

    }

  };  const logAttachmentNote = (names: string[]) => {

    if (!names.length) {

      return;

    }

    setAnnotations((prev) => [

      ...prev,

      {

        text: `<p><strong>Adjuntos:</strong> ${names.join(", ")}</p>`,

        createdAt: new Date().toISOString(),

      },

    ]);

  };

  const handleFileInputChange = async (

    event: React.ChangeEvent<HTMLInputElement>

  ) => {

    if (event.target.files?.length) {

      await addAttachmentsFromFiles(event.target.files);

      event.target.value = "";

    }

  };



  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {

    event.preventDefault();

    if (event.dataTransfer.files?.length) {

      await addAttachmentsFromFiles(event.dataTransfer.files);

    }

  };



  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {

    event.preventDefault();

  };



  const handleRemoveAttachment = (attachmentId: string) => {

    setAttachments((prev) => {

      const target = prev.find((attachment) => attachment.id === attachmentId);

      if (target?.url && target.url.startsWith("blob:")) {

        URL.revokeObjectURL(target.url);

        attachmentObjectUrls.current = attachmentObjectUrls.current.filter(

          (url) => url !== target.url

        );

      }

      return prev.filter((attachment) => attachment.id !== attachmentId);

    });

  };

  const openFilePicker = () => {

    if (typeof document === "undefined") {

      return;

    }

    const input = document.getElementById(fileInputId) as HTMLInputElement | null;

    input?.click();

  };



  const handleStartRecording = async () => {

    if (isRecording) {

      return;

    }

    if (

      typeof navigator === "undefined" ||

      !navigator.mediaDevices?.getUserMedia

    ) {

      toast.error("La grabaciÃÂ³n de audio no estÃÂ¡ disponible en este navegador.");

      return;

    }

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      audioChunksRef.current = [];



      recorder.ondataavailable = (event) => {

        if (event.data.size > 0) {

          audioChunksRef.current.push(event.data);

        }

      };



      recorder.onstop = () => {

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        const objectUrl = URL.createObjectURL(blob);

        audioObjectUrls.current.push(objectUrl);



        const reader = new FileReader();

        reader.onloadend = () => {

          setAudioNotes((prev) => [

            ...prev,

            {

              id: crypto.randomUUID(),

              createdAt: new Date().toISOString(),

              dataUrl: reader.result as string,

              url: objectUrl,

            },

          ]);

          logAudioNote(new Date().toLocaleString());

        };

        reader.readAsDataURL(blob);

        setIsRecording(false);

        mediaRecorderRef.current = null;

        stream.getTracks().forEach((track) => track.stop());

      };



      recorder.start();

      setIsRecording(true);

    } catch (error) {

      console.error("No se pudo iniciar la grabaciÃÂ³n:", error);

      toast.error("No se pudo acceder al micrÃÂ³fono.");

    }

  };



  const logAudioNote = (timestamp: string) => {

    setAnnotations((prev) => [

      ...prev,

      {

        text: `<p><strong>Nota de voz:</strong> ${timestamp}</p>`,

        createdAt: new Date().toISOString(),

      },

    ]);

  };

  const handleStopRecording = () => {

    const recorder = mediaRecorderRef.current;

    if (!recorder) {

      return;

    }

    if (recorder.state !== "inactive") {

      recorder.stop();

    }

    setIsRecording(false);

  };



  const handleRemoveAudioNote = (noteId: string) => {

    setAudioNotes((prev) => {

      const target = prev.find((note) => note.id === noteId);

      if (target?.url && target.url.startsWith("blob:")) {

        URL.revokeObjectURL(target.url);

        audioObjectUrls.current = audioObjectUrls.current.filter(

          (url) => url !== target.url

        );

      }

      return prev.filter((note) => note.id !== noteId);

    });

  };



  const handlePlayAudioNote = (source?: string) => {

    if (!source) {

      toast.error("No encontramos el archivo de audio.");

      return;

    }

    try {

      if (audioPlaybackRef.current) {

        audioPlaybackRef.current.pause();

      }

      const audio = new Audio(source);

      audioPlaybackRef.current = audio;

      audio.play().catch(() => {

        toast.error("No se pudo reproducir la nota de voz.");

      });

    } catch (error) {

      console.error("Error al reproducir la nota:", error);

      toast.error("No se pudo reproducir la nota de voz.");

    }

  };



  useEffect(() => {

    if (!selectedClientId) {

      return;

    }



    const current = clients.find((client) => client.id === selectedClientId);

    if (current) {

      setClientName(current.name);

    }

  }, [clients, selectedClientId]);



  const handleAddAnnotation = () => {

    if (!notes.trim()) {

      return;

    }

    const newAnnotation = {

      text: notes.trim(),

      createdAt: new Date().toISOString(),

    };

    setAnnotations((prev) => [...prev, newAnnotation]);

    setNotes("");

  };

  const handleClientInputChange = (value: string) => {

    setClientName(value);

    setClientMenuOpen(true);

    const match = clients.find(

      (client) => client.name?.toLowerCase() === value.toLowerCase()

    );

    setSelectedClientId(match?.id ?? null);

  };

  const handleSelectClient = (client: Client) => {

    setClientName(client.name);

    setSelectedClientId(client.id);

    setClientMenuOpen(false);

  };

  const handleRemoveAnnotation = (index: number) => {

    setAnnotations((prev) => prev.filter((_, i) => i !== index));

  };



  const handleDialogChange = (open: boolean) => {

    if (isPageVariant) {

      return;

    }

    setIsOpen(open);

    if (!open && !isEditMode) {

      resetForm();

    }

    if (!open && onClose) {

      onClose();

    }

  };



  const handleExit = () => {

    if (!isPageVariant) {

      setIsOpen(false);

    }

    if (onClose) {

      onClose();

    }

    setClientMenuOpen(false);

  };



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();



    if (!clientName.trim()) {

      toast.error("Seleccione o escriba un cliente para continuar.");

      return;

    }



    const visitFlag = status === "Visita";



    const sanitizeAttachments = () =>
      attachments.map(({ id, name, size, type, url }) => ({
        id,
        name,
        size,
        type,
        url,
      }));

    const sanitizeAudioNotes = () =>
      audioNotes.map(({ id, createdAt, url, durationSeconds }) => ({
        id,
        createdAt,
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

      annotations,

      description,

      attachments: sanitizeAttachments(),

      audioNotes: sanitizeAudioNotes(),

    };



    if (isEditMode) {

      if (!ticket || !onTicketUpdated) {

        toast.error("No se pudo actualizar el ticket.");

        return;

      }



      try {

        const response = await fetch(

          `${API_URL}/tickets/${ticket.id}`,

          {

            method: "PUT",

            headers: {

              "Content-Type": "application/json",

            },

            body: JSON.stringify(payload),

          }

        );



        if (!response.ok) {

          const errorData =

            (await response.json().catch(() => null)) ?? null;

          const message =

            errorData?.message ??

            `Error ${response.status} al actualizar el ticket`;

          throw new Error(message);

        }



        const updatedTicket = await response.json();

        onTicketUpdated(updatedTicket);

        toast.success("Ticket actualizado exitosamente.");

        handleExit();

      } catch (error) {

        console.error("Error updating ticket:", error);

        toast.error(

          error instanceof Error

            ? error.message

            : "No se pudo actualizar el ticket."

        );

      }

      return;

    }



    if (!onTicketCreated) {

      toast.error("No se pudo crear el ticket.");

      return;

    }



    if (!selectedClientId) {

      toast.error("Seleccione un cliente de la lista para asociarlo al ticket.");

      return;

    }



    try {

      const response = await fetch(`${API_URL}/tickets`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify(payload),

      });



      if (!response.ok) {

        const errorData =

          (await response.json().catch(() => null)) ?? null;

        const message =

          errorData?.message ??

          `Error ${response.status} al crear el ticket`;

        throw new Error(message);

      }



      const createdTicket = await response.json();

      onTicketCreated(createdTicket);

      toast.success("Ticket creado con éxito");

      handleExit();

      resetForm();

    } catch (error) {

      console.error("Error creating ticket:", error);

      const localTicket: Ticket = {

        id: crypto.randomUUID(),

        title,

        clientName,

        clientId: selectedClientId ?? undefined,

        status,

        priority,

        createdAt: new Date().toISOString(),

        amount,

        visit: visitFlag,

        annotations,

        description,

        attachments,

        audioNotes,

      };

      onTicketCreated(localTicket);

      toast.warning(

        "No se pudo contactar al servidor. Guardamos este ticket de forma local."

      );

      handleExit();

      resetForm();

    }

  };



  const formContent = (

    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">

      <div className="grid flex-1 gap-10 overflow-hidden lg:grid-cols-[3.8fr_1fr]">

        <div

          className="space-y-6 overflow-y-auto pr-1"

          style={{ maxHeight: "calc(90vh - 200px)" }}

        >

          <Card className="space-y-6 rounded-2xl border border-border/70 bg-background/80 p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  Ficha del ticket
                </p>
                <p className="text-sm text-muted-foreground">
                  Gestiona los campos clave antes de registrar la labor.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant={getStatusBadgeVariant(status)} className="text-sm">
                {status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(priority)} className="text-sm">
                {priority}
              </Badge>
              {visit && (
                <Badge variant="outline" className="text-sm">
                  Visita
                </Badge>
              )}
            </div>


            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="ticket-client" className="flex items-center gap-1 text-sm font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Cliente
                </Label>
                <Popover open={clientMenuOpen} onOpenChange={setClientMenuOpen}>
                  <PopoverTrigger asChild>
                    <Input
                      id="ticket-client"
                      placeholder="Selecciona o escribe un cliente..."
                      value={clientName}
                      onChange={(event) => handleClientInputChange(event.target.value)}
                      onFocus={() => setClientMenuOpen(true)}
                      disabled={clientsLoading}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-xs p-0 mt-1">
                    <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border bg-background shadow-xl">
                      {filteredClients.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground">
                          No se encontraron clientes.
                        </p>
                      ) : (
                        filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-primary/10"
                            onClick={() => handleSelectClient(client)}
                          >
                            <span>{client.name}</span>
                            {client.alias && (
                              <span className="text-xs text-muted-foreground">
                                {client.alias}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-title" className="flex items-center gap-1 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Título
                </Label>
                <Input
                  id="ticket-title"
                  placeholder="Describe brevemente el problema"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-status" className="flex items-center gap-1 text-sm font-semibold">
                  Estado
                </Label>
                <Select
                  value={status}
                  onValueChange={(value: Ticket["status"]) => setStatus(value)}
                >
                  <SelectTrigger id="ticket-status">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Abierto">Abierto</SelectItem>
                    <SelectItem value="En proceso">En proceso</SelectItem>
                    <SelectItem value="Visita">Visita</SelectItem>
                    <SelectItem value="Resuelto">Resuelto</SelectItem>
                    <SelectItem value="Facturar">Facturar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="ticket-priority" className="flex items-center gap-1 text-sm font-semibold">
                  Prioridad
                </Label>
                <Select
                  value={priority}
                  onValueChange={(value: Ticket["priority"]) => setPriority(value)}
                >
                  <SelectTrigger id="ticket-priority">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-amount" className="flex items-center gap-1 text-sm font-semibold">
                  <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                  Monto estimado
                </Label>
                <Input
                  id="ticket-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-sm font-semibold">
                  Visita
                </Label>
                <Button
                  type="button"
                  variant={visit ? "default" : "outline"}
                  size="sm"
                  className="justify-center gap-2"
                  onClick={() => setVisit((prev) => !prev)}
                >
                  <Mic className="h-4 w-4" />
                  {visit ? "Visita asignada" : "Marcar como visita"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {visit
                    ? "Se registrará la atención in situ."
                    : "Disponible para atención remota."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="ticket-description" className="text-sm font-semibold">
                Descripción detallada
              </Label>
              <Textarea
                id="ticket-description"
                rows={6}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe el contexto, pasos y resultados esperados."
              />
            </div>
            <div className="space-y-3 border-t border-border/40 pt-4">
              <Label htmlFor="ticket-note" className="text-sm font-semibold">
                Registrar una nota
              </Label>
              <Textarea
                id="ticket-note"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Escribe una actualización, recordatorio o instrucción."
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNotes("")}
                >
                  Limpiar nota
                </Button>
                <Button type="button" size="sm" onClick={handleAddAnnotation}>
                  Guardar nota
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-6 rounded-2xl border border-border/70 bg-background/80 p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  Adjuntos y notas de voz
                </p>
                <p className="text-sm text-muted-foreground">
                  Los archivos se adjuntan como notas y quedan disponibles para el timeline.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="rounded-full border-slate-300 bg-white/70">
                {attachments.length} archivo{attachments.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-300 bg-white/70">
                {audioNotes.length} nota{audioNotes.length === 1 ? "" : "s"} de voz
              </Badge>
            </div>
            <label
              htmlFor={fileInputId}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 p-5 text-center transition hover:border-primary"
            >
              <input
                id={fileInputId}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileInputChange}
              />
              <p className="text-sm font-semibold leading-snug text-muted-foreground">
                Arrastra archivos o toca para explorarlos
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, imágenes, contratos o cualquier evidencia relevante
              </p>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  openFilePicker();
                }}
              >
                <FilePlus className="h-4 w-4" />
                Seleccionar archivos
              </Button>
              {isAttachmentProcessing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando archivos...
                </div>
              )}
            </label>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Adjuntos registrados: {attachments.length}{" "}
                {attachments.length === 1 ? "archivo" : "archivos"}.
              </p>
              <p>
                Grabaciones registradas: {audioNotes.length}{" "}
                {audioNotes.length === 1 ? "nota" : "notas"}.
              </p>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2 text-sm text-foreground">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>{attachment.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  Notas de voz
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isRecording ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => (isRecording ? handleStopRecording() : handleStartRecording())}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Detener grabación
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Grabar nota
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                {audioNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay grabaciones. Pulsa “Grabar nota” para registrar audio.
                  </p>
                ) : (
                  audioNotes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => note.url && handlePlayAudioNote(note.url)}
                          disabled={!note.url}
                        >
                          <PlayCircle className="h-5 w-5 text-primary" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAudioNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

        </div>

        <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 p-6 shadow-sm lg:h-full">

          <div>

            <p className="text-sm font-semibold">Timeline del ticket</p>

            <p className="text-xs text-muted-foreground">

              {annotations.length} {annotations.length === 1 ? "registro" : "registros"}

            </p>

          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">

            {annotations.length === 0 ? (

              <p className="text-sm text-muted-foreground">

                Todavía no se registraron notas para este ticket.

              </p>

            ) : (

              <ol className="relative space-y-6 border-l border-border/70 pl-6">

                {annotations.map((annotation, index) => (

                  <li

                    key={`${annotation.createdAt}-${index}`}

                    className="relative"

                  >

                    <span className="absolute -left-[9px] mt-1 h-3 w-3 rounded-full border border-background bg-primary"></span>

                    <p className="text-xs uppercase text-muted-foreground">

                      {new Date(annotation.createdAt).toLocaleString()}

                    </p>

                    <div

                      className="text-sm leading-relaxed"

                      dangerouslySetInnerHTML={{

                        __html: annotation.text || "",

                      }}

                    />

                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleRemoveAnnotation(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                  </li>

                ))}

              </ol>

            )}

          </div>

        </Card>

      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t px-8 py-4">

        <Button type="submit">

          {isEditMode ? "Guardar cambios" : "Crear ticket"}

        </Button>

      </div>

    </form>

  )



  if (isPageVariant) {

    return (

      <div className="mx-auto flex w-full max-w-8xl flex-col gap-8 px-6 py-8 lg:px-0">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="text-2xl font-semibold">{titleText}</h1>

            <p className="text-sm text-muted-foreground">{descriptionText}</p>

          </div>

          {onClose && (

            <Button type="button" variant="outline" onClick={handleExit}>

              Volver

            </Button>

          )}

        </div>

        {formContent}

      </div>

    )

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

                {titleText}

              </DialogTitle>

              <DialogDescription className="text-base text-muted-foreground">

                {descriptionText}

              </DialogDescription>

            </div>

            <DialogClose asChild>

              <button

                type="button"

                aria-label="Cerrar"

                className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"

                onClick={handleExit}

              >

                &times;

              </button>

            </DialogClose>

          </DialogHeader>

          {formContent}

        </div>

      </DialogContent>

    </Dialog>

  )

}

