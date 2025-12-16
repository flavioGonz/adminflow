"use client";

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrentDatabaseInfo } from './mongo-servers/current-database-info';
import { CopyDataModal } from './mongo-servers/copy-data-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Server, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Play,
  Trash2,
  Edit,
  Database
} from 'lucide-react';

interface MongoServer {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  uri: string;
  active: boolean;
  description?: string;
  username?: string;
  password?: string;
}

interface ServerStatus {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  active: boolean;
  current: boolean;
  connectionStatus: 'online' | 'offline' | 'error' | 'unknown';
  collections: {
    existing: string[];
    missing: string[];
    required: string[];
    total: number;
    complete: boolean;
  } | null;
  description?: string;
}

export default function MongoServersManager() {
  const [servers, setServers] = useState<MongoServer[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus[]>([]);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [switchLog, setSwitchLog] = useState<string[]>([]);
  const [showSwitchLog, setShowSwitchLog] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MongoServer | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [mirrorEnabled, setMirrorEnabled] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    host: 'localhost',
    port: 27017,
    database: 'adminflow',
    username: '',
    password: '',
    description: '',
    active: true
  });

  useEffect(() => {
    loadServers();
    loadServerStatus();
  }, []);

  const loadServers = async () => {
    try {
      const response = await fetch('/api/mongo-servers');
      const data = await response.json();
      
      if (data.success) {
        setServers(data.servers);
        setCurrentServerId(data.currentServer?.id || null);
      }
    } catch (err) {
      setError('Error al cargar servidores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadServerStatus = async () => {
    try {
      const response = await fetch('/api/mongo-servers/status');
      const data = await response.json();
      
      if (data.success) {
        setServerStatus(data.status);
      }
    } catch (err) {
      console.error('Error al cargar estado de servidores:', err);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/mongo-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAddDialogOpen(false);
        resetForm();
        await loadServers();
        await loadServerStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error al crear servidor');
      console.error(err);
    }
  };

  const handleEditServer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServer) return;

    try {
      const response = await fetch(`/api/mongo-servers/${selectedServer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setIsEditDialogOpen(false);
        setSelectedServer(null);
        resetForm();
        await loadServers();
        await loadServerStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error al actualizar servidor');
      console.error(err);
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!confirm('¿Está seguro de eliminar este servidor?')) return;

    try {
      const response = await fetch(`/api/mongo-servers/${serverId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadServers();
        await loadServerStatus();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error al eliminar servidor');
      console.error(err);
    }
  };

  const handleTestConnection = async (serverId: string) => {
    try {
      const response = await fetch(`/api/mongo-servers/${serverId}/test`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Conexión exitosa\nVersión: ${data.serverInfo.version}`);
      } else {
        alert(`❌ Error de conexión\n${data.message}`);
      }
    } catch (err) {
      alert('❌ Error al probar conexión');
      console.error(err);
    }
  };

  const handleSwitchServer = async (serverId: string) => {
    if (!confirm('¿Está seguro de cambiar al servidor seleccionado?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/mongo-servers/${serverId}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoCreate: true })
      });

      const data = await response.json();

      if (data.success) {
        setSwitchLog(data.log || []);
        setShowSwitchLog(true);
        setCurrentServerId(serverId);
        await loadServers();
        await loadServerStatus();
      } else {
        setSwitchLog(data.log || [data.error]);
        setShowSwitchLog(true);
        setError(data.error);
      }
    } catch (err) {
      setError('Error al cambiar servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollections = async (serverId: string) => {
    if (!confirm('¿Crear las colecciones faltantes en este servidor?')) return;

    try {
      const response = await fetch(`/api/mongo-servers/${serverId}/create-collections`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\nCreadas: ${data.created.join(', ')}`);
        await loadServerStatus();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Error al crear colecciones');
      console.error(err);
    }
  };

  const openEditDialog = (server: MongoServer) => {
    setSelectedServer(server);
    setFormData({
      id: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      database: server.database,
      username: server.username || '',
      password: server.password || '',
      description: server.description || '',
      active: server.active
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      host: 'localhost',
      port: 27017,
      database: 'adminflow',
      username: '',
      password: '',
      description: '',
      active: true
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Online</Badge>;
      case 'offline':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Offline</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  if (loading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="w-8 h-8" />
            Gestión de Servidores MongoDB
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona múltiples servidores MongoDB y cambia entre ellos
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servidor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Servidor MongoDB</DialogTitle>
              <DialogDescription>
                Configure la conexión a un nuevo servidor MongoDB
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddServer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="id">ID único *</Label>
                  <Input
                    id="id"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="ej: produccion, desarrollo"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej: Servidor de Producción"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="host">Host *</Label>
                  <Input
                    id="host"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label htmlFor="port">Puerto *</Label>
                  <Input
                    id="port"
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="database">Base de datos *</Label>
                <Input
                  id="database"
                  required
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  placeholder="adminflow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Usuario (opcional)</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional del servidor"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar Servidor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Información de la Base de Datos Actual */}
      {currentServerId && (
        <CurrentDatabaseInfo
          currentServer={servers.find(s => s.id === currentServerId) || null}
          currentStatus={serverStatus.find(s => s.id === currentServerId) || null}
          onMirrorToggle={setMirrorEnabled}
          onBackupToggle={setBackupEnabled}
          onCopyData={() => setIsCopyModalOpen(true)}
          mirrorEnabled={mirrorEnabled}
          backupEnabled={backupEnabled}
          isLoading={loading}
        />
      )}

      {/* Modal para Copiar Datos */}
      <CopyDataModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceServer={servers.find(s => s.id === currentServerId) || null}
        availableServers={servers}
        currentServer={servers.find(s => s.id === currentServerId) || null}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabla de Servidores */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Servidores Configurados</CardTitle>
              <CardDescription>
                {servers.length} servidor(es) configurado(s)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadServerStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar Estado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Base de Datos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Colecciones</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serverStatus.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">
                    <div>
                      {status.name}
                      {status.description && (
                        <div className="text-xs text-muted-foreground">{status.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{status.host}:{status.port}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{status.database}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(status.connectionStatus)}</TableCell>
                  <TableCell>
                    {status.collections ? (
                      <div className="text-sm">
                        {status.collections.complete ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {status.collections.total} completas
                          </Badge>
                        ) : (
                          <div className="space-y-1">
                            <Badge variant="destructive">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {status.collections.missing.length} faltantes
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateCollections(status.id)}
                            >
                              <Database className="w-3 h-3 mr-1" />
                              Crear
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.current && (
                      <Badge className="bg-blue-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestConnection(status.id)}
                      >
                        Test
                      </Button>
                      {!status.current && status.connectionStatus === 'online' && (
                        <Button
                          size="sm"
                          onClick={() => handleSwitchServer(status.id)}
                          disabled={loading}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Cambiar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const server = servers.find(s => s.id === status.id);
                          if (server) openEditDialog(server);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {!status.current && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteServer(status.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de log de cambio de servidor */}
      <Dialog open={showSwitchLog} onOpenChange={setShowSwitchLog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Log de Cambio de Servidor</DialogTitle>
          </DialogHeader>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {switchLog.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSwitchLog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Servidor MongoDB</DialogTitle>
            <DialogDescription>
              Modifique la configuración del servidor
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditServer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-database">Base de datos *</Label>
                <Input
                  id="edit-database"
                  required
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-host">Host *</Label>
                <Input
                  id="edit-host"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-port">Puerto *</Label>
                <Input
                  id="edit-port"
                  type="number"
                  required
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
