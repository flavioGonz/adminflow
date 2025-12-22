"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboboxOption = {
  value: string;
  label: string;
  badge?: React.ReactNode;
};

type ComboboxProps = {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | undefined) => void;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
};

export function Combobox({
  options,
  placeholder = "Selecciona una opcion",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados.",
  value,
  defaultValue,
  onValueChange,
  className,
  contentClassName,
  children,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);

  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  React.useEffect(() => {
    setInternalValue(defaultValue);
  }, [defaultValue]);

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    if (value === undefined) {
      setInternalValue(selectedValue);
    }
    onValueChange?.(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Seleccionar opcion"
          className={cn("w-full justify-between", className)}
        >
          <span className="flex min-w-0 items-center gap-2 truncate text-left">
            {children}
            <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 border border-slate-200 text-slate-900 shadow-lg",
          contentClassName
        )}
      >
        <Command className="bg-slate-50 text-slate-900">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[240px]">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem 
                  key={option.value} 
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate flex-1">{option.label}</span>
                  {option.badge && (
                    <span className="ml-2 shrink-0">{option.badge}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
