"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TicketTable } from "@/components/clients/ticket-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { FileDown, FileSpreadsheet, Ticket as TicketIcon, Clock, Banknote, CheckCircle, CalendarDays, MapPin, Activity, Loader2, User, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { ShinyText } from "@/components/ui/shiny-text";
import { PageTransition } from "@/components/ui/page-transition";
import { TicketsTimeline } from "@/components/tickets/tickets-timeline";
import { cn } from "@/lib/utils";
import {
  Ticket,
  TicketAttachment,
  TicketAudioNote,
} from "@/types/ticket";
import { Group } from "@/types/group";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { API_URL } from "@/lib/http";
import { emitTicketDeleted } from "@/lib/app-events";

type ApiTicket = Partial<Ticket> & {
  subject?: string;
  client?: { name?: string };
};

const statusDictionary: Record<string, Ticket["status"]> = {
  nuevo: "Nuevo",
  abierto: "Abierto",
  "en proceso": "En proceso",
  "en proceso de soporte": "En proceso de soporte",
  visita: "Visita",
  "visita - coordinar": "Visita - Coordinar",
  "visita programada": "Visita Programada",
  "visita realizada": "Visita Realizada",
  "revision cerrar visita": "Revision Cerrar Visita",
  "pendiente de coordinación": "Pendiente de Coordinación",
  "pendiente de cliente": "Pendiente de Cliente",
  "pendiente de tercero": "Pendiente de Tercero",
  "pendiente de facturación": "Pendiente de Facturación",
  "pendiente de pago": "Pendiente de Pago",
  cerrado: "Cerrado",
  resuelto: "Resuelto",
  facturar: "Facturar",
};

const priorityDictionary: Record<string, Ticket["priority"]> = {
  alta: "Alta",
  urgente: "Alta",
  media: "Media",
  normal: "Media",
  baja: "Baja",
};

const normalizeAnnotations = (
  raw: unknown
): { text: string; createdAt: string }[] => {
  if (Array.isArray(raw)) {
    return raw as { text: string; createdAt: string }[];
  }

  if (typeof raw === "string" && raw.trim().length > 0) {
    return [{ text: raw, createdAt: new Date().toISOString() }];
  }

  return [];
};

const normalizeTicket = (raw: ApiTicket): Ticket => {
  const statusKey = typeof raw.status === "string" ? raw.status.toLowerCase() : "";
  const priorityKey =
    typeof raw.priority === "string" ? raw.priority.toLowerCase() : "";

  return {
    id: raw.id ?? crypto.randomUUID(),
    title: raw.title ?? raw.subject ?? "Ticket sin título",
    clientName: raw.clientName ?? raw.client?.name ?? "Cliente sin nombre",
    clientId: raw.clientId,
    status: statusDictionary[statusKey] ?? "Nuevo",
    priority: priorityDictionary[priorityKey] ?? "Media",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    amount: raw.amount,
    visit:
      (statusDictionary[statusKey] === "Visita") ||
      Boolean(raw.visit),
    annotations: normalizeAnnotations(raw.annotations),
    hasActiveContract: raw.hasActiveContract ?? false,
    description: typeof raw.description === "string" ? raw.description : "",
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as TicketAttachment[])
      : [],
    audioNotes: Array.isArray(raw.audioNotes)
      ? (raw.audioNotes as TicketAudioNote[])
      : [],
    assignedTo: raw.assignedTo || null,
    assignedGroupId: raw.assignedGroupId || null,
  };
};

const fallbackTickets: Ticket[] = [
  {
    id: "T001",
    title: "Problema con la red interna",
    clientName: "Cliente Demo A",
    status: "Abierto",
    priority: "Alta",
    createdAt: new Date().toISOString(),
    hasActiveContract: true,
    description:
      "<p>Ticket de ejemplo generado localmente debido a un error de conexión.</p>",
  },
  {
    id: "T002",
    title: "Solicitud de nueva cuenta VPN",
    clientName: "Cliente Demo B",
    status: "En proceso",
    priority: "Media",
    createdAt: new Date().toISOString(),
    hasActiveContract: false,
  },
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });

