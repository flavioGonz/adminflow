import { Client } from "@/types/client";
import { API_URL } from "@/lib/http";

export const fetchAllClients = async (): Promise<Client[]> => {
  const response = await fetch(`${API_URL}/clients`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const fetchClientById = async (clientId: string): Promise<Client> => {
  const response = await fetch(`${API_URL}/clients/${clientId}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
  const response = await fetch(`${API_URL}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client> => {
  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const deleteClient = async (clientId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/clients/${clientId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const importClients = async (clientsToImport: Client[]): Promise<any> => {
  const response = await fetch(`${API_URL}/clients/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(clientsToImport),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
