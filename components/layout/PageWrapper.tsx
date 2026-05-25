import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] // Ease out cubic
      }}
      className={cn("min-h-screen", className)}
    >
      {children}
    </motion.div>
  );
};

export const LoadingState: React.FC<{ message?: string; minHeight?: string }> = ({ 
    message = "Menghimpun Data...", 
    minHeight = "min-h-[400px]" 
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4 w-full", minHeight)}>
            <div className="relative">
                <div className="h-12 w-12 rounded-2xl border-4 border-slate-50"></div>
                <div className="absolute top-0 h-12 w-12 animate-spin rounded-2xl border-4 border-t-ueu-blue border-r-transparent border-b-transparent border-l-transparent"></div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] animate-pulse">{message}</p>
        </div>
    );
};

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            <div className="relative">
                {/* Outer Ring */}
                <div className="h-20 w-20 rounded-[28px] border-4 border-slate-50"></div>
                {/* Animated Inner Ring */}
                <div className="absolute top-0 h-20 w-20 animate-spin rounded-[28px] border-4 border-t-ueu-blue border-r-transparent border-b-transparent border-l-transparent"></div>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-ueu-navy rounded-xl shadow-lg shadow-blue-900/10 flex items-center justify-center">
                        <div className="w-4 h-4 text-white font-black text-[8px] uppercase">UEU</div>
                    </div>
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center">
                <p className="text-[10px] font-black text-ueu-navy uppercase tracking-[4px] animate-pulse">Memuat Pengalaman</p>
                <div className="flex items-center gap-2 mt-2 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-ueu-blue animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-ueu-blue animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-ueu-blue animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};
