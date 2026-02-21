"use client";

import { useRouter } from "next/navigation";
import { EditTicketDialog } from "@/components/clients/edit-ticket-dialog";
import { Ticket } from "@/types/ticket";
import { Suspense } from "react";

function NewTicketContent() {
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

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Cargando formulario...</div>}>
      <NewTicketContent />
    </Suspense>
  );
}
