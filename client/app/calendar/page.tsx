"use client";

import { DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import { useEffect, useMemo, useState, useRef } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/config";
import { Client } from "@/types/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Shadcn Combobox for client selection
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarPlus,
  CircleDollarSign,
  Clock4,
  Edit3,
  FileBadge2,
  Lock,
  MapPin,
  Save,
  Ticket,
  Trash2,
  X,
  Calendar,
  ArrowRight,
  Maximize2,
  Minimize2,
  User2,
  Users
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { listUsers } from "@/lib/api-users-v2";
import { User } from "@/types/user";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  sourceType?: "ticket" | "payment" | "contract" | "manual" | string;
  sourceId?: string | null;
  clientId?: string | null;
  assignedTo?: string | null;
  assignedGroup?: string | null;
  locked?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type DraftEvent = {
  title: string;
  location: string;
  start: string;
  end: string;
};

type Group = {
  _id: string;
  name: string;
  slug: string;
};

const mapEventRow = (row: any): CalendarEvent => ({
  id: String(row.id),
  title: row.title,
  start: row.start,
  end: row.end ?? undefined,
  location: row.location ?? undefined,
  sourceType: row.sourceType ?? row.source_type ?? "manual",
  sourceId: row.sourceId ?? row.source_id ?? null,
  clientId: row.clientId ?? row.client_id ?? null,
  assignedTo: row.assignedTo ?? row.ticket_assigned_to ?? null,
  assignedGroup: row.assignedGroup ?? row.ticket_assigned_group ?? null,
  locked: Boolean(row.locked),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const emptyDraft: DraftEvent = { title: "", location: "", start: "", end: "" };

const formatDateTimeLocal = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create");
  const [draft, setDraft] = useState<DraftEvent>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filters, setFilters] = useState({
    tickets: true,
    contracts: true,
    payments: true,
    manual: true
  });

  const { toast } = useToast();
  const router = useRouter();

  const getOriginLabel = (sourceType?: CalendarEvent["sourceType"]) => {
    if (sourceType === "ticket") return "Ticket";
    if (sourceType === "payment") return "Pago";
    if (sourceType === "contract") return "Contrato";
    return "Origen";
  };

  const loadEvents = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/calendar-events", { signal });
      if (!response.ok) throw new Error("No se pudieron cargar los eventos.");
      const payload = await response.json();
      if (!Array.isArray(payload)) return;
      setEvents(payload.map(mapEventRow));
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadEvents(controller.signal);
    return () => controller.abort();
  }, []);

  // Load clients, users and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resClients, resUsers, resGroups] = await Promise.all([
          fetch(`${API_URL}/clients`),
          listUsers(),
          fetch("/api/groups")
        ]);

        if (resClients.ok) setClients(await resClients.json());
        if (Array.isArray(resUsers)) {
          console.log("Calendar loaded users:", resUsers);
          setUsers(resUsers);
        }
        if (resGroups.ok) setGroups(await resGroups.json());

      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const openModal = (mode: "create" | "edit" | "view", values: Partial<DraftEvent> & { id?: string }) => {
    setModalMode(mode);
    setEditingId(values.id ?? null);
    const locked = mode === "edit" || mode === "view" ? Boolean((events.find((ev) => ev.id === values.id) as CalendarEvent | undefined)?.locked) : false;
    setEditingLocked(locked);
    setDraft({
      title: values.title ?? "",
      location: values.location ?? "",
      start: formatDateTimeLocal(values.start) ?? "",
      end: formatDateTimeLocal(values.end ?? values.start) ?? "",
    });
    setModalOpen(true);
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    openModal("create", {
      start: selectInfo.startStr,
      end: selectInfo.endStr || selectInfo.startStr,
    });
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (info: EventClickArg) => {
    const sourceLocked = info.event.extendedProps?.locked;
    if (sourceLocked) {
      openModal("view", {
        id: info.event.id,
        title: info.event.title,
        location: info.event.extendedProps?.location ?? "",
        start: info.event.startStr,
        end: info.event.endStr || info.event.startStr,
      });
      return;
    }
    openModal("edit", {
      id: info.event.id,
      title: info.event.title,
      location: info.event.extendedProps?.location ?? "",
      start: info.event.startStr,
      end: info.event.endStr || info.event.startStr,
    });
    setEditingLocked(Boolean(sourceLocked));
  };

  const handleEventChange = async (changeInfo: EventChangeArg) => {
    if (changeInfo.event.extendedProps?.locked) {
      changeInfo.revert?.();
      toast({
        title: "Evento protegido",
        description: `Solo puede modificarse desde ${getOriginLabel(changeInfo.event.extendedProps?.sourceType)}.`,
      });
      return;
    }
    const payload = {
      start: changeInfo.event.startStr,
      end: changeInfo.event.endStr || changeInfo.event.startStr,
    };
    const response = await fetch(`/api/calendar-events/${changeInfo.event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    const updated = mapEventRow(await response.json());
    setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
  };

  const handleModalSubmit = async () => {
    if (modalMode === "view") {
      setModalOpen(false);
      return;
    }
    if (!draft.title.trim()) return;
    if (!draft.start || !draft.end) {
      toast({ title: "Falta horario", description: "Selecciona inicio y fin del evento", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      title: draft.title.trim(),
      location: draft.location.trim() || undefined,
      start: draft.start,
      end: draft.end || draft.start,
      sourceType: modalMode === "create" ? "manual" : events.find((e) => e.id === editingId)?.sourceType ?? "manual",
      locked: modalMode === "create" ? false : events.find((e) => e.id === editingId)?.locked ?? false,
    };
    if (selectedClientId) payload.clientId = selectedClientId;
    try {
      if (modalMode === "create") {
        const response = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast({ title: "Error", description: "No se pudo crear el evento", variant: "destructive" });
          return;
        }
        const created = mapEventRow(await response.json());
        setEvents((prev) => [...prev, created]);
        toast({ title: "Evento creado", description: draft.title });
      } else if (editingId) {
        const response = await fetch(`/api/calendar-events/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
          return;
        }
        const updated = mapEventRow(await response.json());
        setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
        toast({ title: "Evento actualizado", description: draft.title });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/calendar-events/${editingId}`, { method: "DELETE" });
      if (!response.ok) {
        toast({ title: "Error", description: "No se pudo eliminar el evento", variant: "destructive" });
        return;
      }
      setEvents((prev) => prev.filter((ev) => ev.id !== editingId));
      toast({ title: "Evento eliminado" });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToSource = () => {
    const event = events.find((e) => e.id === editingId);
    if (!event) return;

    if (event.sourceType === "ticket") {
      if (event.sourceId) {
        router.push(`/tickets/${event.sourceId}`);
      } else {
        router.push("/tickets");
      }
    } else if (event.sourceType === "payment") {
      if (event.clientId) {
        router.push(`/clients/${event.clientId}`);
      } else {
        router.push("/payments");
      }
    } else if (event.sourceType === "contract") {
      if (event.clientId) {
        router.push(`/clients/${event.clientId}`);
      } else {
        router.push("/clients");
      }
    } else {
      toast({ title: "Navegación no disponible", description: "Este evento no tiene un módulo asociado directo." });
    }
    setModalOpen(false);
  };

  const [formattedStart, setFormattedStart] = useState("--");
  const [formattedEnd, setFormattedEnd] = useState("--");

  useEffect(() => {
    if (draft.start) {
      setFormattedStart(
        new Intl.DateTimeFormat("es-UY", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }).format(new Date(draft.start))
      );
    } else {
      setFormattedStart("--");
    }
    if (draft.end) {
      setFormattedEnd(
        new Intl.DateTimeFormat("es-UY", {
          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        }).format(new Date(draft.end))
      );
    } else {
      setFormattedEnd("--");
    }
  }, [draft.start, draft.end]);

  // Load filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("calendar_filters");
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading filters", e);
      }
    }
  }, []);

  const handleSaveFilters = () => {
    localStorage.setItem("calendar_filters", JSON.stringify(filters));
    toast({ title: "Configuración guardada", description: "Tus preferencias de visualización se han guardado." });
  };

  // Handle fullscreen changes (ESC key support)
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const renderEventContent = (arg: any) => {
    const sourceType = arg.event.extendedProps?.sourceType as CalendarEvent["sourceType"];
    const locked = Boolean(arg.event.extendedProps?.locked);
    const assignedToId = arg.event.extendedProps?.assignedTo;
    const assignedGroupId = arg.event.extendedProps?.assignedGroup;

    // Debug
    if (sourceType === 'ticket' && assignedToId) {
      // console.log
    }

    const assignedUser = assignedToId ? users.find(u =>
      u.id === assignedToId ||
      u._id === assignedToId ||
      u.name === assignedToId ||
      u.email === assignedToId
    ) : null;
    const assignedGroup = assignedGroupId ? groups.find(g => g._id === assignedGroupId) : null;

    const isAuto = sourceType !== "manual";

    // Simplificado y moderno
    let bgColor = "bg-slate-800 border-slate-700 text-white";
    if (sourceType === "ticket") bgColor = "bg-amber-100 border-amber-200 text-amber-900";
    if (sourceType === "contract") bgColor = "bg-blue-100 border-blue-200 text-blue-900";
    if (sourceType === "payment") bgColor = "bg-emerald-100 border-emerald-200 text-emerald-900";

    const title = arg.event.title;

    return (
      <div
        className={`flex h-full w-full min-h-full flex-col justify-center rounded-md border px-2 py-1 text-xs font-semibold shadow-sm transition-all overflow-hidden cursor-pointer hover:brightness-95 ${bgColor}`}
      >
        <div className="flex items-center gap-1.5 w-full">
          {assignedUser ? (
            <Avatar className="h-5 w-5 border border-white/20 shadow-sm shrink-0">
              <AvatarImage src={assignedUser.avatar ? `${API_URL.replace(/\/api\/?$/, "")}${assignedUser.avatar}` : undefined} />
              <AvatarFallback className="text-[9px] bg-slate-900/10 text-slate-700">{assignedUser.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : assignedGroup ? (
            <div className="h-5 w-5 bg-white/20 rounded-full flex items-center justify-center shrink-0" title={assignedGroup.name}>
              <Users className="h-3 w-3 opacity-70" />
            </div>
          ) : sourceType === "ticket" ? (
            <Ticket className="h-3.5 w-3.5 opacity-70 shrink-0" />
          ) : sourceType === "payment" ? (
            <CircleDollarSign className="h-3.5 w-3.5 opacity-70 shrink-0" />
          ) : sourceType === "contract" ? (
            <FileBadge2 className="h-3.5 w-3.5 opacity-70 shrink-0" />
          ) : (
            <CalendarPlus className="h-3.5 w-3.5 opacity-70 shrink-0" />
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <span className="truncate leading-tight">{title}</span>
            {assignedUser && <span className="text-[10px] opacity-75 truncate">{assignedUser.name.split(' ')[0]}</span>}
            {!assignedUser && assignedGroup && <span className="text-[10px] opacity-75 truncate">{assignedGroup.name}</span>}
          </div>

          {locked && <Lock className="h-2.5 w-2.5 opacity-50 ml-auto shrink-0" />}
        </div>
      </div>
    );
  };

  const calendarEvents = useMemo(() => {
    return events
      .filter(ev => {
        if (ev.sourceType === "ticket" && !filters.tickets) return false;
        if (ev.sourceType === "payment" && !filters.payments) return false;
        if (ev.sourceType === "contract" && !filters.contracts) return false;
        if (ev.sourceType === "manual" && !filters.manual) return false;
        return true;
      })
      .map((event) => ({
        ...event,
        editable: !event.locked,
        durationEditable: !event.locked,
      }));
  }, [events, filters]);

  return (
    <DashboardLayout className="p-0">
      <div className="px-6 pt-4 pb-2">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 shadow-sm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <ShinyText size="2xl" weight="bold">Calendario</ShinyText>
              </h1>
              <p className="text-xs text-muted-foreground">
                Planificación y eventos del sistema
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">

            <div className="flex items-center gap-4 px-2 border-r">
              {/* Toggles */}
              <div className="flex items-center gap-2">
                <Switch id="filter-tickets" checked={filters.tickets} onCheckedChange={(c) => setFilters(prev => ({ ...prev, tickets: c }))} className="data-[state=checked]:bg-amber-500 scale-75 origin-right" />
                <Label htmlFor="filter-tickets" className="text-xs flex items-center gap-1 cursor-pointer"><Ticket className="h-3 w-3 text-amber-500" /> Tickets</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="filter-contracts" checked={filters.contracts} onCheckedChange={(c) => setFilters(prev => ({ ...prev, contracts: c }))} className="data-[state=checked]:bg-blue-500 scale-75 origin-right" />
                <Label htmlFor="filter-contracts" className="text-xs flex items-center gap-1 cursor-pointer"><FileBadge2 className="h-3 w-3 text-blue-500" /> Contratos</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="filter-payments" checked={filters.payments} onCheckedChange={(c) => setFilters(prev => ({ ...prev, payments: c }))} className="data-[state=checked]:bg-emerald-500 scale-75 origin-right" />
                <Label htmlFor="filter-payments" className="text-xs flex items-center gap-1 cursor-pointer"><CircleDollarSign className="h-3 w-3 text-emerald-500" /> Pagos</Label>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2">
              {/* Save Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSaveFilters} className="text-slate-500 hover:text-slate-900">
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Guardar filtros
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Pantalla Completa
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className={`w-full px-6 pb-6 transition-all duration-300 ${isFullscreen ? "fixed inset-0 z-50 bg-white p-6" : "h-[calc(100vh-140px)]"}`}>
        <div className="h-full">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            firstDay={1}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
            }}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={true}
            expandRows={true}
            height="100%"
            events={calendarEvents}
            eventBackgroundColor="transparent"
            eventBorderColor="transparent"
            editable
            eventDurationEditable
            eventStartEditable
            selectable
            selectMirror
            select={handleSelect}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            eventAllow={(_, draggedEvent) => !draggedEvent?.extendedProps?.locked}
            dayMaxEvents={3}
            nowIndicator
            scrollTime={new Date().toISOString().split("T")[1].slice(0, 8)}
            eventContent={renderEventContent}
          />
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[min(95vw,520px)] bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <DialogHeader className="mb-2">
            <div className="flex items-center gap-2">
              {modalMode === "create" ? (
                <CalendarPlus className="h-5 w-5 text-slate-600" />
              ) : modalMode === "view" ? (
                <FileBadge2 className="h-5 w-5 text-slate-600" />
              ) : (
                <Edit3 className="h-5 w-5 text-slate-600" />
              )}
              <DialogTitle className="text-lg font-semibold">
                {modalMode === "create" ? "Crear evento" : modalMode === "view" ? "Detalles del evento" : "Editar evento"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-500">
              {modalMode === "view"
                ? "Este evento es automático y está vinculado a un módulo del sistema."
                : "Arrastra sobre el calendario para seleccionar un horario o toca un evento existente."}
            </DialogDescription>
          </DialogHeader>

          {modalMode === "view" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">{draft.title}</h3>
                {draft.location && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {draft.location}
                  </div>
                )}
                {/* Mostrar asignado si existe */}
                {(() => {
                  const event = events.find(e => e.id === editingId);
                  if (event?.assignedTo) {
                    const user = users.find(u => u.id === event.assignedTo || u._id === event.assignedTo);
                    if (user) {
                      return <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <User2 className="h-4 w-4" /> Asignado a: {user.name}
                      </div>
                    }
                  }
                  if (event?.assignedGroup) {
                    const group = groups.find(g => g._id === event.assignedGroup);
                    if (group) {
                      return <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4" /> Grupo: {group.name}
                      </div>
                    }
                  }
                  return null;
                })()}

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Inicio</span>
                    <p className="text-sm font-medium text-slate-900">{formattedStart}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-500">Fin</span>
                    <p className="text-sm font-medium text-slate-900">{formattedEnd}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={handleNavigateToSource} className="gap-2">
                  Ir a {getOriginLabel(events.find(e => e.id === editingId)?.sourceType)}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="event-title">Título</Label>
                <Input
                  id="event-title"
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Seguimiento cliente"
                  type="text"
                />
              </div>
              <div className="space-y-1 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="start-time">Inicio</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={draft.start}
                      onChange={(event) => setDraft((prev) => ({ ...prev, start: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end-time">Fin</Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={draft.end}
                      min={draft.start || undefined}
                      onChange={(event) => setDraft((prev) => ({ ...prev, end: event.target.value }))}
                    />
                  </div>
                </div>
                <Label className="flex items-center gap-2 pt-3" htmlFor="event-location">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </Label>
                <Input
                  id="event-location"
                  value={draft.location}
                  onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Montevideo, oficina central"
                  type="text"
                />
                {/* Cliente selector */}
                <Combobox
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Seleccionar cliente (opcional)"
                  value={selectedClientId ?? undefined}
                  onValueChange={(value) => setSelectedClientId(value ?? null)}
                  className="bg-white/80 backdrop-blur-lg text-slate-900 hover:bg-white/80 border border-gray-200 mt-2"
                  contentClassName="bg-white/90 backdrop-blur-lg text-slate-900"
                >
                  <User2 className="h-4 w-4 mr-2" />
                </Combobox>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-800">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm ring-1 ring-slate-700">
                  <Clock4 className="h-4 w-4" />
                  <span className="whitespace-nowrap">{formattedStart}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm ring-1 ring-slate-700">
                  <Clock4 className="h-4 w-4" />
                  <span className="whitespace-nowrap">{formattedEnd}</span>
                </div>
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-3">
                {modalMode === "edit" && !editingLocked ? (
                  <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete} disabled={saving}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                ) : null}
                <Button
                  variant="link"
                  className="text-slate-500 hover:text-slate-700"
                  onClick={() => setModalOpen(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button disabled={saving} onClick={handleModalSubmit}>
                  {modalMode === "create" ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar evento
                    </>
                  ) : (
                    <>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Actualizar evento
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
}
