"use client";

import { useState } from "react";
import { EditableSupportPage } from "@/components/support/editable-support-page";
import { BookOpen } from "lucide-react";

const defaultDocContent = `
<h2>Documentación de AdminFlow</h2>
<p>Guías completas, tutoriales y referencias para desarrolladores y administradores.</p>

<h2>Primeros Pasos</h2>
<h3>Instalación</h3>
<p>Sigue la guía de instalación en el repositorio. Requiere Node.js 18+, npm y una base de datos (Mongo o SQLite).</p>

<h3>Configuración inicial</h3>
<p>Después de instalar, configura variables de entorno y crea el usuario administrador inicial.</p>

<h2>Módulos principales</h2>
<h3>Gestión de Clientes</h3>
<p>Crea, edita y gestiona clientes. Vincula contratos, pagos y tickets a cada cliente.</p>

<h3>Sistema de Tickets</h3>
<p>Registra incidentes, asigna al equipo y rastrea estado hasta resolución.</p>

<h3>Contratos y Pagos</h3>
<p>Administra contratos, genera facturas y registra pagos. Integración con sistemas de pago.</p>

<h3>Catálogo de Productos</h3>
<p>Mantén un inventario de productos y servicios que ofreces.</p>

<h2>Administración</h2>
<h3>Base de Datos</h3>
<p>Elige entre MongoDB o SQLite según tus necesidades. Puedes cambiar en el módulo Sistema.</p>

<h3>Usuarios y Roles</h3>
<p>Define roles (Admin, Supervisor, Agente) y asigna permisos granulares.</p>

<h3>Respaldos</h3>
<p>Realiza respaldos automáticos o manuales. Restaura desde puntos anteriores si es necesario.</p>

<h2>Desarrollo</h2>
<h3>API REST</h3>
<p>Acceso a todas las funciones mediante API REST. Autenticación por JWT.</p>

<h3>Webhooks</h3>
<p>Recibe notificaciones en tiempo real de eventos del sistema.</p>

<h3>CLI y Scripts</h3>
<p>Herramientas de línea de comandos para automatización y mantenimiento.</p>

<h2>Deployment</h2>
<h3>Staging</h3>
<p>Entorno de prueba antes de ir a producción. Replica la infraestructura de producción.</p>

<h3>Producción</h3>
<p>Deployment a servidores en vivo. Requiere backup previo y validación de datos.</p>

<h3>Monitoreo</h3>
<p>Rastrea logs, errores y métricas de rendimiento en tiempo real.</p>

<hr />
<p><em>Esta documentación es editable. Haz clic en "Editar" para actualizar cualquier sección.</em></p>
`;

export default function DocumentacionPage() {
  const [content, setContent] = useState(defaultDocContent);

  const handleSave = async (newContent: string) => {
    setContent(newContent);
    console.log("Saved documentacion content:", newContent);
  };

  return (
    <EditableSupportPage
      title="Documentación"
      icon={BookOpen}
      initialContent={content}
      onSave={handleSave}
    />
  );
}
