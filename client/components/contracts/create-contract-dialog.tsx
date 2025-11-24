"use client";

import { useEffect, useRef, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  FileText,
  Tag,
  X,
} from "lucide-react";
import { createContract, uploadContractFile } from "@/lib/api-contracts";
import { fetchAllClients } from "@/lib/api-clients";
import { Client } from "@/types/client";
import { Contract } from "@/types/contract";
import { PdfViewerModal } from "@/components/contracts/pdf-viewer-modal";
import { cn } from "@/lib/utils";
import ReactCountryFlag from "react-country-flag";

const contractStatuses = ["Nuevo", "En curso", "Renovado", "Finalizado"];
const contractTypes = ["Soporte", "Mantenimiento", "Consultoria", "Proyecto"];

type Currency = "UYU" | "USD";

interface CurrencyOption {
  value: Currency;
  label: string;
  flagCode: string;
}

const currencyOptions: CurrencyOption[] = [
  { value: "UYU", label: "Pesos uruguayos", flagCode: "UY" },
  { value: "USD", label: "Dolares", flagCode: "US" },
];

interface CreateContractDialogProps {
  onContractCreated: () => void;
  children: React.ReactNode;
}

export function CreateContractDialog({ onContractCreated, children }: CreateContractDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [recurrence, setRecurrence] = useState("Mensual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Nuevo");
  const [sla, setSla] = useState("");
  const [contractType, setContractType] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<Currency>("UYU");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreviewUrl(null);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        toast.error("Solo se permiten archivos PDF.");
      }
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newContractData: Omit<Contract, "id" | "createdAt" | "updatedAt"> = {
        clientId,
        clientName: clients.find((c) => c.id === clientId)?.name || "",
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

      const createdContract = await createContract(newContractData);

      if (file) {
        await uploadContractFile(createdContract.id, file);
      }

      toast.success("Contrato creado exitosamente.");
      setIsOpen(false);
      onContractCreated();
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al crear contrato.";
      toast.error(message);
      console.error("Error creating contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientId("");
    setClientName("");
    setTitle("");
    setDescription("");
    setResponsibilities("");
    setStartDate("");
    setEndDate("");
    setStatus("Nuevo");
    setSla("");
    setContractType("");
    setAmount(0);
    setCurrency("UYU");
    setRecurrence("Mensual");
    setFile(null);
  };

  const amountLabel = currency === "USD" ? "Monto (U$S)" : "Monto ($)";
  const amountSymbol = currency === "USD" ? "U$S" : "$";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-screen-2xl md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Nuevo contrato</DialogTitle>
          <DialogDescription>Completa los datos principales del acuerdo y genera el registro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-left">
                    Cliente
                  </Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="justify-between">
                        {clientName || "Selecciona cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
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
                <Label htmlFor="title" className="text-left">
                  Titulo
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-left">
                    {amountLabel}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="pl-10"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {amountSymbol} {currency === "USD" ? "Dolares" : "Pesos"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-left">Moneda</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                    <SelectTrigger className="pl-3">
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2">
                            <ReactCountryFlag svg countryCode={option.flagCode} className="inline-block h-4 w-5" />
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
                  <Label htmlFor="startDate" className="text-left">
                    Fecha inicio
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-left">
                    Fecha fin
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-left">
                    Estado
                  </Label>
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
                  <Label htmlFor="sla" className="text-left">
                    SLA (hrs)
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="sla" value={sla} onChange={(e) => setSla(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractType" className="text-left">
                  Tipo de contrato
                </Label>
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
              <Label htmlFor="description" className="text-left">
                Descripcion
              </Label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="pl-10 py-3"
                  rows={4}
                />
              </div>
            </div>
            <div className="space-y-4">
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
              <div className="space-y-2">
                <Label className="text-left">Adjuntar contrato (PDF)</Label>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Button variant="outline" size="sm" className="text-sm" onClick={() => fileInputRef.current?.click()}>
                    <FileText className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                  </Button>
                  <span>{file ? <span className="font-medium text-foreground">{file.name}</span> : "PDF (max 5MB)"}</span>
                  {file && (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  id="contract-file"
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {filePreviewUrl && (
                  <div className="flex items-center gap-2 text-xs">
                    <PdfViewerModal filePath={filePreviewUrl}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </PdfViewerModal>
                    <span className="text-muted-foreground">Previsualizar</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear contrato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
