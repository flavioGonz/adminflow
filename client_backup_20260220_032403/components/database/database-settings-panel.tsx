"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DatabaseEngine = "mongodb" | "sqlite";

type DatabaseForm = {
  engine: DatabaseEngine;
  mongoUri: string;
  mongoDb: string;
  sqlitePath: string;
};

const INITIAL_FORM: DatabaseForm = {
  engine: "mongodb",
  mongoUri: "mongodb://crm.infratec.com.uy:29999",
  mongoDb: "adminflow",
  sqlitePath: "server/database/database.sqlite",
};

export default function DatabaseSettingsPanel() {
  const [form, setForm] = useState<DatabaseForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/system/database`);
        if (!response.ok) {
          throw new Error("No se pudo cargar la configuración.");
        }
        const payload = await response.json();
        if (payload?.data) {
          setForm((prev) => ({ ...prev, ...payload.data }));
        }
      } catch (error) {
        console.error("fetch database config", error);
        toast.error("No se pudo leer la configuración de base. Usando valores por defecto.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleFieldChange = (field: keyof DatabaseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const response = await fetch(`${API_URL}/system/database/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Error verificando la base.");
      }
      const info = payload?.info || "Conexión verificada correctamente.";
      setVerifyResult(info);
      toast.success("Base verificada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error inesperado al verificar la conexión.";
      setVerifyResult(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/system/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error("No se pudo guardar la configuración.");
      }
      toast.success("Configuración guardada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error guardando configuración.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const mongoFields = useMemo(
    () =>
      form.engine === "mongodb" ? (
        <>
          <div className="grid gap-2">
            <Label>URI de conexión</Label>
            <Input
              value={form.mongoUri}
              placeholder="mongodb://..."
              onChange={(event) => handleFieldChange("mongoUri", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Base de datos</Label>
            <Input
              value={form.mongoDb}
              onChange={(event) => handleFieldChange("mongoDb", event.target.value)}
            />
          </div>
        </>
      ) : null,
    [form.engine, form.mongoUri, form.mongoDb]
  );

  const sqliteField = useMemo(
    () =>
      form.engine === "sqlite" ? (
        <div className="grid gap-2">
          <Label>Ruta de SQLite</Label>
          <Input
            value={form.sqlitePath}
            onChange={(event) => handleFieldChange("sqlitePath", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Asegúrate de que el archivo exista y que el backend tenga permisos para leer/escribirlo.
          </p>
        </div>
      ) : null,
    [form.engine, form.sqlitePath]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conexión a la base</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ajusta el motor y verifica la conectividad con tu MongoDB remoto o el archivo SQLite local.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Motor</Label>
            <Select
              value={form.engine}
              onValueChange={(value) => handleFieldChange("engine", value as DatabaseEngine)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escoge un motor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mongodb">MongoDB</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mongoFields}
          {sqliteField}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleVerify} disabled={isVerifying || loading}>
              {isVerifying ? "Verificando..." : "Verificar conexión"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || loading}>
              {isSaving ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
          {verifyResult && (
            <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
              {verifyResult}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-secondary/60">
        <CardHeader>
          <CardTitle>Consejos rápidos</CardTitle>
          <CardDescription>Estos valores reflejan la instancia remota que ya tienes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Conexión Mongo remota: <code>mongodb://crm.infratec.com.uy:29999</code> y base{" "}
            <code>adminflow</code>.
          </p>
          <p>
            Para SQLite usa <code>server/database/database.sqlite</code> si necesitas una copia local.
          </p>
          <p>Cada verificación prueba un `ping` o abre el archivo antes de guardar.</p>
        </CardContent>
      </Card>
    </div>
  );
}
