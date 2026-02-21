'use client';

import React from 'react';
import { motion, PanInfo, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  actionColor?: string;
}

export function SwipeableCard({ children, onDelete, onAction, actionIcon, actionLabel, actionColor = 'bg-emerald-500' }: SwipeableCardProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // La opacidad del fondo es 0 al inicio y llega a 1 al deslizar
  const backgroundOpacity = useTransform(x, [-60, -20], [1, 0]);

  const onPanEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -40) {
      controls.start({ x: -160 });
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative mb-6 rounded-[28px] overflow-hidden bg-slate-50">
      {/* Background Actions (Capa inferior) */}
      <motion.div 
        style={{ opacity: backgroundOpacity }}
        className="absolute inset-0 flex justify-end rounded-[28px] overflow-hidden"
      >
        <div className="flex h-full">
          <button 
            type="button"
            onClick={() => { onAction?.(); controls.start({ x: 0 }); }}
            className={cn("w-20 h-full flex flex-col items-center justify-center text-white gap-1", actionColor)}
          >
            {actionIcon || <CheckCircle size={20} />}
            <span className="text-[9px] font-black uppercase">{actionLabel || 'Acción'}</span>
          </button>
          <button 
            type="button"
            onClick={() => { onDelete?.(); controls.start({ x: 0 }); }}
            className="w-20 h-full flex flex-col items-center justify-center bg-rose-500 text-white gap-1"
          >
            <Trash2 size={20} />
            <span className="text-[9px] font-black uppercase">Eliminar</span>
          </button>
        </div>
      </motion.div>

      {/* Foreground Content (Capa superior sólida) */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.05}
        animate={controls}
        onPanEnd={onPanEnd}
        className="relative z-10 bg-white rounded-[28px] shadow-sm ring-1 ring-slate-200/40"
      >
        {children}
      </motion.div>
    </div>
  );
}
