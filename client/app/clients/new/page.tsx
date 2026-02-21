"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Tag, CreditCard, Mail, Phone, Home, FileSignature, Bell, Upload, Camera, X, Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";

export default function NewClientPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    alias: "",
    rut: "",
    email: "",
    phone: "",
    address: "",
    contract: false,
    notificationsEnabled: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 2MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Completa el nombre");
    
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al crear");
      const newClient = await res.json();

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await fetch(`${API_URL}/clients/${newClient.id}/avatar`, {
          method: 'POST',
          body: formData,
        });
      }

      toast.success("Cliente creado");
      router.push('/clients');
    } catch (err) {
      toast.error("Error al guardar cliente");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 active:opacity-50"><ArrowLeft size={24} /></button>
        <h1 className="text-sm font-bold text-slate-900">Nuevo Cliente</h1>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-4xl">
                <User size={48} />
              </AvatarFallback>
            </Avatar>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all"
            >
              <Camera size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleAvatarChange} />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Nombre Principal</Label>
            <Input 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20" 
              placeholder="Nombre de la empresa o persona" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Alias</Label>
              <Input value={form.alias} onChange={e => setForm({...form, alias: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">RUT</Label>
              <Input value={form.rut} onChange={e => setForm({...form, rut: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Correo Electrónico</Label>
            <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="cliente@ejemplo.com" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Teléfono</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none" placeholder="+598 99..." />
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 space-y-4">
           <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <FileSignature size={20} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">Contrato Activo</span>
              </div>
              <Checkbox checked={form.contract} onCheckedChange={v => setForm({...form, contract: Boolean(v)})} />
           </div>
           <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">Notificaciones</span>
              </div>
              <Checkbox checked={form.notificationsEnabled} onCheckedChange={v => setForm({...form, notificationsEnabled: Boolean(v)})} />
           </div>
        </div>

        <Button 
          disabled={isSaving} 
          onClick={handleSubmit}
          className="w-full py-8 bg-emerald-600 text-white rounded-[24px] text-lg font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : "Crear Cliente"}
        </Button>
      </form>
    </div>
  );
}
