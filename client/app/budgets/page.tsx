"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterToolbar } from "@/components/ui/filter-toolbar";
import {
  FileDown,
  FileSpreadsheet,
  PlusCircle,
  Calculator,
} from "lucide-react";
import { ShinyText } from "@/components/ui/shiny-text";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { BudgetTable } from "@/components/budgets/budget-table";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
import { Budget } from "@/types/budget";
import {
  deleteBudget,
  fetchAllBudgets,
} from "@/lib/api-budgets";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

const DEFAULT_ERROR =
  "No se pudieron cargar los presupuestos. Revisa que el backend esté disponible.";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllBudgets();
      setBudgets(data);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError(DEFAULT_ERROR);
      toast.error(DEFAULT_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleBudgetCreated = () => {
    loadBudgets();
  };

  const handleBudgetDeleted = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
      toast.success("Presupuesto eliminado");
      loadBudgets();
    } catch (err) {
      console.error("Error deleting budget:", err);
      toast.error("No se pudo eliminar el presupuesto");
    }
  };



  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      budgets.map((budget) => ({
        ID: budget.id,
        Cliente: budget.clientName,
        Título: budget.title,
        Estado: budget.status,
        Monto: budget.amount,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuestos");
    XLSX.writeFile(workbook, "budgets.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [
        [
          "Cliente",
          "Título",
          "Estado",
          "Monto",
        ],
      ],
      body: budgets.map((budget) => [
        budget.clientName || "—",
        budget.title || "—",
        budget.status || "—",
        typeof budget.amount === "number" ? `$${budget.amount}` : "—",
      ]),
    });
    doc.save("budgets.pdf");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <ShinyText size="3xl" weight="bold">Presupuestos</ShinyText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra tus presupuestos.
            </p>
          </div>
        </div>

        <FilterToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por cliente, estado..."
          className="px-2"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline ml-2 font-medium">Excel</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPdf}
              className="h-10 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-rose-50 hover:border-rose-200 transition-all group"
            >
              <FileDown className="h-4 w-4 text-rose-600 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline ml-2 font-medium">PDF</span>
            </Button>
          </div>

          <div className="w-px h-6 bg-slate-200/60 mx-1" />

          <CreateBudgetDialog onBudgetCreated={handleBudgetCreated}>
            <Button className="h-10 rounded-xl bg-slate-900 border-none text-white hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5">
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Presupuesto</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </CreateBudgetDialog>
        </FilterToolbar>



        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-background">
          {loading ? (
            <div className="p-8">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : (
            <BudgetTable
              budgets={budgets}
              onBudgetDeleted={handleBudgetDeleted}
              onBudgetUpdated={loadBudgets}
              searchTerm={searchTerm}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
