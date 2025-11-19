"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
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
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Hash,
  CaseSensitive,
  User,
  Activity,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Calendar,
  Settings,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import { DeleteTicketDialog } from "./delete-ticket-dialog";
import { Ticket } from "@/types/ticket";
import { Contract } from "@/types/contract";
import { API_URL } from "@/lib/http";

interface TicketTableProps {
  tickets: Ticket[];
  onTicketDeleted: (ticketId: string) => void;
  onReopenTicket?: (ticket: Ticket) => void;
  actionLoadingTicketId?: string | null;
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
}: TicketTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const [contractsByClient, setContractsByClient] = useState<
    Record<string, Contract>
  >({});
  const ticketsPerPage = 15;

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

  const sortedTickets = useMemo(() => {
    const sortableItems = [...tickets];
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      sortableItems.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return direction === "ascending" ? 1 : -1;
        if (bValue === undefined) return direction === "ascending" ? -1 : 1;
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

  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);

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
      const interval = setInterval(calculateTimeAgo, 1000); // Update every second

      return () => clearInterval(interval);
    }, [timestamp]);

    return <span className="text-xs text-gray-500">({timeAgo})</span>;
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
              <TableHead onClick={() => requestSort("createdAt")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  Fecha
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
              <TableHead onClick={() => requestSort("hasActiveContract")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <ShieldAlert className="h-4 w-4" />
                  Contrato
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
          <TableBody>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  onClick={() => {
                    if (ticket.status !== "Pagado") {
                      router.push(`/tickets/${ticket.id}`);
                    }
                  }}
                  className={`cursor-pointer ${ticket.status === "Pagado" ? "opacity-70" : ""}`}
                  aria-disabled={ticket.status === "Pagado"}
                >
                  <TableCell className="font-medium">{ticket.id}</TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString()} <TimeAgo timestamp={ticket.createdAt} />
                  </TableCell>
                  <TableCell>{ticket.clientName || "Cliente sin nombre"}</TableCell>
                  <TableCell>
                    {(() => {
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
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {ticket.status === "Pagado" ? "Pagado · Resuelto" : ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end space-x-2"
                      onClick={(event) => event.stopPropagation()}
                    >
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
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteTicketDialog
                        ticket={ticket}
                        onTicketDeleted={onTicketDeleted}
                      >
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DeleteTicketDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron tickets.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={currentPage === 1 ? undefined : handlePreviousPage}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "opacity-40 pointer-events-none" : undefined}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : handleNextPage}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
