/**
 * Tipos TypeScript para el Sistema de Usuarios V2
 */

export interface User {
    id: string;
    _id?: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    roles: UserRole[];
    groupId: string | null;
    groupName: string | null;
    status: UserStatus;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    lastLogin: string | null;
}

export type UserRole = 'admin' | 'manager' | 'support' | 'technician' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface CreateUserPayload {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    roles?: UserRole[];
    groupId?: string | null;
    status?: UserStatus;
}

export interface UpdateUserPayload {
    name?: string;
    phone?: string;
    roles?: UserRole[];
    groupId?: string | null;
    status?: UserStatus;
    metadata?: Record<string, any>;
}

export interface RoleDefinition {
    value: UserRole;
    label: string;
    description: string;
    color: string;
    icon: string;
    permissions: string[];
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
    admin: {
        value: 'admin',
        label: 'Administrador',
        description: 'Acceso completo al sistema',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: 'Shield',
        permissions: ['*']
    },
    manager: {
        value: 'manager',
        label: 'Gerente',
        description: 'Gestión de equipos y reportes',
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: 'Briefcase',
        permissions: ['users.view', 'tickets.*', 'clients.*', 'reports.*']
    },
    support: {
        value: 'support',
        label: 'Soporte',
        description: 'Atención de tickets y clientes',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: 'Headphones',
        permissions: ['tickets.*', 'clients.view', 'clients.edit']
    },
    technician: {
        value: 'technician',
        label: 'Técnico',
        description: 'Técnico de campo',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: 'Wrench',
        permissions: ['tickets.view', 'tickets.edit', 'clients.view']
    },
    viewer: {
        value: 'viewer',
        label: 'Visualizador',
        description: 'Solo lectura',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: 'Eye',
        permissions: ['*.view']
    }
};

export const STATUS_DEFINITIONS: Record<UserStatus, { label: string; color: string; icon: string }> = {
    active: {
        label: 'Activo',
        color: 'bg-green-100 text-green-700',
        icon: 'CheckCircle'
    },
    inactive: {
        label: 'Inactivo',
        color: 'bg-gray-100 text-gray-700',
        icon: 'Circle'
    },
    suspended: {
        label: 'Suspendido',
        color: 'bg-red-100 text-red-700',
        icon: 'XCircle'
    }
};
