const fs = require('fs');

const envPath = '/opt/adminflow/client/.env.local';
let content = fs.readFileSync(envPath, 'utf8');

// Fix the env file - use proper NEXT_PUBLIC prefix for client-side access
// And set the internal backend URL for rewrites
const newEnv = `# Backend API (internal - for Next.js rewrites)
NEXT_PUBLIC_API_URL=http://192.168.99.84:5000/api

# NextAuth
NEXTAUTH_URL=http://192.168.99.84:3000
NEXTAUTH_SECRET=your-secret-here
`;

fs.writeFileSync(envPath, newEnv);
console.log('Updated .env.local');
