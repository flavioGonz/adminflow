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
  Loader2,
  FileSignature,
  CreditCard
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

  const [visibleCount, setVisibleCount] = useState(12);

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

  const visibleClients = sortedClients.slice(0, visibleCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleCount < sortedClients.length) {
        setVisibleCount((prev) => prev + 12);
      }
    }
  };






  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setVisibleCount(12); // Reset count on search
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
      <div className="flex justify-between items-center px-4 md:px-0">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm h-11 rounded-2xl border-slate-200 shadow-sm"
        />
        <div className="flex gap-2">
          <ImportClientsDialog onImportComplete={onImportComplete} />
          <CreateClientDialog onClientCreated={onClientCreated} />
          <Button variant="outline" size="icon" onClick={handleExportExcel} title="Exportar a Excel" className="rounded-xl h-11 w-11 hover:bg-green-50 transition-colors">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportPdf} title="Exportar a PDF" className="rounded-xl h-11 w-11 hover:bg-red-50 transition-colors">
            <FileDown className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>
      <div className="relative border-t border-slate-100 bg-transparent">
        <div className="max-h-[75vh] overflow-y-auto" onScroll={handleScroll}>
          <Table>
            <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="w-[80px] py-4 pl-6">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <Hash className="h-3 w-3" />
                    ID
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("name")} className="cursor-pointer group">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <User className="h-3 w-3" />
                    Nombre
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("alias")} className="cursor-pointer group">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <Users className="h-3 w-3" />
                    Alias
                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <FileSignature className="h-3 w-3" />
                    Contrato
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <CreditCard className="h-3 w-3" />
                    Recurrente
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                   <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <Mail className="h-3 w-3" />
                    Contacto
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <MapPin className="h-3 w-3" />
                    Ubicación
                  </div>
                </TableHead>
                <TableHead className="text-right py-4 pr-6">
                  <div className="flex items-center gap-2 justify-end text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <Settings className="h-3 w-3" />
                    Acciones
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <AnimatedTableBody staggerDelay={0.02}>
              {visibleClients.length > 0 ? (
                visibleClients.map((client, index) => (
                  <AnimatedRow
                    key={client.id}
                    delay={index * 0.02}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="cursor-pointer group/row border-b border-slate-50 last:border-0 hover:bg-white transition-colors"
                  >
                    <TableCell className="py-4 pl-6">
                      <span className="text-xs font-mono font-bold text-slate-400">#{client.numericId || client.id}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <AvatarImage src={client.avatarUrl ? (client.avatarUrl.startsWith('http') ? client.avatarUrl : `${API_URL.replace('/api', '')}${client.avatarUrl}`) : undefined} />
                          <AvatarFallback className="bg-slate-50 text-slate-400">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 tracking-tight">{client.name}</span>
                          {client.contract && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-tighter mt-0.5">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              <span>Contrato Activo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-slate-600">{client.alias || "—"}</span>
                          <div className="flex items-center gap-1.5">
                          {client.hasAccess && (
                            <Lock className="h-3 w-3 text-blue-500" />
                          )}
                          {client.hasDiagram && (
                            <Network className="h-3 w-3 text-emerald-500" />
                          )}
                          {client.hasFiles && (
                            <FolderArchive className="h-3 w-3 text-slate-400" />
                          )}
                          {client.hasImplementation && (
                             <img src="/assets/patchpanel/rj45.png" alt="Impl" className="h-3 w-3 grayscale opacity-50" />
                          )}
                        </div>
                       </div>
                    </TableCell>
                    <TableCell className="py-4">
                         {client.contract ? (
                             <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-[10px] font-bold">
                                 {typeof client.contract === 'string' ? client.contract : 'SÍ'}
                             </Badge>
                         ) : (
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                         )}
                    </TableCell>
                    <TableCell className="py-4">
                        {client.recurringPaymentEnabled ? (
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800">
                                    {new Intl.NumberFormat("es-UY", {
                                        style: "currency",
                                        currency: client.recurringCurrency || "UYU",
                                        maximumFractionDigits: 0,
                                    }).format(client.recurringAmount || 0)}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase">Activo</span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                        )}
                    </TableCell>
                    <TableCell className="py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                           <Mail className="h-3 w-3" />
                           {client.email}
                        </div>
                        {client.phone && (
                           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                              <Phone className="h-2.5 w-2.5" />
                              {client.phone}
                           </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 hidden lg:table-cell max-w-[200px]">
                       <div className="flex items-start gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-slate-500 leading-tight line-clamp-2">{client.address || "Sin dirección"}</span>
                       </div>
                    </TableCell>

                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <EditClientDialog
                          client={client}
                          onClientUpdated={onClientUpdated}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm">
                            <Edit className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </EditClientDialog>
                        <DeleteClientDialog
                          client={client}
                          onClientDeleted={onClientDeleted}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DeleteClientDialog>
                        {client.phone && (
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-emerald-50 hover:text-emerald-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const cleanPhone = client.phone!.replace(/\D/g, "");
                                    window.open(`https://wa.me/${cleanPhone}`, "_blank");
                                }}
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                        )}
                      </div>
                    </TableCell>
                  </AnimatedRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                       <Users className="h-8 w-8 opacity-20" />
                       <span className="text-sm font-medium">No se encontraron clientes</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatedTableBody>
          </Table>
          
          {visibleCount < sortedClients.length && (
             <div className="p-8 text-center border-t border-slate-50">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" />
                <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mt-2">Cargando más clientes</p>
             </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase text-slate-400 tracking-widest pb-4 pr-6">
         <p>Total: {filteredClients.length} clientes</p>
         <p>Mostrando {visibleClients.length}</p>
      </div>
    </div>
  );
}
