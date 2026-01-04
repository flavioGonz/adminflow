const http = require('http');

async function testHeader(headerName) {
    return new Promise((resolve) => {
        const options = {
            hostname: '192.168.99.104',
            port: 3000,
            path: '/api/sessions',
            method: 'GET',
            headers: {
                [headerName]: 'e514563f761e44c78c5f84e0d29e46d1'
            }
        };
        const req = http.request(options, (res) => {
            resolve({ headerName, status: res.statusCode });
        });
        req.on('error', () => resolve({ headerName, status: 500 }));
        req.end();
    });
}

async function run() {
    const headers = ['X-Api-Key', 'X-API-Key', 'X-API-KEY', 'Authorization'];
    for (const h of headers) {
        const val = h === 'Authorization' ? 'Bearer e514563f761e44c78c5f84e0d29e46d1' : 'e514563f761e44c78c5f84e0d29e46d1';
        // Reuse logic but for one-off
        const res = await testHeader(h);
        console.log(`${h} -> ${res.status}`);
    }
}
run();
