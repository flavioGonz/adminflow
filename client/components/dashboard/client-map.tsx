"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js
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

type ClientDot = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    contract: boolean;
};

interface ClientMapProps {
    clientDots: ClientDot[];
}

export default function ClientMap({ clientDots }: ClientMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={[-34.884, -56.17]}
            zoom={10}
            className="h-full w-full rounded"
            scrollWheelZoom
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {clientDots.map((client) => (
                <CircleMarker
                    key={client.id}
                    center={[client.lat, client.lng]}
                    radius={6}
                    pathOptions={{
                        color: client.contract ? "#10b981" : "#f59e0b",
                        fillColor: client.contract ? "#10b981" : "#f59e0b",
                        fillOpacity: 0.8,
                        weight: 2,
                    }}
                >
                    <Popup className="text-sm">
                        <strong>{client.name}</strong>
                        <div className="text-xs text-muted-foreground">
                            {client.contract ? "Con contrato" : "Sin contrato"}
                        </div>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
