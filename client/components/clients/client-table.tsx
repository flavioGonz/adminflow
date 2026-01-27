import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


import { AnimatedTableBody, AnimatedRow } from "@/hooks/use-table-animation";
import {
  Edit,
  Trash2,
  User,
  Users,
  Hash,
  Mail,
  Phone,
  MapPin,
  Settings,
  ArrowUpDown,
  FileSpreadsheet,
  FileDown,
  MessageCircle,
  Bell,
  ShieldCheck,
  Network,
  FolderArchive,
  Lock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { API_URL } from "@/lib/http";

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
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);



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

  const visibleClients = sortedClients;






  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
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
      <div className="relative rounded-md border">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID
                  </div>
                </TableHead>
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
            <AnimatedTableBody staggerDelay={0.03}>
              {visibleClients.length > 0 ? (
                visibleClients.map((client, index) => (
                  <AnimatedRow
                    key={client.id}
                    delay={index * 0.03}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="cursor-pointer group/row"
                  >
                    <TableCell className="font-medium">
                      <span>{client.numericId || client.id}</span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{client.name}</div>
                        {client.contract && (
                          <div className="flex items-center gap-2 text-xs text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Contrato Vigente</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div>{client.alias || "—"}</div>
                        <div className="flex items-center gap-1.5">
                          {client.hasAccess && (
                            <div className="group relative">
                              <Lock
                                className="h-3.5 w-3.5 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/clients/${client.id}/repository/access`);
                                }}
                              />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-slate-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                Datos/Acceso
                              </span>
                            </div>
                          )}
                          {client.hasDiagram && (
                            <div className="group relative">
                              <Network
                                className="h-3.5 w-3.5 text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/clients/${client.id}/diagram`);
                                }}
                              />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-slate-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                Ver diagrama
                              </span>
                            </div>
                          )}
                          {client.hasFiles && (
                            <div className="group relative">
                              <FolderArchive
                                className="h-3.5 w-3.5 text-slate-600 cursor-pointer hover:text-slate-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/repository?search=${encodeURIComponent(client.name)}`);
                                }}
                              />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-slate-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                Ver archivos
                              </span>
                            </div>
                          )}
                          {client.hasImplementation && (
                            <div className="group relative">
                              <button
                                type="button"
                                className="rounded-full border border-transparent bg-white p-0.5 transition hover:border-slate-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/clients/${client.id}/implementation`);
                                }}
                              >
                                <img
                                  src="/assets/patchpanel/rj45.png"
                                  alt="Implementación"
                                  className="h-3.5 w-3.5 object-contain"
                                />
                              </button>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-slate-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                Implementación guardada
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{client.rut}</TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${client.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {client.email}
                      </a>
                    </TableCell>
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
                  </AnimatedRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron clientes.
                  </TableCell>
                </TableRow>
              )}
            </AnimatedTableBody>
          </Table>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
