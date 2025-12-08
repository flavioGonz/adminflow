"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { UserPlus, Users as UsersIcon, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShinyText } from "@/components/ui/shiny-text";
import { UserTable } from "@/components/users/user-table";
import { UserModal } from "@/components/users/user-modal";
import { PasswordResetModal } from "@/components/users/password-reset-modal";
import { UsersAPI } from "@/lib/api-users-v2";
import * as GroupAPI from "@/lib/api-groups";
import { toast } from "sonner";
import type { User, CreateUserPayload, UpdateUserPayload } from "@/types/user";
import type { Group } from "@/types/group";

export interface UsersManagementRef {
    newUser: () => void;
    refresh: () => void;
}

const UsersManagementPage = forwardRef<UsersManagementRef>((props, ref) => {
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Estados de modales
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Cargar datos
    const loadData = async () => {
        try {
            const [usersData, groupsData] = await Promise.all([
                UsersAPI.list(),
                GroupAPI.listGroups()
            ]);
            setUsers(usersData);
            setGroups(groupsData);
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error(error.message || "Error al cargar datos");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useImperativeHandle(ref, () => ({
        newUser: () => {
            setSelectedUser(null);
            setModalMode("create");
            setUserModalOpen(true);
        },
        refresh: () => {
            setLoading(true);
            loadData();
        }
    }));

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Crear usuario
    const handleCreateUser = () => {
        setSelectedUser(null);
        setModalMode("create");
        setUserModalOpen(true);
    };

    // Editar usuario
    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setModalMode("edit");
        setUserModalOpen(true);
    };

    // Guardar usuario (crear o editar)
    const handleSaveUser = async (data: CreateUserPayload | UpdateUserPayload, avatarFile?: File) => {
        try {
            if (modalMode === "create") {
                const newUser = await UsersAPI.create(data as CreateUserPayload);

                // Si hay avatar, subirlo
                if (avatarFile && newUser.id) {
                    await UsersAPI.uploadAvatar(newUser.id, avatarFile);
                }

                toast.success("Usuario creado exitosamente");
            } else if (selectedUser) {
                await UsersAPI.update(selectedUser.id, data as UpdateUserPayload);

                // Si hay avatar, subirlo
                if (avatarFile) {
                    await UsersAPI.uploadAvatar(selectedUser.id, avatarFile);
                }

                toast.success("Usuario actualizado exitosamente");
            }

            loadData();
            setUserModalOpen(false);
        } catch (error: any) {
            console.error("Error saving user:", error);
            toast.error(error.message || "Error al guardar usuario");
            throw error;
        }
    };

    // Eliminar usuario
    const handleDeleteUser = async (user: User) => {
        if (!confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
            return;
        }

        try {
            await UsersAPI.delete(user.id);
            toast.success("Usuario eliminado exitosamente");
            loadData();
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(error.message || "Error al eliminar usuario");
        }
    };

    // Cambiar contraseña
    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setPasswordModalOpen(true);
    };

    const handleSavePassword = async (newPassword: string) => {
        if (!selectedUser) return;

        try {
            await UsersAPI.updatePassword(selectedUser.id, newPassword);
            toast.success("Contraseña actualizada exitosamente");
        } catch (error: any) {
            console.error("Error updating password:", error);
            throw error;
        }
    };

    // Estadísticas
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        admins: users.filter(u => u.roles.includes('admin')).length,
        withGroup: users.filter(u => u.groupId).length
    };

    return (
        <div className="space-y-4">
            {/* Tabla de usuarios */}
            {/* Tabla de usuarios */}
            <UserTable
                users={users}
                loading={loading}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onResetPassword={handleResetPassword}
            />

            {/* Modales */}
            <UserModal
                open={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                onSave={handleSaveUser}
                user={selectedUser}
                groups={groups}
                mode={modalMode}
            />

            <PasswordResetModal
                open={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                onSave={handleSavePassword}
                userName={selectedUser?.name || ""}
            />
        </div>
    );
});

UsersManagementPage.displayName = "UsersManagementPage";
export default UsersManagementPage;
