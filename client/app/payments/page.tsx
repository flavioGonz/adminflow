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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  CalendarCheck,
  CheckCircle,
  Clock3,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Hash,
  MessageCircle,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
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

const formatCurrencyValue = (value: number, currency: Currency = "UYU") =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const statusVariant: Record<PaymentStatus, "default" | "secondary" | "destructive"> =
{
  Pendiente: "destructive",
  "A confirmar": "secondary",
  Pagado: "default",
};

const statusOrder: PaymentStatus[] = ["Pendiente", "A confirmar", "Pagado"];

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
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Hash className="h-4 w-4 text-muted-foreground" />
              Factura
            </label>
            <Input
              value={formState.invoice}
              onChange={(event) =>
                onFormChange({ ...formState, invoice: event.target.value })
              }
              placeholder="FAC-T123"
            />
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
                <SelectItem value="UYU">Pesos uruguayos (UYU)</SelectItem>
                <SelectItem value="USD">Dólares (USD)</SelectItem>
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
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Ticket asociado
              </label>
              <Input
                list={ticketDatalistId}
                value={ticketQuery}
                onChange={(event) => handleTicketSearch(event.target.value)}
                placeholder="Busca un ticket facturable"
                className="mb-2"
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
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="A confirmar">A confirmar</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
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
    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "todos" || payment.status === statusFilter;
      const matchesSearch =
        payment.invoice.toLowerCase().includes(term) ||
        payment.client.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

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
      createdAt: editingPayment?.createdAt ?? new Date().toISOString(),
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

  const statusList = (
    <div className="flex flex-wrap gap-2">
      {statusOrder.map((status) => (
        <Badge key={status} variant={statusVariant[status]}>
          {status}
        </Badge>
      ))}
    </div>
  );



  return (
    <DashboardLayout>
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
            {statusList}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="relative min-w-[260px]">
            <Input
              placeholder="Filtrar por factura o cliente..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "todos" | PaymentStatus) =>
              setStatusFilter(value)
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="A confirmar">A confirmar</SelectItem>
              <SelectItem value="Pagado">Pagado</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    Fecha
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Factura
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cliente
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ticket
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Concepto
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Estado
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monto
                  </div>
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
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-6 text-center">
                    No existen pagos para el criterio actual.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
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
                            ? "bg-emerald-500 text-white"
                            : undefined
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800">
                          {formatCurrencyValue(payment.amount, payment.currency)}
                        </span>
                        <Badge variant="outline" className="text-xs text-slate-600">
                          {payment.currency}
                        </Badge>
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
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
