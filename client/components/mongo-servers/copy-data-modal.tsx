"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Database,
} from "lucide-react";

interface MongoServer {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  uri: string;
  active: boolean;
  description?: string;
}

interface CopyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceServer: MongoServer | null;
  availableServers: MongoServer[];
  currentServer: MongoServer | null;
}

export function CopyDataModal({
  isOpen,
  onClose,
  sourceServer,
  availableServers,
  currentServer,
}: CopyDataModalProps) {
  const [targetServerId, setTargetServerId] = useState<string>("");
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [includeIndexes, setIncludeIndexes] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const handleCopyData = async () => {
    if (!sourceServer || !targetServerId) {
      alert("Selecciona servidor origen y destino");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/mongo-servers/copy-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceServerId: sourceServer.id,
          targetServerId,
          collections: selectedCollections.length > 0 ? selectedCollections : null,
          includeIndexes,
          overwriteExisting,
        }),
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.message,
        details: data.details,
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Error al copiar datos",
        details: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const targetServer = availableServers.find((s) => s.id === targetServerId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-blue-600" />
            Copiar Datos Entre Bases de Datos
          </DialogTitle>
          <DialogDescription>
            Transfiere datos de una instancia MongoDB a otra
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              className={`rounded-lg border-2 p-4 ${
                result.success
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      result.success ? "text-emerald-900" : "text-red-900"
                    }`}
                  >
                    {result.message}
                  </h3>
                  {result.details && (
                    <p
                      className={`text-sm mt-2 ${
                        result.success ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                setResult(null);
                onClose();
              }} variant="default">
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Servidor Origen */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-slate-600 mt-1" />
                <div className="flex-1">
                  <Label className="font-semibold text-slate-900">
                    Servidor Origen
                  </Label>
                  <div className="mt-2 text-sm">
                    <p className="font-medium">{sourceServer?.name}</p>
                    <p className="text-slate-600">
                      {sourceServer?.host}:{sourceServer?.port}
                    </p>
                    <p className="text-slate-600">
                      Base: {sourceServer?.database}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Servidor Destino */}
            <div className="space-y-2">
              <Label className="font-semibold">Servidor Destino</Label>
              <Select value={targetServerId} onValueChange={setTargetServerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona servidor destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableServers
                    .filter((s) => s.id !== sourceServer?.id)
                    .map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name} ({server.host}:{server.port})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {targetServer && (
                <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-3 text-sm">
                  <p className="font-medium text-blue-900">{targetServer.name}</p>
                  <p className="text-blue-700">
                    {targetServer.host}:{targetServer.port}
                  </p>
                </div>
              )}
            </div>

            {/* Opciones */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Asegúrate de tener permisos suficientes en ambas instancias.
                Los datos existentes serán {overwriteExisting ? "sobrescritos" : "preservados"}.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="indexes"
                  checked={includeIndexes}
                  onCheckedChange={(checked) =>
                    setIncludeIndexes(checked as boolean)
                  }
                />
                <Label htmlFor="indexes" className="cursor-pointer flex-1">
                  Incluir índices
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={(checked) =>
                    setOverwriteExisting(checked as boolean)
                  }
                />
                <Label htmlFor="overwrite" className="cursor-pointer flex-1">
                  Sobrescribir datos existentes
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleCopyData}
                disabled={isLoading || !targetServerId}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? "Copiando..." : "Copiar Datos"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
