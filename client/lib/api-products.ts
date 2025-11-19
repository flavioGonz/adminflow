import { API_BASE_URL } from "@/lib/config";
import { Product } from "@/types/product";

const API_URL = `${API_BASE_URL}/api`;

export async function fetchAllProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to create product");
  }
  return response.json();
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    throw new Error("Failed to update product");
  }
  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete product");
  }
}
