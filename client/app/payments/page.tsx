"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Calculator,
  CalendarCheck,
  CheckCircle,
  Clock3,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Filter,
  Hash,
  MessageCircle,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { PageTransition, TablePageTransition } from "@/components/ui/page-transition";
import Link from "next/link";
import { toast } from "sonner";
import { Ticket } from "@/types/ticket";
import { Client } from "@/types/client";
import { Payment, PaymentStatus, Currency } from "@/types/payment";
import { API_URL } from "@/lib/http";
import {
  fetchAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from "@/lib/api-payments";
import ReactCountryFlag from "react-country-flag";

const formatCurrencyValue = (value: number, currency: Currency = "UYU") =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const statusVariant: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> =
{
  Pendiente: "destructive",
  Enviado: "outline",
  "A confirmar": "secondary",
  "Emitir Factura": "default",
  Pagado: "default",
};

const statusOrder: PaymentStatus[] = ["Pendiente", "Enviado", "A confirmar", "Emitir Factura", "Pagado"];

interface PaymentFormState {
  invoice: string;
  client: string;
  clientId: string;
  amount: number;
  status: PaymentStatus;
  ticketId: string;
  ticketTitle: string;
  currency: "UYU" | "USD";
  concept: string;
  date: Date | undefined;
}

const getDefaultFormState = (): PaymentFormState => ({
  invoice: "",
  client: "",
  clientId: "",
  amount: 0,
  status: "Pendiente",
  ticketId: "",
  ticketTitle: "",
  currency: "UYU",
  concept: "",
  date: new Date(),
});

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketOptions: Ticket[];
  formState: PaymentFormState;
  onFormChange: (state: PaymentFormState) => void;
  onSave: () => void;
  isEditing: boolean;
}

