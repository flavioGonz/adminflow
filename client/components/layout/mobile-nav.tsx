'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Ticket, CreditCard, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileItems = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Pagos', href: '/payments', icon: CreditCard },
  { name: 'Contratos', href: '/contracts', icon: FileSignature },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] h-[84px] lg:hidden">
      <div className="absolute inset-x-0 bottom-0 top-0 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50 flex items-center justify-around px-2 pb-safe">
        {mobileItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300',
                isActive ? 'text-emerald-600 scale-110' : 'text-slate-400'
              )}
            >
              <item.icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={cn(
                "text-[9px] font-bold mt-1 tracking-tighter transition-all",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
