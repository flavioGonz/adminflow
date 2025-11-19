"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  // Add other ticket fields as needed
}

interface ViewTicketDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ViewTicketDialog({ ticket, isOpen, onOpenChange }: ViewTicketDialogProps) {
  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p><strong>Estado:</strong> {ticket.status}</p>
          <p><strong>Fecha de Creación:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
          {/* Add more ticket details here */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