function PaymentDialog({
  open,
  onOpenChange,
  ticketOptions,
  formState,
  onFormChange,
  onSave,
  isEditing,
}: PaymentDialogProps) {
  const [clientOptions, setClientOptions] = useState<Client[]>([]);
  const ticketDatalistId = "payments-ticket-list";
  const clientDatalistId = "payments-client-list";
  const [ticketQuery, setTicketQuery] = useState("");
  const [enableInvoice, setEnableInvoice] = useState(false);
  const [enableTicket, setEnableTicket] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }
        const data = (await response.json()) as Client[];
        setClientOptions(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();

    return () => controller.abort();
  }, []);

  const filteredClients = useMemo(() => {
    if (!formState.client) {
      return clientOptions;
    }
    const query = formState.client.toLowerCase();
    return clientOptions.filter((client) => {
      return (
        client.name.toLowerCase().includes(query) ||
        (client.alias ?? "").toLowerCase().includes(query)
      );
    });
  }, [clientOptions, formState.client]);

  const handleClientInputChange = (value: string) => {
    const match = clientOptions.find(
      (client) => client.name.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      onFormChange({
        ...formState,
        client: match.name,
        clientId: match.id,
      });
    } else {
      onFormChange({
        ...formState,
        client: value,
        clientId: "",
      });
    }
  };

  const filteredTickets = useMemo(() => {
    if (!ticketQuery) {
      return ticketOptions;
    }
    const normalized = ticketQuery.toLowerCase();
    return ticketOptions.filter((ticket) =>
      (ticket.title ?? "").toLowerCase().includes(normalized)
    );
  }, [ticketOptions, ticketQuery]);

  const handleTicketSearch = (value: string) => {
    setTicketQuery(value);
    const match = ticketOptions.find(
      (ticket) => ticket.title?.toLowerCase() === value.toLowerCase()
    );
    if (match) {
      handleTicketSelect(match.id);
    }
  };

  const handleTicketSelect = (id: string) => {
    const ticket = ticketOptions.find((item) => item.id === id);
    let nextState = { ...formState, ticketId: id };
    if (ticket) {
      nextState = {
        ...nextState,
        client: ticket.clientName,
        ticketTitle: ticket.title,
        clientId: ticket.clientId ?? "",
        invoice: nextState.invoice || `FAC-${ticket.id}`,
        amount: nextState.amount || ticket.amount || 0,
      };
      setTicketQuery(ticket.title ?? ticket.id);
    }
    onFormChange(nextState);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Registrar nuevo pago
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white/90 shadow-2xl backdrop-blur">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar pago" : "Registrar pago nuevo"}
          </DialogTitle>
          <DialogDescription>
            Asocia un ticket en estado “Facturar” y genera la cobranza.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Factura
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Facturar</span>
                <Switch
                  checked={enableInvoice}
                  onCheckedChange={setEnableInvoice}
                />
              </div>
            </div>
            <Input
              value={formState.invoice}
              onChange={(event) =>
                onFormChange({ ...formState, invoice: event.target.value })
              }
              placeholder="FAC-T123"
              disabled={!enableInvoice}
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Fecha del pago
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formState.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formState.date ? (
                    format(formState.date, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formState.date}
                  onSelect={(date) => onFormChange({ ...formState, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Monto
              </label>
              <Input
                type="number"
                min={0}
                value={formState.amount}
                onChange={(event) =>
                  onFormChange({ ...formState, amount: Number(event.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Concepto del pago
              </label>
              <Input
                value={formState.concept}
                onChange={(event) =>
                  onFormChange({ ...formState, concept: event.target.value })
                }
                placeholder="Detalle del servicio o factura"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Moneda
            </label>
            <Select
              value={formState.currency}
              onValueChange={(value) =>
                onFormChange({
                  ...formState,
                  currency: value as PaymentFormState["currency"],
                })
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecciona moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UYU">
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      svg
                      countryCode="UY"
                      className="inline-block h-4 w-5"
                      aria-label="Uruguay"
                    />
                    Pesos uruguayos (UYU)
                  </div>
                </SelectItem>
                <SelectItem value="USD">
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      svg
                      countryCode="US"
                      className="inline-block h-4 w-5"
                      aria-label="Estados Unidos"
                    />
                    Dólares (USD)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Cliente
            </label>
            <Input
              list={clientDatalistId}
              value={formState.client}
              onChange={(event) => handleClientInputChange(event.target.value)}
              placeholder="Selecciona o escribe un cliente"
            />
            <datalist id={clientDatalistId}>
              {filteredClients.slice(0, 15).map((client) => (
                <option key={client.id} value={client.name} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Ticket asociado
                </label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enableTicket}
                    onCheckedChange={setEnableTicket}
                  />
                </div>
              </div>
              <Input
                list={ticketDatalistId}
                value={ticketQuery}
                onChange={(event) => handleTicketSearch(event.target.value)}
                placeholder="Busca un ticket facturable"
                className="mb-2"
                disabled={!enableTicket}
              />
              <datalist id={ticketDatalistId}>
                {filteredTickets.slice(0, 15).map((ticket) => (
                  <option key={ticket.id} value={ticket.title ?? ticket.id} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Estado
              </label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  onFormChange({ ...formState, status: value as PaymentStatus })
                }
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-red-500" />
                      Pendiente
                    </div>
                  </SelectItem>
                  <SelectItem value="Enviado">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      Enviado
                    </div>
                  </SelectItem>
                  <SelectItem value="A confirmar">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-orange-500" />
                      A confirmar
                    </div>
                  </SelectItem>
                  <SelectItem value="Emitir Factura">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      Emitir Factura
                    </div>
                  </SelectItem>
                  <SelectItem value="Pagado">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Pagado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmPaymentForm {
  method: "Transferencia" | "Efectivo" | "Cheque";
  note: string;
  date: string;
}

const getDefaultConfirmForm = (): ConfirmPaymentForm => ({
  method: "Transferencia",
  note: "",
  date: new Date().toISOString().split("T")[0],
});

interface ConfirmPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: ConfirmPaymentForm;
  onFormChange: (state: ConfirmPaymentForm) => void;
  onConfirm: () => void;
  payment?: Payment | null;
}

function ConfirmPaymentDialog({
  open,
  onOpenChange,
  formState,
  onFormChange,
  onConfirm,
  payment,
}: ConfirmPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Confirmar pago
          </DialogTitle>
          <DialogDescription>
            Ajusta fecha, tipo y agrega una nota antes de marcar como pagado.
          </DialogDescription>
        </DialogHeader>
        {payment ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Factura
              </label>
              <Input value={payment.invoice} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                Fecha
              </label>
              <Input
                type="date"
                value={formState.date}
                onChange={(event) =>
                  onFormChange({ ...formState, date: event.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Tipo de pago
              </label>
              <Select
                value={formState.method}
                onValueChange={(value) =>
                  onFormChange({
                    ...formState,
                    method: value as ConfirmPaymentForm["method"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Nota
              </label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring focus-visible:ring-primary/40"
                rows={3}
                value={formState.note}
                onChange={(event) =>
                  onFormChange({ ...formState, note: event.target.value })
                }
                placeholder="Agrega contexto breve"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona un pago primero.</p>
        )}
        <DialogFooter className="space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!payment}>
            Confirmar y guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<"todos" | PaymentStatus>("todos");
  const [search, setSearch] = useState("");
  const [facturarTickets, setFacturarTickets] = useState<Ticket[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formState, setFormState] = useState<PaymentFormState>(getDefaultFormState());
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<Payment | null>(null);
  const [confirmForm, setConfirmForm] = useState<ConfirmPaymentForm>(getDefaultConfirmForm());
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<"todos" | "UYU" | "USD">("todos");
  const [dateFilter, setDateFilter] = useState<"thisMonth" | "lastMonth" | "thisWeek" | "all" | "custom">("thisMonth");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment | "client" | "amount";
    direction: "ascending" | "descending";
  } | null>(null);
  const itemsPerPage = 10;

  const requestSort = (key: keyof Payment | "client" | "amount") => {
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

  const loadPayments = useCallback(async () => {
    try {
      const fetched = await fetchAllPayments();
      setPayments(fetched);
    } catch (error) {
      console.error("No se pudieron cargar los pagos", error);
      toast.error("No se pudieron cargar los pagos.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFacturarTickets = async () => {
      try {
        const response = await fetch(`${API_URL}/tickets`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los tickets.");
        }
        const data = (await response.json()) as Ticket[];
        setFacturarTickets(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        const friendlyMessage =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los tickets.";
        toast.error(friendlyMessage);
      }
    };

    fetchFacturarTickets();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsdRate = async () => {
      try {
        const response = await fetch(
          "https://api.exchangerate.host/latest?base=USD&symbols=UYU",
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("No se pudo obtener la cotización.");
        }
        const data = await response.json();
        const rate = data?.rates?.UYU;
        if (typeof rate === "number") {
          setUsdRate(rate);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.warn("Cotización USD no disponible", error);
      }
    };

    fetchUsdRate();

    return () => controller.abort();
  }, []);

  const filteredPayments = useMemo(() => {
    const term = search.toLowerCase();
    let filtered = payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "todos" || payment.status === statusFilter;
      const matchesCurrency =
        currencyFilter === "todos" || payment.currency === currencyFilter;
      const matchesSearch =
        payment.invoice.toLowerCase().includes(term) ||
        payment.client.toLowerCase().includes(term) ||
        (payment.concept && payment.concept.toLowerCase().includes(term)) ||
        (payment.ticketTitle && payment.ticketTitle.toLowerCase().includes(term));

      let matchesDate = true;
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();

      if (dateFilter === "thisMonth") {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        matchesDate = isWithinInterval(paymentDate, { start, end });
      } else if (dateFilter === "lastMonth") {
        const lastMonth = subMonths(now, 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        matchesDate = isWithinInterval(paymentDate, { start, end });
      } else if (dateFilter === "thisWeek") {
        const start = startOfWeek(now, { locale: es });
        const end = endOfWeek(now, { locale: es });
        matchesDate = isWithinInterval(paymentDate, { start, end });
      } else if (dateFilter === "custom" && customDate) {
        // Comparar solo día, mes y año
        matchesDate =
          paymentDate.getDate() === customDate.getDate() &&
          paymentDate.getMonth() === customDate.getMonth() &&
          paymentDate.getFullYear() === customDate.getFullYear();
      }

      return matchesStatus && matchesCurrency && matchesSearch && matchesDate;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [payments, search, statusFilter, currencyFilter, dateFilter, customDate, sortConfig]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, currencyFilter, dateFilter, customDate]);

  const totalThisMonth = useMemo(() => {
    const today = new Date();
    return payments
      .filter((payment) => {
        const date = new Date(payment.createdAt);
        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth()
        );
      })
      .reduce((acc, payment) => acc + payment.amount, 0);
  }, [payments]);

  const pendingCount = payments.filter((payment) => payment.status === "Pendiente")
    .length;

  const ticketDebtCount = facturarTickets.length;

  const summaryCards = [
    {
      title: "Tickets adeudados",
      value: ticketDebtCount,
      description: "Casos en estado Facturar listos para cobrar.",
      icon: Calculator,
    },
    {
      title: "Pagos este mes",
      value: `$${totalThisMonth.toLocaleString("es-AR")}`,
      description: "Cobros registrados en el mes vigente.",
      icon: CalendarCheck,
    },
    {
      title: "Pagos pendientes",
      value: pendingCount,
      description: "A la espera de confirmación o comprobante.",
      icon: Clock3,
    },
  ];

  const handleSavePayment = async (payment: Payment) => {
    try {
      const saved = editingPayment
        ? await updatePayment(payment.id, payment)
        : await createPayment(payment);
      setPayments((prev) => {
        if (editingPayment) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...prev];
      });
      setEditingPayment(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el pago.";
      toast.error(message);
      console.error("Save payment failed", error);
    }
  };

  const handleDialogSave = async () => {
    if (!formState.invoice.trim() || !formState.client.trim()) {
      toast.error("Complete el cliente y la factura.");
      return;
    }
    if (!(formState.amount > 0)) {
      toast.error("Ingresá un monto mayor a cero.");
      return;
    }

    const payment: Payment = {
      id: editingPayment?.id ?? "",
      invoice: formState.invoice,
      client: formState.client,
      clientId: formState.clientId || undefined,
      amount: formState.amount,
      status: formState.status,
      method: "Transferencia",
      createdAt: formState.date ? formState.date.toISOString() : (editingPayment?.createdAt ?? new Date().toISOString()),
      ticketId: formState.ticketId || undefined,
      ticketTitle: formState.ticketTitle || undefined,
      currency: formState.currency ?? "UYU",
      concept: formState.concept,
    };

    await handleSavePayment(payment);
    setIsDialogOpen(false);
    setFormState(getDefaultFormState());
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setFormState({
      invoice: payment.invoice,
      client: payment.client,
      clientId: payment.clientId ?? "",
      amount: payment.amount,
      status: payment.status,
      ticketId: payment.ticketId || "",
      ticketTitle: payment.ticketTitle || "",
      currency: payment.currency ?? "UYU",
      concept: payment.concept || "",
      date: payment.createdAt ? new Date(payment.createdAt) : new Date(),
    });
    setIsDialogOpen(true);
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);
      setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
      toast.success("Pago eliminado");
    } catch (error) {
      toast.error("No se pudo eliminar el pago.");
    }
  };

  const openConfirmDialog = (payment: Payment) => {
    setConfirmingPayment(payment);
    setConfirmForm({
      method: payment.method as ConfirmPaymentForm["method"],
      note: payment.note ?? "",
      date: payment.createdAt.split("T")[0],
    });
    setIsConfirmDialogOpen(true);
  };

  const applyConfirmPayment = async () => {
    if (!confirmingPayment) {
      return;
    }
    const updatedPayment: Payment = {
      ...confirmingPayment,
      status: "Pagado",
      method: confirmForm.method,
      note: confirmForm.note,
      createdAt: confirmForm.date,
    };
    try {
      const saved = await updatePayment(updatedPayment.id, updatedPayment);
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === saved.id ? saved : payment
        )
      );
      window.dispatchEvent(new Event("tickets:refresh"));
      toast.success("Pago confirmado");
    } catch (error) {
      toast.error("No se pudo confirmar el pago.");
    } finally {
      setIsConfirmDialogOpen(false);
      setConfirmingPayment(null);
      setConfirmForm(getDefaultConfirmForm());
    }
  };





  return (
    <DashboardLayout>
      <PageTransition>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <ShinyText size="3xl" weight="bold">Pagos</ShinyText>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Controla cobranzas y estados de los tickets en facturación.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {usdRate && (
                <p className="text-xs text-muted-foreground">
                  1 USD = {usdRate.toFixed(2)} UYU (cotización oficial)
                </p>
              )}
              <PaymentDialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) {
                    setEditingPayment(null);
                    setFormState(getDefaultFormState());
                  }
                }}
                ticketOptions={facturarTickets}
                formState={formState}
                onFormChange={setFormState}
                onSave={handleDialogSave}
                isEditing={Boolean(editingPayment)}
              />
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-slate-500">
                    <Icon className="h-5 w-5 text-slate-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {card.title}
                    </span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-800">
                    {card.value}
                  </div>
                  <p className="text-sm text-slate-500">{card.description}</p>
                </div>
              );
            })}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por factura, cliente, concepto o ticket..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value: "todos" | PaymentStatus) =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Estado" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="Pendiente">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-red-500" />
                        Pendiente
                      </div>
                    </SelectItem>
                    <SelectItem value="Enviado">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        Enviado
                      </div>
                    </SelectItem>
                    <SelectItem value="A confirmar">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                        A confirmar
                      </div>
                    </SelectItem>
                    <SelectItem value="Emitir Factura">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" />
                        Emitir Factura
                      </div>
                    </SelectItem>
                    <SelectItem value="Pagado">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Pagado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={currencyFilter}
                  onValueChange={(value: "todos" | "UYU" | "USD") =>
                    setCurrencyFilter(value)
                  }
                >
                  <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Moneda" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="UYU">
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag
                          svg
                          countryCode="UY"
                          className="inline-block h-4 w-5"
                          aria-label="Uruguay"
                        />
                        UYU
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag
                          svg
                          countryCode="US"
                          className="inline-block h-4 w-5"
                          aria-label="Estados Unidos"
                        />
                        USD
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={dateFilter}
                  onValueChange={(value: "thisMonth" | "lastMonth" | "thisWeek" | "all" | "custom") => {
                    setDateFilter(value);
                    if (value !== "custom") setCustomDate(undefined);
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Fecha" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">Este mes</SelectItem>
                    <SelectItem value="lastMonth">Mes pasado</SelectItem>
                    <SelectItem value="thisWeek">Esta semana</SelectItem>
                    <SelectItem value="custom">Filtrar por fecha</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="all">Todas las fechas</SelectItem>
                  </SelectContent>
                </Select>

                {dateFilter === "custom" && (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !customDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customDate ? (
                            format(customDate, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customDate}
                          onSelect={setCustomDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {customDate && (
                      <Button variant="ghost" size="icon" onClick={() => setCustomDate(undefined)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredPayments.length} {filteredPayments.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>


          <ConfirmPaymentDialog
            open={isConfirmDialogOpen}
            onOpenChange={(open) => {
              setIsConfirmDialogOpen(open);
              if (!open) {
                setConfirmingPayment(null);
              }
            }}
            formState={confirmForm}
            onFormChange={setConfirmForm}
            onConfirm={applyConfirmPayment}
            payment={confirmingPayment}
          />
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("createdAt")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <CalendarCheck className="h-4 w-4" />
                      Fecha
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("invoice")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <Hash className="h-4 w-4" />
                      Factura
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("client")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <User className="h-4 w-4" />
                      Cliente
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("ticketTitle")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <FileText className="h-4 w-4" />
                      Ticket
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("concept")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <FileText className="h-4 w-4" />
                      Concepto
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("status")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <CreditCard className="h-4 w-4" />
                      Estado
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead onClick={() => requestSort("amount")}>
                    <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                      <DollarSign className="h-4 w-4" />
                      Monto
                      <ArrowUpDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Método
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      Acciones
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TablePageTransition pageKey={currentPage}>
                {paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-6 text-center">
                      No existen pagos para el criterio actual.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            {payment.invoice}
                          </span>
                          {payment.note && (
                            <span className="text-xs text-muted-foreground">
                              {payment.note}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.clientId ? (
                          <Link
                            href={`/clients/${payment.clientId}`}
                            className="text-primary hover:underline"
                          >
                            {payment.client}
                          </Link>
                        ) : (
                          payment.client
                        )}
                      </TableCell>
                      <TableCell>{payment.ticketTitle || "Sin ticket"}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">
                          {payment.concept || "Sin concepto"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[payment.status]}
                          className={
                            payment.status === "Pagado"
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
                              : payment.status === "Enviado"
                                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                                : payment.status === "Emitir Factura"
                                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                                  : payment.status === "A confirmar"
                                    ? "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                                    : payment.status === "Pendiente"
                                      ? "bg-red-500 hover:bg-red-600 text-white border-red-600"
                                      : undefined
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.currency === "UYU" && (
                            <ReactCountryFlag
                              svg
                              countryCode="UY"
                              className="inline-block h-4 w-5"
                              aria-label="Uruguay"
                            />
                          )}
                          {payment.currency === "USD" && (
                            <ReactCountryFlag
                              svg
                              countryCode="US"
                              className="inline-block h-4 w-5"
                              aria-label="Estados Unidos"
                            />
                          )}
                          <span className="text-slate-800 font-semibold">
                            {formatCurrencyValue(payment.amount, payment.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.status === "Pagado" ? (
                          <Badge variant="secondary">
                            {payment.method || "Sin método"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payment.status !== "Pagado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              type="button"
                              onClick={() => openConfirmDialog(payment)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirmar pago
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => openEditDialog(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TablePageTransition>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </PageTransition>
    </DashboardLayout >
  );
}
