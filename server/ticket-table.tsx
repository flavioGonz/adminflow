// components/tickets/ticket-table.tsx
"use client";

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
import { EditTicketDialog } from "@/components/tickets/edit-ticket-dialog";
import { DeleteTicketDialog } from "@/components/tickets/delete-ticket-dialog";
import { Ticket } from "@/app/tickets/page";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketUpdated: (ticket: Ticket) => void;
  onTicketDeleted: (ticketId: string) => void;
}

export function TicketTable({ tickets, onTicketUpdated, onTicketDeleted }: TicketTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;

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
      case "En Progreso":
        return "secondary";
      case "Cerrado":
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
                    <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
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
            <PaginationPrevious onClick={handlePreviousPage} disabled={currentPage === 1} />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext onClick={handleNextPage} disabled={currentPage === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}