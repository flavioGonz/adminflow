"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    X,
    File as FileIcon,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Image as ImageIcon,
    FileText,
    Music,
    Video,
    Archive
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/http";
import { toast } from "sonner";

interface FileVaultUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    currentPath: string;
    onUploadComplete: () => void;
}

export function FileVaultUploadModal({
    open,
    onOpenChange,
    clientId,
    currentPath,
    onUploadComplete
}: FileVaultUploadModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
        setUploadStatus('idle');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('idle');

        try {
            // Upload files sequentially or parallel. For simplicity and progress tracking, sequential or Promise.all.
            // Using XHR for single file progress is easier, for multiple files we simulate/average progress.

            const totalSize = files.reduce((acc, f) => acc + f.size, 0);
            let uploadedSize = 0;

            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("id", currentPath === "/" ? "" : currentPath);

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", `${API_URL}/files/${clientId}/upload`);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const fileProgress = event.loaded;
                            const currentTotalProgress = ((uploadedSize + fileProgress) / totalSize) * 100;
                            setUploadProgress(Math.min(currentTotalProgress, 99));
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            uploadedSize += file.size;
                            resolve();
                        } else {
                            reject(new Error(xhr.statusText));
                        }
                    };

                    xhr.onerror = () => reject(new Error("Network Error"));
                    xhr.send(formData);
                });
            }

            setUploadProgress(100);
            setUploadStatus('success');
            setTimeout(() => {
                onUploadComplete();
                setFiles([]);
                setUploadStatus('idle');
                onOpenChange(false);
            }, 1000);

        } catch (error) {
            console.error(error);
            setUploadStatus('error');
            toast.error("Error al subir archivos");
        } finally {
            setIsUploading(false);
        }
    };

    const getFileIcon = (file: File) => {
        const type = file.type.split('/')[0];
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (type === 'image') return <ImageIcon className="h-8 w-8 text-purple-500 mb-2" />;
        if (type === 'video') return <Video className="h-8 w-8 text-pink-500 mb-2" />;
        if (type === 'audio') return <Music className="h-8 w-8 text-amber-500 mb-2" />;
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="h-8 w-8 text-blue-500 mb-2" />;
        if (['zip', 'rar', '7z'].includes(ext || '')) return <Archive className="h-8 w-8 text-orange-500 mb-2" />;
        return <FileIcon className="h-8 w-8 text-slate-400 mb-2" />;
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isUploading && onOpenChange(val)}>
            <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                <AnimatePresence mode="wait">
                    {uploadStatus === 'success' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10"
                        >
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">¡Subida Completada!</h3>
                            <p className="text-slate-500 mt-2">Tus archivos se han guardado correctamente.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-center mb-6">
                                <DialogTitle className="text-lg font-semibold text-slate-800">Subir Archivos</DialogTitle>
                                <p className="text-sm text-slate-500">
                                    {isUploading ? "Subiendo tus archivos..." : "Arrastra archivos o haz clic para seleccionar"}
                                </p>
                            </div>

                            {!isUploading && (
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300",
                                        isDragActive && "border-indigo-500 bg-indigo-50 scale-[0.98]"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <div className="h-12 w-12 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center mb-3">
                                        <Upload className={cn("h-6 w-6 text-slate-400", isDragActive && "text-indigo-500")} />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        {isDragActive ? "Suelta los archivos aquí" : "Haz clic o arrastra aquí"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Soporta cualquier tipo de archivo</p>
                                </div>
                            )}

                            {isUploading && (
                                <div className="py-8 px-4">
                                    <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
                                        <span>Subiendo...</span>
                                        <span>{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-3" />
                                    <p className="text-xs text-center text-slate-400 mt-4 animate-pulse">
                                        Por favor no cierres esta ventana
                                    </p>
                                </div>
                            )}

                            {files.length > 0 && !isUploading && (
                                <div className="mt-6">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Archivos seleccionados ({files.length})</h4>
                                    <div className="max-h-[160px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                                        {files.map((file, idx) => (
                                            <motion.div
                                                key={`${file.name}-${idx}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="h-8 w-8 rounded-md bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                                                        {['jpg', 'jpeg', 'png'].includes(file.name.split('.').pop()?.toLowerCase() || '') ? (
                                                            <ImageIcon className="h-4 w-4 text-purple-500" />
                                                        ) : (
                                                            <FileIcon className="h-4 w-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                                                        <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => removeFile(idx)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={() => setFiles([])}>Cancelar</Button>
                                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleUpload}>
                                            Subir {files.length} archivo{files.length !== 1 ? 's' : ''}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
