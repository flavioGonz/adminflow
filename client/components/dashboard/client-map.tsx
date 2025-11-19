"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.CircleMarker[]>([]);

    useEffect(() => {
        // Fix for default marker icons
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

        // Initialize map if not already initialized
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                scrollWheelZoom: true,
            }).setView([-34.884, -56.17], 10);

            L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
            }).addTo(map);

            mapInstanceRef.current = map;
        }

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update markers when clientDots change
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        clientDots.forEach(client => {
            const color = client.contract ? "#10b981" : "#f59e0b";

            const marker = L.circleMarker([client.lat, client.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
                radius: 6
            }).addTo(mapInstanceRef.current!);

            marker.bindPopup(`
                <div class="text-sm">
                    <strong>${client.name}</strong>
                    <div class="text-xs text-gray-500">
                        ${client.contract ? "Con contrato" : "Sin contrato"}
                    </div>
                </div>
            `);

            markersRef.current.push(marker);
        });
    }, [clientDots]);

    return (
        <div
            ref={mapContainerRef}
            className="h-full w-full rounded"
            style={{ height: "100%", width: "100%", minHeight: "300px" }}
        />
    );
}
