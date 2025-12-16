"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Database,
  Calendar,
  Copy,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

interface BackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<{ success: boolean; location?: string; error?: string }>;
}

type BackupStep = "preparing" | "running" | "completing" | "done";

export function BackupModal({ open, onOpenChange, onConfirm }: BackupModalProps) {
  const [step, setStep] = useState<BackupStep>("preparing");
  const [progress, setProgress] = useState(0);
  const [backupLocation, setBackupLocation] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("preparing");
      setProgress(0);
      setBackupLocation("");
      setIsProcessing(false);
    }
  }, [open]);

  const handleStartBackup = async () => {
    setIsProcessing(true);
    
    try {
      // Step 1: Preparing
      setStep("preparing");
      setProgress(0);
      await new Promise(r => setTimeout(r, 1000));
      setProgress(30);

      // Step 2: Running
      setStep("running");
      setProgress(50);
      const result = await onConfirm();
      
      if (result.success && result.location) {
        setBackupLocation(result.location);
        setProgress(85);
        await new Promise(r => setTimeout(r, 500));

        // Step 3: Completing
        setStep("completing");
        setProgress(95);
        await new Promise(r => setTimeout(r, 800));

        // Step 4: Done
        setStep("done");
        setProgress(100);
        toast.success("Respaldo creado exitosamente");
      } else {
        throw new Error(result.error || "Error creating backup");
      }
    } catch (error) {
      toast.error("Error al crear respaldo: " + (error as Error).message);
      setStep("preparing");
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  const handleCopyLocation = () => {
    if (backupLocation) {
      navigator.clipboard.writeText(backupLocation);
      toast.success("Ubicación copiada al portapapeles");
    }
  };

  const getStepInfo = (currentStep: BackupStep) => {
    switch (currentStep) {
      case "preparing":
        return { label: "Preparando", color: "text-sky-600" };
      case "running":
        return { label: "Ejecutando", color: "text-amber-600" };
      case "completing":
        return { label: "Finalizando", color: "text-emerald-600" };
      case "done":
        return { label: "Completado", color: "text-emerald-700" };
    }
  };

  const stepInfo = getStepInfo(step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-6 border-b border-amber-200/50">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  Crear Respaldo
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600">
                  Se creará una copia de seguridad de tu base de datos
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Progress Section */}
          <motion.div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-900">
                Progreso del respaldo
              </label>
              <motion.span
                key={progress}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-semibold ${stepInfo.color}`}
              >
                {progress}%
              </motion.span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className={`text-xs font-medium ${stepInfo.color}`}>
              {stepInfo.label}...
            </p>
          </motion.div>

          {/* Steps Timeline */}
          <div className="space-y-2">
            {(["preparing", "running", "completing", "done"] as BackupStep[]).map(
              (s, idx) => {
                const isActive = step === s;
                const isDone = (["preparing", "running", "completing", "done"] as BackupStep[]).indexOf(s) <
                  (["preparing", "running", "completing", "done"] as BackupStep[]).indexOf(step);

                return (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0">
                      {isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Loader2 className="h-4 w-4 text-amber-600" />
                        </motion.div>
                      ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive || isDone ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {s === "preparing" && "Preparando base de datos"}
                      {s === "running" && "Ejecutando respaldo"}
                      {s === "completing" && "Finalizando proceso"}
                      {s === "done" && "Respaldo completado"}
                    </span>
                  </motion.div>
                );
              }
            )}
          </div>

          {/* Location Info - Show when done */}
          <AnimatePresence>
            {step === "done" && backupLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-900">
                    Respaldo creado exitosamente
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Ubicación del respaldo:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white border border-emerald-200 rounded px-2 py-1.5 text-slate-700 break-all font-mono">
                      {backupLocation}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLocation}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Box */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex gap-2">
              <Database className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="font-semibold">Nota:</span> Este respaldo incluye todas las
                  colecciones de la base de datos actual.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {step === "done" ? "Cerrar" : "Cancelar"}
          </Button>
          {step !== "done" && (
            <Button
              onClick={handleStartBackup}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <HardDrive className="mr-2 h-4 w-4" />
                  Iniciar Respaldo
                </>
              )}
            </Button>
          )}
          {step === "done" && (
            <Button
              onClick={handleClose}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Hecho
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
