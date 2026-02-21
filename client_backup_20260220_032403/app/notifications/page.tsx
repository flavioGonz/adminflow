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
  X,
  BellRing
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
import { ShinyText } from "@/components/ui/shiny-text";
import { SystemApi, NotificationConfig, SystemUser } from "@/lib/api-system";
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";

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
    webpush: boolean;
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
      { id: "ticket_created", name: "Creado", description: "Nuevo ticket", channels: { email: true, whatsapp: false, telegram: true, slack: true, webpush: true } },
      { id: "ticket_updated", name: "Actualizado", description: "Estado cambiado", channels: { email: true, whatsapp: true, telegram: false, slack: false, webpush: false } },
      { id: "ticket_closed", name: "Cerrado", description: "Ticket cerrado", channels: { email: true, whatsapp: false, telegram: false, slack: true, webpush: true } },
    ],
  },
  {
    id: "budgets",
    name: "Presupuestos",
    icon: FileText,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    events: [
      { id: "budget_created", name: "Creado", description: "Nuevo presupuesto", channels: { email: true, whatsapp: true, telegram: false, slack: false, webpush: false } },
      { id: "budget_approved", name: "Aprobado", description: "Cliente aprobó", channels: { email: true, whatsapp: true, telegram: true, slack: true, webpush: true } },
      { id: "budget_rejected", name: "Rechazado", description: "Presupuesto rechazado", channels: { email: true, whatsapp: false, telegram: false, slack: true, webpush: true } },
    ],
  },
  {
    id: "payments",
    name: "Pagos",
    icon: CreditCard,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    events: [
      { id: "payment_received", name: "Recibido", description: "Pago confirmado", channels: { email: true, whatsapp: true, telegram: true, slack: true, webpush: true } },
      { id: "payment_pending", name: "Pendiente", description: "Recordatorio", channels: { email: true, whatsapp: true, telegram: false, slack: false, webpush: false } },
      { id: "payment_overdue", name: "Vencido", description: "Pago vencido", channels: { email: true, whatsapp: true, telegram: true, slack: true, webpush: true } },
    ],
  },
  {
    id: "contracts",
    name: "Contratos",
    icon: ShoppingCart,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    events: [
      { id: "contract_signed", name: "Firmado", description: "Contrato firmado", channels: { email: true, whatsapp: false, telegram: false, slack: true, webpush: true } },
      { id: "contract_expiring", name: "Por vencer", description: "Próximo a vencer", channels: { email: true, whatsapp: true, telegram: true, slack: true, webpush: true } },
      { id: "contract_renewed", name: "Renovado", description: "Contrato renovado", channels: { email: true, whatsapp: false, telegram: false, slack: true, webpush: true } },
    ],
  },
  {
    id: "products",
    name: "Productos",
    icon: Package,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    events: [
      { id: "product_low_stock", name: "Stock bajo", description: "Bajo mínimo", channels: { email: true, whatsapp: false, telegram: true, slack: true, webpush: true } },
      { id: "product_out_stock", name: "Sin stock", description: "Agotado", channels: { email: true, whatsapp: false, telegram: true, slack: true, webpush: true } },
    ],
  },
  {
    id: "calendar",
    name: "Calendario",
    icon: CalendarIcon,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    events: [
      { id: "event_reminder", name: "Recordatorio", description: "Evento próximo", channels: { email: true, whatsapp: true, telegram: false, slack: false, webpush: false } },
      { id: "event_created", name: "Creado", description: "Nuevo evento", channels: { email: false, whatsapp: false, telegram: true, slack: true, webpush: true } },
    ],
  },
];

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  telegram: SendIcon,
  slack: Slack,
  webpush: BellRing,
};

const channelColors = {
  email: "text-sky-500",
  whatsapp: "text-emerald-500",
  telegram: "text-indigo-500",
  slack: "text-amber-500",
  webpush: "text-rose-500",
};

