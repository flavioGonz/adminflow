const http = require('http');

const paths = [
    '/api/webhooks',
    '/api/webhook',
    '/api/default/webhooks',
    '/api/server/webhooks'
];

async function probe(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: '192.168.99.104',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'X-Api-Key': 'e514563f761e44c78c5f84e0d29e46d1'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ path, status: res.statusCode, data });
            });
        });
        req.on('error', () => resolve({ path, status: 500 }));
        req.end();
    });
}

async function run() {
    console.log('Probing paths...');
    for (const path of paths) {
        const res = await probe(path);
        console.log(`GET ${path} -> ${res.status}`);
    }
}

run();
