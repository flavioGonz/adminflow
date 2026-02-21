"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
    Node,
    Edge,
    Handle,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    Laptop,
    Server,
    Database,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Loader2,
    Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/http';

// --- Custom Nodes ---

const NodeCard = ({ label, icon: Icon, status, latency, subLabel }: { label: string, icon: any, status: 'connected' | 'disconnected' | 'error' | 'loading' | 'disabled', latency?: number, subLabel?: string }) => {
    const statusColor =
        status === 'connected' ? 'bg-emerald-500' :
            status === 'error' ? 'bg-rose-500' :
                status === 'disabled' ? 'bg-slate-300' :
                    status === 'disconnected' ? 'bg-slate-400' : 'bg-amber-500';

    const borderColor =
        status === 'connected' ? 'border-emerald-200' :
            status === 'error' ? 'border-rose-200' :
                status === 'disabled' ? 'border-slate-200' :
                    status === 'disconnected' ? 'border-slate-200' : 'border-amber-200';

    const bg =
        status === 'connected' ? 'bg-emerald-50' :
            status === 'error' ? 'bg-rose-50' :
                status === 'disabled' ? 'bg-slate-100' :
                    status === 'disconnected' ? 'bg-slate-50' : 'bg-amber-50';

    return (
        <div className={cn(
            "relative flex items-center min-w-[200px] gap-4 p-3 rounded-xl border-2 shadow-sm transition-all duration-300",
            borderColor,
            bg
        )}>
            {/* Connection Dot */}
            <div className={cn("absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10", statusColor)}>
                {status === 'loading' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
            </div>

            <div className={cn("p-2.5 rounded-lg bg-white shadow-sm shrink-0",
                status === 'connected' ? "text-emerald-600" : "text-slate-500"
            )}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-800 leading-none mb-1">{label}</span>
                <span className="text-[10px] text-slate-500 font-medium truncate">{subLabel || 'Sistema'}</span>

                {latency !== undefined && latency !== null && (
                    <div className="flex items-center gap-1 mt-1.5">
                        <Wifi className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-mono text-slate-600">{latency}ms</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Node Definitions
const BrowserNode = ({ data }: NodeProps) => (
    <>
        <NodeCard
            label="Cliente Web"
            subLabel="Navegador / GUI"
            icon={Laptop}
            status={data.status as any}
            latency={data.latency as number}
        />
        <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </>
);

const ServerNode = ({ data }: NodeProps) => (
    <>
        <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
        <NodeCard
            label="API Server"
            subLabel="Node.js Backend"
            icon={Server}
            status={data.status as any}
            latency={data.latency as number}
        />
        <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </>
);

const DbNode = ({ data }: NodeProps) => (
    <>
        <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
        <NodeCard
            label="MongoDB"
            subLabel="Base de Datos"
            icon={Database}
            status={data.status as any}
            latency={data.latency as number}
        />
    </>
);

const WahaNode = ({ data }: NodeProps) => (
    <>
        <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
        <NodeCard
            label="Waha Bot"
            subLabel="WhatsApp API"
            icon={MessageSquare}
            status={data.status as any}
            latency={data.latency as number}
        />
    </>
);

const nodeTypes = {
    browser: BrowserNode,
    server: ServerNode,
    database: DbNode,
    waha: WahaNode,
};

// Initial Flow Layout
const initialNodes: Node[] = [
    { id: 'browser', type: 'browser', position: { x: 0, y: 100 }, data: { status: 'connected', latency: 0 } },
    { id: 'server', type: 'server', position: { x: 300, y: 100 }, data: { status: 'loading', latency: 0 } },
    { id: 'mongo', type: 'database', position: { x: 600, y: 0 }, data: { status: 'loading', latency: 0 } },
    { id: 'waha', type: 'waha', position: { x: 600, y: 200 }, data: { status: 'loading', latency: 0 } },
];

const initialEdges: Edge[] = [
    { id: 'e1', source: 'browser', target: 'server', animated: true, style: { stroke: '#94a3b8' } },
    { id: 'e2', source: 'server', target: 'mongo', animated: true, style: { stroke: '#94a3b8' } },
    { id: 'e3', source: 'server', target: 'waha', animated: true, style: { stroke: '#94a3b8' } },
];

export default function SystemTopology() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const updateStatus = useCallback(async () => {
        const clientStart = Date.now();
        try {
            const res = await fetch(`${API_URL}/status/stack`);
            const clientLatency = Date.now() - clientStart;

            if (!res.ok) throw new Error('Network response was not ok');

            const data = await res.json();
            // data format: { server: { status, timestamp }, database: { status, latency }, waha: { status, latency } }

            setNodes((nds) => nds.map((node) => {
                if (node.id === 'browser') {
                    return { ...node, data: { ...node.data, status: 'connected', latency: clientLatency } };
                }
                if (node.id === 'server') {
                    return { ...node, data: { ...node.data, status: 'connected', latency: 0 } }; // Server latency relative to... itself? usually 0 or load avg
                }
                if (node.id === 'mongo') {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            status: data.database?.status || 'error',
                            latency: data.database?.latency || 0
                        }
                    };
                }
                if (node.id === 'waha') {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            status: data.waha?.status || 'error',
                            latency: data.waha?.latency || 0
                        }
                    };
                }
                return node;
            }));

            // Update edge colors based on health
            setEdges((eds) => eds.map(e => {
                let color = '#94a3b8'; // default slate-400

                // Brwoser -> Server
                if (e.id === 'e1') {
                    color = '#10b981'; // Green because we are getting a fetch response
                }
                // Server -> Mongo
                if (e.id === 'e2') {
                    color = data.database?.status === 'connected' ? '#10b981' : '#f43f5e';
                }
                // Server -> Waha
                if (e.id === 'e3') {
                    if (data.waha?.status === 'connected') color = '#10b981';
                    else if (data.waha?.status === 'disabled') color = '#94a3b8'; // Grey
                    else color = '#f43f5e'; // Red for error/disconnected
                }

                return { ...e, style: { ...e.style, stroke: color, strokeWidth: 2 }, animated: color === '#10b981' };
            }));

        } catch (error) {
            // Client -> Server failed
            setNodes((nds) => nds.map((node) => {
                if (node.id === 'browser') return { ...node, data: { ...node.data, status: 'connected', latency: 0 } }; // Browser matches connection to *host* not server API
                if (node.id === 'server') return { ...node, data: { ...node.data, status: 'disconnected', latency: 0 } };
                if (node.id === 'mongo') return { ...node, data: { ...node.data, status: 'unknown' } };
                if (node.id === 'waha') return { ...node, data: { ...node.data, status: 'unknown' } };
                return node;
            }));

            setEdges((eds) => eds.map(e => ({ ...e, style: { ...e.style, stroke: '#f43f5e' }, animated: false })));
        }
    }, [setNodes, setEdges]);

    useEffect(() => {
        updateStatus();
        const interval = setInterval(updateStatus, 5000);
        return () => clearInterval(interval);
    }, [updateStatus]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            zoomOnScroll={false}
            panOnDrag={false}
            preventScrolling={false}
            nodesDraggable={false}
            proOptions={{ hideAttribution: true }}
        >
            <Background gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>
    );
}