export default function NotificationsPage() {
  const [modules, setModules] = useState(notificationModules);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<NotificationConfig | null>(null);
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testTelegramModalOpen, setTestTelegramModalOpen] = useState(false);
  const [testWhatsAppModalOpen, setTestWhatsAppModalOpen] = useState(false);
  const [testSlackModalOpen, setTestSlackModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Prueba de Notificación - AdminFlow");
  const [testBody, setTestBody] = useState("Este es un correo de prueba desde AdminFlow.\n\nSi recibes este mensaje, la configuración de email está funcionando correctamente.");
  const [testMessage, setTestMessage] = useState("🔔 Prueba de notificación desde AdminFlow\n\nSi recibes este mensaje, la configuración está funcionando correctamente.");

  useEffect(() => {
    loadSystemConfig();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const users = await SystemApi.getUsers();
      if (users && users.length > 0) {
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
                ? { ...event, channels: { ...event.channels, [channel]: !event.channels[channel] } }
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
      const events = modules.flatMap(module =>
        module.events.map(event => ({
          id: event.id,
          name: event.name,
          description: event.description,
          module: module.id,
          channels: event.channels,
        }))
      );
      const configToSave = {
        channels: systemConfig?.channels || {},
        templates: systemConfig?.templates || {},
        events,
      };
      await SystemApi.saveNotificationConfig(configToSave);
      toast.success("Configuración guardada");
    } catch (error: any) {
      console.error("Error guardando configuración:", error);
      toast.error(error.message || "Error al guardar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) { toast.error("Ingresa un email de destino"); return; }
    if (!isChannelEnabled("email")) { toast.error("Email no configurado"); return; }
    try {
      const fullMessage = `Asunto: ${testSubject}\n\n${testBody}\n\nDestinatario: ${testEmail}`;
      await SystemApi.sendTestNotification("email", fullMessage, [testEmail]);
      toast.success(`Email enviado a ${testEmail}`);
      setTestEmailModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar email");
    }
  };

  const handleSendTestTelegram = async () => {
    if (!isChannelEnabled("telegram")) { toast.error("Telegram no configurado"); return; }
    try {
      await SystemApi.sendTestNotification("telegram", testMessage);
      toast.success("Mensaje enviado a Telegram");
      setTestTelegramModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar a Telegram");
    }
  };

  const handleSendTestWhatsApp = async () => {
    if (!isChannelEnabled("whatsapp")) { toast.error("WhatsApp no configurado"); return; }
    try {
      await SystemApi.sendTestNotification("whatsapp", testMessage);
      toast.success("Mensaje enviado a WhatsApp");
      setTestWhatsAppModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar a WhatsApp");
    }
  };

  const handleSendTestSlack = async () => {
    if (!isChannelEnabled("slack")) { toast.error("Slack no configurado"); return; }
    try {
      await SystemApi.sendTestNotification("slack", testMessage);
      toast.success("Mensaje enviado a Slack");
      setTestSlackModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar a Slack");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-10 w-10 animate-spin text-sky-500" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <ShinyText size="2xl" weight="bold">Configuración de Alertas</ShinyText>
            </h1>
            <p className="text-xs text-muted-foreground">Define eventos y canales de notificación</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button onClick={() => setTestEmailModalOpen(true)} variant="outline" size="sm" className="h-7 text-xs px-2">
            <Mail className="mr-1 h-3 w-3" />Email
          </Button>
          <Button onClick={() => setTestTelegramModalOpen(true)} variant="outline" size="sm" className="h-7 text-xs px-2">
            <Send className="mr-1 h-3 w-3" />Telegram
          </Button>
          <Button onClick={() => setTestWhatsAppModalOpen(true)} variant="outline" size="sm" className="h-7 text-xs px-2">
            <MessageCircle className="mr-1 h-3 w-3" />WhatsApp
          </Button>
          <Button onClick={() => setTestSlackModalOpen(true)} variant="outline" size="sm" className="h-7 text-xs px-2">
            <Slack className="mr-1 h-3 w-3" />Slack
          </Button>
          <Button onClick={() => setModules(notificationModules)} variant="outline" size="sm" className="h-7 text-xs px-2">
            <RefreshCcw className="mr-1 h-3 w-3" />Reset
          </Button>
          <Button onClick={handleSaveConfig} disabled={loading} size="sm" className="h-7 text-xs px-3 bg-gradient-to-br from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600">
            <Save className="mr-1 h-3 w-3" />Guardar
          </Button>
        </div>
      </div>

      {/* Push Notifications - ARRIBA */}
      <PushNotificationSettings />

      {/* Modules Grid - Compacto */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-md", module.bgColor)}>
                  <module.icon className={cn("h-4 w-4", module.color)} />
                </div>
                <CardTitle className="text-sm font-semibold">{module.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                {module.events.map((event, index) => (
                  <div key={event.id} className="space-y-1.5">
                    {index > 0 && <div className="my-1.5"><Separator /></div>}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{event.name}</p>
                        <p className="text-[10px] text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Object.entries(channelIcons).map(([channel, Icon]) => {
                        const isActive = event.channels[channel as keyof NotificationEvent["channels"]];
                        const channelEnabled = isChannelEnabled(channel as keyof NotificationEvent["channels"]);
                        return (
                          <button
                            key={channel}
                            onClick={() => handleToggleChannel(module.id, event.id, channel as keyof NotificationEvent["channels"])}
                            disabled={!channelEnabled}
                            className={cn(
                              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all border",
                              isActive && channelEnabled
                                ? "bg-slate-100 border-slate-300"
                                : "bg-white border-slate-100 opacity-50",
                              !channelEnabled && "cursor-not-allowed opacity-30"
                            )}
                          >
                            <Icon className={cn("h-3 w-3", channelColors[channel as keyof typeof channelColors])} />
                            <Switch
                              checked={isActive}
                              disabled={!channelEnabled}
                              className="scale-[0.6] -mx-1"
                              onCheckedChange={() => handleToggleChannel(module.id, event.id, channel as keyof NotificationEvent["channels"])}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card - Compacto */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              Canales deshabilitados deben configurarse en <a href="/system" className="underline font-medium">Sistema → Canales</a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Test Email */}
      <Dialog open={testEmailModalOpen} onOpenChange={setTestEmailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50">
                <Mail className="h-4 w-4 text-sky-500" />
              </div>
              <DialogTitle className="text-base">Test Email</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Destinatario</Label>
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="email@ejemplo.com" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Asunto</Label>
              <Input value={testSubject} onChange={(e) => setTestSubject(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mensaje</Label>
              <Textarea value={testBody} onChange={(e) => setTestBody(e.target.value)} rows={4} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(true)}><Eye className="mr-1 h-3 w-3" />Preview</Button>
            <Button size="sm" onClick={handleSendTestEmail} className="bg-sky-500 hover:bg-sky-600 text-white"><SendIcon className="mr-1 h-3 w-3" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test Telegram */}
      <Dialog open={testTelegramModalOpen} onOpenChange={setTestTelegramModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50">
                <Send className="h-4 w-4 text-indigo-600" />
              </div>
              <DialogTitle className="text-base">Test Telegram</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={4} className="text-sm" />
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleSendTestTelegram} className="bg-indigo-500 hover:bg-indigo-600 text-white"><SendIcon className="mr-1 h-3 w-3" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test WhatsApp */}
      <Dialog open={testWhatsAppModalOpen} onOpenChange={setTestWhatsAppModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <DialogTitle className="text-base">Test WhatsApp</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={4} className="text-sm" />
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleSendTestWhatsApp} className="bg-emerald-500 hover:bg-emerald-600 text-white"><SendIcon className="mr-1 h-3 w-3" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Test Slack */}
      <Dialog open={testSlackModalOpen} onOpenChange={setTestSlackModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50">
                <Slack className="h-4 w-4 text-amber-600" />
              </div>
              <DialogTitle className="text-base">Test Slack</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={4} className="text-sm" />
          </div>
          <DialogFooter>
            <Button size="sm" onClick={handleSendTestSlack} className="bg-amber-500 hover:bg-amber-600 text-white"><SendIcon className="mr-1 h-3 w-3" />Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Preview Email */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Preview Email</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white text-sm space-y-2">
            <div className="border-b pb-2">
              <p className="text-[10px] text-muted-foreground">Para:</p>
              <p className="font-medium">{testEmail || "destinatario@ejemplo.com"}</p>
            </div>
            <div className="border-b pb-2">
              <p className="text-[10px] text-muted-foreground">Asunto:</p>
              <p className="font-medium">{testSubject}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Mensaje:</p>
              <div className="whitespace-pre-wrap text-xs">{testBody}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
