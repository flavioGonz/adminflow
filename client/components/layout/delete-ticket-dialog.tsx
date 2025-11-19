// components/tickets/delete-ticket-dialog.tsx
"use client";

import React, { useState } from 'react';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Ticket } from '@/types/ticket';

interface DeleteTicketDialogProps {
  ticket: Pick<Ticket, 'id' | 'title'>;
  onTicketDeleted: (ticketId: string) => void;
  children: React.ReactNode;
}

export function DeleteTicketDialog({ ticket, onTicketDeleted, children }: DeleteTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    onTicketDeleted(ticket.id);
    toast.success(`Ticket "${ticket.title}" eliminado exitosamente.`);
  setIsOpen(false);
};
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el ticket{' '}
            <span className="font-semibold">#{ticket.id}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
