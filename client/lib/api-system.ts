import { apiFetch } from "./http";

export interface SystemUser {
  _id?: string;
  sqliteId?: number;
  email: string;
  name?: string;
  avatar?: string;
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

export const getRegisteredUsers = async (): Promise<SystemUser[]> => {
  return apiCall("/users/registered");
};

export const updateUser = async (id: string, data: Partial<SystemUser>): Promise<SystemUser> => {
  return apiCall(`/users/registered/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const createUser = async (email: string, password: string): Promise<SystemUser> => {
  return apiCall("/users/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const uploadUserAvatar = async (userId: string, file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiFetch(`/users/${userId}/avatar`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error al subir avatar: ${response.statusText}`);
  }

  return response.json();
};

export const resetUserPassword = async (userId: string, newPassword: string): Promise<any> => {
  return apiCall(`/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ newPassword }),
  });
};

export const deleteUser = async (userId: string): Promise<any> => {
  return apiCall(`/users/${userId}`, {
    method: "DELETE",
  });
};

// Configuración de Notificaciones
export const getNotificationConfig = async (): Promise<NotificationConfig> => {
  const response = await apiCall("/config/notifications");
  // Retornar data o estructura default si está vacío
  return response.data || { channels: {}, templates: {} };
};

export const saveNotificationConfig = async (config: NotificationConfig): Promise<any> => {
  return apiCall("/config/notifications", {
    method: "POST",
    body: JSON.stringify(config),
  });
};

// Historial y Pruebas
export const getNotificationHistory = async (limit = 20): Promise<NotificationLog[]> => {
  return apiCall(`/notifications/history?limit=${limit}`);
};

export const sendTestNotification = async (channel: string, message: string, recipients?: string[]) => {
  return apiCall("/notifications/send", {
    method: "POST",
    body: JSON.stringify({
      event: "test_event",
      message,
      channels: [channel],
      recipients: recipients || [],
    }),
  });
};

export const verifySmtpConnection = async (host: string, port: string, user: string, pass: string) => {
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
};

export const getAuditLogs = async (limit = 50, type?: string, status?: string, search?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (type && type !== "all") params.append("type", type);
  if (status && status !== "all") params.append("status", status);
  if (search) params.append("search", search);
  return apiCall(`/system/audit?${params.toString()}`);
};

export interface Backup {
  name: string;
  createdAt: string;
  size: number;
}

export const getBackups = async (): Promise<Backup[]> => {
  return apiCall("/system/backups");
};

export const createBackup = async (): Promise<{ success: boolean; backupName: string; path: string; timestamp: string }> => {
  return apiCall("/system/backups", {
    method: "POST",
  });
};

export const restoreBackup = async (backupName: string): Promise<{ success: boolean; message: string }> => {
  return apiCall("/system/backups/restore", {
    method: "POST",
    body: JSON.stringify({ backupName }),
  });
};
