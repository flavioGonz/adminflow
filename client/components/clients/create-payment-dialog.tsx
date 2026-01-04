"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    CreditCard,
    DollarSign,
    FileText,
    Hash,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock3,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { createPayment } from "@/lib/api-payments";
import { PaymentStatus, Currency, Payment } from "@/types/payment";
import { Ticket } from "@/types/ticket";
import ReactCountryFlag from "react-country-flag";

interface CreatePaymentDialogProps {
    clientId: string;
    clientName: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onPaymentCreated: (payment: Payment) => void;
}

export function CreatePaymentDialog({
    clientId,
    clientName,
    isOpen,
    onOpenChange,
    onPaymentCreated,
}: CreatePaymentDialogProps) {
    const [amount, setAmount] = useState<number>(0);
    const [currency, setCurrency] = useState<Currency>("UYU");
    const [concept, setConcept] = useState("");
    const [status, setStatus] = useState<PaymentStatus>("Pendiente");
    const [invoice, setInvoice] = useState("");
    const [invoiceEnabled, setInvoiceEnabled] = useState(false);
    const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetch(`${API_URL}/clients/${clientId}/tickets`)
                .then(res => res.json())
                .then(data => setTickets(data))
                .catch(err => console.error("Error fetching tickets:", err));
        }
    }, [isOpen, clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: Partial<Payment> = {
                clientId,
                client: clientName,
                amount,
                currency,
                concept: concept || "Pago manual",
                status,
                invoice: invoiceEnabled ? invoice : undefined,
                invoiceEnabled,
                createdAt: new Date(date).toISOString(),
                method: "Transferencia", // Default or add field
            };

            const created = await createPayment(payload);
            onPaymentCreated(created);
            toast.success("Pago registrado exitosamente");
            onOpenChange(false);
            // Reset
            setAmount(0);
            setConcept("");
        } catch (error) {
            console.error("Error creating payment:", error);
            toast.error("No se pudo registrar el pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        Registrar Pago para {clientName}
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del pago recibido o pendiente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                                <DollarSign className="h-3 w-3" />
                                Monto
                            </Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                                Moneda
                            </Label>
                            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UYU">
                                        <div className="flex items-center gap-2">
                                            <ReactCountryFlag svg countryCode="UY" className="h-4 w-5" />
                                            UYU
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="USD">
                                        <div className="flex items-center gap-2">
                                            <ReactCountryFlag svg countryCode="US" className="h-4 w-5" />
                                            USD
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                            <FileText className="h-3 w-3" />
                            Concepto
                        </Label>
                        <Input
                            value={concept}
                            onChange={(e) => setConcept(e.target.value)}
                            placeholder="Ej: Mensualidad Enero 2025"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                                <CalendarIcon className="h-3 w-3" />
                                Fecha
                            </Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                                <ShieldCheck className="h-3 w-3" />
                                Estado
                            </Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                    <SelectItem value="A confirmar">A confirmar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-[10px]">
                                <Hash className="h-3 w-3" />
                                Facturación
                            </Label>
                            <Switch checked={invoiceEnabled} onCheckedChange={setInvoiceEnabled} />
                        </div>
                        {invoiceEnabled && (
                            <Input
                                placeholder="Número de factura"
                                value={invoice}
                                onChange={(e) => setInvoice(e.target.value)}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                            {loading ? "Registrando..." : "Registrar Pago"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
