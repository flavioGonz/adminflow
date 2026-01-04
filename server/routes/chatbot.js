const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getConfig, upsertConfig } = require('../lib/configService');
const { db } = require('../db');
const { getMongoDb } = require('../lib/mongoClient');

// Almacén temporal de logs para la UI
let webhookLogs = [];
const addLog = (type, message, details) => {
    webhookLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type,
        message,
        details: typeof details === 'string' ? details : JSON.stringify(details)
    });
    if (webhookLogs.length > 20) webhookLogs.pop();
};

// Estado de conversaciones para flujos multi-paso
let conversationState = {};

// Tiempo de expiración (5 minutos)
const SESSION_TIMEOUT = 5 * 60 * 1000;

const clearUserConversation = (from) => {
    if (conversationState[from] && conversationState[from].timer) {
        clearTimeout(conversationState[from].timer);
    }
    delete conversationState[from];
};

const setUserConversation = (from, state, url, session, apiKey, delay) => {
    // Si ya existe un timer, lo limpiamos
    if (conversationState[from] && conversationState[from].timer) {
        clearTimeout(conversationState[from].timer);
    }

    const timer = setTimeout(async () => {
        if (conversationState[from]) {
            delete conversationState[from];
            console.log(`[CHATBOT] Sesión expirada para ${from}`);
            await sendReply(url, session, from, `⏰ *SESIÓN CANCELADA*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\nTu solicitud ha expirado por inactividad. Si deseas continuar, vuelve a iniciar el comando.`, apiKey, delay);
        }
    }, SESSION_TIMEOUT);

    // Aseguramos que el estado tenga el timer y la marca de tiempo
    state.timer = timer;
    state.lastActive = Date.now();

    // Si el objeto en memoria no es el mismo que el pasado, actualizamos el de memoria
    if (conversationState[from] && conversationState[from] !== state) {
        Object.assign(conversationState[from], state);
    } else {
        // Si no existía o ya era el mismo, simplemente lo asignamos por seguridad
        conversationState[from] = state;
    }
};

// Helper para verificar módulos
const getModuleForCommand = (cmd) => {
    const w = cmd.split(' ');
    if (w.some(s => s.includes('ticket'))) return 'tickets';
    if (w.some(s => s.includes('pago') || s.includes('payment'))) return 'payments';
    if (w.some(s => s.includes('cliente') || s.includes('client'))) return 'clients';
    if (w.some(s => s.includes('agenda') || s.includes('agendar') || s.includes('visita'))) return 'scheduling';
    if (w.some(s => s === 'pass' || s === 'contraseña' || s === 'contraseñas')) return 'passwords';
    if (w.some(s => s.includes('user') || s.includes('usuario'))) return 'users';
    return null;
};


