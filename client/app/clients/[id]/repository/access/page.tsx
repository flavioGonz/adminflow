"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, ShieldCheck, Users, User, KeyRound, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { AccessTable, exportAccessToExcel } from "@/components/repository/access/access-table";
import { CreateAccessDialog } from "@/components/repository/access/create-access-dialog";
import { getClientAccesses, AccessItem } from "@/lib/api-access";
import { fetchClientById } from "@/lib/api-clients";
import { Client } from "@/types/client";

export default function ClientAccessPage() {
  const params = useParams();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [accesses, setAccesses] = useState<AccessItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchAccesses = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const data = await getClientAccesses(clientId);
      setAccesses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const data = await fetchClientById(clientId);
      setClient(data);
    } catch (error) {
      console.error(error);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAccesses();
    fetchClient();
  }, [fetchAccesses, fetchClient]);

  if (!clientId) return null;

  const clientLabel = client?.alias || client?.name || `Cliente ${clientId}`;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Accesos y Credenciales"
        subtitle="Gestión de dispositivos, IPs, contraseñas y serie/MAC del cliente."
        backHref={`/clients/${clientId}`}
        breadcrumbs={[
          { label: "Clientes", href: "/clients", icon: <Users className="h-3 w-3 text-slate-500" /> },
          { label: clientLabel, href: `/clients/${clientId}`, icon: <User className="h-3 w-3 text-slate-500" /> },
          { label: "Accesos", icon: <KeyRound className="h-3 w-3 text-slate-500" /> },
        ]}
        leadingIcon={<ShieldCheck className="h-6 w-6 text-blue-600" />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando accesos...</p>
        </div>
      ) : (
        <AccessTable
          data={accesses}
          onUpdate={fetchAccesses}
          showExportButton={false}
          onCreateNew={() => setIsCreateOpen(true)}
          onExport={() => exportAccessToExcel(accesses)}
        />
      )}

      <CreateAccessDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        clientId={clientId}
        onSuccess={fetchAccesses}
      />
    </div>
  );
}
