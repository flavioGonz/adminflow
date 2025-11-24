// server/middleware/checkInstallation.js
// Middleware para verificar si el sistema está instalado

const fs = require('fs');
const path = require('path');

const INSTALL_LOCK_FILE = path.join(__dirname, '../.installed');

function isInstalled() {
    return fs.existsSync(INSTALL_LOCK_FILE);
}

/**
 * Middleware que redirige a /install si el sistema no está instalado
 * Excepto para las rutas de instalación y assets
 */
function checkInstallation(req, res, next) {
    // Permitir rutas de instalación
    if (req.path.startsWith('/api/install')) {
        return next();
    }

    // Permitir assets y archivos estáticos
    if (req.path.startsWith('/uploads') || req.path.startsWith('/_next')) {
        return next();
    }

    // Si no está instalado, retornar error 503
    if (!isInstalled()) {
        return res.status(503).json({
            error: 'Sistema no instalado',
            message: 'Por favor completa la instalación en /install',
            redirectTo: '/install'
        });
    }

    next();
}

module.exports = {
    checkInstallation,
    isInstalled
};
