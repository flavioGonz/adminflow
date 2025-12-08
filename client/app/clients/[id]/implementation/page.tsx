"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { PageTransition } from "@/components/ui/page-transition";
import { PatchPanelManager, type PatchPanelManagerHandle } from "@/components/clients/implementation/patch-panel-manager";
import { PageHeader } from "@/components/layout/page-header";
import { ShinyText } from "@/components/ui/shiny-text";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Rocket, User, Users } from "lucide-react";
import { API_URL } from "@/lib/http";

export default function ImplementationPage() {
    const params = useParams();
    const rawId = params?.id;
    const clientId = Array.isArray(rawId) ? rawId[0] : rawId;
    const [clientName, setClientName] = useState<string | null>(null);

    useEffect(() => {
        if (!clientId) {
            setClientName(null);
            return;
        }

        const controller = new AbortController();
        const loadClient = async () => {
            try {
                const response = await fetch(`${API_URL}/clients/${clientId}`, { signal: controller.signal });
                if (!response.ok) {
                    setClientName(null);
                    return;
                }
                const data = await response.json();
                setClientName(data?.name ?? null);
            } catch (error) {
                if ((error as any)?.name === "AbortError") return;
                console.error("Error fetching client name:", error);
                setClientName(null);
            }
        };

        loadClient();
        return () => controller.abort();
    }, [clientId]);

    const clientCrumbLabel = clientName ?? "Detalle";
    const managerRef = useRef<PatchPanelManagerHandle | null>(null);
    const breadcrumbActions = (
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => managerRef.current?.resetPanel()}>
                Vaciar panel
            </Button>
            <Button
                variant="default"
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => managerRef.current?.exportPdf()}
            >
                <FileText className="mr-1 h-4 w-4" />
                PDF
            </Button>
            <Button
                variant="default"
                size="sm"
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => managerRef.current?.exportExcel()}
            >
                <FileSpreadsheet className="mr-1 h-4 w-4" />
                Excel
            </Button>
        </div>
    );

    if (!clientId) {
        return <div>Error: Client ID is missing.</div>;
    }

    return (
        <PageTransition>
            <div className="space-y-6">
                <PageHeader
                    title={<ShinyText size="3xl" weight="bold">Implementación</ShinyText>}
                    subtitle="Gestión de patch panels y cableado estructurado."
                    backHref={`/clients/${clientId}`}
                    leadingIcon={
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                            <Rocket className="h-6 w-6 text-white" />
                        </div>
                    }
                    breadcrumbs={[
                        { label: "Clientes", href: "/clients", icon: <Users className="h-3 w-3 text-slate-500" /> },
                        {
                            label: clientCrumbLabel,
                            href: `/clients/${clientId}`,
                            icon: <User className="h-3 w-3 text-slate-500" />,
                        },
                        { label: "Implementación", icon: <Rocket className="h-3 w-3 text-slate-500" /> },
                    ]}
                    breadcrumbAction={breadcrumbActions}
                />

                <PatchPanelManager ref={managerRef} clientId={clientId} />
            </div>
        </PageTransition>
    );
}
