'use client';

import React, { useState } from "react";
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
import { MobileTicketCard } from "@/components/tickets/mobile-ticket-card";

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
      String(ticket.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const getPriorityVariant = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "Alta": return "destructive";
      case "Media": return "default";
      case "Baja": return "secondary";
      default: return "default";
    }
  };

  const statusOptions: Ticket["status"][] = ["Nuevo","Abierto","En proceso","Visita","Visita - Coordinar","Visita Programada","Visita Realizada","Revision Cerrar Visita","Resuelto","Facturar","Pagado"];

  const handleStatusChange = async (ticket: Ticket, value: Ticket["status"]) => {
    setUpdatingId(ticket.id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, status: value }),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      const updated = await response.json();
      onTicketUpdated(updated);
      toast.success(`Estado actualizado a ${value}`);
    } catch (err: any) {
      toast.error("No se pudo actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar tickets..."
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        className="max-w-sm filter-bar-desktop"
      />

      {/* 📱 Mobile Cards View */}
      <div className="mobile-cards-view">
        {currentTickets.map((ticket) => (
          <MobileTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {/* 💻 Desktop Table View */}
      <div className="desktop-table-view rounded-md border">
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
                    <Select value={ticket.status} onValueChange={(v) => handleStatusChange(ticket, v as any)} disabled={updatingId === ticket.id}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>{statusOptions.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge></TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <EditTicketDialog ticket={ticket} onTicketUpdated={onTicketUpdated}><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button></EditTicketDialog>
                      <DeleteTicketDialog ticket={ticket} onTicketDeleted={onTicketDeleted}><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></DeleteTicketDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="h-24 text-center">No se encontraron tickets.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className={totalPages <= 1 ? 'hidden' : ''}>
        <PaginationContent>
          <PaginationItem><PaginationPrevious onClick={currentPage === 1 ? undefined : handlePreviousPage} className={currentPage === 1 ? "opacity-40 pointer-events-none" : "cursor-pointer"} /></PaginationItem>
          <PaginationItem><PaginationNext onClick={currentPage === totalPages ? undefined : handleNextPage} className={currentPage === totalPages ? "opacity-40 pointer-events-none" : "cursor-pointer"} /></PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
