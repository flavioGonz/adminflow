'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, ArrowRight, Ticket, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/http';
import { cn } from '@/lib/utils';

export function MobileClientCard({ client }: { client: any }) {
  const initials = client.name?.slice(0, 2).toUpperCase();
  const hasPendingPayments = client.pendingPaymentsCount > 0;
  const hasOpenTickets = client.openTicketsCount > 0;
  
  const getAvatarUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${API_URL.replace(/\/api\/?$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <Link href={`/clients/${client.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="ios-card p-5 flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-sm">
          <AvatarImage src={getAvatarUrl(client.avatarUrl)} />
          <AvatarFallback className="bg-slate-900 text-white font-bold">{initials}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 truncate">{client.name}</h3>
          <div className="flex gap-2 mt-1">
            {hasOpenTickets && (
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                <Ticket size={10} /> {client.openTicketsCount} Tickets
              </div>
            )}
            {hasPendingPayments && (
              <div className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                <CreditCard size={10} /> Deuda
              </div>
            )}
            {!hasOpenTickets && !hasPendingPayments && (
               <p className="text-xs text-slate-400 font-medium">{client.alias || 'Sin actividad'}</p>
            )}
          </div>
        </div>
        <ArrowRight size={18} className="text-slate-300" />
      </div>
    </Link>
  );
}
