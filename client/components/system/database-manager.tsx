"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Database,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Copy,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_URL } from "@/lib/http";
import { cn } from "@/lib/utils";

interface DBConnection {
  id: string;
  name: string;
  uri: string;
  createdAt: string;
  collections?: string[];
  isActive?: boolean;
}

interface Collection {
  name: string;
  count: number;
  size: number;
}

export function DatabaseManager() {
  const [connections, setConnections] = useState<DBConnection[]>([]);
  const [currentConnection, setCurrentConnection] = useState<DBConnection | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionForm, setConnectionForm] = useState({
    name: "",
    uri: "",
  });
  const [showUri, setShowUri] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);

  // Load connections from localStorage
  useEffect(() => {
    loadConnections();
    loadCurrentConnection();
  }, []);

  const loadConnections = () => {
    try {
      const saved = localStorage.getItem("db_connections");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConnections(parsed);
      }
    } catch (err) {
      console.error("Error loading connections:", err);
    }
  };

  const loadCurrentConnection = async () => {
    try {
      const response = await fetch(`${API_URL}/system/database`, {
        method: "GET",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentConnection({
          id: "current",
          name: "Conexión Actual",
          uri: data.uri || "mongodb://...",
          createdAt: new Date().toISOString(),
          isActive: true,
        });
        // Load collections
        await loadCollections(data.uri);
      }
    } catch (err) {
      console.error("Error loading current connection:", err);
    }
  };

  const loadCollections = async (uri?: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/system/database/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri }),
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (err) {
      console.error("Error loading collections:", err);
      toast.error("Error al cargar colecciones");
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!connectionForm.name.trim() || !connectionForm.uri.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      // Verify connection
      const response = await fetch(`${API_URL}/system/database/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: connectionForm.uri }),
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar a la base de datos");
      }

      const newConnection: DBConnection = {
        id: Date.now().toString(),
        name: connectionForm.name,
        uri: connectionForm.uri,
        createdAt: new Date().toISOString(),
        collections: [],
      };

      const updated = [...connections, newConnection];
      setConnections(updated);
      localStorage.setItem("db_connections", JSON.stringify(updated));
      
      toast.success("Conexión guardada correctamente");
      setConnectionForm({ name: "", uri: "" });
      setShowConnectionForm(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchConnection = async (connection: DBConnection) => {
    setLoading(true);
    try {
      // Switch database connection
      const response = await fetch(`${API_URL}/system/database/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: connection.uri }),
      });

      if (!response.ok) {
        throw new Error("No se pudo cambiar la base de datos");
      }

      const data = await response.json();

      // Check and deploy missing collections
      if (data.missingCollections && data.missingCollections.length > 0) {
        toast.info(
          `${data.missingCollections.length} colecciones faltantes. Desplegando...`
        );
        
        const deployResponse = await fetch(
          `${API_URL}/system/database/deploy-collections`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collections: data.missingCollections }),
          }
        );

        if (!deployResponse.ok) {
          toast.error("Error al desplegar colecciones");
          return;
        }
      }

      setCurrentConnection({
        ...connection,
        isActive: true,
      });
      await loadCollections(connection.uri);
      toast.success(`Cambiado a ${connection.name}`);
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar base de datos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = (id: string) => {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    localStorage.setItem("db_connections", JSON.stringify(updated));
    toast.success("Conexión eliminada");
  };

  const handleRestorePrevious = async () => {
    if (!connections.length) {
      toast.error("No hay conexiones anteriores");
      return;
    }

    // Restore to the last saved connection
    const lastConnection = connections[connections.length - 1];
    await handleSwitchConnection(lastConnection);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      {/* Current Connection */}
      {currentConnection && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-emerald-900">
                    Conexión Actual
                  </CardTitle>
                  <CardDescription className="text-emerald-700">
                    {currentConnection.name}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-emerald-500 text-white border-emerald-600">
                <Check className="h-3 w-3 mr-1" />
                Activa
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <code className="text-xs text-slate-600 truncate flex-1">
                {showUri ? currentConnection.uri : "mongodb://***"}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUri(!showUri)}
                >
                  {showUri ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentConnection.uri)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Collections */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Colecciones ({collections.length})</h4>
              {loading ? (
                <p className="text-sm text-slate-500 italic">Cargando colecciones...</p>
              ) : collections.length === 0 ? (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  No se encontraron colecciones
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {collections.map((col) => (
                    <div
                      key={col.name}
                      className="p-3 rounded-lg bg-white border text-xs space-y-1"
                    >
                      <p className="font-semibold text-slate-900 truncate">
                        {col.name}
                      </p>
                      <p className="text-slate-500">📊 {col.count} docs</p>
                      <p className="text-slate-400">💾 {(col.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Conexiones Guardadas
              </CardTitle>
              <CardDescription>
                Gestiona tus conexiones de base de datos
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setShowConnectionForm(!showConnectionForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Conexión
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Connection Form */}
          {showConnectionForm && (
            <div className="space-y-3 p-4 rounded-lg border bg-slate-50">
              <div>
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Producción, Staging, etc."
                  value={connectionForm.name}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">URI de Conexión</Label>
                <Input
                  placeholder="mongodb://user:pass@host:port/database"
                  type="password"
                  value={connectionForm.uri}
                  onChange={(e) =>
                    setConnectionForm({
                      ...connectionForm,
                      uri: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddConnection}
                  disabled={loading}
                >
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConnectionForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Connections List */}
          {connections.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-8">
              No hay conexiones guardadas
            </p>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{connection.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {connection.uri}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchConnection(connection)}
                      disabled={loading}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cambiar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteConnection(connection.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restore Previous Button */}
          {connections.length > 0 && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestorePrevious}
                disabled={loading}
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Volver a Conexión Anterior
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
