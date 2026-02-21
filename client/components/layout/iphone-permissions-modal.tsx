'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Bell, Camera, MapPin, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function IPhonePermissionsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSupported, permission, subscribe } = usePushNotifications();

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    const handleTriggerSubscribe = () => subscribe();
    window.addEventListener("show-permissions-modal", handleShow);
    window.addEventListener("trigger-push-subscribe", handleTriggerSubscribe);
    return () => window.removeEventListener("show-permissions-modal", handleShow);
      window.removeEventListener("trigger-push-subscribe", handleTriggerSubscribe);
    // Solo mostrar si es iPhone/Safari PWA y las notificaciones no están concedidas
    const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIPhone && isStandalone && Notification.permission !== 'granted') {
      const hasSeen = localStorage.getItem('iphone-permissions-seen');
      if (!hasSeen) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleEnablePush = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('¡Notificaciones activadas!');
    }
  };

  const handleEnableCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      toast.success('Cámara habilitada');
    } catch (e) {
      toast.error('No se pudo acceder a la cámara');
    }
  };

  const handleEnableLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => toast.success('Ubicación habilitada'),
      () => toast.error('Error al obtener ubicación')
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-8">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <button onClick={() => { setIsOpen(false); localStorage.setItem('iphone-permissions-seen', 'true'); }} className="p-2 bg-slate-100 rounded-full">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Permisos de la App</h2>
        <p className="text-slate-500 mb-8">Para que AdminFlow funcione como una App real, necesitamos tu permiso para algunas funciones.</p>

        <div className="space-y-4">
          <button onClick={handleEnablePush} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[24px] active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Notificaciones Push</p>
                <p className="text-xs text-slate-500">Recibe alertas de tickets y pagos</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </button>

          <button onClick={handleEnableCamera} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[24px] active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <Camera className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Cámara y Fotos</p>
                <p className="text-xs text-slate-500">Para adjuntar pruebas a tickets</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </button>

          <button onClick={handleEnableLocation} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[24px] active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <MapPin className="h-5 w-5 text-rose-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900">Ubicación GPS</p>
                <p className="text-xs text-slate-500">Para el registro de visitas técnicas</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300" />
          </button>
        </div>

        <button 
          onClick={() => { setIsOpen(false); localStorage.setItem('iphone-permissions-seen', 'true'); }}
          className="w-full mt-10 py-4 bg-slate-900 text-white font-bold rounded-[22px] shadow-xl active:scale-95 transition-all"
        >
          Listo, continuar
        </button>
      </div>
    </div>
  );
}
