"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";

interface EditTicketDatetimeProps {
  ticketId: string;
  initialDate: string;
  onSuccess?: (newDate: string) => void;
  children?: React.ReactNode;
}

export function EditTicketDatetime({
  ticketId,
  initialDate,
  onSuccess,
  children,
}: EditTicketDatetimeProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Parse initial date
  const initialDateTime = new Date(initialDate);
  const date = initialDateTime.toISOString().split("T")[0];
  const time = initialDateTime.toTimeString().slice(0, 5);

  const [formDate, setFormDate] = useState(date);
  const [formTime, setFormTime] = useState(time);

  useEffect(() => {
    const nextDateTime = new Date(initialDate);
    const nextDate = nextDateTime.toISOString().split("T")[0];
    const nextTime = nextDateTime.toTimeString().slice(0, 5);
    setFormDate(nextDate);
    setFormTime(nextTime);
  }, [initialDate]);

  const handleSave = async () => {
    if (!formDate || !formTime) {
      toast.error("Por favor ingresa fecha y hora válidas");
      return;
    }

    setLoading(true);
    try {
      const combinedDateTime = new Date(`${formDate}T${formTime}:00`);
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdAt: combinedDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo actualizar el ticket");
      }

      toast.success("Fecha y hora actualizadas");
      setOpen(false);
      onSuccess?.(combinedDateTime.toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Fecha y Hora del Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fecha
              </Label>
              <Input
                id="ticket-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora
              </Label>
              <Input
                id="ticket-time"
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
