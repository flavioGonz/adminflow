const express = require('express');
const router = express.Router();
const { createBackup, listBackups, restoreBackup } = require('../lib/backupService');

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

// Restore a backup
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
    const { BACKUP_ROOT } = require('../lib/backupService');
    const path = require('path');
    const fs = require('fs');
    const archiver = require('archiver');

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

module.exports = router;
