// server/scripts/clean-install.js
// Script para limpiar archivos de instalación y permitir reinstalar desde cero

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🧹 Limpieza de Instalación - AdminFlow\n');
console.log('⚠️  ADVERTENCIA: Esta acción eliminará:');
console.log('   • Marcador de instalación (.installed)');
console.log('   • Configuración de base de datos (.selected-db.json)');
console.log('   • Base de datos SQLite (si existe)\n');

rl.question('¿Deseas continuar? (sí/no): ', (answer) => {
    if (answer.toLowerCase() !== 'sí' && answer.toLowerCase() !== 'si' && answer.toLowerCase() !== 's') {
        console.log('\n❌ Operación cancelada.\n');
        rl.close();
        return;
    }

    console.log('\n🔄 Iniciando limpieza...\n');

    const filesToRemove = [
        path.join(__dirname, '../.installed'),
        path.join(__dirname, '../.selected-db.json'),
        path.join(__dirname, '../database/database.sqlite')
    ];

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    let removedCount = 0;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

    filesToRemove.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                // Crear backup antes de eliminar
                const fileName = path.basename(file);
                const backupPath = path.join(backupDir, `${fileName}.backup-${timestamp}`);
                
                try {
                    fs.copyFileSync(file, backupPath);
                    console.log(`💾 Backup creado: ${path.basename(backupPath)}`);
                } catch (backupError) {
                    console.warn(`⚠️  No se pudo crear backup de ${fileName}`);
                }
                
                // Eliminar archivo
                fs.unlinkSync(file);
                console.log(`✅ Eliminado: ${fileName}`);
                removedCount++;
            } catch (error) {
                console.error(`❌ Error eliminando ${path.basename(file)}:`, error.message);
            }
        } else {
            console.log(`ℹ️  No existe: ${path.basename(file)}`);
        }
    });

    console.log(`\n✅ Limpieza completada. ${removedCount} archivo(s) eliminado(s).`);
    console.log(`💾 Backups guardados en: ${backupDir}`);
    console.log('\n📋 Ahora puedes:');
    console.log('   1. Ejecutar: npm run dev');
    console.log('   2. Ir a: http://localhost:3000/install');
    console.log('   3. Completar el wizard de instalación\n');
    
    rl.close();
});
