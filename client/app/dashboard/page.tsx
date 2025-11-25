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
  GripVertical
} from "lucide-react";
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

const ClientMap = dynamic(() => import("@/components/dashboard/client-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
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

// Componente de contador animado
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
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
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      case 'line-chart':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Actividad de Tickets</CardTitle>
                  <CardDescription className="mt-1">
                    Comparación semanal de tickets abiertos vs cerrados
                  </CardDescription>
                </div>
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-[300px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        );

      case 'doughnut-chart':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Estado de Tickets</CardTitle>
                  <CardDescription className="mt-1">
                    Distribución actual
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-[300px]">
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
              </div>
            </CardContent>
          </Card>
        );

      case 'bar-chart':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Presupuestos Mensuales</CardTitle>
                  <CardDescription className="mt-1">
                    Aprobados vs Pendientes
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="h-[300px]">
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
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Ubicación de Clientes</CardTitle>
                  <CardDescription className="mt-1">
                    Mapa interactivo con {clientDots.length} clientes
                  </CardDescription>
                </div>
                <Map className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative p-0 mt-4">
              <div className="h-[400px] w-full">
                <ClientMap clientDots={clientDots} />
              </div>
            </CardContent>
          </Card>
        );

      case 'activities':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Actividad Reciente</CardTitle>
                  <CardDescription className="mt-1">
                    Últimas actualizaciones del sistema
                  </CardDescription>
                </div>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="relative space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-border/50 hover:border-amber-500/50 transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="p-2 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                      <Activity className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.details} - {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      LOG
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay actividad reciente.</p>
              )}
            </CardContent>
          </Card>
        );

      case 'online-users':
        return (
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Usuarios del Sistema</CardTitle>
                  <CardDescription className="mt-1">
                    {onlineUsers.length} usuarios registrados
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                {onlineUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Activo" />
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

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              <ShinyText size="3xl" weight="bold">Dashboard</ShinyText>
            </h2>
            <p className="text-muted-foreground mt-1">
              Bienvenido de nuevo al panel de control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar Widgets
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configuración de Widgets</DialogTitle>
                  <DialogDescription>
                    Activa, desactiva y ajusta el tamaño de los widgets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {widgets.sort((a, b) => a.order - b.order).map((widget) => (
                    <div key={widget.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {widget.enabled ? (
                            <Eye className="h-4 w-4 text-blue-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Label htmlFor={`widget-${widget.id}`} className="font-medium cursor-pointer">
                            {widget.name}
                          </Label>
                        </div>

                        {widget.enabled && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Ancho:</Label>
                            <Select
                              value={widget.cols.toString()}
                              onValueChange={(value) => updateWidgetCols(widget.id, value)}
                            >
                              <SelectTrigger className="h-8 w-[100px]">
                                <SelectValue placeholder="Tamaño" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Columna</SelectItem>
                                <SelectItem value="2">2 Columnas</SelectItem>
                                <SelectItem value="3">3 Columnas</SelectItem>
                                <SelectItem value="4">4 Columnas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <Switch
                        id={`widget-${widget.id}`}
                        checked={widget.enabled}
                        onCheckedChange={() => toggleWidget(widget.id)}
                        className="ml-4"
                      />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Highlights */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {highlight.map((item, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${item.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <AnimatedCounter value={item.value} />
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {item.trendUp ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                  )}
                  <span className={item.trendUp ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                    {item.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Widgets con drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enabledWidgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-fr">
              {enabledWidgets.map((widget) => (
                <SortableWidget key={widget.id} id={widget.id} cols={widget.cols}>
                  {renderWidget(widget.id)}
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}
