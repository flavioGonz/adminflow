const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { getMongoDb } = require('./mongoClient');
const { logEvent } = require('./auditService');

/**
 * Servicio de Gestión de Usuarios - Versión 2.0
 * Sistema completamente reescrito para usar solo ObjectIds de MongoDB
 */

const SALT_ROUNDS = 10;

const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPPORT: 'support',
    TECHNICIAN: 'technician',
    VIEWER: 'viewer'
};

const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

/**
 * Obtener la colección de usuarios
 */
const getUsersCollection = () => {
    const db = getMongoDb();
    return db ? db.collection('users') : null;
};

/**
 * Listar todos los usuarios con información de grupo
 */
const listUsers = async () => {
    const collection = getUsersCollection();
    if (!collection) return [];

    try {
        const users = await collection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        // Obtener información de grupos
        const { listGroups } = require('./groupService');
        const groups = await listGroups();
        const groupMap = groups.reduce((acc, group) => {
            acc[group._id || group.id] = group;
            return acc;
        }, {});

        return users.map(user => ({
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            name: user.name || user.email.split('@')[0],
            phone: user.phone || null,
            avatar: user.avatar || null,
            roles: user.roles || ['viewer'],
            groupId: user.groupId || null,
            groupName: user.groupId ? groupMap[user.groupId]?.name || null : null,
            status: user.status || 'active',
            metadata: user.metadata || {},
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin || null
        }));
    } catch (error) {
        console.error('Error listing users:', error);
        return [];
    }
};

/**
 * Obtener un usuario por ID
 */
const getUserById = async (userId) => {
    const collection = getUsersCollection();
    if (!collection) return null;

    try {
        const user = await collection.findOne({ _id: new ObjectId(userId) });
        if (!user) return null;

        return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone,
            avatar: user.avatar,
            roles: user.roles,
            groupId: user.groupId,
            status: user.status,
            metadata: user.metadata,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin
        };
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

/**
 * Obtener un usuario por email
 */
const getUserByEmail = async (email) => {
    const collection = getUsersCollection();
    if (!collection) return null;

    try {
        return await collection.findOne({ email: email.toLowerCase() });
    } catch (error) {
        console.error('Error getting user by email:', error);
        return null;
    }
};

/**
 * Crear un nuevo usuario
 */
const createUser = async (userData) => {
    const collection = getUsersCollection();
    if (!collection) throw new Error('Database not available');

    const { email, password, name, phone, roles, groupId, status } = userData;

    // Validaciones
    if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
    }

    if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Verificar si el email ya existe
    const existing = await getUserByEmail(email);
    if (existing) {
        throw new Error('El email ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear documento de usuario
    const now = new Date();
    const newUser = {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone: phone || null,
        avatar: null,
        roles: roles || ['viewer'],
        groupId: groupId || null,
        status: status || USER_STATUS.ACTIVE,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        lastLogin: null
    };

    const result = await collection.insertOne(newUser);

    // Log de auditoría
    await logEvent({
        user: 'system',
        action: 'create',
        resource: 'user',
        details: { userId: result.insertedId, email },
        ip: null
    }).catch(() => { });

    return {
        id: result.insertedId.toString(),
        _id: result.insertedId.toString(),
        ...newUser,
        password: undefined // No devolver la contraseña
    };
};

/**
 * Actualizar un usuario
 */
const updateUser = async (userId, updates) => {
    const collection = getUsersCollection();
    if (!collection) throw new Error('Database not available');

    try {
        const updateData = { ...updates };
        delete updateData.password; // No permitir actualizar contraseña aquí
        delete updateData._id; // No permitir actualizar _id
        delete updateData.id; // No permitir actualizar id
        delete updateData.email; // No permitir cambiar email por seguridad

        updateData.updatedAt = new Date();

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            throw new Error('Usuario no encontrado');
        }

        // Log de auditoría
        await logEvent({
            user: 'system',
            action: 'update',
            resource: 'user',
            details: { userId, updates: Object.keys(updateData) },
            ip: null
        }).catch(() => { });

        return {
            id: result.value._id.toString(),
            _id: result.value._id.toString(),
            ...result.value,
            password: undefined
        };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

/**
 * Actualizar contraseña de usuario
 */
const updateUserPassword = async (userId, newPassword) => {
    const collection = getUsersCollection();
    if (!collection) throw new Error('Database not available');

    if (!newPassword || newPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
            $set: {
                password: hashedPassword,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    );

    if (!result.value) {
        throw new Error('Usuario no encontrado');
    }

    // Log de auditoría
    await logEvent({
        user: 'system',
        action: 'update',
        resource: 'user',
        details: { userId, action: 'password_reset' },
        ip: null
    }).catch(() => { });

    return true;
};

/**
 * Actualizar avatar de usuario
 */
const updateUserAvatar = async (userId, avatarPath) => {
    const collection = getUsersCollection();
    if (!collection) throw new Error('Database not available');

    const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
            $set: {
                avatar: avatarPath,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    );

    if (!result.value) {
        throw new Error('Usuario no encontrado');
    }

    return avatarPath;
};

/**
 * Eliminar un usuario
 */
const deleteUser = async (userId) => {
    const collection = getUsersCollection();
    if (!collection) throw new Error('Database not available');

    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
        throw new Error('Usuario no encontrado');
    }

    // Log de auditoría
    await logEvent({
        user: 'system',
        action: 'delete',
        resource: 'user',
        details: { userId },
        ip: null
    }).catch(() => { });

    return true;
};

/**
 * Verificar credenciales de usuario
 */
const verifyCredentials = async (email, password) => {
    const user = await getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    // Actualizar último login
    const collection = getUsersCollection();
    if (collection) {
        await collection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );
    }

    return {
        id: user._id.toString(),
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        roles: user.roles,
        groupId: user.groupId,
        status: user.status
    };
};

module.exports = {
    listUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    updateUserPassword,
    updateUserAvatar,
    deleteUser,
    verifyCredentials,
    USER_ROLES,
    USER_STATUS
};
