"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CommandPaletteButton } from "@/components/command-palette-button";

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => { },
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(
    () => ({
      collapsed,
      toggle: () => setCollapsed((prev) => !prev),
    }),
    [collapsed]
  );
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

type NavItem = {
  name: string;
  href: string;
  icon: (props: React.ComponentProps<typeof LayoutDashboard>) => React.ReactNode;
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
];

const bottomActions: NavItem[] = [
  { name: "Base de datos", href: "/database", icon: Database },
  { name: "Sistema", href: "/system", icon: Settings },
];

const menuItemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:bg-slate-100";

const SidebarNavItem = ({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) => (
  <Link
    href={item.href}
    className={`${menuItemBase} ${active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50"} ${collapsed ? "justify-center" : ""
      }`}
  >
    <item.icon className="h-4 w-4" />
    {!collapsed && item.name}
  </Link>
);

export default function Sidebar() {
  return (
    <SidebarProvider>
      <SidebarLayout />
    </SidebarProvider>
  );
}

function SidebarLayout() {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { collapsed, toggle } = useContext(SidebarContext);
  const pathname = usePathname();
  const { data: session } = useSession();

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

  useEffect(() => {
    fetch("/api/system/database").catch(() => undefined);
  }, []);

  const handleLogout = () => {
    setIsLogoutOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  const openTickets = (session?.user as any)?.assignedTickets ?? 3;

  return (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white ${collapsed ? "w-20" : "w-56"}`}>
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
      </div>
      <div className="px-4 pb-3">
        {!collapsed && (
          <div className="mb-3">
            <CommandPaletteButton />
          </div>
        )}
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
                  <Link href="https://www.shadcn.io/docs" target="_blank" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Documentacion
                    <ExternalLink className="ml-auto h-3 w-3 text-slate-400" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="mailto:soporte@adminflow.uy" className="flex items-center gap-2">
                    <MessageCircleQuestion className="h-4 w-4" />
                    Centro de ayuda
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="mailto:feedback@adminflow.uy" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar feedback
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="https://status.adminflow.uy" target="_blank" className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4" />
                    Estado del sistema
                    <ExternalLink className="ml-auto h-3 w-3 text-slate-400" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200" />
      <div className="px-1 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            {!collapsed && (
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold uppercase">
                {avatarInitials}
              </div>
            )}
            {bottomActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-transparent p-1 text-slate-500 hover:text-slate-900"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                <span className="sr-only">{item.name}</span>
              </Link>
            ))}
            <Link href="/notifications" className="text-slate-500 hover:text-slate-900">
              <Bell className="h-4 w-4" />
            </Link>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setIsLogoutOpen(true)}>
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
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
