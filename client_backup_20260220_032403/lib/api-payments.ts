import { API_BASE_URL } from "@/lib/config";
import { Payment } from "@/types/payment";

const API_URL = `${API_BASE_URL}/api`;

export async function fetchAllPayments(): Promise<Payment[]> {
  const response = await fetch(`${API_URL}/payments`);
  if (!response.ok) {
    throw new Error("Failed to fetch payments");
  }
  return response.json();
}

async function parseError(response: Response) {
  const text = await response.text();
  return text || response.statusText || "Error desconocido";
}

export async function createPayment(payment: Partial<Payment>): Promise<Payment> {
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function deletePayment(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
