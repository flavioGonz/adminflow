export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sla?: string;
  contractType?: string;
  amount?: number;
  currency?: string;
  filePath?: string;
  createdAt?: string;
  updatedAt?: string;
}
