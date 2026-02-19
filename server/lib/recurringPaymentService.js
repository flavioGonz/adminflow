const { getDbAdapter } = require('./dbAdapter');
const { notify } = require('./notificationService');

/**
 * Servicio para manejar pagos recurrentes automáticos
 */
class RecurringPaymentService {
  constructor() {
    this.lastProcessedMonth = -1;
  }

  async processMonthlyRecurringPayments() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (this.lastProcessedMonth === currentMonth) {
      return 0;
    }

    console.log('[RecurringPayments] Iniciando procesamiento mensual de pagos recurrentes.');

    let adapter;
    try {
      adapter = await getDbAdapter();
    } catch (e) {
      console.error('[RecurringPayments] No se pudo obtener el adaptador de BD:', e.message || e);
      return 0;
    }

    try {
      // Find clients with active contract and enabled recurring payments
      // contract can be boolean true, number 1, or a non-empty string description
      const clients = await adapter.find('clients', {
        $and: [
          {
            $or: [
              { contract: true },
              { contract: 1 },
              { contract: { $type: 'string', $ne: '' } }
            ]
          },
          {
            // recurrentPaymentEnabled implies true (boolean) based on previous debug, but we can be safe
            $or: [
              { recurringPaymentEnabled: true },
              { recurringPaymentEnabled: 'true' },
              { recurringPaymentEnabled: 1 }
            ]
          }
        ]
      });

      console.log(`[RecurringPayments] Encontrados ${clients.length} clientes configurados para pagos recurrentes.`);

      let createdCount = 0;

      for (const client of clients) {
        try {
          if (!client.recurringAmount || !client.recurringCurrency) {
            console.warn(`[RecurringPayments] Cliente ${client.name || client.id} sin monto o moneda configurados. Saltando.`);
            continue;
          }

          const invoiceCode = 'REC-' + currentYear + (currentMonth + 1).toString().padStart(2, '0');

          // Check if payment already exists for this client and month
          const existingPayment = await adapter.findOne('payments', {
            clientId: client.id,
            invoice: invoiceCode
          });

          if (existingPayment) {
            console.log(`[RecurringPayments] Cliente ${client.name} ya tiene un pago generado para ${invoiceCode}. Saltando.`);
            continue;
          }

          const paymentId = 'PAY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const newPayment = {
            id: paymentId,
            invoice: invoiceCode,
            clientId: client.id,
            client: client.name,
            amount: Number(client.recurringAmount),
            currency: client.recurringCurrency,
            status: 'Pendiente',
            method: 'Transferencia',
            concept: 'Pago mensual recurrente - Contrato',
            note: 'Generado automáticamente por el sistema',
            createdAt: now,
            updatedAt: now,
            isRecurring: true
          };

          await adapter.insertOne('payments', newPayment);
          createdCount++;

          await notify({
            event: 'payment_created',
            message: `⚡ Pago Recurrente generado para ${client.name || client.id}: ${newPayment.amount} ${newPayment.currency}.`,
            channels: ['telegram'],
            metadata: { paymentId, clientName: client.name }
          }).catch(() => { });

        } catch (clientError) {
          console.error('[RecurringPayments] Error con cliente ' + (client.id || '???') + ':', clientError.message || clientError);
        }
      }

      this.lastProcessedMonth = currentMonth;
      console.log(`[RecurringPayments] Proceso finalizado. Creados: ${createdCount} pagos.`);
      return createdCount;

    } catch (error) {
      console.error('[RecurringPayments] Error fatal:', error.message || error);
      return 0;
    }
  }

  start() {
    console.log('[RecurringPayments] Servicio activado.');

    const checkAndRun = () => {
      const now = new Date();
      if (now.getDate() === 1) {
        this.processMonthlyRecurringPayments();
      }
    };

    checkAndRun();
    setInterval(checkAndRun, 1000 * 60 * 60);
  }
}

module.exports = new RecurringPaymentService();
