"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, X } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { Ticket, TicketStatus, TicketPriority } from "@/types/ticket";
import { MobileTicketDetails } from "@/components/tickets/mobile-ticket-details";
import { UnifiedAssignmentSearchMobile } from "@/components/tickets/unified-assignment-search-mobile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [status, setStatus] = useState<TicketStatus>("Nuevo");
  const [priority, setPriority] = useState<TicketPriority>("Media");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedGroupId, setAssignedGroupId] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!params?.id) return;
    try {
      const res = await fetch(`${API_URL}/tickets/${params.id}`);
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setTicket(data);
      setStatus(data.status);
      setPriority(data.priority);
      setAssignedTo(data.assignedTo || null);
      setAssignedGroupId(data.assignedGroupId || null);
    } catch (err) { toast.error("Error al cargar el ticket"); }
    finally { setIsLoading(false); }
  }, [params?.id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleSave = async () => {
    if (!ticket) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, assignedTo, assignedGroupId }),
      });
      if (!response.ok) throw new Error("Error al guardar");
      const updated = await response.json();
      setTicket(updated);
      setIsLocked(true);
      toast.success("Ticket actualizado");
    } catch (err) { toast.error("Error al guardar cambios"); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!ticket) return <div className="p-8 text-center">Ticket no encontrado</div>;

  return (
    <>
      <div className="mobile-cards-view">
        <MobileTicketDetails ticket={ticket} onEdit={() => setIsLocked(!isLocked)} onRefresh={fetchTicket} />
        {!isLocked && (
          <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-end">
            <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">Ajustes del Ticket</h2>
                 <button onClick={() => setIsLocked(true)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
               </div>
               
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Estado</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Nuevo", "Abierto", "En proceso", "Resuelto", "Facturar"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Prioridad</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Alta", "Media", "Baja"].map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Asignación</Label>
                    <UnifiedAssignmentSearchMobile 
                      assignedTo={assignedTo} 
                      assignedGroupId={assignedGroupId} 
                      onAssign={(type, val) => {
                        if (type === 'user') { setAssignedTo(val); setAssignedGroupId(null); }
                        else if (type === 'group') { setAssignedGroupId(val); setAssignedTo(null); }
                      }} 
                    />
                 </div>

                 <Button onClick={handleSave} disabled={isSaving} className="w-full py-6 bg-emerald-600 rounded-[20px] font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-all">
                   {isSaving ? "Guardando..." : "Aplicar Cambios"}
                 </Button>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="desktop-table-view p-6 space-y-6">
         <div className="bg-white p-10 rounded-3xl border shadow-sm">
           <h1 className="text-3xl font-bold">{ticket.title}</h1>
           <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{__html: ticket.description || ''}} />
         </div>
      </div>
    </>
  );
}
