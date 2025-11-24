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
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { apiFetch } from '@/lib/http';

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
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [alreadyInstalled, setAlreadyInstalled] = useState(false);

    // Form data
    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        address: '',
        phone: '',
        email: ''
    });

    const [databaseData, setDatabaseData] = useState<DatabaseData>({
        type: 'mongodb',
        mongoUri: 'mongodb://localhost:27017',
        mongoDb: 'adminflow'
    });

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
            const response = await apiFetch('/api/install/status');
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

        try {
            const response = await apiFetch('/api/install/test-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(databaseData)
            });

            setTestResult({
                success: response.success,
                message: response.message
            });
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.message || 'Error al probar la conexión'
            });
        } finally {
            setTesting(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFinish = async () => {
        setLoading(true);

        try {
            const installData = {
                company: companyData,
                database: databaseData,
                notifications: notifications.filter(n => n.enabled)
            };

            await apiFetch('/api/install/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(installData)
            });

            // Redirect to login
            router.push('/');
        } catch (error: any) {
            alert('Error en la instalación: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return companyData.name && companyData.email;
            case 2:
                return databaseData.type === 'sqlite' || (databaseData.mongoUri && databaseData.mongoDb);
            case 3:
                return true; // Notifications are optional
            default:
                return true;
        }
    };

    if (alreadyInstalled) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Ya está instalado</CardTitle>
                        <CardDescription>
                            AdminFlow ya ha sido configurado en este sistema
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
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
                                                <div>
                                                    <Label htmlFor="mongoUri">MongoDB URI *</Label>
                                                    <Input
                                                        id="mongoUri"
                                                        value={databaseData.mongoUri}
                                                        onChange={(e) => setDatabaseData({ ...databaseData, mongoUri: e.target.value })}
                                                        placeholder="mongodb://localhost:27017"
                                                        className="mt-1"
                                                    />
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

                                                {testResult && (
                                                    <div className={`p-3 rounded-lg flex items-start gap-2 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                                        }`}>
                                                        {testResult.success ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                                            {testResult.message}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {databaseData.type === 'sqlite' && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-600">
                                                    SQLite se configurará automáticamente. No requiere configuración adicional.
                                                </p>
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
                                                            <Input
                                                                placeholder="Webhook URL"
                                                                value={channel.config.webhook}
                                                                onChange={(e) => {
                                                                    const newNotifications = [...notifications];
                                                                    newNotifications[index].config.webhook = e.target.value;
                                                                    setNotifications(newNotifications);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Step 4: Finish */}
                                {currentStep === 4 && (
                                    <div className="text-center space-y-6 py-8">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                            className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center"
                                        >
                                            <Sparkles className="w-12 h-12 text-white" />
                                        </motion.div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                ¡Todo Listo!
                                            </h3>
                                            <p className="text-gray-600">
                                                AdminFlow está configurado y listo para usar
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                                            <h4 className="font-semibold text-blue-900 mb-3">Resumen de Configuración:</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                    <span className="text-gray-700">
                                                        <strong>Empresa:</strong> {companyData.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-blue-600" />
                                                    <span className="text-gray-700">
                                                        <strong>Base de Datos:</strong> {databaseData.type === 'mongodb' ? 'MongoDB' : 'SQLite'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Bell className="w-4 h-4 text-blue-600" />
                                                    <span className="text-gray-700">
                                                        <strong>Notificaciones:</strong> {notifications.filter(n => n.enabled).length} canal(es) configurado(s)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Credenciales por defecto:</strong><br />
                                                Email: admin@adminflow.uy<br />
                                                Contraseña: admin<br />
                                                <span className="text-xs">(Cámbialas después del primer login)</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                    <Button
                        onClick={handleBack}
                        disabled={currentStep === 1 || loading}
                        variant="outline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Anterior
                    </Button>

                    {currentStep < steps.length ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid() || loading}
                        >
                            Siguiente
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleFinish}
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Instalando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Finalizar Instalación
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
