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
import Link from "next/link";
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
  FileText,
  Settings,
  ArrowUpDown,
  Calendar, // For startDate/endDate
  Tag, // For title
  AlignLeft, // For description
  User, // For clientId
  CheckCircle, // For status
  Upload, // For file upload
  Clock, // For SLA
  ClipboardList, // For Contract Type
  DollarSign, // For Amount
  Eye, // For viewing contract
} from "lucide-react";
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

type SortKey = keyof Contract;

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
    return contracts.filter(
      (contract) =>
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contract.description && contract.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.status && contract.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.clientId && contract.clientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.sla && contract.sla.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.contractType && contract.contractType.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contract.amount && contract.amount.toString().includes(searchTerm)) ||
        (contract.clientName && contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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
  }, [sortedContracts, currentPage, contractsPerPage]);

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
              <TableHead onClick={() => requestSort("startDate")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  Fecha Inicio
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("endDate")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4" />
                  Fecha Fin
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
              <TableHead onClick={() => requestSort("sla")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  SLA
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("contractType")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <ClipboardList className="h-4 w-4" />
                  Tipo Contrato
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
                <div className="flex items-center gap-2 justify-end">
                  <Settings className="h-4 w-4" />
                  Acciones
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentContracts.length > 0 ? (
              currentContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.clientName}
                  </TableCell>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.description}</TableCell>
                  <TableCell>{contract.startDate}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>{contract.status}</TableCell>
                  <TableCell>{contract.sla}</TableCell>
                  <TableCell>{contract.contractType}</TableCell>
                  <TableCell>
                    {contract.amount !== undefined
                      ? new Intl.NumberFormat("es-US", {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(contract.amount)
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {contract.filePath && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Contrato"
                          onClick={() => {
                            setCurrentPdfPath(contract.filePath);
                            setIsPdfViewerOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <UploadContractDialog contract={contract} onContractUpdated={onContractUpdated}>
                        <Button variant="ghost" size="icon" title="Subir Contrato">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </UploadContractDialog>
                      <EditContractDialog
                        contract={contract}
                        onContractUpdated={onContractUpdated}
                      >
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditContractDialog>
                      <DeleteContractDialog
                        contract={contract}
                        onContractDeleted={onContractDeleted}
                      >
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DeleteContractDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
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
              className={
                currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined
              }
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
