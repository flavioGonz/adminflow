"use client";

import { useState, useEffect, useCallback } from "react";
import { ClientTable } from "@/components/clients/client-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ImportClientsDialog } from "@/components/clients/import-clients-dialog";
import { API_URL } from "@/lib/http";
import { ShinyText } from "@/components/ui/shiny-text";
import { Users } from "lucide-react";

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <ShinyText size="3xl" weight="bold">Clientes</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
        </div>
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
