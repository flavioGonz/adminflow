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
  ClipboardList,
  Calendar,
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

const contractStatuses = ["Nuevo", "Negociando", "Aceptado", "Firmado"];
const contractTypes = ["Soporte Remoto", "Soporte Visita", "Consultoría", "Proyecto"];

export function EditContractDialog({ contract, onContractUpdated, children }: EditContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState(contract.clientId);
  const [clientName, setClientName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [title, setTitle] = useState(contract.title);
  const [description, setDescription] = useState(contract.description || "");
  const [startDate, setStartDate] = useState(contract.startDate ? contract.startDate.split('T')[0] : "");
  const [endDate, setEndDate] = useState(contract.endDate ? contract.endDate.split('T')[0] : "");
  const [status, setStatus] = useState(contract.status || "Nuevo");
  const [sla, setSla] = useState(contract.sla || "");
  const [contractType, setContractType] = useState(contract.contractType || "");
  const [amount, setAmount] = useState<number>(contract.amount || 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setClientId(contract.clientId);
    setTitle(contract.title);
    setDescription(contract.description || "");
    setStartDate(contract.startDate ? contract.startDate.split('T')[0] : "");
    setEndDate(contract.endDate ? contract.endDate.split('T')[0] : "");
    setStatus(contract.status || "Nuevo");
    setSla(contract.sla || "");
    setContractType(contract.contractType || "");
    setAmount(contract.amount || 0);

    if (isOpen) {
      const fetchClients = async () => {
        try {
          const clientsData = await fetchAllClients();
          setClients(clientsData);
          const currentClient = clientsData.find((c: Client) => c.id === contract.clientId);
          if (currentClient) {
            setClientName(currentClient.name);
          }
        } catch (err) {
          console.error("Error fetching clients:", err);
          toast.error("Error al cargar clientes.");
        }
      };
      fetchClients();
    }
  }, [contract, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedContractData = {
        clientId,
        title,
        description,
        startDate,
        endDate,
        status,
        sla,
        contractType,
        amount,
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
          <DialogDescription>
            Realiza cambios en los detalles del contrato.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientId" className="text-right">
              Cliente
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="col-span-3 justify-between"
                >
                  {clientName
                    ? clients.find((client) => client.id === clientId)?.name
                    : "Selecciona cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
            <Label htmlFor="startDate" className="text-right">
              Fecha Inicio
            </Label>
            <div className="relative col-span-3">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Fecha Fin
            </Label>
            <div className="relative col-span-3">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                  {contractStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sla" className="text-right">
              SLA
            </Label>
            <div className="relative col-span-3">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sla"
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contractType" className="text-right">
              Tipo Contrato
            </Label>
            <div className="relative col-span-3">
              <ClipboardList className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger className="col-span-3 pl-8">
                  <SelectValue placeholder="Selecciona un tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
