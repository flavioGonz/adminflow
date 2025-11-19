// components/tickets/delete-ticket-dialog.tsx
"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Ticket } from "@/types/ticket";
import { API_URL } from "@/lib/http";

interface DeleteTicketDialogProps {
  ticket: Pick<Ticket, "id" | "title">;
  onTicketDeleted: (ticketId: string) => void;
  children: React.ReactNode;
}

export function DeleteTicketDialog({ ticket, onTicketDeleted, children }: DeleteTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo eliminar el ticket.");
      }

      onTicketDeleted(ticket.id);
      toast.success(`Ticket "${ticket.title}" eliminado exitosamente.`);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar el ticket."
      );
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el ticket{" "}
            <span className="font-semibold">#{ticket.id}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
