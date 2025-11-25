"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Table } from "lucide-react";

interface CollectionInfo {
    name: string;
    count: number;
}

interface Summary {
    collections?: CollectionInfo[];
    size?: number;
}

interface DatabaseSummaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: Summary | null;
    dbName: string;
}

export default function DatabaseSummaryModal({ open, onOpenChange, stats, dbName }: DatabaseSummaryModalProps) {
    if (!stats) return null;

    const collections = stats.collections || [];
    const sizeInMB = stats.size ? (stats.size / (1024 * 1024)).toFixed(2) : "0";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        Resumen de Base de Datos
                    </DialogTitle>
                    <DialogDescription>
                        Detalles de la base de datos <strong>{dbName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4 p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Total Colecciones:</span>
                        <span className="font-bold text-slate-900">{collections.length}</span>
                    </div>

                    <div className="flex justify-between items-center mb-4 p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Tamaño en disco:</span>
                        <span className="font-bold text-slate-900">{sizeInMB} MB</span>
                    </div>

                    <div className="border rounded-md">
                        <div className="bg-slate-100 p-2 border-b text-xs font-semibold text-slate-500 uppercase flex justify-between">
                            <span>Colección</span>
                            <span>Documentos</span>
                        </div>
                        <ScrollArea className="h-[200px]">
                            {collections.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No hay colecciones (Base de datos vacía)
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {collections.map((col) => (
                                        <div key={col.name} className="p-2 text-sm flex justify-between hover:bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Table className="w-4 h-4 text-slate-400" />
                                                <span>{col.name}</span>
                                            </div>
                                            <span className="font-mono text-slate-600">{col.count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
