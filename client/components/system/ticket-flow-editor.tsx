"use client";

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    reconnectEdge,
    Panel,
    Handle,
    Position,
    type Connection,
    type Edge,
    type Node,
    type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Save,
    Plus,
    Loader2,
    Circle,
    CheckCircle2,
    Clock,
    MapPin,
    Receipt,
    DollarSign,
    FolderOpen,
    AlertCircle,
    Flag,
    Info,
    AlertTriangle,
    Trash2,
    RotateCcw,
    Hourglass,
    ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/http';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Configuration for visual styles based on status label
const useStatusConfig = (label: string) => {
    const normalized = label?.toLowerCase() || "";
    if (normalized.includes("re abierto") || normalized.includes("reabierto")) return { icon: RotateCcw, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" };
    if (normalized.includes("nuevo")) return { icon: Circle, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" };
    if (normalized.includes("abierto")) return { icon: FolderOpen, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };
    if (normalized.includes("proceso")) return { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" };
    if (normalized.includes("visita")) return { icon: MapPin, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" };
    if (normalized.includes("resuelto")) return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (normalized.includes("cerrado")) return { icon: CheckCircle2, color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200" };
    if (normalized.includes("factura")) return { icon: Receipt, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    if (normalized.includes("pago") || normalized.includes("pagado")) return { icon: DollarSign, color: "text-lime-600", bg: "bg-lime-50", border: "border-lime-200" };
    if (normalized.includes("pendiente") || normalized.includes("esperando")) return { icon: Hourglass, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" };
    if (normalized.includes("evaluacion") || normalized.includes("evaluación")) return { icon: ClipboardList, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-200" };

    return { icon: Flag, color: "text-slate-500", bg: "bg-white", border: "border-slate-200" };
};

// Custom Node Component
// Custom Node Component
const StatusNode = ({ data, selected }: NodeProps) => {
    const label = data.label as string;
    const { icon: Icon, color, bg, border } = useStatusConfig(label);

    const getDescription = (l: string) => {
        const lower = l.toLowerCase();
        if (lower.includes('nuevo')) return "Punto de entrada para tickets recién creados.";
        if (lower.includes('visita')) return "Habilita funcionalidades de gestión de visitas técnicas.";
        if (lower.includes('resuelto')) return "Marca el ticket como solucionado (estado final positivo).";
        if (lower.includes('facturar')) return "Indica que el trabajo está listo para facturación.";
        if (lower.includes('pagado')) return "Estado final administrativo.";
        if (lower.includes('cerrado')) return "Estado final.";
        return "Estado intermedio del flujo de trabajo.";
    };

    // Helper to generate handles for a position
    const renderHandles = (pos: Position, offsetClass: string) => (
        <>
            <Handle
                type="target"
                position={pos}
                id={`target-${pos}`}
                isConnectable={true}
                className={cn(
                    "w-4 h-4 bg-slate-500 !border-4 !border-white z-50 hover:w-5 hover:h-5 transition-all",
                    offsetClass
                )}
            />
            <Handle
                type="source"
                position={pos}
                id={`source-${pos}`}
                isConnectable={true}
                className={cn(
                    "w-4 h-4 bg-slate-500 !border-4 !border-white z-50 hover:w-5 hover:h-5 transition-all opacity-0 hover:opacity-100", // Overlay source handle, normally invisible but interactive
                    offsetClass
                )}
            />
        </>
    );

    return (
        <div className="relative group">
            {/* Render Handles for all 4 sides with bidirectional capability */}
            {renderHandles(Position.Left, "-ml-2")}
            {renderHandles(Position.Top, "-mt-2")}
            {renderHandles(Position.Right, "-mr-2")}
            {renderHandles(Position.Bottom, "-mb-2")}

            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "px-4 py-3 rounded-xl shadow-sm border-2 min-w-[180px] transition-all duration-200 cursor-help",
                        bg,
                        border,
                        selected ? "ring-2 ring-offset-2 ring-primary border-primary shadow-md" : "hover:border-slate-300 hover:shadow"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full bg-white shadow-sm shrink-0", color)}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm text-slate-800 leading-tight">
                                    {label}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">
                                    Estado
                                </span>
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs z-[60]">
                    <p className="font-semibold mb-1">{label}</p>
                    <p className="text-slate-500 leading-snug">
                        {(data.description as string) || getDescription(label)}
                    </p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

// Define default edge options outside component to prevent re-renders
const defaultEdgeOptions = {
    type: 'default',
    animated: true,
    style: { strokeWidth: 2, stroke: '#94a3b8' }
};

export default function TicketFlowEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data for Automation
    const [users, setUsers] = useState<{ id: string; email: string; name: string }[]>([]);
    const [groups, setGroups] = useState<{ _id: string; name: string }[]>([]);

    // Edit Dialog State (Nodes)
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // Complex Node Config State
    const [nodeConfig, setNodeConfig] = useState<{
        fields: Record<string, { visible: boolean; readonly: boolean; required: boolean }>;
        automation: { assignToUser?: string; assignToGroup?: string; note?: string };
    }>({ fields: {}, automation: {} });

    // Edit Dialog State (Edges)
    const [editEdgeDialogOpen, setEditEdgeDialogOpen] = useState(false);
    const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
    const [editEdgeLabel, setEditEdgeLabel] = useState("");

    // Custom Node Types
    const nodeTypes = useMemo(() => ({ status: StatusNode }), []);

    // Load Workflow
    const loadWorkflow = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/workflows/tickets`);
            if (!response.ok) throw new Error("Error loading workflow");
            const data = await response.json();

            if (data.nodes) {
                setNodes(data.nodes.map((n: Node) => ({ ...n, type: 'status' })));
            }
            if (data.edges) {
                setEdges(data.edges.map((e: Edge) => ({ ...e, animated: true, type: 'default' })));
            }
        } catch (error) {
            console.error(error);
            toast.error("No se pudo cargar el flujo de tickets.");
        } finally {
            setLoading(false);
        }
    }, [setNodes, setEdges]);

    // Load Users & Groups for Automation
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, groupsRes] = await Promise.all([
                    fetch(`${API_URL}/users`),
                    fetch(`${API_URL}/groups`)
                ]);
                if (usersRes.ok) setUsers(await usersRes.json());
                if (groupsRes.ok) setGroups(await groupsRes.json());
            } catch (e) {
                console.error("Error loading automation data", e);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        loadWorkflow();
    }, [loadWorkflow]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'default' }, eds)),
        [setEdges],
    );

    const onReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) => {
            setEdges((els) => els.map((e) => {
                if (e.id === oldEdge.id) {
                    return {
                        ...e,
                        source: newConnection.source || e.source,
                        target: newConnection.target || e.target,
                        sourceHandle: newConnection.sourceHandle,
                        targetHandle: newConnection.targetHandle,
                    };
                }
                return e;
            }));
        },
        [setEdges],
    );

    // Node Interaction
    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        setEditingNode(node);
        setEditLabel(node.data.label as string);
        setEditDescription((node.data.description as string) || "");

        // Initialize Config or Use Existing
        const existingConfig = (node.data.config as any) || {};
        setNodeConfig({
            fields: existingConfig.fields || {
                description: { visible: true, readonly: false, required: false },
                priority: { visible: true, readonly: false, required: false },
                visit: { visible: true, readonly: false, required: false },
                amount: { visible: true, readonly: false, required: false },
                attachments: { visible: true, readonly: false, required: false },
            },
            automation: existingConfig.automation || {
                assignToUser: "",
                assignToGroup: "",
                note: ""
            }
        });

        setEditDialogOpen(true);
    }, []);

    const handleSaveNodeEdit = () => {
        if (!editingNode || !editLabel.trim()) return;

        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === editingNode.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            label: editLabel.trim(),
                            description: editDescription.trim(),
                            config: nodeConfig
                        },
                    };
                }
                return n;
            })
        );
        setEditDialogOpen(false);
        setEditingNode(null);
        toast.info("Configuración de estado actualizada.");
    };

    const handleDeleteNode = () => {
        if (!editingNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== editingNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== editingNode.id && e.target !== editingNode.id));
        setEditDialogOpen(false);
        setEditingNode(null);
        toast.info("Estado eliminado.");
    };

    // Edge Interaction
    const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        setEditingEdge(edge);
        setEditEdgeLabel((edge.label as string) || "");
        setEditEdgeDialogOpen(true);
    }, []);

    const handleSaveEdgeEdit = () => {
        if (!editingEdge) return;
        setEdges((eds) =>
            eds.map((e) => {
                if (e.id === editingEdge.id) {
                    return { ...e, label: editEdgeLabel };
                }
                return e;
            })
        );
        setEditEdgeDialogOpen(false);
        setEditingEdge(null);
        toast.info("Vínculo actualizado.");
    };

    const handleDeleteEdge = () => {
        if (!editingEdge) return;
        setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
        setEditEdgeDialogOpen(false);
        setEditingEdge(null);
        toast.info("Vínculo eliminado.");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/workflows/tickets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nodes, edges }),
            });

            if (!response.ok) throw new Error("Error saving workflow");
            toast.success('Flujo guardado exitosamente.');
            window.dispatchEvent(new Event('ticket_statuses_updated'));
        } catch (error) {
            console.error(error);
            toast.error("No se pudo guardar el flujo.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddNode = () => {
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            position: { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 },
            data: { label: `Nuevo Estado`, config: {} },
            type: 'status',
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const updateFieldConfig = (field: string, key: 'visible' | 'readonly' | 'required', value: boolean) => {
        setNodeConfig(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [field]: { ...prev.fields[field], [key]: value }
            }
        }));
    };

    const renderFieldRow = (key: string, label: string) => {
        const config = nodeConfig.fields[key] || { visible: true, readonly: false, required: false };
        return (
            <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
                <span className="text-sm font-medium">{label}</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" title="Visible">
                        <Label className="text-xs text-slate-500">Ver</Label>
                        <Switch
                            checked={config.visible !== false}
                            onCheckedChange={(v) => updateFieldConfig(key, 'visible', v)}
                            className="scale-75"
                        />
                    </div>
                    <div className="flex items-center gap-2" title="Solo Lectura">
                        <Label className="text-xs text-slate-500">Lock</Label>
                        <Switch
                            checked={config.readonly === true}
                            onCheckedChange={(v) => updateFieldConfig(key, 'readonly', v)}
                            className="scale-75"
                        />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="flex h-[400px] w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <Card className="h-[700px] w-full flex flex-col border-none shadow-none bg-transparent">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Flujo de Tickets</h2>
                    <p className="text-sm text-slate-500 mt-1">Diseña los estados y el camino que siguen los tickets.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleAddNode} className="border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50">
                        <Plus className="w-4 h-4 mr-2 text-slate-600" />
                        Agregar Estado
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar Flujo
                    </Button>
                </div>
            </div>

            <CardContent className="flex-1 p-0 border rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 h-full min-h-[600px] shadow-inner relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Controls className="!bg-white !border-slate-200 !shadow-sm !rounded-lg !m-4" />
                    <MiniMap className="!bg-white !border-slate-200 !shadow-sm !rounded-lg !m-4" maskColor="rgba(240, 242, 245, 0.7)" nodeColor="#cbd5e1" />
                    <Background gap={24} size={1} color="#e2e8f0" />
                    <Panel position="top-right" className="m-4">
                        <div className="bg-white/90 backdrop-blur dark:bg-black/50 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 shadow-sm border border-slate-100 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            Doble click para editar
                        </div>
                    </Panel>
                </ReactFlow>
            </CardContent>

            {/* Node Config Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Controlador de Estado</DialogTitle>
                        <DialogDescription>
                            Define el comportamiento del ticket en el estado <span className="font-semibold text-primary">{editingNode?.data?.label as string}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="fields">Campos</TabsTrigger>
                            <TabsTrigger value="automation">Automatización</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre del Estado</Label>
                                <Input
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    placeholder="Ej: En Proceso"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción del Estado (Tooltip)</Label>
                                <Textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Descripción que aparecerá al pasar el mouse sobre el estado..."
                                    className="resize-none"
                                />
                                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 text-xs py-2">
                                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                                    <span className="ml-2">Cambiar el nombre puede afectar tickets existentes.</span>
                                </Alert>
                            </div>
                        </TabsContent>

                        <TabsContent value="fields" className="space-y-4 py-4">
                            <div className="rounded-md border p-4 bg-slate-50">
                                <h4 className="mb-4 text-sm font-semibold text-slate-900">Control de Visibilidad y Edición</h4>
                                <div className="space-y-1">
                                    {renderFieldRow('description', 'Descripción')}
                                    {renderFieldRow('priority', 'Prioridad')}
                                    {renderFieldRow('visit', 'Módulo de Visitas/Técnico')}
                                    {renderFieldRow('amount', 'Presupuesto / Monto')}
                                    {renderFieldRow('attachments', 'Adjuntos y Notas')}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="automation" className="space-y-4 py-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Asignar Automáticamente a Usuario</Label>
                                    <Select
                                        value={nodeConfig.automation.assignToUser || "none"}
                                        onValueChange={(v) => setNodeConfig(prev => ({ ...prev, automation: { ...prev.automation, assignToUser: v === "none" ? "" : v } }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar usuario..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin cambio</SelectItem>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={u.email}>{u.name} ({u.email})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Asignar Automáticamente a Grupo</Label>
                                    <Select
                                        value={nodeConfig.automation.assignToGroup || "none"}
                                        onValueChange={(v) => setNodeConfig(prev => ({ ...prev, automation: { ...prev.automation, assignToGroup: v === "none" ? "" : v } }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar grupo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin cambio</SelectItem>
                                            {groups.map(g => (
                                                <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 pt-2 border-t">
                                    <Label>Nota Interna Automática</Label>
                                    <Textarea
                                        placeholder="Escribe una nota que se añadirá automáticamente al historial al entrar en este estado..."
                                        value={nodeConfig.automation.note || ""}
                                        onChange={(e) => setNodeConfig(prev => ({ ...prev, automation: { ...prev.automation, note: e.target.value } }))}
                                        className="min-h-[100px]"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Útil para dejar constancia de hitos en el proceso.</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="flex !justify-between gap-2 sm:justify-between mt-4">
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteNode}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-none"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar Estado
                        </Button>
                        <div className="flex gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleSaveNodeEdit}>
                                Guardar Configuración
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edge Edit Dialog */}
            <Dialog open={editEdgeDialogOpen} onOpenChange={setEditEdgeDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar Vínculo</DialogTitle>
                        <DialogDescription>Configura la conexión.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Etiqueta</Label>
                            <Input
                                value={editEdgeLabel}
                                onChange={(e) => setEditEdgeLabel(e.target.value)}
                                placeholder="Ej: Aprobar"
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button variant="destructive" size="sm" onClick={handleDeleteEdge}>Eliminar</Button>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setEditEdgeDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveEdgeEdit}>Guardar</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
