"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/http";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bell,
  Calculator,
  CalendarCheck,
  ChevronsLeft,
  CreditCard,
  Database,
  FileText,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  MessageCircleQuestion,
  BookOpen,
  Send,
  ExternalLink,
  Package,
  Settings,
  Ticket,
  Users,
} from "lucide-react";
import { HealthIndicator } from "@/components/health-check";

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
    setMounted(true);
  }, []);

  // Save collapsed state to localStorage when it changes
  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({
      collapsed,
      toggle: handleToggle,
    }),
    [collapsed]
  );

  // Prevent hydration mismatch
  if (!mounted) {
    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  return useContext(SidebarContext);
}

type NavItem = {
  name: string;
  href: string;
  icon: (props: React.ComponentProps<typeof LayoutDashboard>) => React.ReactNode;
  external?: boolean;
  target?: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Contratos", href: "/contracts", icon: FileText },
  { name: "Presupuestos", href: "/budgets", icon: Calculator },
  { name: "Productos", href: "/products", icon: Package },
  { name: "Pagos", href: "/payments", icon: CreditCard },
  { name: "Repositorio", href: "/repository", icon: Folder },
  { name: "Calendario", href: "/calendar", icon: CalendarCheck },
  { name: "Mapa", href: "/map", icon: Map },
  { name: "System", href: "/system", icon: Settings },
];

const bottomActions: NavItem[] = [
  { name: "Base de datos", href: "/database", icon: Database },
];

const supportNavItems: NavItem[] = [
  { name: "Documentación", href: "/support/documentacion", icon: BookOpen },
  { name: "Centro de ayuda", href: "/support/centro", icon: MessageCircleQuestion },
  { name: "Enviar feedback", href: "mailto:info@infratec.com.uy", icon: Send, external: true, target: "_blank" },
  { name: "Estado del sistema", href: "/support/estado", icon: LifeBuoy },
];

const menuItemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:bg-slate-100";

type SidebarProfile = {
  avatar?: string | null;
};

const getAvatarUrl = (avatarPath?: string | null) => {
  if (!avatarPath) return undefined;
  if (avatarPath.startsWith("http")) return avatarPath;
  const base = API_URL.replace(/\/api\/?$/, "");
  const normalized = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
  return `${base}${normalized}`;
};

