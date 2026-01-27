// server/scripts/backup-mongo.js
// Backup de la base MongoDB configurada en .selected-db.json
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const configPath = path.join(__dirname, '..', '.selected-db.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ No se encontró .selected-db.json');
    process.exit(1);
}
const { mongoUri, mongoDb } = JSON.parse(fs.readFileSync(configPath, 'utf8'));
if (!mongoUri || !mongoDb) {
    console.error('❌ Configuración incompleta');
    process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, '..', 'backup', `${mongoDb}_${timestamp}`);
fs.mkdirSync(backupDir, { recursive: true });
console.log(`📦 Creando backup en: ${backupDir}`);

const cmd = `mongodump --uri="${mongoUri}" --out="${backupDir}"`;
exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Error al ejecutar mongodump:', error.message);
        process.exit(1);
    }
    if (stderr) {
        console.warn('⚠️  Mensaje de advertencia:', stderr);
    }
    console.log('✅ Backup completado con éxito');
    console.log(stdout);
});
