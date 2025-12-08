"use client";

import { useState } from "react";
import { Upload, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
    currentAvatar?: string | null;
    userName?: string;
    onFileSelect: (file: File) => void;
    onRemove?: () => void;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function AvatarUpload({
    currentAvatar,
    userName = "Usuario",
    onFileSelect,
    onRemove,
    className,
    size = "lg"
}: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentAvatar || null);

    const sizeClasses = {
        sm: "h-16 w-16",
        md: "h-24 w-24",
        lg: "h-32 w-32"
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            alert("La imagen no debe superar 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Solo se permiten archivos de imagen");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelect(file);
    };

    const handleRemove = () => {
        setPreview(null);
        if (onRemove) {
            onRemove();
        }
    };

    const initials = userName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={cn("flex flex-col items-center gap-4", className)}>
            <div className="relative group">
                <Avatar className={cn(sizeClasses[size], "border-4 border-background shadow-sm")}>
                    <AvatarImage src={preview || undefined} alt={userName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                        {initials || <User className="h-10 w-10" />}
                    </AvatarFallback>
                </Avatar>

                {preview && onRemove && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <label className="cursor-pointer">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                    <span>
                        <Upload className="h-3 w-3" />
                        {preview ? "Cambiar imagen" : "Subir imagen"}
                    </span>
                </Button>
            </label>

            {!preview && (
                <p className="text-[10px] text-muted-foreground text-center">
                    PNG, JPG hasta 5MB
                </p>
            )}
        </div>
    );
}
