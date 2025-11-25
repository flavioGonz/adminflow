"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CheckCircle,
  Mail,
  MessageCircle,
  Send,
  Slack,
  UserPlus,
  Save,
  Loader2,
  Shield,
  Settings,
  Database,
  Activity,
  Users,
  Plus,
  Edit,
  Key,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Search,
  Filter,
  X,
  FileText,
  User,
  Server,
  AlertTriangle,
  LayoutTemplate,
  Wand2,
  Trash2,
  Code,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SystemApi, SystemUser, NotificationConfig, NotificationLog } from "@/lib/api-system";
import { ShinyText } from "@/components/ui/shiny-text";

type ChannelId = "email" | "whatsapp" | "telegram" | "slack";

type AuditEvent = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: any;
  status: "success" | "error" | "warning";
  ip?: string;
};

const channelDefinitions = [
  {
    id: "email" as ChannelId,
    name: "Email",
    icon: Mail,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
    description: "SMTP / React Email",
  },
  {
    id: "whatsapp" as ChannelId,
    name: "WhatsApp",
    icon: MessageCircle,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    description: "Twilio / 360dialog",
  },
  {
    id: "telegram" as ChannelId,
    name: "Telegram",
    icon: Send,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "Bot API",
  },
  {
    id: "slack" as ChannelId,
    name: "Slack",
    icon: Slack,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Webhooks",
  },
];

const DEFAULT_CONFIG: NotificationConfig = {
  channels: {
    email: { enabled: false, apiKey: "", webhook: "" },
    whatsapp: { enabled: false, apiKey: "", webhook: "" },
    telegram: { enabled: false, apiKey: "", webhook: "" },
    slack: { enabled: false, apiKey: "", webhook: "" },
  },
  templates: {
    email: { subject: "Notificación AdminFlow", body: "Hola {{cliente}}, su ticket {{ticket}} ha sido actualizado." },
    whatsapp: { subject: "", body: "Hola {{cliente}}, novedad en ticket {{ticket}}." },
    telegram: { subject: "", body: "Actualización: {{ticket}} para {{cliente}}." },
    slack: { subject: "", body: "Alerta: Ticket {{ticket}} de {{cliente}} requiere atención." },
  },
};

const eventTypeIcons: Record<string, any> = {
  user: User,
  system: Settings,
  database: Database,
  notification: Activity,
  file: FileText,
  security: Shield,
};

