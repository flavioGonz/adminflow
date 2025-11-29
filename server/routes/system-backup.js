const express = require('express');
const router = express.Router();
const { createBackup, listBackups, restoreBackup, BACKUP_ROOT } = require('../lib/backupService');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const multer = require('multer');
const tar = require('tar');

// Configure multer for temp uploads
const upload = multer({ dest: path.join(__dirname, '..', 'temp', 'uploads') });

// Ensure temp dir exists
const TEMP_DIR = path.join(__dirname, '..', 'temp', 'uploads');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Get all backups
router.get('/backups', async (req, res) => {
    try {
        const backups = await listBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new backup
router.post('/backups', async (req, res) => {
    try {
        const result = await createBackup();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Restore a backup (from existing local backup)
router.post('/backups/restore', async (req, res) => {
    const { backupName } = req.body;
    if (!backupName) {
        return res.status(400).json({ message: 'Backup name is required' });
    }

    try {
        const result = await restoreBackup(backupName);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Download a backup
router.get('/backups/:backupName/download', async (req, res) => {
    const { backupName } = req.params;
    const backupPath = path.join(BACKUP_ROOT, backupName);

    if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ message: 'Backup not found' });
    }

    res.attachment(`${backupName}.tar.gz`);

    const archive = archiver('tar', {
        gzip: true,
        zlib: { level: 9 }
    });

    archive.on('error', (err) => {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.directory(backupPath, false);
    await archive.finalize();
});

// Analyze uploaded backup
router.post('/backups/analyze', upload.single('backup'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractPath = path.join(TEMP_DIR, `extract_${req.file.filename}`);

    try {
        // Create extract dir
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        // Extract tar.gz
        await tar.x({
            file: req.file.path,
            cwd: extractPath
        });

        // Analyze contents
        // Look for .bson files to count collections and size
        const stats = {
            collections: [],
            totalSize: 0,
            backupId: req.file.filename // Use filename as ID for restore
        };

        const scanDir = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                    scanDir(filePath);
                } else if (file.endsWith('.bson')) {
                    const collectionName = path.basename(file, '.bson');
                    stats.collections.push({
                        name: collectionName,
                        size: stat.size
                    });
                    stats.totalSize += stat.size;
                }
            }
        };

        scanDir(extractPath);

        res.json(stats);

    } catch (error) {
        console.error('Error analyzing backup:', error);
        res.status(500).json({ message: 'Error analyzing backup file', error: error.message });
    }
});

// Restore from uploaded backup
router.post('/backups/restore-upload', async (req, res) => {
    const { backupId } = req.body;
    if (!backupId) {
        return res.status(400).json({ message: 'Backup ID is required' });
    }

    const extractPath = path.join(TEMP_DIR, `extract_${backupId}`);

    if (!fs.existsSync(extractPath)) {
        return res.status(404).json({ message: 'Backup session expired or not found' });
    }

    try {
        // Find the database directory inside the extracted folder
        // Usually mongodump creates a directory with the db name
        const files = fs.readdirSync(extractPath);
        let dumpDir = extractPath;

        // If there's only one directory, assume it's the dump root or db folder
        if (files.length === 1 && fs.statSync(path.join(extractPath, files[0])).isDirectory()) {
            dumpDir = path.join(extractPath, files[0]);
        }

        // Use the existing restoreBackup logic but pointing to this temp dir
        // We need to modify restoreBackup to accept a custom path or call mongorestore directly here

        const { getMongoDb } = require('../lib/mongoClient');
        const mongoDb = getMongoDb();
        const dbName = mongoDb ? mongoDb.databaseName : 'adminflow';

        // Get config for URI
        const configPath = path.resolve(__dirname, '..', '.selected-db.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const mongoUri = config.mongoUri;

        // Construct mongorestore command
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Tools path (copied from backupService.js)
        const TOOLS_DIR = path.resolve(__dirname, '..', 'mongodb-tools', 'mongodb-database-tools-windows-x86_64-100.10.0', 'bin');
        const MONGORESTORE_PATH = path.join(TOOLS_DIR, 'mongorestore.exe');
        const restoreCmd = fs.existsSync(MONGORESTORE_PATH) ? `"${MONGORESTORE_PATH}"` : 'mongorestore';

        // Command to restore
        // --drop to overwrite
        // --dir points to the dump directory
        // If the dump has db name folder, mongorestore handles it. 
        // If we want to force restore into current DB, we might need --nsInclude

        const command = `${restoreCmd} --uri="${mongoUri}" --drop --dir="${dumpDir}"`;

        console.log(`Restoring uploaded backup: ${command}`);
        await execAsync(command);

        // Cleanup
        try {
            fs.rmSync(extractPath, { recursive: true, force: true });
            const uploadFile = path.join(TEMP_DIR, backupId);
            if (fs.existsSync(uploadFile)) fs.unlinkSync(uploadFile);
        } catch (e) {
            console.warn('Cleanup warning:', e.message);
        }

        res.json({ success: true, message: 'Restauración completada exitosamente' });

    } catch (error) {
        console.error('Restore failed:', error);
        res.status(500).json({ message: 'Error al restaurar respaldo', error: error.message });
    }
});

module.exports = router;
