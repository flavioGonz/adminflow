"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, FileDown, Copy, Check, Hash, Plus, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { AccessItem } from "@/lib/api-access";
import { AccessRowActions, PasswordCell, IpCell } from "./access-row-actions";
import { getAccessIcon, getAccessLabel, ACCESS_TYPES } from "./icon-map";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccessTableProps {
  data: AccessItem[];
  onUpdate: () => void;
  showExportButton?: boolean;
  onCreateNew?: () => void;
  onExport?: () => void;
}

export const exportAccessToExcel = (data: AccessItem[]) => {
  const exportData = data.map((item) => ({
    Equipo: item.equipo,
    Tipo: getAccessLabel(item.tipo_equipo),
    "IP/URL": item.ip || "",
    Usuario: item.user || "",
    Contraseña: item.pass || "",
    "Serie/MAC": item.serieMac || "",
    Comentarios: item.comentarios || "",
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Accesos");
  XLSX.writeFile(wb, `accesos-${new Date().toISOString().split("T")[0]}.xlsx`);
  toast.success("Exportado a Excel correctamente");
};

// Copy button component
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value || value === "") return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Error al copiar");
    }
  };

  if (!value || value === "") return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 ml-2"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function AccessTable({ data, onUpdate, onCreateNew, onExport }: AccessTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<AccessItem>[] = [
    {
      accessorKey: "equipo",
      header: "Equipo",
      cell: ({ row }) => {
        const Icon = getAccessIcon(row.original.tipo_equipo);
        return (
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-slate-100 p-1 dark:bg-slate-800">
              <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="font-medium">{row.getValue("equipo")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "tipo_equipo",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {getAccessLabel(row.getValue("tipo_equipo"))}
        </span>
      ),
    },
    {
      accessorKey: "ip",
      header: "IP / URL",
      cell: ({ row }) => {
        const value = row.getValue("ip") as string;
        return (
          <div className="flex items-center">
            <IpCell value={value} />
            <CopyButton value={value} />
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Usuario",
      cell: ({ row }) => {
        const value = row.getValue("user") as string;
        return (
          <div className="flex items-center">
            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
              {value || "—"}
            </span>
            <CopyButton value={value} />
          </div>
        );
      },
    },
    {
      accessorKey: "pass",
      header: "Contraseña",
      cell: ({ row }) => {
        const value = row.getValue("pass") as string;
        return (
          <div className="flex items-center">
            <PasswordCell value={value} />
            <CopyButton value={value} />
          </div>
        );
      },
    },
    {
      accessorKey: "serieMac",
      header: "Serie / MAC",
      cell: ({ row }) => {
        const value = row.getValue("serieMac") as string;
        return (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-slate-500" />
            <span className="font-mono text-sm">{value || "N/D"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "comentarios",
      header: "Comentarios",
      cell: ({ row }) => (
        <span
          className="line-clamp-1 text-muted-foreground max-w-[200px]"
          title={row.getValue("comentarios")}
        >
          {row.getValue("comentarios") || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <AccessRowActions access={row.original} onUpdate={onUpdate} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const exportToExcel = () => exportAccessToExcel(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por equipo..."
              value={(table.getColumn("equipo")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("equipo")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Select
              value={(table.getColumn("tipo_equipo")?.getFilterValue() as string) ?? "all"}
              onValueChange={(value) =>
                table.getColumn("tipo_equipo")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[200px] pl-9">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {ACCESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(onCreateNew || onExport) && (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {onCreateNew && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onCreateNew}
                      size="icon"
                      className="h-9 w-9 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nuevo Acceso</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onExport}
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-green-600 text-green-700 hover:bg-green-50"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar Excel</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin accesos cargados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
