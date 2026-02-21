"use client";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { MobileClientCard } from "@/components/clients/mobile-client-card";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { API_URL } from "@/lib/http";
import { PageTransition } from "@/components/ui/page-transition";
import { Users, Search, Loader2, Plus, Filter } from "lucide-react";
import { IPhoneHeader } from "@/components/layout/iphone-header";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setIsLoading(true);
    fetch(`${API_URL}/clients`).then(res => res.json()).then(data => { setClients(Array.isArray(data) ? data : []); setIsLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.alias || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout>
      <IPhoneHeader title="Clientes" />
      <div className="flex flex-col bg-slate-50 min-h-full px-4 pt-4 pb-40">
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar cliente..." className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 shadow-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm active:bg-slate-50 transition-colors">
               <Filter size={20} />
            </button>
            <button onClick={() => router.push('/clients/new')} className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all">
               <Plus size={24} />
            </button>
          </div>

          {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div> : 
            <div className="space-y-0">
              {filtered.map((c: any) => (
                <SwipeableCard key={c.id} onDelete={() => { if(confirm('¿Eliminar?')) fetch(`${API_URL}/clients/${c.id}`, {method:'DELETE'}).then(()=>load()) }}>
                   <MobileClientCard client={c} />
                </SwipeableCard>
              ))}
            </div>
          }
      </div>
    </DashboardLayout>
  );
}
