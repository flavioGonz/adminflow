'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, ArrowRight, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_URL } from '@/lib/http';

export function MobileTicketCard({ ticket }: { ticket: any }) {
  const [assignedAvatar, setAssignedAvatar] = useState<string | null>(null);

  const priorityColor = ticket.priority === 'high' || ticket.priority === 'Alta' ? 'bg-red-50 text-red-600 border-red-100' : 
                       ticket.priority === 'medium' || ticket.priority === 'Media' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                       'bg-emerald-50 text-emerald-600 border-emerald-100';

  // Lógica para obtener el avatar del técnico asignado
  useEffect(() => {
    if (ticket.assignedTo) {
      fetch(`${API_URL}/users`)
        .then(res => res.json())
        .then(users => {
          const user = users.find((u: any) => u.email === ticket.assignedTo || u.name === ticket.assignedTo);
          if (user?.avatar) {
            const baseUrl = API_URL.replace(/\/api\/?$/, '');
            setAssignedAvatar(`${baseUrl}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`);
          }
        }).catch(() => {});
    }
  }, [ticket.assignedTo]);

  // Formatear tiempo transcurrido
  const timeElapsed = ticket.createdAt 
    ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: false, locale: es })
    : '---';

  const clientInitials = ticket.clientName?.slice(0, 2).toUpperCase() || 'CL';
  const techInitials = (ticket.assignedTo || 'U').slice(0, 2).toUpperCase();

  return (
    <Link href={`/tickets/${ticket.id}`} className="block active:scale-[0.98] transition-all duration-200">
      <div className="bg-white rounded-[32px] p-6 mb-4 shadow-sm border border-slate-100 flex flex-col gap-4">
        
        {/* Superior: ID y Prioridad */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-tighter text-slate-300">#{ticket.id}</span>
            <Badge variant="outline" className={cn("rounded-full border px-2 py-0.5 text-[9px] font-black uppercase", priorityColor)}>
              {ticket.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <Clock size={12} />
            {timeElapsed}
          </div>
        </div>

        {/* Centro: Título */}
        <h3 className="text-lg font-bold text-slate-900 leading-tight">{ticket.title}</h3>

        {/* Inferior: Avatares y Estado */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex -space-x-3 items-center">
            {/* Avatar Cliente */}
            <div className="relative group">
              <Avatar className="h-10 w-10 border-4 border-white shadow-sm">
                <AvatarImage src={ticket.clientAvatarUrl} />
                <AvatarFallback className="bg-slate-900 text-white text-[10px] font-bold">{clientInitials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs">
                <User size={8} className="text-slate-400" />
              </div>
            </div>

            {/* Avatar Técnico (Solo si hay alguien asignado) */}
            {ticket.assignedTo && (
              <div className="relative group">
                <Avatar className="h-10 w-10 border-4 border-white shadow-sm">
                  <AvatarImage src={assignedAvatar || undefined} />
                  <AvatarFallback className="bg-indigo-600 text-white text-[10px] font-bold">{techInitials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-xs">
                  <Users size={8} className="text-indigo-400" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-slate-100 text-slate-600 border-none rounded-full text-[9px] font-bold px-3">
              {ticket.status.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              Gestionar <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
