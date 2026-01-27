// server/lib/interactiveMongoSetup.js
// Instalador interactivo de MongoDB con menú estilizado

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { testMongoConnection, initializeMongoDB } = require('./mongoInit');

// Iconos y colores
const icons = {
    success: chalk.green('✅'),
    error: chalk.red('❌'),
    warning: chalk.yellow('⚠️'),
    info: chalk.blue('ℹ️'),
    question: chalk.cyan('❓'),
    rocket: chalk.magenta('🚀'),
    database: chalk.blue('🗄️'),
    cloud: chalk.cyan('☁️'),
    computer: chalk.gray('💻'),
    check: chalk.green('✓'),
    arrow: chalk.cyan('→'),
    star: chalk.yellow('⭐')
};

// Estilos
const styles = {
    title: (text) => chalk.bold.cyan(text),
    subtitle: (text) => chalk.gray(text),
    success: (text) => chalk.green(text),
    error: (text) => chalk.red(text),
    warning: (text) => chalk.yellow(text),
    info: (text) => chalk.blue(text),
    highlight: (text) => chalk.bold.white(text),
    dim: (text) => chalk.dim(text)
};

/**
 * Dibuja un banner estilizado
 */
function drawBanner() {
    console.clear();
    console.log(chalk.cyan('╔════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║') + chalk.bold.white('          AdminFlow - Configuración de MongoDB              ') + chalk.cyan('║'));
    console.log(chalk.cyan('╠════════════════════════════════════════════════════════════════╣'));
    console.log(chalk.cyan('║') + chalk.gray('  Configuración inicial de la base de datos                  ') + chalk.cyan('║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════════════╝'));
    console.log('');
}

/**
 * Dibuja una sección
 */
function drawSection(title) {
    console.log('');
    console.log(chalk.cyan('─'.repeat(64)));
    console.log(chalk.bold.white(title));
    console.log(chalk.cyan('─'.repeat(64)));
    console.log('');
}

/**
 * Pregunta por el tipo de instalación
 */
async function askInstallationType() {
    drawBanner();

    console.log(icons.question + ' ' + styles.title('¿Cómo deseas configurar MongoDB?'));
    console.log('');

    const { installType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'installType',
            message: 'Selecciona una opción:',
            choices: [
                {
                    name: `${icons.computer}  MongoDB Local ${styles.dim('(Instalado en este servidor)')}`,
                    value: 'local',
                    short: 'Local'
                },
                {
                    name: `${icons.cloud}  MongoDB Remoto/Atlas ${styles.dim('(Servidor externo o cloud)')}`,
                    value: 'remote',
                    short: 'Remoto'
                },
                {
                    name: `${icons.info}  Usar configuración existente ${styles.dim('(.selected-db.json)')}`,
                    value: 'existing',
                    short: 'Existente'
                }
            ],
            pageSize: 10
        }
    ]);

    return installType;
}

/**
 * Configuración para MongoDB Local
 */
async function setupLocalMongo() {
    drawSection(`${icons.computer} Configuración de MongoDB Local`);

    console.log(styles.info('MongoDB local se conectará a:'));
    console.log(styles.dim('  • Host: localhost'));
    console.log(styles.dim('  • Puerto: 27017 (por defecto)'));
    console.log(styles.dim('  • Base de datos: adminflow'));
    console.log('');

    const { useAuth, port, dbName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'port',
            message: 'Puerto de MongoDB:',
            default: '27017',
            validate: (input) => {
                const port = parseInt(input);
                return (port > 0 && port < 65536) || 'Puerto inválido';
            }
        },
        {
            type: 'input',
            name: 'dbName',
            message: 'Nombre de la base de datos:',
            default: 'adminflow',
            validate: (input) => input.length > 0 || 'El nombre no puede estar vacío'
        },
        {
            type: 'confirm',
            name: 'useAuth',
            message: '¿Tu MongoDB local requiere autenticación?',
            default: false
        }
    ]);

    let mongoUri;

    if (useAuth) {
        const { username, password } = await inquirer.prompt([
            {
                type: 'input',
                name: 'username',
                message: 'Usuario de MongoDB:',
                validate: (input) => input.length > 0 || 'El usuario no puede estar vacío'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Contraseña:',
                mask: '*',
                validate: (input) => input.length > 0 || 'La contraseña no puede estar vacía'
            }
        ]);

        mongoUri = `mongodb://${username}:${password}@localhost:${port}/${dbName}?authSource=admin`;
    } else {
        mongoUri = `mongodb://localhost:${port}`;
    }

    return { mongoUri, mongoDb: dbName };
}

