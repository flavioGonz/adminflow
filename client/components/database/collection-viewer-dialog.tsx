"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChevronLeft,
    ChevronRight,
    Copy,
    Database,
    FileJson,
    Loader2,
    RefreshCw,
    Search,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CollectionViewerDialogProps {
    collectionName: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CollectionViewerDialog({
    collectionName,
    isOpen,
    onClose,
}: CollectionViewerDialogProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [viewMode, setViewMode] = useState<"table" | "json">("table");
    const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

    useEffect(() => {
        if (isOpen && collectionName) {
            setPage(1);
            fetchDocuments(1);
        } else {
            setDocuments([]);
            setTotalPages(1);
            setTotalDocs(0);
            setSelectedDoc(null);
        }
    }, [isOpen, collectionName]);

    const fetchDocuments = async (pageNum: number) => {
        if (!collectionName) return;
        setLoading(true);
        try {
            const response = await fetch(
                `/api/database/collections/${collectionName}/documents?page=${pageNum}&limit=10`
            );
            if (!response.ok) throw new Error("Error al cargar documentos");
            const data = await response.json();
            setDocuments(data.documents);
            setTotalPages(data.pagination.totalPages);
            setTotalDocs(data.pagination.total);
            setPage(pageNum);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar documentos");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyJson = (doc: any) => {
        navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
        toast.success("JSON copiado al portapapeles");
    };

    // Helper to get columns from first document (for table view)
    const getColumns = () => {
        if (documents.length === 0) return [];
        // Get keys from first few documents to ensure we cover most fields
        const keys = new Set<string>();
        documents.slice(0, 5).forEach(doc => {
            Object.keys(doc).forEach(key => keys.add(key));
        });
        // Always put _id first
        const keyArray = Array.from(keys);
        const idIndex = keyArray.indexOf("_id");
        if (idIndex > -1) {
            keyArray.splice(idIndex, 1);
            keyArray.unshift("_id");
        }
        return keyArray.slice(0, 6); // Limit to 6 columns for table view
    };

    const renderCellValue = (value: any) => {
        if (value === null) return <span className="text-slate-400 italic">null</span>;
        if (value === undefined) return <span className="text-slate-400 italic">undefined</span>;
        if (typeof value === "object") {
            if (Array.isArray(value)) return <span className="text-blue-600">Array({value.length})</span>;
            // Check for MongoDB ObjectId or Date
            if (value.toString && value.toString() !== "[object Object]") return value.toString();
            return <span className="text-amber-600">{`{...}`}</span>;
        }
        if (typeof value === "boolean") return <Badge variant="outline" className={value ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-rose-600 border-rose-200 bg-rose-50"}>{value ? "true" : "false"}</Badge>;
        return String(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-slate-900">
                                    {collectionName}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    {totalDocs.toLocaleString()} documentos encontrados
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 px-3 text-xs rounded-md ${viewMode === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                                    onClick={() => setViewMode("table")}
                                >
                                    Tabla
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-7 px-3 text-xs rounded-md ${viewMode === "json" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                                    onClick={() => setViewMode("json")}
                                >
                                    JSON
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => fetchDocuments(page)}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex">
                    {/* Main Content Area */}
                    <div className={`flex-1 flex flex-col min-w-0 ${selectedDoc ? "border-r border-slate-200" : ""}`}>
                        <ScrollArea className="flex-1">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-sm">Cargando documentos...</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <FileJson className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">La colección está vacía</p>
                                </div>
                            ) : viewMode === "table" ? (
                                <div className="min-w-full inline-block align-middle">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                {getColumns().map((col) => (
                                                    <TableHead key={col} className="h-9 text-xs font-semibold text-slate-500 whitespace-nowrap">
                                                        {col}
                                                    </TableHead>
                                                ))}
                                                <TableHead className="h-9 w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {documents.map((doc, i) => (
                                                <TableRow
                                                    key={doc._id || i}
                                                    className={`cursor-pointer hover:bg-slate-50 ${selectedDoc === doc ? "bg-emerald-50/50 hover:bg-emerald-50/70" : ""}`}
                                                    onClick={() => setSelectedDoc(doc)}
                                                >
                                                    {getColumns().map((col) => (
                                                        <TableCell key={`${doc._id}-${col}`} className="py-2 text-xs font-mono text-slate-600 max-w-[200px] truncate">
                                                            {renderCellValue(doc[col])}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="py-2">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCopyJson(doc);
                                                        }}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="p-4 space-y-4">
                                    {documents.map((doc, i) => (
                                        <div key={doc._id || i} className="relative group rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm"
                                                onClick={() => handleCopyJson(doc)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                            <div className="overflow-auto max-h-[300px]">
                                                <pre className="whitespace-pre-wrap break-all text-slate-700 pr-4">
                                                    {JSON.stringify(doc, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {/* Pagination Footer */}
                        <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
                            <div className="text-xs text-slate-500">
                                Página {page} de {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => fetchDocuments(page - 1)}
                                    disabled={page <= 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => fetchDocuments(page + 1)}
                                    disabled={page >= totalPages || loading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Document Detail Sidebar (Desktop) */}
                    {selectedDoc && (
                        <div className="w-1/3 border-l border-slate-200 bg-white flex flex-col shadow-xl z-10">
                            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Detalle del Documento</h3>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyJson(selectedDoc)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDoc(null)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">
                                    {JSON.stringify(selectedDoc, null, 2)}
                                </pre>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
