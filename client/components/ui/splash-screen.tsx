'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6"
          >
            <div className="h-24 w-24 rounded-[28px] bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl shadow-emerald-200">
              A
            </div>
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">AdminFlow</h1>
              <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-xs mt-2">Infratec Solutions</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-12"
          >
            <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-48, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="h-full w-full bg-emerald-500"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
