"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SupportLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
  mainClassName?: string;
  className?: string;
}

export default function SupportLayout({
  children,
  title,
  showBackButton = false,
  backHref = "/dashboard",
  mainClassName,
  className,
}: SupportLayoutProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const defaultMainClass =
    "relative flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto min-w-0";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Link href={backHref}>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              {title && (
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Documentación y recursos de ayuda
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className={cn(mainClassName ?? defaultMainClass, className)}>
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
