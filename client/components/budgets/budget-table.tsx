import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  Edit,
  Trash2,
  ArrowUpDown,
  User,
  Users,
  Hash,
  CheckCircle,
  DollarSign,
  Tag,
  AlignLeft,
  Package,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/http";
import { toast } from "sonner";
import { Budget } from "@/types/budget";
import { Group } from "@/types/group";
import Link from "next/link";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import ReactCountryFlag from "react-country-flag";
import { fetchBudgetItems } from "@/lib/api-budgets";
import { BudgetItem } from "@/types/budget-item";

interface BudgetTableProps {
  budgets: Budget[];
  onBudgetDeleted: (budgetId: string) => void;
  searchTerm: string;
  onBudgetUpdated?: () => void;
}

type AssignmentUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
};

type SortKey = keyof Budget;

type ColumnKey =
  | "creation"
  | "id"
  | "client"
  | "title"
  | "description"
  | "status"
  | "assigned"
  | "amount";

const COLUMN_OPTIONS: { key: ColumnKey; label: string }[] = [
  { key: "creation", label: "Creación" },
  { key: "id", label: "ID" },
  { key: "client", label: "Cliente" },
  { key: "title", label: "Título" },
  { key: "description", label: "Descripción" },
  { key: "status", label: "Estado" },
  { key: "assigned", label: "Asignado" },
  { key: "amount", label: "Monto" },
];

