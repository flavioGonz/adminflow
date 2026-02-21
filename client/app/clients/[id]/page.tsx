"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";
import { Client } from "@/types/client";
import { Ticket } from "@/types/ticket";
import { MobileClientDetails } from "@/components/clients/mobile-client-details";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([
      fetch(`${API_URL}/clients/${params.id}`).then(res => res.json()),
      fetch(`${API_URL}/clients/${params.id}/tickets`).then(res => res.json())
    ]).then(([clientData, ticketsData]) => {
      setClient(clientData);
      setTickets(ticketsData);
      setIsLoading(false);
    }).catch(() => {
      toast.error("Error al cargar ficha del cliente");
      setIsLoading(false);
    });
  }, [params?.id]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!client) return <div className="p-8 text-center">Cliente no encontrado</div>;

  return (
    <>
      <div className="mobile-cards-view">
        <MobileClientDetails client={client} tickets={tickets} />
      </div>
      <div className="desktop-table-view p-8">
        <h1 className="text-2xl font-bold">{client.name}</h1>
        {/* Contenido escritorio... */}
      </div>
    </>
  );
}
