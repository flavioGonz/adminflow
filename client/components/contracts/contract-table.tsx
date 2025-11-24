import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  Calendar,
  Tag,
  User,
  CheckCircle,
  Upload,
  DollarSign,
  Eye,
  EllipsisVertical,
  Check,
  Clock3,
  ClipboardList,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import ReactCountryFlag from "react-country-flag";
import { PdfViewerModal } from "./pdf-viewer-modal";
import { EditContractDialog } from "./edit-contract-dialog";
import { DeleteContractDialog } from "./delete-contract-dialog";
import { UploadContractDialog } from "./upload-contract-dialog";
import { Contract } from "@/types/contract";

interface ContractTableProps {
  contracts: Contract[];
  onContractUpdated: (contract: Contract) => void;
  onContractDeleted: (contractId: string) => void;
  searchTerm: string;
}

type SortKey = "id" | "clientName" | "title" | "startDate" | "endDate" | "status" | "amount";

export function ContractTable({
  contracts,
  onContractUpdated,
  onContractDeleted,
  searchTerm,
}: ContractTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [currentPdfPath, setCurrentPdfPath] = useState<string | undefined>(undefined);
  const contractsPerPage = 10;

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const term = searchTerm.toLowerCase();
      return (
        contract.title.toLowerCase().includes(term) ||
        (contract.status && contract.status.toLowerCase().includes(term)) ||
        (contract.clientId && contract.clientId.toLowerCase().includes(term)) ||
        (contract.sla && contract.sla.toLowerCase().includes(term)) ||
        (contract.contractType && contract.contractType.toLowerCase().includes(term)) ||
        (contract.amount && contract.amount.toString().includes(term)) ||
        (contract.clientName && contract.clientName.toLowerCase().includes(term))
      );
    });
  }, [contracts, searchTerm]);

  const sortedContracts = useMemo(() => {
    let sortableItems = [...filteredContracts];
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
  }, [filteredContracts, sortConfig]);

  const currentContracts = useMemo(() => {
    const indexOfLastContract = currentPage * contractsPerPage;
    const indexOfFirstContract = indexOfLastContract - contractsPerPage;
    return sortedContracts.slice(indexOfFirstContract, indexOfLastContract);
  }, [sortedContracts, currentPage]);

  const totalPages = Math.ceil(sortedContracts.length / contractsPerPage);

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

  const currencyInfo = (currency?: string) => {
    if (!currency) return { label: "Sin moneda", flagCode: null };
    const norm = currency.toUpperCase();
    if (norm === "USD" || norm === "US" || norm === "DOLAR") {
      return { label: "USD", flagCode: "US" };
    }
    if (norm === "UYU" || norm === "UY" || norm === "PESO" || norm === "UYU$") {
      return { label: "UYU", flagCode: "UY" };
    }
    return { label: norm, flagCode: null };
  };

  const statusBadge = (status?: string) => {
    const value = status?.toLowerCase() || "";
    if (value.includes("activo")) return { className: "bg-emerald-600 text-white", emoji: "✅", label: "Activo" };
    if (value.includes("venc")) return { className: "bg-rose-600 text-white", emoji: "⏳", label: "Vencido" };
    if (value.includes("curso")) return { className: "bg-amber-600 text-white", emoji: "🚀", label: "En curso" };
    if (value.includes("nuevo")) return { className: "bg-slate-700 text-white", emoji: "🆕", label: "Nuevo" };
    if (value.includes("renov")) return { className: "bg-teal-600 text-white", emoji: "♻️", label: "Renovado" };
    return { className: "bg-slate-600 text-white", emoji: "📄", label: status || "Sin estado" };
  };

  const requestSort = (key: SortKey) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-gradient-to-b from-white to-slate-50 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70">
              <TableHead onClick={() => requestSort("id")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <Check className="h-4 w-4" />
                  ID #
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("title")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <Tag className="h-4 w-4" />
                  Título
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>
              <TableHead onClick={() => requestSort("startDate")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <Calendar className="h-4 w-4" />
                  Fecha Inicio
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>
              <TableHead onClick={() => requestSort("endDate")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <Calendar className="h-4 w-4" />
                  Fecha Fin
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>
              <TableHead onClick={() => requestSort("status")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <CheckCircle className="h-4 w-4" />
                  Estado
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>
              <TableHead onClick={() => requestSort("amount")}>
                <button className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <DollarSign className="h-4 w-4" />
                  Monto
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                </button>
              </TableHead>

              <TableHead className="text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentContracts.length > 0 ? (
              currentContracts.map((contract) => (
                <TableRow key={contract.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-800 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      #{contract.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {contract.clientId ? (
                      <Link
                        href={`/clients/${contract.clientId}`}
                        className="text-slate-900 underline-offset-2 hover:text-slate-700 hover:underline"
                      >
                        {contract.clientName || "Cliente sin nombre"}
                      </Link>
                    ) : (
                      <span className="text-slate-500">Cliente no asignado</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="space-y-2">
                      <div className="text-base font-semibold text-slate-900">{contract.title}</div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                        {contract.sla && (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            SLA {contract.sla}
                          </span>
                        )}
                        {contract.contractType && (
                          <span className="inline-flex items-center gap-1">
                            <ClipboardList className="h-3 w-3" />
                            {contract.contractType}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-900 text-white">
                      {contract.startDate || "Sin fecha"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-800 text-white">
                      {contract.endDate || "Sin fecha"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const badge = statusBadge(contract.status);
                      return (
                        <span className={`${badge.className} inline-flex items-center gap-1 rounded px-2 py-1 text-sm`}>
                          <span>{badge.emoji}</span>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const info = currencyInfo(contract.currency);
                        return (
                          <div className="flex items-center gap-2 text-slate-700">
                            {info.flagCode && (
                              <ReactCountryFlag
                                svg
                              countryCode={info.flagCode}
                              className="inline-block h-4 w-5"
                                aria-label={info.label}
                              />
                            )}
                            <span className="text-sm font-semibold">{info.label}</span>
                          </div>
                        );
                      })()}
                      <span className="text-slate-900">
                        {contract.amount !== undefined
                          ? new Intl.NumberFormat("es-UY", {
                              style: "currency",
                              currency: contract.currency?.toUpperCase() === "USD" ? "USD" : "UYU",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(contract.amount)
                          : "Sin monto"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="Acciones">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {contract.filePath && (
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setCurrentPdfPath(contract.filePath);
                              setIsPdfViewerOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Ver contrato
                          </DropdownMenuItem>
                        )}
                        <UploadContractDialog contract={contract} onContractUpdated={onContractUpdated}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                            <Upload className="h-4 w-4" />
                            Subir PDF
                          </DropdownMenuItem>
                        </UploadContractDialog>
                        <EditContractDialog contract={contract} onContractUpdated={onContractUpdated}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        </EditContractDialog>
                        <DeleteContractDialog contract={contract} onContractDeleted={onContractDeleted}>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="gap-2 text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DeleteContractDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron contratos.
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

      <PdfViewerModal
        isOpen={isPdfViewerOpen}
        onClose={() => setIsPdfViewerOpen(false)}
        filePath={currentPdfPath}
      />
    </div>
  );
}
