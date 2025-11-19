
const styles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .wrapper { width: 100%; background-color: #f4f4f5; padding: 40px 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .header { background-color: #18181b; color: #ffffff; padding: 30px 20px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
  .content { padding: 40px 30px; color: #3f3f46; line-height: 1.6; font-size: 16px; }
  .footer { background-color: #f4f4f5; padding: 20px; text-align: center; font-size: 13px; color: #71717a; }
  .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 24px; text-align: center; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 24px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .info-label { font-weight: 600; color: #475569; }
  .info-value { color: #1e293b; text-align: right; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .status-success { background-color: #dcfce7; color: #166534; }
  .status-warning { background-color: #fef9c3; color: #854d0e; }
  .status-error { background-color: #fee2e2; color: #991b1b; }
  .status-info { background-color: #dbeafe; color: #1e40af; }
`;

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>AdminFlow</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
        <p>&copy; ${new Date().getFullYear()} AdminFlow. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: currency || 'UYU' }).format(amount);
};

const getTemplateForEvent = (event, data = {}) => {
    let subject = '';
    let htmlContent = '';
    let textContent = '';

    switch (event) {
        case 'ticket_created':
            subject = `Nuevo Ticket #${data.id}: ${data.title}`;
            textContent = `Se ha creado un nuevo ticket: ${data.title}. Estado: ${data.status}. Prioridad: ${data.priority}.`;
            htmlContent = `
        <h2 style="margin-top: 0; color: #18181b;">Nuevo Ticket Creado</h2>
        <p>Hola,</p>
        <p>Se ha registrado un nuevo ticket en el sistema con los siguientes detalles:</p>
        
        <div class="info-box">
          <div style="margin-bottom: 12px;">
            <strong>Título:</strong> <span style="display: block; font-size: 18px; margin-top: 4px;">${data.title}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Cliente:</strong> ${data.clientName || 'N/A'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Prioridad:</strong> ${data.priority}
          </div>
          <div style="margin-bottom: 8px;">
             <strong>Estado:</strong> <span class="status-badge status-info">${data.status}</span>
          </div>
          ${data.description ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;"><strong>Descripción:</strong><br><p style="margin-top: 4px; color: #475569;">${data.description}</p></div>` : ''}
        </div>

        <a href="${process.env.APP_URL || 'http://localhost:3000'}/tickets/${data.id}" class="button">Ver Ticket</a>
      `;
            break;

        case 'ticket_updated':
        case 'ticket_closed':
            const isClosed = event === 'ticket_closed' || data.status === 'Cerrado';
            subject = `Ticket Actualizado #${data.id}: ${data.title}`;
            textContent = `El ticket #${data.id} ha sido actualizado a estado: ${data.status}.`;
            htmlContent = `
        <h2 style="margin-top: 0; color: #18181b;">Actualización de Ticket</h2>
        <p>El ticket <strong>#${data.id}</strong> ha sido actualizado.</p>
        
        <div class="info-box">
          <div style="margin-bottom: 12px;">
            <strong>Título:</strong> ${data.title}
          </div>
          <div style="margin-bottom: 8px;">
             <strong>Nuevo Estado:</strong> <span class="status-badge ${isClosed ? 'status-success' : 'status-info'}">${data.status}</span>
          </div>
          ${data.changes ? `<div style="margin-top: 12px;"><strong>Cambios recientes:</strong> ${data.changes}</div>` : ''}
        </div>

        <a href="${process.env.APP_URL || 'http://localhost:3000'}/tickets/${data.id}" class="button">Ver Ticket</a>
      `;
            break;

        case 'payment_received':
            subject = `Pago Recibido: ${data.invoice}`;
            textContent = `Se ha recibido un pago de ${formatCurrency(data.amount, data.currency)} para la factura ${data.invoice}.`;
            htmlContent = `
        <h2 style="margin-top: 0; color: #18181b;">Pago Recibido</h2>
        <p>Se ha registrado exitosamente un nuevo pago.</p>
        
        <div class="info-box">
          <div style="font-size: 24px; font-weight: 700; color: #166534; text-align: center; margin-bottom: 20px;">
            ${formatCurrency(data.amount, data.currency)}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Factura/Ref:</strong> ${data.invoice}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Cliente:</strong> ${data.client}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Método:</strong> ${data.method}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Fecha:</strong> ${new Date(data.createdAt || Date.now()).toLocaleDateString()}
          </div>
        </div>
      `;
            break;

        case 'contract_signed':
            subject = `Contrato Firmado: ${data.title}`;
            textContent = `El contrato ${data.title} ha sido firmado/activado.`;
            htmlContent = `
        <h2 style="margin-top: 0; color: #18181b;">Contrato Activado</h2>
        <p>El siguiente contrato ha cambiado su estado a <strong>${data.status}</strong>.</p>
        
        <div class="info-box">
          <div style="margin-bottom: 12px;">
            <strong>Contrato:</strong> ${data.title}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Cliente:</strong> ${data.clientName || 'N/A'}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Vigencia:</strong> ${data.startDate} - ${data.endDate}
          </div>
        </div>
      `;
            break;

        default:
            subject = data.subject || 'Notificación de AdminFlow';
            textContent = data.message || 'Tiene una nueva notificación en AdminFlow.';
            htmlContent = `
        <h2 style="margin-top: 0; color: #18181b;">Nueva Notificación</h2>
        <p>${data.message || 'Tiene una nueva notificación en el sistema.'}</p>
        ${data.link ? `<a href="${data.link}" class="button">Ver Detalles</a>` : ''}
      `;
    }

    return {
        subject,
        text: textContent,
        html: baseTemplate(subject, htmlContent)
    };
};

module.exports = { getTemplateForEvent };
