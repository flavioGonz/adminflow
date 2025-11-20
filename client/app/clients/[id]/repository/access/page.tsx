"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessTable } from "@/components/repository/access/access-table";
import { CreateAccessDialog } from "@/components/repository/access/create-access-dialog";
import { getClientAccesses, AccessItem } from "@/lib/api-access";

export default function ClientAccessPage() {
    const params = useParams();
    const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const [accesses, setAccesses] = useState<AccessItem[]>([]);
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

    useEffect(() => {
        fetchAccesses();
    }, [fetchAccesses]);

    if (!clientId) return null;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/clients/${clientId}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Volver al Cliente
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                            Accesos y Credenciales
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Gestión de dispositivos, IPs y contraseñas del cliente.
                        </p>
                    </div>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Acceso
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Cargando accesos...</p>
                </div>
            ) : (
                <AccessTable data={accesses} onUpdate={fetchAccesses} />
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
