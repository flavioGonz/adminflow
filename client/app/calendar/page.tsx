"use client";

import { DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
import { TICKET_DELETED_EVENT } from "@/lib/app-events";
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
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type WeeklyWeather = {
  date: string;
  max: number;
  min: number;
  weathercode: number;
  precipitationProbability?: number;
  windSpeed?: number;
};

type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
const VIEW_OPTIONS: { label: string; view: CalendarViewType }[] = [
  { label: "Mes", view: "dayGridMonth" },
  { label: "Semana", view: "timeGridWeek" },
  { label: "Día", view: "timeGridDay" },
];

const padDate = (date: Date) => date.toISOString().split("T")[0];
const formatRangeLabel = (start: Date, end: Date) => {
  const formatter = new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
  });
  const startLabel = formatter.format(start);
  const endLabel = formatter.format(end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
};
const buildWeatherUrl = (start: string, end: string) =>
  `https://api.open-meteo.com/v1/forecast?latitude=-34.9011&longitude=-56.1645&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=America%2FMontevideo&start_date=${start}&end_date=${end}`;

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: "Despejado", icon: "☀️" },
  1: { label: "Principalmente soleado", icon: "🌤️" },
  2: { label: "Parcialmente nublado", icon: "⛅️" },
  3: { label: "Nublado", icon: "☁️" },
  45: { label: "Bruma", icon: "🌫️" },
  48: { label: "Neblina", icon: "🌫️" },
  51: { label: "Llovizna ligera", icon: "🌦️" },
  53: { label: "Llovizna moderada", icon: "🌦️" },
  55: { label: "Llovizna intensa", icon: "🌧️" },
  61: { label: "Lluvia ligera", icon: "🌧️" },
  63: { label: "Lluvia moderada", icon: "🌧️" },
  65: { label: "Lluvia intensa", icon: "🌧️" },
  71: { label: "Nieve ligera", icon: "🌨️" },
  73: { label: "Nieve moderada", icon: "🌨️" },
  75: { label: "Nieve intensa", icon: "❄️" },
  80: { label: "Chubascos", icon: "🌧️" },
  81: { label: "Chubascos fuertes", icon: "🌧️" },
  82: { label: "Tormentas", icon: "⛈️" },
  95: { label: "Tormenta eléctrica", icon: "⛈️" },
  96: { label: "Tormenta con granizo", icon: "⛈️" },
  99: { label: "Tormenta severa", icon: "⛈️" },
};

const getWeatherBadge = (code?: number) => weatherCodeMap[code ?? -1] ?? { label: "Clima", icon: "🌤️" };

const decorateCalendarTicketTitle = (title: string) => {
  const cleaned = title.trim().replace(/^📅\s*/, "");
  return `📅 ${cleaned}`;
};

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

const buildVisitDataFromDateRange = (start?: string, end?: string) => {
  if (!start) return null;
  const safeEnd = end || start;
  const extractTime = (value: string) => value.split("T")[1]?.substring(0, 5) ?? "";
  return {
    visitDate: start.split("T")[0],
    visitStart: extractTime(start),
    visitEnd: extractTime(safeEnd),
  };
};

