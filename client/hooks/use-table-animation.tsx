"use client";

import { motion } from "framer-motion";

interface UseTableAnimationProps {
  staggerDelay?: number;
  rowDelay?: number;
  duration?: number;
}

export function useTableAnimation({
  staggerDelay = 0.05,
  rowDelay = 0,
  duration = 0.4,
}: UseTableAnimationProps = {}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: rowDelay,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
        ease: [0.34, 1.56, 0.64, 1], // cubic-bezier for smooth spring effect
      },
    },
  };

  const MotionTableBody = motion.tbody;

  return {
    MotionTableBody,
    containerVariants,
    rowVariants,
  };
}

// Helper component for wrapping table body with animations
interface AnimatedTableBodyProps {
  children: React.ReactNode;
  staggerDelay?: number;
  rowDelay?: number;
}

export function AnimatedTableBody({
  children,
  staggerDelay = 0.05,
  rowDelay = 0,
}: AnimatedTableBodyProps) {
  const { MotionTableBody, containerVariants } = useTableAnimation({
    staggerDelay,
    rowDelay,
  });

  return (
    <MotionTableBody
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </MotionTableBody>
  );
}

// Helper component for wrapping individual rows
interface AnimatedRowProps {
  children: React.ReactNode;
  delay?: number;
}

export function AnimatedRow({ children, delay = 0 }: AnimatedRowProps) {
  const { rowVariants } = useTableAnimation();

  return (
    <motion.tr
      variants={rowVariants}
      transition={{
        delay,
      }}
    >
      {children}
    </motion.tr>
  );
}
