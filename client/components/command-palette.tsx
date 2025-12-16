"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Users,
    Ticket,
    DollarSign,
    FileText,
    Package,
    Calendar,
    FolderArchive,
    Settings,
    Bell,
    Plus,
    Home,
    Database,
    Star,
} from "lucide-react";
import { API_URL } from "@/lib/http";
import { toast } from "sonner";

interface Client {
    id: string;
    name: string;
    email?: string;
}

interface TicketType {
    id: string;
    title: string;
    status: string;
    clientId: string;
}

interface Payment {
    id: string;
    invoice: string;
    amount: number;
    status: string;
}

interface Contract {
    id: string;
    title: string;
    status: string;
}

interface Action {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    action: () => void;
    keywords?: string[];
    group: "navigation" | "actions" | "recent" | "favorites";
    shortcut?: string;
}

interface RecentCommand {
    id: string;
    label: string;
    timestamp: number;
}

const RECENT_COMMANDS_KEY = "command-palette-recent";
const FAVORITES_KEY = "command-palette-favorites";
const MAX_RECENT = 5;

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [clients, setClients] = useState<Client[]>([]);
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);
    const [favorites, setFavorites] = useState<string[]>([]);

    // Load recent commands and favorites from localStorage
    useEffect(() => {
        const recent = localStorage.getItem(RECENT_COMMANDS_KEY);
        const favs = localStorage.getItem(FAVORITES_KEY);
        if (recent) setRecentCommands(JSON.parse(recent));
        if (favs) setFavorites(JSON.parse(favs));
    }, []);

    // Keyboard shortcut to open command palette
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    // Load data when palette opens
    useEffect(() => {
        if (open && clients.length === 0) {
            loadData();
        }
    }, [open, clients.length]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [clientsRes, ticketsRes, paymentsRes, contractsRes] = await Promise.all([
                fetch(`${API_URL}/clients`),
                fetch(`${API_URL}/tickets`),
                fetch(`${API_URL}/payments`),
                fetch(`${API_URL}/contracts`),
            ]);

            if (clientsRes.ok) {
                const clientsData = await clientsRes.json();
                setClients(clientsData);
            }

            if (ticketsRes.ok) {
                const ticketsData = await ticketsRes.json();
                setTickets(ticketsData);
            }

            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData);
            }

            if (contractsRes.ok) {
                const contractsData = await contractsRes.json();
                setContracts(contractsData);
            }
        } catch (error) {
            console.error("Error loading command palette data:", error);
        } finally {
            setLoading(false);
        }
    };

    const addToRecent = (id: string, label: string) => {
        const newRecent = [
            { id, label, timestamp: Date.now() },
            ...recentCommands.filter((cmd) => cmd.id !== id),
        ].slice(0, MAX_RECENT);
        setRecentCommands(newRecent);
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(newRecent));
    };

    const toggleFavorite = (id: string) => {
        const newFavorites = favorites.includes(id)
            ? favorites.filter((fav) => fav !== id)
            : [...favorites, id];
        setFavorites(newFavorites);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    };

    const handleSelect = useCallback(
        (callback: () => void, id: string, label: string) => {
            setOpen(false);
            addToRecent(id, label);
            callback();
        },
        [recentCommands]
    );

    // Navigation actions
    const navigationActions: Action[] = [
        {
            id: "nav-dashboard",
            label: "Ir al Dashboard",
            icon: Home,
            action: () => router.push("/dashboard"),
            keywords: ["inicio", "home", "principal"],
            group: "navigation",
            shortcut: "Ctrl+Alt+H",
        },
        {
            id: "nav-clients",
            label: "Ver Clientes",
            icon: Users,
            action: () => router.push("/clients"),
            keywords: ["clientes", "customers"],
            group: "navigation",
            shortcut: "Ctrl+Alt+C",
        },
        {
            id: "nav-tickets",
            label: "Ver Tickets",
            icon: Ticket,
            action: () => router.push("/tickets"),
            keywords: ["tickets", "soporte", "incidencias"],
            group: "navigation",
            shortcut: "Ctrl+Alt+T",
        },
        {
            id: "nav-payments",
            label: "Ver Pagos",
            icon: DollarSign,
            action: () => router.push("/payments"),
            keywords: ["pagos", "facturas", "cobros"],
            group: "navigation",
            shortcut: "Ctrl+Alt+P",
        },
        {
            id: "nav-contracts",
            label: "Ver Contratos",
            icon: FileText,
            action: () => router.push("/contracts"),
            keywords: ["contratos", "acuerdos"],
            group: "navigation",
        },
        {
            id: "nav-budgets",
            label: "Ver Presupuestos",
            icon: Package,
            action: () => router.push("/budgets"),
            keywords: ["presupuestos", "cotizaciones"],
            group: "navigation",
            shortcut: "Ctrl+Alt+B",
        },
        {
            id: "nav-calendar",
            label: "Ver Calendario",
            icon: Calendar,
            action: () => router.push("/calendar"),
            keywords: ["calendario", "eventos", "agenda"],
            group: "navigation",
            shortcut: "Ctrl+Alt+E",
        },
        {
            id: "nav-repository",
            label: "Bóveda de Archivos",
            icon: FolderArchive,
            action: () => router.push("/repository"),
            keywords: ["repositorio", "archivos", "documentos", "boveda"],
            group: "navigation",
            shortcut: "Ctrl+Alt+R",
        },
        {
            id: "nav-notifications",
            label: "Configurar Notificaciones",
            icon: Bell,
            action: () => router.push("/notifications"),
            keywords: ["notificaciones", "alertas", "avisos"],
            group: "navigation",
        },
        {
            id: "nav-system",
            label: "Configuración del Sistema",
            icon: Settings,
            action: () => router.push("/system"),
            keywords: ["sistema", "configuracion", "ajustes"],
            group: "navigation",
        },
        {
            id: "nav-database",
            label: "Base de Datos",
            icon: Database,
            action: () => router.push("/database"),
            keywords: ["base de datos", "db", "mongodb"],
            group: "navigation",
        },
        {
            id: "nav-mongo-servers",
            label: "Servidores MongoDB",
            icon: Database,
            action: () => router.push("/mongo-servers"),
            keywords: ["servidores", "mongodb", "bases", "cambiar", "switch"],
            group: "navigation",
        },
    ];

    // Quick actions
    const quickActions: Action[] = [
        {
            id: "action-new-client",
            label: "Crear Nuevo Cliente",
            icon: Plus,
            action: () => {
                router.push("/clients");
                setTimeout(() => toast.info("Haz clic en 'Nuevo Cliente' para continuar"), 500);
            },
            keywords: ["nuevo", "crear", "cliente", "agregar"],
            group: "actions",
            shortcut: "Ctrl+N",
        },
        {
            id: "action-new-ticket",
            label: "Crear Nuevo Ticket",
            icon: Plus,
            action: () => {
                router.push("/tickets");
                setTimeout(() => toast.info("Haz clic en 'Nuevo Ticket' para continuar"), 500);
            },
            keywords: ["nuevo", "crear", "ticket", "agregar"],
            group: "actions",
        },
        {
            id: "action-new-payment",
            label: "Registrar Pago",
            icon: Plus,
            action: () => {
                router.push("/payments");
                setTimeout(() => toast.info("Haz clic en 'Nuevo Pago' para continuar"), 500);
            },
            keywords: ["nuevo", "crear", "pago", "registrar"],
            group: "actions",
        },
        {
            id: "action-new-contract",
            label: "Crear Contrato",
            icon: Plus,
            action: () => {
                router.push("/contracts");
                setTimeout(() => toast.info("Haz clic en 'Nuevo Contrato' para continuar"), 500);
            },
            keywords: ["nuevo", "crear", "contrato", "agregar"],
            group: "actions",
        },
        {
            id: "action-new-budget",
            label: "Crear Presupuesto",
            icon: Plus,
            action: () => {
                router.push("/budgets");
                setTimeout(() => toast.info("Haz clic en 'Nuevo Presupuesto' para continuar"), 500);
            },
            keywords: ["nuevo", "crear", "presupuesto", "agregar"],
            group: "actions",
        },
    ];

    // Filter based on search
    const filteredClients = clients
        .filter(
            (client) =>
                client.name.toLowerCase().includes(search.toLowerCase()) ||
                client.email?.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);

    const filteredTickets = tickets
        .filter(
            (ticket) =>
                ticket.title.toLowerCase().includes(search.toLowerCase()) ||
                ticket.id.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);

    const filteredPayments = payments
        .filter(
            (payment) =>
                payment.invoice.toLowerCase().includes(search.toLowerCase()) ||
                payment.id.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);

    const filteredContracts = contracts
        .filter(
            (contract) =>
                contract.title.toLowerCase().includes(search.toLowerCase()) ||
                contract.id.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);

    const filteredNavigation = navigationActions.filter(
        (action) =>
            action.label.toLowerCase().includes(search.toLowerCase()) ||
            action.keywords?.some((keyword) => keyword.includes(search.toLowerCase()))
    );

    const filteredActions = quickActions.filter(
        (action) =>
            action.label.toLowerCase().includes(search.toLowerCase()) ||
            action.keywords?.some((keyword) => keyword.includes(search.toLowerCase()))
    );

    // Get favorite actions
    const favoriteActions = [...navigationActions, ...quickActions].filter((action) =>
        favorites.includes(action.id)
    );

    // Get recent actions
    const recentActions = recentCommands
        .map((recent) => [...navigationActions, ...quickActions].find((action) => action.id === recent.id))
        .filter(Boolean) as Action[];

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput
                placeholder="Buscar clientes, tickets, pagos, contratos... (Ctrl+K)"
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>{loading ? "Cargando..." : "No se encontraron resultados"}</CommandEmpty>

                {/* Recent Commands */}
                {!search && recentActions.length > 0 && (
                    <>
                        <CommandGroup heading="🕐 Recientes">
                            {recentActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <CommandItem
                                        key={action.id}
                                        onSelect={() => handleSelect(action.action, action.id, action.label)}
                                        className="cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{action.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.shortcut && (
                                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                                    {action.shortcut}
                                                </kbd>
                                            )}
                                            <Star
                                                className={`h-4 w-4 ${favorites.includes(action.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(action.id);
                                                }}
                                            />
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Favorites */}
                {!search && favoriteActions.length > 0 && (
                    <>
                        <CommandGroup heading="⭐ Favoritos">
                            {favoriteActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <CommandItem
                                        key={action.id}
                                        onSelect={() => handleSelect(action.action, action.id, action.label)}
                                        className="cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{action.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.shortcut && (
                                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                                    {action.shortcut}
                                                </kbd>
                                            )}
                                            <Star
                                                className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(action.id);
                                                }}
                                            />
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Quick Actions */}
                {filteredActions.length > 0 && (
                    <>
                        <CommandGroup heading="⚡ Acciones Rápidas">
                            {filteredActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <CommandItem
                                        key={action.id}
                                        onSelect={() => handleSelect(action.action, action.id, action.label)}
                                        className="cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{action.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.shortcut && (
                                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                                    {action.shortcut}
                                                </kbd>
                                            )}
                                            <Star
                                                className={`h-4 w-4 ${favorites.includes(action.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(action.id);
                                                }}
                                            />
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Navigation */}
                {filteredNavigation.length > 0 && (
                    <>
                        <CommandGroup heading="🧭 Navegación">
                            {filteredNavigation.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <CommandItem
                                        key={action.id}
                                        onSelect={() => handleSelect(action.action, action.id, action.label)}
                                        className="cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center">
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{action.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.shortcut && (
                                                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                                                    {action.shortcut}
                                                </kbd>
                                            )}
                                            <Star
                                                className={`h-4 w-4 ${favorites.includes(action.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavorite(action.id);
                                                }}
                                            />
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Clients */}
                {filteredClients.length > 0 && (
                    <>
                        <CommandGroup heading="👥 Clientes">
                            {filteredClients.map((client) => (
                                <CommandItem
                                    key={client.id}
                                    onSelect={() =>
                                        handleSelect(() => router.push(`/clients/${client.id}`), `client-${client.id}`, client.name)
                                    }
                                    className="cursor-pointer"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{client.name}</span>
                                        {client.email && <span className="text-xs text-muted-foreground">{client.email}</span>}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Tickets */}
                {filteredTickets.length > 0 && (
                    <>
                        <CommandGroup heading="🎫 Tickets">
                            {filteredTickets.map((ticket) => (
                                <CommandItem
                                    key={ticket.id}
                                    onSelect={() => handleSelect(() => router.push(`/tickets`), `ticket-${ticket.id}`, ticket.title)}
                                    className="cursor-pointer"
                                >
                                    <Ticket className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{ticket.title}</span>
                                        <span className="text-xs text-muted-foreground">
                                            #{ticket.id} · {ticket.status}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Payments */}
                {filteredPayments.length > 0 && (
                    <>
                        <CommandGroup heading="💰 Pagos">
                            {filteredPayments.map((payment) => (
                                <CommandItem
                                    key={payment.id}
                                    onSelect={() =>
                                        handleSelect(() => router.push(`/payments`), `payment-${payment.id}`, payment.invoice)
                                    }
                                    className="cursor-pointer"
                                >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{payment.invoice}</span>
                                        <span className="text-xs text-muted-foreground">
                                            ${payment.amount} · {payment.status}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                    </>
                )}

                {/* Contracts */}
                {filteredContracts.length > 0 && (
                    <CommandGroup heading="📄 Contratos">
                        {filteredContracts.map((contract) => (
                            <CommandItem
                                key={contract.id}
                                onSelect={() =>
                                    handleSelect(() => router.push(`/contracts`), `contract-${contract.id}`, contract.title)
                                }
                                className="cursor-pointer"
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                    <span>{contract.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        #{contract.id} · {contract.status}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
}
