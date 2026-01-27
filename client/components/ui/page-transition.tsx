"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

interface TablePageTransitionProps {
  children: ReactNode;
  pageKey: number | string;
}

export function TablePageTransition({ children, pageKey }: TablePageTransitionProps) {
  return (
    <AnimatePresence initial={false}>
      <motion.tbody
        key={pageKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.15,
          ease: "easeInOut",
        }}
        data-slot="table-body"
        className="[&_tr:last-child]:border-0"
      >
        {children}
      </motion.tbody>
    </AnimatePresence>
  );
}
