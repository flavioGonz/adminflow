const express = require('express');
const router = express.Router();
const { getMongoDb } = require('../lib/mongoClient');
const { logEvent } = require('../lib/auditService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const implementationUploadsRoot = path.resolve(__dirname, '..', 'uploads', 'implementation');
if (!fs.existsSync(implementationUploadsRoot)) {
    fs.mkdirSync(implementationUploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
    destination: implementationUploadsRoot,
    filename: (req, file, cb) => {
        const clientId = req.params.id || 'client';
        cb(null, `impl-${clientId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

// GET /api/clients/:id/implementation - Get implementation data (patch panel) for a client
router.get('/clients/:id/implementation', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) {
            return res.status(503).json({ message: 'Database not available' });
        }

        const implementation = await db.collection('client_implementations')
            .findOne({ clientId: req.params.id });

        if (!implementation) {
            return res.json(null); // No implementation data yet
        }

        res.json(implementation);
    } catch (error) {
        console.error('Error getting implementation data:', error);
        res.status(500).json({ message: 'Error fetching implementation data' });
    }
});

// GET /api/clients/implementation-indicators - List clients with saved implementation
router.get('/clients/implementation-indicators', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) {
            return res.status(503).json({ message: 'Database not available' });
        }

        const implementations = await db
            .collection('client_implementations')
            .find({}, { projection: { clientId: 1 } })
            .toArray();

        const clientIds = implementations
            .map((item) => item?.clientId)
            .filter((id) => id !== undefined && id !== null);

        res.json(clientIds);
    } catch (error) {
        console.error('Error fetching implementation indicators:', error);
        res.status(500).json({ message: 'Error fetching implementation indicators' });
    }
});

// POST /api/clients/:id/implementation - Save implementation data
router.post('/clients/:id/implementation', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const { appData, currentPanelName, currentFilter } = req.body;
        const clientId = req.params.id;

        const update = {
            clientId,
            appData,
            currentPanelName,
            currentFilter,
            updatedAt: new Date()
        };

        const result = await db.collection('client_implementations').updateOne(
            { clientId },
            {
                $set: update,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        // Audit log
        await logEvent('implementation', 'update', 'client_implementations', {
            clientId,
            action: result.upsertedCount ? 'created' : 'updated'
        }, req);

        res.json({ message: 'Implementation data saved successfully' });
    } catch (error) {
        console.error('Error saving implementation data:', error);
        res.status(500).json({ message: 'Error saving implementation data' });
    }
});

// GET /api/clients/:id/implementation/gallery - Get gallery images
router.get('/clients/:id/implementation/gallery', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const clientId = req.params.id;
        const images = await db.collection('client_implementation_gallery')
            .find({ clientId })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(images.map(img => ({
            ...img,
            id: img._id,
            url: `/uploads/implementation/${img.filename}`
        })));
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ message: 'Error fetching gallery' });
    }
});

// POST /api/clients/:id/implementation/gallery - Upload image
router.post('/clients/:id/implementation/gallery', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const clientId = req.params.id;
        const newImage = {
            clientId,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            createdAt: new Date(),
        };

        const result = await db.collection('client_implementation_gallery').insertOne(newImage);

        await logEvent('implementation', 'upload_image', 'client_implementation_gallery', {
            clientId,
            imageId: result.insertedId
        }, req);

        res.status(201).json({
            ...newImage,
            id: result.insertedId,
            url: `/uploads/implementation/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
});

// DELETE /api/clients/:id/implementation/gallery/:imageId - Delete image
router.delete('/clients/:id/implementation/gallery/:imageId', async (req, res) => {
    try {
        const db = getMongoDb();
        if (!db) return res.status(503).json({ message: 'Database not available' });

        const { id, imageId } = req.params;
        const { ObjectId } = require('mongodb');

        const image = await db.collection('client_implementation_gallery').findOne({
            _id: new ObjectId(imageId),
            clientId: id
        });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete file
        const filePath = path.join(implementationUploadsRoot, image.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from DB
        await db.collection('client_implementation_gallery').deleteOne({ _id: new ObjectId(imageId) });

        await logEvent('implementation', 'delete_image', 'client_implementation_gallery', {
            clientId: id,
            imageId
        }, req);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Error deleting image' });
    }
});

module.exports = router;