/**
 * Configuración para MongoDB Remoto/Atlas
 */
async function setupRemoteMongo() {
    drawSection(`${icons.cloud} Configuración de MongoDB Remoto/Atlas`);

    console.log(styles.info('Opciones de MongoDB remoto:'));
    console.log(styles.dim('  • MongoDB Atlas (Cloud)'));
    console.log(styles.dim('  • Servidor MongoDB remoto'));
    console.log(styles.dim('  • Cluster compartido'));
    console.log('');

    const { connectionType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'connectionType',
            message: '¿Qué tipo de conexión usarás?',
            choices: [
                {
                    name: `${icons.cloud}  MongoDB Atlas ${styles.dim('(Connection String completo)')}`,
                    value: 'atlas',
                    short: 'Atlas'
                },
                {
                    name: `${icons.database}  Servidor MongoDB remoto ${styles.dim('(Host, puerto, credenciales)')}`,
                    value: 'custom',
                    short: 'Custom'
                }
            ]
        }
    ]);

    let mongoUri, mongoDb;

    if (connectionType === 'atlas') {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'connectionString',
                message: 'Connection String de MongoDB Atlas:',
                validate: (input) => {
                    if (!input.startsWith('mongodb+srv://') && !input.startsWith('mongodb://')) {
                        return 'Debe ser un connection string válido (mongodb:// o mongodb+srv://)';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'dbName',
                message: 'Nombre de la base de datos:',
                default: 'adminflow',
                validate: (input) => input.length > 0 || 'El nombre no puede estar vacío'
            }
        ]);

        mongoUri = answers.connectionString;
        mongoDb = answers.dbName;

    } else {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'host',
                message: 'Host del servidor MongoDB:',
                validate: (input) => input.length > 0 || 'El host no puede estar vacío'
            },
            {
                type: 'input',
                name: 'port',
                message: 'Puerto:',
                default: '27017',
                validate: (input) => {
                    const port = parseInt(input);
                    return (port > 0 && port < 65536) || 'Puerto inválido';
                }
            },
            {
                type: 'input',
                name: 'dbName',
                message: 'Nombre de la base de datos:',
                default: 'adminflow',
                validate: (input) => input.length > 0 || 'El nombre no puede estar vacío'
            },
            {
                type: 'confirm',
                name: 'useAuth',
                message: '¿Requiere autenticación?',
                default: true
            }
        ]);

        if (answers.useAuth) {
            const auth = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'username',
                    message: 'Usuario:',
                    validate: (input) => input.length > 0 || 'El usuario no puede estar vacío'
                },
                {
                    type: 'password',
                    name: 'password',
                    message: 'Contraseña:',
                    mask: '*',
                    validate: (input) => input.length > 0 || 'La contraseña no puede estar vacía'
                }
            ]);

            mongoUri = `mongodb://${auth.username}:${auth.password}@${answers.host}:${answers.port}/${answers.dbName}?authSource=admin`;
        } else {
            mongoUri = `mongodb://${answers.host}:${answers.port}`;
        }

        mongoDb = answers.dbName;
    }

    return { mongoUri, mongoDb };
}

/**
 * Usa configuración existente
 */
