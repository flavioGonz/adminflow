import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateClient } from "@/lib/api-clients";
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
  Columns,
  Rocket,
  Loader2,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientTableProps {
  clients: Client[];
  isLoading?: boolean;
  onClientCreated: (client: Client) => void;
  onClientUpdated: (client: Client) => void;
  onClientDeleted: (clientId: string) => void;
  onImportComplete: () => void;
}

type SortKey = keyof Client;

export function ClientTable({
  clients,
  isLoading = false,
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    name: true,
    alias: true,
    rut: true,
    email: true,
    phone: true,
    address: true,
    notifications: true,
    createdAt: true,
    actions: true,
  });

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

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
    const textIncludes = (value?: string | number | boolean | null) =>
      String(value ?? "").toLowerCase().includes(lowercasedSearchTerm);

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

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [searchTerm, sortConfig?.key, sortConfig?.direction, sortedClients.length]);

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

  const handleToggleNotifications = async (client: Client, checked: boolean) => {
    setTogglingId(client.id);
    try {
      const updated = await updateClient(client.id, { notificationsEnabled: checked });
      onClientUpdated(updated);
      toast.success(`Notificaciones ${checked ? "activadas" : "desactivadas"} para ${client.name}`);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar notificaciones");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-left">
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Columns className="mr-2 h-4 w-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem checked={visibleColumns.id} onCheckedChange={() => toggleColumn("id")}>ID</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.name} onCheckedChange={() => toggleColumn("name")}>Nombre</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.alias} onCheckedChange={() => toggleColumn("alias")}>Alias/Recursos</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.rut} onCheckedChange={() => toggleColumn("rut")}>RUT</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.email} onCheckedChange={() => toggleColumn("email")}>Email</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.phone} onCheckedChange={() => toggleColumn("phone")}>Teléfono</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.address} onCheckedChange={() => toggleColumn("address")}>Dirección</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.notifications} onCheckedChange={() => toggleColumn("notifications")}>Notif.</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={visibleColumns.createdAt} onCheckedChange={() => toggleColumn("createdAt")}>Creado</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
        <div className="relative rounded-md border text-left">
          <div
            ref={tableScrollRef}
            className="overflow-y-auto"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.id && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        ID
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.name && (
                    <TableHead onClick={() => requestSort("name")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Nombre
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.alias && (
                    <TableHead onClick={() => requestSort("alias")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Alias / Recursos
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.rut && (
                    <TableHead onClick={() => requestSort("rut")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Hash className="h-4 w-4" />
                        RUT
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.email && (
                    <TableHead onClick={() => requestSort("email")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" />
                        Email
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.phone && (
                    <TableHead onClick={() => requestSort("phone")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Phone className="h-4 w-4" />
                        Teléfono
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.address && (
                    <TableHead onClick={() => requestSort("address")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <MapPin className="h-4 w-4" />
                        Dirección
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.notifications && (
                    <TableHead onClick={() => requestSort("notificationsEnabled")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Bell className="h-4 w-4" />
                        Notif.
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.createdAt && (
                    <TableHead onClick={() => requestSort("createdAt")}>
                      <div className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Creado
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.actions && (
                    <TableHead className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Settings className="h-4 w-4" />
                        Acciones
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <AnimatedTableBody staggerDelay={0.03}>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        <span className="text-muted-foreground">Cargando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedClients.length > 0 ? (
                  sortedClients.map((client, index) => (
                    <AnimatedRow
                      key={client.id}
                      delay={index * 0.03}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      {visibleColumns.id && (
                        <TableCell className="font-medium text-left">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  client.avatarUrl
                                    ? client.avatarUrl.startsWith("http")
                                      ? client.avatarUrl
                                      : `${API_URL.replace('/api', '')}${client.avatarUrl}`
                                    : undefined
                                }
                                alt={client.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold">
                                {client.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>#{client.id}</span>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell className="font-medium text-left">
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
                      )}
                      {visibleColumns.alias && (
                        <TableCell className="text-left">
                          <div className="space-y-1.5 min-w-[120px]">
                            <div className="truncate max-w-[150px]">{client.alias || "—"}</div>
                            <div className="flex items-center gap-1.5">
                              {client.hasAccess && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="group cursor-pointer p-1 rounded-md hover:bg-blue-50 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/clients/${client.id}/repository/access`);
                                      }}
                                    >
                                      <Lock className="h-4 w-4 text-blue-600" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Datos/Acceso</TooltipContent>
                                </Tooltip>
                              )}
                              {client.hasDiagram && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="group cursor-pointer p-1 rounded-md hover:bg-emerald-50 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/clients/${client.id}/diagram`);
                                      }}
                                    >
                                      <Network className="h-4 w-4 text-emerald-600" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver diagrama</TooltipContent>
                                </Tooltip>
                              )}
                              {client.hasFiles && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="group cursor-pointer p-1 rounded-md hover:bg-slate-100 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/repository?search=${encodeURIComponent(client.name)}`);
                                      }}
                                    >
                                      <FolderArchive className="h-4 w-4 text-slate-600" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver archivos</TooltipContent>
                                </Tooltip>
                              )}
                              {client.hasImplementation && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="group cursor-pointer p-1 rounded-md hover:bg-purple-50 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/clients/${client.id}/implementation`);
                                      }}
                                    >
                                      <Rocket className="h-4 w-4 text-purple-600" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Implementación guardada</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.rut && <TableCell className="text-left">{client.rut || "—"}</TableCell>}
                      {visibleColumns.email && (
                        <TableCell className="text-left">
                          <a
                            href={`mailto:${client.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {client.email}
                          </a>
                        </TableCell>
                      )}
                      {visibleColumns.phone && (
                        <TableCell className="text-left">
                          {client.phone ? (
                            <a
                              href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex"
                            >
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors border-none shadow-none">
                                <MessageCircle className="mr-1 h-3.5 w-3.5" />
                                {client.phone}
                              </Badge>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.address && (
                        <TableCell className="text-left">
                          <div className="max-w-[200px] truncate" title={client.address}>
                            {client.address || "—"}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.notifications && (
                        <TableCell className="text-left">
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                            <Switch
                              checked={!!client.notificationsEnabled}
                              onCheckedChange={(checked) => handleToggleNotifications(client, Boolean(checked))}
                              disabled={togglingId === client.id}
                              className="scale-75 origin-left data-[state=checked]:bg-sky-500"
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.createdAt && (
                        <TableCell className="text-left">
                          {client.createdAt
                            ? new Date(client.createdAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
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
                      )}
                    </AnimatedRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
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
    </TooltipProvider>
  );
}
