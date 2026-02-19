const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('PublicKey:', vapidKeys.publicKey);
console.log('PrivateKey:', vapidKeys.privateKey);
