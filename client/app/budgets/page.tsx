"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const metrics = useMemo(() => {
    if (!budgets.length) {
      return {
        total: 0,
        approved: 0,
        pending: 0,
      };
    }
    const approved = budgets.filter(
      (budget) => budget.status?.toLowerCase() === "aprobado"
    ).length;
    const pending = budgets.filter(
      (budget) => budget.status?.toLowerCase() === "nuevo" || budget.status?.toLowerCase() === "enviado"
    ).length;
    return {
      total: budgets.length,
      approved,
      pending,
    };
  }, [budgets]);

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
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
          <div className="flex flex-wrap gap-2">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por cliente, estado..."
              className="w-64"
            />
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPdf}>
              <FileDown className="mr-2 h-4 w-4 text-red-500" />
              PDF
            </Button>
            <CreateBudgetDialog onBudgetCreated={handleBudgetCreated}>
              <Button className="bg-blue-600 text-white hover:bg-blue-500">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </CreateBudgetDialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Presupuestos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Aprobados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metrics.pending}</p>
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
