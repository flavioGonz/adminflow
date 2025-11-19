import { API_BASE_URL } from "@/lib/config";

const API_URL = `${API_BASE_URL}/api`;

export type RepositoryCategory = "Foto" | "Documento" | "Backup" | "Credencial" | "Otro";

export interface RepositoryEntryPayload {
  name: string;
  type: string;
  category: RepositoryCategory;
  format: string;
  credential: string;
  notes: string;
  content: string;
  fileName: string;
}

export interface RepositoryEntry extends RepositoryEntryPayload {
  id: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json();
}

export async function fetchRepositoryEntries(clientId: string): Promise<RepositoryEntry[]> {
  const response = await fetch(`${API_URL}/clients/${clientId}/repository`);
  return parseResponse<RepositoryEntry[]>(response);
}

export async function createRepositoryEntry(
  clientId: string,
  payload: RepositoryEntryPayload
): Promise<RepositoryEntry> {
  const response = await fetch(`${API_URL}/clients/${clientId}/repository`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<RepositoryEntry>(response);
}

export async function updateRepositoryEntry(
  entryId: string,
  payload: RepositoryEntryPayload
): Promise<RepositoryEntry> {
  const response = await fetch(`${API_URL}/repository/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<RepositoryEntry>(response);
}

export async function deleteRepositoryEntry(entryId: string): Promise<void> {
  const response = await fetch(`${API_URL}/repository/${entryId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to delete repository entry");
  }
}
