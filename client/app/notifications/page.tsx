"use client";

import { useState, useEffect } from "react";
import { Bell, ArrowLeft, Ticket, CreditCard, User, Clock, ChevronRight } from "lucide-react";
import { API_URL } from "@/lib/http";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/notifications`)
      .then(res => res.json())
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <PageTransition>
      <div className="flex flex-col bg-slate-50 min-h-screen pb-24">
        {/* Cabecera Única Estilo iOS */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600 active:opacity-50">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-sm font-bold text-slate-900">Notificaciones</h1>
        </div>

        <div className="px-4 py-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <div className="mb-4 opacity-20 flex justify-center">
                <Bell size={64} />
              </div>
              <p className="font-medium">No tienes notificaciones nuevas</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div key={n._id || n.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60">
                <div className="flex gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl h-fit">
                    {n.event?.includes('ticket') ? <Ticket size={22}/> : n.event?.includes('payment') ? <CreditCard size={22}/> : <Bell size={22}/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="outline" className="text-[9px] uppercase font-bold">{n.event || 'SISTEMA'}</Badge>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-tight mb-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400">Recibido vía: {n.channels?.join(', ')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
