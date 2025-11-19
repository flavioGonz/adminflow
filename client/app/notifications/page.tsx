"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Save,
  RefreshCcw,
  Ticket,
  FileText,
  CreditCard,
  Package,
  Calendar as CalendarIcon,
  ShoppingCart,
  Mail,
  MessageCircle,
  Send,
  Send as SendIcon,
  Slack,
  AlertTriangle,
  Eye,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SystemApi, NotificationConfig, SystemUser } from "@/lib/api-system";

type NotificationModule = {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  events: NotificationEvent[];
};

type NotificationEvent = {
  id: string;
  name: string;
  description: string;
  channels: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
    slack: boolean;
  };
};

const notificationModules: NotificationModule[] = [
  {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    events: [
      {
        id: "ticket_created",
        name: "Ticket Creado",
        description: "Cuando se crea un nuevo ticket",
        channels: { email: true, whatsapp: false, telegram: true, slack: true },
      },
      {
        id: "ticket_updated",
        name: "Ticket Actualizado",
        description: "Cuando se actualiza el estado de un ticket",
        channels: { email: true, whatsapp: true, telegram: false, slack: false },
      },
      {
        id: "ticket_closed",
        name: "Ticket Cerrado",
        description: "Cuando se cierra un ticket",
        channels: { email: true, whatsapp: false, telegram: false, slack: true },
      },
    ],
  },
  {
    id: "budgets",
    name: "Presupuestos",
    icon: FileText,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    events: [
      {
        id: "budget_created",
        name: "Presupuesto Creado",
        description: "Cuando se genera un nuevo presupuesto",
        channels: { email: true, whatsapp: true, telegram: false, slack: false },
      },
      {
        id: "budget_approved",
        name: "Presupuesto Aprobado",
        description: "Cuando el cliente aprueba un presupuesto",
        channels: { email: true, whatsapp: true, telegram: true, slack: true },
      },
      {
        id: "budget_rejected",
        name: "Presupuesto Rechazado",
        description: "Cuando se rechaza un presupuesto",
        channels: { email: true, whatsapp: false, telegram: false, slack: true },
      },
    ],
  },
  {
    id: "payments",
    name: "Pagos",
    icon: CreditCard,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    events: [
      {
        id: "payment_received",
        name: "Pago Recibido",
        description: "Cuando se confirma un pago",
        channels: { email: true, whatsapp: true, telegram: true, slack: true },
      },
      {
        id: "payment_pending",
        name: "Pago Pendiente",
        description: "Recordatorio de pago pendiente",
        channels: { email: true, whatsapp: true, telegram: false, slack: false },
      },
      {
        id: "payment_overdue",
        name: "Pago Vencido",
        description: "Cuando un pago está vencido",
        channels: { email: true, whatsapp: true, telegram: true, slack: true },
      },
    ],
  },
  {
    id: "contracts",
    name: "Contratos",
    icon: ShoppingCart,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    events: [
      {
        id: "contract_signed",
        name: "Contrato Firmado",
        description: "Cuando se firma un contrato",
        channels: { email: true, whatsapp: false, telegram: false, slack: true },
      },
      {
        id: "contract_expiring",
        name: "Contrato por Vencer",
        description: "Alerta de contrato próximo a vencer",
        channels: { email: true, whatsapp: true, telegram: true, slack: true },
      },
      {
        id: "contract_renewed",
        name: "Contrato Renovado",
        description: "Cuando se renueva un contrato",
        channels: { email: true, whatsapp: false, telegram: false, slack: true },
      },
    ],
  },
  {
    id: "products",
    name: "Productos",
    icon: Package,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    events: [
      {
        id: "product_low_stock",
        name: "Stock Bajo",
        description: "Cuando un producto tiene stock bajo",
        channels: { email: true, whatsapp: false, telegram: true, slack: true },
      },
      {
        id: "product_out_stock",
        name: "Sin Stock",
        description: "Cuando un producto se queda sin stock",
        channels: { email: true, whatsapp: false, telegram: true, slack: true },
      },
    ],
  },
  {
    id: "calendar",
    name: "Calendario",
    icon: CalendarIcon,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    events: [
      {
        id: "event_reminder",
        name: "Recordatorio de Evento",
        description: "Recordatorio de eventos próximos",
        channels: { email: true, whatsapp: true, telegram: false, slack: false },
      },
      {
        id: "event_created",
        name: "Evento Creado",
        description: "Cuando se crea un nuevo evento",
        channels: { email: false, whatsapp: false, telegram: true, slack: true },
      },
    ],
  },
];

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: SendIcon,
  slack: Slack,
};