const LOAD_INCREMENT = 20;

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>(
    "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showResolved, setShowResolved] = useState(true);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showMyGroupTickets, setShowMyGroupTickets] = useState(false);
  const [timelinePeriod, setTimelinePeriod] = useState<"day" | "week" | "month">("day");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserGroupId, setCurrentUserGroupId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | Ticket["priority"]>("all");
  const [onlyContract, setOnlyContract] = useState(false);
  const [sortKey, setSortKey] = useState<"createdAt" | "priority" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          setCurrentUserEmail(session?.user?.email || null);
          setCurrentUserAvatar(session?.user?.image || null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchUserSession();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("tickets-filter-toggles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.showResolved === "boolean") setShowResolved(parsed.showResolved);
        if (typeof parsed.showMyTickets === "boolean") setShowMyTickets(parsed.showMyTickets);
        if (typeof parsed.showMyGroupTickets === "boolean") setShowMyGroupTickets(parsed.showMyGroupTickets);
      }
    } catch (error) {
      console.error("No se pudieron leer filtros locales", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      showResolved,
      showMyTickets,
      showMyGroupTickets,
    };
    localStorage.setItem("tickets-filter-toggles", JSON.stringify(payload));
  }, [showResolved, showMyTickets, showMyGroupTickets]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickets`);
      if (!response.ok) {
        const baseMessage =
          response.status === 404
            ? "El backend no expone /api/tickets (404)."
            : `Error ${response.status} al cargar los tickets.`;
        toast.error(
          `${baseMessage} Mostramos datos locales para que sigas trabajando.`
        );
        setTickets((prev) => (prev.length > 0 ? prev : fallbackTickets));
        return;
      }
      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((item) => normalizeTicket(item as ApiTicket))
        : [];
      setTickets(normalized);
      setVisibleCount(LOAD_INCREMENT);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado al cargar los tickets.";
      toast.error(
        `${message} Mostramos datos locales para que sigas trabajando.`
      );
      setTickets((prev) => (prev.length > 0 ? prev : fallbackTickets));
      setVisibleCount(LOAD_INCREMENT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const handleRefresh = () => fetchTickets();
    window.addEventListener("tickets:refresh", handleRefresh);
    return () => window.removeEventListener("tickets:refresh", handleRefresh);
  }, [fetchTickets]);

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          console.warn("No se pudieron cargar los grupos:", response.status);
          setGroups([]);
          return;
        }
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") return;
        console.error("Error loading groups:", error);
      }
    };
    loadGroups();
    return () => controller.abort();
  }, []);

  const handleTicketDeleted = (ticketId: string) => {
    setTickets((prevTickets) =>
      prevTickets.filter((ticket) => ticket.id !== ticketId)
    );
    fetchTickets();
    emitTicketDeleted(ticketId);
  };

  const handleReopenTicket = useCallback(
    async (ticket: Ticket) => {
      if (!window.confirm("Reabrir este ticket y enviarlo de nuevo a facturar?")) {
        return;
      }
      const actionKey = `unlock-${ticket.id}`;
      setActionLoading(actionKey);
      try {
        await fetch(`${API_URL}/tickets/${ticket.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Facturar" }),
        });
        setTickets((prev) =>
          prev.map((current) =>
            current.id === ticket.id ? { ...current, status: "Facturar" } : current
          )
        );
        toast.success("Ticket reabierto para Facturar.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo reabrir el ticket.";
        toast.error(message);
      } finally {
        setActionLoading(null);
      }
    },
    []
  );

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    const filtered = tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesContract = !onlyContract || ticket.hasActiveContract;
      const title = (ticket.title ?? "").toLowerCase();
      const client = (ticket.clientName ?? "").toLowerCase();
      const id = String(ticket.id ?? "").toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        client.includes(normalizedSearch) ||
        id.includes(normalizedSearch);

      // Filter resolved tickets (hide Resuelto and Pagado when toggle off)
      if (!showResolved && (ticket.status === "Resuelto" || ticket.status === "Pagado")) {
        return false;
      }

      // Filter my tickets
      if (showMyTickets && currentUserEmail && ticket.assignedTo !== currentUserEmail) {
        return false;
      }

      // Filter my group tickets
      if (showMyGroupTickets && currentUserGroupId && ticket.assignedGroupId !== currentUserGroupId) {
        return false;
      }

      return matchesStatus && matchesPriority && matchesContract && matchesSearch;
    });

    const isResolved = (status: Ticket["status"]) => status === "Resuelto" || status === "Pagado";

    const priorityRank: Record<Ticket["priority"], number> = {
      Alta: 2,
      Media: 1,
      Baja: 0,
    };
    const statusRank: Record<Ticket["status"], number> = {
      Nuevo: 3,
      Abierto: 2,
      "En proceso": 2,
      Visita: 2,
      "Visita - Coordinar": 2,
      "Visita Programada": 2,
      "Visita Realizada": 2,
      "Revision Cerrar Visita": 2,
      Facturar: 1,
      Resuelto: 0,
      Pagado: 0,
    };

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "createdAt") {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortDir === "desc" ? bTime - aTime : aTime - bTime;
      }
      if (sortKey === "priority") {
        const diff = priorityRank[b.priority] - priorityRank[a.priority];
        return sortDir === "desc" ? diff : -diff;
      }
      const diff = statusRank[b.status] - statusRank[a.status];
      return sortDir === "desc" ? diff : -diff;
    });

    if (sortKey !== "createdAt") {
      sorted.sort((a, b) => {
        const aResolved = isResolved(a.status);
        const bResolved = isResolved(b.status);
        if (aResolved === bResolved) return 0;
        return aResolved ? 1 : -1;
      });
    }

    return sorted;
  }, [tickets, searchTerm, statusFilter, showResolved, showMyTickets, showMyGroupTickets, currentUserEmail, currentUserGroupId, priorityFilter, onlyContract, sortKey, sortDir]);

  const visibleTickets = useMemo(
    () => filteredTickets.slice(0, visibleCount),
    [filteredTickets, visibleCount]
  );
  const hasMoreResults = visibleCount < filteredTickets.length;

  useEffect(() => {
    setVisibleCount(LOAD_INCREMENT);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    onlyContract,
    showResolved,
    showMyTickets,
    showMyGroupTickets,
    currentUserEmail,
    currentUserGroupId,
    sortKey,
    sortDir,
  ]);

  const handleScroll = useCallback(() => {
    const container = tableScrollRef.current;
    if (!container || isLoading || !hasMoreResults) return;
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 150) {
      setVisibleCount((prev) => Math.min(prev + LOAD_INCREMENT, filteredTickets.length));
    }
  }, [filteredTickets.length, hasMoreResults, isLoading]);

  const exportRows = useMemo(
    () =>
      filteredTickets.map((ticket) => ({
        ID: ticket.id,
        Fecha: new Date(ticket.createdAt).toLocaleString("es-AR"),
        Cliente: ticket.clientName,
        Título: ticket.title,
        Estado: ticket.status,
      })),
    [filteredTickets]
  );


  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, "tickets.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    autoTable(doc, {
      head: [["ID", "Fecha", "Cliente", "Título", "Estado"]],
      body: exportRows.map((row) => [row.ID, row.Fecha, row.Cliente, row["Título"], row.Estado]),
      styles: { fontSize: 9 },
    });
    doc.save("tickets.pdf");
  };

  const metrics = useMemo(() => {
    const total = tickets.length;
    const inProgress = tickets.filter((ticket) =>
      ["Nuevo", "Abierto", "En proceso", "Visita"].includes(ticket.status)
    ).length;
    const toBill = tickets.filter(
      (ticket) => ticket.status === "Facturar"
    ).length;
    const resolved = tickets.filter(
      (ticket) => ticket.status === "Resuelto"
    ).length;
    return { total, inProgress, toBill, resolved };
  }, [tickets]);


  return (
    <PageTransition>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <TicketIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                <ShinyText size="3xl" weight="bold">Gestión de Tickets</ShinyText>
              </h1>
              <p className="text-sm text-muted-foreground">
                Visualiza el estado de los casos y actúa de forma rápida.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Actividad temporal</div>
          <div className="flex items-center gap-2">
            {[{ key: "day", label: "1" }, { key: "week", label: "7" }, { key: "month", label: "30" }].map((option) => (
              <Button
                key={option.key}
                variant={timelinePeriod === option.key ? "default" : "outline"}
                size="sm"
                className="h-8 w-12 px-2 justify-center gap-1"
                onClick={() => setTimelinePeriod(option.key as "day" | "week" | "month")}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="-mt-2">
          <TicketsTimeline tickets={tickets} period={timelinePeriod} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
          <div className="flex-1 min-w-[260px]">
            <Input
              placeholder="Buscar por cliente, título o ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
              <ToggleGroup type="multiple" className="flex flex-wrap gap-1 items-center">
              {/* Filtros de estado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="all-status"
                    className={cn(statusFilter === "all" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter("all")}
                    aria-label="Todos los estados"
                  >
                    <TicketIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Todos los estados</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="cerrados"
                    className={cn(showResolved && "bg-primary text-primary-foreground")}
                    onClick={() => setShowResolved((prev) => !prev)}
                    aria-label="Mostrar cerrados"
                  >
                    <Lock className="h-4 w-4 text-slate-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{showResolved ? "Ocultar cerrados" : "Mostrar cerrados"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="asignados-mi"
                    className={cn(showMyTickets && "bg-primary text-primary-foreground")}
                    onClick={() => setShowMyTickets((prev) => !prev)}
                    aria-label="Asignados a mí"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{showMyTickets ? "Ver todos" : "Asignados a mí"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="asignados-grupo"
                    className={cn(showMyGroupTickets && "bg-primary text-primary-foreground")}
                    onClick={() => setShowMyGroupTickets((prev) => !prev)}
                    aria-label="Asignados a mi grupo"
                  >
                    <Users className="h-4 w-4 text-slate-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>{showMyGroupTickets ? "Ver todos" : "Asignados a mi grupo"}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="nuevo"
                    className={cn(statusFilter === "Nuevo" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Nuevo" ? "all" : "Nuevo")}
                    aria-label="Nuevo"
                  >
                    <Clock className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Nuevo</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="abierto"
                    className={cn(statusFilter === "Abierto" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Abierto" ? "all" : "Abierto")}
                    aria-label="Abierto"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Abierto</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="enproceso"
                    className={cn(statusFilter === "En proceso" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "En proceso" ? "all" : "En proceso")}
                    aria-label="En proceso"
                  >
                    <Clock className="h-4 w-4 text-blue-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: En proceso</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="visita"
                    className={cn(statusFilter === "Visita" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Visita" ? "all" : "Visita")}
                    aria-label="Visita"
                  >
                    <CalendarDays className="h-4 w-4 text-purple-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Visita</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="visita-coordinar"
                    className={cn(statusFilter === "Visita - Coordinar" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Visita - Coordinar" ? "all" : "Visita - Coordinar")}
                    aria-label="Visita - Coordinar"
                  >
                    <MapPin className="h-4 w-4 text-purple-400" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Visita - Coordinar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="visita-programada"
                    className={cn(statusFilter === "Visita Programada" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Visita Programada" ? "all" : "Visita Programada")}
                    aria-label="Visita Programada"
                  >
                    <Clock className="h-4 w-4 text-indigo-500" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Visita Programada</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="visita-realizada"
                    className={cn(statusFilter === "Visita Realizada" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Visita Realizada" ? "all" : "Visita Realizada")}
                    aria-label="Visita Realizada"
                  >
                    <CheckCircle className="h-4 w-4 text-teal-600" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Visita Realizada</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem
                    value="revision-cerrar-visita"
                    className={cn(statusFilter === "Revision Cerrar Visita" && "bg-primary text-primary-foreground")}
                    onClick={() => setStatusFilter(statusFilter === "Revision Cerrar Visita" ? "all" : "Revision Cerrar Visita")}
                    aria-label="Revision Cerrar Visita"
                  >
                    <Activity className="h-4 w-4 text-amber-600" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Estado: Revisión Cerrar Visita</TooltipContent>
              </Tooltip>
            </ToggleGroup>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={`${sortKey}-${sortDir}`}
                onValueChange={(value) => {
                  const [key, dir] = value.split("-") as [typeof sortKey, typeof sortDir];
                  setSortKey(key);
                  setSortDir(dir);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Más nuevos</SelectItem>
                  <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                  <SelectItem value="priority-desc">Prioridad alta primero</SelectItem>
                  <SelectItem value="priority-asc">Prioridad baja primero</SelectItem>
                  <SelectItem value="status-desc">Estado abiertos primero</SelectItem>
                  <SelectItem value="status-asc">Estado cerrados primero</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleExportPdf}
              >
                <FileDown className="h-4 w-4 text-red-500" />
                PDF
              </Button>
              <Button asChild>
                <Link href="/tickets/new">Nuevo ticket</Link>
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="relative">
            <div
              ref={tableScrollRef}
              className="max-h-[65vh] overflow-y-auto"
              onScroll={handleScroll}
            >
              <TicketTable
                tickets={visibleTickets}
                onTicketDeleted={handleTicketDeleted}
                onReopenTicket={handleReopenTicket}
                actionLoadingTicketId={actionLoading}
                groups={groups}
                disablePagination
              />
              {hasMoreResults && (
                <div className="px-4 py-3 text-center text-xs text-slate-500">
                  Desliza para cargar más tickets
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
