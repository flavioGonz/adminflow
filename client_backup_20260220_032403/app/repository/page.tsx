"use client";

import { useEffect, useState, Suspense } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { FolderArchive, Home, Loader2 } from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/http";
import ClientFileVault from "@/components/repository/client-file-vault";
import { Client } from "@/types/client";
import { useSearchParams } from "next/navigation";

function RepositoryContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const initialClientId = searchParams?.get("clientId");

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`);
        if (!response.ok) throw new Error("No se pudieron cargar los clientes");
        setClients(await response.json());
      } catch (error) {
        console.error("Error al cargar clientes del repositorio", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={<ShinyText size="3xl" weight="bold">Bóveda de Archivos</ShinyText>}
          subtitle="Repositorio centralizado de documentos, imágenes y respaldos de configuración por cliente."
          leadingIcon={
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600">
              <FolderArchive className="h-6 w-6 text-white" />
            </div>
          }
          breadcrumbAction={
            <div className="flex items-center gap-2">
              <Badge variant="secondary">File Manager v2.1</Badge>
            </div>
          }
        />
        
        <div className="overflow-hidden">
            <ClientFileVault 
              clients={clients} 
              isLoadingClients={isLoading} 
              initialClientId={initialClientId || undefined}
            />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function RepositoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />Cargando bóveda...</div>}>
      <RepositoryContent />
    </Suspense>
  );
}
