"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateAccess, AccessItem } from "@/lib/api-access";
import { ACCESS_TYPES } from "./icon-map";
import { Server, Type, Globe, Laptop, KeyRound, Hash, FileSignature } from "lucide-react";

const formSchema = z.object({
  equipo: z.string().min(1, "El nombre del equipo es requerido"),
  tipo_equipo: z.string().min(1, "El tipo de equipo es requerido"),
  ip: z.string().optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
  serieMac: z.string().optional(),
  comentarios: z.string().optional(),
});

interface EditAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  access: AccessItem;
  onSuccess: () => void;
}

export function EditAccessDialog({
  open,
  onOpenChange,
  access,
  onSuccess,
}: EditAccessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipo: "",
      tipo_equipo: "",
      ip: "",
      user: "",
      pass: "",
      serieMac: "",
      comentarios: "",
    },
  });

  useEffect(() => {
    if (access) {
      form.reset({
        equipo: access.equipo,
        tipo_equipo: access.tipo_equipo,
        ip: access.ip,
        user: access.user,
        pass: access.pass,
        serieMac: access.serieMac || "",
        comentarios: access.comentarios,
      });
    }
  }, [access, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await updateAccess(access._id, values);
      toast.success("Acceso actualizado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el acceso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar Acceso</DialogTitle>
          <DialogDescription>
            Modifica los datos del dispositivo o credencial.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="equipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-slate-500" />
                      Equipo *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Router Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_equipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-slate-500" />
                      Tipo *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACCESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    IP / URL
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="192.168.1.1 o https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-slate-500" />
                      Usuario
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-slate-500" />
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serieMac"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-500" />
                    Serie / MAC
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: AA:BB:CC:DD:EE:FF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-slate-500" />
                    Comentarios
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
