"use client";

import { TableBody } from "@/components/ui/table";
import { ReactNode } from "react";

interface AnimatedTableProps {
  children: ReactNode;
  className?: string;
}

interface RowData {
  id: string | number;
  [key: string]: any;
}

interface AnimatedTableRowProps {
  data: RowData;
  index: number;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper animado para TableBody
 * Aplica AnimatePresence para animaciones de entrada/salida
 */
export function AnimatedTableBody({ children, className }: AnimatedTableProps) {
  // Render plain TableBody without animations
  return <TableBody className={className}>{children}</TableBody>;
}

/**
 * Fila de tabla animada con efectos de Framer Motion
 * - Entrada: fade in + deslizamiento hacia arriba (y: 10 -> 0)
 * - Salida: fade out + deslizamiento hacia abajo (y: -10)
 * - Duración: 0.2s por defecto
 * - Delay: configurable según índice
 */
export function AnimatedTableRow({ 
  data, 
  index, 
  children, 
  className 
}: AnimatedTableRowProps) {
  // Render plain tr without animations
  return (
    <tr key={data.id} className={className || "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"}>
      {children}
    </tr>
  );
}

/**
 * Tabla completa animada (para casos simples)
 * Combina AnimatedTableBody y manejo automático de AnimatePresence
 */
export function AnimatedTable({ children, className }: AnimatedTableProps) {
  // Render plain TableBody without animations
  return <TableBody className={className}>{children}</TableBody>;
}
