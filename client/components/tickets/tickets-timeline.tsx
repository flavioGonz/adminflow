"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket } from "@/types/ticket";
import { API_URL } from "@/lib/http";

interface TicketsTimelineProps {
  tickets: Ticket[];
  period?: "day" | "week" | "month";
}

type TimelineEvent = {
  id: string;
  ticketId: string;
  type: "Creación" | "Actualización" | "Nota";
  date: Date;
  title?: string;
  clientName?: string;
  assignedTo?: string | null;
};

export function TicketsTimeline({ tickets, period = "day" }: TicketsTimelineProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; avatar?: string }>>([]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`${API_URL}/users`, { signal: controller.signal });
        if (!response.ok) throw new Error("users load failed");
        setUsers(await response.json());
      } catch (error) {
        if ((error as DOMException)?.name !== "AbortError") console.error(error);
      }
    })();
    return () => controller.abort();
  }, []);

  const stripTags = (text?: string) => (text ? text.replace(/<[^>]*>/g, "").trim() : "");
  const formatDateTime = (date: Date) =>
    `${date.toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}`;

  const getDisplayTitle = (text?: string) => {
    const raw = stripTags(text) || "";
    const normalized = raw.replace(/\s+/g, " ").trim();
    const markers = ["Estado:", "Monto:", "Detalle", "Detalles", "Detalle técnico", "Detalle tecnico"];
    let cut = normalized;
    markers.forEach((marker) => {
      const idx = cut.indexOf(marker);
      if (idx > 0) cut = cut.slice(0, idx);
    });
    const trimmed = cut.trim();
    if (!trimmed) return "(sin título)";
    return trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed;
  };

  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = [];
    tickets.forEach((ticket) => {
      // Priority: show latest comments/notes first (max 3 per ticket)
      const noteEvents = (ticket.annotations || [])
        .filter(note => note?.createdAt)
        .map((note, index) => ({
          id: `${ticket.id}-note-${index}`,
          ticketId: ticket.id,
          type: "Nota" as const,
          date: new Date(note.createdAt!),
          title: ticket.title,
          clientName: ticket.clientName,
          assignedTo: ticket.assignedTo ?? null,
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3); // Show only 3 latest notes
      result.push(...noteEvents);

      // Secondary: creation event
      if (ticket.createdAt) {
        result.push({
          id: `${ticket.id}-created`,
          ticketId: ticket.id,
          type: "Creación",
          date: new Date(ticket.createdAt),
          title: ticket.title,
          clientName: ticket.clientName,
          assignedTo: ticket.assignedTo ?? null,
        });
      }
    });
    return result;
  }, [tickets]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const buckets = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    const labels: string[] = [];
    const map: Record<string, TimelineEvent[]> = {};

    const addLabel = (label: string) => {
      labels.push(label);
      map[label] = map[label] || [];
    };

    if (period === "day") {
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) addLabel(`${h}:00`);
      events.forEach((event) => {
        if (event.date >= start && event.date < end) {
          map[`${event.date.getHours()}:00`].push(event);
        }
      });
    } else if (period === "week") {
      const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const dow = start.getDay();
      start.setDate(start.getDate() - dow);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      names.forEach(addLabel);
      events.forEach((event) => {
        if (event.date >= start && event.date < end) {
          map[names[event.date.getDay()]].push(event);
        }
      });
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) addLabel(String(d));
      events.forEach((event) => {
        if (event.date >= start && event.date < end) {
          map[String(event.date.getDate())].push(event);
        }
      });
    }

    return { labels, map, start, end };
  }, [events, period]);

  const currentMarkerPercent = useMemo(() => {
    if (!buckets.start || !buckets.end) return null;
    const now = new Date();
    if (now < buckets.start || now >= buckets.end) return null;
    const span = buckets.end.getTime() - buckets.start.getTime();
    if (span <= 0) return null;
    const percent = ((now.getTime() - buckets.start.getTime()) / span) * 100;
    return Math.min(100, Math.max(0, percent));
  }, [buckets.end, buckets.start]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (currentMarkerPercent === null) {
      el.style.removeProperty("--marker-left");
    } else {
      el.style.setProperty("--marker-left", `${currentMarkerPercent}%`);
    }
  }, [currentMarkerPercent]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-[11px] text-muted-foreground w-full">
        {buckets.labels.map((label) => (
          <span key={label} className="flex-1 text-center truncate">
            {label}
          </span>
        ))}
      </div>
      <div ref={containerRef} className="relative flex w-full items-end h-16 rounded-md border px-2 py-2">
        {currentMarkerPercent !== null && (
          <div className="absolute inset-y-1 w-px bg-emerald-500/70 pointer-events-none left-[var(--marker-left)]" />
        )}
        {buckets.labels.map((label) => {
          const evs = buckets.map[label] || [];
          const display = evs.slice(0, 4);
          const overflow = Math.max(0, evs.length - 4);
          return (
            <div key={label} className="relative flex flex-col items-center flex-1">
              <div className="flex -space-x-1 mb-1">
                {display.map((ev) => (
                  <TooltipProvider key={ev.id} delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={`h-2.5 w-2.5 rounded-full border border-white ${
                            ev.type === "Creación"
                              ? "bg-sky-500"
                              : ev.type === "Actualización"
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                          }`}
                          whileHover={{ scale: 1.15 }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[320px] space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-semibold leading-tight break-words">
                          <span>{getDisplayTitle(ev.title)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const user = users.find((u) => u.email === ev.assignedTo);
                            const avatarUrl = user?.avatar?.startsWith("http")
                              ? user.avatar
                              : user?.avatar
                              ? `${API_URL.replace("/api", "")}${user.avatar}`
                              : ev.assignedTo
                              ? `${API_URL.replace("/api", "")}/avatars/${ev.assignedTo}`
                              : undefined;
                            const fallback = (user?.name || ev.assignedTo || "U").charAt(0).toUpperCase();
                            return (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={avatarUrl} alt={user?.name || ev.assignedTo || "usuario"} />
                                <AvatarFallback>{fallback}</AvatarFallback>
                              </Avatar>
                            );
                          })()}
                          <span className="text-[11px] font-medium truncate">
                            {users.find((u) => u.email === ev.assignedTo)?.name || ev.assignedTo || "Sin asignar"}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{formatDateTime(ev.date)}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{ev.clientName}</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              {overflow > 0 && (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                  +{overflow}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
