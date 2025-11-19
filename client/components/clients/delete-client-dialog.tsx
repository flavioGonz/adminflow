// client/components/clients/delete-client-dialog.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { API_URL } from "@/lib/http";

interface Client {
  id: string;
  name: string;
}

interface DeleteClientDialogProps {
  client: Client;
  onClientDeleted: (clientId: string) => void;
  children: React.ReactNode;
}

export function DeleteClientDialog({ client, onClientDeleted, children }: DeleteClientDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete client");
      }

      onClientDeleted(client.id);
      toast.success(`Cliente "${client.name}" eliminado exitosamente.`);
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error(`Error al eliminar el cliente: ${error.message}`);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente{" "}
            <span className="font-semibold">{client.name}</span> de nuestros servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
