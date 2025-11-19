export interface BudgetItem {
  id: string;
  budgetId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productId?: string;
  productName?: string;
}
