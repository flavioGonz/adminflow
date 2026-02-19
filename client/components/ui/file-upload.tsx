"use client";

import React, { useCallback, useState, useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    onChange?: (files: File[]) => void;
    maxFiles?: number;
    accept?: string;
    value?: File[];
}

export function FileUpload({
    onChange,
    maxFiles = 5,
    accept = "image/*",
    value = [],
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [internalFiles, setInternalFiles] = useState<File[]>(value);

    const handleFiles = useCallback(
        (files: File[]) => {
            const newFiles = [...internalFiles, ...files].slice(0, maxFiles);
            setInternalFiles(newFiles);
            onChange?.(newFiles);
        },
        [internalFiles, maxFiles, onChange]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFiles(Array.from(e.dataTransfer.files));
            }
        },
        [handleFiles]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            if (e.target.files && e.target.files[0]) {
                handleFiles(Array.from(e.target.files));
            }
        },
        [handleFiles]
    );

    const removeFile = (index: number) => {
        const newFiles = internalFiles.filter((_, i) => i !== index);
        setInternalFiles(newFiles);
        onChange?.(newFiles);
    };

    return (
        <div className="w-full space-y-4">
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer overflow-hidden",
                    dragActive
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={accept}
                    onChange={handleChange}
                />

                <AnimatePresence>
                    {dragActive && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 flex items-center justify-center bg-sky-500/10 backdrop-blur-sm"
                        >
                            <p className="text-lg font-bold text-sky-600">Suelta los archivos aquí</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col items-center gap-4 text-center p-6">
                    <div className="p-4 rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                        <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                            Haz clic o arrastra archivos
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Imágenes, Documentos (Máx {maxFiles} archivos)
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {internalFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {internalFiles.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm group"
                            >
                                <div className="p-2 rounded-lg bg-slate-50">
                                    {file.type.startsWith("image/") ? (
                                        <ImageIcon className="h-4 w-4 text-purple-500" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
