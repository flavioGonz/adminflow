import { apiFetch } from "@/lib/http";
import { Group } from "@/types/group";

export interface GroupPayload {
  name: string;
  slug?: string;
  description?: string;
}

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.detail || "Error en la operación con grupos";
    throw new Error(message);
  }
  return data;
};

export const listGroups = async (): Promise<Group[]> => {
  const response = await apiFetch("/groups");
  return handleResponse(response);
};

export const createGroup = async (payload: GroupPayload): Promise<Group> => {
  const response = await apiFetch("/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const updateGroup = async (id: string, payload: GroupPayload): Promise<Group> => {
  const response = await apiFetch(`/groups/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};

export const deleteGroup = async (id: string): Promise<void> => {
  const response = await apiFetch(`/groups/${id}`, {
    method: "DELETE",
  });
  await handleResponse(response);
};
