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
  AlignLeft,
  Package,
  Calendar,
} from "lucide-react";
import { Budget } from "@/types/budget";
import Link from "next/link";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import ReactCountryFlag from "react-country-flag";
import { fetchBudgetItems } from "@/lib/api-budgets";
import { BudgetItem } from "@/types/budget-item";

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

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsByBudget, setItemsByBudget] = useState<Record<string, BudgetItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

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
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const toggleExpand = async (budgetId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(budgetId)) {
        next.delete(budgetId);
      } else {
        next.add(budgetId);
      }
      return next;
    });

    if (!itemsByBudget[budgetId]) {
      setLoadingItems((prev) => ({ ...prev, [budgetId]: true }));
      try {
        const items = await fetchBudgetItems(budgetId);
        setItemsByBudget((prev) => ({ ...prev, [budgetId]: items }));
      } catch (error) {
        console.error("Error cargando items de presupuesto", error);
      } finally {
        setLoadingItems((prev) => ({ ...prev, [budgetId]: false }));
      }
    }
  };

  const currencyInfo = (currency?: string) => {
    if (!currency) return { label: "UYU", code: "UY" };
    const norm = currency.toUpperCase();
    if (norm === "USD" || norm === "US" || norm === "DOLAR") {
      return { label: "USD", code: "US" };
    }
    if (norm === "UYU" || norm === "UY" || norm === "PESO") {
      return { label: "UYU", code: "UY" };
    }
    return { label: norm, code: undefined };
  };

  const formatCurrency = (value: number, code: string) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: code }).format(value);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
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
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Creación
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentBudgets.length > 0 ? (
              currentBudgets.map((budget) => {
                const isOpen = expandedRows.has(budget.id);
                const items = itemsByBudget[budget.id] || [];
                const currency = currencyInfo(budget.currency);
                return (
                  <React.Fragment key={budget.id}>
                    <TableRow className="align-top">
                      <TableCell className="w-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(budget.id)}
                          aria-label={isOpen ? "Contraer" : "Expandir"}
                        >
                          {isOpen ? "-" : "+"}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{budget.clientName}</TableCell>
                      <TableCell>{budget.title}</TableCell>
                      <TableCell>
                        {budget.description
                          ? budget.description.length > 30
                            ? `${budget.description.slice(0, 30)}...`
                            : budget.description
                          : ""}
                      </TableCell>
                      <TableCell>
                        {budget.createdAt
                          ? new Date(budget.createdAt).toLocaleDateString("es-UY")
                          : ""}
                      </TableCell>
                      <TableCell>{budget.status}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {currency.code && (
                            <ReactCountryFlag
                              svg
                              countryCode={currency.code}
                              className="inline-block h-4 w-5 rounded-sm"
                              aria-label={currency.label}
                            />
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold text-slate-700">
                            {currency.label}
                          </span>
                          {budget.amount !== undefined
                            ? new Intl.NumberFormat("es-UY", {
                                style: "currency",
                                currency: currency.label === "USD" ? "USD" : "UYU",
                              }).format(budget.amount)
                            : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/budgets/${budget.id}`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteBudgetDialog budget={budget} onBudgetDeleted={onBudgetDeleted}>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DeleteBudgetDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="bg-slate-50/60">
                        <TableCell colSpan={8} className="p-0">
                          <div className="px-6 py-4">
                            <p className="mb-2 text-sm font-semibold text-slate-700">
                              Productos / servicios cotizados
                            </p>
                            {loadingItems[budget.id] ? (
                              <p className="text-xs text-muted-foreground">Cargando items...</p>
                            ) : items.length ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="text-left text-xs uppercase text-slate-500">
                                    <tr>
                                      <th className="py-2 pr-4">#</th>
                                      <th className="py-2 pr-4">Producto</th>
                                      <th className="py-2 pr-4">Cantidad</th>
                                      <th className="py-2 pr-4">Unitario</th>
                                      <th className="py-2 pr-4">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="text-slate-700">
                                    {items.map((item, index) => (
                                    <tr key={item.id} className="border-t text-[13px]">
                                      <td className="py-2 pr-4 font-semibold text-slate-600">{index + 1}</td>
                                      <td className="py-2 pr-4">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-3.5 w-3.5 text-slate-600" />
                                          <span>{item.productName || item.description}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 pr-4">{item.quantity}</td>
                                      <td className="py-2 pr-4">
                                        {(() => {
                                          const unit = item.unitPrice ?? (item.total && item.quantity ? item.total / item.quantity : 0);
                                          return (
                                          <div className="flex items-center gap-2">
                                            {currency.code && (
                                              <ReactCountryFlag
                                                svg
                                                countryCode={currency.code}
                                                className="inline-block h-3.5 w-5 rounded-sm"
                                                aria-label={currency.label}
                                              />
                                            )}
                                            <span>{formatCurrency(unit, currency.label === "USD" ? "USD" : "UYU")}</span>
                                          </div>
                                          );
                                        })()}
                                      </td>
                                      <td className="py-2 pr-4 font-semibold">
                                        {(() => {
                                          const total = item.total ?? (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0);
                                          return (
                                          <div className="flex items-center gap-2">
                                            {currency.code && (
                                              <ReactCountryFlag
                                                svg
                                                countryCode={currency.code}
                                                className="inline-block h-3.5 w-5 rounded-sm"
                                                aria-label={currency.label}
                                              />
                                            )}
                                            <span>{formatCurrency(total, currency.label === "USD" ? "USD" : "UYU")}</span>
                                          </div>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">Sin productos/servicios cargados.</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
              className={currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
