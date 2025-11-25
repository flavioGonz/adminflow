// server/scripts/clean-install.js
// Script para limpiar archivos de instalación y permitir reinstalar desde cero

const fs = require('fs');
const path = require('path');

console.log('\n🧹 Limpiando archivos de instalación...\n');

const filesToRemove = [
    path.join(__dirname, '../.installed'),
    path.join(__dirname, '../.selected-db.json'),
    path.join(__dirname, '../database/database.sqlite')
];

let removedCount = 0;

filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fs.unlinkSync(file);
            console.log(`✅ Eliminado: ${path.basename(file)}`);
            removedCount++;
        } catch (error) {
            console.error(`❌ Error eliminando ${path.basename(file)}:`, error.message);
        }
    } else {
        console.log(`ℹ️  No existe: ${path.basename(file)}`);
    }
});

console.log(`\n✅ Limpieza completada. ${removedCount} archivo(s) eliminado(s).`);
console.log('\n📋 Ahora puedes:');
console.log('   1. Ejecutar: npm run dev');
console.log('   2. Ir a: http://localhost:3000/install');
console.log('   3. Completar el wizard de instalación\n');
