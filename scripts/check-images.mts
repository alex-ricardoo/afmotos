import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keys = envContent.split('\n').map(l => l.split('=')[0].trim()).filter(Boolean);
console.log('ENV KEYS IN .env.local:', keys);
