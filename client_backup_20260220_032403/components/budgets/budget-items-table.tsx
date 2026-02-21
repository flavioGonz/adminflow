"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetItem } from "@/types/budget-item";
import {
  createBudgetItem,
  deleteBudgetItem,
  fetchBudgetItems,
  updateBudgetItem,
} from "@/lib/api-budgets";
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

interface BudgetItemsTableProps {
  budgetId: string;
  onItemsChange?: (items: BudgetItem[]) => void;
  refreshSignal?: number;
}

export function BudgetItemsTable({
  budgetId,
  onItemsChange,
  refreshSignal,
}: BudgetItemsTableProps) {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const onItemsChangeRef = useRef(onItemsChange);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedItems = await fetchBudgetItems(budgetId);
      setItems(fetchedItems);
      onItemsChangeRef.current?.(fetchedItems);
    } catch (error) {
      console.error("Failed to fetch budget items", error);
      toast.error("No se pudieron cargar los items del presupuesto.");
    } finally {
      setLoading(false);
    }
  }, [budgetId]);

  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
  }, [onItemsChange]);

  useEffect(() => {
    loadItems();
  }, [loadItems, refreshSignal]);

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      id: `new-${Date.now()}`,
      budgetId,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setEditingItem(newItem);
    setItems([...items, newItem]);
  };

  const handleSaveItem = async (itemToSave: BudgetItem) => {
    try {
      if (itemToSave.id.startsWith("new-")) {
        await createBudgetItem(budgetId, {
          description: itemToSave.description,
          quantity: itemToSave.quantity,
          unitPrice: itemToSave.unitPrice,
        });
        toast.success("Item agregado.");
      } else {
        await updateBudgetItem(itemToSave.id, {
          description: itemToSave.description,
          quantity: itemToSave.quantity,
          unitPrice: itemToSave.unitPrice,
        });
        toast.success("Item actualizado.");
      }

      setEditingItem(null);
      loadItems();
    } catch (error) {
      console.error("Failed to save item", error);
      toast.error("Error al guardar el item.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteBudgetItem(itemId);
      toast.success("Item eliminado.");
      loadItems();
    } catch (error) {
      console.error("Failed to delete item", error);
      toast.error("Error al eliminar el item.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof BudgetItem
  ) => {
    if (editingItem) {
      const value =
        field === "quantity" || field === "unitPrice"
          ? Number(e.target.value)
          : e.target.value;
      setEditingItem({
        ...editingItem,
        [field]: value,
      });
    }
  };

  if (loading) {
    return <div>Cargando items...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddItem}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Item
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-24">Cantidad</TableHead>
              <TableHead className="w-32">Precio Unit.</TableHead>
              <TableHead className="w-32">Total</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) =>
              editingItem?.id === item.id ? (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={editingItem.description}
                      onChange={(e) => handleInputChange(e, "description")}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) => handleInputChange(e, "quantity")}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editingItem.unitPrice}
                      onChange={(e) => handleInputChange(e, "unitPrice")}
                    />
                  </TableCell>
                  <TableCell>
                    ${(editingItem.quantity * editingItem.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => handleSaveItem(editingItem)}>
                      Guardar
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${item.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
