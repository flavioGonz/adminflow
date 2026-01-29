"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  CalendarClock,
  Edit2,
  Bell,
  FileSignature,
  History,
  ChevronRight,
  Monitor,
  Search,
  CheckCircle2,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateClient } from "@/lib/api-clients";
import { API_URL } from "@/lib/http";
import "leaflet/dist/leaflet.css";
import { ShinyText } from "@/components/ui/shiny-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [searchQuery, setSearchQuery] = useState("");
  const pinIconRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newLat = parseFloat(lat);
            const newLon = parseFloat(lon);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([newLat, newLon], 16);
                if (markerRef.current) {
                    markerRef.current.setLatLng([newLat, newLon]);
                }
            }
            if (onLocationSave) {
                onLocationSave(newLat, newLon);
            }
            setIsLocked(false);
            toast.success("Ubicación encontrada.");
        } else {
            toast.error("No se encontró la dirección.");
        }
    } catch (err) {
        toast.error("Error al buscar dirección.");
    }
  };

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

  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current || !isClient) return;

    const updateMap = async () => {
      const newPos = getClientPosition(client);
      markerRef.current.setLatLng(newPos);
      if (!isLocked) {
        mapInstanceRef.current.setView(newPos);
      }

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
      <div className="absolute left-3 top-3 right-3 flex items-center gap-2" style={{ zIndex: 2 }}>
          <div className="relative flex-1 group">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
                placeholder="Buscar dirección..." 
                className="h-9 pl-8 bg-white/90 backdrop-blur border-slate-200 shadow-lg text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            className="flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 bg-white/90 text-[0.65rem] font-bold uppercase tracking-widest text-slate-700 shadow-lg backdrop-blur outline-none transition-all hover:bg-white active:scale-95"
            onClick={() => setIsLocked((prev) => !prev)}
            type="button"
          >
            {isLocked ? (
              <>
                <Lock className="h-3 w-3 text-slate-500" />
                Bloqueado
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3 text-blue-500 animate-bounce" />
                Mover dot
              </>
            )}
          </button>
      </div>
    </section>
  );
}

import { Client } from "@/types/client";

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

type MovementType = "Ticket" | "Pago" | "Repositorio";

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
  type?: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
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

