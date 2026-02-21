'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function PageTransition({ children, pageKey }: { children: React.ReactNode, pageKey?: any }) {
  const pathname = usePathname();
  const activeKey = pageKey || pathname;

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className='w-full h-full min-h-screen'
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export const TablePageTransition = PageTransition;
