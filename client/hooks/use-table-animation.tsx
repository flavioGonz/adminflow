"use client";

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
  // No-op variants for compatibility; animations removed for performance
  const containerVariants = {} as const;
  const rowVariants = {} as const;
  const MotionTableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody {...props} />
  );

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
  // Render plain tbody without animations
  return <tbody>{children}</tbody>;
}

// Helper component for wrapping individual rows
type AnimatedRowProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  onClick?: () => void;
};

export function AnimatedRow({ children, delay = 0, className, onClick }: AnimatedRowProps) {
  // Render plain tr without animations
  return (
    <tr
      onClick={onClick}
      className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className ?? ""}`}
    >
      {children}
    </tr>
  );
}
