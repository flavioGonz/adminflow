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
            console.log('Search results for "webhook":');
            paths.filter(p => p.toLowerCase().includes('webhook')).forEach(p => console.log(p));

            console.log('\nSearch results for "session":');
            paths.filter(p => p.toLowerCase().includes('session')).forEach(p => console.log(p));
        } catch (e) {
            console.error('Error parsing JSON or API Key required but not authorized.');
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => console.error(e));
req.end();
