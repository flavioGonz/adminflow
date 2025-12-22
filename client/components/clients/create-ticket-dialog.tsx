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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, User, FileText, BarChart, AlertTriangle, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Ticket } from "@/types/ticket";

interface CreateTicketDialogProps {
  onTicketCreated: (ticket: Ticket) => void;
}

export function CreateTicketDialog({ onTicketCreated }: CreateTicketDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [status, setStatus] = useState<Ticket["status"]>("Nuevo");
  const [priority, setPriority] = useState<Ticket["priority"]>("Media");
  const [amount, setAmount] = useState(0);
  const [visit, setVisit] = useState(false);
  const [notes, setNotes] = useState("");
  const [annotations, setAnnotations] = useState<{ text: string; createdAt: string }[]>([]);

  const handleAddAnnotation = () => {
    if (notes.trim()) {
      const newAnnotation = { text: notes, createdAt: new Date().toISOString() };
      setAnnotations([...annotations, newAnnotation]);
      setNotes("");
    }
  };

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
      amount,
      visit,
      createdAt: new Date().toISOString(),
      annotations,
    };

    onTicketCreated(newTicket);
    toast.success("Ticket creado exitosamente.");
    setIsOpen(false);
    // Reset form
    setTitle("");
    setClientName("");
    setStatus("Nuevo");
    setPriority("Media");
    setAmount(0);
    setVisit(false);
    setNotes("");
    setAnnotations([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ticket</DialogTitle>
          <DialogDescription>
            Complete los detalles para crear un nuevo ticket de soporte.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="flex items-center gap-1 mb-2"><FileText className="h-4 w-4" />Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="clientName" className="flex items-center gap-1 mb-2"><User className="h-4 w-4" />Cliente</Label>
                {/* TODO: Implement client search component */}
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="status" className="flex items-center gap-1 mb-2"><BarChart className="h-4 w-4" />Estado</Label>
                <Select onValueChange={(value: Ticket["status"]) => setStatus(value)} defaultValue={status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Abierto">Abierto</SelectItem>
                    <SelectItem value="En proceso">En proceso</SelectItem>
                    <SelectItem value="Visita">Visita</SelectItem>
                    <SelectItem value="Visita - Coordinar">Visita - Coordinar</SelectItem>
                    <SelectItem value="Visita Programada">Visita Programada</SelectItem>
                    <SelectItem value="Visita Realizada">Visita Realizada</SelectItem>
                    <SelectItem value="Revision Cerrar Visita">Revision Cerrar Visita</SelectItem>
                    <SelectItem value="Resuelto">Resuelto</SelectItem>
                    <SelectItem value="Facturar">Facturar</SelectItem>
                    <SelectItem value="Pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
                {status === "En proceso" && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Contador de tiempo (WIP)</span>
                  </div>
                )}
                {status === "Facturar" && (
                  <div className="mt-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="priority" className="flex items-center gap-1 mb-2"><AlertTriangle className="h-4 w-4" />Prioridad</Label>
                <Select onValueChange={(value: Ticket["priority"]) => setPriority(value)} defaultValue={priority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baja">Baja</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visit"
                  checked={visit}
                  onCheckedChange={(checked) => setVisit(checked === true)}
                />
                <Label htmlFor="visit">Visita</Label>
              </div>
            </div>
          </div>
          <div className="py-4">
            <Label htmlFor="notes" className="flex items-center gap-1 mb-2"><Calendar className="h-4 w-4" />Actividad (Anotaciones)</Label>
            <div className="flex gap-2">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Añada una nueva anotación al ticket..." />
              <Button type="button" onClick={handleAddAnnotation}>Agregar</Button>
            </div>
            <div className="mt-4 space-y-4">
              {annotations.map((annotation, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-px h-full bg-gray-300"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{new Date(annotation.createdAt).toLocaleString()}</p>
                    <p>{annotation.text}</p>
                  </div>
                </div>
              ))}
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
