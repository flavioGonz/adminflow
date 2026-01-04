"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { API_URL } from "@/lib/http";
import { useState, useEffect } from "react";

interface FileItem {
    id: string;
    value: string;
    type: "file" | "folder";
    clientId?: string;
}

interface FilePreviewDialogProps {
    file: FileItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
    if (!file || !file.clientId) return null;

    const fileUrl = `${API_URL}/files/${file.clientId}/download?id=${encodeURIComponent(file.id)}`;
    const ext = file.value.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
    const isPdf = ext === 'pdf';

    const handleDownload = () => {
        window.open(fileUrl, "_blank");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0 bg-slate-950 border-slate-800 text-slate-50 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            {isImage ? <ImageIcon className="h-5 w-5 text-purple-400" /> : <FileText className="h-5 w-5 text-red-400" />}
                        </div>
                        <div className="flex flex-col">
                            <DialogTitle className="text-sm font-medium text-slate-200 truncate max-w-[300px]">{file.value}</DialogTitle>
                            <span className="text-xs text-slate-500 uppercase">{ext}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleDownload} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 relative">
                    {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={fileUrl}
                            alt={file.value}
                            className="max-w-full max-h-full object-contain p-4"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-full border-none"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                            <p className="mb-4">Visualización no disponible para este tipo de archivo.</p>
                            <Button variant="outline" onClick={handleDownload} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Abrir en nueva pestaña
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