function useExistingConfig() {
    const configPath = path.join(__dirname, '../.selected-db.json');

    if (!fs.existsSync(configPath)) {
        console.log('');
        console.log(icons.error + ' ' + styles.error('No se encontró .selected-db.json'));
        console.log('');
        return null;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    console.log('');
    console.log(icons.info + ' ' + styles.info('Configuración encontrada:'));
    console.log(styles.dim(`  • URI: ${config.mongoUri}`));
    console.log(styles.dim(`  • Base de datos: ${config.mongoDb}`));
    console.log('');

    return config;
}

/**
 * Guarda la configuración
 */
function saveConfig(mongoUri, mongoDb) {
    const configPath = path.join(__dirname, '../.selected-db.json');

    const config = {
        engine: 'mongodb',
        mongoUri,
        mongoDb,
        sqlitePath: 'database/database.sqlite'
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log('');
    console.log(icons.success + ' ' + styles.success('Configuración guardada en .selected-db.json'));
    console.log('');
}

/**
 * Prueba la conexión
 */
async function testConnection(mongoUri, mongoDb) {
    drawSection(`${icons.rocket} Probando Conexión`);

    console.log(styles.info('Conectando a MongoDB...'));
    console.log('');

    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(spinner[i])} Probando conexión...`);
        i = (i + 1) % spinner.length;
    }, 80);

    const result = await testMongoConnection(mongoUri, mongoDb);

    clearInterval(interval);
    process.stdout.write('\r');

    if (result.success) {
        console.log(icons.success + ' ' + styles.success('¡Conexión exitosa!'));
        console.log('');
        return true;
    } else {
        console.log(icons.error + ' ' + styles.error('Error de conexión'));
        console.log(styles.dim(`  Detalles: ${result.message}`));
        console.log('');

        const { retry } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'retry',
                message: '¿Deseas reintentar con otra configuración?',
                default: true
            }
        ]);

        return retry ? 'retry' : false;
    }
}

/**
 * Inicializa MongoDB
 */
async function initializeMongo(mongoUri, mongoDb) {
    drawSection(`${icons.database} Inicializando MongoDB`);

    console.log(styles.info('Creando colecciones, índices y datos iniciales...'));
    console.log('');

    const result = await initializeMongoDB(mongoUri, mongoDb);

    if (result.success) {
        console.log('');
        console.log(chalk.green('╔════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.green('║') + chalk.bold.white('              ✅ INICIALIZACIÓN EXITOSA                      ') + chalk.green('║'));
        console.log(chalk.green('╚════════════════════════════════════════════════════════════════╝'));
        console.log('');
        console.log(icons.check + ' ' + styles.success(`Colecciones creadas: ${result.collections.length}`));
        console.log(icons.check + ' ' + styles.success(`Total de colecciones: ${result.totalCollections}`));
        console.log('');
        console.log(icons.star + ' ' + styles.highlight('Credenciales por defecto:'));
        console.log(styles.dim('  • Email: admin@adminflow.uy'));
        console.log(styles.dim('  • Password: admin'));
        console.log('');
        return true;
    } else {
        console.log('');
        console.log(icons.error + ' ' + styles.error('Error en la inicialización'));
        console.log(styles.dim(`  Detalles: ${result.message}`));
        console.log('');
        return false;
    }
}

/**
 * Instalador interactivo principal
 */
async function interactiveMongoSetup() {
    let config = null;
    let connectionOk = false;

    while (!connectionOk) {
        const installType = await askInstallationType();

        if (installType === 'local') {
            config = await setupLocalMongo();
        } else if (installType === 'remote') {
            config = await setupRemoteMongo();
        } else if (installType === 'existing') {
            config = useExistingConfig();
            if (!config) {
                continue;
            }
        }

        if (!config) continue;

        // Guardar configuración
        saveConfig(config.mongoUri, config.mongoDb);

        // Probar conexión
        const testResult = await testConnection(config.mongoUri, config.mongoDb);

        if (testResult === true) {
            connectionOk = true;
        } else if (testResult === 'retry') {
            continue;
        } else {
            process.exit(1);
        }
    }

    // Preguntar si desea inicializar ahora
    const { initNow } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'initNow',
            message: '¿Deseas inicializar MongoDB ahora?',
            default: true
        }
    ]);

    if (initNow) {
        const initSuccess = await initializeMongo(config.mongoUri, config.mongoDb);

        if (initSuccess) {
            console.log(icons.rocket + ' ' + styles.success('¡MongoDB está listo para usar!'));
            console.log('');
            console.log(styles.info('Próximos pasos:'));
            console.log(styles.dim('  1. Inicia el servidor: npm run dev'));
            console.log(styles.dim('  2. Abre el navegador en http://localhost:3000'));
            console.log(styles.dim('  3. Inicia sesión con las credenciales por defecto'));
            console.log('');
        }
    } else {
        console.log('');
        console.log(icons.info + ' ' + styles.info('MongoDB se inicializará automáticamente al arrancar el servidor'));
        console.log('');
    }

    return config;
}

module.exports = {
    interactiveMongoSetup
};
