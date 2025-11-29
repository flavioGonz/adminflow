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

module.exports = router;
