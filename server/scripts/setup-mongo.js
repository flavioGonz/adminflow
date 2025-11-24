// server/scripts/setup-mongo.js
// Script para ejecutar el instalador interactivo de MongoDB

const { interactiveMongoSetup } = require('../lib/interactiveMongoSetup');

async function main() {
    try {
        await interactiveMongoSetup();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
