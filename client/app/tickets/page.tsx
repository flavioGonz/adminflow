"use client";
import { useState, useEffect, useCallback } from "react";
import { MobileTicketCard } from "@/components/tickets/mobile-ticket-card";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { API_URL } from "@/lib/http";
import { Loader2, Search, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { IPhoneHeader } from "@/components/layout/iphone-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setIsLoading(true);
    fetch(`${API_URL}/tickets`)
      .then(res => res.json())
      .then(data => { setTickets(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
    const handleSearch = (e: any) => setSearch(e.detail || '');
    window.addEventListener("mobile-search", handleSearch);
    return () => window.removeEventListener("mobile-search", handleSearch);
  }, [load]);

  const filtered = tickets.filter(t => (t.title || '').toLowerCase().includes(search.toLowerCase()) || (t.clientName || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* HEADER ÚNICO PROPIO */}
      <IPhoneHeader title="Tickets" />
      
      <main className="flex-1 overflow-y-auto pb-40">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar ticket..." className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 shadow-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-filters'))} className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm">
               <Filter size={20} />
            </button>
            <button onClick={() => router.push('/tickets/new')} className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <Plus size={24} />
            </button>
          </div>

          {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div> : 
            <div className="space-y-0">
              {filtered.map((t: any) => (
                <SwipeableCard key={t.id} onDelete={() => { if(confirm('¿Eliminar?')) fetch(`${API_URL}/tickets/${t.id}`, {method:'DELETE'}).then(()=>load()) }}>
                   <MobileTicketCard ticket={t} />
                </SwipeableCard>
              ))}
            </div>
          }
        </div>
      </main>

      {/* MENÚ INFERIOR */}
      <MobileNav />
    </div>
  );
}
