import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlignLeft,
  CheckCircle,
  DollarSign,
  Tag,
} from "lucide-react";
import { updateBudget } from "@/lib/api-budgets";
import { Budget } from "@/types/budget";

interface EditBudgetDialogProps {
  budget: Budget;
  onBudgetUpdated: (budget: Budget) => void;
  children: React.ReactNode;
}

const budgetStatuses = ["Nuevo", "Enviado", "Aprobado", "Rechazado"];

export function EditBudgetDialog({ budget, onBudgetUpdated, children }: EditBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(budget.title);
  const [description, setDescription] = useState(budget.description || "");
  const [status, setStatus] = useState(budget.status || "Nuevo");
  const [amount, setAmount] = useState<number>(budget.amount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(budget.title);
    setDescription(budget.description || "");
    setStatus(budget.status || "Nuevo");
    setAmount(budget.amount || 0);
  }, [budget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedBudgetData = {
        title,
        description,
        status,
        amount,
      };

      const updatedBudget = await updateBudget(budget.id, updatedBudgetData);
      toast.success("Presupuesto actualizado exitosamente.");
      setIsOpen(false);
      onBudgetUpdated(updatedBudget);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar presupuesto.");
      console.error("Error updating budget:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Presupuesto</DialogTitle>
          <DialogDescription>
            Realiza cambios en los detalles del presupuesto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <div className="relative col-span-3">
              <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <div className="relative col-span-3">
              <AlignLeft className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <div className="relative col-span-3">
              <CheckCircle className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3 pl-8">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {budgetStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Monto
            </Label>
            <div className="relative col-span-3">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-8"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
