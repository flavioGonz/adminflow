const { exec, execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Detect OS and set appropriate paths
const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';
const isMac = os.platform() === 'darwin';

let MONGODUMP_PATH, MONGORESTORE_PATH;

if (isWindows) {
    const TOOLS_DIR = path.resolve(__dirname, '..', 'mongodb-tools', 'mongodb-database-tools-windows-x86_64-100.10.0', 'bin');
    MONGODUMP_PATH = path.join(TOOLS_DIR, 'mongodump.exe');
    MONGORESTORE_PATH = path.join(TOOLS_DIR, 'mongorestore.exe');
} else if (isLinux) {
    const TOOLS_DIR = path.resolve(__dirname, '..', 'mongodb-tools', 'mongodb-database-tools-linux-x86_64-100.10.0', 'bin');
    MONGODUMP_PATH = path.join(TOOLS_DIR, 'mongodump');
    MONGORESTORE_PATH = path.join(TOOLS_DIR, 'mongorestore');
} else if (isMac) {
    const TOOLS_DIR = path.resolve(__dirname, '..', 'mongodb-tools', 'mongodb-database-tools-macos-x86_64-100.10.0', 'bin');
    MONGODUMP_PATH = path.join(TOOLS_DIR, 'mongodump');
    MONGORESTORE_PATH = path.join(TOOLS_DIR, 'mongorestore');
}

// Check if bundled tools exist, otherwise fall back to system path
const getToolPath = (tool) => {
    const bundledPath = tool === 'mongodump' ? MONGODUMP_PATH : MONGORESTORE_PATH;
    if (fs.existsSync(bundledPath)) {
        // Make executable on Linux/Mac
        if (!isWindows) {
            try {
                fs.chmodSync(bundledPath, 0o755);
            } catch (err) {
                console.warn(`Could not set execute permissions on ${bundledPath}:`, err.message);
            }
        }
        return bundledPath;
    }
    // Fall back to system mongodump/mongorestore
    return tool;
};

const getToolExecutable = (tool) => {
    return getToolPath(tool);
};

const BACKUP_ROOT = path.resolve(__dirname, '..', 'backup');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
}

const getConfig = () => {
    const configPath = path.resolve(__dirname, '..', '.selected-db.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('No se encontró configuración de base de datos (.selected-db.json)');
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
};

const createBackup = async () => {
    const { mongoUri, mongoDb } = getConfig();
    if (!mongoUri || !mongoDb) {
        throw new Error('Configuración de MongoDB incompleta');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${mongoDb}_${timestamp}`;
    const backupDir = path.join(BACKUP_ROOT, backupName);

    // Create backup directory
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    // Get the appropriate tool path
    const dumpExe = getToolExecutable('mongodump');
    
    const args = [
        `--uri=${mongoUri}`,
        `--db=${mongoDb}`,
        `--out=${backupDir}`
    ];

    console.log(`Starting backup with: ${dumpExe}`);
    console.log(`Args: ${args.join(' ')}`);

    try {
        // Use execFile with shell: true for better compatibility across platforms
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            const child = execFile(dumpExe, args, { shell: true, maxBuffer: 10 * 1024 * 1024 }, 
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ stdout, stderr });
                    }
                }
            );
        });

        console.log('Backup completed successfully');
        if (stdout) console.log('Backup stdout:', stdout);
        if (stderr) console.warn('Backup stderr:', stderr);

        return {
            success: true,
            backupName,
            path: backupDir,
            timestamp
        };
    } catch (error) {
        console.error('Backup failed:', error);
        // Try to clean up the backup directory if it was created
        try {
            if (fs.existsSync(backupDir)) {
                fs.rmSync(backupDir, { recursive: true });
            }
        } catch (cleanupErr) {
            console.warn('Could not clean up backup directory:', cleanupErr.message);
        }
        throw new Error(`Error al crear respaldo: ${error.message}`);
    }
};

const listBackups = async () => {
    try {
        const files = await readdir(BACKUP_ROOT);
        const backups = [];

        for (const file of files) {
            const filePath = path.join(BACKUP_ROOT, file);
            const stats = await stat(filePath);
            if (stats.isDirectory()) {
                backups.push({
                    name: file,
                    createdAt: stats.birthtime,
                    size: 0 // Calculating directory size is complex, skipping for now
                });
            }
        }

        // Sort by date desc
        return backups.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error in listBackups:', error);
        throw new Error(`Error al listar respaldos: ${error.message}`);
    }
};

const restoreBackup = async (backupName) => {
    const { mongoUri, mongoDb } = getConfig();
    if (!mongoUri || !mongoDb) {
        throw new Error('Configuración de MongoDB incompleta');
    }

    const backupDir = path.join(BACKUP_ROOT, backupName);
    if (!fs.existsSync(backupDir)) {
        throw new Error(`El respaldo ${backupName} no existe`);
    }

    const restoreExe = getToolExecutable('mongorestore');

    const args = [
        `--uri=${mongoUri}`,
        '--drop',
        `--nsInclude=${mongoDb}.*`,
        backupDir
    ];

    console.log(`Starting restore with: ${restoreExe}`);
    console.log(`Args: ${args.join(' ')}`);

    try {
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            const child = execFile(restoreExe, args, { shell: true, maxBuffer: 10 * 1024 * 1024 },
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({ stdout, stderr });
                    }
                }
            );
        });

        console.log('Restore completed successfully');
        if (stdout) console.log('Restore stdout:', stdout);
        if (stderr) console.warn('Restore stderr:', stderr);

        return {
            success: true,
            message: 'Restauración completada'
        };
    } catch (error) {
        console.error('Restore failed:', error);
        throw new Error(`Error al restaurar respaldo: ${error.message}`);
    }
};

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    BACKUP_ROOT
};
