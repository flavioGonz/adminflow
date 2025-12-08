const express = require('express');
const router = express.Router();
const userServiceV2 = require('../lib/userServiceV2');
const multer = require('multer');
const path = require('path');

// Configuración de multer para avatares
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const userId = req.params.id;
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
    }
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// ============================================
// ENDPOINTS DE USUARIOS V2
// ============================================

/**
 * GET / (Mapeado a /api/v2/users)
 * Listar todos los usuarios
 */
router.get('/', async (req, res) => {
    try {
        const users = await userServiceV2.listUsers();
        res.json(users);
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).json({
            message: 'Error al listar usuarios',
            detail: error.message
        });
    }
});

/**
 * GET /:id
 * Obtener un usuario por ID
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await userServiceV2.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            message: 'Error al obtener usuario',
            detail: error.message
        });
    }
});

/**
 * POST /
 * Crear un nuevo usuario
 */
router.post('/', async (req, res) => {
    try {
        const { email, password, name, phone, roles, groupId, status } = req.body;

        const newUser = await userServiceV2.createUser({
            email,
            password,
            name,
            phone,
            roles,
            groupId,
            status
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({
            message: error.message || 'Error al crear usuario'
        });
    }
});

/**
 * PATCH /:id
 * Actualizar un usuario
 */
router.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const updatedUser = await userServiceV2.updateUser(req.params.id, updates);
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({
            message: error.message || 'Error al actualizar usuario'
        });
    }
});

/**
 * PATCH /:id/password
 * Actualizar contraseña de usuario
 */
router.patch('/:id/password', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ message: 'Nueva contraseña es requerida' });
        }

        await userServiceV2.updateUserPassword(req.params.id, newPassword);
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(400).json({
            message: error.message || 'Error al actualizar contraseña'
        });
    }
});

/**
 * POST /:id/avatar
 * Subir avatar de usuario
 */
router.post('/:id/avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
        }

        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        await userServiceV2.updateUserAvatar(req.params.id, avatarPath);

        res.json({
            avatarUrl: avatarPath,
            message: 'Avatar actualizado correctamente'
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(400).json({
            message: error.message || 'Error al subir avatar'
        });
    }
});

/**
 * DELETE /:id
 * Eliminar un usuario
 */
router.delete('/:id', async (req, res) => {
    try {
        await userServiceV2.deleteUser(req.params.id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(400).json({
            message: error.message || 'Error al eliminar usuario'
        });
    }
});

module.exports = router;
