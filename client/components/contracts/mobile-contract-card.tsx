'use client';

import React from 'react';
import { FileSignature, Calendar, Building2, ChevronRight, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MobileContractCardProps {
  contract: any;
}

export function MobileContractCard({ contract }: MobileContractCardProps) {
  const isExpired = contract.endDate && new Date(contract.endDate) < new Date();
  
  return (
    <Link href={`/contracts/${contract.id}`} className="block">
      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-200/60 active:scale-[0.97] transition-all ">
        <div className="flex justify-between items-start mb-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileSignature size={20} />
          </div>
          <Badge className={cn(
            "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase",
            isExpired ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {isExpired ? 'Vencido' : 'Activo'}
          </Badge>
        </div>
        
        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">{contract.title || 'Contrato sin título'}</h3>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Building2 size={14} />
            <span className="text-xs font-medium">{contract.clientName}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Inicio</span>
            </div>
            <span className="text-xs font-bold text-slate-600">{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : '-'}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl">
              <span className="text-[10px] font-black">{contract.currency || 'UYU'}</span>
              <span className="text-sm font-black">{contract.amount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
