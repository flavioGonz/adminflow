"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractTable } from "@/components/contracts/contract-table";
import { ImportContractsDialog } from "@/components/contracts/import-contracts-dialog";
import { CreateContractDialog } from "@/components/contracts/create-contract-dialog";
import { Contract } from "@/types/contract";
import { deleteContract, fetchAllContracts } from "@/lib/api-contracts";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { BarChart3, FileDown, FileSpreadsheet, PlusCircle } from "lucide-react";

const DEFAULT_ERROR = "No se pudieron cargar los contratos. Verifica que el backend este disponible.";

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

  const handleContractCreated = () => loadContracts();
  const handleContractUpdated = () => loadContracts();

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
    const totals = contracts.reduce(
      (acc, contract) => {
        if (contract.currency?.toUpperCase() === "USD") {
          acc.usd += contract.amount ?? 0;
        } else {
          acc.uyu += contract.amount ?? 0;
        }
        return acc;
      },
      { total: contracts.length, usd: 0, uyu: 0, expiringSoon: 0 }
    );
    const now = new Date().getTime();
    const inFifteenDays = now + 1000 * 60 * 60 * 24 * 15;
    totals.expiringSoon = contracts.filter((contract) => {
      if (!contract.endDate) return false;
      const end = new Date(contract.endDate).getTime();
      return end > now && end < inFifteenDays;
    }).length;
    return totals;
  }, [contracts]);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      contracts.map((contract) => ({
        ID: contract.id,
        Cliente: contract.clientName,
        Titulo: contract.title,
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
      head: [["Cliente", "Titulo", "Estado", "Fecha inicio", "Fecha fin", "Monto"]],
      body: contracts.map((contract) => [
        contract.clientName || "Sin cliente",
        contract.title || "Sin titulo",
        contract.status || "Sin estado",
        contract.startDate || "Sin fecha",
        contract.endDate || "Sin fecha",
        typeof contract.amount === "number" ? `$${contract.amount}` : "Sin monto",
      ]),
    });
    doc.save("contracts.pdf");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Panel de contratos</p>
              <h1 className="text-2xl font-semibold text-slate-900">Contratos</h1>
              <p className="text-sm text-slate-600">
                Administra acuerdos activos, vencidos y en revision con metricas y exportaciones rapidas.
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
                <Button variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-100">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </ImportContractsDialog>
              <Button variant="outline" onClick={handleExportExcel} className="border-slate-300 text-slate-800 hover:bg-slate-100">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                Excel
              </Button>
              <Button variant="outline" onClick={handleExportPdf} className="border-slate-300 text-slate-800 hover:bg-slate-100">
                <FileDown className="mr-2 h-4 w-4 text-red-600" />
                PDF
              </Button>
              <CreateContractDialog onContractCreated={handleContractCreated}>
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo contrato
                </Button>
              </CreateContractDialog>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-slate-200 bg-slate-900 text-white shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos totales</CardTitle>
                <BarChart3 className="h-4 w-4 text-white/70" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{contracts.length}</p>
                <p className="text-xs text-white/70">Resumen general</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                    <span role="img" aria-label="usa">🇺🇸</span>
                  </span>
                  Total USD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">
                  {new Intl.NumberFormat("es-UY", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }).format(metrics.usd)}
                </p>
                <p className="text-xs text-slate-500">Monto mensual en dolares</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                    <span role="img" aria-label="uruguay">🇺🇾</span>
                  </span>
                  Total UYU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">
                  {new Intl.NumberFormat("es-UY", {
                    style: "currency",
                    currency: "UYU",
                    minimumFractionDigits: 2,
                  }).format(metrics.uyu)}
                </p>
                <p className="text-xs text-slate-500">Monto mensual en pesos uruguayos</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-background shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Cargando contratos...</div>
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
