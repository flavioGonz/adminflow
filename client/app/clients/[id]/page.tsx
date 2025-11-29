"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
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
  Plus,
  User,
  Users,
  Hash,
  Mail,
  Ticket as TicketIcon,
  DollarSign,
  FileSpreadsheet,
  FileDown,
  FileText,
  Award,
  Lock,
  Unlock,
  Folder,
  Server,
  Network,
  Save,
  Trash2,
  Building2,
  Tag,
  Phone,
  MapPin,
  FolderArchive,
  Rocket,
} from "lucide-react";
import { updateClient } from "@/lib/api-clients";
import { API_URL } from "@/lib/http";
import "leaflet/dist/leaflet.css";
import { ShinyText } from "@/components/ui/shiny-text";

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
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const pinIconRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      const initialPos = getClientPosition(client);

      const map = L.map(mapContainerRef.current!, {
        scrollWheelZoom: true,
      }).setView(initialPos, 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      }).addTo(map);

      // Lucide-like pin using divIcon to avoid missing assets
      pinIconRef.current = L.divIcon({
        className: "map-pin-icon",
        html: `<div style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#0ea5e9;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.2);color:white;">
          <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
            <path d='M12 22s8-4.5 8-10a8 8 0 1 0-16 0c0 5.5 8 10 8 10Z'/>
            <circle cx='12' cy='12' r='3'/>
          </svg>
        </div>`,
        iconAnchor: [16, 32],
      });

      const marker = L.marker(initialPos, {
        draggable: true,
        autoPan: true,
        icon: pinIconRef.current,
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      marker.on('dragend', (event: any) => {
        const { lat, lng } = event.target.getLatLng();
        if (onLocationSave) {
          onLocationSave(lat, lng);
        }
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isClient]);

  // Update marker position and draggable state
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current || !isClient) return;

    const updateMap = async () => {
      const newPos = getClientPosition(client);
      markerRef.current.setLatLng(newPos);
      mapInstanceRef.current.setView(newPos);

      if (isLocked) {
        markerRef.current.dragging?.disable();
      } else {
        markerRef.current.dragging?.enable();
      }
    };

    updateMap();
  }, [client.latitude, client.longitude, isLocked, isClient]);

  return (
    <section className="relative isolate h-full min-h-[320px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 0 }}
      />
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-md backdrop-blur" style={{ zIndex: 2 }}>
        <button
          className="flex items-center gap-1 text-[0.65rem] uppercase tracking-widest text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200"
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
  icon?: LucideIcon;
}

