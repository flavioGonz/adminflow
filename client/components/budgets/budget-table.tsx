import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Edit,
  Trash2,
  ArrowUpDown,
  User,
  CheckCircle,
  DollarSign,
  Tag,
  AlignLeft
} from "lucide-react";
import { Budget } from "@/types/budget";
import Link from "next/link";
import { DeleteBudgetDialog } from "./delete-budget-dialog";

interface BudgetTableProps {
  budgets: Budget[];
  onBudgetDeleted: (budgetId: string) => void;
  searchTerm: string;
}

type SortKey = keyof Budget;

export function BudgetTable({
  budgets,
  onBudgetDeleted,
  searchTerm,
}: BudgetTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const budgetsPerPage = 10;

  const filteredBudgets = useMemo(() => {
    return budgets.filter(
      (budget) =>
        budget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (budget.description && budget.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (budget.status && budget.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (budget.clientName && budget.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (budget.amount && budget.amount.toString().includes(searchTerm))
    );
  }, [budgets, searchTerm]);

  const sortedBudgets = useMemo(() => {
    let sortableItems = [...filteredBudgets];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1;

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBudgets, sortConfig]);

  const currentBudgets = useMemo(() => {
    const indexOfLastBudget = currentPage * budgetsPerPage;
    const indexOfFirstBudget = indexOfLastBudget - budgetsPerPage;
    return sortedBudgets.slice(indexOfFirstBudget, indexOfLastBudget);
  }, [sortedBudgets, currentPage, budgetsPerPage]);

  const totalPages = Math.ceil(sortedBudgets.length / budgetsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("title")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Tag className="h-4 w-4" />
                  Título
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("description")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <AlignLeft className="h-4 w-4" />
                  Descripción
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("status")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4" />
                  Estado
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("amount")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <DollarSign className="h-4 w-4" />
                  Monto
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBudgets.length > 0 ? (
              currentBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {budget.clientName}
                  </TableCell>
                  <TableCell>{budget.title}</TableCell>
                  <TableCell>
                    {budget.description
                      ? budget.description.length > 30
                        ? `${budget.description.slice(0, 30)}...`
                        : budget.description
                      : ""}
                  </TableCell>
                  <TableCell>{budget.status}</TableCell>
                  <TableCell>
                    {budget.amount !== undefined
                      ? new Intl.NumberFormat("es-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(budget.amount)
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/budgets/${budget.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteBudgetDialog
                        budget={budget}
                        onBudgetDeleted={onBudgetDeleted}
                      >
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteBudgetDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron presupuestos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={currentPage === 1 ? undefined : handlePreviousPage}
              aria-disabled={currentPage === 1}
              className={currentPage === 1 ? "opacity-40 pointer-events-none" : undefined}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : handleNextPage}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
