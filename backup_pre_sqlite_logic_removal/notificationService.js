const nodemailer = require('nodemailer');
const axios = require('axios');
const { URLSearchParams } = require('url');

const { getMongoDb } = require('./mongoClient');
const { recordSyncEvent } = require('./sqliteSync');
const { getConfig } = require('./configService');
const { getTemplateForEvent } = require('./emailTemplates');

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const DEFAULT_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID;

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const TWILIO_WHATSAPP_TO = process.env.TWILIO_WHATSAPP_TO;

const hasEmail = EMAIL_HOST && EMAIL_USER && EMAIL_PASS;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const hasTelegram = TELEGRAM_TOKEN && TELEGRAM_CHAT;
const hasWhatsApp = TWILIO_SID && TWILIO_TOKEN && TWILIO_WHATSAPP_FROM && TWILIO_WHATSAPP_TO;
const hasSlack = Boolean(SLACK_WEBHOOK);

// Función para obtener configuración SMTP (primero de MongoDB, luego de env)
const getSmtpConfig = async () => {
  try {
    const mongoDb = getMongoDb();
    console.log('📧 MongoDB connected:', !!mongoDb);

    const config = await getConfig('notifications');
    console.log('📧 Config received:', JSON.stringify(config, null, 2));
    if (config && config.data && config.data.channels && config.data.channels.email) {
      const emailConfig = config.data.channels.email;
      console.log('📧 Email config found:', emailConfig);
      if (emailConfig.enabled && emailConfig.apiKey && emailConfig.smtpUser && emailConfig.smtpPass) {
        return {
          host: emailConfig.apiKey,
          port: Number(emailConfig.webhook) || 587,
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPass,
        };
      }
    }
  } catch (error) {
    console.log('No se pudo obtener configuración SMTP de MongoDB, usando variables de entorno');
    console.error('Error:', error);
  }

  // Fallback a variables de entorno
  if (hasEmail) {
    return {
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    };
  }

  return null;
};

