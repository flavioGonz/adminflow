// client/components/clients/create-client-dialog.tsx
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
import { PlusCircle, User, Tag, CreditCard, Mail, Phone, Home, FileSignature, Bell } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Client } from "@/types/client";
import { API_URL } from "@/lib/http";

interface CreateClientDialogProps {
  onClientCreated: (client: Client) => void;
}

export function CreateClientDialog({ onClientCreated }: CreateClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, complete el campo Nombre.");
      return;
    }
    if (!email.trim()) {
      toast.error("Por favor, complete el campo Email.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          alias: alias.trim(),
          rut: rut.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          contract,
          notificationsEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create client");
      }

      const newClient = await response.json();
      onClientCreated(newClient);
      toast.success("Cliente creado exitosamente.");
      setIsOpen(false);
      // Reset form fields
      setName("");
      setAlias("");
      setRut("");
      setEmail("");
      setPhone("");
      setAddress("");
      setContract(false);
      setNotificationsEnabled(true);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error(`Error al crear el cliente: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete los detalles para agregar un nuevo cliente.
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
                  onCheckedChange={(checked) => setContract(Boolean(checked))}
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
            <Button type="submit">Guardar Cliente</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
