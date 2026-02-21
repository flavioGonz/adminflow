"use client";

import { useMemo, useState } from "react";
import { Check, Search, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_URL } from "@/lib/http";

interface UnifiedAssignmentSearchProps {
  users: { id: string; name: string; email: string; avatar?: string }[];
  groups: { _id?: string; id?: string; name: string }[];
  assignedTo: string | null;
  assignedGroupId: string | null;
  onAssign: (type: 'user' | 'group' | 'none', value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function UnifiedAssignmentSearch({
  users,
  groups,
  assignedTo,
  assignedGroupId,
  onAssign,
  disabled,
  className
}: UnifiedAssignmentSearchProps) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (assignedGroupId) {
      const g = groups.find(g => (g._id || g.id) === assignedGroupId);
      return g?.name || "Grupo";
    }
    if (assignedTo) {
      const u = users.find(u => u.email === assignedTo);
      return u?.name || assignedTo;
    }
    return "Sin asignar";
  }, [assignedGroupId, assignedTo, groups, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11 rounded-2xl border-slate-200 font-bold", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {assignedGroupId ? (
              <Users className="h-4 w-4 text-indigo-500" />
            ) : assignedTo ? (
              <User className="h-4 w-4 text-blue-500" />
            ) : (
              <User className="h-4 w-4 text-slate-400" />
            )}
            {label}
          </div>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 rounded-3xl overflow-hidden shadow-2xl border-slate-100">
        <Command>
          <CommandInput placeholder="Buscar grupo o técnico..." className="h-11" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No hay resultados.</CommandEmpty>
            <CommandGroup heading="Grupos">
              {groups.map((g) => {
                const id = g._id || g.id;
                return (
                  <CommandItem
                    key={id}
                    value={g.name}
                    onSelect={() => {
                      onAssign('group', id!);
                      setOpen(false);
                    }}
                  >
                    <Users className="mr-2 h-4 w-4 text-indigo-500" />
                    <span className="font-bold">{g.name}</span>
                    {assignedGroupId === id && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandGroup heading="Técnicos">
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={u.name}
                  onSelect={() => {
                    onAssign('user', u.email);
                    setOpen(false);
                  }}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${API_URL.replace('/api', '')}${u.avatar}`) : undefined} />
                    <AvatarFallback className="text-[8px]">{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-bold">{u.name}</span>
                  {assignedTo === u.email && <Check className="ml-auto h-4 w-4 text-emerald-500" />}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onAssign('none', null);
                  setOpen(false);
                }}
              >
                <div className="flex items-center text-rose-600 font-bold">
                   <Search className="mr-2 h-4 w-4 text-rose-500" />
                   Quitar asignación
                </div>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
