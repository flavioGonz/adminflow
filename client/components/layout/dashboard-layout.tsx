'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SidebarContent, SidebarProvider, useSidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { MobileQuickActions } from './mobile-quick-actions';
import { IPhonePermissionsModal } from './iphone-permissions-modal';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts, useShowKeyboardHelp } from '@/hooks/use-keyboard-shortcuts';

interface DashboardLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  className?: string;
}

function DashboardLayoutShell({
  children,
  mainClassName,
  className,
}: DashboardLayoutProps) {
  const { collapsed } = useSidebar();
  const { status: authStatus } = useSession();
  const router = useRouter();

  useKeyboardShortcuts();
  useShowKeyboardHelp();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [authStatus, router]);

  const defaultMainClass =
    'relative flex flex-1 flex-col overflow-y-auto min-w-0 pb-32';
  const gridColsClass = collapsed
    ? 'lg:grid-cols-[80px_minmax(0,1fr)]'
    : 'lg:grid-cols-[280px_minmax(0,1fr)]';

  return (
    <div className={cn('h-screen w-full flex flex-col lg:grid bg-slate-50/50', gridColsClass)}>
      {/* 🏔️ Header retirado del layout global para evitar duplicados en PWA */}
      
      <div className="hidden lg:block h-full"><SidebarContent /></div>
      
      <main className={cn(mainClassName ?? defaultMainClass, className, 'flex-1')}>
        {children}
      </main>

      <MobileNav />
      <MobileQuickActions />
      <IPhonePermissionsModal />
    </div>
  );
}

export default function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutShell {...props} />
    </SidebarProvider>
  );
}
