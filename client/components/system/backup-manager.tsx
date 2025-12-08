import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ArrowRight } from "lucide-react";

export function BackupManager() {
    return (
        <Card className="border-dashed border-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-sky-500" />
                    Gestión de Base de Datos
                </CardTitle>
                <CardDescription>
                    La gestión de respaldos y base de datos se ha movido a su propia sección dedicada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                    <div className="p-4 rounded-full bg-sky-50">
                        <Database className="h-12 w-12 text-sky-500" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h3 className="font-medium text-lg">Nueva Página de Base de Datos</h3>
                        <p className="text-sm text-muted-foreground">
                            Ahora puedes gestionar tus respaldos, colecciones y conexiones de forma más segura y eficiente en la nueva página dedicada.
                        </p>
                    </div>
                    <Button asChild className="mt-4">
                        <Link href="/database">
                            Ir a Base de Datos
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
