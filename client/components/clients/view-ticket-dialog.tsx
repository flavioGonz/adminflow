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

  // Simulación de historial de estados (en producción, esto vendría del backend)
  const estados = [
    { estado: 'Nuevo', fecha: ticket.createdAt },
    { estado: ticket.status, fecha: new Date().toISOString() },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Stepper horizontal de estados */}
          <div className="flex flex-row items-center justify-center gap-4 mb-6">
            {estados.map((e, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm ${idx === estados.length - 1 ? 'bg-emerald-600' : 'bg-slate-400'}`}>{idx + 1}</div>
                <span className="text-xs mt-1 font-semibold">{e.estado}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(e.fecha).toLocaleString()}</span>
                {idx < estados.length - 1 && <div className="w-12 h-1 bg-slate-300 mt-2 mb-2" />}
              </div>
            ))}
          </div>
          {/* Aquí puedes agregar más detalles del ticket si es necesario */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
