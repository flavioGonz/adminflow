
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./sidebar";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/command-palette";
import { useKeyboardShortcuts, useShowKeyboardHelp } from "@/hooks/use-keyboard-shortcuts";

interface DashboardLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  className?: string;
}

export default function DashboardLayout({
  children,
  mainClassName,
  className,
}: DashboardLayoutProps) {
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



  return (
    <div className="h-screen w-full lg:grid lg:grid-cols-[280px_1fr]">
      <CommandPalette />
      <Sidebar />
      <div className="flex flex-col overflow-hidden">
        <main
          className={cn(
            "flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto",
            mainClassName ?? className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
