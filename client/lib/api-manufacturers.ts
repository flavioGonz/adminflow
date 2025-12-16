import { API_BASE_URL } from "@/lib/config";

const API_URL = `${API_BASE_URL}/api`;

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const raw = await response.text();
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      // ignore JSON parse failures
    }
    return raw;
  } catch {
    return fallback;
  }
}

export interface ManufacturerEntry {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

type ManufacturerPayload = {
  name: string;
  logoUrl?: string;
};

export async function fetchManufacturers(): Promise<ManufacturerEntry[]> {
  const response = await fetch(`${API_URL}/manufacturers`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo cargar los fabricantes"));
  }
  return response.json();
}

export async function createManufacturer(data: ManufacturerPayload): Promise<ManufacturerEntry> {
  const response = await fetch(`${API_URL}/manufacturers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo crear el fabricante"));
  }
  return response.json();
}

export async function updateManufacturer(id: string, data: ManufacturerPayload): Promise<ManufacturerEntry> {
  const response = await fetch(`${API_URL}/manufacturers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo actualizar el fabricante"));
  }
  return response.json();
}

export async function deleteManufacturer(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/manufacturers/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo eliminar el fabricante"));
  }
}
