
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
  const { collapsed } = useSidebar();
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

  const defaultMainClass =
    "relative flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto min-w-0";
  const gridColsClass = collapsed
    ? "lg:grid-cols-[80px_minmax(0,1fr)]"
    : "lg:grid-cols-[280px_minmax(0,1fr)]";

  return (
    <div className={`h-screen w-full lg:grid ${gridColsClass}`}>
      <SidebarContent />
      <main className={cn(mainClassName ?? defaultMainClass, className)}>{children}</main>
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
