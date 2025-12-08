export type PaymentStatus = "Pendiente" | "Enviado" | "A confirmar" | "Emitir Factura" | "Pagado";

export type Currency = "UYU" | "USD";

export interface Payment {
  id: string;
  invoice: string;
  ticketId?: string;
  ticketTitle?: string;
  client: string;
  clientId?: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  note?: string;
  concept?: string;
  createdAt: string;
  currency: Currency;
}
