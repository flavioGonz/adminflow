"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  headers?: string[];
}

export function TableSkeleton({ columns = 6, rows = 5, headers }: TableSkeletonProps) {
  const headerArray = headers || Array(columns).fill("Column");

  return (
    <Table>
      {headers && (
        <TableHeader>
          <TableRow>
            {headerArray.map((header, idx) => (
              <TableHead key={idx}>
                <Skeleton className="h-4 w-full" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      )}
      <TableBody>
        {Array(rows)
          .fill(0)
          .map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array(columns)
                .fill(0)
                .map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

/**
 * Skeleton para cargas de cards/contenedores
 */
export function CardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full mt-4" />
    </div>
  );
}

/**
 * Skeleton para listas
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array(items)
        .fill(0)
        .map((_, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
    </div>
  );
}

/**
 * Skeleton para grillas
 */
export function GridSkeleton({ columns = 3, items = 6 }: { columns?: number; items?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-${columns}`}>
      {Array(items)
        .fill(0)
        .map((_, idx) => (
          <div key={idx} className="space-y-2">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
    </div>
  );
}
