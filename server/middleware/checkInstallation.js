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
        console.warn(`⚠️  Petición bloqueada: ${req.method} ${req.path} - Sistema no instalado`);
        
        // Agregar headers para evitar caching de este error
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(503).json({
            success: false,
            error: 'Sistema no instalado',
            message: 'El sistema requiere instalación. Por favor completa el wizard de instalación.',
            redirectTo: '/install',
            installUrl: 'http://localhost:3000/install'
        });
    }

    next();
}

module.exports = {
    checkInstallation,
    isInstalled
};
