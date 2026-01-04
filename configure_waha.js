const http = require('http');

const WAHA_URL = 'http://192.168.99.104:3000/api/webhooks';
const API_KEY = 'e514563f761e44c78c5f84e0d29e46d1';
const WEBHOOK_URL = 'http://192.168.99.183:5000/api/chatbot/webhook';

const payload = JSON.stringify({
    url: WEBHOOK_URL,
    events: ['message'],
    enabled: true
});

const options = {
    hostname: '192.168.99.104',
    port: 3000,
    path: '/api/webhooks',
    method: 'POST',
    headers: {
        'X-Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

console.log('--- Configurando Webhook en WAHA (usando http nativo) ---');
console.log('Enviando a:', WAHA_URL);

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Respuesta:', data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ Webhook configurado correctamente.');
        } else {
            console.log('\n❌ Error en la respuesta del servidor.');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
});

req.write(payload);
req.end();
