"use client";

import { useRouter } from "next/navigation";

import { EditTicketDialog } from "@/components/clients/edit-ticket-dialog";
import { Ticket } from "@/types/ticket";

export default function NewTicketPage() {
  const router = useRouter();

  return (
    <EditTicketDialog
      mode="create"
      variant="page"
      onTicketCreated={(createdTicket: Ticket) => {
        router.push(`/tickets/${createdTicket.id}`);
      }}
      onClose={() => router.push("/tickets")}
    />
  );
}
