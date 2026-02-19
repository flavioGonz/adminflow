"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import { ContractTable } from "@/components/contracts/contract-table";
import { ImportContractsDialog } from "@/components/contracts/import-contracts-dialog";
import { CreateContractDialog } from "@/components/contracts/create-contract-dialog";
import { Contract } from "@/types/contract";
import { deleteContract, fetchAllContracts } from "@/lib/api-contracts";
import { toast } from "sonner";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { FileDown, FileSpreadsheet, PlusCircle, FileSignature } from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { PageTransition } from "@/components/ui/page-transition";

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
      <PageTransition>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <FileSignature className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">
                <ShinyText size="3xl" weight="bold">Contratos</ShinyText>
              </h1>
              <p className="text-sm text-slate-600">
                Administra acuerdos activos, vencidos y en revisión con métricas y exportaciones rápidas.
              </p>
            </div>
          </div>

          <FilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por cliente, estado o SLA..."
            className="px-2"
          >
            <div className="flex items-center gap-2">
              <ImportContractsDialog onImportComplete={loadContracts}>
                <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-slate-100 transition-all font-medium">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </ImportContractsDialog>
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                title="Exportar Excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline ml-2">Excel</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-rose-50 hover:border-rose-200 transition-all group"
                title="Exportar PDF"
              >
                <FileDown className="h-4 w-4 text-rose-600 transition-transform group-hover:scale-110" />
                <span className="hidden sm:inline ml-2">PDF</span>
              </Button>
            </div>

            <div className="w-px h-6 bg-slate-200/60 mx-1" />

            <CreateContractDialog onContractCreated={handleContractCreated}>
              <Button className="h-10 rounded-xl bg-slate-900 border-none text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo contrato</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </CreateContractDialog>
          </FilterToolbar>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="w-full">
            {loading ? (
              <div className="p-8">
                <TableSkeleton rows={6} columns={5} />
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
      </PageTransition>
    </DashboardLayout>
  );
}