const channelColors = {
  email: "text-sky-500",
  whatsapp: "text-emerald-500",
  telegram: "text-indigo-500",
  slack: "text-amber-500",
};

export default function NotificationsPage() {
  const [modules, setModules] = useState(notificationModules);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<NotificationConfig | null>(null);

  // Estados para modales de test
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testTelegramModalOpen, setTestTelegramModalOpen] = useState(false);
  const [testWhatsAppModalOpen, setTestWhatsAppModalOpen] = useState(false);
  const [testSlackModalOpen, setTestSlackModalOpen] = useState(false);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Estados para Email
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Prueba de Notificación - AdminFlow");
  const [testBody, setTestBody] = useState("Este es un correo de prueba desde AdminFlow.\n\nSi recibes este mensaje, la configuración de email está funcionando correctamente.");

  // Estados para otros canales
  const [testMessage, setTestMessage] = useState("🔔 Prueba de notificación desde AdminFlow\n\nSi recibes este mensaje, la configuración está funcionando correctamente.");

  useEffect(() => {
    loadSystemConfig();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const users = await SystemApi.getUsers();
      if (users && users.length > 0) {
        // Intentar encontrar un admin, o usar el primer usuario
        const admin = users.find(u => u.roles?.includes('admin')) || users[0];
        if (admin && admin.email) {
          setTestEmail(admin.email);
        }
      }
    } catch (error) {
      console.error("Error cargando usuarios para test:", error);
    }
  };

  const loadSystemConfig = async () => {
    setLoading(true);
    try {
      const config = await SystemApi.getNotificationConfig();
      setSystemConfig(config);
    } catch (error) {
      console.error("Error cargando configuración:", error);
      toast.error("Error al cargar configuración de canales");
    } finally {
      setLoading(false);
    }
  };

  const isChannelEnabled = (channel: keyof NotificationEvent["channels"]) => {
    if (!systemConfig) return false;
    return systemConfig.channels[channel]?.enabled || false;
  };

  const handleToggleChannel = (moduleId: string, eventId: string, channel: keyof NotificationEvent["channels"]) => {
    if (!isChannelEnabled(channel)) {
      toast.error(`El canal ${channel} no está configurado en Sistema`);
      return;
    }

    setModules((prev) =>
      prev.map((module) =>
        module.id === moduleId
          ? {
            ...module,
            events: module.events.map((event) =>
              event.id === eventId
                ? {
                  ...event,
                  channels: {
                    ...event.channels,
                    [channel]: !event.channels[channel],
                  },
                }
                : event
            ),
          }
          : module
      )
    );
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      // Convertir los módulos a un array plano de eventos
      const events = modules.flatMap(module =>
        module.events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          module: module.id,
          channels: event.channels,
        }))
      );

      // Guardar en el backend
      const configToSave = {
        channels: systemConfig?.channels || {},
        templates: systemConfig?.templates || {},
        events, // Agregar los eventos configurados
      };

      await SystemApi.saveNotificationConfig(configToSave);
      toast.success("Configuración de notificaciones guardada correctamente");
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      toast.error(error.message || "Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Ingresa un email de destino");
      return;
    }

    if (!isChannelEnabled("email")) {
      toast.error("El canal de Email no está configurado en Sistema");
      return;
    }

    try {
      // Crear el mensaje completo con asunto y cuerpo
      const fullMessage = `Asunto: ${testSubject}\n\n${testBody}\n\nDestinatario: ${testEmail}`;

      await SystemApi.sendTestNotification("email", fullMessage, [testEmail]);
      toast.success(`Email de prueba enviado a ${testEmail}`);
      setTestEmailModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar email de prueba");
      console.error("Error enviando email:", error);
    }
  };

  const handleSendTestTelegram = async () => {
    if (!isChannelEnabled("telegram")) {
      toast.error("El canal de Telegram no está configurado en Sistema");
      return;
    }

    try {
      await SystemApi.sendTestNotification("telegram", testMessage);
      toast.success("Mensaje de prueba enviado a Telegram");
      setTestTelegramModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar mensaje a Telegram");
      console.error("Error enviando a Telegram:", error);
    }
  };

  const handleSendTestWhatsApp = async () => {
    if (!isChannelEnabled("whatsapp")) {
      toast.error("El canal de WhatsApp no está configurado en Sistema");
      return;
    }

    try {
      await SystemApi.sendTestNotification("whatsapp", testMessage);
      toast.success("Mensaje de prueba enviado a WhatsApp");
      setTestWhatsAppModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar mensaje a WhatsApp");
      console.error("Error enviando a WhatsApp:", error);
    }
  };

  const handleSendTestSlack = async () => {
    if (!isChannelEnabled("slack")) {
      toast.error("El canal de Slack no está configurado en Sistema");
      return;
    }

    try {
      await SystemApi.sendTestNotification("slack", testMessage);
      toast.success("Mensaje de prueba enviado a Slack");
      setTestSlackModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar mensaje a Slack");
      console.error("Error enviando a Slack:", error);
    }
  };

  const getTotalActiveNotifications = () => {
    return modules.reduce((total, module) => {
      return (
        total +
        module.events.reduce((eventTotal, event) => {
          return eventTotal + Object.values(event.channels).filter(Boolean).length;
        }, 0)
      );
    }, 0);
  };

  const getActiveChannelsByModule = (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return 0;
    return module.events.reduce((total, event) => {
      return total + Object.values(event.channels).filter(Boolean).length;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-10 w-10 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Configuración de Alertas</h1>
          <p className="text-sm text-muted-foreground">
            Define qué eventos deben generar notificaciones por cada canal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setTestEmailModalOpen(true)} variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Test Email
          </Button>
          <Button onClick={() => setTestTelegramModalOpen(true)} variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Test Telegram
          </Button>
          <Button onClick={() => setTestWhatsAppModalOpen(true)} variant="outline" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            Test WhatsApp
          </Button>
          <Button onClick={() => setTestSlackModalOpen(true)} variant="outline" size="sm">
            <Slack className="mr-2 h-4 w-4" />
            Test Slack
          </Button>
          <Button onClick={() => setModules(notificationModules)} variant="outline" size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Restaurar
          </Button>
          <Button onClick={handleSaveConfig} disabled={loading} size="sm" className="bg-gradient-to-br from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600">
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Modules */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id} className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", module.bgColor)}>
                    <module.icon className={cn("h-5 w-5", module.color)} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <CardDescription>
                      {getActiveChannelsByModule(module.id)} notificaciones activas
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {module.events.map((event, index) => (
                  <div key={event.id}>
                    {index > 0 && <div className="my-4"><Separator /></div>}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">{event.name}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="grid gap-3 grid-cols-2">
                        {Object.entries(channelIcons).map(([channel, Icon]) => {
                          const isActive = event.channels[channel as keyof NotificationEvent["channels"]];
                          const channelEnabled = isChannelEnabled(channel as keyof NotificationEvent["channels"]);
                          return (
                            <div
                              key={channel}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                isActive && channelEnabled ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100",
                                !channelEnabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", channelColors[channel as keyof typeof channelColors])} />
                                <Label className={cn("text-sm capitalize", channelEnabled ? "cursor-pointer" : "cursor-not-allowed")}>
                                  {channel}
                                </Label>
                              </div>
                              <Switch
                                checked={isActive}
                                disabled={!channelEnabled}
                                onCheckedChange={() =>
                                  handleToggleChannel(module.id, event.id, channel as keyof NotificationEvent["channels"])
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Importante</h3>
              <p className="text-sm text-blue-700 mt-1">
                Los canales deshabilitados deben configurarse en <a href="/system" className="underline font-medium">Sistema → Canales</a> antes de poder activar las alertas.
                Las notificaciones solo se enviarán si los canales están correctamente configurados y habilitados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Test Email */}
      <Dialog open={testEmailModalOpen} onOpenChange={setTestEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-50">
                <Mail className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <DialogTitle>Enviar Email de Prueba</DialogTitle>
                <DialogDescription>
                  Prueba la configuración de email enviando un mensaje
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Destinatario</Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="destinatario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Asunto</Label>
              <Input
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                placeholder="Asunto del email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensaje</Label>
              <Textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                rows={6}
                placeholder="Contenido del email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSendTestEmail} className="bg-sky-500 hover:bg-sky-600 text-white">
              <SendIcon className="mr-2 h-4 w-4" />
              Enviar Prueba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test Telegram */}
      <Dialog open={testTelegramModalOpen} onOpenChange={setTestTelegramModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50">
                <Send className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <DialogTitle>Enviar Mensaje a Telegram</DialogTitle>
                <DialogDescription>
                  Prueba la configuración de Telegram enviando un mensaje
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensaje</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={6}
                placeholder="Escribe el mensaje de prueba..."
              />
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
              <p className="font-medium">ℹ️ Nota:</p>
              <p className="mt-1">El mensaje se enviará al chat configurado en Sistema → Canales</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendTestTelegram} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <SendIcon className="mr-2 h-4 w-4" />
              Enviar a Telegram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test WhatsApp */}
      <Dialog open={testWhatsAppModalOpen} onOpenChange={setTestWhatsAppModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle>Enviar Mensaje a WhatsApp</DialogTitle>
                <DialogDescription>
                  Prueba la configuración de WhatsApp enviando un mensaje
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensaje</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={6}
                placeholder="Escribe el mensaje de prueba..."
              />
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              <p className="font-medium">ℹ️ Nota:</p>
              <p className="mt-1">El mensaje se enviará al número configurado en Sistema → Canales (vía Twilio)</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendTestWhatsApp} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <SendIcon className="mr-2 h-4 w-4" />
              Enviar a WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test Slack */}
      <Dialog open={testSlackModalOpen} onOpenChange={setTestSlackModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Slack className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <DialogTitle>Enviar Mensaje a Slack</DialogTitle>
                <DialogDescription>
                  Prueba la configuración de Slack enviando un mensaje
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mensaje</Label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={6}
                placeholder="Escribe el mensaje de prueba..."
              />
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <p className="font-medium">ℹ️ Nota:</p>
              <p className="mt-1">El mensaje se enviará al webhook configurado en Sistema → Canales</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendTestSlack} className="bg-amber-500 hover:bg-amber-600 text-white">
              <SendIcon className="mr-2 h-4 w-4" />
              Enviar a Slack
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Preview Email */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Preview del Email</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-6 bg-white">
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground">Para:</p>
                <p className="font-medium">{testEmail || "destinatario@ejemplo.com"}</p>
              </div>
              <div className="border-b pb-3">
                <p className="text-xs text-muted-foreground">Asunto:</p>
                <p className="font-medium">{testSubject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mensaje:</p>
                <div className="whitespace-pre-wrap text-sm">{testBody}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
