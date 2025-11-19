// client/components/clients/client-table.tsx
import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
  User,
  Users,
  Hash,
  Mail,
  Phone,
  MapPin,
  FileText,
  Settings,
  ArrowUpDown,
  FileSpreadsheet,
  FileDown,

  MessageCircle,
  Bell,
  BellOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditClientDialog } from "./edit-client-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";
import { ImportClientsDialog } from "./import-clients-dialog";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CreateClientDialog } from "./create-client-dialog";
import { Client } from "@/types/client";

interface ClientTableProps {
  clients: Client[];
  onClientCreated: (client: Client) => void;
  onClientUpdated: (client: Client) => void;
  onClientDeleted: (clientId: string) => void;
  onImportComplete: () => void;
}

type SortKey = keyof Client;

export function ClientTable({
  clients,
  onClientCreated,
  onClientUpdated,
  onClientDeleted,
  onImportComplete,
}: ClientTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const clientsPerPage = 10;

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(sortedClients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "clients.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Nombre', 'Alias', 'RUT', 'Email', 'Teléfono', 'Dirección', 'Contrato']],
      body: sortedClients.map((client) => [
        client.name || "—",
        client.alias || "—",
        client.rut || "—",
        client.email || "—",
        client.phone || "—",
        client.address || "—",
        client.contract ? "Sí" : "No",
      ]),
    });
    doc.save('clients.pdf');
  };

  const filteredClients = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const textIncludes = (value?: string) =>
      (value ?? "").toLowerCase().includes(lowercasedSearchTerm);

    return clients.filter((client) => {
      const contractStatus = client.contract ? "activo" : "inactivo";
      return (
        textIncludes(client.name) ||
        textIncludes(client.email) ||
        textIncludes(client.phone) ||
        textIncludes(client.alias) ||
        textIncludes(client.rut) ||
        textIncludes(client.address) ||
        contractStatus.includes(lowercasedSearchTerm)
      );
    });
  }, [clients, searchTerm]);

  const sortedClients = sortConfig
    ? (() => {
      const { key, direction } = sortConfig;
      return [...filteredClients].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return direction === "ascending" ? 1 : -1;
        if (bValue === undefined) return direction === "ascending" ? -1 : 1;
        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    })()
    : filteredClients;

  const currentClients = useMemo(() => {
    const indexOfLastClient = currentPage * clientsPerPage;
    const indexOfFirstClient = indexOfLastClient - clientsPerPage;
    return sortedClients.slice(indexOfFirstClient, indexOfLastClient);
  }, [sortedClients, currentPage, clientsPerPage]);

  const totalPages = Math.ceil(sortedClients.length / clientsPerPage);

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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search
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
      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <ImportClientsDialog onImportComplete={onImportComplete} />
          <CreateClientDialog onClientCreated={onClientCreated} />
          <Button variant="outline" size="icon" onClick={handleExportExcel} title="Exportar a Excel">
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportPdf} title="Exportar a PDF">
            <FileDown className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("name")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  Nombre
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("alias")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  Alias
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("rut")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Hash className="h-4 w-4" />
                  RUT
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("email")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("phone")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  Teléfono
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("address")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  Dirección
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("contract")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Contrato
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("notificationsEnabled")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  Notif.
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => requestSort("createdAt")}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Creado
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
            {currentClients.length > 0 ? (
              currentClients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.alias}</TableCell>
                  <TableCell>{client.rut}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    {client.phone ? (
                      <a
                        href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex"
                      >
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <MessageCircle className="mr-1 h-3.5 w-3.5" />
                          {client.phone}
                        </Badge>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell>
                    <Badge variant={client.contract ? "default" : "destructive"}>
                      {client.contract ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.notificationsEnabled !== false ? (
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                        <Bell className="mr-1 h-3 w-3" />
                        Sí
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                        <BellOff className="mr-1 h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <EditClientDialog
                        client={client}
                        onClientUpdated={onClientUpdated}
                      >
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditClientDialog>
                      <DeleteClientDialog
                        client={client}
                        onClientDeleted={onClientDeleted}
                      >
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </DeleteClientDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron clientes.
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
            >
              Anterior
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={currentPage === totalPages ? undefined : handleNextPage}
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages ? "opacity-40 pointer-events-none" : undefined
              }
            >
              Siguiente
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
