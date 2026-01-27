"use client";

import { useState, useEffect, useCallback } from "react";
import { ClientTable } from "@/components/clients/client-table";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { ImportClientsDialog } from "@/components/clients/import-clients-dialog";
import { API_URL } from "@/lib/http";
import { ShinyText } from "@/components/ui/shiny-text";
import { PageTransition } from "@/components/ui/page-transition";
import { Users } from "lucide-react";
import { Client } from "@/types/client";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setError(null);
    try {
      const clientsResponse = await fetch(`${API_URL}/clients`);
      if (!clientsResponse.ok) {
        throw new Error(`HTTP error! status: ${clientsResponse.status}`);
      }
      const clientsData: Client[] = await clientsResponse.json();

      let implementationIds: string[] = [];
      try {
        const indicatorRes = await fetch(`${API_URL}/clients/implementation-indicators`);
        if (indicatorRes.ok) {
          implementationIds = await indicatorRes.json();
        } else {
          console.warn("No se pudieron cargar los indicadores de implementación:", indicatorRes.statusText);
        }
      } catch (indicatorError) {
        console.error("Error fetching implementation indicators:", indicatorError);
      }

      const indicatorSet = new Set(implementationIds.map((id) => String(id)));
      const enrichedClients = clientsData.map((client) => ({
        ...client,
        hasImplementation:
          indicatorSet.has(String(client.id)) || Boolean(client.hasImplementation),
      }));

      setClients(enrichedClients);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients.");
      console.error("Error fetching clients:", err);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleClientCreated = () => {
    loadClients();
  };

  const handleClientUpdated = () => {
    loadClients();
  };

  const handleClientDeleted = () => {
    loadClients();
  };

  const handleImportComplete = () => {
    console.log("Importación de clientes completada. Refrescando lista...");
    loadClients();
  };

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <PageTransition>
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
    </PageTransition>
  );
}
