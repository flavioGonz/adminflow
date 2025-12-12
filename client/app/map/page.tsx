"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { updateClient } from "@/lib/api-clients";
import { API_URL } from "@/lib/http";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  ClipboardList,
  ShieldCheck,
  FileText,
  Ticket,
} from "lucide-react";
import { DefaultLeafletIcon } from "@/lib/leaflet-icon";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const defaultPoints: Record<string, { lat: number; lng: number }> = {
  "1": { lat: -34.90328, lng: -56.18816 },
  "2": { lat: -34.965, lng: -54.945 },
  "3": { lat: -34.46, lng: -57.833 },
};

interface ClientMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address: string;
  contract: boolean;
  icon: any;
  openTickets: { id: string; title?: string }[];
}

const markerSvg = `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
    <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 5 10.999 7 13 2-2.001 7-7.75 7-13 0-3.866-3.134-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
  </svg>`;

const createMarkerHtml = (contract: boolean, badgeHtml: string) => {
  const variantClass = contract ? "marker-icon-green" : "marker-icon-orange";
  return `<div class="marker-icon ${variantClass}">
      ${markerSvg}
      ${badgeHtml}
    </div>`;
};

const badgeStatuses = new Set(["nuevo", "abierto", "en proceso", "visita"]);
const shouldConsiderTicketOpen = (status?: string) => {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return badgeStatuses.has(normalized);
};

interface PendingLocation {
  clientId: string;
  clientName: string;
  newCoords: { lat: number; lng: number };
  previousCoords: { lat: number; lng: number };
}

