import { Contract } from "@/types/contract";
import { API_URL } from "@/lib/config";

export const fetchAllContracts = async (): Promise<Contract[]> => {
  const response = await fetch(`${API_URL}/contracts`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const createContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract> => {
  const response = await fetch(`${API_URL}/contracts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contractData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const updateContract = async (contractId: string, contractData: Partial<Contract>): Promise<Contract> => {
  const response = await fetch(`${API_URL}/contracts/${contractId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contractData),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const deleteContract = async (contractId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/contracts/${contractId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const importContracts = async (contractsToImport: Contract[]): Promise<any> => {
  const response = await fetch(`${API_URL}/contracts/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contractsToImport),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const uploadContractFile = async (contractId: string, file: File): Promise<Contract> => {
  const formData = new FormData();
  formData.append('contractFile', file);

  const response = await fetch(`${API_URL}/contracts/${contractId}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};
