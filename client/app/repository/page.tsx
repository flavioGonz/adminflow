"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { ShinyText } from "@/components/ui/shiny-text";
import { FolderArchive, Home, HardDrive, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/http";
import { Client } from "@/types/client";
import ClientFileVault from "@/components/repository/client-file-vault";

export default function RepositoryPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/clients`)
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
      })
      .catch((err) => console.error("Error loading clients:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        <PageHeader
          title={<ShinyText size="3xl" weight="bold">Bóveda de Archivos</ShinyText>}
          subtitle="Gestión centralizada de documentos y respaldos."
          leadingIcon={
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
              <FolderArchive className="h-6 w-6 text-white" />
            </div>
          }
          breadcrumbs={[
            { label: "Inicio", href: "/dashboard", icon: <Home className="h-3 w-3 text-slate-500" /> },
            { label: "Repositorio", icon: <FolderArchive className="h-3 w-3 text-slate-500" /> },
          ]}

        />

        <div className="flex-1 min-h-[600px] relative">
          <ClientFileVault clients={clients} isLoadingClients={loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