interface EditableClientCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  client: Client;
  fields: CardField[];
  onSave: (updates: Partial<Client>) => Promise<void>;
  isSaving: boolean;
  avatarUrl?: string;
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
  const [showRackDesigner, setShowRackDesigner] = useState(false);
  const [rackName, setRackName] = useState("Rack principal");
  const [rackHeight, setRackHeight] = useState(42);
  const [patchPanels, setPatchPanels] = useState<
    { id: number; name: string; ports: number }[]
  >([
    { id: 1, name: "Patch Panel 1", ports: 24 },
  ]);

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

  const handleAddPatchPanel = () => {
    setPatchPanels((prev) => [
      ...prev,
      { id: Date.now(), name: `Patch Panel ${prev.length + 1}`, ports: 24 },
    ]);
  };

  const handlePatchPanelChange = (
    id: number,
    field: "name" | "ports",
    value: string
  ) => {
    setPatchPanels((prev) =>
      prev.map((panel) =>
        panel.id === id
          ? { ...panel, [field]: field === "ports" ? Number(value) || 0 : value }
          : panel
      )
    );
  };

  const handleRemovePatchPanel = (id: number) => {
    setPatchPanels((prev) => prev.filter((panel) => panel.id !== id));
  };

  const handleSaveRack = () => {
    toast.success("Rack guardado para el cliente");
    setShowRackDesigner(false);
  };

  const movementRows = useMemo<MovementRow[]>(() => {
    const rows: MovementRow[] = [];

    tickets.forEach((ticket) =>
      rows.push({
        id: ticket.id,
        type: "Ticket",
        description: ticket.title ?? ticket.subject ?? "Ticket sin Titulo",
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
  const infoPillIcons: Record<string, LucideIcon> = {
    Tickets: TicketIcon,
    Pagos: DollarSign,
    Repositorio: Folder,
    Contratos: FileText,
  };

  const exportTicketsExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      tickets.map((ticket) => ({
        ID: ticket.id,
        Titulo: ticket.title ?? "Ticket sin Titulo",
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
      head: [["ID", "Titulo", "Estado", "Fecha"]],
      body: tickets.map((ticket) => [
        ticket.id,
        ticket.title ?? "Ticket sin Titulo",
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

  const resourceCards = [
    {
      title: "Datos / Accesos",
      description: "Credenciales y dispositivos",
      icon: Lock,
      href: `/clients/${client.id}/repository/access`,
      accent: "from-blue-50 to-indigo-50",
    },
    {
      title: "Bóbeda de Archivos",
      description: "Documentos y archivos del cliente",
      icon: FolderArchive,
      href: `/repository?search=${encodeURIComponent(client.name)}`,
      accent: "from-slate-50 to-slate-100",
    },
    {
      title: "Diagramas",
      description: "Diagramas de red en Excalidraw",
      icon: Network,
      href: `/clients/${client.id}/diagram`,
      accent: "from-emerald-50 to-teal-50",
    },
    {
      title: "Implementaciones",
      description: "Proyectos e implementaciones del cliente",
      icon: Rocket,
      onClick: () => toast.info("Implementaciones - Próximamente"),
      accent: "from-purple-50 to-pink-50",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={<ShinyText size="3xl" weight="bold">{client.name}</ShinyText>}
        subtitle="Ficha completa del cliente con contratos, tickets y pagos vinculados."
        backHref="/clients"
        leadingIcon={
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
            <User className="h-6 w-6 text-white" />
          </div>
        }
        breadcrumbs={[
          { label: "Clientes", href: "/clients", icon: <Users className="h-3 w-3 text-slate-500" /> },
          { label: client.name, icon: <User className="h-3 w-3 text-slate-500" /> },
        ]}
        actions={null}
        breadcrumbAction={
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="flex items-center gap-1.5 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
              <Hash className="h-3.5 w-3.5 text-slate-500" />
              ID {client.id}
            </Badge>
            {infoPills.map((pill) => {
              const Icon = infoPillIcons[pill.label] ?? Hash;
              return (
                <Badge
                  key={pill.label}
                  variant="outline"
                  className="flex items-center gap-1.5 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-900">{pill.value}</span>
                  <span className="text-slate-500">{pill.label}</span>
                </Badge>
              );
            })}
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <EditableClientCard
          title="Datos"
          description="Info Comercial"
          icon={User}
          client={client}
          fields={[
            { key: "name", label: "Razón Social", type: "text", icon: Building2 },
            { key: "alias", label: "Alias Comercial", type: "text", icon: Tag },
            { key: "rut", label: "RUT / CUIT", type: "text", icon: FileText },
            { key: "email", label: "Correo electrónico", type: "email", icon: Mail },
            { key: "phone", label: "Teléfono", type: "tel", icon: Phone },
            { key: "address", label: "Dirección", type: "textarea", icon: MapPin },
          ]}
          onSave={(updates) => handleCardSave("contact", updates)}
          isSaving={savingSection === "contact"}
          avatarUrl={client.avatarUrl}
        />
        <ContractSelectionCard
          contracts={contracts}
          selectedContractId={selectedContractId}
          onContractSelect={setSelectedContractId}
          payments={payments}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Accesos y Recursos</h3>
          </div>
          <div className="space-y-3">
            {resourceCards.map((card) => {
              const ContentIcon = card.icon;
              const content = (
                <div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-3 py-2 hover:shadow-sm transition-all hover:-translate-y-0.5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 group-hover:bg-slate-200 transition-colors">
                      <ContentIcon className="h-5 w-5 text-slate-800" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                      <p className="text-xs text-slate-500">{card.description}</p>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform" />
                </div>
              );

              if (card.href) {
                return (
                  <Link key={card.title} href={card.href} className="block">
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={card.onClick}
                  className="w-full text-left"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
        <MapCard
          client={client}
          onLocationSave={(lat, lng) =>
            handleCardSave("location", { latitude: lat, longitude: lng })
          }
        />
      </section>

      <Dialog open={showRackDesigner} onOpenChange={setShowRackDesigner}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-slate-600" />
              Diseñador de Racks
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Define el rack del cliente, su altura y patch panels.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del rack</Label>
                <Input value={rackName} onChange={(e) => setRackName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Altura (U)</Label>
                <Input
                  type="number"
                  min={1}
                  value={rackHeight}
                  onChange={(e) => setRackHeight(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Patch panels</Label>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleAddPatchPanel}>
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
            <div className="space-y-3">
              {patchPanels.map((panel) => (
                <div
                  key={panel.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-3"
                >
                  <Network className="h-4 w-4 text-slate-600" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={panel.name}
                      onChange={(e) => handlePatchPanelChange(panel.id, "name", e.target.value)}
                      placeholder="Nombre"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={panel.ports}
                      onChange={(e) => handlePatchPanelChange(panel.id, "ports", e.target.value)}
                      placeholder="Puertos"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => handleRemovePatchPanel(panel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRackDesigner(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveRack} className="gap-2">
                <Save className="h-4 w-4" />
                Guardar rack
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>




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
                      {ticket.title ?? "Ticket sin Titulo"}
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

    </div >
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
  avatarUrl,
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
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm backdrop-blur-sm">
      {avatarUrl && (
        <div
          className="absolute inset-0 z-0 opacity-10 bg-center bg-no-repeat bg-contain pointer-events-none"
          style={{
            backgroundImage: `url(${avatarUrl.startsWith("http") ? avatarUrl : `${API_URL}${avatarUrl}`
              })`,
            backgroundPosition: "center right",
            transform: "scale(0.8) translateX(20%)",
          }}
        />
      )}
      <div className="relative z-10">
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
      </div>
    </section>
  );
}

interface ContractSelectionCardProps {
  contracts: ClientContract[];
  selectedContractId: string | null;
  onContractSelect: (id: string | null) => void;
  payments: Payment[];
}

function ContractSelectionCard({
  contracts,
  selectedContractId,
  onContractSelect,
  payments,
}: ContractSelectionCardProps) {
  const selectedContract = contracts.find(
    (contract) => contract.id === selectedContractId
  );
  const hasContract = Boolean(selectedContract);

  const lastPayments = useMemo(() => {
    return payments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
  }, [payments]);

  return (
    <section
      className={`relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-sm transition-all duration-500 ${hasContract ? "border-emerald-400 ring-2 ring-emerald-100 ring-offset-2" : "border-slate-200"
        }`}
    >
      {/* Animated background icon */}
      <div className="absolute -right-6 -top-6 opacity-10">
        <Award className={`h-32 w-32 text-emerald-600 ${hasContract ? 'animate-pulse' : ''}`} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Contrato vigente
            </p>
            <div className="mt-2">
              {hasContract ? (
                <Badge
                  variant="outline"
                  className="rounded-lg border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-800 shadow-sm backdrop-blur-sm"
                >
                  {selectedContract?.title}
                </Badge>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Sin contrato asignado</p>
              )}
            </div>
          </div>
          {hasContract && (
            <div className="rounded-full bg-emerald-100 p-2 animate-pulse">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
          )}
        </div>

        {selectedContract && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">
                {formatCurrency(selectedContract.amount ?? 0, selectedContract.currency)}
              </span>
              <span className="text-xs font-medium text-slate-500">/ mes</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Últimos pagos
              </p>
              {lastPayments.length > 0 ? (
                <div className="space-y-2">
                  {lastPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white/60 px-3 py-2 text-xs backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${payment.status === 'Pagado' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-medium text-slate-700">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay pagos registrados</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
