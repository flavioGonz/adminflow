"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importContracts } from "@/lib/api-contracts";
import { Contract } from "@/types/contract";
import { toast } from "sonner";
import { useState } from "react";
import * as XLSX from "xlsx";

interface ImportContractsDialogProps {
  onImportComplete: () => void;
  children: React.ReactNode;
}

export function ImportContractsDialog({ onImportComplete, children }: ImportContractsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Por favor, selecciona un archivo para importar.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const contractsToImport: Contract[] = json.map((item: any) => ({
          id: crypto.randomUUID(),
          clientId: item['ID Cliente'] || '',
          clientName: item['Cliente'] || '',
          title: item['Título'] || '',
          description: item['Descripción'] || '',
          startDate: item['Fecha Inicio'] || '',
          endDate: item['Fecha Fin'] || '',
          status: item['Estado'] || 'Nuevo',
          sla: item['SLA'] || '',
          contractType: item['Tipo Contrato'] || '',
          amount: item['Monto'] || 0,
        }));

        const result = await importContracts(contractsToImport);
        toast.success(`Importación completada: ${result.stats.imported} contratos importados, ${result.stats.failed} fallidos.`);
        setIsOpen(false);
        onImportComplete();
        setFile(null);
      } catch (error: any) {
        toast.error(error.message || "Error al procesar el archivo.");
        console.error("Error importing contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Contratos</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx) para importar contratos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Archivo
            </Label>
            <Input id="file" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleImport} disabled={loading || !file}>
            {loading ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
