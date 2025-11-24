"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadContractFile } from "@/lib/api-contracts";
import { Contract } from "@/types/contract";
import { UploadCloud } from "lucide-react";

interface UploadContractDialogProps {
  contract: Contract;
  onContractUpdated: (contract: Contract) => void;
  children: React.ReactNode;
}

export function UploadContractDialog({ contract, onContractUpdated, children }: UploadContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo para subir.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("contractFile", file);

    try {
      const updatedContract = await uploadContractFile(contract.id, file);
      toast.success("Contrato subido exitosamente.");
      setIsOpen(false);
      onContractUpdated(updatedContract);
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || "Error al subir el contrato.");
      console.error("Error uploading contract:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Subir Contrato Firmado</DialogTitle>
          <DialogDescription>
            Sube el archivo PDF o imagen del contrato firmado para "{contract.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragActive ? "border-slate-900 bg-slate-50" : "border-slate-300"
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-10 w-10 text-slate-500" />
            <p className="mt-2 text-sm text-slate-600">Arrastra el PDF o haz clic para seleccionarlo</p>
            <Button variant="outline" className="mt-3" onClick={() => document.getElementById("contractFile")?.click()}>
              Elegir archivo
            </Button>
            <Input
              id="contractFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? <p className="mt-2 text-sm font-medium text-slate-700">{file.name}</p> : null}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Subiendo..." : "Subir Contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
