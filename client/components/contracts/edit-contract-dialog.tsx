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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactCountryFlag from "react-country-flag";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import {
  AlignLeft,
  Calendar,
  Check,
  CheckCircle,
  ChevronsUpDown,
  ClipboardList,
  Clock,
  DollarSign,
  Tag,
} from "lucide-react";
import { updateContract } from "@/lib/api-contracts";
import { fetchAllClients } from "@/lib/api-clients";
import { Contract } from "@/types/contract";
import { Client } from "@/types/client";
import { cn } from "@/lib/utils";

interface EditContractDialogProps {
  contract: Contract;
  onContractUpdated: (contract: Contract) => void;
  children: React.ReactNode;
}

const contractStatuses = ["Nuevo", "En curso", "Renovado", "Finalizado"];
const contractTypes = ["Soporte", "Mantenimiento", "Consultoria", "Proyecto"];
const currencies = [
  { label: "Pesos uruguayos", value: "UYU", flag: "UY" },
  { label: "Dolares USD", value: "USD", flag: "US" },
];

export function EditContractDialog({ contract, onContractUpdated, children }: EditContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState(contract.clientId);
  const [clientName, setClientName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [recurrence, setRecurrence] = useState(contract.recurrence || "Mensual");
  const [title, setTitle] = useState(contract.title);
  const [description, setDescription] = useState(contract.description || "");
  const [responsibilities, setResponsibilities] = useState(contract.responsibilities || "");
  const [startDate, setStartDate] = useState(contract.startDate ? contract.startDate.split("T")[0] : "");
  const [endDate, setEndDate] = useState(contract.endDate ? contract.endDate.split("T")[0] : "");
  const [status, setStatus] = useState(contract.status || "Nuevo");
  const [sla, setSla] = useState(contract.sla || "");
  const [contractType, setContractType] = useState(contract.contractType || "");
  const [amount, setAmount] = useState<number>(contract.amount || 0);
  const [currency, setCurrency] = useState<string>(contract.currency || "UYU");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        try {
          const clientsData = await fetchAllClients();
          setClients(clientsData);
          const currentClient = clientsData.find((c: Client) => c.id === contract.clientId);
          if (currentClient) setClientName(currentClient.name);
        } catch (err) {
          console.error("Error fetching clients:", err);
          toast.error("Error al cargar clientes.");
        }
      };
      fetchClients();
    }
  }, [contract.clientId, isOpen]);

  useEffect(() => {
    setClientId(contract.clientId);
    setTitle(contract.title);
    setDescription(contract.description || "");
    setResponsibilities(contract.responsibilities || "");
    setStartDate(contract.startDate ? contract.startDate.split("T")[0] : "");
    setEndDate(contract.endDate ? contract.endDate.split("T")[0] : "");
    setStatus(contract.status || "Nuevo");
    setSla(contract.sla || "");
    setContractType(contract.contractType || "");
    setAmount(contract.amount || 0);
    setCurrency(contract.currency || "UYU");
    setRecurrence(contract.recurrence || "Mensual");
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedContractData = {
        clientId,
        title,
        description,
        responsibilities,
        startDate,
        endDate,
        status,
        sla,
        contractType,
        amount,
        currency,
        recurrence,
      };
      const updatedContract = await updateContract(contract.id, updatedContractData);
      toast.success("Contrato actualizado exitosamente.");
      setIsOpen(false);
      onContractUpdated(updatedContract);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar contrato.");
      console.error("Error updating contract:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-screen-2xl md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
          <DialogDescription>Ajusta los datos principales del acuerdo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-left">Cliente</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="justify-between">
                        {clientName || clients.find((c) => c.id === clientId)?.name || "Selecciona cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandEmpty>No se encontro cliente.</CommandEmpty>
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
                              <Check className={cn("mr-2 h-4 w-4", clientId === client.id ? "opacity-100" : "opacity-0")} />
                              {client.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-left">Recurrencia</Label>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona recurrencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Mensual">Mensual</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-left">Titulo</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-left">Monto</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="pl-10"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-left">Moneda</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value)}>
                    <SelectTrigger className="pl-3">
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2">
                            <ReactCountryFlag svg countryCode={option.flag} className="inline-block h-4 w-5" />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-left">Fecha inicio</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-left">Fecha fin</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-left">Estado</Label>
                  <div className="relative">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-left">SLA (hrs)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={sla} onChange={(e) => setSla(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-left">Tipo de contrato</Label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select value={contractType} onValueChange={setContractType}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-left">Descripcion</Label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="pl-10 py-3" rows={4} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-left">Deberes y Responsabilidades</Label>
              <Textarea
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="py-3"
                rows={4}
                placeholder="Detalle las obligaciones y responsabilidades clave del contrato"
              />
            </div>
          </div>

          <DialogFooter className="justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
