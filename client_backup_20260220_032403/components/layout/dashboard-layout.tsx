"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SidebarContent, SidebarProvider, useSidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts, useShowKeyboardHelp } from "@/hooks/use-keyboard-shortcuts";

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
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { status } = useSession();
  const router = useRouter();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();
  useShowKeyboardHelp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [router]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const defaultMainClass =
    "relative flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto min-w-0";
  const gridColsClass = collapsed
    ? "lg:grid-cols-[80px_minmax(0,1fr)]"
    : "lg:grid-cols-[280px_minmax(0,1fr)]";

  return (
    <div className={`h-screen w-full flex flex-col lg:grid ${gridColsClass}`}>
      {/* Mobile header with hamburger */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-900">
            AdminFlow
          </div>
        </div>
      </header>
      
      {/* Mobile sidebar overlay */}
      <div 
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={() => setMobileOpen(false)} 
        />
        
        {/* Sidebar drawer */}
        <div 
          className={`absolute left-0 top-0 h-full w-[280px] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors z-10"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="h-full overflow-y-auto">
            <SidebarContent />
          </div>
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block h-full">
        <SidebarContent />
      </div>
      
      <main className={cn(mainClassName ?? defaultMainClass, className, "flex-1")}>{children}</main>
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
