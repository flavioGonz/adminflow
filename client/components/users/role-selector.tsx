"use client";

import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ROLE_DEFINITIONS, type UserRole } from "@/types/user";
import * as Icons from "lucide-react";

interface RoleSelectorProps {
    selectedRoles: UserRole[];
    onChange: (roles: UserRole[]) => void;
    multiSelect?: boolean;
    className?: string;
}

export function RoleSelector({
    selectedRoles,
    onChange,
    multiSelect = true,
    className
}: RoleSelectorProps) {
    const toggleRole = (role: UserRole) => {
        if (multiSelect) {
            if (selectedRoles.includes(role)) {
                onChange(selectedRoles.filter(r => r !== role));
            } else {
                onChange([...selectedRoles, role]);
            }
        } else {
            onChange([role]);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            <Label className="text-sm font-medium">
                Roles {multiSelect && "(Selecciona uno o más)"}
            </Label>

            <div className="grid gap-3">
                {Object.values(ROLE_DEFINITIONS).map((role) => {
                    const isSelected = selectedRoles.includes(role.value);
                    const iconsMap = Icons as Record<string, LucideIcon>;
                    const IconComponent = iconsMap[role.icon] ?? Icons.Shield;

                    return (
                        <Card
                            key={role.value}
                            className={cn(
                                "relative cursor-pointer transition-all hover:shadow-md",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                                    : "border-muted hover:border-primary/50"
                            )}
                            onClick={() => toggleRole(role.value)}
                        >
                            <div className="flex items-start gap-3 p-4">
                                {/* Icono */}
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg",
                                        isSelected
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    <IconComponent className="h-5 w-5" />
                                </div>

                                {/* Contenido */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{role.label}</h4>
                                        {isSelected && (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {role.description}
                                    </p>

                                    {/* Permisos */}
                                    <div className="flex flex-wrap gap-1 pt-2">
                                        {role.permissions.slice(0, 3).map((permission, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {permission}
                                            </Badge>
                                        ))}
                                        {role.permissions.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{role.permissions.length - 3} más
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Roles seleccionados */}
            {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/50 p-3">
                    <span className="text-sm font-medium text-muted-foreground">
                        Seleccionados:
                    </span>
                    {selectedRoles.map(role => {
                        const roleInfo = ROLE_DEFINITIONS[role];
                        return (
                            <Badge
                                key={role}
                                className={cn("gap-1", roleInfo.color)}
                                variant="secondary"
                            >
                                {roleInfo.label}
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
