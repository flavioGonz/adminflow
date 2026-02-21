"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Ticket, User, Activity, AlertTriangle, CheckCircle2, Loader2, X, Send, Camera
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { TicketStatus, TicketPriority } from "@/types/ticket";
import { UnifiedAssignmentSearchMobile } from "@/components/tickets/unified-assignment-search-mobile";

export default function NewTicketPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    clientName: "",
    status: "Nuevo" as TicketStatus,
    priority: "Media" as TicketPriority,
    description: "",
    assignedTo: null as string | null,
    assignedGroupId: null as string | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientName.trim()) return toast.error("Completa el título y cliente");
    
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Error al crear");
      toast.success("Ticket creado exitosamente");
      router.push('/tickets');
    } catch (err) {
      toast.error("Error al guardar ticket");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
      {/* iOS Style Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 active:opacity-50"><ArrowLeft size={24} /></button>
        <h1 className="text-sm font-bold text-slate-900">Nuevo Ticket</h1>
        <button onClick={handleSubmit} disabled={isSaving} className="text-emerald-600 font-bold text-sm active:opacity-50">
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : 'Crear'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Título del Problema</Label>
            <Input 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              className="h-14 rounded-2xl bg-slate-50 border-none text-lg font-bold" 
              placeholder="Ej: Error de conexión Startlink" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Cliente</Label>
            <Input 
              value={form.clientName} 
              onChange={e => setForm({...form, clientName: e.target.value})} 
              className="h-14 rounded-2xl bg-slate-50 border-none" 
              placeholder="Nombre del cliente" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Estado</Label>
              <Select value={form.status} onValueChange={(v: TicketStatus) => setForm({...form, status: v})}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Nuevo", "Abierto", "En proceso", "Resuelto"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Prioridad</Label>
              <Select value={form.priority} onValueChange={(v: TicketPriority) => setForm({...form, priority: v})}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Alta", "Media", "Baja"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 space-y-4">
           <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Asignación</Label>
           <UnifiedAssignmentSearchMobile 
              assignedTo={form.assignedTo} 
              assignedGroupId={form.assignedGroupId} 
              onAssign={(type, val) => {
                if (type === 'user') setForm({...form, assignedTo: val, assignedGroupId: null});
                else if (type === 'group') setForm({...form, assignedGroupId: val, assignedTo: null});
              }} 
           />
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60">
          <Label className="text-[10px] uppercase font-bold text-slate-400 ml-2">Descripción Inicial</Label>
          <textarea 
            className="w-full min-h-[120px] bg-slate-50 rounded-2xl p-4 mt-2 outline-none border-none"
            placeholder="Detalla el problema aquí..."
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
          />
        </div>

        <Button 
          type="submit"
          disabled={isSaving}
          className="w-full py-8 bg-emerald-600 text-white rounded-[24px] text-xl font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : 'Crear Ticket'}
        </Button>
      </form>
    </div>
  );
}
