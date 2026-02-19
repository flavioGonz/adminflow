
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up Client Caches...');

const clientDir = path.join(__dirname, 'client');
const nextDir = path.join(clientDir, '.next');
const nodeModules = path.join(clientDir, 'node_modules');

// 1. Remove .next directory
if (fs.existsSync(nextDir)) {
    console.log('   Removing .next directory...');
    fs.rmSync(nextDir, { recursive: true, force: true });
}

// 2. Clear known cache directories (if any)
// sometimes .turbo or similar might exist
const turboCache = path.join(clientDir, '.turbo');
if (fs.existsSync(turboCache)) {
    console.log('   Removing .turbo directory...');
    fs.rmSync(turboCache, { recursive: true, force: true });
}

console.log('✅ Cleanup complete. Please restart your server now:');
console.log('   cd client && npm run dev');
