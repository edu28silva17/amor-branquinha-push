import webpush from 'web-push';
import fs from 'fs';

const keys = webpush.generateVAPIDKeys();
const env = `VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PRIVATE_KEY=${keys.privateKey}
VAPID_CONTACT=mailto:you@example.com
`;
fs.writeFileSync('.env', env);
console.log('✅ VAPID keys geradas e salvas em .env');
console.log('Public Key:', keys.publicKey);
