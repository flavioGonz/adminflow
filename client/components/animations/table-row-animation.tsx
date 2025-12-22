"use client";

import { ReactNode } from "react";

interface TableRowAnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function TableRowAnimation({ children }: TableRowAnimationProps) {
  // No animation: pass-through wrapper
  return <div>{children}</div>;
}

interface TableListAnimationProps {
  children: ReactNode[];
  staggerDelay?: number;
}

export function TableListAnimation({ children }: TableListAnimationProps) {
  // No animation: render children directly
  return <>{children}</>;
}
