"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
        } catch (error: unknown) {
            console.error("Error loading data:", error);
            const message = error instanceof Error ? error.message : "Error al cargar datos";
            toast.error(message);
        } finally {
            setLoading(false);
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

    // Crear usuario
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
        } catch (error: unknown) {
            console.error("Error saving user:", error);
            const message = error instanceof Error ? error.message : "Error al guardar usuario";
            toast.error(message);
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
        } catch (error: unknown) {
            console.error("Error deleting user:", error);
            const message = error instanceof Error ? error.message : "Error al eliminar usuario";
            toast.error(message);
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
        } catch (error: unknown) {
            console.error("Error updating password:", error);
            throw error;
        }
    };

    // Estadísticas
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
                user={selectedUser}
            />
        </div>
    );
});

UsersManagementPage.displayName = "UsersManagementPage";
export default UsersManagementPage;