const SidebarNavItem = ({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) => (
  item.external ? (
    <a
      href={item.href}
      target={item.target || "_blank"}
      rel="noreferrer"
      className={`${menuItemBase} text-slate-600 hover:bg-slate-50 ${collapsed ? "justify-center" : ""}`}
    >
      <item.icon className="h-4 w-4" />
      {!collapsed && item.name}
    </a>
  ) : (
    <Link
      href={item.href}
      className={`${menuItemBase} ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"} ${collapsed ? "justify-center" : ""
        }`}
    >
      <item.icon className="h-4 w-4" />
      {!collapsed && item.name}
    </Link>
  )
);

export default function Sidebar() {
  return (
    <SidebarProvider>
      <SidebarContent />
    </SidebarProvider>
  );
}

export function SidebarContent() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { collapsed, toggle } = useContext(SidebarContext);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<SidebarProfile | null>(null);
  const [primaryDbName, setPrimaryDbName] = useState<string | null>(null);

  const userName = session?.user?.name ?? "Usuario";
  const userRole = (session?.user as any)?.role ?? "Equipo";
  const userEmail = session?.user?.email ?? "Sin correo";
  const avatarInitials = useMemo(
    () =>
      userName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [userName]
  );
  const avatarSrc = profile?.avatar ? getAvatarUrl(profile.avatar) : undefined;

  useEffect(() => {
    if (!session?.user?.email) {
      return;
    }
    let canceled = false;

    const loadProfile = async () => {
      try {
        if (!session?.user?.email) return;
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) return;
        const data = (await response.json()) as { email?: string; avatar?: string | null }[];
        const matched = data.find(
          (user) => user.email?.toLowerCase() === session.user?.email?.toLowerCase()
        );
        if (matched && !canceled) {
          setProfile({ avatar: matched.avatar });
        }
      } catch (error) {
        console.error("Error cargando perfil del usuario:", error);
      }
    };

    loadProfile();

    return () => {
      canceled = true;
    };
  }, [session?.user?.email]);

  useEffect(() => {
    fetch("/api/system/database").catch(() => undefined);
  }, []);

  useEffect(() => {
    let canceled = false;
    const loadPrimary = async () => {
      try {
        const res = await fetch("/api/mongo-servers/status");
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const primary = list.find((s: any) => s.isPrimary);
        if (!canceled) {
          setPrimaryDbName(primary?.database || primary?.name || null);
        }
      } catch (err) {
        // fail silently
      }
    };
    loadPrimary();
    return () => {
      canceled = true;
    };
  }, []);

  const handleLogout = () => {
    setIsLogoutOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  const openTickets = (session?.user as any)?.assignedTickets ?? 0;
  const isMapRoute = pathname?.startsWith("/map");

  return (
    <aside
      className={`flex h-full flex-col ${collapsed ? "w-20" : "w-56"} ${
        isMapRoute ? "border-none bg-transparent" : "border-r border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {!collapsed && (
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-900">
            AdminFlow
          </div>
        )}
        <Button variant="ghost" size="icon" className="text-slate-700" onClick={toggle}>
          <ChevronsLeft className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-2">
        <SidebarNavItem item={navItems[0]} active={!!pathname?.startsWith(navItems[0].href)} collapsed={collapsed} />
        <div className="space-y-1">
          {navItems.slice(1).map((item) => (
            <SidebarNavItem key={item.href} item={item} active={!!pathname?.startsWith(item.href)} collapsed={collapsed} />
          ))}
        </div>
        {/* Ayuda y soporte: se muestra solo en el submenú del icono de ayuda */}
      </div>
      <div className="px-4 pb-3">
        {!collapsed && (
          <div className="mb-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-100 p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">{userRole}</p>
                <p className="text-base font-semibold text-slate-900 leading-tight">{userName}</p>
                <p className="text-xs font-medium text-slate-500">{userEmail}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {openTickets} tickets abiertos
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-600 hover:bg-slate-200 mt-1 ml-auto mr-6"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span className="sr-only">Ayuda</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-56">
                  <DropdownMenuLabel className="text-xs uppercase text-slate-500">
                    Ayuda y soporte
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/documentacion" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Documentacion
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/centro" className="flex items-center gap-2">
                      <MessageCircleQuestion className="h-4 w-4" />
                      Centro de ayuda
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="mailto:info@infratec.com.uy" className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Enviar feedback
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/support/estado" className="flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4" />
                      Estado del sistema
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
      {!isMapRoute && <div className="border-t border-slate-200" />}
      <div className="px-1 py-4">
        <div className="flex items-center justify-center">
          {collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar
                  className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase"
                >
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt={userName} />
                  ) : (
                    <AvatarFallback>{avatarInitials}</AvatarFallback>
                  )}
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="center" className="w-48 space-y-1">
                {bottomActions.map((item) => (
                  <DropdownMenuItem
                    key={`collapsed-${item.href}`}
                    asChild
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <Link href={item.href} className="flex w-full items-center gap-2" aria-label={item.name}>
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  <Link href="/notifications" className="flex w-full items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notificaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                  onSelect={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Avatar
                className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase"
              >
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={userName} />
                ) : (
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                )}
              </Avatar>
                  {bottomActions.map((item) => (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className="rounded-full bg-transparent p-1 text-slate-500 hover:text-slate-900"
                        >
                          <item.icon className="h-4 w-4" aria-hidden />
                          <span className="sr-only">{item.name}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center">
                        Base primaria: {primaryDbName || "No definida"}
                      </TooltipContent>
                    </Tooltip>
                  ))}
              <Link href="/notifications" className="text-slate-500 hover:text-slate-900">
                <Bell className="h-4 w-4" />
              </Link>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setIsLogoutOpen(true)}>
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas finalizar tu sesión actual?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="p-4 rounded-full bg-red-50 ring-1 ring-red-100">
              <LogOut className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm text-center text-slate-500 max-w-[240px]">
              Tendrás que volver a ingresar tus credenciales para acceder al sistema.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => setIsLogoutOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="flex-1">
              Cerrar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
