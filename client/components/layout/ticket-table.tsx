// components/tickets/ticket-table.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { DeleteTicketDialog } from "./delete-ticket-dialog";
import { EditTicketDialog } from "@/components/clients/edit-ticket-dialog";
import { Ticket } from "@/types/ticket";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from "@/lib/http";
import { toast } from "sonner";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketDeleted: (ticketId: string) => void;
}

export function TicketTable({ tickets, onTicketUpdated, onTicketDeleted }: TicketTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const getStatusVariant = (status: Ticket["status"]) => {
    switch (status) {
      case "Abierto":
        return "default";
      case "En proceso":
        return "secondary";
      case "Resuelto":
        return "outline";
      default:
        return "default";
    }
  };

  const getPriorityVariant = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "Alta":
        return "destructive";
      case "Media":
        return "default";
      case "Baja":
        return "secondary";
      default:
        return "default";
    }
  };

  const statusOptions: Ticket["status"][] = ["Nuevo", "Abierto", "En proceso", "Visita", "Resuelto", "Facturar", "Pagado"];

  const handleStatusChange = async (ticket: Ticket, value: Ticket["status"]) => {
    setUpdatingId(ticket.id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, status: value }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar estado (${response.status})`);
      }
      const updated = await response.json();
      onTicketUpdated(updated);
      toast.success(`Estado actualizado a ${value}`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar tickets..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>{ticket.clientName}</TableCell>
                  <TableCell>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket, value as Ticket["status"])}
                      disabled={updatingId === ticket.id}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <EditTicketDialog ticket={ticket} onTicketUpdated={onTicketUpdated}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditTicketDialog>
                      <DeleteTicketDialog ticket={ticket} onTicketDeleted={onTicketDeleted}>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DeleteTicketDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron tickets.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={currentPage === 1 ? undefined : handlePreviousPage}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "opacity-40 pointer-events-none" : undefined}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : handleNextPage}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
