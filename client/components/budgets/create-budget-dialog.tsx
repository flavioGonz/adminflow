"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  AlignLeft,
  Check,
  CheckCircle,
  ChevronsUpDown,
  DollarSign,
  Tag,
} from "lucide-react";
import { createBudget } from "@/lib/api-budgets";
import { fetchAllClients } from "@/lib/api-clients";
import { Client } from "@/types/client";
import { cn } from "@/lib/utils";

const budgetStatuses = ["Nuevo", "Enviado", "Aprobado", "Rechazado"];

interface CreateBudgetDialogProps {
  onBudgetCreated: () => void;
  children: React.ReactNode;
}

export function CreateBudgetDialog({
  onBudgetCreated,
  children,
}: CreateBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Nuevo");
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        try {
          const clientsData = await fetchAllClients();
          setClients(clientsData);
        } catch (err) {
          console.error("Error fetching clients:", err);
          toast.error("Error al cargar clientes.");
        }
      };
      fetchClients();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newBudgetData = {
        clientId,
        title,
        description,
        status,
        amount,
      };

      await createBudget(newBudgetData);

      toast.success("Presupuesto creado exitosamente.");
      setIsOpen(false);
      onBudgetCreated();
      resetForm();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error al crear presupuesto.";
      toast.error(message);
      console.error("Error creating budget:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientId("");
    setClientName("");
    setTitle("");
    setDescription("");
    setStatus("Nuevo");
    setAmount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nuevo Presupuesto</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo presupuesto.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 py-4"
        >
          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {clientName || "Selecciona cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandEmpty>No se encontró cliente.</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={() => {
                          setClientId(client.id);
                          setClientName(client.name);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clientId === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {client.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Presupuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
