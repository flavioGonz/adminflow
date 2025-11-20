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
import { AccessItem } from "@/lib/api-access";
import { AccessRowActions, PasswordCell, IpCell } from "./access-row-actions";
import { getAccessIcon, getAccessLabel, ACCESS_TYPES } from "./icon-map";

interface AccessTableProps {
    data: AccessItem[];
    onUpdate: () => void;
}

export function AccessTable({ data, onUpdate }: AccessTableProps) {
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
            cell: ({ row }) => <IpCell value={row.getValue("ip")} />,
        },
        {
            accessorKey: "user",
            header: "Usuario",
            cell: ({ row }) => (
                <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                    {row.getValue("user") || "—"}
                </span>
            ),
        },
        {
            accessorKey: "pass",
            header: "Contraseña",
            cell: ({ row }) => <PasswordCell value={row.getValue("pass")} />,
        },
        {
            accessorKey: "comentarios",
            header: "Comentarios",
            cell: ({ row }) => (
                <span className="line-clamp-1 text-muted-foreground max-w-[200px]" title={row.getValue("comentarios")}>
                    {row.getValue("comentarios") || "—"}
                </span>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <AccessRowActions access={row.original} onUpdate={onUpdate} />
            ),
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

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Filtrar por nombre..."
                    value={(table.getColumn("equipo")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("equipo")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Select
                    value={(table.getColumn("tipo_equipo")?.getFilterValue() as string) ?? "all"}
                    onValueChange={(value) =>
                        table.getColumn("tipo_equipo")?.setFilterValue(value === "all" ? "" : value)
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo de equipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {ACCESS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
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
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No hay accesos registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
