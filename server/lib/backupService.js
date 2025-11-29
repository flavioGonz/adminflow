const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Path to the bundled tools
const TOOLS_DIR = path.resolve(__dirname, '..', 'mongodb-tools', 'mongodb-database-tools-windows-x86_64-100.10.0', 'bin');
const MONGODUMP_PATH = path.join(TOOLS_DIR, 'mongodump.exe');
const MONGORESTORE_PATH = path.join(TOOLS_DIR, 'mongorestore.exe');

// Check if bundled tools exist, otherwise fall back to system path (assuming 'mongodump'/'mongorestore' are in PATH)
const getToolPath = (tool) => {
    const bundledPath = tool === 'mongodump' ? MONGODUMP_PATH : MONGORESTORE_PATH;
    return fs.existsSync(bundledPath) ? `"${bundledPath}"` : tool;
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

    // Create command
    // mongodump --uri="mongodb://..." --out="backup/dir"
    const dumpCmd = getToolPath('mongodump');
    const command = `${dumpCmd} --uri="${mongoUri}" --out="${backupDir}"`;

    console.log(`Starting backup: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command);
        console.log('Backup stdout:', stdout);
        if (stderr) console.warn('Backup stderr:', stderr);

        return {
            success: true,
            backupName,
            path: backupDir,
            timestamp
        };
    } catch (error) {
        console.error('Backup failed:', error);
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

    // The backup structure is usually backupDir/dbName/...
    // We want to restore specifically that database.
    // mongorestore --uri="..." --drop "backupDir/dbName"

    // Check if the db subdirectory exists
    const dbDumpDir = path.join(backupDir, mongoDb);
    const targetDir = fs.existsSync(dbDumpDir) ? dbDumpDir : backupDir;

    const restoreCmd = getToolPath('mongorestore');
    // --drop ensures we overwrite existing data
    // --nsInclude=${mongoDb}.* ensures we only restore this db's data if we point to a root dir

    // If we point directly to the dump of the DB (dbDumpDir), mongorestore usually infers the DB name from the folder name 
    // OR we can force it with --nsInclude.

    // Safest approach:
    // mongorestore --uri="URI" --drop --nsInclude="DBNAME.*" "PATH_TO_DUMP"

    const command = `${restoreCmd} --uri="${mongoUri}" --drop --nsInclude="${mongoDb}.*" "${backupDir}"`;

    console.log(`Starting restore: ${command}`);

    try {
        const { stdout, stderr } = await execAsync(command);
        console.log('Restore stdout:', stdout);
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
