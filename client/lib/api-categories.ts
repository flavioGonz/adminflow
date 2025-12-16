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

export interface CategoryEntry {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

type CategoryPayload = {
  name: string;
};

export async function fetchCategories(): Promise<CategoryEntry[]> {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo cargar las categorías"));
  }
  return response.json();
}

export async function createCategory(data: CategoryPayload): Promise<CategoryEntry> {
  const response = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo crear la categoría"));
  }
  return response.json();
}

export async function updateCategory(id: string, data: CategoryPayload): Promise<CategoryEntry> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo actualizar la categoría"));
  }
  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "No se pudo eliminar la categoría"));
  }
}
