export type TicketStatus =
  | "Nuevo"
  | "Abierto"
  | "En proceso"
  | "Visita"
  | "Resuelto"
  | "Facturar"
  | "Pagado";

export type TicketPriority = "Alta" | "Media" | "Baja";

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  url?: string;
}

export interface TicketAudioNote {
  id: string;
  name?: string;
  size?: number;
  type?: string;
  createdAt?: string;
  dataUrl?: string;
  url?: string;
  durationSeconds?: number;
}

export interface Ticket {
  id: string;
  title: string;
  clientName: string;
  clientId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  amount?: number;
  visit?: boolean;
  annotations?: {
    text: string;
    createdAt: string;
    user?: string;
    attachments?: TicketAttachment[];
    audioNotes?: TicketAudioNote[];
  }[];
  hasActiveContract?: boolean;
  description?: string;
  amountCurrency?: "UYU" | "USD";
  contractTitle?: string;
  contractSla?: string;
  attachments?: TicketAttachment[];
  audioNotes?: TicketAudioNote[];
  paid?: boolean;
}
