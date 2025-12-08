"use client";

import { useState } from "react";
import {
    Edit,
    Trash2,
    Key,
    Search,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    Users as UsersIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ROLE_DEFINITIONS, STATUS_DEFINITIONS, type User, type UserRole, type UserStatus } from "@/types/user";
import { API_BASE_URL } from "@/lib/config";

interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onResetPassword: (user: User) => void;
    loading?: boolean;
}

export function UserTable({ users, onEdit, onDelete, onResetPassword, loading }: UserTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

    // Filtrar usuarios
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === "all" || user.roles.includes(roleFilter);
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarUrl = (avatarPath: string | null | undefined) => {
        if (!avatarPath) return undefined;
        if (avatarPath.startsWith("http")) return avatarPath;
        // Asegurar que no haya doble slash
        const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
        return `${API_BASE_URL}${cleanPath}`;
    };

    return (
        <div className="space-y-4">
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                        <SelectTrigger className="w-[180px] h-11">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filtrar por rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los roles</SelectItem>
                            {Object.values(ROLE_DEFINITIONS).map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                        <SelectTrigger className="w-[180px] h-11">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="active">Activos</SelectItem>
                            <SelectItem value="inactive">Inactivos</SelectItem>
                            <SelectItem value="suspended">Suspendidos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Usuario</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Roles</TableHead>
                            <TableHead>Grupo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        Cargando usuarios...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No se encontraron usuarios
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} className="group">
                                    {/* Usuario */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                <AvatarImage src={getAvatarUrl(user.avatar)} alt={user.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Contacto */}
                                    <TableCell>
                                        {user.phone ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                {user.phone}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </TableCell>

                                    {/* Roles */}
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {user.roles.map((role) => {
                                                const roleInfo = ROLE_DEFINITIONS[role];
                                                return (
                                                    <Badge
                                                        key={role}
                                                        variant="secondary"
                                                        className={cn("text-xs", roleInfo.color)}
                                                    >
                                                        {roleInfo.label}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </TableCell>

                                    {/* Grupo */}
                                    <TableCell>
                                        {user.groupName ? (
                                            <div className="flex items-center gap-1 text-sm">
                                                <UsersIcon className="h-3 w-3 text-muted-foreground" />
                                                {user.groupName}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">Sin grupo</span>
                                        )}
                                    </TableCell>

                                    {/* Estado */}
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-xs", STATUS_DEFINITIONS[user.status].color)}
                                        >
                                            {STATUS_DEFINITIONS[user.status].label}
                                        </Badge>
                                    </TableCell>

                                    {/* Acciones */}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onEdit(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onResetPassword(user)}>
                                                    <Key className="mr-2 h-4 w-4" />
                                                    Cambiar contraseña
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(user)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
