// app/tickets/page.tsx
"use client";

import React, { useState } from "react";
import { TicketTable } from "@/components/clients/ticket-table";
import { CreateTicketDialog } from "@/components/clients/create-ticket-dialog";
import { Ticket } from "@/types/ticket";

const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Problema con la facturacion de Enero",
    clientName: "Juan Perez",
    status: "Abierto",
    priority: "Alta",
    createdAt: new Date("2024-05-20T09:00:00Z").toISOString(),
  },
  {
    id: "TKT-002",
    title: "Consulta sobre el contrato de servicio",
    clientName: "Maria Garcia",
    status: "En proceso",
    priority: "Media",
    createdAt: new Date("2024-05-19T14:30:00Z").toISOString(),
  },
  {
    id: "TKT-003",
    title: "Falla en el acceso al portal de clientes",
    clientName: "Carlos Lopez",
    status: "Resuelto",
    priority: "Baja",
    createdAt: new Date("2024-05-18T11:00:00Z").toISOString(),
  },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prevTickets) => [newTicket, ...prevTickets]);
  };

  const handleTicketDeleted = (ticketId: string) => {
    setTickets((prevTickets) => prevTickets.filter((ticket) => ticket.id !== ticketId));
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets de Soporte</h1>
        <CreateTicketDialog onTicketCreated={handleTicketCreated} />
      </div>
      <TicketTable tickets={tickets} onTicketDeleted={handleTicketDeleted} />
    </div>
  );
}
