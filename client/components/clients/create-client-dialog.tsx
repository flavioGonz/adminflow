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
import { PlusCircle, User, Tag, CreditCard, Mail, Phone, Home, FileSignature, Bell, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
    if (!name.trim()) {
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
      // 1. Create client first
      const response = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          alias: alias.trim(),
          rut: rut.trim(),
          email: emailValue,
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

      let newClient = await response.json();

      // 2. Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const uploadResponse = await fetch(`${API_URL}/clients/${newClient.id}/avatar`, {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          newClient = { ...newClient, avatarUrl: uploadResult.avatarUrl };
        } else {
          toast.error("Cliente creado, pero hubo un error al subir el logo");
        }
      }

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
      setAvatarFile(null);
      setAvatarPreview(null);
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Complete los detalles para agregar un nuevo cliente.
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

            {/* Right Column - Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-6 border-l pl-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-40 w-40 border-4 border-slate-200">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-4xl font-semibold">
                    {name ? name.substring(0, 2).toUpperCase() : <User className="h-16 w-16" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="avatar-upload-new" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg">
                      <Upload className="h-5 w-5" />
                      <span className="font-medium">Subir Logo</span>
                    </div>
                    <input
                      id="avatar-upload-new"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground text-center">PNG, JPG hasta 2MB</p>
                </div>
              </div>
              {avatarPreview && (
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-600">✓ Logo cargado</p>
                  <p className="text-xs text-muted-foreground mt-1">Se guardará al crear el cliente</p>
                </div>
              )}
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
