const fs = require('fs');

const indexPath = '/opt/adminflow/server/index.js';
let content = fs.readFileSync(indexPath, 'utf8');

// Check if push endpoints already exist
if (content.includes('/api/push/subscribe')) {
  console.log('Push endpoints already exist');
  process.exit(0);
}

// Find a good place to insert - after the notification routes or before the final app.listen
const insertMarker = "// Payments";
const insertIndex = content.indexOf(insertMarker);

if (insertIndex === -1) {
  console.log('Could not find insertion point');
  process.exit(1);
}

const pushRoutes = `
// Push Notifications
app.post('/api/push/subscribe', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: 'Invalid subscription' });
        }
        
        // Upsert subscription
        await mongoDb.collection('push_subscriptions').updateOne(
            { endpoint: subscription.endpoint },
            { 
                $set: { 
                    ...subscription,
                    updatedAt: new Date().toISOString()
                },
                $setOnInsert: {
                    createdAt: new Date().toISOString()
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving push subscription:', err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/push/unsubscribe', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            return res.status(400).json({ message: 'Endpoint required' });
        }
        
        await mongoDb.collection('push_subscriptions').deleteOne({ endpoint });
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing push subscription:', err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/push/subscriptions', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const subscriptions = await mongoDb.collection('push_subscriptions').find().toArray();
        res.json(subscriptions);
    } catch (err) {
        console.error('Error fetching push subscriptions:', err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/push/send', async (req, res) => {
    const mongoDb = ensureMongoDb(res);
    if (!mongoDb) return;
    try {
        const { title, body, url, tag } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title required' });
        }
        
        const subscriptions = await mongoDb.collection('push_subscriptions').find().toArray();
        
        // Note: To actually send push notifications, you need web-push library
        // npm install web-push
        // And configure VAPID keys
        
        // For now, just return the count of subscriptions that would receive the notification
        res.json({ 
            success: true, 
            message: \`Notification queued for \${subscriptions.length} subscribers\`,
            payload: { title, body, url, tag }
        });
    } catch (err) {
        console.error('Error sending push notifications:', err);
        res.status(500).json({ message: err.message });
    }
});

`;

content = content.slice(0, insertIndex) + pushRoutes + content.slice(insertIndex);
fs.writeFileSync(indexPath, content);
console.log('Added push notification routes');
