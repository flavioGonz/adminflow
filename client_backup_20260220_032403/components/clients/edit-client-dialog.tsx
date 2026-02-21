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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Tag, 
  CreditCard, 
  Mail, 
  Phone, 
  Home, 
  FileSignature, 
  Bell, 
  Upload, 
  DollarSign,
  CalendarClock,
  Image as ImageIcon 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { Client } from "@/types/client";

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

  // Campos de pago recurrente
  const [recurringPaymentEnabled, setRecurringPaymentEnabled] = useState(client.recurringPaymentEnabled || false);
  const [recurringAmount, setRecurringAmount] = useState(client.recurringAmount?.toString() || "");
  const [recurringCurrency, setRecurringCurrency] = useState(client.recurringCurrency || "UYU");

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
    
    setRecurringPaymentEnabled(client.recurringPaymentEnabled || false);
    setRecurringAmount(client.recurringAmount?.toString() || "");
    setRecurringCurrency(client.recurringCurrency || "UYU");
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
        recurringPaymentEnabled,
        recurringAmount: recurringAmount ? Number(recurringAmount) : null,
        recurringCurrency,
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
      onClientUpdated(result);
      toast.success("Cliente actualizado exitosamente.");
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Ocurrió un error al actualizar el cliente.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Realice cambios en los detalles del cliente aquí.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
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

              <div className="space-y-4 pt-2">
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
                    Notificaciones por correo
                  </Label>
                </div>
              </div>
            </div>

            {/* Right Column - Avatar & Recurring Payment */}
            <div className="space-y-6 md:border-l md:pl-6">
              <div className="flex flex-col items-center gap-4 py-2">
                <Avatar className="h-32 w-32 border-4 border-slate-100 shadow-sm">
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
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-3xl font-semibold">
                    {name ? name.substring(0, 2).toUpperCase() : <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    Cambiar Logo
                  </div>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </Label>
              </div>

              <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-slate-800">Pago Recurrente</h3>
                  </div>
                  <Checkbox
                    id="recurring"
                    checked={recurringPaymentEnabled}
                    onCheckedChange={(checked) => setRecurringPaymentEnabled(checked as boolean)}
                  />
                </div>
                
                {recurringPaymentEnabled && (
                  <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="amount" className="text-xs">Monto Mensual</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={recurringAmount}
                            onChange={(e) => setRecurringAmount(e.target.value)}
                            className="pl-8 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="currency" className="text-xs">Moneda</Label>
                        <Select value={recurringCurrency} onValueChange={setRecurringCurrency}>
                          <SelectTrigger id="currency" className="h-9 text-sm">
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UYU">UYU</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight italic">
                      Se generará un pago pendiente automáticamente el día 1 de cada mes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
