"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, Phone, Lock, User as UserIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "./avatar-upload";
import { RoleSelector } from "./role-selector";
import type { User, CreateUserPayload, UpdateUserPayload, UserRole, UserStatus } from "@/types/user";
import type { Group } from "@/types/group";
import { API_BASE_URL } from "@/lib/config";

interface UserModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateUserPayload | UpdateUserPayload, avatarFile?: File) => Promise<void>;
    user?: User | null;
    groups: Group[];
    mode: "create" | "edit";
}

export function UserModal({ open, onClose, onSave, user, groups, mode }: UserModalProps) {
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        phone: "",
        roles: ["viewer"] as UserRole[],
        groupId: null as string | null,
        status: "active" as UserStatus,
    });

    useEffect(() => {
        if (user && mode === "edit") {
            setFormData({
                email: user.email,
                password: "",
                name: user.name,
                phone: user.phone || "",
                roles: user.roles,
                groupId: user.groupId,
                status: user.status,
            });
        } else {
            setFormData({
                email: "",
                password: "",
                name: "",
                phone: "",
                roles: ["viewer"],
                groupId: null,
                status: "active",
            });
        }
        setAvatarFile(null);
    }, [user, mode, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "create") {
                const payload: CreateUserPayload = {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name || undefined,
                    phone: formData.phone || undefined,
                    roles: formData.roles,
                    groupId: formData.groupId,
                    status: formData.status,
                };
                await onSave(payload, avatarFile || undefined);
            } else {
                const payload: UpdateUserPayload = {
                    name: formData.name,
                    phone: formData.phone || undefined,
                    roles: formData.roles,
                    groupId: formData.groupId,
                    status: formData.status,
                };
                await onSave(payload, avatarFile || undefined);
            }
            onClose();
        } catch (error) {
            console.error("Error saving user:", error);
        } finally {
            setLoading(false);
        }
    };

    const getAvatarUrl = (path: string | undefined | null) => {
        if (!path) return undefined;
        if (path.startsWith("http")) return path;
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${API_BASE_URL}${cleanPath}`;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-5xl h-[85vh] lg:h-auto max-h-[90vh] flex flex-col p-0 overflow-hidden outline-none">
                <DialogHeader className="px-6 py-5 border-b shrink-0 bg-background z-20">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            {mode === "create" ? "Crear Nuevo Usuario" : "Editar Usuario"}
                        </DialogTitle>

                        <Select
                            value={formData.status}
                            onValueChange={(value: UserStatus) =>
                                setFormData({ ...formData, status: value })
                            }
                        >
                            <SelectTrigger className="w-[130px] h-8 text-xs font-medium bg-muted/50 border-dashed">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="active">
                                    <span className="flex items-center gap-2 text-xs">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                        Activo
                                    </span>
                                </SelectItem>
                                <SelectItem value="inactive">
                                    <span className="flex items-center gap-2 text-xs">
                                        <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                        Inactivo
                                    </span>
                                </SelectItem>
                                <SelectItem value="suspended">
                                    <span className="flex items-center gap-2 text-xs">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                        Suspendido
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogDescription className="mt-1.5">
                        {mode === "create"
                            ? "Complete la información personal y asigne los permisos correspondientes."
                            : "Modifique los detalles de la cuenta y la configuración de acceso."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    {/* COLUMNA IZQUIERDA: Perfil e Información */}
                    <div className="p-6 overflow-y-auto space-y-6 bg-background">
                        {/* 1. Sección Perfil */}
                        <div className="flex justify-center pb-2">
                            <AvatarUpload
                                currentAvatar={getAvatarUrl(user?.avatar)}
                                userName={formData.name || formData.email}
                                onFileSelect={setAvatarFile}
                                onRemove={() => setAvatarFile(null)}
                                size="md"
                            />
                        </div>

                        <Separator />

                        {/* 2. Sección Info Personal */}
                        <div className="space-y-4">
                            <h3 className="text-base font-medium text-foreground">Información Personal</h3>

                            <div className="grid gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs text-muted-foreground font-medium">Correo Electrónico</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="usuario@empresa.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={mode === "edit"}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>

                                {mode === "create" && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs text-muted-foreground font-medium">Contraseña Inicial</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                                minLength={8}
                                                className="pl-9 h-9"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs text-muted-foreground font-medium">Nombre Completo</Label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs text-muted-foreground font-medium">Teléfono</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Organización y Roles */}
                    <div className="p-6 overflow-y-auto space-y-6 bg-muted/10 border-l">
                        {/* 1. Sección Organización */}
                        <div className="space-y-4">
                            <h3 className="text-base font-medium text-foreground">Organización</h3>
                            <div className="space-y-1.5">
                                <Label htmlFor="group" className="text-xs text-muted-foreground font-medium">Departamento / Grupo</Label>
                                <Select
                                    value={formData.groupId || "none"}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, groupId: value === "none" ? null : value })
                                    }
                                >
                                    <SelectTrigger className="w-full bg-background h-9">
                                        <SelectValue placeholder="Seleccionar departamento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin asignación</SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem key={group._id} value={group._id}>
                                                {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* 2. Sección Roles */}
                        <div className="space-y-4">
                            <h3 className="text-base font-medium text-foreground">Roles y Permisos</h3>
                            <RoleSelector
                                selectedRoles={formData.roles}
                                onChange={(roles) => setFormData({ ...formData, roles })}
                                multiSelect={true}
                                className="space-y-2"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 flex items-center justify-end gap-3 z-20">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-muted">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[140px]">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mode === "create" ? "Crear Usuario" : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
