const http = require('http');

const options = {
    hostname: '192.168.99.104',
    port: 3000,
    path: '/api-json',
    method: 'GET',
    headers: {
        'X-Api-Key': 'e514563f761e44c78c5f84e0d29e46d1'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const paths = Object.keys(json.paths);
            console.log('--- ALL WEBHOOK RELATED PATHS ---');
            paths.filter(p => p.toLowerCase().includes('webhook')).forEach(p => {
                const methods = Object.keys(json.paths[p]);
                console.log(`${methods.join(', ').toUpperCase()} ${p}`);
            });
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Status:', res.statusCode);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
