const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');

// Middleware para validar ObjectId
const validateObjectId = (req, res, next) => {
    if (!ObjectId.isValid(req.params.id) && !ObjectId.isValid(req.params.accessId)) {
        return res.status(400).json({ message: 'ID inválido' });
    }
    next();
};

// GET /api/clients/:id/access - Obtener accesos de un cliente
router.get('/clients/:id/access', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

        const accesses = await db.collection('client_accesses')
            .find({ clientId: req.params.id })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(accesses);
    } catch (error) {
        console.error('Error getting accesses:', error);
        res.status(500).json({ message: 'Error al obtener accesos' });
    }
});

// POST /api/clients/:id/access - Crear nuevo acceso
router.post('/clients/:id/access', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

        const { equipo, tipo_equipo, ip, user, pass, comentarios } = req.body;

        if (!equipo || !tipo_equipo) {
            return res.status(400).json({ message: 'Equipo y tipo son requeridos' });
        }

        const newAccess = {
            clientId: req.params.id,
            equipo,
            tipo_equipo,
            ip: ip || '',
            user: user || '',
            pass: pass || '', // Se guarda en texto plano por requerimiento
            comentarios: comentarios || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('client_accesses').insertOne(newAccess);

        // Audit log
        await logEvent('access', 'create', 'client_accesses', {
            accessId: result.insertedId,
            clientId: req.params.id,
            equipo
        }, req);

        res.status(201).json({ ...newAccess, _id: result.insertedId });
    } catch (error) {
        console.error('Error creating access:', error);
        res.status(500).json({ message: 'Error al crear acceso' });
    }
});

// PUT /api/access/:accessId - Actualizar acceso
router.put('/access/:accessId', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

        const { equipo, tipo_equipo, ip, user, pass, comentarios } = req.body;
        const accessId = new ObjectId(req.params.accessId);

        const updates = {
            updatedAt: new Date()
        };

        if (equipo) updates.equipo = equipo;
        if (tipo_equipo) updates.tipo_equipo = tipo_equipo;
        if (ip !== undefined) updates.ip = ip;
        if (user !== undefined) updates.user = user;
        if (pass !== undefined) updates.pass = pass;
        if (comentarios !== undefined) updates.comentarios = comentarios;

        const result = await db.collection('client_accesses').findOneAndUpdate(
            { _id: accessId },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Acceso no encontrado' });
        }

        // Audit log
        await logEvent('access', 'update', 'client_accesses', {
            accessId: req.params.accessId,
            updates: Object.keys(updates)
        }, req);

        res.json(result);
    } catch (error) {
        console.error('Error updating access:', error);
        res.status(500).json({ message: 'Error al actualizar acceso' });
    }
});

// DELETE /api/access/:accessId - Eliminar acceso
router.delete('/access/:accessId', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Base de datos no disponible' });

        const accessId = new ObjectId(req.params.accessId);

        // Obtener documento antes de borrar para el log
        const access = await db.collection('client_accesses').findOne({ _id: accessId });

        const result = await db.collection('client_accesses').deleteOne({ _id: accessId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Acceso no encontrado' });
        }

        // Audit log
        if (access) {
            await logEvent('access', 'delete', 'client_accesses', {
                accessId: req.params.accessId,
                clientId: access.clientId,
                equipo: access.equipo
            }, req);
        }

        res.json({ message: 'Acceso eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting access:', error);
        res.status(500).json({ message: 'Error al eliminar acceso' });
    }
});

module.exports = router;
