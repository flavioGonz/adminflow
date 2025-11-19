"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileDown,
  FileSpreadsheet,
  PlusCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { ContractTable } from "@/components/contracts/contract-table";
import { ImportContractsDialog } from "@/components/contracts/import-contracts-dialog";
import { CreateContractDialog } from "@/components/contracts/create-contract-dialog";
import { Contract } from "@/types/contract";
import {
  deleteContract,
  fetchAllContracts,
} from "@/lib/api-contracts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const DEFAULT_ERROR =
  "No se pudieron cargar los contratos. Revisa que el backend esté disponible.";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllContracts();
      setContracts(data);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(DEFAULT_ERROR);
      toast.error(DEFAULT_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleContractCreated = () => {
    loadContracts();
  };

  const handleContractUpdated = () => {
    loadContracts();
  };

  const handleContractDeleted = async (contractId: string) => {
    try {
      await deleteContract(contractId);
      toast.success("Contrato eliminado");
      loadContracts();
    } catch (err) {
      console.error("Error deleting contract:", err);
      toast.error("No se pudo eliminar el contrato");
    }
  };

  const metrics = useMemo(() => {
    if (!contracts.length) {
      return {
        total: 0,
        active: 0,
        expiringSoon: 0,
      };
    }
    const now = new Date().getTime();
    const inFifteenDays = now + 1000 * 60 * 60 * 24 * 15;
    const active = contracts.filter(
      (contract) => contract.status?.toLowerCase() === "activo"
    ).length;
    const expiringSoon = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const end = new Date(contract.endDate).getTime();
      return end > now && end < inFifteenDays;
    }).length;
    return {
      total: contracts.length,
      active,
      expiringSoon,
    };
  }, [contracts]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      contracts.map((contract) => ({
        ID: contract.id,
        Cliente: contract.clientName,
        Título: contract.title,
        Estado: contract.status,
        "Fecha Inicio": contract.startDate,
        "Fecha Fin": contract.endDate,
        SLA: contract.sla,
        "Tipo de contrato": contract.contractType,
        Monto: contract.amount,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contratos");
    XLSX.writeFile(workbook, "contracts.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          "Cliente",
          "Título",
          "Estado",
          "Fecha inicio",
          "Fecha fin",
          "Monto",
        ],
      ],
      body: contracts.map((contract) => [
        contract.clientName || "—",
        contract.title || "—",
        contract.status || "—",
        contract.startDate || "—",
        contract.endDate || "—",
        typeof contract.amount === "number" ? `$${contract.amount}` : "—",
      ]),
    });
    doc.save("contracts.pdf");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contratos</h1>
            <p className="text-sm text-muted-foreground">
              Administra los acuerdos activos, vencidos y en revisión.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por cliente, estado o SLA..."
              className="w-64"
            />
            <ImportContractsDialog onImportComplete={loadContracts}>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </ImportContractsDialog>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPdf}>
              <FileDown className="mr-2 h-4 w-4 text-red-500" />
              PDF
            </Button>
            <CreateContractDialog onContractCreated={handleContractCreated}>
              <Button className="bg-blue-600 text-white hover:bg-blue-500">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo contrato
              </Button>
            </CreateContractDialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Contratos totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contratos activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Vencen en 15 días</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.expiringSoon}</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-background">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando contratos...
            </div>
          ) : (
            <ContractTable
              contracts={contracts}
              onContractUpdated={handleContractUpdated}
              onContractDeleted={handleContractDeleted}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
