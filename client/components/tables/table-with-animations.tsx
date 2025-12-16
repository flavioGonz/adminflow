"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableWithAnimationsProps {
  headers: string[];
  rows: any[];
  renderRow: (row: any, index: number) => ReactNode;
  className?: string;
  staggerDelay?: number;
  rowDelay?: number;
}

export function TableWithAnimations({
  headers,
  rows,
  renderRow,
  className,
  staggerDelay = 0.05,
  rowDelay = 0,
}: TableWithAnimationsProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: rowDelay,
          },
        },
      }}
      className={className}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <motion.tr
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.4,
                    ease: [0.34, 1.56, 0.64, 1],
                  },
                },
              }}
            >
              {renderRow(row, index)}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
