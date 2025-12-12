// server/lib/installationValidator.js
// Utilidad para validar la integridad de la instalación

const fs = require('fs');
const path = require('path');
const { getConfig } = require('./configService');
const { getMongoDb } = require('./mongoClient');

/**
 * Valida que todos los componentes críticos de la instalación estén presentes
 * @returns {Promise<{valid: boolean, errors: string[], warnings: string[]}>}
 */
async function validateInstallation() {
    const errors = [];
    const warnings = [];

    try {
        // 1. Verificar archivo .installed
        const installedFile = path.join(__dirname, '../.installed');
        if (!fs.existsSync(installedFile)) {
            errors.push('Archivo .installed no existe');
        }

        // 2. Verificar .selected-db.json
        const dbConfigFile = path.join(__dirname, '../.selected-db.json');
        if (!fs.existsSync(dbConfigFile)) {
            errors.push('Archivo .selected-db.json no existe');
        } else {
            try {
                const dbConfig = JSON.parse(fs.readFileSync(dbConfigFile, 'utf-8'));
                if (!dbConfig.engine) {
                    errors.push('Configuración de BD no especifica motor (engine)');
                }
                
                if (dbConfig.engine === 'mongodb') {
                    if (!dbConfig.mongoUri) {
                        errors.push('Configuración de MongoDB sin URI');
                    }
                    if (!dbConfig.mongoDb) {
                        warnings.push('Configuración de MongoDB sin nombre de BD');
                    }
                }
            } catch (parseError) {
                errors.push('Archivo .selected-db.json corrupto: ' + parseError.message);
            }
        }

        // 3. Verificar configuración de empresa en MongoDB
        try {
            const companyConfig = await getConfig('company');
            if (!companyConfig || !companyConfig.data || !companyConfig.data.name) {
                warnings.push('Configuración de empresa incompleta o no existe');
            }
        } catch (configError) {
            warnings.push('No se pudo verificar configuración de empresa: ' + configError.message);
        }

        // 4. Verificar conexión a MongoDB (si aplica)
        try {
            const mongoDb = getMongoDb();
            if (mongoDb) {
                await mongoDb.command({ ping: 1 });
            }
        } catch (mongoError) {
            warnings.push('MongoDB no responde a ping: ' + mongoError.message);
        }

    } catch (error) {
        errors.push('Error crítico en validación: ' + error.message);
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Genera un reporte legible de la validación
 * @returns {Promise<string>}
 */
async function getInstallationReport() {
    const result = await validateInstallation();
    
    let report = '\n╔════════════════════════════════════════════════════════╗\n';
    report += '║         REPORTE DE VALIDACIÓN DE INSTALACIÓN          ║\n';
    report += '╚════════════════════════════════════════════════════════╝\n\n';

    if (result.valid) {
        report += '✅ Estado: VÁLIDO\n';
        report += '   Todos los componentes críticos están presentes.\n';
    } else {
        report += '❌ Estado: INVÁLIDO\n';
        report += '   Se encontraron errores críticos.\n';
    }

    if (result.errors.length > 0) {
        report += '\n🔴 ERRORES CRÍTICOS:\n';
        result.errors.forEach(err => {
            report += `   • ${err}\n`;
        });
    }

    if (result.warnings.length > 0) {
        report += '\n⚠️  ADVERTENCIAS:\n';
        result.warnings.forEach(warn => {
            report += `   • ${warn}\n`;
        });
    }

    if (result.valid && result.warnings.length === 0) {
        report += '\n🎉 Instalación completamente validada. Sistema listo para usar.\n';
    }

    return report;
}

module.exports = {
    validateInstallation,
    getInstallationReport
};
