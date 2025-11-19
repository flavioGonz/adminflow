"use client";

import { useState, useEffect, useCallback } from "react";
import { ClientTable } from "@/components/clients/client-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ImportClientsDialog } from "@/components/clients/import-clients-dialog"; // Import the ImportClientsDialog
import { API_URL } from "@/lib/http";

interface Client {
  id: string;
  name: string;
  alias?: string;
  rut?: string;
  email: string;
  phone?: string;
  address?: string;
  contract?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/clients`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients.");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientCreated = () => {
    fetchClients();
  };

  const handleClientUpdated = () => {
    fetchClients();
  };

  const handleClientDeleted = () => {
    fetchClients();
  };

  const handleImportComplete = () => {
    console.log("Importación de clientes completada. Refrescando lista...");
    fetchClients();
  };

  if (loading) {
    return <div className="p-6">Cargando clientes...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Clientes</h1>
      </div>
      <ClientTable
        clients={clients}
        onClientCreated={handleClientCreated}
        onClientUpdated={handleClientUpdated}
        onClientDeleted={handleClientDeleted}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
