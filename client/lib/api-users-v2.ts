/**
 * Cliente API para Gestión de Usuarios V2
 */

import { apiFetch } from './http';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user';

const API_BASE = '/v2/users';

/**
 * Listar todos los usuarios
 */
export const listUsers = async (): Promise<User[]> => {
    const response = await apiFetch(API_BASE);
    if (!response.ok) {
        throw new Error('Error al listar usuarios');
    }
    return response.json();
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (userId: string): Promise<User> => {
    const response = await apiFetch(`${API_BASE}/${userId}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener usuario');
    }
    return response.json();
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (payload: CreateUserPayload): Promise<User> => {
    const response = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear usuario');
    }

    return response.json();
};

/**
 * Actualizar un usuario
 */
export const updateUser = async (userId: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await apiFetch(`${API_BASE}/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar usuario');
    }

    return response.json();
};

/**
 * Actualizar contraseña de usuario
 */
export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE}/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar contraseña');
    }
};

/**
 * Subir avatar de usuario
 */
export const uploadUserAvatar = async (userId: string, file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiFetch(`${API_BASE}/${userId}/avatar`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir avatar');
    }

    return response.json();
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (userId: string): Promise<void> => {
    const response = await apiFetch(`${API_BASE}/${userId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar usuario');
    }
};

export const UsersAPI = {
    list: listUsers,
    getById: getUserById,
    create: createUser,
    update: updateUser,
    updatePassword: updateUserPassword,
    uploadAvatar: uploadUserAvatar,
    delete: deleteUser
};