const sendEmail = async ({ to, subject, html, text }) => {
  console.log('📧 sendEmail called with to:', to);
  const smtpConfig = await getSmtpConfig();

  if (!smtpConfig) {
    console.log('❌ No SMTP config found');
    return { status: 'skipped', detail: 'Email transport not configured' };
  }

  console.log('✅ SMTP Config:', { host: smtpConfig.host, port: smtpConfig.port, user: smtpConfig.user });

  // Fallback: si no hay destinatario, usar el mismo usuario SMTP (admin)
  const finalTo = to || smtpConfig.user;

  if (!finalTo) {
    console.error('❌ Error sending email: No recipients defined');
    return { status: 'failed', detail: 'No recipients defined' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const message = {
    from: DEFAULT_FROM || smtpConfig.user,
    to: finalTo,
    subject,
    text,
    html,
  };

  console.log('📧 Sending email:', { from: message.from, to: message.to, subject: message.subject });

  try {
    const result = await transporter.sendMail(message);
    console.log('✅ Email sent successfully:', result.messageId);
    return { status: 'sent', channel: 'email', to: finalTo };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

const sendTelegram = async ({ message }) => {
  console.log('📱 sendTelegram called');

  // Intentar obtener configuración de MongoDB
  let botToken = TELEGRAM_TOKEN;
  let chatId = TELEGRAM_CHAT;

  try {
    const config = await getConfig('notifications');
    console.log('📱 Telegram config:', config?.data?.channels?.telegram);
    if (config?.data?.channels?.telegram?.enabled) {
      botToken = config.data.channels.telegram.apiKey || botToken;
      chatId = config.data.channels.telegram.webhook || chatId;
    }
  } catch (error) {
    console.log('Using env vars for Telegram');
  }

  if (!botToken || !chatId) {
    console.log('❌ Telegram not configured');
    return { status: 'skipped', detail: 'Telegram not configured' };
  }

  console.log('✅ Sending to Telegram chat:', chatId);

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
    console.log('✅ Telegram sent successfully');
    return { status: 'sent', channel: 'telegram' };
  } catch (error) {
    console.error('❌ Error sending Telegram:', error.message);
    throw error;
  }
};

const sendWhatsApp = async ({ message }) => {
  console.log('💬 sendWhatsApp called');

  // Intentar obtener configuración de MongoDB
  let accountSid = TWILIO_SID;
  let authToken = TWILIO_TOKEN;
  let fromNumber = TWILIO_WHATSAPP_FROM;
  let toNumber = TWILIO_WHATSAPP_TO;

  try {
    const config = await getConfig('notifications');
    console.log('💬 WhatsApp config:', config?.data?.channels?.whatsapp);
    if (config?.data?.channels?.whatsapp?.enabled) {
      accountSid = config.data.channels.whatsapp.apiKey || accountSid;
      authToken = config.data.channels.whatsapp.webhook || authToken;
      // Nota: fromNumber y toNumber deberían estar en metadata o campos adicionales
    }
  } catch (error) {
    console.log('Using env vars for WhatsApp');
  }

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.log('❌ WhatsApp/Twilio not configured');
    return { status: 'skipped', detail: 'WhatsApp/Twilio not configured' };
  }

  console.log('✅ Sending WhatsApp from:', fromNumber, 'to:', toNumber);

  try {
    const params = new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${toNumber}`,
      Body: message,
    });
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log('✅ WhatsApp sent successfully');
    return { status: 'sent', channel: 'whatsapp' };
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error.message);
    throw error;
  }
};

const sendSlack = async ({ message }) => {
  console.log('💼 sendSlack called');

  // Intentar obtener configuración de MongoDB
  let webhookUrl = SLACK_WEBHOOK;

  try {
    const config = await getConfig('notifications');
    console.log('💼 Slack config:', config?.data?.channels?.slack);
    if (config?.data?.channels?.slack?.enabled) {
      webhookUrl = config.data.channels.slack.apiKey || webhookUrl;
    }
  } catch (error) {
    console.log('Using env vars for Slack');
  }

  if (!webhookUrl) {
    console.log('❌ Slack webhook not configured');
    return { status: 'skipped', detail: 'Slack webhook not configured' };
  }

  console.log('✅ Sending to Slack webhook');

  try {
    await axios.post(
      webhookUrl,
      {
        text: message,
        mrkdwn: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Slack sent successfully');
    return { status: 'sent', channel: 'slack' };
  } catch (error) {
    console.error('❌ Error sending Slack:', error.message);
    throw error;
  }
};

const channelHandlers = {
  email: sendEmail,
  telegram: sendTelegram,
  whatsapp: sendWhatsApp,
  slack: sendSlack,
};

const isReady = () => hasEmail || hasTelegram || hasWhatsApp || Boolean(getMongoDb());

const notify = async ({ event, message, channels = ['email'], metadata = {}, recipients = [] }) => {
  console.log('📧 Notify called with:', { event, channels, recipients });

  const selectedChannels = Array.isArray(channels) ? channels : [channels];
  const tasks = selectedChannels.map((channel) => {
    const handler = channelHandlers[channel];
    if (!handler) {
      return () =>
        Promise.resolve({ status: 'skipped', detail: `Canal desconocido: ${channel}` });
    }
    if (channel === 'email') {
      const emailTo = recipients.length > 0 ? recipients.join(', ') : EMAIL_USER;
      console.log('📧 Sending email to:', emailTo);

      const templateData = { ...metadata, message };
      const { subject, html, text } = getTemplateForEvent(event, templateData);

      return () => handler({ subject, html, text, to: emailTo });
    }
    return () => handler({ message });
  });
  const settled = await Promise.all(
    tasks.map((task) =>
      task().catch((error) => ({
        status: 'failed',
        detail: error.message,
      }))
    )
  );

  const db = getMongoDb();
  if (db) {
    await db
      .collection('notifications')
      .insertOne({
        event,
        message,
        channels: selectedChannels,
        recipients,
        metadata,
        results: settled,
        createdAt: new Date(),
      })
      .catch(() => { });
  }
  recordSyncEvent('notifications', {
    event,
    message,
    metadata,
    channels: selectedChannels,
    occurrences: settled,
  }).catch(() => { });
  return settled;
};

module.exports = {
  notify,
  isReady,
};
