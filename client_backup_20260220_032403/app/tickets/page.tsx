"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TicketTable } from "@/components/clients/ticket-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterToolbar, ToolbarButton } from "@/components/ui/filter-toolbar";
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

const LOAD_INCREMENT = 50;

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>(
    "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showResolved, setShowResolved] = useState(true);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showMyGroupTickets, setShowMyGroupTickets] = useState(false);
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
      "En proceso de soporte": 2,
      Visita: 1,
      "Visita - Coordinar": 1,
      "Visita Programada": 1,
      "Visita Realizada": 1,
      "Revision Cerrar Visita": 1,
      "Pendiente de Coordinación": 2,
      "Pendiente de Cliente": 2,
      "Pendiente de Tercero": 2,
      "Pendiente de Facturación": 1,
      "Pendiente de Pago": 1,
      Cerrado: 0,
      Resuelto: 0,
      Facturar: 1,
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreResults && !isLoading) {
          setVisibleCount((prev) => Math.min(prev + LOAD_INCREMENT, filteredTickets.length));
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, hasMoreResults, isLoading, filteredTickets.length]);

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


        <FilterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por cliente, título o ID..."
          className="px-2"
        >
          {/* Main Quick Filters */}
          <ToolbarButton
            icon={TicketIcon}
            label="Todos"
            isActive={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <ToolbarButton
            icon={Lock}
            label="Cerrados"
            isActive={showResolved}
            onClick={() => setShowResolved((prev) => !prev)}
            variant="info"
          />
          <ToolbarButton
            icon={User}
            label="Mis tickets"
            isActive={showMyTickets}
            onClick={() => setShowMyTickets((prev) => !prev)}
            variant="success"
          />
          <ToolbarButton
            icon={Users}
            label="Mi grupo"
            isActive={showMyGroupTickets}
            onClick={() => setShowMyGroupTickets((prev) => !prev)}
            variant="warning"
          />

          <div className="w-px h-6 bg-slate-200/60 mx-1" />

          {/* Status Specific Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <ToolbarButton
              icon={Clock}
              label="Nuevo"
              isActive={statusFilter === "Nuevo"}
              onClick={() => setStatusFilter(statusFilter === "Nuevo" ? "all" : "Nuevo")}
            />
            <ToolbarButton
              icon={CalendarDays}
              label="Abierto"
              isActive={statusFilter === "Abierto"}
              onClick={() => setStatusFilter(statusFilter === "Abierto" ? "all" : "Abierto")}
            />
            <ToolbarButton
              icon={Clock}
              label="En Proceso"
              isActive={statusFilter === "En proceso"}
              onClick={() => setStatusFilter(statusFilter === "En proceso" ? "all" : "En proceso")}
              className="text-blue-500"
            />
            <ToolbarButton
              icon={MapPin}
              label="Visita"
              isActive={statusFilter === "Visita"}
              onClick={() => setStatusFilter(statusFilter === "Visita" ? "all" : "Visita")}
              variant="info"
            />
          </div>

          <div className="w-px h-6 bg-slate-200/60 mx-1" />

          {/* Secondary Actions */}
          <div className="flex items-center gap-2 px-1">
            <Select
              value={`${sortKey}-${sortDir}`}
              onValueChange={(value) => {
                const [key, dir] = value.split("-") as [typeof sortKey, typeof sortDir];
                setSortKey(key);
                setSortDir(dir);
              }}
            >
              <SelectTrigger className="w-36 h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm transition-all hover:bg-white focus:ring-4 focus:ring-indigo-100">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Más nuevos</SelectItem>
                <SelectItem value="createdAt-asc">Más antiguos</SelectItem>
                <SelectItem value="priority-desc">Prioridad alta</SelectItem>
                <SelectItem value="priority-asc">Prioridad baja</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-green-50 hover:border-green-200 transition-all group"
              onClick={handleExportExcel}
              title="Exportar Excel"
            >
              <FileSpreadsheet className="h-[18px] w-[18px] text-emerald-600 transition-transform group-hover:scale-110" />
            </Button>

            <Button asChild className="rounded-xl h-10 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 border-none transition-all hover:-translate-y-0.5">
              <Link href="/tickets/new">Nuevo ticket</Link>
            </Button>
          </div>
        </FilterToolbar>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="relative">
            <div
              className="max-h-[75vh] overflow-y-auto"
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
                <div ref={observerTarget} className="px-4 py-8 text-center border-t border-slate-50">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" />
                  <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mt-2">Cargando más tickets</p>
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
