// client/components/clients/edit-client-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { User, Tag, CreditCard, Mail, Phone, Home, FileSignature, Bell } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";

interface Client {
  id: string;
  name: string;
  alias?: string;
  rut?: string;
  email: string;
  phone?: string;
  address?: string;
  contract?: boolean;
  notificationsEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface EditClientDialogProps {
  client: Client;
  onClientUpdated: (client: Client) => void;
  children: React.ReactNode;
}

export function EditClientDialog({ client, onClientUpdated, children }: EditClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(client.name ?? "");
  const [alias, setAlias] = useState(client.alias ?? "");
  const [rut, setRut] = useState(client.rut ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [contract, setContract] = useState(client.contract || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(client.notificationsEnabled ?? true);

  useEffect(() => {
    setName(client.name ?? "");
    setAlias(client.alias ?? "");
    setRut(client.rut ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setAddress(client.address ?? "");
    setContract(client.contract || false);
    setNotificationsEnabled(client.notificationsEnabled ?? true);
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Por favor, complete el campo Nombre.");
      return;
    }

    const updatedClientData = {
      name,
      alias,
      rut,
      email,
      phone,
      address,
      contract,
      notificationsEnabled,
    };

    try {
      const response = await fetch(`${API_URL}/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedClientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el cliente.");
      }

      const result = await response.json();
      onClientUpdated(result); // Pass the updated client from the server
      toast.success("Cliente actualizado exitosamente.");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error al actualizar el cliente.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Realice cambios en los detalles del cliente aquí.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Nombre del cliente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="alias"
                    placeholder="Alias (opcional)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rut"
                    placeholder="RUT del cliente"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+598 99 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <div className="relative">
                <Home className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Dirección completa"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contract"
                  checked={contract}
                  onCheckedChange={(checked) => setContract(checked as boolean)}
                />
                <Label htmlFor="contract" className="cursor-pointer flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-muted-foreground" />
                  Tiene contrato activo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => setNotificationsEnabled(Boolean(checked))}
                />
                <Label htmlFor="notifications" className="cursor-pointer flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Recibir notificaciones automáticas por correo
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
