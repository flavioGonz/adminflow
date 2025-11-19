
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./sidebar";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-sm text-white/70">
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className="h-screen w-full lg:grid lg:grid-cols-[280px_1fr]">
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
