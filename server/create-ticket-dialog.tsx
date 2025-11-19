// components/tickets/create-ticket-dialog.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, User, FileText, BarChart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Ticket } from "@/app/tickets/page";

interface CreateTicketDialogProps {
  onTicketCreated: (ticket: Ticket) => void;
}

export function CreateTicketDialog({ onTicketCreated }: CreateTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<Ticket["status"]>("Abierto");
  const [priority, setPriority] = useState<Ticket["priority"]>("Media");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName) {
      toast.error("Por favor, complete todos los campos obligatorios.");
      return;
    }

    const newTicket: Ticket = {
      id: `TKT-${String(Date.now()).slice(-4)}`,
      title,
      clientName,
      status,
      priority,
      createdAt: new Date().toISOString(),
    };

    onTicketCreated(newTicket);
    toast.success("Ticket creado exitosamente.");
    setIsOpen(false);
    // Reset form
    setTitle("");
    setClientName("");
    setStatus("Abierto");
    setPriority("Media");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Complete los detalles para crear un nuevo ticket de soporte.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right flex items-center gap-1"><FileText className="h-4 w-4" />Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right flex items-center gap-1"><User className="h-4 w-4" />Cliente</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right flex items-center gap-1"><BarChart className="h-4 w-4" />Estado</Label>
              <Select onValueChange={(value: Ticket["status"]) => setStatus(value)} defaultValue={status}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Abierto">Abierto</SelectItem>
                  <SelectItem value="En Progreso">En Progreso</SelectItem>
                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right flex items-center gap-1"><AlertTriangle className="h-4 w-4" />Prioridad</Label>
              <Select onValueChange={(value: Ticket["priority"]) => setPriority(value)} defaultValue={priority}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione una prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baja">Baja</SelectItem>
                  <SelectItem value="Media">Media</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Ticket</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}