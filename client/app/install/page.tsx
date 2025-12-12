'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Database,
    Bell,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
    Server,
    Cloud,
    TestTube,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

import { apiFetch } from '@/lib/http';
import DatabaseSummaryModal from '@/components/DatabaseSummaryModal';

interface CompanyData {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface DatabaseData {
    type: 'mongodb' | 'sqlite';
    mongoUri?: string;
    mongoDb?: string;
}

interface NotificationChannel {
    id: string;
    name: string;
    enabled: boolean;
    config: Record<string, string>;
}

const steps = [
    { id: 1, title: 'Información de la Empresa', icon: Building2 },
    { id: 2, title: 'Base de Datos', icon: Database },
    { id: 3, title: 'Notificaciones', icon: Bell },
    { id: 4, title: 'Finalización', icon: CheckCircle2 }
];

export default function InstallPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [alreadyInstalled, setAlreadyInstalled] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Form data
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        address: '',
        phone: '',
        email: ''
    });

    const [databaseData, setDatabaseData] = useState<DatabaseData>({
        type: 'mongodb',
        mongoUri: '',
        mongoDb: ''
    });

    const [isNewDatabase, setIsNewDatabase] = useState(true); // true = nueva, false = usar existente (SQLite)
    const [isNewMongoDatabase, setIsNewMongoDatabase] = useState(true); // true = nueva, false = usar existente (MongoDB)

    const [notifications, setNotifications] = useState<NotificationChannel[]>([
        { id: 'email', name: 'Email', enabled: false, config: { host: '', port: '587', user: '', pass: '' } },
        { id: 'telegram', name: 'Telegram', enabled: false, config: { botToken: '', chatId: '' } },
        { id: 'whatsapp', name: 'WhatsApp', enabled: false, config: { accountSid: '', authToken: '', from: '' } },
        { id: 'slack', name: 'Slack', enabled: false, config: { webhook: '' } }
    ]);

    // Check if already installed
    useEffect(() => {
        checkInstallation();
    }, []);

    const checkInstallation = async () => {
        try {
            const res = await apiFetch('/install/status');
            const response = await res.json();
            if (response.installed) {
                setAlreadyInstalled(true);
            }
        } catch (error) {
            console.error('Error checking installation:', error);
        }
    };

    const testDatabaseConnection = async () => {
        setTesting(true);
        setTestResult(null);
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: La conexión tardó demasiado (30s)')), 30000)
        );
        
        try {
            const fetchPromise = apiFetch('/install/test-db', {
                method: 'POST',
                body: JSON.stringify(databaseData),
                headers: { 'Content-Type': 'application/json' }
            });
            
            const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
            const response = await res.json();
            setTestResult(response);
            
            if (!response.success) {
                setErrorMessage(response.message || 'Error desconocido al conectar con la base de datos');
                setShowErrorModal(true);
            }
        } catch (error: any) {
            const msg = error.message || 'Error al conectar con el servidor';
            setTestResult({ success: false, message: msg });
            setErrorMessage(msg);
            setShowErrorModal(true);
        } finally {
            setTesting(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 2 && !testResult?.success && databaseData.type === 'mongodb') {
            // Force test if not done
            await testDatabaseConnection();
            if (!testResult?.success) return;
        }

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            completeInstallation();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeInstallation = async () => {
        setLoading(true);
        try {
            const payload = {
                company: companyData,
                database: {
                    ...databaseData,
                    isNew: databaseData.type === 'sqlite' ? isNewDatabase : isNewMongoDatabase
                },
                notifications: notifications.filter(n => n.enabled)
            };

            const res = await apiFetch('/install/complete', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const response = await res.json();

            if (response.success) {
                // Show success message before redirect
                console.log('✅ Instalación completada:', response.logs);
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                setErrorMessage(response.message || response.error || 'Error al completar la instalación');
                setShowErrorModal(true);
                setLoading(false);
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Error fatal en la instalación');
            setShowErrorModal(true);
            setLoading(false);
        }
    };

    if (alreadyInstalled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <CardTitle>Sistema Instalado</CardTitle>
                        <CardDescription>
                            AdminFlow ya está instalado y configurado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Ir al Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8 relative">
            {/* Error Modal */}
            <AnimatePresence>
                {showErrorModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                        onClick={() => setShowErrorModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <XCircle className="w-10 h-10 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-900">Error de Conexión</h3>
                                <p className="text-red-600 mt-2">
                                    No se pudo establecer conexión con la base de datos.
                                </p>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 text-center mb-6">
                                    {errorMessage}
                                </p>
                                <Button
                                    onClick={() => setShowErrorModal(false)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Entendido
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            AdminFlow
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Configuración Inicial del Sistema
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;

                            return (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                scale: isActive ? 1.1 : 1,
                                                backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#e5e7eb'
                                            }}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-200'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-white" />
                                            ) : (
                                                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                            )}
                                        </motion.div>
                                        <p className={`mt-2 text-xs md:text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            {step.title}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`h-1 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {(() => {
                                        const Icon = steps[currentStep - 1].icon;
                                        return <Icon className="w-6 h-6 text-blue-600" />;
                                    })()}
                                    {steps[currentStep - 1].title}
                                </CardTitle>
                                <CardDescription>
                                    Paso {currentStep} de {steps.length}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Company Info */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="companyName" className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4" />
                                                Nombre de la Empresa *
                                            </Label>
                                            <Input
                                                id="companyName"
                                                value={companyData.name}
                                                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                                                placeholder="Ej: Mi Empresa S.A."
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="address" className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Dirección
                                            </Label>
                                            <Input
                                                id="address"
                                                value={companyData.address}
                                                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                                placeholder="Ej: Av. Principal 123"
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone" className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                Teléfono
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={companyData.phone}
                                                onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                                                placeholder="Ej: +598 99 123 456"
                                                className="mt-1"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="w-4 h-4" />
                                                Email *
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={companyData.email}
                                                onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                                                placeholder="Ej: contacto@miempresa.com"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Database */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="mb-3 block">Tipo de Base de Datos</Label>
                                            <RadioGroup
                                                value={databaseData.type}
                                                onValueChange={(value: 'mongodb' | 'sqlite') => setDatabaseData({ ...databaseData, type: value })}
                                            >
                                                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                    <RadioGroupItem value="mongodb" id="mongodb" />
                                                    <Label htmlFor="mongodb" className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <Cloud className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium">MongoDB</p>
                                                            <p className="text-sm text-gray-500">Escalable, cloud-ready, recomendado para producción</p>
                                                        </div>
                                                    </Label>
                                                </div>

                                                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                    <RadioGroupItem value="sqlite" id="sqlite" />
                                                    <Label htmlFor="sqlite" className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <Server className="w-5 h-5 text-gray-600" />
                                                        <div>
                                                            <p className="font-medium">SQLite</p>
                                                            <p className="text-sm text-gray-500">Simple, local, ideal para desarrollo</p>
                                                        </div>
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        {databaseData.type === 'mongodb' && (
                                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="pt-2">
                                                    <Label className="mb-2 block">Modo de Instalación</Label>
                                                    <RadioGroup
                                                        value={isNewMongoDatabase ? 'new' : 'existing'}
                                                        onValueChange={(val) => setIsNewMongoDatabase(val === 'new')}
                                                        className="flex flex-col space-y-2 mb-4"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="new" id="mongo-new" />
                                                            <Label htmlFor="mongo-new">Crear nueva base de datos (Sobrescribir si existe)</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="existing" id="mongo-existing" />
                                                            <Label htmlFor="mongo-existing">Usar base de datos existente (Si ya tienes datos)</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                <div>
                                                    <Label htmlFor="mongoUri">MongoDB URI *</Label>
                                                    <Input
                                                        id="mongoUri"
                                                        value={databaseData.mongoUri}
                                                        onChange={(e) => setDatabaseData({ ...databaseData, mongoUri: e.target.value })}
                                                        placeholder="mongodb://localhost:27017"
                                                        className="mt-1"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Formato sin auth: <code>mongodb://localhost:27017</code><br />
                                                        Formato con auth: <code>mongodb://usuario:password@host:puerto</code>
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label htmlFor="mongoDb">Nombre de la Base de Datos *</Label>
                                                    <Input
                                                        id="mongoDb"
                                                        value={databaseData.mongoDb}
                                                        onChange={(e) => setDatabaseData({ ...databaseData, mongoDb: e.target.value })}
                                                        placeholder="adminflow"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <Button
                                                    onClick={testDatabaseConnection}
                                                    disabled={testing || !databaseData.mongoUri || !databaseData.mongoDb}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    {testing ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Probando conexión...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TestTube className="w-4 h-4 mr-2" />
                                                            Probar Conexión
                                                        </>
                                                    )}
                                                </Button>

                                                {testResult && testResult.success && (
                                                    <div className="p-3 rounded-lg flex items-center justify-between gap-2 bg-green-50 border border-green-200">
                                                        <div className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                            <p className="text-sm text-green-700">
                                                                {testResult.message}
                                                            </p>
                                                        </div>
                                                        {testResult.stats && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-green-700 hover:text-green-800 hover:bg-green-100 h-8"
                                                                onClick={() => setShowSummaryModal(true)}
                                                            >
                                                                Ver Detalles
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}

                                                <DatabaseSummaryModal
                                                    open={showSummaryModal}
                                                    onOpenChange={setShowSummaryModal}
                                                    stats={testResult?.stats}
                                                    dbName={databaseData.mongoDb || 'Desconocida'}
                                                />
                                            </div>
                                        )}

                                        {databaseData.type === 'sqlite' && (
                                            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-start gap-3">
                                                    <Database className="w-5 h-5 text-blue-600 mt-1" />
                                                    <div>
                                                        <h4 className="font-medium text-blue-900">Base de Datos SQLite Local</h4>
                                                        <p className="text-sm text-blue-700 mt-1">
                                                            Se creará un archivo <code>database.sqlite</code> en el servidor.
                                                            Ideal para instalaciones pequeñas o pruebas.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-2">
                                                    <Label className="mb-2 block">Modo de Instalación</Label>
                                                    <RadioGroup
                                                        value={isNewDatabase ? 'new' : 'existing'}
                                                        onValueChange={(val) => setIsNewDatabase(val === 'new')}
                                                        className="flex flex-col space-y-2"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="new" id="db-new" />
                                                            <Label htmlFor="db-new">Crear nueva base de datos (Sobrescribir si existe)</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="existing" id="db-existing" />
                                                            <Label htmlFor="db-existing">Usar base de datos existente (Si ya tienes datos)</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Notifications */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600 mb-4">
                                            Configura los canales de notificación (opcional). Puedes configurarlos más tarde desde el panel de administración.
                                        </p>

                                        {notifications.map((channel, index) => (
                                            <div key={channel.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            id={channel.id}
                                                            checked={channel.enabled}
                                                            onCheckedChange={(checked) => {
                                                                const newNotifications = [...notifications];
                                                                newNotifications[index].enabled = checked as boolean;
                                                                setNotifications(newNotifications);
                                                            }}
                                                        />
                                                        <Label htmlFor={channel.id} className="font-medium cursor-pointer">
                                                            {channel.name}
                                                        </Label>
                                                    </div>
                                                </div>

                                                {channel.enabled && (
                                                    <div className="space-y-3 mt-3 pl-6">
                                                        {channel.id === 'email' && (
                                                            <>
                                                                <Input
                                                                    placeholder="SMTP Host"
                                                                    value={channel.config.host}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.host = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="Puerto (587)"
                                                                    value={channel.config.port}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.port = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="Usuario"
                                                                    value={channel.config.user}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.user = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    type="password"
                                                                    placeholder="Contraseña"
                                                                    value={channel.config.pass}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.pass = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                            </>
                                                        )}

                                                        {channel.id === 'telegram' && (
                                                            <>
                                                                <Input
                                                                    placeholder="Bot Token"
                                                                    value={channel.config.botToken}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.botToken = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="Chat ID"
                                                                    value={channel.config.chatId}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.chatId = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                            </>
                                                        )}

                                                        {channel.id === 'whatsapp' && (
                                                            <>
                                                                <Input
                                                                    placeholder="Twilio Account SID"
                                                                    value={channel.config.accountSid}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.accountSid = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="Auth Token"
                                                                    value={channel.config.authToken}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.authToken = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                                <Input
                                                                    placeholder="From (whatsapp:+14155238886)"
                                                                    value={channel.config.from}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.from = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                            </>
                                                        )}

                                                        {channel.id === 'slack' && (
                                                            <>
                                                                <Input
                                                                    placeholder="Webhook URL"
                                                                    value={channel.config.webhook}
                                                                    onChange={(e) => {
                                                                        const newNotifications = [...notifications];
                                                                        newNotifications[index].config.webhook = e.target.value;
                                                                        setNotifications(newNotifications);
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Step 4: Completion */}
                                {currentStep === 4 && (
                                    <div className="text-center space-y-6">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">¡Todo listo!</h3>
                                            <p className="text-gray-600 mt-2">
                                                Hemos recopilado toda la información necesaria para configurar tu sistema.
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-6 rounded-lg text-left max-w-md mx-auto space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Empresa:</span>
                                                <span className="font-medium">{companyData.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base de Datos:</span>
                                                <span className="font-medium uppercase">{databaseData.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Notificaciones:</span>
                                                <span className="font-medium">
                                                    {notifications.filter(n => n.enabled).length} canales activos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={currentStep === 1 || loading}
                                        className={currentStep === 1 ? 'invisible' : ''}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Anterior
                                    </Button>

                                    <Button
                                        onClick={handleNext}
                                        disabled={loading || (currentStep === 1 && !companyData.name)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Instalando...
                                            </>
                                        ) : currentStep === steps.length ? (
                                            <>
                                                Finalizar Instalación
                                                <CheckCircle2 className="w-4 h-4 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Siguiente
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
