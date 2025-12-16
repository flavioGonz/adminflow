"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, MessageCircleQuestion, LifeBuoy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const supportNav = [
  { name: "Centro de Ayuda", href: "/support/centro", icon: MessageCircleQuestion },
  { name: "Documentación", href: "/support/documentacion", icon: BookOpen },
  { name: "Estado del Sistema", href: "/support/estado", icon: LifeBuoy },
  { name: "Contacto", href: "mailto:info@infratec.com.uy", icon: Send, external: true },
];

export function SupportLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-8 w-px bg-slate-200" />
              <h1 className="text-lg font-semibold text-slate-900">Ayuda y Soporte</h1>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Volver a AdminFlow</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {supportNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isExternal = item.external;

                if (isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
