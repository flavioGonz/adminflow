import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, RotateCcw, AlertTriangle, Database } from "lucide-react";
import { toast } from "sonner";
import * as SystemApi from "@/lib/api-system";

export function BackupManager() {
    const [backups, setBackups] = useState<SystemApi.Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        try {
            setLoading(true);
            const data = await SystemApi.getBackups();
            setBackups(data);
        } catch (error) {
            console.error("Error loading backups:", error);
            toast.error("Error al cargar los respaldos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setCreatingBackup(true);
            const result = await SystemApi.createBackup();
            if (result.success) {
                toast.success("Respaldo creado exitosamente");
                loadBackups();
            }
        } catch (error: any) {
            console.error("Error creating backup:", error);
            toast.error(error.message || "Error al crear respaldo");
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleRestore = async () => {
        if (!confirmRestore) return;

        try {
            setRestoringBackup(confirmRestore);
            const result = await SystemApi.restoreBackup(confirmRestore);
            if (result.success) {
                toast.success("Base de datos restaurada exitosamente");
                setConfirmRestore(null);
            }
        } catch (error: any) {
            console.error("Error restoring backup:", error);
            toast.error(error.message || "Error al restaurar respaldo");
        } finally {
            setRestoringBackup(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Respaldo y Restauración</h2>
                    <p className="text-muted-foreground">
                        Gestiona los respaldos de tu base de datos MongoDB.
                    </p>
                </div>
                <Button onClick={handleCreateBackup} disabled={creatingBackup}>
                    {creatingBackup ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creando...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Crear Respaldo
                        </>
                    )}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Respaldos</CardTitle>
                    <CardDescription>
                        Lista de respaldos disponibles para restaurar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No hay respaldos disponibles.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.map((backup) => (
                                    <TableRow key={backup.name}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Database className="h-4 w-4 text-muted-foreground" />
                                                {backup.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(backup.createdAt), "PPpp", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConfirmRestore(backup.name)}
                                                disabled={restoringBackup !== null}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Restaurar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!confirmRestore} onOpenChange={(open) => !open && setConfirmRestore(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar Restauración
                        </DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas restaurar el respaldo <strong>{confirmRestore}</strong>?
                            <br /><br />
                            <span className="font-bold text-destructive">
                                ESTA ACCIÓN ELIMINARÁ TODOS LOS DATOS ACTUALES Y LOS REEMPLAZARÁ CON EL RESPALDO.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmRestore(null)}
                            disabled={restoringBackup !== null}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRestore}
                            disabled={restoringBackup !== null}
                        >
                            {restoringBackup === confirmRestore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restaurando...
                                </>
                            ) : (
                                "Restaurar Base de Datos"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