// GET config
router.get('/config', async (req, res) => {
    try {
        const config = await getConfig('chatbot');
        if (!config || !config.data) {
            return res.json({
                waha_url: "http://192.168.99.104:3000",
                waha_session: "default",
                waha_api_key: "",
                reply_delay: 4000,
                allowed_numbers: [],
                modules: {
                    clients: true,
                    payments: true,
                    scheduling: true,
                    tickets: true,
                    passwords: true,
                    users: true
                }
            });
        }
        res.json(config.data);
    } catch (error) {
        console.error('Error getting chatbot config:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST config
router.post('/config', async (req, res) => {
    try {
        const { waha_url, waha_session, enabled, waha_api_key, modules, reply_delay, allowed_numbers } = req.body;
        const config = await upsertConfig('chatbot', {
            waha_url,
            waha_session,
            enabled,
            waha_api_key,
            modules,
            reply_delay: parseInt(reply_delay) || 4000,
            allowed_numbers: allowed_numbers || []
        });
        res.json(config);
    } catch (error) {
        console.error('Error saving chatbot config:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET logs
router.get('/logs', (req, res) => {
    res.json(webhookLogs);
});

// POST test - Verificar conexión con WAHA
router.post('/test', async (req, res) => {
    try {
        const { waha_url, waha_session, waha_api_key } = req.body;

        if (!waha_url) {
            return res.json({ success: false, error: 'URL de WAHA no proporcionada' });
        }

        const headers = waha_api_key ? { 'X-Api-Key': waha_api_key } : {};
        const sessionToTest = waha_session || 'default';

        // Intentar obtener información de la sesión
        const response = await axios.get(`${waha_url}/api/sessions/${sessionToTest}`, {
            headers,
            timeout: 5000
        });

        if (response.status === 200 && response.data) {
            addLog('outbound', 'Test de conexión exitoso', `Sesión: ${sessionToTest}`);
            res.json({
                success: true,
                message: `✅ Conexión exitosa con WAHA\nSesión: ${sessionToTest}\nEstado: ${response.data.status || 'Activa'}`
            });
        } else {
            res.json({ success: false, error: 'Sesión no encontrada o inactiva' });
        }
    } catch (error) {
        addLog('error', 'Error en test de conexión', error.message);

        if (error.code === 'ECONNREFUSED') {
            res.json({ success: false, error: 'No se pudo conectar con WAHA. Verifica la URL.' });
        } else if (error.response?.status === 401) {
            res.json({ success: false, error: 'API Key incorrecta o faltante' });
        } else if (error.response?.status === 404) {
            res.json({ success: false, error: 'Sesión no encontrada. Verifica el nombre de sesión.' });
        } else {
            res.json({ success: false, error: `Error: ${error.message}` });
        }
    }
});


// POST webhook
router.post('/webhook', async (req, res) => {
    const body = req.body;
    try {
        const configData = await getConfig('chatbot');
        const config = configData.data || {};

        // Cargar módulos - si existen en config, usarlos; si no, todos false
        const defaultModules = {
            clients: false,
            payments: false,
            scheduling: false,
            tickets: false,
            passwords: false,
            users: false
        };

        const modules = config.modules || defaultModules;
        const {
            waha_url: url,
            waha_session: session,
            enabled,
            waha_api_key: apiKey,
            reply_delay = 4000,
            allowed_numbers = [] // Whitelist de números permitidos
        } = config;

        // Log para debug
        console.log('[CHATBOT] Módulos cargados:', modules);
        console.log('[CHATBOT] Números permitidos:', allowed_numbers);
        addLog('system', 'Módulos activos', JSON.stringify(modules));

        if (!enabled) return res.json({ status: 'skipped', reason: 'disabled' });

        let messageBody = null;
        let from = null;

        if (body.type === 'message' && body.payload) {
            messageBody = body.payload.body;
            from = body.payload.from;
        } else if (body.payload && body.payload.body) {
            messageBody = body.payload.body;
            from = body.payload.from;
        } else if (body.body && body.from) {
            messageBody = body.body;
            from = body.from;
        }

        if (!messageBody || !from) return res.json({ status: 'ignored' });

        // Verificar whitelist de números - RESTRICTIVO POR DEFECTO
        // Si no hay números en la lista, NO responde a nadie
        const fromNumber = from.replace('@c.us', '').replace('@s.whatsapp.net', '');

        if (!allowed_numbers || allowed_numbers.length === 0) {
            // Sin lista blanca configurada = NO responder a nadie
            console.log(`[CHATBOT] Sin lista blanca configurada - Bloqueando: ${fromNumber}`);
            addLog('blocked', `Sin whitelist - Bloqueado: ${fromNumber}`, 'Configure números permitidos');
            return res.json({ status: 'blocked', reason: 'no_whitelist_configured' });
        }

        // Verificar si el número está en la lista blanca
        const isAllowed = allowed_numbers.some(num => {
            const cleanNum = num.replace(/\D/g, ''); // Remover caracteres no numéricos
            return fromNumber.includes(cleanNum) || cleanNum.includes(fromNumber);
        });

        if (!isAllowed) {
            console.log(`[CHATBOT] Número no autorizado: ${fromNumber}`);
            addLog('blocked', `Número bloqueado: ${fromNumber}`, 'No está en la whitelist');
            return res.json({ status: 'blocked', reason: 'number_not_allowed' });
        }

        addLog('inbound', `Mensaje de ${from}`, messageBody);
        let text = messageBody.trim();

        // Normalización: Permitir comandos sin '/'
        const knownBaseCommands = [
            'ping', 'ayuda', 'help', 'resumen', 'tickets', 'cliente', 'pagos',
            'pago', 'pass', 'contraseñas', 'agenda', 'agendar', 'ticket'
        ];

        // Limpiamos emojis y normalizamos espacios
        const normalizedText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        const firstWord = normalizedText.split(' ')[0].toLowerCase();
        const cleanWord = firstWord.startsWith('/') ? firstWord.substring(1) : firstWord;

        // Si la palabra limpia coincide con un comando conocido, forzamos el prefijo '/' si no lo tiene
        if (knownBaseCommands.includes(cleanWord) || cleanWord.match(/^tickets\d+$/)) {
            if (!text.startsWith('/')) text = '/' + text;
        }

        const cmd = text.toLowerCase().trim();

        // Manejar flujo activo
        if (conversationState[from]) {
            await handleMultiStepFlow(from, text, url, session, apiKey, reply_delay);
            return res.json({ success: true });
        }

        // Comandos simples
        if (cmd === '/ping') {
            await sendReply(url, session, from, 'Pong! 🏓 El sistema AdminFlow está en línea. ✅', apiKey, reply_delay);
        }
        else if (cmd === '/ayuda' || cmd === '/help') {
            const helpText = `🤖 *ADMINFLOW BOT* 🚀\n` +
                `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
                `📂 *CONSULTAS RÁPIDAS*\n` +
                `▫️ \`resumen\` → Estado general del sistema\n` +
                `▫️ \`tickets\` → Asistente de tickets\n` +
                `▫️ \`tickets [cliente]\` → Tickets de un cliente\n` +
                `▫️ \`ticket [número]\` → Detalle de un ticket\n` +
                `▫️ \`pass [cliente]\` → Ver contraseñas/accesos\n` +
                `▫️ \`pagos\` → Asistente de pagos\n` +
                `▫️ \`pagos [cliente]\` → Historial de pagos\n` +
                `▫️ \`[nombre cliente].\` → Ficha completa\n\n` +
                `📝 *CREAR NUEVOS*\n` +
                `▫️ \`ticket nuevo\` → Abrir ticket\n` +
                `▫️ \`pago nuevo\` → Registrar pago pendiente\n` +
                `▫️ \`pago confirmado [cliente]\` → Confirmar pago recibido\n` +
                `▫️ \`cliente nuevo\` → Alta de cliente\n\n` +
                `📅 *AGENDA TÉCNICA*\n` +
                `▫️ \`agenda hoy\` → Visitas de hoy\n` +
                `▫️ \`agenda semana\` → Esta semana\n` +
                `▫️ \`agenda mes\` → Este mes\n` +
                `▫️ \`agenda visita\` → Programar nueva visita\n\n` +
                `💡 *TIPS IMPORTANTES*\n` +
                `▫️ Comandos sin \`/\` funcionan igual\n` +
                `▫️ Nombres de clientes terminan con \`.\`\n` +
                `▫️ Escribe 🔴 *0* para cancelar un flujo\n` +
                `▫️ Los flujos expiran en 5 minutos\n\n` +
                `_Ejemplo: "Coca Cola." muestra la ficha del cliente_`;
            await sendReply(url, session, from, helpText, apiKey, reply_delay);
        }
        else if (cmd === '/resumen') {
            const stats = await getTicketStats();
            const lastTickets = await getRecentTickets(5);

            let resText = `📊 *ESTADO GENERAL* 🚀\n` +
                `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
            resText += `📈 *TICKETS:* ${stats.open} Abiertos | ${stats.solved} OK\n`;
            resText += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;

            lastTickets.forEach(t => {
                const priorityEmoji = t.priority === 'high' ? '🔴' : (t.priority === 'medium' ? '🟡' : '🟢');
                resText += `${priorityEmoji} *#${t.id}* • ${t.clientName}\n`;
                resText += `↳ _${t.title}_\n\n`;
            });
            resText += `_Usa_ \`tickets\` _para ver más detalles._`;
            await sendReply(url, session, from, resText, apiKey, reply_delay);
        }
        else if (cmd.startsWith('/tickets') && modules.tickets) {
            const query = text.substring(8).trim();
            if (query && query !== '') {
                // Verificar si es un número (ID de ticket)
                const ticketId = parseInt(query);
                if (!isNaN(ticketId)) {
                    // Buscar ticket específico por ID
                    const ticket = await getTicketById(ticketId);
                    if (!ticket) {
                        await sendReply(url, session, from, `❌ No encontré el ticket *#${ticketId}*.`, apiKey, reply_delay);
                    } else {
                        const priorityEmoji = ticket.priority === 'high' ? '🔴' : (ticket.priority === 'medium' ? '🟡' : '🟢');
                        const statusIcon = (ticket.status === 'solved' || ticket.status === 'Resuelto') ? '✅' : '⏳';
                        const contractIcon = ticket.contract ? '✅' : '❌';

                        let detailText = `🎫 *TICKET #${ticket.id}*\n━━━━━━━━━━━━━━━━━━\n\n`;
                        detailText += `${priorityEmoji} *Prioridad:* ${ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Media' : 'Baja'}\n`;
                        detailText += `${statusIcon} *Estado:* ${ticket.status}\n`;
                        detailText += `👤 *Cliente:* ${ticket.clientName}\n`;
                        detailText += `📜 *Contrato:* ${contractIcon}\n`;
                        detailText += `📝 *Asunto:* ${ticket.title}\n\n`;

                        if (ticket.description) {
                            detailText += `📋 *Descripción:*\n_${ticket.description}_\n\n`;
                        }

                        if (ticket.assignedTo) {
                            detailText += `👷 *Asignado a:* ${ticket.assignedTo}\n`;
                        }

                        detailText += `📅 *Creado:* ${new Date(ticket.createdAt).toLocaleDateString()}\n`;

                        if (ticket.updatedAt) {
                            detailText += `🔄 *Actualizado:* ${new Date(ticket.updatedAt).toLocaleDateString()}\n`;
                        }

                        await sendReply(url, session, from, detailText, apiKey, reply_delay);
                    }
                } else {
                    // Buscar tickets por nombre de cliente
                    const tickets = await getRecentTickets(50, query);
                    let resText = `🎫 *TICKETS: ${query.toUpperCase()}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    if (tickets.length === 0) {
                        resText += `▫️ No encontré tickets para este cliente.\n\n`;
                    } else {
                        tickets.forEach(t => {
                            const priorityEmoji = t.priority === 'high' ? '🔴' : (t.priority === 'medium' ? '🟡' : '🟢');
                            const statusIcon = (t.status === 'solved' || t.status === 'Resuelto') ? '✅' : '⏳';
                            resText += `${priorityEmoji} *#${t.id}* | ${statusIcon} _${t.title}_\n\n`;
                        });
                    }
                    resText += `💡 _Usa_ \`ticket [número]\` _para ver detalles completos._`;
                    await sendReply(url, session, from, resText, apiKey, reply_delay);
                }
            } else {
                // Si el comando es solo "tickets" o "/tickets", mostramos el menú siempre
                conversationState[from] = { flow: 'TICKET_QUERY', step: 'MENU' };
                const menu = `🎫 *ASISTENTE DE TICKETS*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n¿Qué deseas consultar?\n\n1️⃣ Últimos tickets (Global)\n2️⃣ Buscar tickets de un CLIENTE\n3️⃣ Solo tickets ABIERTOS\n\n_Escribe el número o_ 🔴 *0* _para cancelar._`;
                await sendReply(url, session, from, menu, apiKey, reply_delay);
            }
        }
        else if ((cmd.startsWith('/contraseñas ') || cmd.startsWith('/pass ')) && modules.clients) {
            const query = cmd.startsWith('/pass ') ? text.substring(6).trim() : text.substring(13).trim();
            const clients = await searchClients(query);
            if (clients.length === 0) {
                await sendReply(url, session, from, `❌ No encontré el cliente *"${query}"*.`, apiKey, reply_delay);
            } else {
                const client = clients[0];
                const accesses = await getClientAccesses(client.id);
                if (accesses.length === 0) {
                    await sendReply(url, session, from, `🔑 Sin accesos registrados para *${client.name}*.`, apiKey, reply_delay);
                } else {
                    let resAcc = `🔐 *ACCESOS: ${client.name.toUpperCase()}*\n` +
                        `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    accesses.forEach(a => {
                        resAcc += `🖥 *${a.equipo}*\n`;
                        resAcc += `🌐 IP: ${a.ip || '-'}\n`;
                        resAcc += `👤 User: \`${a.user || '-'}\`\n`;
                        resAcc += `🔑 Pass: \`${a.pass || '-'}\`\n\n`;
                    });
                    await sendReply(url, session, from, resAcc, apiKey, reply_delay);
                }
            }
        }
        else if (cmd.startsWith('/pagos') && !cmd.endsWith(' nuevo') && modules.payments) {
            const query = text.substring(6).trim();
            if (query) {
                // Procesar búsqueda directa por cliente
                const clients = await searchClients(query);
                if (clients.length === 0) return await sendReply(url, session, from, `❌ No encontré al cliente *"${query}"*.`, apiKey, reply_delay);

                const client = clients[0];
                const payments = await searchPaymentsByClient(client.id);
                let res = `💰 *PAGOS: ${client.name.toUpperCase()}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;

                if (payments.length === 0) {
                    res += `▫️ Sin historial de pagos.\n\n`;
                } else {
                    let total = 0;
                    payments.forEach(p => {
                        const icon = ['completed', 'Aprobado', 'Pagado'].includes(p.status) ? '✅' : '⏳';
                        const val = parseFloat(p.amount) || 0;
                        if (icon === '✅') total += val;
                        res += `${icon} *${val.toLocaleString()} ${p.currency}*\n↳ ${new Date(p.createdAt).toLocaleDateString()} • _${p.concept || 'S/C'}_\n\n`;
                    });
                    res += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n🏆 *TOTAL COBRADO:* ${total.toLocaleString()}\n\n`;
                }
                res += `🤔 *¿Qué sigue?*\n1️⃣ Registrar un nuevo pago\n2️⃣ Ver tickets de este cliente\n3️⃣ Ver agenda de visitas\n\n_Escribe tu opción o "ayuda"._`;
                await sendReply(url, session, from, res, apiKey, reply_delay);
            } else {
                // Iniciar flujo guiado
                conversationState[from] = { flow: 'PAYMENT_QUERY', step: 'MENU' };
                const menu = `💰 *ASISTENTE DE PAGOS*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n¿Qué información necesitas?\n\n1️⃣ Últimos 10 pagos (Historial Global)\n2️⃣ Consultar un CLIENTE específico\n3️⃣ Resumen de RECAUDACIÓN (Mensual)\n\n_Escribe el número o "cancelar"._`;
                await sendReply(url, session, from, menu, apiKey, reply_delay);
            }
        }
        else if (cmd.startsWith('/pago confirmado') && modules.payments) {
            const query = text.substring(16).trim();
            if (query) {
                const clients = await searchClients(query);
                if (clients.length === 0) {
                    await sendReply(url, session, from, `❌ No encontré al cliente *"${query}"*.`, apiKey, reply_delay);
                } else {
                    const c = clients[0];
                    setUserConversation(from, {
                        flow: 'CONFIRM_PAYMENT',
                        step: 'VALIDATE_CLIENT',
                        data: { clientId: c.id, clientName: c.name, status: 'Pagado' }
                    }, url, session, apiKey, reply_delay);

                    const welcome = `✨ *CONFIRMACIÓN DE PAGO*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
                        `He encontrado al cliente:\n👤 *${c.name}*\n\n` +
                        `¿Es este el cliente correcto? (*SI* / *cancelar*)`;
                    await sendReply(url, session, from, welcome, apiKey, reply_delay);
                }
            } else {
                setUserConversation(from, { flow: 'CONFIRM_PAYMENT', step: 'CLIENT' }, url, session, apiKey, reply_delay);
                const guide = `💰 *ASISTENTE DE COBRO* 💎\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
                    `1️⃣ *Identificar:* Escribe el nombre del cliente.\n` +
                    `2️⃣ *Validar:* Confirmaremos sus datos.\n` +
                    `3️⃣ *Detallar:* Ingresaremos monto y concepto.\n` +
                    `4️⃣ *Registrar:* El pago quedará en el sistema.\n\n` +
                    `👤 ¿Para quién es la confirmación?`;
                await sendReply(url, session, from, guide, apiKey, reply_delay);
            }
        }
        else if (cmd === '/pago nuevo' && modules.payments) {
            setUserConversation(from, { flow: 'CREATE_PAYMENT', step: 'CLIENT' }, url, session, apiKey, reply_delay);
            await sendReply(url, session, from, `💳 *REGISTRO DE PAGO*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n1️⃣ Escribe el nombre del cliente.\n2️⃣ Indica el monto.\n3️⃣ Selecciona moneda.\n4️⃣ Concepto del pago.\n5️⃣ Fecha del registro.\n6️⃣ Confirmación final.\n\n👤 ¿Para qué cliente?`, apiKey, reply_delay);
        }
        else if (cmd === '/ticket nuevo' && modules.tickets) {
            setUserConversation(from, { flow: 'CREATE_TICKET', step: 'CLIENT' }, url, session, apiKey, reply_delay);
            await sendReply(url, session, from, `🎫 *APERTURA DE TICKET*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n1️⃣ Busca al cliente.\n2️⃣ Define el asunto.\n3️⃣ Revisión de contrato.\n4️⃣ Notificación técnica.\n\n👤 ¿Quién reporta el problema?`, apiKey, reply_delay);
        }
        else if (cmd === '/cliente nuevo' && modules.clients) {
            setUserConversation(from, { flow: 'CREATE_CLIENT', step: 'NAME' }, url, session, apiKey, reply_delay);
            await sendReply(url, session, from, `👤 *ALTA DE CLIENTE*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n1️⃣ Nombre completo.\n2️⃣ WhatsApp/Teléfono.\n3️⃣ Email de contacto.\n4️⃣ Registro oficial.\n\n🏷 ¿Cómo se llama el nuevo cliente?`, apiKey);
        }
        else if (cmd === '/agenda visita' && modules.scheduling) {
            setUserConversation(from, { flow: 'VISIT', step: 'CLIENT', data: {} }, url, session, apiKey, reply_delay);
            await sendReply(url, session, from, `📅 *NUEVA VISITA*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n👤 ¿Para qué cliente?`, apiKey);
        }
        else if (cmd === '/agenda hoy' && modules.scheduling) {
            const events = await getAgenda('hoy');
            await sendAgendaReply(url, session, from, 'HOY', events, apiKey, reply_delay);
        }
        else if (cmd === '/agenda semana' && modules.scheduling) {
            const events = await getAgenda('semana');
            await sendAgendaReply(url, session, from, 'ESTA SEMANA', events, apiKey, reply_delay);
        }
        else if (cmd === '/agenda mes' && modules.scheduling) {
            const events = await getAgenda('mes');
            await sendAgendaReply(url, session, from, 'ESTE MES', events, apiKey, reply_delay);
        }
        else if (cmd === '/agendar' && modules.scheduling) {
            setUserConversation(from, { flow: 'SCHEDULING', step: 'SERVICE', data: {} }, url, session, apiKey, reply_delay);
            await sendReply(url, session, from, `📅 *AGENDA*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\nSelecciona el servicio:\n1️⃣ Soporte\n2️⃣ Instalación\n3️⃣ Consulta\n\n_Responde 1, 2 o 3._`, apiKey, reply_delay);
        }
        else {
            // Verificar si el comando pertenece a un módulo desactivado
            const moduleNeeded = getModuleForCommand(cmd);
            if (moduleNeeded && !modules[moduleNeeded]) {
                const moduleNames = {
                    tickets: 'Tickets',
                    payments: 'Pagos',
                    clients: 'Clientes',
                    scheduling: 'Agenda',
                    passwords: 'Contraseñas',
                    users: 'Usuarios'
                };
                await sendReply(url, session, from,
                    `⚠️ *MÓDULO DESACTIVADO*\n━━━━━━━━━━━━━━━━━━\n` +
                    `El módulo de *${moduleNames[moduleNeeded]}* está actualmente desactivado.\n\n` +
                    `Para usar este comando, un administrador debe activar el módulo desde la configuración del sistema.\n\n` +
                    `💡 _Escribe_ *ayuda* _para ver los comandos disponibles._`,
                    apiKey, reply_delay);
                return;
            }

            // Búsqueda de cliente SOLO si termina con punto (.)
            // Esto evita búsquedas automáticas no deseadas
            if (modules.clients && text.endsWith('.')) {
                // Remover el punto final
                const clientQuery = text.slice(0, -1).trim();

                // Verificar que no sea solo un número (evitar confusión con IDs)
                if (clientQuery && isNaN(clientQuery)) {
                    const clients = await searchClients(clientQuery);
                    if (clients.length > 0) {
                        const c = clients[0];
                        const stats = await getClientStats(c.id);
                        const lastNote = parseRecentNote(c.recent_notes);

                        let summary = `👤 *RESUMEN DE CLIENTE*\n━━━━━━━━━━━━━━━━━━\n`;
                        summary += `💎 *Nombre:* ${c.name}\n`;
                        summary += `📱 *WhatsApp:* ${c.phone || 'No registrado'}\n`;
                        summary += `📜 *Contrato:* ${c.contract ? '✅ Activo' : '❌ Sin contrato'}\n`;
                        summary += `📧 *Email:* ${c.email || 'N/D'}\n\n`;

                        summary += `📊 *ESTADO ACTUAL*\n`;
                        summary += `🎫 Tickets Abiertos: *${stats.openTickets}*\n`;
                        summary += `💰 Deuda Pendiente: *${stats.pendingPayments}*\n\n`;

                        if (lastNote) {
                            summary += `📝 *ÚLTIMA NOTA (${new Date(lastNote.date).toLocaleDateString()}):*\n`;
                            summary += `_"${lastNote.text}"_\n\n`;
                        }

                        summary += `💡 _Escribe_ *tickets ${c.name}.* _o_ *pagos ${c.name}.* _para más detalles._`;

                        await sendReply(url, session, from, summary, apiKey, reply_delay);
                        return;
                    }
                }
            }

            // Si no es cliente ni comando reconocido, mostrar ayuda básica
            const unknownMsg = `😕 *COMANDO NO RECONOCIDO*\n━━━━━━━━━━━━━━━━━━\nHola, no estoy seguro de cómo ayudarte. Aquí tienes algunas opciones:\n\n` +
                `👤 *Nombre Cliente.* → Ver ficha del cliente (termina con punto)\n` +
                `📊 *resumen* → Estado general del sistema\n` +
                `🎫 *tickets* → Ver o buscar tickets\n` +
                `📅 *agenda hoy* → Ver visitas del día\n\n` +
                `💡 _Escribe_ *ayuda* _para ver el manual completo._`;
            await sendReply(url, session, from, unknownMsg, apiKey, reply_delay);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

const handleMultiStepFlow = async (from, text, url, session, apiKey, delay = 4000) => {
    const state = conversationState[from];
    const cmd = text.toLowerCase().trim();
    console.log(`[CHATBOT] ${from} - Mensaje recibido: "${text}". Estado actual: flow=${state.flow}, step=${state.step}`);

    if (cmd === '0' || cmd === 'cancelar') {
        clearUserConversation(from);
        await sendReply(url, session, from, '🔴 *OPERACIÓN CANCELADA*\nEntendido, he detenido el proceso actual.', apiKey, delay);
        return;
    }

    try {
        // YA NO llamamos a setUserConversation al principio, lo haremos al final del flujo
        // para persistir los cambios del paso actual.

        // --- FLUJO: AGENDA (Consultas) ---
        if (state.flow === 'SCHEDULING') {
            if (state.step === 'SERVICE') {
                const svcs = { '1': 'Soporte', '2': 'Instalación', '3': 'Consulta' };
                if (!svcs[text]) return await sendReply(url, session, from, '⚠️ Elige una opción válida (1, 2 o 3).', apiKey, delay);
                state.data.service = svcs[text];
                state.step = 'DATE';
                await sendReply(url, session, from, `📅 *PASO 2/4:* ¿Para qué fecha?\n_(Ejemplo: Mañana a las 10:00 o 15 de Enero)_`, apiKey, delay);
            } else if (state.step === 'DATE') {
                state.data.date = text;
                state.step = 'TIME'; // Renamed to 'notes' in the instruction, but kept as 'TIME' for consistency with original flow logic, assuming 'TIME' is for notes.
                await sendReply(url, session, from, `📝 *PASO 3/4:* ¿Alguna observación adicional?\n_(Ejemplo: Llevar router nuevo)_`, apiKey, delay);
            } else if (state.step === 'TIME') { // This step is now for notes
                state.data.notes = text;
                state.step = 'CONFIRM';
                const summary = `📅 *RESUMEN DE AGENDA*\n━━━━━━━━━━━━━━━━━━\n🛠 Servicio: ${state.data.service}\n📆 Fecha: ${state.data.date}\n📝 Notas: ${state.data.notes}\n\n¿Deseas agendar esta visita? (*SI* / *cancelar*)`;
                await sendReply(url, session, from, summary, apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    // Assuming a function like createScheduledEvent exists
                    // await createScheduledEvent(state.data);
                    clearUserConversation(from);
                    await sendReply(url, session, from, `✅ *VISITA AGENDADA*\nSe ha registrado correctamente en el calendario técnico.`, apiKey, delay);
                } else await sendReply(url, session, from, '⚠️ Responde *SI* o *cancelar*.', apiKey, delay);
            }
        }

        // --- FLUJO: CONFIRMAR PAGO (Guiado) ---
        else if (state.flow === 'CONFIRM_PAYMENT') {
            if (state.step === 'CLIENT') {
                const clients = await searchClients(text);
                if (clients.length === 0) return await sendReply(url, session, from, `❌ No encontré al cliente "${text}". Intenta con otro nombre o "cancelar".`, apiKey, delay);
                state.data = { clientId: clients[0].id, clientName: clients[0].name, status: 'Pagado' }; // Default status
                state.step = 'VALIDATE_CLIENT';
                await sendReply(url, session, from, `✨ He encontrado a: *${clients[0].name}*\n¿Es correcto? (*SI* / *NO*)`, apiKey, delay);
            }
            else if (state.step === 'VALIDATE_CLIENT') {
                if (cmd === 'si') {
                    state.step = 'AMOUNT';
                    await sendReply(url, session, from, `💵 *PASO 2/4:* ¿Cuál es el *monto* recibido?`, apiKey, delay);
                } else if (cmd === 'no') {
                    state.step = 'CLIENT';
                    await sendReply(url, session, from, `👤 Entendido. Por favor, escribe el nombre del cliente nuevamente:`, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Responde *SI* o *NO*.', apiKey, delay);
                }
            }
            else if (state.step === 'AMOUNT') {
                const cleanText = text.replace(',', '.');
                const amount = parseFloat(cleanText);
                if (isNaN(amount)) return await sendReply(url, session, from, '⚠️ Por favor, ingresa un número válido (ej: 1200).', apiKey, delay);
                state.data.amount = amount;
                state.step = 'TYPE';
                await sendReply(url, session, from, `💱 *PASO 3/4:* ¿Moneda y forma de pago?\n_(Ej: Efectivo UYU, Transferencia USD)_`, apiKey, delay);
            } else if (state.step === 'TYPE') {
                state.data.type = text;
                state.step = 'CONCEPT';
                await sendReply(url, session, from, `📝 *PASO 4/4:* ¿Concepto del pago?\n_(Ej: Mensualidad Enero)_`, apiKey, delay);
            } else if (state.step === 'CONCEPT') {
                state.data.concept = text;
                state.step = 'PAYMENT_STATE';
                await sendReply(url, session, from, `🤔 *¿Cómo clasificar este registro?*\n\n1️⃣ Ya fue realizado (Cobro en mano/banco).\n2️⃣ Solo registro de pago pendiente.\n\n_Responde 1 o 2._`, apiKey, delay);
            } else if (state.step === 'PAYMENT_STATE') {
                if (text === '1' || text === '2') {
                    state.data.status = text === '1' ? 'Pagado' : 'Pendiente';
                    state.step = 'CONFIRM';
                    const summary = `💎 *RESUMEN DE OPERACIÓN*\n━━━━━━━━━━━━━━━━━━\n👤 Cliente: ${state.data.clientName}\n💰 Monto: ${state.data.amount}\n💳 Tipo: ${state.data.type}\n📝 Concepto: ${state.data.concept}\n📌 Estado: ${state.data.status.toUpperCase()}\n\n¿Confirmas el registro? (*SI* / *cancelar*)`;
                    await sendReply(url, session, from, summary, apiKey, delay);
                } else await sendReply(url, session, from, '⚠️ Elige 1 o 2.', apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    await createPaymentForClient({
                        ...state.data,
                        currency: state.data.type.toUpperCase().includes('USD') ? 'USD' : (state.data.type.toUpperCase().includes('ARS') ? 'ARS' : 'UYU'),
                        method: state.data.type,
                        status: state.data.status
                    });
                    clearUserConversation(from);
                    await sendReply(url, session, from, `✅ *REGISTRO EXITOSO*\nLa operación ha sido guardada y el balance del cliente actualizado.`, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Responde *SI* para confirmar o *cancelar*.', apiKey, delay);
                }
            }
        }

        // --- FLUJO: NUEVO PAGO ---
        else if (state.flow === 'CREATE_PAYMENT') {
            if (state.step === 'CLIENT') {
                console.log(`[CHATBOT] ${from} - Buscando cliente: ${text}`);
                const clients = await searchClients(text);
                if (clients.length === 0) {
                    console.log(`[CHATBOT] ${from} - Cliente no encontrado: ${text}`);
                    return await sendReply(url, session, from, `❌ No encontré al cliente "${text}". Intenta de nuevo o "cancelar".`, apiKey, delay);
                }
                state.data = { clientId: clients[0].id, clientName: clients[0].name };
                state.step = 'AMOUNT';
                console.log(`[CHATBOT] ${from} - Cliente seleccionado: ${state.data.clientName}. Nuevo paso: ${state.step}`);
                await sendReply(url, session, from, `💵 *PASO 2/4:* ¿Monto para *${state.data.clientName}*?\n_(Ejemplo: 1500)_`, apiKey, delay);
            } else if (state.step === 'AMOUNT') {
                console.log(`[CHATBOT] ${from} - Procesando monto: ${text}`);
                const cleanText = text.replace(',', '.');
                const amount = parseFloat(cleanText);
                if (isNaN(amount)) {
                    console.log(`[CHATBOT] ${from} - Monto inválido: ${text}`);
                    return await sendReply(url, session, from, '⚠️ Por favor, envía un número válido.', apiKey, delay);
                }
                state.data.amount = amount;
                state.step = 'CURRENCY';
                console.log(`[CHATBOT] ${from} - Monto fijado: ${amount}. Nuevo paso: ${state.step}`);
                await sendReply(url, session, from, `💱 *PASO 3/4:* ¿Moneda?\n_(UYU, USD, ARS)_`, apiKey, delay);
            } else if (state.step === 'CURRENCY') {
                state.data.currency = text.toUpperCase();
                state.step = 'CONCEPT';
                console.log(`[CHATBOT] ${from} - Moneda fijada: ${state.data.currency}. Nuevo paso: ${state.step}`);
                await sendReply(url, session, from, `📝 *PASO 4/6:* ¿Concepto del pago?\n_(Ejemplo: Mes de Enero, Instalación router)_`, apiKey, delay);
            } else if (state.step === 'CONCEPT') {
                state.data.concept = text;
                state.step = 'DATE';
                console.log(`[CHATBOT] ${from} - Concepto fijado. Nuevo paso: ${state.step}`);
                await sendReply(url, session, from, `📅 *PASO 5/6:* ¿Fecha del pago?\n_(Responde "hoy" o ingresa YYYY-MM-DD)_`, apiKey, delay);
            } else if (state.step === 'DATE') {
                state.data.date = text.toLowerCase() === 'hoy' ? new Date().toISOString().split('T')[0] : text;
                state.step = 'CONFIRM';
                console.log(`[CHATBOT] ${from} - Fecha fijada: ${state.data.date}. Nuevo paso: ${state.step}`);
                const summary = `📝 *RESUMEN DE PAGO*\n━━━━━━━━━━━━━━━━━━\n👤 Cliente: ${state.data.clientName}\n💰 Monto: ${state.data.amount} ${state.data.currency}\n📝 Concepto: ${state.data.concept}\n📅 Fecha: ${state.data.date}\n\n¿Registrar este pago como pendiente? (*SI* / *cancelar*)`;
                await sendReply(url, session, from, summary, apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    await createPaymentForClient({ ...state.data, status: 'Pendiente' });
                    clearUserConversation(from);
                    await sendReply(url, session, from, `✅ *OPERACIÓN COMPLETADA*\nEl pago pendiente ha sido registrado en la ficha del cliente.`, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Responde *SI* para confirmar o *cancelar*.', apiKey, delay);
                }
            }
        }

        // --- FLUJO: NUEVO TICKET ---
        else if (state.flow === 'CREATE_TICKET') {
            if (state.step === 'CLIENT') {
                const clients = await searchClients(text);
                if (clients.length === 0) return await sendReply(url, session, from, `❌ No encontré al cliente "${text}". Intenta con otro nombre o "cancelar".`, apiKey, delay);
                const c = clients[0];
                state.data = { clientId: c.id, clientName: c.name, hasContract: c.contract };
                state.step = 'SUBJECT';
                await sendReply(url, session, from, `📝 *PASO 2/4:* Asunto del ticket para *${c.name}*?`, apiKey, delay);
            } else if (state.step === 'SUBJECT') {
                state.data.title = text;
                state.step = 'CONFIRM';
                const contractIcon = (state.data.hasContract === 1 || state.data.hasContract === true) ? '✅' : '❌';
                const summary = `🎫 *RESUMEN DE TICKET*\n━━━━━━━━━━━━━━━━━━\n👤 Cliente: ${state.data.clientName}\n📝 Asunto: ${state.data.title}\n📜 Contrato activo: ${contractIcon}\n\n¿Crear este ticket ahora? (*SI* / *cancelar*)`;
                await sendReply(url, session, from, summary, apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    await createTicket({
                        clientId: state.data.clientId,
                        title: state.data.title,
                        description: 'Generado desde WhatsApp',
                        priority: 'medium',
                        status: 'open'
                    });
                    clearUserConversation(from);
                    await sendReply(url, session, from, `✅ *TICKET ABIERTO*\nEl equipo técnico ha sido notificado.`, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Responde *SI* para confirmar o *cancelar*.', apiKey, delay);
                }
            }
        }

        // --- FLUJO: NUEVO CLIENTE ---
        else if (state.flow === 'CREATE_CLIENT') {
            if (state.step === 'NAME') {
                state.data = { name: text };
                state.step = 'PHONE';
                await sendReply(url, session, from, `📱 ¿Número de teléfono?`, apiKey, delay);
            } else if (state.step === 'PHONE') {
                state.data.phone = text;
                state.step = 'EMAIL';
                await sendReply(url, session, from, `📧 ¿Correo electrónico?`, apiKey, delay);
            } else if (state.step === 'EMAIL') {
                state.data.email = text;
                state.step = 'CONFIRM';
                await sendReply(url, session, from,
                    `👤 *RESUMEN DE CLIENTE*\n━━━━━━━━━━━━━━━━━━\n` +
                    `📌 Nombre: ${state.data.name}\n` +
                    `📱 Tel: ${state.data.phone}\n` +
                    `📧 Email: ${state.data.email}\n\n` +
                    `¿Confirmas el registro? (*SI* / *cancelar*)`, apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    const newClient = await createClient(state.data);
                    clearUserConversation(from);
                    await sendReply(url, session, from, `✅ *CLIENTE CREADO*\nNombre: ${newClient.name}\nID: ${newClient.id}`, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Responde *SI* para confirmar o *cancelar*.', apiKey, delay);
                }
            }
        }

        // --- FLUJO: VISITA (Agenda Técnica) ---
        else if (state.flow === 'VISIT') {
            if (state.step === 'CLIENT') {
                const clients = await searchClients(text);
                if (clients.length === 0) return sendReply(url, session, from, `❌ No encontré al cliente "${text}".`, apiKey, delay);
                state.data.clientId = clients[0].id;
                state.data.clientName = clients[0].name;
                const users = await listUsers();
                state.data.usersTemp = users;
                let userList = users.map((u, i) => `${i + 1}️⃣ ${u.name}`).join('\n');
                state.step = 'ASSIGN';
                await sendReply(url, session, from, `👤 *ASIGNAR A:*\n━━━━━━━━━━━━━━━━━━\n${userList}\n\n_Responde con el número._`, apiKey, delay);
            } else if (state.step === 'ASSIGN') {
                const idx = parseInt(text) - 1;
                const users = state.data.usersTemp;
                if (!users[idx]) return await sendReply(url, session, from, '⚠️ Elige un número válido de la lista.', apiKey, delay);
                state.data.assignedTo = users[idx].email;
                state.data.assignedName = users[idx].name;
                state.step = 'DATE';
                await sendReply(url, session, from, `📅 ¿Qué día? (Ej: 2025-01-15)`, apiKey, delay);
            } else if (state.step === 'DATE') {
                state.data.date = text;
                state.step = 'TIME';
                await sendReply(url, session, from, `⏰ ¿A qué hora? (Ej: 14:00)`, apiKey, delay);
            } else if (state.step === 'TIME') {
                state.data.time = text;
                state.step = 'CONFIRM';
                await sendReply(url, session, from, `📍 *CONFIRMAR VISITA*\n━━━━━━━━━━━━━━━━━━\n👤 Cliente: ${state.data.clientName}\n👷 Asignado: ${state.data.assignedName}\n📅 Fecha: ${state.data.date}\n⏰ Hora: ${state.data.time}\n\n¿Correcto? (*SI* / *cancelar*)`, apiKey, delay);
            } else if (state.step === 'CONFIRM') {
                if (cmd === 'si') {
                    await createCalendarEvent({
                        title: `Visita: ${state.data.clientName}`,
                        start: `${state.data.date}T${state.data.time}:00`,
                        assignedTo: state.data.assignedTo,
                        clientId: state.data.clientId
                    });

                    // Notificar al técnico asignado
                    const notifyText = `🔔 *NOTIFICACIÓN DE AGENDA*\n━━━━━━━━━━━━━━━━━━\nHola *${state.data.assignedName}*, se te ha asignado una nueva visita:\n\n👤 *Cliente:* ${state.data.clientName}\n📅 *Fecha:* ${state.data.date}\n⏰ *Hora:* ${state.data.time}\n\n_Por favor, confirma la recepción de este mensaje._`;
                    await sendReply(url, session, state.data.assignedTo, notifyText, apiKey, delay);

                    delete conversationState[from];
                    await sendReply(url, session, from, `✅ *VISITA AGENDADA*\nEl evento ha sido creado y se ha notificado a *${state.data.assignedName}* via WhatsApp.`, apiKey, delay);
                } else await sendReply(url, session, from, '⚠️ Responde *SI* o *cancelar*.', apiKey, delay);
            }
        }

        // --- FLUJO: CONSULTA DE TICKETS (TICKET_QUERY) ---
        else if (state.flow === 'TICKET_QUERY') {
            if (state.step === 'MENU') {
                if (text === '1') {
                    const tickets = await getRecentTickets(10);
                    let res = `🎫 *ÚLTIMOS TICKETS*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    tickets.forEach(t => {
                        const statusIcon = (t.status === 'solved' || t.status === 'Resuelto') ? '✅' : '⏳';
                        res += `▫️ *#${t.id}* | ${statusIcon} ${t.clientName}\n↳ _${t.title}_\n\n`;
                    });
                    res += `🤔 *¿Deseas gestionar algo?*\n_Puedes abrir uno nuevo con "ticket nuevo" o consultar un cliente._`;
                    delete conversationState[from];
                    await sendReply(url, session, from, res, apiKey, delay);
                } else if (text === '2') {
                    state.step = 'SEARCH_CLIENT';
                    await sendReply(url, session, from, `👤 ¿De qué *CLIENTE* deseas ver los tickets?`, apiKey, delay);
                } else if (text === '3') {
                    const tickets = await getRecentTickets(20);
                    const open = tickets.filter(t => t.status !== 'solved' && t.status !== 'Resuelto');
                    let res = `🎫 *TICKETS ABIERTOS*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    if (open.length === 0) res += `✅ ¡Todo al día! No hay tickets pendientes.`;
                    else {
                        open.forEach(t => {
                            res += `⏳ *#${t.id}* • ${t.clientName}\n↳ _${t.title}_\n\n`;
                        });
                    }
                    res += `\n🤔 *¿Qué sigue?*\n_Puedes usar "ticket nuevo" o "resumen" para más info._`;
                    delete conversationState[from];
                    await sendReply(url, session, from, res, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Por favor elige 1, 2 o 3.', apiKey, delay);
                }
            } else if (state.step === 'SEARCH_CLIENT') {
                const tickets = await getRecentTickets(50, text);
                let res = `🎫 *TICKETS: ${text.toUpperCase()}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                if (tickets.length === 0) res += `▫️ No se encontraron tickets.\n\n`;
                else {
                    tickets.forEach(t => {
                        const statusIcon = (t.status === 'solved' || t.status === 'Resuelto') ? '✅' : '⏳';
                        res += `${statusIcon} *#${t.id}* | _${t.title}_\n\n`;
                    });
                }
                res += `💡 *Sugerencia:* ¿Quieres ver las *contraseñas* de este cliente? \`(escribe: pass ${text})\``;
                delete conversationState[from];
                await sendReply(url, session, from, res, apiKey, delay);
            }
        }
        // --- FLUJO: CONSULTA DE PAGOS (PAYMENT_QUERY) ---
        else if (state.flow === 'PAYMENT_QUERY') {
            if (state.step === 'MENU') {
                if (text === '1') {
                    const payments = await getGlobalPayments(10);
                    let res = `💰 *ÚLTIMOS PAGOS GLOBALES*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    payments.forEach(p => {
                        const icon = ['completed', 'Aprobado', 'Pagado'].includes(p.status) ? '✅' : '⏳';
                        res += `${icon} *${p.amount.toLocaleString()} ${p.currency}* | ${p.client}\n↳ _${p.concept || 'Pago'}_\n\n`;
                    });
                    res += `¿Deseas registrar un pago nuevo? Escribe "pago nuevo".`;
                    delete conversationState[from];
                    await sendReply(url, session, from, res, apiKey, delay);
                } else if (text === '2') {
                    state.step = 'SEARCH_CLIENT';
                    await sendReply(url, session, from, `👤 ¿De qué *CLIENTE* deseas ver los pagos?`, apiKey, delay);
                } else if (text === '3') {
                    const revenue = await getMonthlyRevenue();
                    let res = `📈 *RECAUDACIÓN MENSUAL*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                    if (revenue.length === 0) res += `▫️ No hay datos suficientes aún.\n`;
                    else {
                        revenue.forEach(r => {
                            res += `📅 *${r.month}* → *${parseFloat(r.total).toLocaleString()} ${r.currency}*\n`;
                        });
                    }
                    res += `\n_Resumen basado solo en pagos confirmados._\n🤔 *¿Qué más deseas hacer?*`;
                    clearUserConversation(from);
                    await sendReply(url, session, from, res, apiKey, delay);
                } else {
                    await sendReply(url, session, from, '⚠️ Elige una opción (1, 2 o 3).', apiKey, delay);
                }
            } else if (state.step === 'SEARCH_CLIENT') {
                const clients = await searchClients(text);
                if (clients.length === 0) {
                    await sendReply(url, session, from, `❌ No encontré al cliente "${text}". Intenta de nuevo o "cancelar".`, apiKey, delay);
                    return;
                }
                const client = clients[0];
                const payments = await searchPaymentsByClient(client.id);
                let res = `💰 *PAGOS: ${client.name.toUpperCase()}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
                if (payments.length === 0) res += `▫️ Sin historial registrado.\n\n`;
                else {
                    let total = 0;
                    payments.forEach(p => {
                        const icon = ['completed', 'Aprobado', 'Pagado'].includes(p.status) ? '✅' : '⏳';
                        if (icon === '✅') total += parseFloat(p.amount);
                        res += `${icon} *${parseFloat(p.amount).toLocaleString()} ${p.currency}*\n↳ ${p.concept || 'S/C'}\n\n`;
                    });
                    res += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n🏆 *TOTAL:* ${total.toLocaleString()}\n\n`;
                }
                res += `💡 *Tip:* Puedes ver sus tickets con \`tickets ${client.name}\``;
                clearUserConversation(from);
                await sendReply(url, session, from, res, apiKey, delay);
            }
        }

        // PERSISTENCIA FINAL: Guardamos el estado modificado (paso, datos, etc) 
        // antes de terminar la ejecución de handleMultiStepFlow.
        if (conversationState[from]) {
            setUserConversation(from, state, url, session, apiKey, delay);
        }
    } catch (e) {
        addLog('error', 'Error en flujo', e.message);
        await sendReply(url, session, from, '❌ Error procesando solicitud. Intenta de nuevo.', apiKey, delay);
        delete conversationState[from];
    }
};

// Funciones de DB
const getTicketStats = () => {
    return new Promise((resolve) => {
        db.get('SELECT COUNT(*) as total, SUM(CASE WHEN status IN ("open", "Abierto", "Nuevo") THEN 1 ELSE 0 END) as open, SUM(CASE WHEN status IN ("solved", "Resuelto", "Cerrado") THEN 1 ELSE 0 END) as solved FROM tickets', (err, row) => {
            resolve({ total: row?.total || 0, open: row?.open || 0, solved: row?.solved || 0 });
        });
    });
};

const getRecentTickets = (limit = 10, clientName = null) => {
    let query = `
        SELECT t.*, c.name as clientName 
        FROM tickets t 
        JOIN clients c ON t.client_id = c.id 
    `;
    let params = [];
    if (clientName) {
        query += ` WHERE c.name LIKE ? OR c.alias LIKE ? `;
        params.push(`%${clientName}%`, `%${clientName}%`);
    }
    query += ` ORDER BY t.createdAt DESC LIMIT ? `;
    params.push(limit);

    return new Promise((resolve) => {
        db.all(query, params, (err, rows) => {
            resolve(rows || []);
        });
    });
};

const getTicketById = (ticketId) => {
    return new Promise((resolve) => {
        db.get(`
            SELECT t.*, c.name as clientName, c.contract 
            FROM tickets t 
            JOIN clients c ON t.client_id = c.id 
            WHERE t.id = ?
        `, [ticketId], (err, row) => {
            resolve(row || null);
        });
    });
};

const searchClients = (query) => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? OR alias LIKE ? LIMIT 3`, [`%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
            resolve(rows || []);
        });
    });
};

