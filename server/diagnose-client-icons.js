#!/usr/bin/env node

/**
 * Script para verificar y poblar datos de acceso/diagrama/archivos para clientes
 * Este script ayuda a diagnosticar por qué los iconos no aparecen en la tabla de clientes
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://192.168.99.121:27017';
const DB_NAME = process.env.MONGO_DB || 'adminflow';

async function main() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✓ Conectado a MongoDB\n');

        const db = client.db(DB_NAME);

        // Obtener todos los clientes
        const clients = await db.collection('clients').find({}).toArray();
        console.log(`📊 Total de clientes: ${clients.length}\n`);

        if (clients.length === 0) {
            console.log('⚠️  No hay clientes en la base de datos');
            return;
        }

        // Verificar datos relacionados
        console.log('=== VERIFICANDO DATOS RELACIONADOS ===\n');

        for (const client of clients.slice(0, 10)) { // Solo primeros 10 para no saturar
            console.log(`\nCliente: ${client.name} (ID: ${client.id})`);

            // Verificar accesos
            const access = await db.collection('client_accesses').findOne({
                clientId: client.id.toString()
            });
            console.log(`  - Accesos: ${access ? '✓ SÍ' : '✗ NO'}`);

            // Verificar diagramas
            const diagram = await db.collection('client_diagrams').findOne({
                clientId: client.id.toString()
            });
            console.log(`  - Diagrama: ${diagram ? '✓ SÍ' : '✗ NO'}`);

            // Verificar archivos
            const files = await db.collection('repository_items').findOne({
                clientId: client.id.toString()
            });
            console.log(`  - Archivos: ${files ? '✓ SÍ' : '✗ NO'}`);

            // Verificar implementación
            const impl = await db.collection('client_implementations').findOne({
                clientId: client.id.toString()
            });
            console.log(`  - Implementación: ${impl ? '✓ SÍ' : '✗ NO'}`);
        }

        // Resumen de colecciones
        console.log('\n\n=== RESUMEN DE COLECCIONES ===');
        const accessCount = await db.collection('client_accesses').countDocuments();
        const diagramCount = await db.collection('client_diagrams').countDocuments();
        const filesCount = await db.collection('repository_items').countDocuments();
        const implCount = await db.collection('client_implementations').countDocuments();

        console.log(`client_accesses: ${accessCount} registros`);
        console.log(`client_diagrams: ${diagramCount} registros`);
        console.log(`repository_items: ${filesCount} registros`);
        console.log(`client_implementations: ${implCount} registros`);

        // Sugerencia
        if (accessCount === 0 && diagramCount === 0 && filesCount === 0 && implCount === 0) {
            console.log('\n⚠️  PROBLEMA DETECTADO:');
            console.log('No hay datos en ninguna de las colecciones relacionadas.');
            console.log('Los iconos no aparecerán hasta que se agreguen datos a estas colecciones.');
            console.log('\nPara agregar datos de prueba, ejecuta:');
            console.log('  node populate-test-data.js');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
