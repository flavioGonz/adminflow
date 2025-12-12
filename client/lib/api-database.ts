import { API_URL } from "@/lib/http";

export type DbEngine = "sqlite" | "mongodb";

interface ApiResponse {
  success: boolean;
  message: string;
  detail?: string;
  summary?: Record<string, unknown>;
}

const parseResponse = async <T extends ApiResponse = ApiResponse>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "An unknown error occurred");
  }
  return payload;
};

export const getDatabaseConfig = async (): Promise<Record<string, unknown>> => {
  const response = await fetch(`${API_URL}/system/database`);
  if (!response.ok) {
    throw new Error("No se pudo obtener la configuracion de base.");
  }
  return response.json<Record<string, unknown>>();
};

export const updateDatabaseConfig = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}/system/database`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const selectDatabaseEngine = async (engine: DbEngine): Promise<ApiResponse> => {
  const response = await fetch(`${API_URL}/db/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ engine }),
  });
  return parseResponse(response);
};

export const syncDatabase = async (engine: DbEngine): Promise<ApiResponse> => {
  const response = await fetch(`${API_URL}/db/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ engine }),
  });
  return parseResponse(response);
};

export const resetDatabase = async (engine: DbEngine): Promise<ApiResponse> => {
  const response = await fetch(`${API_URL}/db/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ engine }),
  });
  return parseResponse(response);
};

export const migrateToMongo = async (): Promise<ApiResponse> => {
  const response = await fetch(`${API_URL}/db/migrate-to-mongo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return parseResponse(response);
};

export const verifyDatabaseConnection = async (payload: {
  engine: DbEngine;
  mongoUri?: string;
  mongoDb?: string;
  sqlitePath?: string;
}) => {
  const response = await fetch(`${API_URL}/system/database/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const getDatabaseOverview = async (): Promise<Record<string, unknown>> => {
  const response = await fetch(`${API_URL}/system/database/overview`);
  if (!response.ok) {
    throw new Error("No se pudo obtener el resumen de bases de datos.");
  }
  return response.json<Record<string, unknown>>();
};