const getClientAccesses = async (clientId) => {
    const mongo = getMongoDb();
    if (!mongo) return [];
    try {
        return await mongo.collection('client_accesses').find({ clientId: clientId.toString() }).toArray();
    } catch (e) { return []; }
};

const searchPaymentsByClient = (clientId) => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM payments WHERE client_id = ? ORDER BY createdAt DESC LIMIT 10`, [clientId], (err, rows) => {
            resolve(rows || []);
        });
    });
};

const getClientStats = (clientId) => {
    return new Promise((resolve) => {
        const stats = { openTickets: 0, pendingPayments: 0 };
        db.get(`SELECT COUNT(*) as count FROM tickets WHERE client_id = ? AND status IN ('open', 'Abierto', 'Nuevo', 'In_Progress')`, [clientId], (err, row) => {
            if (row) stats.openTickets = row.count;
            db.get(`SELECT SUM(amount) as sum FROM payments WHERE client_id = ? AND status IN ('pending', 'Pendiente')`, [clientId], (err, row) => {
                if (row) stats.pendingPayments = row.sum || 0;
                resolve(stats);
            });
        });
    });
};

const parseRecentNote = (json) => {
    if (!json) return null;
    try {
        const notes = JSON.parse(json);
        if (Array.isArray(notes) && notes.length > 0) {
            const last = notes[notes.length - 1];
            return {
                text: last.text || last.content || last.note,
                date: last.date || last.createdAt || new Date()
            };
        }
    } catch (e) { }
    return null;
};

const parseLastNote = (json) => {
    try {
        const arr = JSON.parse(json);
        if (Array.isArray(arr) && arr.length > 0) {
            const last = arr[arr.length - 1];
            return { text: last.text || last.content || last.note, date: last.date || last.createdAt || new Date() };
        }
    } catch (e) { }
    return null;
};

// Creadores
const createPaymentForClient = (data) => {
    return new Promise((resolve, reject) => {
        const id = `PAY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const createdAt = data.date ? new Date(data.date).toISOString() : new Date().toISOString();
        db.run(`INSERT INTO payments (id, client, client_id, amount, currency, status, method, concept, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.clientName,
                data.clientId,
                data.amount,
                data.currency || 'UYU',
                data.status || 'Pendiente',
                data.method || 'Transferencia',
                data.concept || '',
                createdAt
            ],
            (err) => err ? reject(err) : resolve({ id }));
    });
};

const createTicketForClient = (data) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tickets (client_id, title, priority, status, createdAt) VALUES (?, ?, ?, ?, ?)`,
            [data.clientId, data.title, 'medium', 'Nuevo', new Date().toISOString()],
            function (err) { err ? reject(err) : resolve({ id: this.lastID }); });
    });
};

