"use client";

import { useState } from "react";
import { EditableSupportPage } from "@/components/support/editable-support-page";
import { MessageCircleQuestion } from "lucide-react";

const defaultCentroContent = `
<h2>Centro de Ayuda</h2>
<p>Respuestas rápidas a las preguntas más frecuentes sobre AdminFlow.</p>

<h3>Autenticación</h3>
<p><strong>No puedo ingresar / olvidé mi contraseña</strong></p>
<p>Revisa que el usuario exista en Sistema > Usuarios. Si usas Mongo, asegúrate que la sincronización esté activa. Puedes forzar un reset desde el módulo Sistema o pidiendo a un admin que regenere la contraseña.</p>

<h3>Tickets</h3>
<p><strong>¿Dónde veo mis tickets y los del equipo?</strong></p>
<p>En Tickets puedes filtrar por estado, asignado y fecha. Los tickets abiertos asignados al usuario aparecen en el badge de la tarjeta de perfil del sidebar.</p>

<h3>Deployment</h3>
<p><strong>¿Cómo despliego una versión nueva?</strong></p>
<p>Ejecuta el script de deploy (PowerShell en Windows o bash en Linux) apuntando a la rama/tag deseada. Antes, toma un backup desde Sistema > Respaldos y valida estado en /support/estado.</p>

<h3>Logs</h3>
<p><strong>¿Dónde reviso errores o logs?</strong></p>
<p>Desde /support/estado ves las últimas líneas de error.log. En el server de producción puedes usar tail -f error.log o journalctl si corre como servicio.</p>

<h3>Base de Datos</h3>
<p><strong>¿Qué base de datos está activa?</strong></p>
<p>En Estado del sistema se muestra el motor actual (Mongo o SQLite). La configuración vive en server/.selected-db.json y se gestiona en el módulo Sistema > Base de datos.</p>

<h3>Respaldos</h3>
<p><strong>¿Cómo genero o restauro un backup?</strong></p>
<p>En Sistema > Respaldos puedes descargar, crear o restaurar. Si necesitas restaurar manualmente, usa los scripts en server/backup/ o el endpoint /api/system/backups/restore.</p>

<hr />
<p><strong>¿No encontraste lo que buscas?</strong></p>
<p>Contacta al equipo de soporte en <a href="mailto:info@infratec.com.uy">info@infratec.com.uy</a> o revisa la documentación completa en /support/documentacion</p>
`;

export default function CentroPage() {
  const [content, setContent] = useState(defaultCentroContent);

  const handleSave = async (newContent: string) => {
    setContent(newContent);
    console.log("Saved centro content:", newContent);
  };

  return (
    <EditableSupportPage
      title="Centro de Ayuda"
      icon={MessageCircleQuestion}
      initialContent={content}
      onSave={handleSave}
    />
  );
}

