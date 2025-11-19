"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadContractFile } from "@/lib/api-contracts";
import { Contract } from "@/types/contract";

interface UploadContractDialogProps {
  contract: Contract;
  onContractUpdated: (contract: Contract) => void;
  children: React.ReactNode;
}

export function UploadContractDialog({ contract, onContractUpdated, children }: UploadContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subir Contrato Firmado</DialogTitle>
          <DialogDescription>
            Sube el archivo PDF o imagen del contrato firmado para "{contract.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contractFile" className="text-right">
              Archivo
            </Label>
            <Input id="contractFile" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="col-span-3" />
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
