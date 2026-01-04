"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import dynamic from "next/dynamic";
import {
  CloudLightning,
  DownloadCloud,
  Map,
  PlusCircle,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  LayoutDashboard,
  Timer,
  RefreshCw,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Client } from "@/types/client";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShinyText } from "@/components/ui/shiny-text";
import { cn } from "@/lib/utils";

const ClientMap = dynamic(() => import("@/components/dashboard/client-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
});

const SystemTopology = dynamic(() => import("@/components/dashboard/system-topology"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><p className="text-sm text-muted-foreground">Cargando topología...</p></div>
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

type DashboardStats = {
  clients: number;
  tickets: number;
  budgets: number;
  contracts: number;
  payments: number;
};


type WidgetConfig = {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  cols: 1 | 2 | 3 | 4;
};

// Componente de contador animado mejorado con framer-motion
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <motion.span
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {count.toLocaleString()}
  </motion.span>;
}

// Sparkline simplificado
function Sparkline({ data, color }: { data: number[], color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Componente sortable para widgets
function SortableWidget({ id, cols, children }: { id: string; cols: number; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Clases de columnas basadas en el tamaño del widget
  const colSpanClass =
    cols === 1 ? 'col-span-1' :
      cols === 2 ? 'col-span-2' :
        cols === 3 ? 'col-span-3' :
          'col-span-4';

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${colSpanClass}`}>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 rounded p-1 shadow-md"
      >
        <GripVertical className="h-4 w-4 text-gray-500" />
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    tickets: 0,
    budgets: 0,
    contracts: 0,
    payments: 0,
  });
  const [recentActivities, setRecentActivities] = useState<{ action: string; details: string; timestamp: string }[]>([]);
  const [topTickets, setTopTickets] = useState<{ id: string; title: string; priority: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ email: string; role: string }[]>([]);
  const [radarData, setRadarData] = useState<any>(null);

  // Configuración de widgets con tamaños
  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'line-chart', name: 'Actividad de Tickets', enabled: true, order: 0, cols: 3 },
    { id: 'doughnut-chart', name: 'Estado de Tickets', enabled: true, order: 1, cols: 1 },
    { id: 'bar-chart', name: 'Presupuestos Mensuales', enabled: true, order: 2, cols: 2 },
    { id: 'radar-chart', name: 'Rendimiento por Área', enabled: true, order: 3, cols: 2 },
    { id: 'map', name: 'Ubicación de Clientes', enabled: true, order: 4, cols: 2 },
    { id: 'activities', name: 'Actividad Reciente', enabled: true, order: 5, cols: 2 },
    { id: 'online-users', name: 'Usuarios del Sistema', enabled: true, order: 6, cols: 2 },
    { id: 'system-health', name: 'Estado del Stack', enabled: true, order: 7, cols: 2 },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ... (existing effects)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [clientsRes, ticketsRes, budgetsRes, contractsRes, paymentsRes, usersRes, auditRes] = await Promise.all([
          fetch("/api/clients").then((res) => res.json()),
          fetch("/api/tickets").then((res) => res.json()),
          fetch("/api/budgets").then((res) => res.json()),
          fetch("/api/contracts").then((res) => res.json()),
          fetch("/api/payments").then((res) => res.json()),
          fetch("/api/users/registered").then((res) => res.json()),
          fetch("/api/system/audit?limit=5").then((res) => res.json())
        ]);

        const clients = Array.isArray(clientsRes) ? clientsRes : [];
        const tickets = Array.isArray(ticketsRes) ? ticketsRes : [];
        const budgets = Array.isArray(budgetsRes) ? budgetsRes : [];
        const contracts = Array.isArray(contractsRes) ? contractsRes : [];
        const payments = Array.isArray(paymentsRes) ? paymentsRes : [];
        const users = Array.isArray(usersRes) ? usersRes : [];
        const auditLogs = Array.isArray(auditRes) ? auditRes : [];

        setStats({
          clients: clients.length,
          tickets: tickets.length,
          budgets: budgets.length,
          contracts: contracts.length,
          payments: payments.length,
        });

        setTopTickets(
          tickets
            .slice(0, 5)
            .map((ticket: any) => ({ id: ticket.id, title: ticket.title, priority: ticket.priority }))
        );

        // Procesar usuarios reales
        setOnlineUsers(users.map((u: any) => ({ email: u.email, role: u.role || 'Usuario' })));

        // Procesar actividad reciente real
        setRecentActivities(auditLogs.map((log: any) => ({
          action: log.action,
          details: `${log.resource} - ${log.details?.email || log.details?.id || ''}`,
          timestamp: log.timestamp
        })));

        // Calcular Rendimiento por Área (Radar Chart) basado en Tickets
        // Asumimos que las "áreas" pueden inferirse o son categorías fijas por ahora, 
        // pero usaremos datos reales de conteo si es posible. 
        // Si no hay campo de área, simularemos distribución basada en el ID o estado para variar.
        // Para hacerlo más real, usaremos el estado de los tickets como "áreas" de rendimiento.
        const ticketsByStatus = tickets.reduce((acc: any, ticket: any) => {
          acc[ticket.status] = (acc[ticket.status] || 0) + 1;
          return acc;
        }, {});

        setRadarData({
          labels: Object.keys(ticketsByStatus).length > 0 ? Object.keys(ticketsByStatus) : ['Soporte', 'Ventas', 'Desarrollo', 'Infraestructura', 'Admin'],
          datasets: [
            {
              label: 'Tickets por Estado',
              data: Object.keys(ticketsByStatus).length > 0 ? Object.values(ticketsByStatus) : [85, 70, 90, 80, 95],
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderColor: '#10b981',
              borderWidth: 2,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#10b981',
            },
          ],
        });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchCounts();
  }, []);

  const highlight = useMemo(
    () => [
      {
        title: "Clientes Activos",
        value: stats.clients,
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
        trend: "+12% vs mes anterior",
        trendUp: true,
      },
      {
        title: "Tickets Abiertos",
        value: stats.tickets,
        icon: CloudLightning,
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/20",
        trend: "-5% vs mes anterior",
        trendUp: false,
      },
      {
        title: "Presupuestos",
        value: stats.budgets,
        icon: FileText,
        color: "text-violet-600",
        bgColor: "bg-violet-100 dark:bg-violet-900/20",
        trend: "+8% vs mes anterior",
        trendUp: true,
      },
      {
        title: "Ingresos",
        value: stats.payments,
        icon: DollarSign,
        color: "text-emerald-600",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
        trend: "+24% vs mes anterior",
        trendUp: true,
      },
    ],
    [stats]
  );

  type ClientDot = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    contract: boolean;
  };
  // Datos de ejemplo para el mapa (esto debería venir de la API de clientes)
  const clientDots = useMemo(() => {
    // En una app real, usaríamos las coordenadas reales de los clientes
    // Aquí generamos algunos puntos aleatorios alrededor de Montevideo para demostración
    return Array(stats.clients || 5).fill(0).map((_, i) => ({
      id: `client-${i}`,
      name: `Cliente ${i + 1}`,
      lat: -34.9011 + (Math.random() - 0.5) * 0.1,
      lng: -56.1645 + (Math.random() - 0.5) * 0.1,
      contract: Math.random() > 0.5,
    }));
  }, [stats.clients]);

  // Datos para gráficas (usando stats reales donde sea posible)
  const chartData = {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: "Tickets Abiertos",
        data: [12, 19, 3, 5, 2, 3, stats.tickets], // Usando el total actual para el último día
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Tickets Cerrados",
        data: [8, 12, 6, 9, 4, 5, 10],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 600,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          weight: 600,
        },
        bodyFont: {
          size: 12,
        },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  const doughnutChartData = {
    labels: ["Abiertos", "En Progreso", "Cerrados", "Pendientes"],
    datasets: [
      {
        data: [stats.tickets > 0 ? Math.floor(stats.tickets * 0.3) : 30, stats.tickets > 0 ? Math.floor(stats.tickets * 0.2) : 20, stats.tickets > 0 ? Math.floor(stats.tickets * 0.4) : 40, stats.tickets > 0 ? Math.floor(stats.tickets * 0.1) : 10],
        backgroundColor: ["#3b82f6", "#f59e0b", "#10b981", "#6366f1"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 11,
            weight: 600,
          },
        },
      },
    },
  };

  const barChartData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: "Aprobados",
        data: [65, 59, 80, 81, 56, stats.budgets],
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
      },
      {
        label: "Pendientes",
        data: [28, 48, 40, 19, 86, 27],
        backgroundColor: "#e2e8f0",
        borderRadius: 4,
      },
    ],
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        pointLabels: {
          font: {
            size: 11,
            weight: 600,
          },
        },
        ticks: {
          display: false,
          backdropColor: "transparent",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const updateWidgetCols = (id: string, cols: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.id === id ? { ...item, cols: parseInt(cols) as 1 | 2 | 3 | 4 } : item
      )
    );
  };

  const toggleWidget = (id: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order);

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'system-health':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Estado del Sistema en Vivo</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[300px]">
              <SystemTopology />
            </CardContent>
          </Card>
        );

      case 'line-chart':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Actividad de Tickets</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[250px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        );

      case 'doughnut-chart':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Distribución de Estados</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[250px]">
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
              </div>
            </CardContent>
          </Card>
        );

      case 'bar-chart':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Estado de Presupuestos</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[250px]">
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        );

      case 'radar-chart':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Rendimiento por Estado</CardTitle>
                  <CardDescription className="mt-1">
                    Distribución de tickets
                  </CardDescription>
                </div>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-[300px]">
                {radarData && <Radar data={radarData} options={radarChartOptions} />}
              </div>
            </CardContent>
          </Card>
        );

      case 'map':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Geo-Localización</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Map className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] w-full grayscale-[0.2] hover:grayscale-0 transition-all duration-500">
                <ClientMap clientDots={clientDots} />
              </div>
            </CardContent>
          </Card>
        );

      case 'activities':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Auditoría del Sistema</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all duration-200 group/item"
                  >
                    <div className="mt-0.5 p-1.5 rounded bg-white dark:bg-slate-700 shadow-sm text-blue-500">
                      <Activity className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1 tracking-tight">
                        {activity.action}
                      </p>
                      <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin actividad</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'online-users':
        return (
          <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">Agentes Online</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {onlineUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 tracking-tight">{user.email}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{user.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-muted-foreground text-sm animate-pulse">Cargando Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative min-h-screen bg-transparent p-4 md:p-8 space-y-6 overflow-x-hidden">
        <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="relative group">
              <div className="relative p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Command <span className="text-blue-600">Center</span>
              </h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">SISTEMA ONLINE</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm transition-all group">
                    <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="text-sm font-semibold">Configurar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Preferencias del Panel</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                      Gestiona la visibilidad y disposición de tus módulos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-4">
                    {widgets.sort((a, b) => a.order - b.order).map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-all">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className={cn(
                              "p-2 rounded-lg transition-all",
                              widget.enabled ? "bg-blue-500/10 text-blue-600" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                            )}>
                              {widget.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </div>
                            <Label htmlFor={`widget-${widget.id}`} className="font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                              {widget.name}
                            </Label>
                          </div>

                          {widget.enabled && (
                            <div className="flex items-center gap-3">
                              <Select
                                value={widget.cols.toString()}
                                onValueChange={(value) => updateWidgetCols(widget.id, value)}
                              >
                                <SelectTrigger className="h-8 w-[110px] rounded-lg font-bold text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="1">1 Columna</SelectItem>
                                  <SelectItem value="2">2 Columnas</SelectItem>
                                  <SelectItem value="3">3 Columnas</SelectItem>
                                  <SelectItem value="4">Full View</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <Switch
                          id={`widget-${widget.id}`}
                          checked={widget.enabled}
                          onCheckedChange={() => toggleWidget(widget.id)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </header>

        {/* Quick Actions Grid */}
        <section className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { icon: PlusCircle, label: "Nuevo Ticket", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/10", href: "/tickets/new" },
              { icon: Users, label: "Clientes", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10", href: "/clients" },
              { icon: FileText, label: "Presupuestos", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/10", href: "/budgets" },
              { icon: DollarSign, label: "Pagos", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/10", href: "/payments" },
              { icon: ShieldCheck, label: "Auditoría", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10", href: "/audit" },
              { icon: SlidersHorizontal, label: "Ajustes", color: "text-slate-600 bg-slate-50 dark:bg-slate-900/10", href: "/system" },
            ].map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (i * 0.05) }}
                onClick={() => window.location.href = action.href || '#'}
                className="group flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all duration-200"
              >
                <div className={cn("mb-2 p-2.5 rounded-lg transition-transform group-hover:scale-110 duration-300", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Metric Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          {highlight.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
              <Card className="relative border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl bg-white dark:bg-slate-900 overflow-hidden group">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-2.5 rounded-lg", item.bgColor)}>
                      <item.icon className={cn("h-5 w-5", item.color)} />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      item.trendUp ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {item.trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {item.trend}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      <AnimatedCounter value={item.value} />
                    </h3>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 max-w-[100px]">
                        <Sparkline
                          data={item.trendUp ? [25, 40, 35, 60, 45, 70, 85] : [85, 70, 45, 60, 35, 40, 25]}
                          color={item.trendUp ? "#10b981" : "#f43f5e"}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Sync</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Widgets Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enabledWidgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-12 relative z-10">
              <AnimatePresence mode="popLayout">
                {enabledWidgets.map((widget) => (
                  <SortableWidget key={widget.id} id={widget.id} cols={widget.cols}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      {/* Sobrescribir estilos específicos del widget para quitar redondeo excesivo */}
                      <div className="[&>div]:rounded-xl [&>div]:border-slate-200 [&>div]:dark:border-slate-800 [&>div]:shadow-sm h-full">
                        {renderWidget(widget.id)}
                      </div>
                    </motion.div>
                  </SortableWidget>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}
