"use client";

import { useState } from "react";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccessItem } from "@/lib/api-access";
import { EditAccessDialog } from "./edit-access-dialog";
import { DeleteAccessDialog } from "./delete-access-dialog";

interface AccessRowActionsProps {
    access: AccessItem;
    onUpdate: () => void;
}

export function AccessRowActions({ access, onUpdate }: AccessRowActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditAccessDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                access={access}
                onSuccess={onUpdate}
            />

            <DeleteAccessDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                access={access}
                onSuccess={onUpdate}
            />
        </>
    );
}

export function PasswordCell({ value }: { value: string }) {
    const [show, setShow] = useState(false);

    if (!value) return <span className="text-muted-foreground italic">No definida</span>;

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
                {show ? value : "••••••••"}
            </span>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setShow(!show)}
            >
                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
        </div>
    );
}

export function IpCell({ value }: { value: string }) {
    if (!value) return <span className="text-muted-foreground italic">No definida</span>;

    const isUrl = value.startsWith("http") || value.startsWith("www");
    const href = value.startsWith("http") ? value : `https://${value}`;

    if (isUrl) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
            >
                {value}
                <ExternalLink className="h-3 w-3" />
            </a>
        );
    }

    return <span className="font-mono text-sm">{value}</span>;
}
