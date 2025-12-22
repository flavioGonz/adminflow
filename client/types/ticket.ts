export type TicketStatus =
  | "Nuevo"
  | "Abierto"
  | "En proceso"
  | "En proceso de soporte"
  | "Visita"
  | "Visita - Coordinar"
  | "Visita Programada"
  | "Visita Realizada"
  | "Revision Cerrar Visita"
  | "Pendiente de Coordinación"
  | "Pendiente de Cliente"
  | "Pendiente de Tercero"
  | "Pendiente de Facturación"
  | "Pendiente de Pago"
  | "Cerrado"
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
    avatar?: string | null;
  }[];
  hasActiveContract?: boolean;
  description?: string;
  amountCurrency?: "UYU" | "USD";
  contractTitle?: string;
  contractSla?: string;
  attachments?: TicketAttachment[];
  audioNotes?: TicketAudioNote[];
  paid?: boolean;
  assignedTo?: string | null;
  assignedGroupId?: string | null;
  updatedAt?: string;
}
