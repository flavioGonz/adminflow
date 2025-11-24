export interface Budget {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
  sections?: import("./budget-section").BudgetSection[];
}