const syncTicketVisitFromEvent = async (event?: CalendarEvent) => {
  if (!event || event.sourceType !== "ticket" || !event.sourceId) return;
  const visitData = buildVisitDataFromDateRange(event.start, event.end);
  if (!visitData) return;
  try {
    await fetch(`${API_URL}/tickets/${event.sourceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitData,
        status: "Visita Programada",
        assignedTo: event.assignedTo ?? undefined,
        assignedGroupId: event.assignedGroup ?? undefined,
      }),
    });
  } catch (error) {
    console.error("Error sincronizando ticket desde el evento:", error);
  }
};

const deleteTicketForEvent = async (event?: CalendarEvent) => {
  if (!event || event.sourceType !== "ticket" || !event.sourceId) return;
  try {
    await fetch(`${API_URL}/tickets/${event.sourceId}`, { method: "DELETE" });
  } catch (error) {
    console.error("Error eliminando ticket asociado al evento:", error);
  }
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
  const [isTicket, setIsTicket] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedGroupId, setAssignedGroupId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filters
  const [filters, setFilters] = useState({
    tickets: true,
    contracts: true,
    payments: true,
    manual: true
  });
  const [showWeather, setShowWeather] = useState(true);
  const [weeklyWeather, setWeeklyWeather] = useState<WeeklyWeather[]>([]);
  const [weatherRangeKey, setWeatherRangeKey] = useState("");
  const calendarRef = useRef<FullCalendar | null>(null);
  const weatherControllerRef = useRef<AbortController | null>(null);
  const [currentView, setCurrentView] = useState<CalendarViewType>("timeGridWeek");
  const [visibleRangeLabel, setVisibleRangeLabel] = useState("");

  const { toast } = useToast();
  const router = useRouter();

  const getOriginLabel = (sourceType?: CalendarEvent["sourceType"]) => {
    if (sourceType === "ticket") return "Ticket";
    if (sourceType === "payment") return "Pago";
    if (sourceType === "contract") return "Contrato";
    return "Origen";
  };

  const loadEvents = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/calendar-events", { signal });
      if (!response.ok) throw new Error("No se pudieron cargar los eventos.");
      const payload = await response.json();
      if (!Array.isArray(payload)) return;
      setEvents(payload.map(mapEventRow));
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadEvents(controller.signal);
    return () => controller.abort();
  }, [loadEvents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => loadEvents();
    window.addEventListener(TICKET_DELETED_EVENT, handler);
    return () => window.removeEventListener(TICKET_DELETED_EVENT, handler);
  }, [loadEvents]);

  const loadWeatherRange = useCallback(
    async (startDate: string, endDate: string, signal?: AbortSignal) => {
      try {
        const response = await fetch(buildWeatherUrl(startDate, endDate), { signal });
        if (!response.ok) {
          console.warn("No se pudo cargar el pronóstico semanal.", response.status);
          setWeeklyWeather([]);
          return;
        }
        const data = await response.json();
        if (data?.daily) {
          const {
            time = [],
            temperature_2m_max = [],
            temperature_2m_min = [],
            weathercode = [],
            precipitation_probability_max = [],
            windspeed_10m_max = [],
          } = data.daily;
          const combined: WeeklyWeather[] = time.map((date: string, index: number) => ({
            date,
            max: temperature_2m_max[index] ?? 0,
            min: temperature_2m_min[index] ?? 0,
            weathercode: weathercode[index] ?? 0,
            precipitationProbability: precipitation_probability_max[index] ?? 0,
            windSpeed: windspeed_10m_max[index] ?? 0,
          }));
          setWeeklyWeather(combined);
        }
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        console.error("Error al cargar el pronóstico semanal:", error);
      }
    },
    []
  );

  const handleDatesSet = useCallback(
    (info: any) => {
      if (!info.start || !info.end) {
        setWeeklyWeather([]);
        return;
      }
      const startDate = padDate(info.start);
      const endDate = padDate(new Date(info.end.getTime() - 1));
      const key = `${startDate}-${endDate}`;
      if (key === weatherRangeKey) return;
      setWeatherRangeKey(key);
      weatherControllerRef.current?.abort();
      const controller = new AbortController();
      weatherControllerRef.current = controller;
      loadWeatherRange(startDate, endDate, controller.signal);
      const viewType = info.view?.type as CalendarViewType | undefined;
      if (viewType) {
        setCurrentView(viewType);
      }
      setVisibleRangeLabel(formatRangeLabel(info.start, new Date(info.end.getTime() - 1)));
    },
    [weatherRangeKey, loadWeatherRange]
  );

  const navigateCalendar = useCallback((action: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (action === "today") api.today();
    if (action === "prev") api.prev();
    if (action === "next") api.next();
  }, []);

  const handleViewChange = useCallback((view: CalendarViewType) => {
    calendarRef.current?.getApi().changeView(view);
    setCurrentView(view);
  }, []);

  const weeklyWeatherMap = useMemo(() => {
    const map: Record<string, WeeklyWeather> = {};
    weeklyWeather.forEach((day) => {
      map[day.date] = day;
    });
    return map;
  }, [weeklyWeather]);

  const renderWeatherRow = useCallback(
    (headerContainer: Element | null, dateKey?: string) => {
      if (!headerContainer || !dateKey) return;
      const weatherInfo = weeklyWeatherMap[dateKey];
      const existing = headerContainer.querySelector("[data-weather-header]");
      if (existing) existing.remove();
      if (!showWeather) return;
      const weatherRow = document.createElement("div");
      weatherRow.dataset.weatherHeader = "true";
      weatherRow.className = "calendar-weather-row";
      const icon = document.createElement("span");
      icon.className = "calendar-weather-icon";
      const temps = document.createElement("span");
      temps.className = "calendar-weather-temps";
      if (weatherInfo) {
        const badge = getWeatherBadge(weatherInfo.weathercode);
        icon.textContent = badge.icon;
        temps.textContent = `${Math.round(weatherInfo.max)}°/${Math.round(weatherInfo.min)}°`;
        weatherRow.title = badge.label;
        const tooltipParts: string[] = [];
        const wind = weatherInfo.windSpeed;
        const precip = weatherInfo.precipitationProbability;
        if (typeof wind === "number" && !Number.isNaN(wind)) {
          tooltipParts.push(`Viento ${Math.round(wind)} km/h`);
        }
        if (typeof precip === "number" && !Number.isNaN(precip)) {
          tooltipParts.push(`Prob. lluvia ${Math.round(precip)}%`);
        }
        const isSensitive =
          (precip ?? 0) >= 60 || (wind ?? 0) >= 35;
        if (tooltipParts.length === 0) {
          tooltipParts.push("Detalle no disponible");
        }
        if (isSensitive) {
          tooltipParts.push("Visita exterior sensible");
          weatherRow.className = "calendar-weather-row calendar-weather-alert";
        }
        weatherRow.dataset.tooltipText = tooltipParts.join(" · ");
      } else {
        icon.textContent = "☁️";
        temps.textContent = "--°/--°";
        weatherRow.title = "Pronóstico no disponible";
        weatherRow.dataset.tooltipText = "Pronóstico no disponible";
      }
      weatherRow.append(icon, temps);
      headerContainer.appendChild(weatherRow);
    },
    [showWeather, weeklyWeatherMap]
  );

  useEffect(() => {
    if (!calendarRef.current) return;
    const handle = setTimeout(() => {
      calendarRef.current?.getApi().render();
    }, 0);
    return () => clearTimeout(handle);
  }, [weeklyWeather, showWeather]);

  useEffect(() => {
    const headers = document.querySelectorAll<HTMLElement>("[data-calendar-day-key]");
    headers.forEach((header) => {
      renderWeatherRow(header, header.dataset.calendarDayKey);
    });
  }, [weeklyWeather, showWeather, renderWeatherRow]);

  const handleDayHeaderMount = useCallback(
    (arg: any) => {
      const dateKey = arg.date.toISOString().split("T")[0];
      const headerContainer = arg.el.querySelector(".fc-col-header-cell-cushion") ?? arg.el;
      headerContainer.dataset.calendarDayKey = dateKey;
      renderWeatherRow(headerContainer, dateKey);
    },
    [renderWeatherRow]
  );

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
    const event = values.id ? events.find((ev) => ev.id === values.id) : null;
    const locked = mode === "edit" || mode === "view" ? Boolean(event?.locked) : false;
    setEditingLocked(locked);
    setDraft({
      title: values.title ?? "",
      location: values.location ?? "",
      start: formatDateTimeLocal(values.start) ?? "",
      end: formatDateTimeLocal(values.end ?? values.start) ?? "",
    });
    setIsTicket(event?.sourceType === "ticket");
    setSelectedClientId(event?.clientId ?? null);
    setAssignedTo(event?.assignedTo ?? null);
    setAssignedGroupId(event?.assignedGroup ?? null);
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
    await syncTicketVisitFromEvent(updated);
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
    const eventData: Record<string, any> = {
      title: draft.title.trim(),
      location: draft.location.trim() || undefined,
      start: draft.start,
      end: draft.end || draft.start,
      clientId: selectedClientId ?? undefined,
      assignedTo: assignedTo || undefined,
      assignedGroup: assignedGroupId || undefined,
    };
    try {
      if (modalMode === "create") {
        if (isTicket) {
          if (!selectedClientId) {
            toast({ title: "Cliente requerido", description: "Selecciona un cliente para convertir a ticket", variant: "destructive" });
            setSaving(false);
            return;
          }
          const ticketPayload = {
            clientId: selectedClientId,
            title: decorateCalendarTicketTitle(draft.title),
            status: "Visita Programada",
            priority: "Media",
            visit: true,
            visitData: buildVisitDataFromDateRange(draft.start, draft.end),
            description: draft.location.trim() || undefined,
          };
          if (assignedTo) ticketPayload.assignedTo = assignedTo;
          if (assignedGroupId) ticketPayload.assignedGroupId = assignedGroupId;
          const ticketResponse = await fetch(`${API_URL}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketPayload),
          });
          if (!ticketResponse.ok) {
            const errorText = await ticketResponse.text();
            throw new Error(errorText || "No se pudo crear el ticket");
          }
          const ticketData = await ticketResponse.json();
          eventData.sourceType = "ticket";
          eventData.sourceId = ticketData.id ?? ticketData._id;
          const response = await fetch("/api/calendar-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
          });
          if (!response.ok) throw new Error("No se pudo crear el evento de ticket");
          toast({ title: "Ticket agendado", description: `Se ha agendado la visita para ${draft.title.trim()}`, variant: "success" });
        } else {
          const response = await fetch("/api/calendar-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...eventData,
              sourceType: "manual",
              locked: false,
            }),
          });
          if (!response.ok) {
            toast({ title: "Error", description: "No se pudo crear el evento", variant: "destructive" });
            return;
          }
          toast({ title: "Evento creado", description: draft.title });
        }
      } else if (editingId) {
        const currentEvent = events.find((e) => e.id === editingId);
        if (!currentEvent) {
          toast({ title: "Evento no encontrado", variant: "destructive" });
          return;
        }
        const payload: Record<string, any> = {
          ...eventData,
          sourceType: currentEvent.sourceType ?? "manual",
          locked: currentEvent.locked ?? false,
        };
        if (isTicket && currentEvent.sourceType !== "ticket") {
          if (!selectedClientId) {
            toast({ title: "Cliente requerido", description: "Selecciona un cliente para convertir a ticket", variant: "destructive" });
            setSaving(false);
            return;
          }
          const ticketResponse = await fetch(`${API_URL}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: selectedClientId,
              title: decorateCalendarTicketTitle(draft.title),
              status: "Visita Programada",
              priority: "Media",
              visit: true,
              visitData: buildVisitDataFromDateRange(draft.start, draft.end),
              description: draft.location.trim() || undefined,
              assignedTo,
              assignedGroupId,
            }),
          });
          if (!ticketResponse.ok) {
            const errorText = await ticketResponse.text();
            throw new Error(errorText || "No se pudo crear el ticket");
          }
          const ticketData = await ticketResponse.json();
          payload.sourceType = "ticket";
          payload.sourceId = ticketData.id ?? ticketData._id;
        }
        const response = await fetch(`/api/calendar-events/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
          return;
        }
        toast({ title: "Evento actualizado", description: draft.title });
      }
      await loadEvents();
      setModalOpen(false);
      setIsTicket(false);
      setSelectedClientId(null);
      setAssignedTo(null);
      setAssignedGroupId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Algo salió mal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const event = events.find((ev) => ev.id === editingId);
      await deleteTicketForEvent(event);
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
    if (!modalOpen) {
      setIsTicket(false);
      setAssignedTo(null);
      setAssignedGroupId(null);
      setSelectedClientId(null);
    }
  }, [modalOpen]);
 
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

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach((client) => {
      if (client.id) map[client.id] = client.name;
      if ((client as any)._id) map[(client as any)._id] = client.name;
    });
    return map;
  }, [clients]);

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
    const clientId = arg.event.extendedProps?.clientId;
    const clientName = clientId ? clientMap[clientId] : undefined;
    const startTimeLabel = arg.event.start
      ? new Intl.DateTimeFormat("es-UY", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(arg.event.start)
      : "--:--";

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
            <Avatar className="h-7 w-7 border border-white/20 shadow-sm shrink-0">
              <AvatarImage src={assignedUser.avatar ? `${API_URL.replace(/\/api\/?$/, "")}${assignedUser.avatar}` : undefined} />
              <AvatarFallback className="text-[9px] bg-slate-900/10 text-slate-700">{assignedUser.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          ) : assignedGroup ? (
            <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center shrink-0" title={assignedGroup.name}>
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
            <div className="flex items-center gap-2 text-[10px] text-slate-600">
              <span>{startTimeLabel}</span>
              {clientName && <span className="truncate">{clientName}</span>}
            </div>
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
      <div className="px-6 pt-4 pb-0">
        <div className="space-y-4">
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
          <div className="flex flex-wrap items-center justify-between gap-4 px-2 pb-0 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => navigateCalendar("prev")}>
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateCalendar("today")}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateCalendar("next")}>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </Button>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{visibleRangeLabel || "—"}</h2>
              </div>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="flex flex-wrap items-center gap-3 justify-center">
                {VIEW_OPTIONS.map((option) => (
                  <Button
                    key={option.view}
                    variant={currentView === option.view ? "default" : "ghost"}
                    size="sm"
                    className="px-3 py-1.5"
                    onClick={() => handleViewChange(option.view)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Switch
                    id="filter-tickets"
                    checked={filters.tickets}
                    onCheckedChange={(c) => setFilters((prev) => ({ ...prev, tickets: c }))}
                    className="data-[state=checked]:bg-amber-500 scale-90 h-4 w-8"
                  />
                  <label htmlFor="filter-tickets" className="flex items-center gap-1 cursor-pointer select-none">
                    <Ticket className="h-3 w-3 text-amber-500" />
                    Tickets
                  </label>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Switch
                    id="filter-contracts"
                    checked={filters.contracts}
                    onCheckedChange={(c) => setFilters((prev) => ({ ...prev, contracts: c }))}
                    className="data-[state=checked]:bg-blue-500 scale-90 h-4 w-8"
                  />
                  <label htmlFor="filter-contracts" className="flex items-center gap-1 cursor-pointer select-none">
                    <FileBadge2 className="h-3 w-3 text-blue-500" />
                    Contratos
                  </label>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Switch
                    id="filter-payments"
                    checked={filters.payments}
                    onCheckedChange={(c) => setFilters((prev) => ({ ...prev, payments: c }))}
                    className="data-[state=checked]:bg-emerald-500 scale-90 h-4 w-8"
                  />
                  <label htmlFor="filter-payments" className="flex items-center gap-1 cursor-pointer select-none">
                    <CircleDollarSign className="h-3 w-3 text-emerald-500" />
                    Pagos
                  </label>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <Switch
                    id="toggle-weather"
                    checked={showWeather}
                    onCheckedChange={setShowWeather}
                    className="data-[state=checked]:bg-sky-500 scale-90 h-4 w-8"
                  />
                  <label htmlFor="toggle-weather" className="flex items-center gap-1 cursor-pointer select-none">
                    <CalendarPlus className="h-3 w-3 text-sky-500" />
                    Clima
                  </label>
                </div>
              </div>
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

      <div
        ref={containerRef}
        className={`w-full px-6 pb-0 transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 z-50 bg-white p-6"
            : "h-[calc(100vh-140px)]"
        }`}
      >
        <div className="h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            firstDay={1}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "",
              center: "",
              right: "",
            }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
              week: "Semana",
              day: "Día",
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
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
            dayHeaderDidMount={handleDayHeaderMount}
            datesSet={handleDatesSet}
            dayMaxEvents={3}
            nowIndicator
            scrollTime={new Date().toISOString().split("T")[1].slice(0, 8)}
            eventContent={renderEventContent}
            slotLabelContent={(slot) => (
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600">
                <Clock4 className="h-3 w-3" />
                <span>{slot.text}</span>
              </div>
            )}
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
                <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Convertir a ticket</p>
                    <p className="text-[11px] text-amber-700/70">Convierte este evento en un ticket de visita programada.</p>
                  </div>
                  <Switch id="convert-ticket" checked={isTicket} onCheckedChange={setIsTicket} className="data-[state=checked]:bg-amber-500" />
                </div>
                {isTicket && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Asignar visita</p>
                      <Select
                        value={assignedTo ? `user:${assignedTo}` : assignedGroupId ? `group:${assignedGroupId}` : "none"}
                        onValueChange={(val) => {
                          if (val === "none") {
                            setAssignedTo(null);
                            setAssignedGroupId(null);
                          } else if (val.startsWith("user:")) {
                            setAssignedTo(val.split(":")[1]);
                            setAssignedGroupId(null);
                          } else if (val.startsWith("group:")) {
                            setAssignedGroupId(val.split(":")[1]);
                            setAssignedTo(null);
                          }
                        }}
                      >
                        <SelectTrigger className="h-10 bg-white">
                          <SelectValue placeholder="Responsable de la visita" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          <SelectGroup>
                            <SelectLabel>Usuarios</SelectLabel>
                            {users.map((user) => (
                              <SelectItem key={user.id || user._id} value={`user:${user.id ?? user._id}`}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Grupos</SelectLabel>
                            {groups.map((group) => (
                              <SelectItem key={group._id} value={`group:${group._id}`}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-sm text-slate-600">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Inicio</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock4 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">{formattedStart}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Fin</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Clock4 className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-900">{formattedEnd}</span>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        .fc .fc-daygrid-day-top {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .calendar-weather-row {
          display: inline-flex;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: #475569;
          margin-top: 0.32rem;
          justify-content: center;
          align-items: center;
          white-space: nowrap;
          line-height: 1;
          position: relative;
        }
        .calendar-weather-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          animation: floatIcon 3s ease-in-out infinite;
        }
        .calendar-weather-temps {
          font-weight: 600;
          animation: pulseTemps 3s ease-in-out infinite;
        }
        .calendar-weather-row::after {
          content: attr(data-tooltip-text);
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translate(-50%, 6px);
          background: rgba(15, 23, 42, 0.95);
          color: white;
          padding: 0.3rem 0.55rem;
          border-radius: 999px;
          font-size: 0.65rem;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
          z-index: 10;
        }
        .calendar-weather-row:hover::after {
          opacity: 1;
          transform: translate(-50%, 12px);
        }
        .calendar-weather-alert .calendar-weather-icon {
          color: #dc2626;
        }
        .fc .fc-timegrid-slot-label .fc-timegrid-slot-label-cushion {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100%;
          width: 100%;
          padding: 0;
        }
        @keyframes floatIcon {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes pulseTemps {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </DashboardLayout >
  );
}
