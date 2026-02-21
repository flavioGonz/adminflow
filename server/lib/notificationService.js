const nodemailer = require('nodemailer');
const axios = require('axios');
const { URLSearchParams } = require('url');
const webpush = require('web-push');

const { getMongoDb } = require('./mongoClient');
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

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@infratec.com.uy';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// Función para obtener configuración SMTP (primero de MongoDB, luego de env)
const getSmtpConfig = async () => {
  try {
    const mongoDb = getMongoDb();
    if (!mongoDb) return null;

    const config = await getConfig('notifications');
    if (config && config.data && config.data.channels && config.data.channels.email) {
      const emailConfig = config.data.channels.email;
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
    console.warn('No se pudo obtener configuración SMTP de MongoDB, usando fallback');
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
  const smtpConfig = await getSmtpConfig();

  if (!smtpConfig) {
    return { status: 'skipped', detail: 'Email transport not configured' };
  }

  const finalTo = to || smtpConfig.user;

  if (!finalTo) {
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

  try {
    const result = await transporter.sendMail(message);
    return { status: 'sent', channel: 'email', to: finalTo };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw error;
  }
};

const sendTelegram = async ({ message }) => {
  let botToken = TELEGRAM_TOKEN;
  let chatId = TELEGRAM_CHAT;

  try {
    const config = await getConfig('notifications');
    if (config?.data?.channels?.telegram?.enabled) {
      botToken = config.data.channels.telegram.apiKey || botToken;
      chatId = config.data.channels.telegram.webhook || chatId;
    }
  } catch (error) {
    // skip
  }

  if (!botToken || !chatId) {
    return { status: 'skipped', detail: 'Telegram not configured' };
  }

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
    return { status: 'sent', channel: 'telegram' };
  } catch (error) {
    console.error('❌ Error sending Telegram:', error.message);
    throw error;
  }
};

const sendWhatsApp = async ({ message }) => {
  let accountSid = TWILIO_SID;
  let authToken = TWILIO_TOKEN;
  let fromNumber = TWILIO_WHATSAPP_FROM;
  let toNumber = TWILIO_WHATSAPP_TO;

  try {
    const config = await getConfig('notifications');
    if (config?.data?.channels?.whatsapp?.enabled) {
      accountSid = config.data.channels.whatsapp.apiKey || accountSid;
      authToken = config.data.channels.whatsapp.webhook || authToken;
    }
  } catch (error) {
    // skip
  }

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return { status: 'skipped', detail: 'WhatsApp/Twilio not configured' };
  }

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
    return { status: 'sent', channel: 'whatsapp' };
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error.message);
    throw error;
  }
};

const sendSlack = async ({ message }) => {
  let webhookUrl = SLACK_WEBHOOK;

  try {
    const config = await getConfig('notifications');
    if (config?.data?.channels?.slack?.enabled) {
      webhookUrl = config.data.channels.slack.apiKey || webhookUrl;
    }
  } catch (error) {
    // skip
  }

  if (!webhookUrl) {
    return { status: 'skipped', detail: 'Slack webhook not configured' };
  }

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
    return { status: 'sent', channel: 'slack' };
  } catch (error) {
    console.error('❌ Error sending Slack:', error.message);
    throw error;
  }
};

const sendWebPush = async ({ message, title = 'AdminFlow' }) => {
  const mongoDb = getMongoDb();
  if (!mongoDb) return { status: 'skipped', detail: 'DB not connected' };

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return { status: 'skipped', detail: 'WebPush VAPID keys not configured' };
  }

  try {
    const subscriptions = await mongoDb.collection('push_subscriptions').find().toArray();
    if (subscriptions.length === 0) {
      return { status: 'skipped', detail: 'No active push subscriptions' };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/assets/patchpanel/rj45.png',
      badge: '/assets/patchpanel/rj45.png',
      data: {
        url: '/'
      }
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, payload);
          return { success: true };
        } catch (error) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Remove expired subscription
            await mongoDb.collection('push_subscriptions').deleteOne({ endpoint: sub.endpoint });
            return { success: false, expired: true };
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const expired = results.filter(r => r.status === 'fulfilled' && r.value.expired).length;

    return {
      status: 'sent',
      channel: 'webpush',
      detail: `Sent to ${successful}/${subscriptions.length} subscribers (${expired} expired removed)`
    };
  } catch (error) {
    console.error('❌ Error sending WebPush:', error.message);
    throw error;
  }
};

const channelHandlers = {
  email: sendEmail,
  telegram: sendTelegram,
  whatsapp: sendWhatsApp,
  slack: sendSlack,
  webpush: sendWebPush,
};

const isReady = () => hasEmail || hasTelegram || hasWhatsApp || (VAPID_PUBLIC && VAPID_PRIVATE) || Boolean(getMongoDb());

const notify = async ({ event, message, channels = ['email'], metadata = {}, recipients = [] }) => {
  const selectedChannels = Array.isArray(channels) ? channels : [channels];
  const tasks = selectedChannels.map((channel) => {
    const handler = channelHandlers[channel];
    if (!handler) {
      return () =>
        Promise.resolve({ status: 'skipped', detail: `Canal desconocido: ${channel}` });
    }
    if (channel === 'email') {
      const emailTo = recipients.length > 0 ? recipients.join(', ') : EMAIL_USER;

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

  return settled;
};

module.exports = {
  notify,
  isReady,
};
