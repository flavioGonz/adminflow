/**
 * Esquema de Usuario para MongoDB
 * 
 * Colección: users
 * 
 * Estructura:
 * {
 *   _id: ObjectId,                    // ID único de MongoDB
 *   email: String (único, requerido), // Email del usuario
 *   password: String (hash),          // Contraseña hasheada con bcrypt
 *   name: String,                     // Nombre completo del usuario
 *   phone: String,                    // Teléfono de contacto
 *   avatar: String,                   // URL del avatar
 *   roles: Array<String>,             // Roles del usuario ['admin', 'manager', 'support', etc.]
 *   groupId: ObjectId,                // Referencia al grupo (colección groups)
 *   metadata: Object,                 // Información adicional flexible
 *   status: String,                   // Estado: 'active', 'inactive', 'suspended'
 *   createdAt: Date,                  // Fecha de creación
 *   updatedAt: Date,                  // Fecha de última actualización
 *   lastLogin: Date                   // Última vez que inició sesión
 * }
 * 
 * Índices:
 * - email: unique
 * - groupId: 1
 * - status: 1
 * - createdAt: -1
 */

const USER_ROLES = {
    ADMIN: 'admin',           // Acceso total al sistema
    MANAGER: 'manager',       // Gestión de equipos y reportes
    SUPPORT: 'support',       // Atención de tickets y clientes
    TECHNICIAN: 'technician', // Técnico de campo
    VIEWER: 'viewer'          // Solo lectura
};

const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

const ROLE_PERMISSIONS = {
    admin: {
        label: 'Administrador',
        description: 'Acceso completo al sistema',
        permissions: ['*']
    },
    manager: {
        label: 'Gerente',
        description: 'Gestión de equipos y reportes',
        permissions: ['users.view', 'tickets.*', 'clients.*', 'reports.*']
    },
    support: {
        label: 'Soporte',
        description: 'Atención de tickets y clientes',
        permissions: ['tickets.*', 'clients.view', 'clients.edit']
    },
    technician: {
        label: 'Técnico',
        description: 'Técnico de campo',
        permissions: ['tickets.view', 'tickets.edit', 'clients.view']
    },
    viewer: {
        label: 'Visualizador',
        description: 'Solo lectura',
        permissions: ['*.view']
    }
};

module.exports = {
    USER_ROLES,
    USER_STATUS,
    ROLE_PERMISSIONS
};
