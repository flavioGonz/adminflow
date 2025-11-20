import { API_URL } from "./http";

export interface AccessItem {
    _id: string;
    clientId: string;
    equipo: string;
    tipo_equipo: string;
    ip: string;
    user: string;
    pass: string;
    comentarios: string;
    createdAt: string;
    updatedAt: string;
}

export type CreateAccessDTO = Omit<AccessItem, "_id" | "createdAt" | "updatedAt" | "clientId">;
export type UpdateAccessDTO = Partial<CreateAccessDTO>;

export async function getClientAccesses(clientId: string): Promise<AccessItem[]> {
    const res = await fetch(`${API_URL}/clients/${clientId}/access`);
    if (!res.ok) {
        console.error(`Error fetching accesses: ${res.status} ${res.statusText}`);
        throw new Error("Error al obtener accesos");
    }
    return res.json();
}

export async function createAccess(clientId: string, data: CreateAccessDTO): Promise<AccessItem> {
    const res = await fetch(`${API_URL}/clients/${clientId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear acceso");
    return res.json();
}

export async function updateAccess(accessId: string, data: UpdateAccessDTO): Promise<AccessItem> {
    const res = await fetch(`${API_URL}/access/${accessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar acceso");
    return res.json();
}

export async function deleteAccess(accessId: string): Promise<void> {
    const res = await fetch(`${API_URL}/access/${accessId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar acceso");
}