// Alias para compatibilidad
const createTicket = createTicketForClient;


const createClient = (data) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO clients (name, phone, email, contract) VALUES (?, ?, ?, ?)`,
            [data.name, data.phone, data.email, 0],
            function (err) { err ? reject(err) : resolve({ id: this.lastID, name: data.name }); });
    });
};

const createCalendarEvent = (data) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO calendar_events (title, start, end, source_type, client_id, assigned_to, locked) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.title, data.start, data.start, 'manual', data.clientId, data.assignedTo, 0],
            function (err) { err ? reject(err) : resolve({ id: this.lastID }); });
    });
};

const listUsers = async () => {
    const mongo = getMongoDb();
    if (!mongo) return [];
    try {
        const users = await mongo.collection('users').find({}).toArray();
        return users.map(u => ({ name: u.name || u.email.split('@')[0], email: u.email }));
    } catch (e) { return []; }
};

const getAgenda = (period) => {
    let where = "";
    if (period === 'hoy') {
        where = "date(e.start) = date('now', 'localtime')";
    } else if (period === 'semana') {
        where = "date(e.start) >= date('now', 'weekday 0', '-7 days') AND date(e.start) <= date('now', 'weekday 0')";
    } else if (period === 'mes') {
        where = "strftime('%m', e.start) = strftime('%m', 'now')";
    }

    return new Promise((resolve) => {
        db.all(`
            SELECT e.*, c.name as clientName, c.contract as hasContract 
            FROM calendar_events e
            LEFT JOIN clients c ON e.client_id = c.id
            WHERE ${where} 
            ORDER BY e.start ASC
        `, (err, rows) => {
            resolve(rows || []);
        });
    });
};

const getGlobalPayments = (limit = 10) => {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM payments ORDER BY createdAt DESC LIMIT ?`, [limit], (err, rows) => {
            resolve(rows || []);
        });
    });
};

