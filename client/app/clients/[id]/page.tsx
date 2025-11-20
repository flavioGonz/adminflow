"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  User,
  Mail,
  Ticket as TicketIcon,
  DollarSign,
  FileSpreadsheet,
  FileDown,
  Award,
  Lock,
  Unlock,
} from "lucide-react";
import { updateClient } from "@/lib/api-clients";
import { API_URL } from "@/lib/http";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DEFAULT_POSITION: [number, number] = [-34.9, -56.1];

const getClientPosition = (client: Client): [number, number] => [
  client.latitude ?? DEFAULT_POSITION[0],
  client.longitude ?? DEFAULT_POSITION[1],
];

function MapCard({
  client,
  onLocationSave,
}: {
  client: Client;
  onLocationSave?: (lat: number, lng: number) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialPos = getClientPosition(client);

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
    }).setView(initialPos, 13);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    }).addTo(map);

    // Fix icons
    const iconRetinaUrl = 'leaflet/dist/images/marker-icon-2x.png';
    const iconUrl = 'leaflet/dist/images/marker-icon.png';
    const shadowUrl = 'leaflet/dist/images/marker-shadow.png';

    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
    });

    const marker = L.marker(initialPos, {
      draggable: !isLocked,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    marker.on('dragend', (event) => {
      const { lat, lng } = event.target.getLatLng();
      if (onLocationSave) {
        onLocationSave(lat, lng);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position and draggable state
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;

    const newPos = getClientPosition(client);
    markerRef.current.setLatLng(newPos);
    mapInstanceRef.current.setView(newPos);

    if (isLocked) {
      markerRef.current.dragging?.disable();
    } else {
      markerRef.current.dragging?.enable();
    }
  }, [client.latitude, client.longitude, isLocked]);

  return (
    <section className="relative h-72 shrink-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 0 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 pointer-events-none" style={{ zIndex: 1 }} />
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/60 px-3 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur" style={{ zIndex: 2 }}>
        <button
          className="flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-white outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
          onClick={() => setIsLocked((prev) => !prev)}
          type="button"
        >
          {isLocked ? (
            <>
              <Lock className="h-3 w-3" />
              Bloqueado
            </>
          ) : (
            <>
              <Unlock className="h-3 w-3" />
              Reubicar
            </>
          )}
        </button>
      </div>
    </section>
  );
}
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

interface Client {
  id: string;
  name: string;
  alias?: string;
  rut?: string;
  email: string;
  phone?: string;
  address?: string;
  contract?: boolean;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Ticket {
  id: string;
  title?: string;
  subject?: string;
  status: string;
  createdAt: string;
}

interface RepositoryItem {
  id: string;
  equipo: string;
  usuario: string;
  password?: string;
  mac_serie: string;
  comentarios: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Payment {
  id: string;
  amount: number;
  status?: string;
  createdAt: string;
  description?: string;
  method?: string;
}

interface ClientContract {
  id: string;
  title: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  createdAt?: string;
  currency?: string;
}

type MovementType = "Ticket" | "Pago" | "Repositorio" | "Contrato";

interface MovementRow {
  id: string;
  type: MovementType;
  description: string;
  status?: string;
  date?: string;
  amount?: number;
  reference?: string;
}

interface CardField {
  key: keyof Client;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  parse?: (value: string) => Client[keyof Client];
  format?: (value: Client[keyof Client]) => string;
}

interface EditableClientCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  client: Client;
  fields: CardField[];
  onSave: (updates: Partial<Client>) => Promise<void>;
  isSaving: boolean;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatCurrency = (value: number, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const CONTRACT_NONE_VALUE = "__none__";
export default function ClientDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  if (!rawId) {
    throw new Error("Client ID is required.");
  }
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [client, setClient] = useState<Client | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [repositoryItems, setRepositoryItems] = useState<RepositoryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/clients/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClient(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cargar el cliente.";
      setError(message);
      console.error(`Error fetching client ${id}:`, error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTickets = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `${API_URL}/clients/${id}/tickets`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error(`Error fetching tickets for client ${id}:`, err);
    }
  }, [id]);

  const fetchRepositoryItems = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `${API_URL}/clients/${id}/repository`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRepositoryItems(data);
    } catch (err) {
      console.error(
        `Error fetching repository items for client ${id}:`,
        err
      );
    }
  }, [id]);

  const fetchPayments = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `${API_URL}/clients/${id}/payments`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      console.error(`Error fetching payments for client ${id}:`, err);
    }
  }, [id]);

  const fetchContracts = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(
        `${API_URL}/clients/${id}/contracts`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      console.error(`Error fetching contracts for client ${id}:`, err);
    }
  }, [id]);

  useEffect(() => {
    if (!contracts.length) {
      setSelectedContractId(null);
      return;
    }
    setSelectedContractId((prev) => {
      if (prev && contracts.some((contract) => contract.id === prev)) {
        return prev;
      }
      return contracts[0].id;
    });
  }, [contracts]);

  useEffect(() => {
    fetchClient();
    fetchTickets();
    fetchRepositoryItems();
    fetchPayments();
    fetchContracts();
  }, [
    fetchClient,
    fetchTickets,
    fetchRepositoryItems,
    fetchPayments,
    fetchContracts,
  ]);

  const movementRows = useMemo<MovementRow[]>(() => {
    const rows: MovementRow[] = [];

    tickets.forEach((ticket) =>
      rows.push({
        id: ticket.id,
        type: "Ticket",
        description: ticket.title ?? ticket.subject ?? "Ticket sin título",
        status: ticket.status,
        date: ticket.createdAt,
      })
    );

    payments.forEach((payment) =>
      rows.push({
        id: payment.id,
        type: "Pago",
        description: payment.description ?? "Pago registrado",
        status: payment.status,
        date: payment.createdAt,
        amount: payment.amount,
      })
    );

    repositoryItems.forEach((item) =>
      rows.push({
        id: item.id,
        type: "Repositorio",
        description: `${item.equipo} (${item.usuario})`,
        status: item.comentarios,
        date: item.updatedAt ?? item.createdAt,
        reference: item.mac_serie,
      })
    );

    contracts.forEach((contract) =>
      rows.push({
        id: contract.id,
        type: "Contrato",
        description: contract.title,
        status: contract.status,
        date: contract.startDate ?? contract.createdAt,
        amount: contract.amount,
      })
    );

    const parseDate = (value?: string) =>
      value ? new Date(value).getTime() : 0;

    return rows.sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [tickets, payments, repositoryItems, contracts]);

  const infoPills = useMemo(
    () => [
      {
        label: "Tickets",
        value: tickets.length,
        meta: "asociados",
      },
      {
        label: "Pagos",
        value: payments.length,
        meta: "registrados",
      },
      {
        label: "Repositorio",
        value: repositoryItems.length,
        meta: "items",
      },
      {
        label: "Contratos",
        value: contracts.length,
        meta: "vigentes",
      },
    ],
    [tickets.length, payments.length, repositoryItems.length, contracts.length]
  );

  const exportTicketsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      tickets.map((ticket) => ({
        ID: ticket.id,
        Título: ticket.title ?? "Ticket sin título",
        Estado: ticket.status,
        Fecha: ticket.createdAt,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `${client?.name ?? "cliente"}-tickets.xlsx`);
  };

  const exportPaymentsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      payments.map((payment) => ({
        ID: payment.id,
        Estado: payment.status,
        Monto: payment.amount,
        Fecha: payment.createdAt,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
    XLSX.writeFile(workbook, `${client?.name ?? "cliente"}-pagos.xlsx`);
  };

  const exportTicketsPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Título", "Estado", "Fecha"]],
      body: tickets.map((ticket) => [
        ticket.id,
        ticket.title ?? "Ticket sin título",
        ticket.status,
        ticket.createdAt,
      ]),
    });
    doc.save(`${client?.name ?? "cliente"}-tickets.pdf`);
  };

  const exportPaymentsPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [["ID", "Estado", "Monto", "Fecha"]],
      body: payments.map((payment) => [
        payment.id,
        payment.status ?? "Pendiente",
        payment.amount,
        payment.createdAt,
      ]),
    });
    doc.save(`${client?.name ?? "cliente"}-pagos.pdf`);
  };

  const handleCardSave = async (
    sectionId: string,
    updates: Partial<Client>
  ) => {
    if (!client) return;
    try {
      setSavingSection(sectionId);
      const updated = await updateClient(client.id, updates);
      setClient(updated);
      toast.success("Datos del cliente actualizados.");
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error("No se pudo actualizar el cliente.");
    } finally {
      setSavingSection(null);
    }
  };

  if (loading) {
    return <div className="p-6">Cargando cliente...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (!client) {
    return <div className="p-6">Cliente no encontrado.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">ID: {client.id}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Tickets asociados
          </div>
          <div className="text-2xl font-semibold">{tickets.length}</div>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        <EditableClientCard
          title="Perfil Comercial"
          description="Identidad legal y comercial."
          icon={User}
          client={client}
          fields={[
            { key: "name", label: "Razón Social", type: "text" },
            { key: "alias", label: "Alias Comercial", type: "text" },
            { key: "rut", label: "RUT / CUIT", type: "text" },
          ]}
          onSave={(updates) => handleCardSave("profile", updates)}
          isSaving={savingSection === "profile"}
        />
        <EditableClientCard
          title="Datos de Contacto"
          description="Información para comunicaciones."
          icon={Mail}
          client={client}
          fields={[
            { key: "email", label: "Correo electrónico", type: "email" },
            { key: "phone", label: "Teléfono", type: "tel" },
            { key: "address", label: "Dirección", type: "textarea" },
          ]}
          onSave={(updates) => handleCardSave("contact", updates)}
          isSaving={savingSection === "contact"}
        />
        <ContractSelectionCard
          contracts={contracts}
          selectedContractId={selectedContractId}
          onContractSelect={setSelectedContractId}
        />
        <MapCard
          client={client}
          onLocationSave={(lat, lng) =>
            handleCardSave("location", { latitude: lat, longitude: lng })
          }
        />
      </section>

      <div className="flex flex-wrap gap-2 pt-2">
        {infoPills.map((pill) => (
          <div
            key={pill.label}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-sm text-slate-600 shadow-sm"
          >
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {pill.label}
            </span>
            <span className="text-base font-semibold text-slate-800">
              {pill.value}
            </span>
            <span className="text-xs text-slate-500">{pill.meta}</span>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[3fr,2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Movimientos del Cliente
              </p>
              <h3 className="text-lg font-semibold text-slate-800">
                Tickets, pagos, repositorio y contratos recientes
              </h3>
            </div>
            <Link href={`/clients/${client.id}/repository/access`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Lock className="h-4 w-4" />
                Gestionar Accesos
              </Button>
            </Link>
          </div>
          {movementRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Aún no se registran movimientos para este cliente.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">
                      Monto / Referencia
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementRows.map((movement) => (
                    <TableRow key={`${movement.type}-${movement.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-300">
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {movement.description}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {movement.status ?? "—"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {movement.date
                          ? new Date(movement.date).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {typeof movement.amount === "number"
                          ? formatCurrency(movement.amount)
                          : movement.reference ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tickets asociados
                </p>
                <h3 className="text-lg font-semibold text-slate-800">
                  Últimos abiertos
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <TicketIcon className="h-5 w-5 text-slate-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportTicketsExcel}
                  className="gap-1 px-2"
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportTicketsPDF}
                  className="gap-1 px-2"
                >
                  <FileDown className="h-3 w-3" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {tickets.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {ticket.title ?? "Ticket sin título"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {ticket.status}
                  </Badge>
                </div>
              ))}
              {!tickets.length && (
                <p className="text-sm text-slate-500">
                  Aún no hay tickets asociados.
                </p>
              )}
            </div>
          </article>
          <article className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pagos vinculados
                </p>
                <h3 className="text-lg font-semibold text-slate-800">
                  Últimos movimientos
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <DollarSign className="h-5 w-5 text-slate-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportPaymentsExcel}
                  className="gap-1 px-2"
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportPaymentsPDF}
                  className="gap-1 px-2"
                >
                  <FileDown className="h-3 w-3" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {payments.slice(0, 4).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(payment.amount)}{" "}
                      <span className="text-xs text-slate-500">
                        {payment.method ?? ""}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    {payment.status ?? "Pendiente"}
                  </Badge>
                </div>
              ))}
              {!payments.length && (
                <p className="text-sm text-slate-500">No se encontraron pagos.</p>
              )}
            </div>
          </article>
        </div>
      </section>

    </div>
  );
}

function EditableClientCard({
  title,
  description,
  icon: Icon,
  client,
  fields,
  onSave,
  isSaving,
}: EditableClientCardProps) {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const buildInitialValues = () => {
    const values: Record<string, string> = {};
    fields.forEach((field) => {
      const key = String(field.key);
      const currentValue = client[field.key];
      if (typeof currentValue === "boolean") {
        values[key] = currentValue ? "true" : "false";
      } else if (currentValue === null || currentValue === undefined) {
        values[key] = "";
      } else {
        values[key] = String(currentValue);
      }
    });
    return values;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFormValues(buildInitialValues());
    }
    setOpen(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updates: Partial<Client> = {};
    fields.forEach((field) => {
      const fieldKey = field.key as keyof Client;
      const key = String(fieldKey);
      const rawValue = formValues[key] ?? "";
      const parsedValue: Client[keyof Client] = field.parse
        ? field.parse(rawValue)
        : ((rawValue as unknown) as Client[keyof Client]);
      (updates as Record<keyof Client, Client[keyof Client]>)[fieldKey] = parsedValue;
    });
    await onSave(updates);
    setOpen(false);
  };

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar {title.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => {
                const key = String(field.key);
                const value = formValues[key] ?? "";

                if (field.type === "textarea") {
                  return (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm text-slate-500">
                        {field.label}
                      </Label>
                      <Textarea
                        value={value}
                        onChange={(event) =>
                          handleChange(key, event.target.value)
                        }
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                }

                if (field.type === "select" && field.options) {
                  return (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm text-slate-500">
                        {field.label}
                      </Label>
                      <Select
                        value={value}
                        onValueChange={(newValue) => handleChange(key, newValue)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                return (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm text-slate-500">
                      {field.label}
                    </Label>
                    <Input
                      type={field.type ?? "text"}
                      value={value}
                      onChange={(event) =>
                        handleChange(key, event.target.value)
                      }
                      placeholder={field.placeholder}
                    />
                  </div>
                );
              })}
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {fields.map((field) => {
          const rawValue = client[field.key];
          const displayValue =
            field.format?.(rawValue) ??
            (rawValue === null || rawValue === undefined || rawValue === ""
              ? "—"
              : String(rawValue));

          return (
            <div
              key={String(field.key)}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-slate-500">{field.label}</span>
              <span className="font-medium text-slate-800">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface ContractSelectionCardProps {
  contracts: ClientContract[];
  selectedContractId: string | null;
  onContractSelect: (id: string | null) => void;
}

function ContractSelectionCard({
  contracts,
  selectedContractId,
  onContractSelect,
}: ContractSelectionCardProps) {
  const selectedContract = contracts.find(
    (contract) => contract.id === selectedContractId
  );
  const hasContract = Boolean(selectedContract);
  const contractBadgeClass = hasContract
    ? "bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse shadow-sm"
    : "bg-slate-100 text-slate-600 border-slate-200";
  const contractCardClasses = [
    "h-full space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition",
  ].join(" ");

  return (
    <section className={contractCardClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-emerald-50/80 p-2 text-emerald-600 shadow-inner">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Contrato vigente
            </p>
            <p className="text-sm text-slate-600">
              Selecciona el contrato activo para referencia.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${contractBadgeClass}`}
        >
          {hasContract ? "Contrato activo" : "Sin contrato"}
        </Badge>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contract-select" className="text-xs text-slate-500">
          Contrato
        </Label>
        <Select
          value={selectedContractId ?? CONTRACT_NONE_VALUE}
          onValueChange={(value) =>
            onContractSelect(value === CONTRACT_NONE_VALUE ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CONTRACT_NONE_VALUE}>Sin contrato</SelectItem>
            {contracts.map((contract) => (
              <SelectItem key={contract.id} value={contract.id}>
                {contract.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedContract ? (
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Estado</span>
            <Badge
              variant="outline"
              className="rounded-full border-slate-300 bg-slate-100 px-3 py-0.5 text-xs text-slate-700"
            >
              {selectedContract.status ?? "Pendiente"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Vigencia</span>
            <span className="font-medium text-slate-800">
              {selectedContract.startDate
                ? formatDate(selectedContract.startDate)
                : "Sin inicio"}{" "}
              –{" "}
              {selectedContract.endDate
                ? formatDate(selectedContract.endDate)
                : "Sin fin"}
            </span>
          </div>
          {typeof selectedContract.amount === "number" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Monto</span>
              <span className="font-medium text-slate-800">
                {formatCurrency(
                  selectedContract.amount,
                  selectedContract.currency ?? "ARS"
                )}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Creado: {formatDate(selectedContract.createdAt)}</span>
            <Link
              href="/contracts"
              className="text-xs font-semibold text-slate-800"
            >
              Ver contratos
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Al momento no hay contratos asignados al cliente.
        </p>
      )}
    </section>
  );
}
