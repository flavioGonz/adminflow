'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';

export function MobilePaymentCard({ payment }: { payment: any }) {
  const statusColor = payment.status === 'Pagado' || payment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                     payment.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 
                     'bg-slate-100 text-slate-700';

  return (
    <div className="ios-card p-5 mb-4 flex flex-col gap-3 active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ID: {payment.id}</span>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{payment.client}</h3>
        </div>
        <Badge className={`rounded-lg border-none px-2 py-0.5 text-[10px] font-bold ${statusColor}`}>
          {payment.status.toUpperCase()}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2 py-2">
        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          <DollarSign size={20} />
        </div>
        <div>
          <p className="text-xl font-black text-slate-900">{payment.amount} {payment.currency}</p>
          <p className="text-[10px] text-slate-500 font-medium uppercase">{payment.concept || 'Sin concepto'}</p>
        </div>
      </div>

      <div className="h-px bg-slate-100 my-1" />

      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar size={14} />
          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-slate-400 italic">{payment.method}</div>
      </div>
    </div>
  );
}