export default function MapPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [highlightLocation, setHighlightLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [highlightLabel, setHighlightLabel] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { lat: number; lng: number }>>(
    defaultPoints
  );
  const [leafletModule, setLeafletModule] = useState<any>(null);
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSavingPendingLocation, setIsSavingPendingLocation] = useState(false);
  const [clientTickets, setClientTickets] = useState<
    Record<string, { id: string; title?: string }[]>
  >({});

  useEffect(() => {
    import("leaflet").then((Leaflet) => {
      setLeafletModule(Leaflet);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadClients = async () => {
      try {
        const response = await fetch(`${API_URL}/clients`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los clientes.");
        const data: Client[] = await response.json();
        setClients(data);
        const updatedLocations: Record<string, { lat: number; lng: number }> = {};
        data.forEach((client) => {
          if (client.latitude != null && client.longitude != null) {
            updatedLocations[client.id] = {
              lat: client.latitude,
              lng: client.longitude,
            };
          }
        });
        setPositions((prev) => ({ ...prev, ...updatedLocations }));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error cargando clientes", error);
      }
    };
    loadClients();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadTickets = async () => {
      try {
        const response = await fetch(`${API_URL}/tickets`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron cargar los tickets.");
        const data: { clientId?: string; status?: string; title?: string; id: string }[] =
          await response.json();
        const counts: Record<string, number> = {};
        const grouped: Record<string, { id: string; title?: string }[]> = {};
        data.forEach((ticket) => {
          if (!ticket.clientId) return;
          if (!shouldConsiderTicketOpen(ticket.status)) return;
          counts[ticket.clientId] = (counts[ticket.clientId] ?? 0) + 1;
          grouped[ticket.clientId] = grouped[ticket.clientId] || [];
          grouped[ticket.clientId].push({ id: ticket.id, title: ticket.title });
        });
        setTicketCounts(counts);
        setClientTickets(grouped);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error cargando tickets", error);
      }
    };
    loadTickets();
    return () => controller.abort();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!normalizedQuery) return clients;
    return clients.filter((client) => {
      const rut = client.rut ?? "";
      const alias = client.alias ?? "";
      const email = client.email ?? "";
      const phone = client.phone ?? "";
      return (
        client.name.toLowerCase().includes(normalizedQuery) ||
        email.toLowerCase().includes(normalizedQuery) ||
        phone.toLowerCase().includes(normalizedQuery) ||
        alias.toLowerCase().includes(normalizedQuery) ||
        rut.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [clients, normalizedQuery]);

  const clientSearchResults = normalizedQuery ? filteredClients : [];

  const markers = useMemo(() => {
    if (!leafletModule) return [];
    return filteredClients
      .map((client) => {
        const coords = positions[client.id] ?? defaultPoints[client.id];
        if (!coords) return null;
        const badgeCount = ticketCounts[client.id] ?? 0;
        const badgeHtml = badgeCount
          ? `<span class="marker-badge">${badgeCount}</span>`
          : "";
        const hasContract = Boolean(client.contract);
        const iconHtml = createMarkerHtml(hasContract, badgeHtml);
        const size = hasContract ? [32, 32] : [28, 28];
        const anchor = hasContract ? [16, 32] : [14, 28];
        const icon = leafletModule.divIcon({
          className: `client-marker ${hasContract ? "active-marker" : "inactive-marker"}`,
          html: iconHtml,
          iconSize: size,
          iconAnchor: anchor,
        });
        return {
          id: client.id,
          lat: coords.lat,
          lng: coords.lng,
          name: client.name,
          address: client.address ?? "Sin dirección registrada",
          contract: hasContract,
          openTickets: clientTickets[client.id] ?? [],
          icon,
        };
      })
      .filter((marker): marker is ClientMarker & { icon: any } => Boolean(marker));
  }, [filteredClients, positions, leafletModule, ticketCounts]);

  const handleSelectClient = (clientId: string, address?: string) => {
    setSelectedClientId(clientId);
    if (address) {
      setHighlightLabel(address);
    }
    const coords = positions[clientId] ?? defaultPoints[clientId];
    if (coords) {
      setHighlightLocation(coords);
    }
  };

  const handleMarkerDragEnd = (marker: ClientMarker, event: any) => {
    if (confirmOpen) {
      toast.error("Confirma o cancela la ubicación anterior antes de mover otro marcador.");
      return;
    }
    const latlng = event.target.getLatLng();
    const prevCoords = positions[marker.id] ?? defaultPoints[marker.id];
    const newCoords = { lat: latlng.lat, lng: latlng.lng };
    setPositions((prev) => ({
      ...prev,
      [marker.id]: newCoords,
    }));
    setPendingLocation({
      clientId: marker.id,
      clientName: marker.name,
      newCoords,
      previousCoords: prevCoords,
    });
    setConfirmOpen(true);
  };

  const handleConfirmLocation = async () => {
    if (!pendingLocation) return;
    setIsSavingPendingLocation(true);
    try {
      const clientToUpdate = clients.find((client) => client.id === pendingLocation.clientId);
      if (!clientToUpdate) {
        toast.error("Cliente no encontrado.");
        return;
      }
      await updateClient(pendingLocation.clientId, {
        name: clientToUpdate.name,
        alias: clientToUpdate.alias,
        rut: clientToUpdate.rut,
        email: clientToUpdate.email,
        phone: clientToUpdate.phone,
        address: highlightLabel || clientToUpdate.address,
        contract: clientToUpdate.contract,
        latitude: pendingLocation.newCoords.lat,
        longitude: pendingLocation.newCoords.lng,
      });
      setClients((prev) =>
        prev.map((client) =>
          client.id === pendingLocation.clientId
            ? {
                ...client,
                latitude: pendingLocation.newCoords.lat,
                longitude: pendingLocation.newCoords.lng,
              }
            : client
        )
      );
      toast.success("Ubicación guardada.");
    } catch (error) {
      console.error("Save client location failed", error);
      toast.error("No se pudo guardar la ubicación.");
    } finally {
      setIsSavingPendingLocation(false);
      setPendingLocation(null);
      setConfirmOpen(false);
    }
  };

  const handleCancelLocation = () => {
    if (pendingLocation) {
      setPositions((prev) => ({
        ...prev,
        [pendingLocation.clientId]: pendingLocation.previousCoords,
      }));
    }
    setPendingLocation(null);
    setConfirmOpen(false);
  };

  const handleSaveLocation = async () => {
    if (!selectedClientId) {
      toast.error("Selecciona un cliente primero.");
      return;
    }
    const coords = positions[selectedClientId];
    if (!coords) {
      toast.error("Posición válida requerida.");
      return;
    }
    try {
      const clientToUpdate = clients.find((client) => client.id === selectedClientId);
      if (!clientToUpdate) {
        toast.error("Cliente no encontrado.");
        return;
      }
      await updateClient(selectedClientId, {
        name: clientToUpdate.name,
        alias: clientToUpdate.alias,
        rut: clientToUpdate.rut,
        email: clientToUpdate.email,
        phone: clientToUpdate.phone,
        address: highlightLabel || clientToUpdate.address,
        contract: clientToUpdate.contract,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      toast.success("Ubicación guardada.");
      setClients((prev) =>
        prev.map((client) =>
          client.id === selectedClientId
            ? { ...client, latitude: coords.lat, longitude: coords.lng }
            : client
        )
      );
    } catch (error) {
      toast.error("No se pudo guardar la ubicación.");
      console.error("Save client location failed", error);
    }
  };

  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) {
      toast.error("Escribe una dirección válida.");
      return;
    }
    const params = new URLSearchParams({
      q: addressQuery.trim(),
      format: "json",
      addressdetails: "0",
      limit: "4",
    });
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "User-Agent": "AdminFlow-Map/1.0",
          },
        }
      );
      const results = await response.json();
      setAddressResults(results);
    } catch (error) {
      console.error("address lookup failed", error);
      toast.error("No se pudo buscar la dirección.");
    }
  };

  useEffect(() => {
    if (highlightLocation) {
      setPositions((prev) => ({
        ...prev,
        highlighted: highlightLocation,
      }));
    }
  }, [highlightLocation]);

  const handleReturn = () => {
    router.back();
  };

  return (
    <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-transparent text-white">
      <MapContainer
        center={highlightLocation ? [highlightLocation.lat, highlightLocation.lng] : [-34.9, -56.2]}
        zoom={6}
        scrollWheelZoom
        className="fixed inset-0 z-0"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={marker.icon || DefaultLeafletIcon}
            draggable
            eventHandlers={{
              dragend: (event) => handleMarkerDragEnd(marker, event),
            }}
          >
            <Popup className="min-w-[180px]">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{marker.name}</p>
                <p className="text-xs text-muted-foreground">{marker.address}</p>
                <div className="text-[0.65rem] text-white/60">
                  Contrato: {marker.contract ? "Activo" : "Sin contrato"}
                </div>
                <Badge
                  variant="outline"
                  className="mt-1 text-[0.55rem] uppercase tracking-[0.2em]"
                >
                  {marker.contract ? "Contrato activo" : "Sin contrato"}
                </Badge>
                {marker.openTickets.length > 0 && (
                  <a
                    href={`/tickets/${marker.openTickets[0].id}`}
                    className="mt-1 flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-200"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Ticket className="h-3 w-3" />
                    Ticket #{marker.openTickets[0].id}
                  </a>
                )}
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <a
                    href={`/payments?clientId=${marker.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Ver pagos"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <CreditCard className="h-4 w-4" />
                  </a>
                  <a
                    href={`/tickets?clientId=${marker.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Ver tickets"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </a>
                  <a
                    href={`/contracts?clientId=${marker.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Ver contratos"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </a>
                  <a
                    href={`/repository?clientId=${marker.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                    title="Ver repositorio"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-slate-950/80 via-slate-950/30 to-slate-950/70" />
      <div className="absolute top-6 left-6 z-30">
        <Button
          variant="ghost"
          className="bg-slate-900/80 text-white hover:bg-slate-900"
          onClick={handleReturn}
        >
          Volver
        </Button>
      </div>
      <div className="absolute top-6 right-6 z-30 w-full max-w-lg space-y-4 p-4 lg:p-6 pointer-events-auto">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Buscar cliente
            </p>
            <Badge
              variant="outline"
              className="text-[0.65rem] uppercase tracking-[0.2em] text-white/70"
            >
              Geo
            </Badge>
          </div>
          <Input
            placeholder="Nombre, email o alias"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-3 bg-white/10 text-white placeholder:text-white/60"
          />
          <div className="mt-4 space-y-2 text-sm text-white/80">
            {!normalizedQuery ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                Escribe un término para ver resultados
              </div>
            ) : clientSearchResults.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                Sin coincidencias
              </div>
            ) : (
              clientSearchResults.slice(0, 6).map((client) => (
                <button
                  key={client.id}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-white transition ${
                    selectedClientId === client.id
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/40"
                  }`}
                  onClick={() => handleSelectClient(client.id, client.address)}
                >
                  <div>
                    <p className="text-sm font-semibold">{client.name}</p>
                    <p className="text-[0.65rem] text-white/60">{client.email}</p>
                  </div>
                  <Badge
                    variant={client.contract ? "secondary" : "outline"}
                    className="text-[0.65rem] uppercase tracking-[0.2em]"
                  >
                    {client.contract ? "Contrato" : "Sin contrato"}
                  </Badge>
                </button>
              ))
            )}
          </div>
          <div className="mt-4">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/60">Buscar dirección real</p>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Ej: Av. 18 de Julio 1234"
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                className="bg-white/10 text-white placeholder:text-white/60"
              />
              <Button variant="secondary" size="sm" onClick={handleAddressSearch}>
                Buscar
              </Button>
            </div>
            <div className="mt-3 max-h-36 overflow-auto space-y-2 text-xs text-white/70">
              {addressResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lon}`}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition hover:border-white/40"
                  onClick={() => {
                    const coords = { lat: Number(result.lat), lng: Number(result.lon) };
                    setHighlightLocation(coords);
                    setHighlightLabel(result.display_name);
                    setAddressResults([]);
                    if (selectedClientId) {
                      setPositions((prev) => ({
                        ...prev,
                        [selectedClientId]: coords,
                      }));
                    }
                  }}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4">
            <span className="text-[0.65rem] text-white/60">Guardar coordenadas</span>
            <Button variant="outline" size="sm" onClick={handleSaveLocation} disabled={!selectedClientId}>
              Guardar
            </Button>
          </div>
        </div>
      </div>
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && pendingLocation) {
            handleCancelLocation();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar nueva ubicación</DialogTitle>
            <DialogDescription>
              {pendingLocation
                ? `Guardar la nueva ubicación para ${pendingLocation.clientName}?`
                : "Guardar la nueva ubicación del cliente seleccionado?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelLocation}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={handleConfirmLocation}
              disabled={isSavingPendingLocation}
            >
              {isSavingPendingLocation ? "Guardando..." : "Confirmar ubicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
