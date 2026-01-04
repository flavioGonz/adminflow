const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: Allow access to params from parent router
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Base storage directory
const STORAGE_ROOT = path.resolve(__dirname, '../storage/clients');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

// Multer setup for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Priority: Route param > Query > Body
        const clientId = req.params.clientId || req.query.clientId || req.body.clientId;
        // Svar sends 'id' for folder target in POST/body, or query. Default to root.
        const folderId = req.query.id || req.body.id;

        if (!clientId) {
            return cb(new Error('Client ID required'));
        }

        // Clean folder path
        const safeFolder = folderId && folderId !== '/' ? path.normalize(folderId).replace(/^(\.\.[\/\\])+/, '') : '';
        const targetPath = path.join(STORAGE_ROOT, clientId, safeFolder);

        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        cb(null, targetPath);
    },
    filename: (req, file, cb) => {
        // Keeping original name for simplicity
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Helper to secure path
const getSecurePath = (clientId, relativePath) => {
    if (!clientId) throw new Error('Client ID required');
    const safeClientId = path.basename(clientId);
    const safePath = relativePath && relativePath !== '/' ? path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '') : '';
    return path.join(STORAGE_ROOT, safeClientId, safePath);
};

// Middleware to extract clientId
const ensureClient = (req, res, next) => {
    const clientId = req.params.clientId || req.query.clientId || req.body.clientId;
    if (!clientId) {
        return res.status(400).json({ error: 'Client ID required' });
    }
    req.clientId = clientId;
    next();
};

// GET /items - List files
router.get('/items', ensureClient, (req, res) => {
    try {
        const { clientId } = req;
        const { id } = req.query; // id is relative path of folder to list

        const targetDir = getSecurePath(clientId, id);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const files = fs.readdirSync(targetDir).map(file => {
            const fullPath = path.join(targetDir, file);
            let stats;
            try {
                stats = fs.statSync(fullPath);
            } catch (e) {
                return null;
            }
            if (!stats) return null;

            // Calculate relative path for ID to support navigation
            const secureRoot = getSecurePath(clientId, '/');
            // Ensure ID uses forward slashes
            const relPath = path.relative(secureRoot, fullPath).split(path.sep).join('/');

            return {
                id: relPath,
                value: file,
                size: stats.size,
                date: Math.floor(stats.mtimeMs / 1000),
                type: stats.isDirectory() ? "folder" : "file",
                data: stats.isDirectory() ? [] : undefined
            };
        }).filter(Boolean);

        res.json(files);
    } catch (error) {
        console.error('List items error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /folder - Create folder
router.post('/folder', ensureClient, (req, res) => {
    try {
        const { clientId } = req;
        const { id, value } = req.body; // id is parent path, value is new folder name

        if (!value) return res.status(400).json({ error: 'Folder name (value) required' });

        const parentDir = getSecurePath(clientId, id);
        const targetDir = path.join(parentDir, value);

        if (fs.existsSync(targetDir)) {
            return res.json({ status: 'success' }); // Idempotent success
        }

        fs.mkdirSync(targetDir, { recursive: true });
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /upload
// multer middleware runs before ensureClient so it needs to extract clientId itself. 
// But ensureClient populates req.clientId for the handler.
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ status: 'success' });
});

// POST /rename
router.post('/rename', ensureClient, (req, res) => {
    try {
        const { clientId } = req;
        const { id, value } = req.body; // id is current path, value is new name (not full path)

        if (!id || !value) return res.status(400).json({ error: 'Missing params' });

        const oldPath = getSecurePath(clientId, id);
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, value);

        if (fs.existsSync(newPath)) {
            return res.status(409).json({ error: 'Name already exists' });
        }

        fs.renameSync(oldPath, newPath);
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /delete
router.post('/delete', ensureClient, (req, res) => {
    try {
        const { clientId } = req;
        const { id } = req.body;

        if (!id) return res.status(400).json({ error: 'Missing params' });

        const targetPath = getSecurePath(clientId, id);

        if (!fs.existsSync(targetPath)) return res.json({ status: 'success' });

        if (fs.lstatSync(targetPath).isDirectory()) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(targetPath);
        }

        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /download
router.get('/download', ensureClient, (req, res) => {
    try {
        const { clientId } = req;
        const { id } = req.query;

        if (!id) return res.status(400).json({ error: 'Missing file id' });

        const targetPath = getSecurePath(clientId, id);
        if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Not found' });

        res.download(targetPath);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
