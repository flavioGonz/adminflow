"use client";

import { ReactNode } from "react";
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
    <div className={className}>
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
            <TableRow key={index}>
              {renderRow(row, index)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