export function BudgetTable({
  budgets,
  onBudgetDeleted,
  onBudgetUpdated,
  searchTerm,
}: BudgetTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "ascending" | "descending";
  } | null>(null);
  const LOAD_INCREMENT = 15;
  const [visibleCount, setVisibleCount] = useState(LOAD_INCREMENT);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsByBudget, setItemsByBudget] = useState<Record<string, BudgetItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [users, setUsers] = useState<AssignmentUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignPopoverOpen, setAssignPopoverOpen] = useState<string | null>(null);
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(
    COLUMN_OPTIONS.map((column) => column.key)
  );

  const hasColumn = (key: ColumnKey) => visibleColumns.includes(key);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((col) => col !== key);
      }
      const next = new Set(prev);
      next.add(key);
      return COLUMN_OPTIONS.filter((column) => next.has(column.key)).map(
        (column) => column.key
      );
    });
  };
  const rowColSpan = visibleColumns.length + 2;

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        const response = await fetch(`${API_URL}/groups`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los grupos.");
        }
        const data = await response.json();
        setGroups(data);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching groups:", err);
      }
    };
    loadGroups();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios.");
        }
        const data = await response.json();
        const normalized = data.map((user: any) => ({
          id: user.id ?? user._id ?? user.email,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          avatar: user.avatar || null,
        }));
        setUsers(normalized);
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") {
          return;
        }
        console.error("Error fetching users:", err);
      }
    };
    loadUsers();
    return () => controller.abort();
  }, []);

  const groupsMap = useMemo(() => {
    const map: Record<string, Group> = {};
    groups.forEach((group) => {
      if (group._id) {
        map[group._id] = group;
      }
    });
    return map;
  }, [groups]);

  const filteredBudgets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return budgets.filter((budget) => {
      const matchesTitle = budget.title.toLowerCase().includes(term);
      const matchesDescription = budget.description?.toLowerCase().includes(term);
      const matchesStatus = budget.status?.toLowerCase().includes(term);
      const matchesClient = budget.clientName?.toLowerCase().includes(term);
      const matchesId = budget.id?.toLowerCase().includes(term);
      const matchesAssignedTo = budget.assignedTo?.toLowerCase().includes(term);
      const matchesAmount =
        budget.amount !== undefined &&
        budget.amount.toString().includes(term);

      return (
        matchesTitle ||
        matchesDescription ||
        matchesStatus ||
        matchesClient ||
        matchesId ||
        matchesAssignedTo ||
        matchesAmount
      );
    });
  }, [budgets, searchTerm]);

  const sortedBudgets = useMemo(() => {
    let sortableItems = [...filteredBudgets];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined || aValue === null) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === "ascending" ? -1 : 1;

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

  const visibleBudgets = useMemo(() => sortedBudgets.slice(0, visibleCount), [
    sortedBudgets,
    visibleCount,
  ]);
  const hasMoreResults = visibleCount < sortedBudgets.length;

  const handleScroll = useCallback(() => {
    const container = tableScrollRef.current;
    if (!container || !hasMoreResults) {
      return;
    }
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 150) {
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_INCREMENT, sortedBudgets.length)
      );
    }
  }, [hasMoreResults, sortedBudgets.length]);

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

  const handleAssignedToChange = async (budget: Budget, userEmail: string | null) => {
    setUpdatingAssignmentId(budget.id);
    try {
      const response = await fetch(`${API_URL}/budgets/${budget.id}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: userEmail,
          assignedGroupId: null,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar asignación (${response.status})`);
      }
      onBudgetUpdated?.();
      toast.success(userEmail ? `Asignado a ${userEmail}` : "Asignación eliminada");
      setAssignPopoverOpen(null);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar la asignación");
    } finally {
      setUpdatingAssignmentId(null);
    }
  };

  const handleGroupAssignmentChange = async (budget: Budget, groupId: string | null) => {
    setUpdatingAssignmentId(budget.id);
    try {
      const response = await fetch(`${API_URL}/budgets/${budget.id}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedGroupId: groupId,
          assignedTo: null,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error al actualizar el grupo (${response.status})`);
      }
      onBudgetUpdated?.();
      const groupName = groupId ? groupsMap[groupId]?.name || "grupo" : "";
      toast.success(groupId ? `Asignado al grupo ${groupName}` : "Asignación de grupo eliminada");
      setAssignPopoverOpen(null);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el grupo");
    } finally {
      setUpdatingAssignmentId(null);
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

  useEffect(() => {
    setVisibleCount(LOAD_INCREMENT);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [
    sortedBudgets.length,
    sortConfig?.key,
    sortConfig?.direction,
    searchTerm,
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm text-muted-foreground">Columnas visibles</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Columnas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                {COLUMN_OPTIONS.map((column) => {
                  const isChecked = visibleColumns.includes(column.key);
                  const isDisabled = visibleColumns.length === 1 && isChecked;
                  return (
                    <label
                      key={column.key}
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      <Checkbox
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={() => toggleColumn(column.key)}
                      />
                      <span className={isDisabled ? "text-slate-400" : ""}>{column.label}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="relative">
          <div
            ref={tableScrollRef}
            className="max-h-[65vh] overflow-y-auto"
            onScroll={handleScroll}
          >
            <Table>
            <TableHeader>
              <TableRow>
              <TableHead />
              {hasColumn("creation") && (
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Creación
                  </div>
                </TableHead>
              )}
              {hasColumn("id") && (
                <TableHead onClick={() => requestSort("id")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Hash className="h-4 w-4" />
                    ID
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {hasColumn("client") && (
                <TableHead onClick={() => requestSort("clientName")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Cliente
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {hasColumn("title") && (
                <TableHead onClick={() => requestSort("title")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Tag className="h-4 w-4" />
                    Título
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {hasColumn("description") && (
                <TableHead onClick={() => requestSort("description")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <AlignLeft className="h-4 w-4" />
                    Descripción
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {hasColumn("status") && (
                <TableHead onClick={() => requestSort("status")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4" />
                    Estado
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              {hasColumn("assigned") && (
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Asignado
                  </div>
                </TableHead>
              )}
              {hasColumn("amount") && (
                <TableHead onClick={() => requestSort("amount")}>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <DollarSign className="h-4 w-4" />
                    Monto
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
              )}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleBudgets.length > 0 ? (
              visibleBudgets.map((budget) => {
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
                      {hasColumn("creation") && (
                        <TableCell>
                          {budget.createdAt
                            ? new Date(budget.createdAt).toLocaleDateString("es-UY")
                            : ""}
                        </TableCell>
                      )}
                      {hasColumn("id") && (
                        <TableCell className="font-mono text-xs text-slate-500">{budget.id}</TableCell>
                      )}
                      {hasColumn("client") && (
                        <TableCell className="font-medium">{budget.clientName}</TableCell>
                      )}
                      {hasColumn("title") && <TableCell>{budget.title}</TableCell>}
                      {hasColumn("description") && (
                        <TableCell>
                          {budget.description
                            ? budget.description.length > 30
                              ? `${budget.description.slice(0, 30)}...`
                              : budget.description
                            : ""}
                        </TableCell>
                      )}
                      {hasColumn("status") && <TableCell>{budget.status}</TableCell>}
                      {hasColumn("assigned") && (
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Popover
                            open={assignPopoverOpen === budget.id}
                            onOpenChange={(open) => setAssignPopoverOpen(open ? budget.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-full justify-start font-normal px-2"
                                disabled={updatingAssignmentId === budget.id}
                              >
                                <div className="flex items-center gap-2 text-left">
                                  {(() => {
                                    const assignedUser =
                                      budget.assignedTo && budget.assignedTo.length
                                        ? users.find((user) => user.email === budget.assignedTo)
                                        : null;
                                    const avatarUrl = assignedUser?.avatar
                                      ? assignedUser.avatar.startsWith("http")
                                        ? assignedUser.avatar
                                        : `${API_URL.replace("/api", "")}${assignedUser.avatar}`
                                      : null;
                                    if (avatarUrl) {
                                      return (
                                        <img
                                          src={avatarUrl}
                                          alt={budget.assignedTo || 'User'}
                                          className="h-8 w-8 rounded-full object-cover"
                                        />
                                      );
                                    }
                                    if (budget.assignedTo) {
                                      return (
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                          {budget.assignedTo.charAt(0).toUpperCase()}
                                        </div>
                                      );
                                    }
                                    return (
                                      <Users className="h-5 w-5 text-slate-500" aria-hidden />
                                    );
                                  })()}
                                  <div className="flex flex-col">
                                    {budget.assignedGroupId && hasColumn("assigned") && (
                                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                        <Users className="h-3.5 w-3.5 text-slate-500" />
                                        {groupsMap[budget.assignedGroupId]?.name || "Grupo asignado"}
                                      </span>
                                    )}
                                    {budget.assignedTo ? (
                                      <span className="truncate max-w-[120px]" title={budget.assignedTo}>
                                        {budget.assignedTo.split("@")[0]}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400 italic">Sin asignar</span>
                                    )}
                                  </div>
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Buscar usuario o grupo..." />
                                <CommandList>
                                  <CommandEmpty>No se encontró coincidencia.</CommandEmpty>
                                  {groups.length > 0 && (
                                    <CommandGroup heading="Grupos">
                                      <CommandItem onSelect={() => handleGroupAssignmentChange(budget, null)}>
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            !budget.assignedGroupId ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-slate-500" />
                                          <span>Sin grupo</span>
                                        </div>
                                      </CommandItem>
                                      {groups.map((group) => {
                                        const groupId = group._id || group.id || "";
                                        if (!groupId) {
                                          return null;
                                        }
                                        return (
                                          <CommandItem
                                            key={groupId}
                                            onSelect={() => handleGroupAssignmentChange(budget, groupId)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                budget.assignedGroupId === groupId
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            <div className="flex items-center gap-2">
                                              <Users className="h-4 w-4 text-slate-500" />
                                              <div className="flex flex-col">
                                                <span>{group.name}</span>
                                                {group.description ? (
                                                  <span className="text-[11px] text-muted-foreground">
                                                    {group.description}
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                  )}
                                  <CommandGroup heading="Usuarios">
                                    <CommandItem onSelect={() => handleAssignedToChange(budget, null)}>
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          !budget.assignedTo ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span className="text-slate-400 italic">Sin asignar</span>
                                    </CommandItem>
                                    {users.map((user) => (
                                      <CommandItem
                                        key={user.id}
                                        onSelect={() => handleAssignedToChange(budget, user.email)}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            budget.assignedTo === user.email ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex items-center gap-2">
                                          {user.avatar ? (
                                            <img
                                              src={
                                                user.avatar.startsWith("http")
                                                  ? user.avatar
                                                  : `${API_URL.replace("/api", "")}${user.avatar}`
                                              }
                                              alt={user.email}
                                              className="h-6 w-6 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                              {user.email.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-sm">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      )}
                      {hasColumn("amount") && (
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
                            {currency.label !== "UYU" && (
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold text-slate-700">
                                {currency.label}
                              </span>
                            )}
                            {budget.amount !== undefined
                              ? new Intl.NumberFormat("es-UY", {
                                  style: "currency",
                                  currency: currency.label === "USD" ? "USD" : "UYU",
                                }).format(budget.amount)
                              : ""}
                          </div>
                        </TableCell>
                      )}
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
                        <TableCell colSpan={rowColSpan} className="p-0">
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
                <TableCell colSpan={rowColSpan} className="h-24 text-center">
                  No se encontraron presupuestos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          </div>
          {hasMoreResults && (
            <div className="px-4 py-3 text-center text-xs text-slate-500 relative z-10">
              Desliza para cargar más presupuestos
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}
