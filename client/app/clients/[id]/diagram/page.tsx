"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Users, User, Network } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { PageHeader } from "@/components/layout/page-header";
import { ShinyText } from "@/components/ui/shiny-text";

// Import Excalidraw styles
import "@excalidraw/excalidraw/index.css";

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
    () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
    { ssr: false }
);

export default function ClientDiagramPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clientName, setClientName] = useState<string>("");

    useEffect(() => {
        const fetchClientAndDiagram = async () => {
            try {
                // Fetch Client Name
                const clientRes = await fetch(`${API_URL}/clients/${id}`);
                if (clientRes.ok) {
                    const clientData = await clientRes.json();
                    setClientName(clientData.name);
                }

                // Fetch Diagram
                const res = await fetch(`${API_URL}/clients/${id}/diagram`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        // Sanitize appState to avoid "collaborators.forEach is not a function" error
                        const { collaborators, ...restAppState } = data.appState || {};

                        setInitialData({
                            elements: data.elements,
                            appState: {
                                ...restAppState,
                                collaborators: []
                            },
                            files: data.files
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchClientAndDiagram();
        }
    }, [id]);

    const handleSave = async () => {
        if (!excalidrawAPI) return;

        setSaving(true);
        try {
            const elements = excalidrawAPI.getSceneElements();
            const appState = excalidrawAPI.getAppState();
            const files = excalidrawAPI.getFiles();

            const res = await fetch(`${API_URL}/clients/${id}/diagram`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    elements,
                    appState,
                    files,
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Diagrama guardado correctamente");
        } catch (error) {
            console.error("Error saving diagram:", error);
            toast.error("Error al guardar el diagrama");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium">Cargando diagrama...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-2">
                <PageHeader
                    title={<ShinyText size="xl" weight="bold">Diagrama de Red</ShinyText>}
                    subtitle={`Diseño de red para ${clientName}`}
                    backHref={`/clients/${id}`}
                    leadingIcon={
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Network className="h-5 w-5 text-white" />
                        </div>
                    }
                    breadcrumbs={[
                        { label: "Clientes", href: "/clients", icon: <Users className="h-3 w-3 text-slate-500" /> },
                        { label: clientName, href: `/clients/${id}`, icon: <User className="h-3 w-3 text-slate-500" /> },
                        { label: "Diagrama", icon: <Network className="h-3 w-3 text-slate-500" /> },
                    ]}
                    actions={
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar Cambios
                        </Button>
                    }
                />
            </div>

            <main className="flex-1 w-full h-full relative overflow-hidden">
                <div className="absolute inset-0">
                    <Excalidraw
                        key={id} // Force re-render on client ID change to avoid session leaks
                        initialData={initialData}
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        langCode="es-ES"
                        UIOptions={{
                            canvasActions: {
                                saveToActiveFile: false,
                                loadScene: true,
                                export: { saveFileToDisk: true },
                            },
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
