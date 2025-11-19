import { apiFetch } from "./http";

export interface SystemUser {
  _id?: string;
  sqliteId?: number;
  email: string;
  roles?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationChannelConfig {
  enabled: boolean;
  apiKey: string;
  webhook: string;
  smtpUser?: string;
  smtpPass?: string;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
}

export interface NotificationConfig {
  channels: Record<string, NotificationChannelConfig>;
  templates: Record<string, NotificationTemplate>;
}

export interface NotificationLog {
  _id?: string;
  event: string;
  results: any[];
  createdAt: string;
}

const apiCall = async (url: string, options?: RequestInit) => {
  const response = await apiFetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const SystemApi = {
  // Usuarios
  getUsers: async (): Promise<SystemUser[]> => {
    return apiCall("/users/registered");
  },

  createUser: async (email: string, password: string): Promise<any> => {
    // El endpoint /register no está bajo /api, así que usamos apiFetch directamente con la URL completa
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  updateUser: async (id: string, data: Partial<SystemUser>): Promise<SystemUser> => {
    return apiCall(`/users/registered/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  resetUserPassword: async (email: string, newPassword: string): Promise<any> => {
    // Primero obtenemos el usuario para obtener su ID
    const users = await apiCall("/users/registered");
    const user = users.find((u: SystemUser) => u.email === email);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Actualizamos con la nueva contraseña en metadata
    return apiCall(`/users/registered/${user._id || user.sqliteId}`, {
      method: "PATCH",
      body: JSON.stringify({
        metadata: {
          ...(user.metadata || {}),
          passwordResetAt: new Date().toISOString(),
          passwordResetRequested: true,
        },
      }),
    });
  },

  // Configuración de Notificaciones
  getNotificationConfig: async (): Promise<NotificationConfig> => {
    const response = await apiCall("/config/notifications");
    // Retornar data o estructura default si está vacío
    return response.data || { channels: {}, templates: {} };
  },

  saveNotificationConfig: async (config: NotificationConfig): Promise<any> => {
    return apiCall("/config/notifications", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },

  // Historial y Pruebas
  getNotificationHistory: async (limit = 20): Promise<NotificationLog[]> => {
    return apiCall(`/notifications/history?limit=${limit}`);
  },

  sendTestNotification: async (channel: string, message: string, recipients?: string[]) => {
    return apiCall("/notifications/send", {
      method: "POST",
      body: JSON.stringify({
        event: "test_event",
        message,
        channels: [channel],
        recipients: recipients || [],
      }),
    });
  },

  verifySmtpConnection: async (host: string, port: string, user: string, pass: string) => {
    const response = await apiFetch("/notifications/verify-smtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        host,
        port,
        user,
        pass,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Lanzar error con el mensaje detallado del servidor
      throw new Error(data.detail || data.message || "Error al verificar SMTP");
    }

    return data;
  },

  getAuditLogs: async (limit = 50, type?: string, status?: string, search?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (type && type !== "all") params.append("type", type);
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    return apiCall(`/system/audit?${params.toString()}`);
  },
};
