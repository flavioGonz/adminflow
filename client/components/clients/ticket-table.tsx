"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Edit,
  Trash2,
  Hash,
  CaseSensitive,
  User,
  Users,
  Activity,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Calendar,
  Settings,
  ArrowUpDown,
  Lock,
  Unlock,
  PlusCircle,
  FolderOpen,
  Loader2,
  MapPin,
  CheckCircle,
  Receipt,
  DollarSign,
  Timer,
  Check,
  Clock,
} from "lucide-react";
import { DeleteTicketDialog } from "./delete-ticket-dialog";
import { EditTicketDatetime } from "@/components/tickets/edit-ticket-datetime";
import { Ticket } from "@/types/ticket";
import { Group } from "@/types/group";
import { Contract } from "@/types/contract";
import { API_URL } from "@/lib/http";
import { AnimatedTableBody, AnimatedRow } from "@/hooks/use-table-animation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketDeleted: (ticketId: string) => void;
  onReopenTicket?: (ticket: Ticket) => void;
  actionLoadingTicketId?: string | null;
  groups?: Group[];
  disablePagination?: boolean;
}

type SortKey = keyof Ticket;

const formatContractAmount = (
  amount?: number,
  currency?: Contract["currency"]
) => {
  if (amount == null || Number.isNaN(amount)) {
    return "";
  }
  const currencyCode = currency || "UYU";
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyValue = (
  value?: number,
  currency?: Ticket["amountCurrency"]
) => {
  if (value == null) {
    return "";
  }
  const currencyCode = currency === "USD" ? "USD" : "UYU";
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
};


export function TicketTable({
  tickets,
  onTicketDeleted,
  onReopenTicket,
  actionLoadingTicketId,
  disablePagination = false,
  groups = [],
}: TicketTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  // Reset page when tickets change to avoid pagination desfasado
  useEffect(() => {
    setCurrentPage(1);
  }, [tickets]);
  const [contractsByClient, setContractsByClient] = useState<
    Record<string, Contract>
  >({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unlockedTickets, setUnlockedTickets] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<{ id: string; name: string; email: string; avatar?: string }[]>([]);
  const [clients, setClients] = useState<Record<string, { name: string; avatarUrl?: string }>>({});
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(null);
  const groupsMap = useMemo(() => {
    const map: Record<string, Group> = {};
    groups.forEach((group) => {
      if (group._id) {
        map[group._id] = group;
      }
    });
    return map;
  }, [groups]);
  const ticketsPerPage = 8;

  useEffect(() => {
    const controller = new AbortController();
    const loadClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }
        const data = await response.json();
        const clientMap: Record<string, { name: string; avatarUrl?: string }> = {};
        data.forEach((client: any) => {
          clientMap[client.id] = { name: client.name, avatarUrl: client.avatarUrl };
        });
        setClients(clientMap);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        console.error("Error fetching clients:", err);
      }
    };
    loadClients();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadContracts = async () => {
      try {
        const response = await fetch(`${API_URL}/contracts`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los contratos.");
        }
        const data = (await response.json()) as Contract[];
        const map: Record<string, Contract> = {};
        data.forEach((contract) => {
          const clientKey = contract.clientId;
          const existing = map[clientKey];
          const isActive = contract.status?.toLowerCase() === "activo";
          const existingIsActive = existing?.status?.toLowerCase() === "activo";
          if (!existing) {
            map[clientKey] = contract;
          } else if (isActive && !existingIsActive) {
            map[clientKey] = contract;
          }
        });
        setContractsByClient(map);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching contracts:", err);
      }
    };
    loadContracts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios.");
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching users:", err);
      }
    };
    loadUsers();
    return () => controller.abort();
  }, []);

  const sortedTickets = useMemo(() => {
    const sortableItems = [...tickets];
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      sortableItems.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined || aValue === null) return direction === "ascending" ? 1 : -1;
        if (bValue === undefined || bValue === null) return direction === "ascending" ? -1 : 1;
        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tickets, sortConfig]);

  const currentTickets = useMemo(() => {
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    return sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  }, [sortedTickets, currentPage, ticketsPerPage]);

  const renderedTickets = disablePagination ? tickets : currentTickets;

  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

  const visiblePages = useMemo(() => {
    const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("ellipsis-start");
    for (let p = start; p <= end; p += 1) pages.push(p);
    if (end < totalPages - 1) pages.push("ellipsis-end");

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSetPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusVariant = (status: Ticket["status"]) => {
    switch (status) {
      case "Abierto":
        return "default";
      case "En proceso":
        return "secondary";
      case "Visita":
      case "Visita - Coordinar":
      case "Visita Programada":
      case "Visita Realizada":
      case "Revision Cerrar Visita":
        return "secondary";
      case "Resuelto":
        return "outline";
      case "Facturar":
        return "destructive";
      case "Pagado":
        return "outline";
      default:
        return "default";
    }
  };

  const statusOptions: Ticket["status"][] = [
    "Nuevo",
    "Abierto",
    "En proceso",
    "Visita",
    "Visita - Coordinar",
    "Visita Programada",
    "Visita Realizada",
    "Revision Cerrar Visita",
    "Resuelto",
    "Facturar",
    "Pagado",
  ];
  const statusIcons: Record<Ticket["status"], React.ComponentType<{ className?: string }>> = {
    Nuevo: PlusCircle,
    Abierto: FolderOpen,
    "En proceso": Loader2,
    Visita: MapPin,
    "Visita - Coordinar": MapPin,
    "Visita Programada": Calendar,
    "Visita Realizada": CheckCircle,
    "Revision Cerrar Visita": Activity,
    Resuelto: CheckCircle,
    Facturar: Receipt,
    Pagado: DollarSign,
  };
  const statusIconClasses: Record<Ticket["status"], string> = {
    Nuevo: "text-sky-500",
    Abierto: "text-blue-500",
    "En proceso": "text-amber-500",
    Visita: "text-purple-500",
    "Visita - Coordinar": "text-purple-400",
    "Visita Programada": "text-indigo-500",
    "Visita Realizada": "text-teal-600",
    "Revision Cerrar Visita": "text-amber-600",
    Resuelto: "text-emerald-600",
    Facturar: "text-orange-500",
    Pagado: "text-lime-600",
  };

  const isRowLocked = (ticket: Ticket) =>
    ticket.status === "Resuelto" && !unlockedTickets.has(ticket.id);

  const handleStatusChange = async (ticket: Ticket, value: Ticket["status"]) => {
    setUpdatingId(ticket.id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ticket, status: value }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar estado (${response.status})`);
      }
      const updated = await response.json();
      window.dispatchEvent(new Event("tickets:refresh"));
      toast.success(`Estado actualizado a ${value}`);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignedToChange = async (ticket: Ticket, userEmail: string | null) => {
    setUpdatingId(ticket.id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticket,
          assignedTo: userEmail,
          assignedGroupId: null,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar asignación (${response.status})`);
      }
      window.dispatchEvent(new Event("tickets:refresh"));
      toast.success(userEmail ? `Asignado a ${userEmail}` : "Asignación eliminada");
      setAssignPopoverOpen(null);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar la asignación");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGroupAssignmentChange = async (ticket: Ticket, groupId: string | null) => {
    setUpdatingId(ticket.id);
    try {
      const response = await fetch(`${API_URL}/tickets/${ticket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticket,
          assignedGroupId: groupId,
          assignedTo: null,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar el grupo (${response.status})`);
      }
      window.dispatchEvent(new Event("tickets:refresh"));
      const groupName = groupId ? groupsMap[groupId]?.name || "grupo" : "";
      toast.success(groupId ? `Asignado al grupo ${groupName}` : "Asignación de grupo eliminada");
      setAssignPopoverOpen(null);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el grupo");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleLock = (ticket: Ticket) => {
    setUnlockedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticket.id)) {
        next.delete(ticket.id);
      } else {
        next.add(ticket.id);
      }
      return next;
    });
  };

  const formatDateTimeWithTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-UY", {
      timeZone: "America/Montevideo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const TimeAgo = ({ timestamp }: { timestamp: string }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
      const calculateTimeAgo = () => {
        const now = new Date();
        const created = new Date(timestamp);
        const diffSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

        if (diffSeconds < 60) {
          setTimeAgo(`${diffSeconds}s`);
        } else if (diffSeconds < 3600) {
          setTimeAgo(`${Math.floor(diffSeconds / 60)}m`);
        } else if (diffSeconds < 86400) {
          setTimeAgo(`${Math.floor(diffSeconds / 3600)}h`);
        } else {
          setTimeAgo(`${Math.floor(diffSeconds / 86400)}d`);
        }
      };

      calculateTimeAgo(); // Initial calculation
      const interval = setInterval(calculateTimeAgo, 60000); // Update every minute to reduce churn

      return () => clearInterval(interval);
    }, [timestamp]);

    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Timer className="h-3.5 w-3.5" />
        {timeAgo || '—'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("id")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Hash className="h-4 w-4" />
                  ID
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("clientName")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Cliente
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("title")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <CaseSensitive className="h-4 w-4" />
                  Título
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("createdAt")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  Fecha
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("hasActiveContract")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <ShieldAlert className="h-4 w-4" />
                  Contrato
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("assignedTo")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Asignado
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("status")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Activity className="h-4 w-4" />
                  Estado
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Settings className="h-4 w-4" />
                  Acciones
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <AnimatedTableBody staggerDelay={0.03}>
            {renderedTickets.length > 0 ? (
              renderedTickets.map((ticket, index) => {
                const assignedGroup = ticket.assignedGroupId ? groupsMap[ticket.assignedGroupId] : null;
                return (
                  <AnimatedRow
                    key={ticket.id}
                    delay={index * 0.03}
                    onClick={() => {
                      if (!isRowLocked(ticket) && ticket.status !== "Pagado") {
                        router.push(`/tickets/${ticket.id}`);
                      }
                    }}
                    className={`${isRowLocked(ticket) ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${ticket.status === "Pagado" ? "opacity-70" : ""}`}
                    aria-disabled={ticket.status === "Pagado" || isRowLocked(ticket)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{ticket.id}</span>
                        <TimeAgo timestamp={ticket.createdAt} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const client = ticket.clientId ? clients[ticket.clientId] : null;
                          const avatarUrl = client?.avatarUrl;
                          const clientName = ticket.clientName || "Cliente sin nombre";
                          const initial = clientName.charAt(0).toUpperCase();

                          return (
                            <>
                              {avatarUrl ? (
                                <img
                                  src={
                                    avatarUrl.startsWith("http")
                                      ? avatarUrl
                                      : `${API_URL.replace('/api', '')}${avatarUrl}`
                                  }
                                  alt={clientName}
                                  className="h-6 w-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                  {initial}
                                </div>
                              )}
                              <span className="truncate max-w-[150px]" title={clientName}>
                                {clientName}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>                    <div
                      className="relative max-w-[15ch] overflow-hidden pr-6"
                      title={ticket.title}
                    >
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {ticket.title}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
                    </div>
                    </TableCell>
                    <TableCell>
                      <EditTicketDatetime
                        ticketId={ticket.id}
                        initialDate={ticket.createdAt}
                        onSuccess={() => window.dispatchEvent(new Event("tickets:refresh"))}
                      >
                        <div className="flex flex-col cursor-pointer hover:opacity-75 transition">
                          <span className="text-sm font-semibold text-slate-900">
                            {new Date(ticket.createdAt).toLocaleDateString("es-UY", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleTimeString("es-UY", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </EditTicketDatetime>
                    </TableCell>
                    <TableCell>                    {(() => {
                      const contract = ticket.clientId
                        ? contractsByClient[ticket.clientId]
                        : undefined;
                      const title =
                        contract?.title ||
                        ticket.contractTitle ||
                        (ticket.hasActiveContract ? "Contrato activo" : null);
                      const amount =
                        contract?.amount ?? ticket.amount ?? undefined;
                      const currency =
                        contract?.currency || ticket.amountCurrency;
                      if (title) {
                        return (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <ShieldCheck className="h-4 w-4 text-green-500" />
                              <span className="truncate">{title}</span>
                            </div>
                            {amount ? (
                              <Badge
                                variant="secondary"
                                className="px-2 py-0 text-[11px] font-normal"
                              >
                                {formatContractAmount(amount, currency)}
                              </Badge>
                            ) : null}
                          </div>
                        );
                      }
                      return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShieldX className="h-4 w-4 text-red-500" />
                          Sin contrato activo
                        </div>
                      );
                    })()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Popover open={assignPopoverOpen === ticket.id} onOpenChange={(open) => setAssignPopoverOpen(open ? ticket.id : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full justify-start font-normal px-2"
                            disabled={updatingId === ticket.id || isRowLocked(ticket)}
                          >
                            <div className="flex flex-col items-start gap-1 text-left">
                              {assignedGroup && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <Users className="h-3.5 w-3.5 text-slate-500" />
                                  {assignedGroup.name}
                                </span>
                              )}
                              {ticket.assignedTo ? (
                                (() => {
                                  const assignedUser = users.find(u =>
                                    u.id === ticket.assignedTo ||
                                    u._id === ticket.assignedTo ||
                                    u.email === ticket.assignedTo
                                  );
                                  const avatarUrl = assignedUser?.avatar;
                                  const initial = (assignedUser?.name || ticket.assignedTo || "?").charAt(0).toUpperCase();

                                  return (
                                    <div className="flex items-center gap-2">
                                      {avatarUrl ? (
                                        <img
                                          src={
                                            avatarUrl.startsWith("http")
                                              ? avatarUrl
                                              : `${API_URL.replace('/api', '')}${avatarUrl}`
                                          }
                                          alt={assignedUser?.name || ticket.assignedTo}
                                          className="h-6 w-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                          {initial}
                                        </div>
                                      )}
                                      <span className="truncate max-w-[120px]" title={assignedUser?.name || ticket.assignedTo}>
                                        {assignedUser ? assignedUser.name : (ticket.assignedTo?.includes('@') ? ticket.assignedTo.split('@')[0] : ticket.assignedTo)}
                                      </span>
                                    </div>
                                  );
                                })()
                              ) : (
                                <span className="text-xs text-slate-400 italic">Sin asignar</span>
                              )}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar usuario o grupo..." />
                            <CommandList>
                              <CommandEmpty>No se encontró coincidencia.</CommandEmpty>
                              {groups.length > 0 && (
                                <CommandGroup heading="Grupos">
                                  <CommandItem onSelect={() => handleGroupAssignmentChange(ticket, null)}>
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        !ticket.assignedGroupId ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-slate-500" />
                                      <span>Sin grupo</span>
                                    </div>
                                  </CommandItem>
                                  {groups.map((group) => (
                                    <CommandItem
                                      key={group._id}
                                      value={group.name}
                                      onSelect={() => handleGroupAssignmentChange(ticket, group._id)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          ticket.assignedGroupId === group._id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-slate-500" />
                                        <div className="flex flex-col">
                                          <span>{group.name}</span>
                                          {group.description ? (
                                            <span className="text-[11px] text-muted-foreground">
                                              {group.description}
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                              <CommandGroup heading="Usuarios">
                                <CommandItem
                                  onSelect={() => handleAssignedToChange(ticket, null)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !ticket.assignedTo ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <span className="text-slate-400 italic">Sin asignar</span>
                                </CommandItem>
                                {users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.email}
                                    onSelect={() => handleAssignedToChange(ticket, user.email)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        ticket.assignedTo === user.email ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex items-center gap-2">
                                      {user.avatar ? (
                                        <img
                                          src={
                                            user.avatar.startsWith("http")
                                              ? user.avatar
                                              : `${API_URL.replace('/api', '')}${user.avatar}`
                                          }
                                          alt={user.email}
                                          className="h-6 w-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                          {user.email.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="flex flex-col">
                                        <span className="text-sm">{user.name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => handleStatusChange(ticket, value as Ticket["status"])}
                        disabled={updatingId === ticket.id || isRowLocked(ticket)}
                      >
                        <SelectTrigger className="w-40 text-left pl-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = statusIcons[ticket.status] ?? Activity;
                              const color = statusIconClasses[ticket.status] ?? "text-slate-500";
                              return <Icon className={`h-4 w-4 ${color}`} />;
                            })()}
                            <span className="leading-none">{ticket.status}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="min-w-[180px]">
                          {statusOptions.map((option) => {
                            const Icon = statusIcons[option] ?? Activity;
                            const color = statusIconClasses[option] ?? "text-slate-500";
                            return (
                              <SelectItem key={option} value={option}>
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${color}`} />
                                  <span className="leading-none">{option}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end space-x-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {ticket.status === "Resuelto" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title={isRowLocked(ticket) ? "Desbloquear fila" : "Bloquear fila"}
                            onClick={() => toggleLock(ticket)}
                            className={isRowLocked(ticket) ? "text-slate-500" : "text-emerald-600"}
                          >
                            {isRowLocked(ticket) ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        )}
                        {ticket.status === "Pagado" && onReopenTicket && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500"
                            onClick={() => onReopenTicket(ticket)}
                            disabled={actionLoadingTicketId === `unlock-${ticket.id}`}
                            title="Reabrir ticket"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" asChild disabled={isRowLocked(ticket)}>
                          <Link href={`/tickets/${ticket.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteTicketDialog
                          ticket={ticket}
                          onTicketDeleted={onTicketDeleted}
                        >
                          <Button variant="ghost" size="icon" disabled={isRowLocked(ticket)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </DeleteTicketDialog>
                      </div>
                    </TableCell>
                  </AnimatedRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron tickets.
                </TableCell>
              </TableRow>
            )}
          </AnimatedTableBody>
        </Table>
      </div>
      {!disablePagination && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePreviousPage();
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-40" : undefined}
              />
            </PaginationItem>

            {visiblePages.map((page, idx) => {
              if (page === "ellipsis-start" || page === "ellipsis-end") {
                return (
                  <PaginationItem key={`${page}-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSetPage(page);
                    }}
                    isActive={page === currentPage}
                    className={page === currentPage ? "border-slate-300 bg-white shadow-sm" : ""}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleNextPage();
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-40" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
