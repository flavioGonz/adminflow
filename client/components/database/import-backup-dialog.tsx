"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Database,
    FileUp,
    HardDrive,
    Loader2,
    Upload,
    X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface ImportBackupDialogProps {
    children: React.ReactNode;
    onImportComplete: () => void;
    currentStats: {
        collections: { name: string; size: number }[];
        totalSize: number;
    };
}

type ImportStep = "upload" | "analyzing" | "compare" | "restoring" | "success";

export function ImportBackupDialog({
    children,
    onImportComplete,
    currentStats,
}: ImportBackupDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [backupStats, setBackupStats] = useState<any>(null);
    const [backupId, setBackupId] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/gzip": [".tar.gz", ".gz"],
            "application/x-tar": [".tar"],
        },
        maxFiles: 1,
    });

    const handleAnalyze = async () => {
        if (!file) return;

        setStep("analyzing");
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("backup", file);

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch("/api/system/backups/analyze", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval);
            setUploadProgress(100);

            if (!response.ok) throw new Error("Error al analizar el archivo");

            const data = await response.json();
            setBackupStats(data);
            setBackupId(data.backupId);
            setStep("compare");
        } catch (error) {
            console.error(error);
            toast.error("Error al analizar el respaldo");
            setStep("upload");
        }
    };

    const handleRestore = async () => {
        if (!backupId) return;

        setStep("restoring");
        try {
            const response = await fetch("/api/system/backups/restore-upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ backupId }),
            });

            if (!response.ok) throw new Error("Error al restaurar");

            setStep("success");
            toast.success("Base de datos importada exitosamente");
            onImportComplete();

            // Close after 2 seconds
            setTimeout(() => {
                setIsOpen(false);
                resetState();
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error("Error al restaurar la base de datos");
            setStep("compare");
        }
    };

    const resetState = () => {
        setStep("upload");
        setFile(null);
        setUploadProgress(0);
        setBackupStats(null);
        setBackupId(null);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    // Prepare chart data
    const chartData = backupStats ? [
        {
            name: "Actual",
            size: currentStats.totalSize,
            color: "#64748b", // slate-500
        },
        {
            name: "Respaldo",
            size: backupStats.totalSize,
            color: "#0ea5e9", // sky-500
        },
    ] : [];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setTimeout(resetState, 300);
        }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-xl overflow-hidden">
                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm -z-10" />

                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                            <FileUp className="h-6 w-6" />
                        </div>
                        Importar Base de Datos
                    </DialogTitle>
                    <DialogDescription>
                        Sube un archivo de respaldo (.tar.gz) para restaurar tu base de datos.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === "upload" && (
                        <div className="space-y-4">
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                                    isDragActive
                                        ? "border-sky-500 bg-sky-50"
                                        : "border-slate-200 hover:border-sky-400 hover:bg-slate-50",
                                    file && "border-sky-500 bg-sky-50/30"
                                )}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 rounded-full bg-slate-100">
                                        <Upload className="h-8 w-8 text-slate-400" />
                                    </div>
                                    {file ? (
                                        <div className="text-center">
                                            <p className="font-medium text-sky-700">{file.name}</p>
                                            <p className="text-sm text-slate-500">{formatBytes(file.size)}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="font-medium text-slate-700">
                                                Arrastra tu archivo aquí o haz clic para seleccionar
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Soporta archivos .tar.gz generados por AdminFlow
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "analyzing" && (
                        <div className="space-y-6 py-8">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
                                <div className="text-center space-y-1">
                                    <h3 className="font-medium text-lg">Analizando respaldo...</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Verificando estructura y contenido
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Progress value={uploadProgress} className="h-2" />
                                <p className="text-xs text-right text-muted-foreground">
                                    {uploadProgress}% completado
                                </p>
                            </div>
                        </div>
                    )}

                    {step === "compare" && backupStats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                                    <div className="flex items-center gap-2 mb-2 text-slate-600">
                                        <Database className="h-4 w-4" />
                                        <span className="text-sm font-medium">Actual</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {formatBytes(currentStats.totalSize)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {currentStats.collections.length} colecciones
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
                                    <div className="flex items-center gap-2 mb-2 text-sky-600">
                                        <HardDrive className="h-4 w-4" />
                                        <span className="text-sm font-medium">Nuevo</span>
                                    </div>
                                    <p className="text-2xl font-bold text-sky-900">
                                        {formatBytes(backupStats.totalSize)}
                                    </p>
                                    <p className="text-xs text-sky-600">
                                        {backupStats.collections.length} colecciones
                                    </p>
                                </div>
                            </div>

                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => [formatBytes(value), 'Tamaño']}
                                        />
                                        <Bar dataKey="size" radius={[0, 4, 4, 0]} barSize={32}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-900">
                                        Advertencia de Sobrescritura
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        Al confirmar, la base de datos actual será reemplazada completamente por el contenido del respaldo. Esta acción es irreversible.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "restoring" && (
                        <div className="space-y-6 py-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-sky-400 opacity-20"></div>
                                    <div className="relative p-4 rounded-full bg-sky-100 text-sky-600">
                                        <RefreshCw className="h-8 w-8 animate-spin" />
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="font-medium text-lg">Restaurando base de datos...</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Por favor no cierres esta ventana
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-6 py-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-emerald-100 text-emerald-600">
                                    <CheckCircle className="h-12 w-12" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="font-medium text-lg">¡Importación Completada!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        La base de datos ha sido actualizada correctamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === "upload" && (
                        <>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleAnalyze} disabled={!file} className="bg-sky-600 hover:bg-sky-700">
                                Analizar Archivo
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {step === "compare" && (
                        <>
                            <Button variant="ghost" onClick={resetState}>
                                <X className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button onClick={handleRestore} className="bg-amber-600 hover:bg-amber-700 text-white">
                                Confirmar e Importar
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
