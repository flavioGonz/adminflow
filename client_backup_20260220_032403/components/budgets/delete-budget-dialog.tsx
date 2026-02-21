"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteBudget } from "@/lib/api-budgets";
import { Budget } from "@/types/budget";

interface DeleteBudgetDialogProps {
  budget: Budget;
  onBudgetDeleted: (budgetId: string) => void;
  children: React.ReactNode;
}

export function DeleteBudgetDialog({ budget, onBudgetDeleted, children }: DeleteBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteBudget(budget.id);
      toast.success(`Presupuesto "${budget.title}" eliminado exitosamente.`);
      onBudgetDeleted(budget.id);
      setIsOpen(false);
    } catch (error) {
      toast.error("Error al eliminar el presupuesto.");
      console.error("Error deleting budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el presupuesto{" "}
            <span className="font-semibold">{budget.title}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600">
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
