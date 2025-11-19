import { API_BASE_URL } from "@/lib/config";
import { Budget } from "@/types/budget";
import { BudgetItem } from "@/types/budget-item";

const API_URL = `${API_BASE_URL}/api`;

export async function fetchAllBudgets(): Promise<Budget[]> {
  const response = await fetch(`${API_URL}/budgets`);
  if (!response.ok) {
    throw new Error("Failed to fetch budgets");
  }
  return response.json();
}

export async function fetchBudgetById(id: string): Promise<Budget> {
  const response = await fetch(`${API_URL}/budgets/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch budget");
  }
  return response.json();
}

export async function createBudget(budgetData: Partial<Budget>): Promise<Budget> {
  const response = await fetch(`${API_URL}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) {
    throw new Error("Failed to create budget");
  }
  return response.json();
}

export async function updateBudget(
  id: string,
  budgetData: Partial<Budget>
): Promise<Budget> {
  const response = await fetch(`${API_URL}/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });
  if (!response.ok) {
    throw new Error("Failed to update budget");
  }
  return response.json();
}

export async function deleteBudget(id: string): Promise<void> {
  const budgetId = id?.toString().trim();
  if (!budgetId) {
    throw new Error("El identificador del presupuesto no es válido.");
  }

  const response = await fetch(`${API_URL}/budgets/${encodeURIComponent(budgetId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to delete budget (status ${response.status})`);
  }
}

// Budget Items
export async function fetchBudgetItems(budgetId: string): Promise<BudgetItem[]> {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/items`);
  if (!response.ok) {
    throw new Error("Failed to fetch budget items");
  }
  return response.json();
}

export async function createBudgetItem(
  budgetId: string,
  itemData: Partial<BudgetItem>
): Promise<BudgetItem> {
  const response = await fetch(`${API_URL}/budgets/${budgetId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) {
    throw new Error("Failed to create budget item");
  }
  return response.json();
}

export async function updateBudgetItem(
  itemId: string,
  itemData: Partial<BudgetItem>
): Promise<BudgetItem> {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) {
    throw new Error("Failed to update budget item");
  }
  return response.json();
}

export async function deleteBudgetItem(itemId: string): Promise<void> {
  const response = await fetch(`${API_URL}/items/${itemId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete budget item");
  }
}

export async function uploadBudgetCover(budgetId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("cover", file);
  const response = await fetch(`${API_URL}/budgets/${budgetId}/cover`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to upload cover");
  }
  return response.json();
}

export async function shareBudgetPdf(budgetId: string, pdfBlob: Blob): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", pdfBlob, `${budgetId}.pdf`);
  const response = await fetch(`${API_URL}/budgets/${budgetId}/share`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to share budget PDF");
  }
  return response.json();
}
