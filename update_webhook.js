const http = require('http');

const API_KEY = 'e514563f761e44c78c5f84e0d29e46d1';
const WEBHOOK_URL = 'http://192.168.99.183:5000/api/chatbot/webhook';

async function getSession() {
    return new Promise((resolve) => {
        const options = {
            hostname: '192.168.99.104',
            port: 3000,
            path: '/api/sessions',
            method: 'GET',
            headers: { 'X-Api-Key': API_KEY }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(JSON.parse(data)[0]); });
        });
        req.end();
    });
}

async function updateWebhook() {
    const session = await getSession();
    console.log('Session config:', JSON.stringify(session.config, null, 2));

    const payload = JSON.stringify({
        webhooks: [
            {
                url: WEBHOOK_URL,
                events: ['message'],
                enabled: true
            }
        ]
    });

    // En WAHA Core, a veces es PATCH o PUT a /api/sessions/{session} o /api/{session}/config
    // Pero probemos el endpoint de webhooks primero si existe bajo /api/{session}/webhooks

    const options = {
        hostname: '192.168.99.104',
        port: 3000,
        path: `/api/default/config`, // Intento con /config
        method: 'PATCH',
        headers: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('Update Status:', res.statusCode);
            console.log('Update Response:', data);
        });
    });
    req.write(payload);
    req.end();
}

updateWebhook();
