"use client";

import { DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import { useEffect, useMemo, useState } from "react";
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
import { User2 } from "lucide-react";
import { CalendarPlus, CircleDollarSign, Clock4, Edit3, FileBadge2, Lock, MapPin, Save, Ticket, Trash2, X, Calendar } from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  sourceType?: "ticket" | "payment" | "contract" | "manual" | string;
  sourceId?: string | null;
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

const mapEventRow = (row: any): CalendarEvent => ({
  id: String(row.id),
  title: row.title,
  start: row.start,
  end: row.end ?? undefined,
  location: row.location ?? undefined,
  sourceType: row.sourceType ?? row.source_type ?? "manual",
  sourceId: row.sourceId ?? row.source_id ?? null,
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
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<DraftEvent>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLocked, setEditingLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();

  const getOriginLabel = (sourceType?: CalendarEvent["sourceType"]) => {
    if (sourceType === "ticket") return "Tickets";
    if (sourceType === "payment") return "Pagos";
    if (sourceType === "contract") return "Contratos";
    return "su módulo de origen";
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

  // Load clients for combobox
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_URL}/clients`);
        if (!res.ok) throw new Error('Failed to load clients');
        const data = await res.json();
        setClients(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchClients();
  }, []);

  const openModal = (mode: "create" | "edit", values: Partial<DraftEvent> & { id?: string }) => {
    setModalMode(mode);
    setEditingId(values.id ?? null);
    const locked = mode === "edit" ? Boolean((events.find((ev) => ev.id === values.id) as CalendarEvent | undefined)?.locked) : false;
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
    if (info.event.extendedProps?.locked) {
      const sourceType = info.event.extendedProps?.sourceType as CalendarEvent["sourceType"];
      toast({
        title: "Evento protegido",
        description: `Editalo desde ${getOriginLabel(sourceType)}.`,
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
    setEditingLocked(Boolean(info.event.extendedProps?.locked));
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

  const [formattedStart, setFormattedStart] = useState("--");
  const [formattedEnd, setFormattedEnd] = useState("--");

  useEffect(() => {
    if (draft.start) {
      setFormattedStart(
        new Intl.DateTimeFormat("es-UY", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(draft.start))
      );
    } else {
      setFormattedStart("--");
    }
    if (draft.end) {
      setFormattedEnd(
        new Intl.DateTimeFormat("es-UY", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(draft.end))
      );
    } else {
      setFormattedEnd("--");
    }
  }, [draft.start, draft.end]);

  const renderEventContent = (arg: any) => {
    const sourceType = arg.event.extendedProps?.sourceType as CalendarEvent["sourceType"];
    const locked = Boolean(arg.event.extendedProps?.locked);
    const locationText = arg.event.extendedProps?.location;
    const sourceId = arg.event.extendedProps?.sourceId;
    const tone =
      sourceType === "ticket"
        ? "bg-amber-700 border-amber-900 text-white"
        : sourceType === "payment"
          ? "bg-emerald-700 border-emerald-900 text-white"
          : sourceType === "contract"
            ? "bg-indigo-700 border-indigo-900 text-white"
            : "bg-slate-900 border-slate-800 text-white";
    const icon =
      sourceType === "ticket" ? (
        <Ticket className="h-4 w-4 text-white" />
      ) : sourceType === "payment" ? (
        <CircleDollarSign className="h-4 w-4 text-white" />
      ) : sourceType === "contract" ? (
        <FileBadge2 className="h-4 w-4 text-white" />
      ) : (
        <CalendarPlus className="h-4 w-4 text-white" />
      );
    return (
      <div
        className={`flex h-full w-full min-h-full flex-col gap-0 rounded-md border px-2 py-1.5 text-sm font-semibold leading-tight shadow-sm ${tone}`}
        style={{ height: "100%" }}
      >
        <div className="flex items-center gap-1">
          {icon}
          <span className="truncate">{arg.event.title}</span>
          {locked ? <Lock className="h-3.5 w-3.5 text-white/80" /> : null}
        </div>
        {sourceType === "ticket" && sourceId ? (
          <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-500 px-2 py-[2px] text-[0.65rem] font-semibold text-white shadow-sm ring-1 ring-amber-300">
            <Ticket className="h-3 w-3" />
            Ticket #{sourceId}
          </span>
        ) : null}
        {locationText ? (
          <span className="flex items-center gap-1 text-[0.65rem] font-medium text-white/80">
            <MapPin className="h-3 w-3 text-white/80" />
            <span className="truncate">{locationText}</span>
          </span>
        ) : null}
      </div>
    );
  };

  const calendarEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        editable: !event.locked,
        durationEditable: !event.locked,
      })),
    [events]
  );

  return (
    <DashboardLayout className="p-0">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <ShinyText size="3xl" weight="bold">Calendario</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestiona eventos, vencimientos y recordatorios.
            </p>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden px-6 pb-6">
        <div className="flex-1">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            firstDay={1}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoy",
              week: "Semana",
              day: "Día",
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
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
            dayMaxEvents
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
              ) : (
                <Edit3 className="h-5 w-5 text-slate-600" />
              )}
              <DialogTitle className="text-lg font-semibold">
                {modalMode === "create" ? "Crear evento" : "Editar evento"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-slate-500">
              Arrastra sobre el calendario para seleccionar un horario o toca un evento existente.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
