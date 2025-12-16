const express = require('express');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { getCurrentDbEngine } = require('../lib/dbChoice');
const { getMongoDb } = require('../lib/mongoClient');

const router = express.Router();

const LOG_FILES = [
    path.resolve(__dirname, '..', 'error.log'),
    path.resolve(__dirname, '..', 'logs', 'app.log'),
];

const safeReadJson = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`status: unable to read ${filePath}:`, error.message);
        return null;
    }
};

const readRecentLogs = (limit = 120) => {
    const normalizedLimit = Math.min(Math.max(Number(limit) || 0, 10), 500);
    const lines = [];

    for (const file of LOG_FILES) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');
        const fileLines = content.split(/\r?\n/).filter(Boolean);
        const tail = fileLines.slice(-normalizedLimit).map((line) => `${path.basename(file)} | ${line}`);
        lines.push(...tail);
    }

    return lines.slice(-normalizedLimit);
};

router.get('/overview', (req, res) => {
    const backendPackage = safeReadJson(path.resolve(__dirname, '..', 'package.json'));
    const frontendPackage = safeReadJson(path.resolve(__dirname, '..', '..', 'client', 'package.json'));

    const dbEngine = getCurrentDbEngine();
    const mongoDb = dbEngine === 'mongodb' ? getMongoDb() : null;

    const cpuInfo = os.cpus?.() || [];
    const loadAvg = os.loadavg?.() || [0, 0, 0];
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.setHeader('Cache-Control', 'no-store');
    res.json({
        node: {
            version: process.version,
            uptimeSeconds: process.uptime(),
            env: process.env.NODE_ENV || 'development',
            memory: {
                rss: memory.rss,
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                external: memory.external,
            },
            cpuUsage,
        },
        system: {
            platform: os.platform(),
            release: os.release(),
            arch: os.arch(),
            load: loadAvg,
            cpuCount: cpuInfo.length,
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            uptimeSeconds: os.uptime ? os.uptime() : null,
        },
        backend: {
            name: backendPackage?.name || 'adminflow-server',
            version: backendPackage?.version || null,
        },
        frontend: {
            name: frontendPackage?.name || 'adminflow-client',
            version: frontendPackage?.version || null,
            react: frontendPackage?.dependencies?.react || frontendPackage?.devDependencies?.react || null,
            next: frontendPackage?.dependencies?.next || frontendPackage?.devDependencies?.next || null,
        },
        database: {
            engine: dbEngine,
            connected: Boolean(mongoDb),
            name: mongoDb?.databaseName || null,
        },
        logs: readRecentLogs(80),
        timestamp: new Date().toISOString(),
    });
});

router.get('/logs', (req, res) => {
    const limit = Number(req.query.limit) || 120;
    res.setHeader('Cache-Control', 'no-store');
    res.json({ lines: readRecentLogs(limit), timestamp: new Date().toISOString() });
});

module.exports = router;
