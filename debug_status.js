
const { getMongoServerManager } = require('./server/lib/mongoServerManager');

async function checkStatusStart() {
    console.log('Starting manager...');
    const manager = getMongoServerManager();

    console.log('Servers config:', JSON.stringify(manager.getServers(), null, 2));

    console.log('Checking status...');
    try {
        const status = await manager.getServersStatus();
        console.log('Status result:', JSON.stringify(status, null, 2));
    } catch (err) {
        console.error('Fatal error checking status:', err);
    }
}

checkStatusStart().catch(err => console.error('Top level error:', err));
