"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  Terminal,
  Settings,
  GitBranch,
  ChevronRight,
  Shield,
  Server,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Primeros Pasos",
    description: "Como empezar con AdminFlow",
    icon: Zap,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    items: [
      { title: "Instalación", description: "Guía completa de instalación" },
      { title: "Primeros pasos", description: "Tu primer cliente y ticket" },
      { title: "Configuración básica", description: "Usuarios, roles y permisos" },
    ],
  },
  {
    title: "Módulos",
    description: "Documentación por funcionalidad",
    icon: BookOpen,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    items: [
      { title: "Clientes", description: "Gestión de clientes y contactos" },
      { title: "Tickets", description: "Sistema de tickets y soporte" },
      { title: "Contratos y Pagos", description: "Facturación y pagos" },
      { title: "Productos", description: "Catálogo y gestión de productos" },
    ],
  },
  {
    title: "Administración",
    description: "Configuración y mantenimiento",
    icon: Settings,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    items: [
      { title: "Base de Datos", description: "Seleccionar entre Mongo y SQLite" },
      { title: "Usuarios y Roles", description: "Gestión de accesos" },
      { title: "Respaldos", description: "Backup y restauración" },
      { title: "Notificaciones", description: "Canales de alerta" },
    ],
  },
  {
    title: "Desarrollo",
    description: "APIs y desarrollo",
    icon: Terminal,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    items: [
      { title: "API REST", description: "Endpoints y autenticación" },
      { title: "Webhooks", description: "Integraciones externas" },
      { title: "CLI y Scripts", description: "Automatización" },
      { title: "Estructura del código", description: "Arquitectura del proyecto" },
    ],
  },
  {
    title: "Deployment",
    description: "Llevar a producción",
    icon: GitBranch,
    color: "bg-orange-50 text-orange-600 border-orange-200",
    items: [
      { title: "Staging", description: "Entorno de pruebas" },
      { title: "Producción", description: "Deployment a producción" },
      { title: "Monitoring", description: "Monitoreo y alertas" },
      { title: "Rollbacks", description: "Cómo volver atrás" },
    ],
  },
];

interface DocCategoryCardProps {
  category: (typeof categories)[0];
}

function DocCategoryCard({ category }: DocCategoryCardProps) {
  const Icon = category.icon;

  return (
    <Card className={cn("border-2", category.color)}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", category.color)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              {category.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {category.items.map((item) => (
          <button
            key={item.title}
            className="w-full flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 transition text-left group"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 group-hover:text-slate-900">
                {item.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 mt-0.5" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DocumentacionPage() {
  return (
    <PageTransition>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Documentación</h1>
          </div>
          <p className="text-lg text-slate-600">
            Guías completas, tutoriales y referencias para AdminFlow
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Autenticación</p>
                  <p className="text-xs text-slate-500">JWT y sesiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">APIs</p>
                  <p className="text-xs text-slate-500">Endpoints REST</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Performance</p>
                  <p className="text-xs text-slate-500">Optimización</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <DocCategoryCard key={category.title} category={category} />
          ))}
        </div>

        <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Video Tutorials</CardTitle>
            <CardDescription>Aprende viendo paso a paso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Dashboard en 5 min", time: "5:30" },
                { title: "Crear tu primer ticket", time: "8:15" },
                { title: "Integrar pagos", time: "12:00" },
                { title: "Configurar notificaciones", time: "6:45" },
              ].map((video) => (
                <button
                  key={video.title}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition text-left"
                >
                  <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                    Play
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {video.title}
                    </p>
                    <p className="text-xs text-slate-500">{video.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
