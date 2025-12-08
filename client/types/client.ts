export interface Client {
  id: string;
  name: string;
  alias?: string;
  rut?: string;
  email: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contract?: boolean;
  notificationsEnabled?: boolean;
  avatarUrl?: string;
  hasDiagram?: boolean;
  hasAccess?: boolean;
  hasFiles?: boolean;
  hasImplementation?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