const eventTypeColors: Record<string, string> = {
  user: "text-sky-500 bg-sky-50",
  system: "text-indigo-500 bg-indigo-50",
  database: "text-emerald-500 bg-emerald-50",
  notification: "text-amber-500 bg-amber-50",
  file: "text-purple-500 bg-purple-50",
  security: "text-red-500 bg-red-50",
};

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [filteredAuditEvents, setFilteredAuditEvents] = useState<AuditEvent[]>([]);

  // UI States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Template Preview States
  const [previewEvent, setPreviewEvent] = useState("ticket_created");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [resetingUser, setResetingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({ email: "", password: "", roles: "", metadata: "{}" });
  const [resetPasswordForm, setResetPasswordForm] = useState({ email: "", newPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // SMTP States
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [verifyingSmtp, setVerifyingSmtp] = useState(false);

  // Audit filters
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [auditFilterType, setAuditFilterType] = useState("all");
  const [auditFilterStatus, setAuditFilterStatus] = useState("all");

  // Roles disponibles
  const availableRoles = ["admin", "manager", "editor", "viewer", "support"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [auditSearchTerm, auditFilterType, auditFilterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, configData] = await Promise.all([
        SystemApi.getUsers(),
        SystemApi.getNotificationConfig(),
      ]);
      setUsers(usersData);
      setConfig({
        channels: { ...DEFAULT_CONFIG.channels, ...(configData.channels || {}) },
        templates: { ...DEFAULT_CONFIG.templates, ...(configData.templates || {}) },
      });

      // Cargar usuario y contraseña SMTP si existen
      if (configData.channels?.email?.smtpUser) {
        setSmtpUser(configData.channels.email.smtpUser);
      }
      if (configData.channels?.email?.smtpPass) {
        setSmtpPass(configData.channels.email.smtpPass);
      }

      await fetchAuditLogs();

    } catch (error) {
      console.error("Error cargando datos del sistema:", error);
      toast.error("Error al cargar datos del sistema");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await SystemApi.getAuditLogs(50, auditFilterType, auditFilterStatus, auditSearchTerm);

      // Mapeo de acciones a español
      const actionTranslations: Record<string, string> = {
        'create': 'Crear',
        'update': 'Actualizar',
        'delete': 'Eliminar',
        'login': 'Iniciar sesión',
        'logout': 'Cerrar sesión',
        'upload': 'Subir archivo',
        'download': 'Descargar',
        'export': 'Exportar',
        'import': 'Importar',
        'send': 'Enviar',
        'receive': 'Recibir',
        'approve': 'Aprobar',
        'reject': 'Rechazar',
        'cancel': 'Cancelar',
        'complete': 'Completar',
        'start': 'Iniciar',
        'stop': 'Detener',
        'pause': 'Pausar',
        'resume': 'Reanudar',
        'reset': 'Resetear',
        'verify': 'Verificar',
        'test': 'Probar',
        'sync': 'Sincronizar',
        'migrate': 'Migrar',
        'backup': 'Respaldar',
        'restore': 'Restaurar',
      };

      const formattedLogs: AuditEvent[] = logs.map((log: any) => {
        let details = log.details;
        try {
          if (typeof details === 'string') {
            details = JSON.parse(details);
          }
        } catch (e) {
          // ignore
        }

        // Traducir acción
        const translatedAction = actionTranslations[log.action?.toLowerCase()] || log.action;

        return {
          ...log,
          timestamp: log.createdAt || log.timestamp, // Mapear createdAt a timestamp
          action: translatedAction,
          details,
          status: log.status || (log.error ? 'error' : 'success')
        };
      });
      setFilteredAuditEvents(formattedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const exportAudit = () => {
    const headers = ["Timestamp", "Usuario", "Acción", "Recurso", "Estado", "IP", "Detalles"];
    const csvContent = [
      headers.join(","),
      ...filteredAuditEvents.map(event => [
        new Date(event.timestamp).toISOString(),
        event.user,
        event.action,
        event.resource,
        event.status,
        event.ip || "",
        `"${JSON.stringify(event.details).replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const fetchPreview = async () => {
    setPreviewLoading(true);
    try {
      // Use local template generation instead of API call
      if (previewEvent.startsWith('email')) {
        const template = getEmailTemplate(previewEvent);
        setPreviewHtml(template);
      } else {
        const template = getTextTemplate(previewEvent);
        setPreviewHtml(template);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast.error("Error al cargar la vista previa");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "templates") {
      fetchPreview();
    }
  }, [activeTab, previewEvent]);

  // Template generators
  const getEmailTemplate = (eventType: string) => {
    const templates: Record<string, string> = {
      'email_created': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Ticket Creado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎫 Nuevo Ticket</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hola <strong>{{clientName}}</strong>,</p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #374151; line-height: 1.6;">
                Se ha creado un nuevo ticket <strong>#{{ticketId}}</strong> en el sistema. A continuación los detalles:
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;"><strong style="color: #111827;">Estado:</strong> {{status}}</p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;"><strong style="color: #111827;">Fecha:</strong> {{date}}</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong style="color: #111827;">Descripción:</strong> {{description}}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Ver Ticket</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Enviado automáticamente por AdminFlow</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      'email_payment_received': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago Recibido</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0fdf4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">💰 Pago Recibido</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #374151;">Hola <strong>{{clientName}}</strong>,</p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hemos recibido tu pago de <strong style="color: #10b981; font-size: 24px;">{{amount}}</strong>. ¡Gracias!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;"><strong style="color: #111827;">Fecha:</strong> {{date}}</p>
                    <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong style="color: #111827;">Ticket:</strong> #{{ticketId}}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{url}}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Ver Detalles</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f0fdf4; padding: 20px 30px; text-align: center; border-top: 1px solid #d1fae5;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Enviado automáticamente por AdminFlow</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };

    return templates[eventType] || templates['email_created'];
  };

  const getTextTemplate = (eventType: string) => {
    const templates: Record<string, string> = {
      'whatsapp_created': `🎫 *Nuevo Ticket Creado*

👤 Cliente: {{clientName}}
🔢 Ticket: #{{ticketId}}
📅 Fecha: {{date}}
📊 Estado: {{status}}

📝 {{description}}

🔗 Ver detalles: {{url}}

_Enviado automáticamente por AdminFlow_`,
      'whatsapp_payment_received': `💰 *Pago Recibido*

¡Hola {{clientName}}!

Hemos recibido tu pago de *{{amount}}*

📅 Fecha: {{date}}
🎫 Ticket: #{{ticketId}}

¡Gracias por tu pago!

_Enviado automáticamente por AdminFlow_`,
      'telegram_created': `🎫 <b>Nuevo Ticket Creado</b>

👤 Cliente: {{clientName}}
🔢 Ticket: #{{ticketId}}
📅 Fecha: {{date}}
📊 Estado: {{status}}

📝 {{description}}

<a href="{{url}}">Ver detalles</a>

<i>Enviado automáticamente por AdminFlow</i>`,
      'slack_created': `🎫 *Nuevo Ticket Creado*

*Cliente:* {{clientName}}
*Ticket:* #{{ticketId}}
*Fecha:* {{date}}
*Estado:* {{status}}

*Descripción:* {{description}}

<{{url}}|Ver detalles>

_Enviado automáticamente por AdminFlow_`,
    };

    return templates[eventType] || templates['whatsapp_created'];
  };


  const handleCreateUser = () => {
    setEditingUser(null);
    setSelectedRoles([]);
    setUserForm({
      email: "",
      password: "",
      roles: "",
      metadata: "{}",
    });
    setUserModalOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setSelectedRoles(user.roles || []);
    setUserForm({
      email: user.email,
      password: "",
      roles: user.roles?.join(", ") || "",
      metadata: JSON.stringify(user.metadata || {}, null, 2),
    });
    setUserModalOpen(true);
  };

  const handleResetUserPassword = (user: SystemUser) => {
    setResetingUser(user);
    setResetPasswordForm({ email: user.email, newPassword: "" });
    setResetPasswordModalOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSaveUser = async () => {
    try {
      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(userForm.metadata || "{}");
      } catch {
        toast.error("El metadata debe ser un JSON válido");
        return;
      }

      if (editingUser) {
        await SystemApi.updateUser(editingUser._id || editingUser.sqliteId?.toString() || "", {
          roles: selectedRoles,
          metadata: parsedMetadata,
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        if (!userForm.email || !userForm.password) {
          toast.error("Email y contraseña son requeridos");
          return;
        }
        if (userForm.password.length < 8) {
          toast.error("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        if (selectedRoles.length === 0) {
          toast.error("Selecciona al menos un rol");
          return;
        }
        await SystemApi.createUser(userForm.email, userForm.password);
        toast.success("Usuario creado exitosamente");
      }

      setUserModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar usuario");
    }
  };

  const handleResetPassword = async () => {
    try {
      if (!resetPasswordForm.email || !resetPasswordForm.newPassword) {
        toast.error("Email y nueva contraseña son requeridos");
        return;
      }
      if (resetPasswordForm.newPassword.length < 8) {
        toast.error("La contraseña debe tener al menos 8 caracteres");
        return;
      }
      await SystemApi.resetUserPassword(resetPasswordForm.email, resetPasswordForm.newPassword);
      toast.success("Solicitud de reset de contraseña registrada");
      setResetPasswordModalOpen(false);
      setResetPasswordForm({ email: "", newPassword: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error al resetear contraseña");
    }
  };

  const handleConfigChange = (section: "channels" | "templates", channel: string, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [channel]: {
          ...prev[section][channel as ChannelId],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveConfig = async () => {
    try {
      // Agregar usuario y contraseña SMTP al config antes de guardar
      const configToSave = {
        ...config,
        channels: {
          ...config.channels,
          email: {
            ...config.channels.email,
            smtpUser: smtpUser,
            smtpPass: smtpPass,
          },
        },
      };

      await SystemApi.saveNotificationConfig(configToSave);
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      toast.error("Error al guardar configuración");
    }
  };

  const handleVerifySmtp = async () => {
    const host = config.channels.email?.apiKey || "";
    const port = config.channels.email?.webhook || "587";

    if (!host || !smtpUser || !smtpPass) {
      toast.error("Completa todos los campos SMTP");
      return;
    }

    setVerifyingSmtp(true);
    try {
      const result = await SystemApi.verifySmtpConnection(host, port, smtpUser, smtpPass);
      if (result.success) {
        toast.success("✅ Conexión SMTP exitosa!");
      }
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
    } finally {
      setVerifyingSmtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <ShinyText speed={3} size="3xl" weight="bold">Sistema</ShinyText>
            </h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, canales de notificación y auditoría del sistema
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-2">
          <Server className="h-4 w-4" />
          {users.length} usuarios • {Object.values(config.channels).filter((c) => c.enabled).length} canales activos
        </Badge>
      </div>

      {/* Navigation Buttons (No Tabs) */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Usuarios
        </Button>
        <Button
          variant={activeTab === "channels" ? "default" : "outline"}
          onClick={() => setActiveTab("channels")}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Canales
        </Button>
        <Button
          variant={activeTab === "roles" ? "default" : "outline"}
          onClick={() => setActiveTab("roles")}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Roles
        </Button>
        <Button
          variant={activeTab === "templates" ? "default" : "outline"}
          onClick={() => setActiveTab("templates")}
          className="gap-2"
        >
          <LayoutTemplate className="h-4 w-4" />
          Plantillas
        </Button>
        <Button
          variant={activeTab === "audit" ? "default" : "outline"}
          onClick={() => setActiveTab("audit")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Auditoría
        </Button>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">

        {/* Section: Usuarios */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <ShinyText speed={4}>Gestión de Usuarios</ShinyText>
                </h2>
                <p className="text-sm text-muted-foreground">Administra los usuarios del sistema</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setResetPasswordModalOpen(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resetear Contraseña
                </Button>
                <Button size="sm" onClick={handleCreateUser}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          Roles
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          Creado
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id || user.sqliteId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-sky-50">
                              <User className="h-4 w-4 text-sky-600" />
                            </div>
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt || "").toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetUserPassword(user)}
                              title="Resetear contraseña"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section: Canales */}
        {activeTab === "channels" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <ShinyText speed={4}>Canales de Notificación</ShinyText>
                </h2>
                <p className="text-sm text-muted-foreground">Configura los canales de comunicación</p>
              </div>
              <Button size="sm" onClick={handleSaveConfig}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {channelDefinitions.map((def) => {
                const chConfig = config.channels[def.id];
                return (
                  <Card key={def.id} className={cn("border-2", chConfig.enabled ? def.borderColor : "border-border")}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("rounded-lg p-2", def.bgColor)}>
                            <def.icon className={cn("h-5 w-5", def.color)} />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{def.name}</CardTitle>
                            <CardDescription className="text-xs">{def.description}</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={chConfig.enabled}
                          onCheckedChange={(checked) => handleConfigChange("channels", def.id, "enabled", checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {def.id === "email" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">SMTP Host</Label>
                            <Input
                              value={chConfig.apiKey}
                              onChange={(e) => handleConfigChange("channels", def.id, "apiKey", e.target.value)}
                              placeholder="smtp.gmail.com"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">SMTP Port</Label>
                            <Input
                              value={chConfig.webhook}
                              onChange={(e) => handleConfigChange("channels", def.id, "webhook", e.target.value)}
                              placeholder="587"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Usuario SMTP</Label>
                            <Input
                              value={smtpUser}
                              onChange={(e) => setSmtpUser(e.target.value)}
                              placeholder="usuario@gmail.com"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Contraseña SMTP</Label>
                            <Input
                              type="password"
                              value={smtpPass}
                              onChange={(e) => setSmtpPass(e.target.value)}
                              placeholder="••••••••"
                              className="h-8 text-xs"
                            />
                          </div>
                          <Button
                            onClick={handleVerifySmtp}
                            disabled={verifyingSmtp}
                            size="sm"
                            className="w-full"
                            variant="secondary"
                          >
                            {verifyingSmtp ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-2 h-3 w-3" />
                            )}
                            Verificar Conexión
                          </Button>
                        </>
                      )}
                      {def.id === "whatsapp" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">API Key (Twilio/360dialog)</Label>
                            <Input
                              type="password"
                              value={chConfig.apiKey}
                              onChange={(e) => handleConfigChange("channels", def.id, "apiKey", e.target.value)}
                              placeholder="sk_..."
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <Input
                              value={chConfig.webhook}
                              onChange={(e) => handleConfigChange("channels", def.id, "webhook", e.target.value)}
                              placeholder="https://..."
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Número WhatsApp</Label>
                            <Input placeholder="+598..." className="h-8 text-xs" />
                          </div>
                        </>
                      )}
                      {def.id === "telegram" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Bot Token</Label>
                            <Input
                              type="password"
                              value={chConfig.apiKey}
                              onChange={(e) => handleConfigChange("channels", def.id, "apiKey", e.target.value)}
                              placeholder="123456:ABC-DEF..."
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Chat ID</Label>
                            <Input
                              value={chConfig.webhook}
                              onChange={(e) => handleConfigChange("channels", def.id, "webhook", e.target.value)}
                              placeholder="-1001234567890"
                              className="h-8 text-xs"
                            />
                          </div>
                        </>
                      )}
                      {def.id === "slack" && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                            <Input
                              value={chConfig.apiKey}
                              onChange={(e) => handleConfigChange("channels", def.id, "apiKey", e.target.value)}
                              placeholder="https://hooks.slack.com/..."
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Canal</Label>
                            <Input
                              value={chConfig.webhook}
                              onChange={(e) => handleConfigChange("channels", def.id, "webhook", e.target.value)}
                              placeholder="#general"
                              className="h-8 text-xs"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Section: Roles */}
        {activeTab === "roles" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <ShinyText speed={4}>Roles y Permisos</ShinyText>
                </h2>
                <p className="text-sm text-muted-foreground">Define qué puede hacer cada rol en el sistema</p>
              </div>
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Rol
              </Button>
            </div>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  Matriz de Permisos
                </CardTitle>
                <CardDescription>Configura los permisos por rol y módulo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Módulo / Acción</th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex flex-col items-center gap-1">
                            <span>Admin</span>
                            <Badge variant="secondary" className="text-xs">
                              {users.filter((u) => u.roles?.includes("admin")).length}
                            </Badge>
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex flex-col items-center gap-1">
                            <span>Manager</span>
                            <Badge variant="secondary" className="text-xs">
                              {users.filter((u) => u.roles?.includes("manager")).length}
                            </Badge>
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex flex-col items-center gap-1">
                            <span>Editor</span>
                            <Badge variant="secondary" className="text-xs">
                              {users.filter((u) => u.roles?.includes("editor")).length}
                            </Badge>
                          </div>
                        </th>
                        <th className="text-center p-3 font-semibold">
                          <div className="flex flex-col items-center gap-1">
                            <span>Viewer</span>
                            <Badge variant="secondary" className="text-xs">
                              {users.filter((u) => u.roles?.includes("viewer")).length}
                            </Badge>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dashboard */}
                      <tr className="border-b bg-slate-50">
                        <td className="p-3 font-semibold" colSpan={5}>
                          Dashboard
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Ver dashboard</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                      </tr>

                      {/* Clientes */}
                      <tr className="border-b bg-slate-50">
                        <td className="p-3 font-semibold" colSpan={5}>
                          Clientes
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Ver clientes</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Crear/Editar clientes</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Eliminar clientes</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                      </tr>

                      {/* Sistema */}
                      <tr className="border-b bg-slate-50">
                        <td className="p-3 font-semibold" colSpan={5}>
                          Sistema
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Gestión de usuarios</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Configuración de canales</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="p-3 pl-6">Ver auditoría</td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                        <td className="text-center p-3">
                          <X className="h-5 w-5 text-red-400 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-indigo-900">Gestión de Permisos</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      Los permisos se asignan automáticamente según el rol del usuario. Para cambiar los permisos de un
                      usuario, edita sus roles en la pestaña de Usuarios.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section: Plantillas */}
        {activeTab === "templates" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <ShinyText speed={4}>Editor de Plantillas</ShinyText>
                </h2>
                <p className="text-sm text-muted-foreground">Diseña plantillas espectaculares para cada canal y evento</p>
              </div>
              <Button size="sm" onClick={handleSaveConfig}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Plantillas
              </Button>
            </div>

            {/* Selectors - Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Canal Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Selecciona el Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'email', label: 'Email', icon: Mail, color: 'sky' },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'emerald' },
                      { id: 'telegram', label: 'Telegram', icon: Send, color: 'blue' },
                      { id: 'slack', label: 'Slack', icon: Slack, color: 'amber' }
                    ].map(channel => {
                      const Icon = channel.icon;
                      const isActive = previewEvent.startsWith(channel.id);
                      return (
                        <button
                          key={channel.id}
                          onClick={() => setPreviewEvent(`${channel.id}_created`)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                            isActive
                              ? `border-${channel.color}-500 bg-${channel.color}-50`
                              : "border-slate-200 hover:border-slate-300"
                          )}
                        >
                          <Icon className={cn("h-6 w-6", `text-${channel.color}-500`)} />
                          <span className="text-sm font-medium">{channel.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Event Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tipo de Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={previewEvent.split('_').slice(1).join('_')} onValueChange={(val) => {
                    const channel = previewEvent.split('_')[0];
                    setPreviewEvent(`${channel}_${val}`);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">🎫 Nuevo Ticket</SelectItem>
                      <SelectItem value="updated">🔄 Actualización de Ticket</SelectItem>
                      <SelectItem value="closed">✅ Ticket Cerrado</SelectItem>
                      <SelectItem value="payment_received">💰 Pago Recibido</SelectItem>
                      <SelectItem value="contract_signed">📝 Contrato Firmado</SelectItem>
                      <SelectItem value="budget_created">📊 Presupuesto Creado</SelectItem>
                      <SelectItem value="budget_approved">✔️ Presupuesto Aprobado</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section - TOP */}
            <Card className="border-2 border-slate-200">
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="text-sm text-slate-600 font-medium">
                    Vista Previa - {previewEvent.startsWith('email') ? '📧 Email' : previewEvent.startsWith('whatsapp') ? '💬 WhatsApp' : previewEvent.startsWith('telegram') ? '✈️ Telegram' : '💼 Slack'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchPreview()}
                  disabled={previewLoading}
                >
                  <RotateCcw className={cn("h-4 w-4", previewLoading && "animate-spin")} />
                </Button>
              </div>
              <div className="bg-white min-h-[500px] w-full overflow-auto relative">
                {previewLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                      <p className="text-sm text-slate-500">Generando preview...</p>
                    </div>
                  </div>
                ) : previewEvent.startsWith('email') ? (
                  <iframe
                    srcDoc={config.templates?.[previewEvent] || previewHtml}
                    className="w-full h-[500px] border-0"
                    title="Email Preview"
                  />
                ) : (
                  <div className="p-8">
                    <div className={cn(
                      "max-w-md mx-auto rounded-2xl p-6 shadow-lg",
                      previewEvent.startsWith('whatsapp') && "bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300",
                      previewEvent.startsWith('telegram') && "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300",
                      previewEvent.startsWith('slack') && "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300"
                    )}>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {(config.templates?.[previewEvent] || '')
                          .replace(/{{clientName}}/g, 'Juan Pérez')
                          .replace(/{{ticketId}}/g, '1234')
                          .replace(/{{amount}}/g, '$1,500')
                          .replace(/{{date}}/g, new Date().toLocaleDateString())
                          .replace(/{{status}}/g, 'Pendiente')
                          .replace(/{{eventName}}/g, 'Nuevo Ticket')}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Code Editor - BOTTOM */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Editor de Código</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Code className="h-3 w-3" />
                      {previewEvent.startsWith('email') ? 'HTML' : 'Markdown'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const template = previewEvent.startsWith('email')
                          ? getEmailTemplate(previewEvent)
                          : getTextTemplate(previewEvent);
                        setConfig({
                          ...config,
                          templates: {
                            ...config.templates,
                            [previewEvent]: template
                          }
                        });
                      }}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Plantilla Base
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setConfig({
                          ...config,
                          templates: {
                            ...config.templates,
                            [previewEvent]: ''
                          }
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-80 p-4 font-mono text-xs border rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={
                    previewEvent.startsWith('email')
                      ? '<!DOCTYPE html>\n<html>\n<head>\n  <title>{{eventName}}</title>\n</head>\n<body>\n  <h1>Hola {{clientName}}</h1>\n  <p>Tu ticket #{{ticketId}} ha sido creado.</p>\n</body>\n</html>'
                      : '🎫 *Nuevo Ticket Creado*\n\nCliente: {{clientName}}\nTicket: #{{ticketId}}\nFecha: {{date}}\n\n_Enviado automáticamente por AdminFlow_'
                  }
                  value={config.templates?.[previewEvent] || ''}
                  onChange={(e) => {
                    setConfig({
                      ...config,
                      templates: {
                        ...config.templates,
                        [previewEvent]: e.target.value
                      }
                    });
                  }}
                />

                {/* Variables Helper */}
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                  <h4 className="text-xs font-semibold mb-3 text-slate-700">Variables Disponibles</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['{{clientName}}', '{{ticketId}}', '{{amount}}', '{{date}}', '{{status}}', '{{eventName}}', '{{description}}', '{{url}}'].map(v => (
                      <code
                        key={v}
                        className="block text-[10px] bg-white px-2 py-1.5 rounded border border-slate-200 hover:border-primary cursor-pointer transition-colors"
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + v + text.substring(end);
                            setConfig({
                              ...config,
                              templates: {
                                ...config.templates,
                                [previewEvent]: newText
                              }
                            });
                          }
                        }}
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Section: Auditoría */}
        {activeTab === "audit" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  <ShinyText speed={4}>Auditoría del Sistema</ShinyText>
                </h2>
                <p className="text-sm text-muted-foreground">Registro completo de actividades</p>
              </div>
              <Button onClick={exportAudit} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Filters */}
            <Card className="bg-white shadow-sm">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={auditSearchTerm}
                        onChange={(e) => setAuditSearchTerm(e.target.value)}
                        placeholder="Buscar eventos..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Tipo de Recurso</Label>
                    <Select value={auditFilterType} onValueChange={setAuditFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="user">Usuarios</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="database">Base de Datos</SelectItem>
                        <SelectItem value="notification">Notificaciones</SelectItem>
                        <SelectItem value="file">Archivos</SelectItem>
                        <SelectItem value="security">Seguridad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Estado</Label>
                    <Select value={auditFilterStatus} onValueChange={setAuditFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="success">Éxito</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Events Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No se encontraron eventos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAuditEvents.map((event) => {
                        const Icon = eventTypeIcons[event.resource] || Activity;
                        const colorClass = eventTypeColors[event.resource] || "text-gray-500 bg-gray-50";
                        return (
                          <TableRow key={event.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{event.user}</TableCell>
                            <TableCell>{event.action}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn("p-1 rounded", colorClass)}>
                                  <Icon className="h-3 w-3" />
                                </div>
                                <span className="text-sm capitalize">{event.resource}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                              <div className="flex flex-col gap-1">
                                {event.resource === 'ticket' && event.details?.ticketId && (
                                  <Link href={`/tickets/${event.details.ticketId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                    Ticket #{event.details.ticketId}
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                )}
                                <code className="block truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600" title={JSON.stringify(event.details, null, 2)}>
                                  {JSON.stringify(event.details)}
                                </code>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  event.status === "success"
                                    ? "default"
                                    : event.status === "error"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {event.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{event.ip || "-"}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Crear/Editar Usuario */}
        <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {editingUser ? "Editar Usuario" : "Crear Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Actualiza los roles y metadata del usuario"
                  : "Crea un nuevo usuario en el sistema"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="usuario@example.com"
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Roles
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                  {availableRoles.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      variant={selectedRoles.includes(role) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRole(role)}
                      className="gap-2"
                    >
                      {selectedRoles.includes(role) && <CheckCircle className="h-3 w-3" />}
                      {role}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seleccionados: {selectedRoles.length > 0 ? selectedRoles.join(", ") : "Ninguno"}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Metadata (JSON)
                </Label>
                <Textarea
                  value={userForm.metadata}
                  onChange={(e) => setUserForm({ ...userForm, metadata: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono text-xs"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser}>{editingUser ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Resetear Contraseña */}
        <Dialog open={resetPasswordModalOpen} onOpenChange={setResetPasswordModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Key className="h-5 w-5 text-amber-600" />
                </div>
                Resetear Contraseña
              </DialogTitle>
              <DialogDescription>
                {resetingUser ? `Establece una nueva contraseña para ${resetingUser.email}` : "Establece una nueva contraseña para el usuario"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email del Usuario
                </Label>
                <Input
                  type="email"
                  value={resetPasswordForm.email}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, email: e.target.value })}
                  placeholder="usuario@example.com"
                  disabled={!!resetingUser}
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Nueva Contraseña
                </Label>
                <Input
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 8 caracteres</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword}>Resetear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
}
