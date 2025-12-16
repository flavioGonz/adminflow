"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TableRowAnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

export function TableRowAnimation({ 
  children, 
  delay = 0,
  duration = 0.4 
}: TableRowAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1], // cubic-bezier for smooth spring effect
      }}
    >
      {children}
    </motion.div>
  );
}

interface TableListAnimationProps {
  children: ReactNode[];
  staggerDelay?: number;
}

export function TableListAnimation({ 
  children, 
  staggerDelay = 0.05 
}: TableListAnimationProps) {
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
            delayChildren: 0,
          },
        },
      }}
    >
      {children.map((child, index) => (
        <TableRowAnimation key={index} delay={index * staggerDelay}>
          {child}
        </TableRowAnimation>
      ))}
    </motion.div>
  );
}
