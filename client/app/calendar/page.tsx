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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarPlus, Clock4, Edit3, MapPin } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string | null;
  location?: string | null;
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
  end: row.end ?? null,
  location: row.location ?? null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const emptyDraft: DraftEvent = { title: "", location: "", start: "", end: "" };

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [draft, setDraft] = useState<DraftEvent>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const openModal = (mode: "create" | "edit", values: Partial<DraftEvent> & { id?: string }) => {
    setModalMode(mode);
    setEditingId(values.id ?? null);
    setDraft({
      title: values.title ?? "",
      location: values.location ?? "",
      start: values.start ?? "",
      end: values.end ?? values.start ?? "",
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
    openModal("edit", {
      id: info.event.id,
      title: info.event.title,
      location: info.event.extendedProps?.location ?? "",
      start: info.event.startStr,
      end: info.event.endStr || info.event.startStr,
    });
  };

  const handleEventChange = async (changeInfo: EventChangeArg) => {
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
    setSaving(true);
    const payload = {
      title: draft.title.trim(),
      location: draft.location.trim() || null,
      start: draft.start,
      end: draft.end || draft.start,
    };
    try {
      if (modalMode === "create") {
        const response = await fetch("/api/calendar-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) return;
        const created = mapEventRow(await response.json());
        setEvents((prev) => [...prev, created]);
      } else if (editingId) {
        const response = await fetch(`/api/calendar-events/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) return;
        const updated = mapEventRow(await response.json());
        setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const formattedStart = useMemo(() => {
    if (!draft.start) return "--";
    return new Intl.DateTimeFormat("es-UY", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(draft.start));
  }, [draft.start]);

  const formattedEnd = useMemo(() => {
    if (!draft.end) return "--";
    return new Intl.DateTimeFormat("es-UY", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(draft.end));
  }, [draft.end]);

  return (
    <DashboardLayout className="p-0">
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden px-6 py-6">
        <div className="flex-1">
          <FullCalendar
            className="h-full w-full"
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
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            height="100%"
            events={events}
            editable
            selectable
            selectMirror
            select={handleSelect}
            eventClick={handleEventClick}
            eventChange={handleEventChange}
            dayMaxEvents
            nowIndicator
            eventContent={(arg) => (
              <div className="flex flex-col gap-0 text-sm font-semibold leading-tight text-slate-900">
                <span>{arg.event.title}</span>
                {arg.event.extendedProps?.location ? (
                  <span className="text-[0.65rem] font-medium text-slate-500">
                    {arg.event.extendedProps.location}
                  </span>
                ) : null}
              </div>
            )}
          />
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[min(90vw,420px)]">
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
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2" htmlFor="event-location">
                <MapPin className="h-4 w-4" />
                Ubicación
              </Label>
              <Input
                id="event-location"
                value={draft.location}
                onChange={(event) => setDraft((prev) => ({ ...prev, location: event.target.value }))}
                placeholder="Montevideo, oficina central"
              />
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
              <div className="flex items-center gap-1">
                <Clock4 className="h-4 w-4" />
                <span>{formattedStart}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock4 className="h-4 w-4" />
                <span>{formattedEnd}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="link"
              className="text-slate-500 hover:text-slate-700"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button disabled={saving} onClick={handleModalSubmit}>
              {modalMode === "create" ? "Guardar evento" : "Actualizar evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
