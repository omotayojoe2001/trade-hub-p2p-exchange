const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('📋 COPY THESE KEYS:\n');
console.log('🔑 PUBLIC KEY:');
console.log(vapidKeys.publicKey);
console.log('\n🔐 PRIVATE KEY:');
console.log(vapidKeys.privateKey);
console.log('\n💡 Save these keys safely - you\'ll need them for push notifications!');