const formatCurrency = (value: number, currency = "UYU") =>
  new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
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
  const [activeTab, setActiveTab] = useState<string>("movimientos");

  const [movementSearch, setMovementSearch] = useState("");
  const [movementPage, setMovementPage] = useState(1);
  const MOVEMENTS_PAGE_SIZE = 8;

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

  const handleCardSave = async (
    sectionId: string,
    updates: Partial<Client>
  ) => {
    if (!client) return;
    try {
      setSavingSection(sectionId);
      const updated = await updateClient(client.id, updates);
      setClient(updated);
      toast.success("Datos actualizados.");
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error("No se pudo actualizar.");
    } finally {
      setSavingSection(null);
    }
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
        description: `${item.equipo || 'Item'} (${item.usuario || 'N/A'})`,
        status: item.comentarios,
        date: item.updatedAt ?? item.createdAt,
        reference: item.mac_serie,
      })
    );

    const parseDate = (value?: string) =>
      value ? new Date(value).getTime() : 0;

    return rows.sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [tickets, payments, repositoryItems]);

  const filteredMovements = useMemo(() => {
    let base = movementRows;
    if (activeTab === "tickets") base = movementRows.filter(r => r.type === "Ticket");
    if (activeTab === "pagos") base = movementRows.filter(r => r.type === "Pago");
    if (activeTab === "repositorio") base = movementRows.filter(r => r.type === "Repositorio");

    const text = movementSearch.trim().toLowerCase();
    if (text) {
        base = base.filter((row) =>
            row.description.toLowerCase().includes(text) ||
            row.status?.toLowerCase().includes(text) ||
            row.reference?.toLowerCase().includes(text)
        );
    }

    return base;
  }, [movementRows, activeTab, movementSearch]);

  const paginatedMovements = filteredMovements.slice(
    (movementPage - 1) * MOVEMENTS_PAGE_SIZE,
    movementPage * MOVEMENTS_PAGE_SIZE
  );

  const totalMovementPages = Math.max(1, Math.ceil(filteredMovements.length / MOVEMENTS_PAGE_SIZE));

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!client) return <div className="p-6">No encontrado.</div>;

  const resourceCards = [
    {
      title: "Accesos",
      description: "Credenciales",
      icon: Lock,
      href: `/clients/${client.id}/repository/access`,
      accent: "bg-blue-50 text-blue-600",
    },
    {
      title: "Bóveda",
      description: "Archivos",
      icon: FolderArchive,
      href: `/repository?clientId=${client.id}`,
      accent: "bg-slate-50 text-slate-600",
    },
    {
      title: "Diagramas",
      description: "Red",
      icon: Network,
      href: `/clients/${client.id}/diagram`,
      accent: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Proyectos",
      description: "Plan",
      icon: Rocket,
      href: `/clients/${client.id}/implementation`,
      accent: "bg-purple-50 text-purple-600",
    },
    {
      title: "Abrir Ticket",
      description: "Soporte",
      icon: TicketIcon,
      href: `/tickets/new?clientId=${client.id}`,
      accent: "bg-amber-100 text-amber-700 border-amber-200",
      primary: true
    },
    {
      title: "Cargar Pago",
      description: "Admin",
      icon: DollarSign,
      href: `/payments?clientId=${client.id}&action=new`,
      accent: "bg-indigo-100 text-indigo-700 border-indigo-200",
      primary: true
    },
  ];

  const tabList = [
      { id: 'movimientos', label: 'Todos', icon: History, count: movementRows.length },
      { id: 'tickets', label: 'Tickets', icon: TicketIcon, count: tickets.length },
      { id: 'pagos', label: 'Pagos', icon: DollarSign, count: payments.length },
      { id: 'repositorio', label: 'Inventario', icon: Monitor, count: repositoryItems.length },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={<ShinyText size="3xl" weight="bold">{client.name}</ShinyText>}
        subtitle="Gestión centralizada del cliente"
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
        actions={
            <div className="flex items-center gap-2">
                 <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 text-[10px] font-mono px-2">
                    ID: {client.id}
                 </Badge>
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
            { key: "notificationsEnabled", label: "Notificaciones", type: "checkbox", icon: Bell },
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
            client={client}
            onSave={(updates) => handleCardSave("contract", updates)}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Recursos y Acciones</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {resourceCards.map((card) => {
              const ContentIcon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="group block h-full">
                  <div className={cn(
                    "flex flex-col items-center justify-center h-full rounded-xl border border-slate-100 p-3 transition-all hover:shadow-md active:scale-95",
                    card.accent,
                    card.primary ? "border-2 shadow-sm font-bold" : "hover:bg-white hover:border-blue-200"
                  )}>
                    <ContentIcon className={cn("h-5 w-5 mb-1", card.primary ? "animate-pulse" : "text-slate-600 group-hover:text-blue-600")} />
                    <p className="text-[10px] uppercase text-center leading-tight">{card.title}</p>
                  </div>
                </Link>
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

      <section className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
        {tabList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMovementPage(1); }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                        isActive 
                            ? "bg-white text-emerald-700 shadow-sm border border-emerald-100" 
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    )}
                >
                    <Icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                    {tab.label}
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 h-4 border-none", isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600")}>
                        {tab.count}
                    </Badge>
                </button>
            );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {tabList.find(t => t.id === activeTab)?.label}
                <span className="text-slate-400 font-normal text-xs">— Historial</span>
            </h3>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Filtrar historial..."
                        value={movementSearch}
                        onChange={(e) => setMovementSearch(e.target.value)}
                        className="h-9 w-64 pl-9 text-xs border-slate-200 rounded-xl bg-white"
                    />
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Descripción</th>
                <th className="px-6 py-3 font-semibold">Importe / Ref</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMovements.map((movement) => {
                const dateLabel = movement.date ? new Date(movement.date).toLocaleDateString() : "—";
                const amountLabel = typeof movement.amount === "number" ? formatCurrency(movement.amount) : (movement.reference || "—");
                
                const detailHref = (() => {
                  if (movement.type === "Ticket") return `/tickets/${movement.id}`;
                  if (movement.type === "Pago") return `/payments?search=${movement.id}`;
                  if (movement.type === "Repositorio") return `/clients/${client.id}/repository/access`;
                  return "#";
                })();

                return (
                  <tr key={`${movement.type}-${movement.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium">{dateLabel}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-500 uppercase px-1.5 h-5">
                                {movement.type}
                            </Badge>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 line-clamp-1">{movement.description}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{amountLabel}</td>
                    <td className="px-6 py-4">
                        <Badge className={cn("text-[10px] font-bold border-none px-2", getStatusTone(movement.status))}>
                            {movement.status || "—"}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                            <Link href={detailHref}>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </Link>
                        </Button>
                    </td>
                  </tr>
                );
              })}
              {paginatedMovements.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center text-slate-400">
                              <Hash className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-sm">No se encontraron registros.</p>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
            <p>Mostrando {paginatedMovements.length} de {filteredMovements.length} resultados</p>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg"
                    disabled={movementPage === 1}
                    onClick={() => setMovementPage(p => p - 1)}
                >Anterior</Button>
                <span className="px-2">Página {movementPage} de {totalMovementPages}</span>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg"
                    disabled={movementPage === totalMovementPages}
                    onClick={() => setMovementPage(p => p + 1)}
                >Siguiente</Button>
            </div>
        </div>
      </section>

    </div >
  );
}

function getStatusTone(status?: string) {
    if (!status) return "bg-slate-100 text-slate-500";
    const s = status.toLowerCase();
    if (s.includes("pagado") || s.includes("complet") || s.includes("cerrado")) return "bg-emerald-100 text-emerald-700";
    if (s.includes("pendiente") || s.includes("abierto")) return "bg-amber-100 text-amber-700";
    if (s.includes("error") || s.includes("fallido") || s.includes("vencido")) return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-500";
}

function ContractSelectionCard({
  contracts,
  selectedContractId,
  onContractSelect,
  client,
  onSave
}: {
  contracts: ClientContract[];
  selectedContractId: string | null;
  onContractSelect: (id: string | null) => void;
  payments: Payment[];
  client: Client;
  onSave: (updates: Partial<Client>) => Promise<void>;
}) {
  const selectedContract = contracts.find(
    (contract) => contract.id === selectedContractId
  );
  const hasContract = Boolean(selectedContract);
  const [openConfig, setOpenConfig] = useState(false);
  const [localAmount, setLocalAmount] = useState(client.recurringAmount || 0);
  const [localCurrency, setLocalCurrency] = useState(client.recurringCurrency || "UYU");

  return (
    <section
      className={`relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-green-50 p-5 shadow-sm transition-all duration-500 ${hasContract ? "border-emerald-400 ring-2 ring-emerald-100 ring-offset-2" : "border-slate-200"
        }`}
    >
      <div className="absolute -right-6 -top-6 opacity-10">
        <Award className={`h-32 w-32 text-emerald-600 ${hasContract ? 'animate-pulse' : ''}`} />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Contrato vigente
                </p>
                <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-emerald-100/50 border border-emerald-200">
                    <Checkbox 
                        id="contract-active"
                        checked={!!client.contract} 
                        onCheckedChange={(checked) => onSave({ contract: !!checked })}
                        className="h-3 w-3 border-emerald-400 data-[state=checked]:bg-emerald-600"
                    />
                    <Label htmlFor="contract-active" className="text-[9px] font-black text-emerald-800 cursor-pointer">ACTIVO</Label>
                </div>
            </div>
            <div className="flex flex-col gap-2">
              {contracts.length > 0 ? (
                <Select value={selectedContractId || ""} onValueChange={onContractSelect}>
                    <SelectTrigger className="h-9 bg-white/80 border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl shadow-sm">
                        <SelectValue placeholder="Seleccionar contrato" />
                    </SelectTrigger>
                    <SelectContent>
                        {contracts.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-slate-600 italic">Sin contratos disponibles</p>
              )}
            </div>
          </div>
          {hasContract && (
            <div className="rounded-full bg-emerald-100 p-2 border border-emerald-200 shadow-sm">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
          )}
        </div>

        {selectedContract && (
          <div className="space-y-3 py-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(selectedContract.amount ?? 0, selectedContract.currency)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">por mes</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex flex-col">
                    <span className="text-emerald-700 font-bold uppercase opacity-60">Inicio</span>
                    <span className="font-bold text-slate-700">{formatDate(selectedContract.startDate)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-emerald-700 font-bold uppercase opacity-60">Vencimiento</span>
                    <span className="font-bold text-slate-700">{formatDate(selectedContract.endDate)}</span>
                </div>
            </div>
          </div>
        )}

        <div className="border-t border-emerald-200/50 pt-3 mt-auto">
             <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pago Recurrente</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Dialog open={openConfig} onOpenChange={setOpenConfig}>
                        <DialogTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors">
                                <Edit2 className="h-3 w-3" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-3xl p-6">
                            <DialogHeader>
                                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                    <CreditCard className="h-6 w-6 text-emerald-600" />
                                </div>
                                <DialogTitle className="text-center text-xl font-bold">Configuración de Pago</DialogTitle>
                                <p className="text-center text-slate-500 text-sm">Define los valores para la facturación automática mensual.</p>
                            </DialogHeader>
                            <div className="space-y-6 py-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Monto Mensual</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input 
                                                type="number" 
                                                className="h-11 pl-9 rounded-2xl border-slate-200 font-bold"
                                                value={localAmount}
                                                onChange={(e) => setLocalAmount(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Moneda</Label>
                                        <Select 
                                            value={localCurrency}
                                            onValueChange={setLocalCurrency}
                                        >
                                            <SelectTrigger className="h-11 rounded-2xl border-slate-200 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UYU">Pesos (UYU)</SelectItem>
                                                <SelectItem value="USD">Dólares (USD)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                                            <Bell className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">Facturación el día 1</p>
                                            <p className="text-[10px] text-slate-400">Se generará un pago pendiente automáticamente.</p>
                                        </div>
                                    </div>
                                    <Checkbox 
                                        checked={!!client.recurringPaymentEnabled}
                                        onCheckedChange={(val) => onSave({ recurringPaymentEnabled: !!val })}
                                        className="h-5 w-5 rounded-md"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all"
                                    onClick={() => {
                                        onSave({ recurringAmount: localAmount, recurringCurrency: localCurrency });
                                        setOpenConfig(false);
                                    }}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar Pago
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Checkbox 
                        id="recurring-enabled"
                        checked={!!client.recurringPaymentEnabled} 
                        onCheckedChange={(checked) => onSave({ recurringPaymentEnabled: !!checked })}
                        className="h-4 w-4 border-emerald-400 data-[state=checked]:bg-emerald-600"
                    />
                 </div>
             </div>
             {client.recurringPaymentEnabled ? (
                 <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2 border border-emerald-200/30 shadow-sm">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-800 leading-none">Generación Activa</span>
                        </div>
                        <span className="text-[9px] text-emerald-600/70 mt-1 font-medium">Auto-invoice día 1 cada mes</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                        {formatCurrency(client.recurringAmount || 0, client.recurringCurrency)}
                    </span>
                 </div>
             ) : (
                <div className="p-2 rounded-xl bg-slate-100/50 border border-slate-200/50 text-center">
                    <p className="text-[10px] text-slate-400 italic">Facturación automática desactivada</p>
                </div>
             )}
        </div>
      </div>
    </section>
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
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const buildInitialValues = () => {
    const values: Record<string, any> = {};
    fields.forEach((field) => {
      const currentValue = client[field.key];
      values[String(field.key)] = currentValue ?? (field.type === "checkbox" ? false : "");
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
    await onSave(formValues);
    setOpen(false);
  };

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-100">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-800 tracking-tight">{title}</p>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{description}</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                <Edit2 className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1320px] max-h-[90vh] overflow-y-visible rounded-3xl p-6">
            <DialogHeader className="pb-1">
              <DialogTitle>Editar {title.toLowerCase()}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {fields.map((field) => {
                  const key = String(field.key);
                  const value = formValues[key];
                  const spanClasses =
                    field.type === "checkbox" || field.type === "textarea"
                      ? "md:col-span-2"
                      : "";

                  if (field.type === "checkbox") {
                    return (
                      <div
                        key={key}
                        className={cn(
                          spanClasses,
                          "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
                        )}
                      >
                        <Checkbox
                          id={key}
                          checked={!!value}
                          onCheckedChange={(checked) => handleChange(key, !!checked)}
                          className="border-slate-300"
                        />
                        <Label
                          htmlFor={key}
                          className="text-sm font-semibold leading-none cursor-pointer flex items-center gap-2"
                        >
                          {field.icon && (
                            <field.icon className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          {field.label}
                        </Label>
                      </div>
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <div
                        key={key}
                        className={cn(spanClasses, "space-y-2")}
                      >
                        <Label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                          {field.icon && (
                            <field.icon className="h-3.5 w-3.5" />
                          )}
                          {field.label}
                        </Label>
                        <Textarea
                          value={value ?? ""}
                          onChange={(event) =>
                            handleChange(key, event.target.value)
                          }
                          placeholder={field.placeholder}
                          className="min-h-[110px] rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-100 transition-all"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className={cn(spanClasses, "space-y-2")}
                    >
                      <Label className="text-xs font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                        {field.icon && (
                          <field.icon className="h-3.5 w-3.5" />
                        )}
                        {field.label}
                      </Label>
                      <Input
                        type={field.type ?? "text"}
                        value={value ?? ""}
                        onChange={(event) =>
                          handleChange(key, event.target.value)
                        }
                        placeholder={field.placeholder}
                        className="h-11 rounded-2xl border border-slate-200 px-3 text-sm shadow-sm focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-100 transition-all"
                      />
                    </div>
                  );
                })}
              </div>
              <DialogFooter className="mt-2 border-t pt-4">
                <Button type="submit" disabled={isSaving} className="h-11 rounded-2xl px-8 bg-emerald-600 hover:bg-emerald-700">
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2 text-sm flex-1">
          {fields.map((field) => {
            const rawValue = client[field.key];
            
            if (field.type === "checkbox") {
              return (
                <div key={String(field.key)} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    {field.icon && <field.icon className="h-3 w-3" />}
                    {field.label}
                  </span>
                  <Badge variant={rawValue ? "default" : "outline"} className={cn("text-[9px] uppercase px-1.5 h-4 border-none", rawValue ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                    {rawValue ? "Sí" : "No"}
                  </Badge>
                </div>
              );
            }

            const displayValue =
              field.format?.(rawValue) ??
              (rawValue === null || rawValue === undefined || rawValue === ""
                ? "—"
                : String(rawValue));

            return (
              <div
                key={String(field.key)}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
              >
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  {field.icon && <field.icon className="h-3 w-3" />}
                  {field.label}
                </span>
                <span className="font-bold text-slate-700 truncate ml-4 max-w-[120px]">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
