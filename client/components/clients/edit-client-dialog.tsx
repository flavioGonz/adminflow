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
import { User, Tag, CreditCard, Mail, Phone, Home, FileSignature, Bell, Upload, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  avatarUrl?: string;
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
  const [avatarUrl, setAvatarUrl] = useState(client.avatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(client.avatarUrl ?? null);

  useEffect(() => {
    setName(client.name ?? "");
    setAlias(client.alias ?? "");
    setRut(client.rut ?? "");
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setAddress(client.address ?? "");
    setContract(client.contract || false);
    setNotificationsEnabled(client.notificationsEnabled ?? true);
    setAvatarUrl(client.avatarUrl ?? "");
    setAvatarPreview(client.avatarUrl ?? null);
  }, [client]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("La imagen no debe superar los 2MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Por favor, complete el campo Nombre.");
      return;
    }
    const emailValue = email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    if (!emailValue || !isValidEmail) {
      toast.error("Email inválido. Usa un formato válido (correo@dominio.com).");
      return;
    }

    try {
      let finalAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        formData.append('clientId', client.id);

        const uploadResponse = await fetch(`${API_URL}/clients/${client.id}/avatar`, {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          finalAvatarUrl = uploadResult.avatarUrl;
        } else {
          toast.error("Error al subir el logo");
        }
      }

      const updatedClientData = {
        name,
        alias,
        rut,
        email: emailValue,
        phone,
        address,
        contract,
        notificationsEnabled,
        avatarUrl: finalAvatarUrl,
      };

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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Realice cambios en los detalles del cliente aquí.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
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

              <div className="flex flex-col gap-3 border-t pt-4">
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

            {/* Right Column - Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-6 border-l pl-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-40 w-40 border-4 border-slate-200">
                  <AvatarImage
                    src={
                      avatarPreview
                        ? avatarPreview.startsWith('data:') || avatarPreview.startsWith('http')
                          ? avatarPreview
                          : `${API_URL.replace('/api', '')}${avatarPreview}`
                        : undefined
                    }
                    alt={name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-4xl font-semibold">
                    {name ? name.substring(0, 2).toUpperCase() : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg">
                      <Upload className="h-5 w-5" />
                      <span className="font-medium">Cambiar Logo</span>
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground text-center">PNG, JPG hasta 2MB</p>
                </div>
              </div>
              {avatarFile && (
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-600">✓ Nuevo logo cargado</p>
                  <p className="text-xs text-muted-foreground mt-1">Se guardará al actualizar el cliente</p>
                </div>
              )}
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
