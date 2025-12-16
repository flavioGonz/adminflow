"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TableBody, TableRow } from "@/components/ui/table";
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
  return (
    <TableBody className={className}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </TableBody>
  );
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
  return (
    <motion.tr
      key={data.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={className || "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"}
    >
      {children}
    </motion.tr>
  );
}

/**
 * Tabla completa animada (para casos simples)
 * Combina AnimatedTableBody y manejo automático de AnimatePresence
 */
export function AnimatedTable({ children, className }: AnimatedTableProps) {
  return (
    <AnimatePresence mode="wait">
      <TableBody className={className}>
        {children}
      </TableBody>
    </AnimatePresence>
  );
}
