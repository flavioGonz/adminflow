'use client';

import React from 'react';
import { 
  Key, 
  Bell, 
  Shield, 
  ChevronRight,
  Camera,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Cambiar Mi Contraseña', icon: Key, action: 'password', color: 'bg-amber-50 text-amber-600' },
  { label: 'Notificaciones Push', icon: Bell, action: 'notifications', color: 'bg-blue-50 text-blue-600' },
  { label: 'Permisos de Sensores', icon: Shield, action: 'sensors', color: 'bg-emerald-50 text-emerald-600' },
];

export function MobileSystemView({ onAction }: { onAction: (action: string) => void }) {
  return (
    <div className="mobile-cards-view flex flex-col bg-slate-50 min-h-screen pb-24 px-4 pt-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Mi Configuración</h2>
      
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200/60 overflow-hidden">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onAction(item.action)}
            className="w-full flex items-center justify-between p-6 active:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", item.color)}>
                <item.icon size={22} />
              </div>
              <span className="font-bold text-slate-900">{item.label}</span>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4 px-2">
        <div className="flex items-center gap-3 text-slate-400">
          <Camera size={16} />
          <p className="text-xs font-medium">Acceso a cámara configurado</p>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <MapPin size={16} />
          <p className="text-xs font-medium">Acceso a ubicación configurado</p>
        </div>
      </div>
    </div>
  );
}
