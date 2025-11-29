"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TicketTable } from "@/components/clients/ticket-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileDown, FileSpreadsheet, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { ShinyText } from "@/components/ui/shiny-text";
import {
  Ticket,
  TicketAttachment,
  TicketAudioNote,
} from "@/types/ticket";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { API_URL } from "@/lib/http";

type ApiTicket = Partial<Ticket> & {
  subject?: string;
  client?: { name?: string };
};

const statusDictionary: Record<string, Ticket["status"]> = {
  nuevo: "Nuevo",
  abierto: "Abierto",
  "en proceso": "En proceso",
  "en proceso de soporte": "En proceso",
  visita: "Visita",
  resuelto: "Resuelto",
  cerrado: "Resuelto",
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>(
    "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleTicketDeleted = (ticketId: string) => {
    setTickets((prevTickets) =>
      prevTickets.filter((ticket) => ticket.id !== ticketId)
    );
    fetchTickets();
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
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const title = (ticket.title ?? "").toLowerCase();
      const client = (ticket.clientName ?? "").toLowerCase();
      const id = String(ticket.id ?? "").toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        client.includes(normalizedSearch) ||
        id.includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, searchTerm, statusFilter]);

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
    <div className="flex flex-col gap-6">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Tickets totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En curso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Para facturar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.toBill}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resueltos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex-1 min-w-[260px]">
          <Input
            placeholder="Buscar por cliente, título o ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | Ticket["status"]) =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Nuevo">Nuevo</SelectItem>
              <SelectItem value="Abierto">Abierto</SelectItem>
              <SelectItem value="En proceso">En proceso</SelectItem>
              <SelectItem value="Visita">Visita</SelectItem>
              <SelectItem value="Resuelto">Resuelto</SelectItem>
              <SelectItem value="Facturar">Facturar</SelectItem>
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

      {isLoading ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Cargando tickets...
        </div>
      ) : (
        <TicketTable
          tickets={filteredTickets}
          onTicketDeleted={handleTicketDeleted}
          onReopenTicket={handleReopenTicket}
          actionLoadingTicketId={actionLoading}
        />
      )}
    </div>
  );
}
