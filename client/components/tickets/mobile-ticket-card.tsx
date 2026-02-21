'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function MobileTicketCard({ ticket }: { ticket: any }) {
  const priorityColor = ticket.priority === 'high' || ticket.priority === 'Alta' ? 'bg-red-100 text-red-700' : 
                       ticket.priority === 'medium' || ticket.priority === 'Media' ? 'bg-amber-100 text-amber-700' : 
                       'bg-emerald-100 text-emerald-700';

  return (
    <Link href={`/tickets/${ticket.id}`} className="block active:scale-[0.98] transition-transform">
      <div className="ios-card p-5  flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">#{ticket.id}</span>
          <Badge className={cn("rounded-lg border-none px-2 py-0.5 text-[10px] font-bold", priorityColor)}>
            {ticket.priority.toUpperCase()}
          </Badge>
        </div>
        
        <h3 className="text-lg font-bold text-slate-900 leading-tight">{ticket.title}</h3>
        
        <div className="flex flex-wrap gap-3 mt-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs">
            <User size={14} />
            <span className="font-medium">{ticket.clientName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs ml-auto">
            <Calendar size={14} />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-1" />

        <div className="flex justify-between items-center">
          <Badge variant="outline" className="rounded-full text-[10px] font-medium">{ticket.status}</Badge>
          <div className="text-emerald-600 flex items-center gap-1 text-xs font-bold">
            Ver detalle <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
