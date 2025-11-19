"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition flex min-h-screen w-full flex-col">
      {children}
    </div>
  );
}
