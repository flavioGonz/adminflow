'use client';

import React from 'react';
import { 
  ArrowLeft, User, Phone, Mail, MapPin, History, Ticket, CreditCard, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';
import { Ticket as TicketType } from '@/types/ticket';
import Link from 'next/link';

interface MobileClientDetailsProps {
  client: Client;
  tickets: TicketType[];
}

export function MobileClientDetails({ client, tickets }: MobileClientDetailsProps) {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pb-32">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center gap-4">
        <Link href="/clients" className="text-slate-600"><ArrowLeft size={24} /></Link>
        <h1 className="text-sm font-bold text-slate-900">Ficha de Cliente</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200/60 flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-4 border-4 border-emerald-50">
            <AvatarFallback className="bg-slate-900 text-white text-2xl font-bold">{client.name.slice(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
          <p className="text-slate-500 text-sm">{client.alias || 'Sin alias'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Phone size={18}/></div>
            <p className="text-xs font-bold truncate">{client.phone || '-'}</p>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Ticket size={18}/></div>
            <p className="text-xs font-bold">{tickets.length} Tickets</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold px-2">Historial de Tickets</h3>
          {tickets.map(t => (
            <Link key={t.id} href={`/tickets/${t.id}`} className="block">
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200/60 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="rounded-full text-[9px] font-black uppercase">{t.status}</Badge>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-slate-900 leading-tight mb-1">{t.title}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                   <span>ID: {t.id}</span>
                   <ChevronRight size={16} className="text-slate-300"/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
