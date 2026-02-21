// client/components/clients/client-tickets-tab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Ticket as TicketIcon,
  Calendar,
  Hash,
  Info,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/http";

interface Ticket {
  id: string;
  title: string;
  clientName: string;
  status: "Nuevo" | "Abierto" | "En proceso" | "Resuelto" | "Facturar";
  priority: "Alta" | "Media" | "Baja";
  createdAt: string;
  amount?: number;
  visit?: boolean;
  annotations?: { text: string; createdAt: string }[];
  hasActiveContract?: boolean;
}

interface ClientTicketsTabProps {
  clientId: string;
}

export function ClientTicketsTab({ clientId }: ClientTicketsTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Ticket["status"]>(
    "all"
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    if (!clientId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/tickets`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTickets(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch tickets.";
      setError(message);
      console.error("Error fetching tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "abierto":
        return "default";
      case "en proceso":
        return "secondary";
      case "resuelto":
        return "default";
      case "nuevo":
        return "secondary";
      case "facturar":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "baja":
        return "outline";
      case "media":
        return "default";
      case "alta":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesSearch =
        !term ||
        ticket.title.toLowerCase().includes(term) ||
        ticket.id.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter(
      (ticket) => ticket.status === "Abierto" || ticket.status === "En proceso"
    ).length;
    const newOnes = tickets.filter((ticket) => ticket.status === "Nuevo").length;
    const toBill = tickets.filter(
      (ticket) => ticket.status === "Facturar"
    ).length;
    return { total, active, newOnes, toBill };
  }, [tickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  if (loading) {
    return <div className="p-4">Cargando tickets...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-6 w-6" /> Tickets del Cliente
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar ticket..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-48"
              disabled={loading}
            />
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | Ticket["status"]) =>
                setStatusFilter(value)
              }
              disabled={loading}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Nuevo">Nuevo</SelectItem>
                <SelectItem value="Abierto">Abierto</SelectItem>
                <SelectItem value="En proceso">En proceso</SelectItem>
                <SelectItem value="Resuelto">Resuelto</SelectItem>
                <SelectItem value="Facturar">Facturar</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
        <div className="grid gap-3 text-center md:grid-cols-4">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-2xl font-semibold">{metrics.active}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Nuevos</p>
            <p className="text-2xl font-semibold">{metrics.newOnes}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Por facturar</p>
            <p className="text-2xl font-semibold">{metrics.toBill}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Hash className="mr-1 inline-block h-4 w-4" /> ID
                  </TableHead>
                  <TableHead>
                    <Info className="mr-1 inline-block h-4 w-4" /> Titulo
                  </TableHead>
                  <TableHead>
                    <AlertCircle className="mr-1 inline-block h-4 w-4" /> Estado
                  </TableHead>
                  <TableHead>
                    <AlertCircle className="mr-1 inline-block h-4 w-4" />{" "}
                    Prioridad
                  </TableHead>
                  <TableHead>
                    <Calendar className="mr-1 inline-block h-4 w-4" /> Creado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-700">
            No hay tickets que coincidan con los filtros.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
