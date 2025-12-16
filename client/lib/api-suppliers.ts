import { API_BASE_URL } from "@/lib/config";

const API_URL = `${API_BASE_URL}/api`;

export interface SupplierCatalogEntry {
  id: string;
  name: string;
  priceUYU: number;
  priceUSD: number;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchSupplierCatalog(): Promise<SupplierCatalogEntry[]> {
  const response = await fetch(`${API_URL}/suppliers-catalog`);
  if (!response.ok) {
    throw new Error("No se pudo cargar el catálogo de proveedores");
  }
  return response.json();
}

export async function createSupplierCatalogEntry(
  data: Omit<SupplierCatalogEntry, "id" | "createdAt" | "updatedAt">
): Promise<SupplierCatalogEntry> {
  const response = await fetch(`${API_URL}/suppliers-catalog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "No se pudo crear el proveedor");
  }
  return response.json();
}

export async function updateSupplierCatalogEntry(
  id: string,
  data: Omit<SupplierCatalogEntry, "id" | "createdAt" | "updatedAt">
): Promise<SupplierCatalogEntry> {
  const response = await fetch(`${API_URL}/suppliers-catalog/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "No se pudo actualizar el proveedor");
  }
  return response.json();
}

export async function deleteSupplierCatalogEntry(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/suppliers-catalog/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "No se pudo eliminar el proveedor");
  }
}
