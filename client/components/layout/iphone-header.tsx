'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function IPhoneHeader({ title }: { title: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const avatarInitials = session?.user?.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200/40 bg-white/70 backdrop-blur-xl sticky top-0 z-40">
      <h1 className="text-2xl font-black tracking-tighter text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/notifications')} className="relative p-2 text-slate-600">
           <Bell size={24} />
           <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-rose-500 border-2 border-white rounded-full" />
        </button>
        <Avatar className="h-10 w-10 border-2 border-white shadow-md">
          <AvatarFallback className="bg-slate-900 text-white font-bold">{avatarInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
