"use client";

import { Bell, BellOff, BellRing, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

export function PushNotificationSettings() {
  const {
    isSupported,
    isLoading,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendLocalNotification
  } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Notificaciones de escritorio desactivadas");
      } else {
        toast.error("Error al desactivar notificaciones");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Notificaciones de escritorio activadas");
        // Send a test notification
        setTimeout(() => {
          sendLocalNotification("¡Notificaciones activadas!", {
            body: "Ahora recibirás alertas de AdminFlow en tu escritorio.",
            tag: "welcome"
          });
        }, 1000);
      } else if (permission === 'denied') {
        toast.error("Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.");
      } else {
        toast.error("Error al activar notificaciones");
      }
    }
  };

  const handleTestNotification = () => {
    sendLocalNotification("Prueba de Notificación", {
      body: "Este es un mensaje de prueba desde AdminFlow 🔔",
      tag: "test",
      data: { url: "/notifications" }
    });
    toast.success("Notificación de prueba enviada");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="secondary">No soportado</Badge>;
    }
    if (permission === 'denied') {
      return <Badge variant="destructive">Bloqueado</Badge>;
    }
    if (isSubscribed) {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Activo</Badge>;
    }
    return <Badge variant="outline">Inactivo</Badge>;
  };

  const getStatusIcon = () => {
    if (!isSupported || permission === 'denied') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (isSubscribed) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
    return <BellOff className="h-5 w-5 text-slate-400" />;
  };

  return (
    <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isSubscribed ? "bg-emerald-100" : "bg-slate-100"
            )}>
              {isSubscribed ? (
                <BellRing className="h-5 w-5 text-emerald-600" />
              ) : (
                <Bell className="h-5 w-5 text-slate-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Notificaciones de Escritorio
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                Recibe alertas en tu computadora aunque no tengas AdminFlow abierto
              </CardDescription>
            </div>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isSupported ? (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">⚠️ Tu navegador no soporta notificaciones push</p>
              <p className="mt-1 text-amber-700">
                Usa Chrome, Firefox, Edge o Safari para recibir notificaciones de escritorio.
              </p>
            </div>
          ) : permission === 'denied' ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">🚫 Notificaciones bloqueadas</p>
              <p className="mt-1 text-red-700">
                Las notificaciones están bloqueadas en tu navegador. Para habilitarlas:
              </p>
              <ol className="mt-2 list-decimal list-inside text-red-700 space-y-1">
                <li>Haz clic en el ícono del candado en la barra de direcciones</li>
                <li>Busca "Notificaciones" y cámbialo a "Permitir"</li>
                <li>Recarga la página</li>
              </ol>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <Label htmlFor="push-toggle" className="font-medium cursor-pointer">
                    Activar notificaciones push
                  </Label>
                </div>
                <Switch
                  id="push-toggle"
                  checked={isSubscribed}
                  onCheckedChange={handleToggle}
                />
              </div>
              
              {isSubscribed && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Las notificaciones están activas para este dispositivo
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleTestNotification}
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    Enviar prueba
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
