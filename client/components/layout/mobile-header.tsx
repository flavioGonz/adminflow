'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, X, LogOut, Key, User, ChevronRight, Settings } from 'lucide-react';
import { API_URL } from '@/lib/http';
import { useRouter, usePathname } from 'next/navigation';

export function MobileHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{avatar?: string | null} | null>(null);

  const getTitle = () => {
    if (pathname?.startsWith('/dashboard')) return 'Dashboard';
    if (pathname?.startsWith('/clients')) return 'Clientes';
    if (pathname?.startsWith('/tickets')) return 'Tickets';
    if (pathname?.startsWith('/payments')) return 'Pagos';
    if (pathname?.startsWith('/contracts')) return 'Contratos';
    if (pathname?.startsWith('/system')) return 'Ajustes';
    if (pathname?.startsWith('/notifications')) return 'Notificaciones';
    return 'AdminFlow';
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`${API_URL}/users`)
        .then(res => res.json())
        .then(data => {
          const matched = data.find((u: any) => u.email?.toLowerCase() === session.user?.email?.toLowerCase());
          if (matched) setProfile({ avatar: matched.avatar });
        }).catch(() => {});
    }
  }, [session?.user?.email]);

  const getAvatarUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${API_URL.replace(/\/api\/?$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <>
      <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl sticky top-0 z-40">
        <h1 className="text-2xl font-black tracking-tighter text-slate-900">{getTitle()}</h1>
        
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/notifications')} className="relative p-2 text-slate-600">
             <Bell size={24} />
             <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 border-2 border-white rounded-full" />
          </button>
          <button onClick={() => setIsMenuOpen(true)} className="relative active:scale-90 transition-transform">
            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
              <AvatarImage src={getAvatarUrl(profile?.avatar)} />
              <AvatarFallback className="bg-slate-900 text-white font-bold">{session?.user?.name?.slice(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Mi Cuenta</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <button onClick={() => { router.push('/notifications'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[24px] active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600"><Bell size={22}/></div>
                  <span className="font-bold text-slate-900">Ver Notificaciones</span>
                </div>
                <Badge className="bg-rose-500 text-white rounded-full">3</Badge>
              </button>

              <button onClick={() => { router.push('/system'); setIsMenuOpen(false); }} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[24px] active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-600"><Settings size={22}/></div>
                  <span className="font-bold text-slate-900">Cambiar Clave</span>
                </div>
              </button>

              <div className="h-px bg-slate-100 my-2 mx-4" />

              <button onClick={() => { signOut({ callbackUrl: '/login' }); }} className="w-full flex items-center justify-between p-5 bg-rose-50 rounded-[24px] active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-600"><LogOut size={22}/></div>
                  <span className="font-bold text-rose-600">Cerrar Sesión</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