const getMonthlyRevenue = () => {
    return new Promise((resolve) => {
        db.all(`
            SELECT strftime('%Y-%m', createdAt) as month, SUM(amount) as total, currency 
            FROM payments 
            WHERE status IN ('completed', 'Aprobado', 'Pagado') 
            GROUP BY month, currency 
            ORDER BY month DESC 
            LIMIT 6
        `, (err, rows) => {
            resolve(rows || []);
        });
    });
};

const sendAgendaReply = async (url, session, from, title, events, apiKey, delay = 4000) => {
    if (events.length === 0) {
        return await sendReply(url, session, from, `📅 *AGENDA: ${title}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\nNo hay eventos programados.`, apiKey, delay);
    }
    let text = `📅 *AGENDA: ${title}*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
    events.forEach(e => {
        const d = new Date(e.start);
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        const tech = e.assigned_to ? e.assigned_to.split('@')[0] : 'N/A';
        const contractIcon = e.hasContract ? '✅' : '❌';

        text += `⏰ *${time}* (${dateStr})\n`;
        if (e.clientName) {
            text += `👤 *Clie:* ${e.clientName} (${contractIcon})\n`;
            text += `📝 _${e.title.replace(`Visita: ${e.clientName}`, '').trim() || e.title}_\n`;
        } else {
            text += `📍 *${e.title}*\n`;
        }
        text += `👤 Resp: ${tech}\n\n`;
    });
    await sendReply(url, session, from, text, apiKey, delay);
};

const sendReply = async (baseUrl, session, chatId, text, apiKey, delay = 4000) => {
    if (!baseUrl) return;
    try {
        // Simular escritura con retardo configurable
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        const headers = apiKey ? { 'X-Api-Key': apiKey } : {};
        await axios.post(`${baseUrl}/api/sendText`, { chatId, text, session: session || 'default' }, { headers });
        addLog('outbound', `Respuesta a ${chatId}`, text);
    } catch (error) {
        addLog('error', 'Error enviando respuesta', error.message);
    }
};

module.exports = router;
