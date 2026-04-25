import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
  appConfig: {
    companyName: string;
    primaryColor: string;
    logoUrl: string;
  };
}

export default function Splash({ onFinish, appConfig }: SplashProps) {
  const [progress, setProgress] = React.useState(0);

  const companyParts = appConfig.companyName.split(' ');
  const part1 = companyParts[0];
  const part2 = companyParts.slice(1).join(' ');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-dark-surface z-[100] flex flex-col items-center justify-center p-8 overflow-hidden scanline">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
      
      {/* 3D Floating Logo Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="mb-32 flex flex-col items-center z-10 w-full max-w-4xl"
      >
        <div className="relative mb-8 floating-3d p-8 sm:p-12 rounded-[40px] w-full">
          <motion.div
            animate={{ 
              rotateX: [0, 3, 0, -3, 0],
              rotateY: [0, -5, 0, 5, 0],
              y: [0, -15, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center scale-110 sm:scale-125 md:scale-150"
          >
            {appConfig.logoUrl && (
              <img src={appConfig.logoUrl} alt="Logo" className="h-16 w-auto mb-4 object-contain" referrerPolicy="no-referrer" />
            )}
            <div className="flex items-center gap-4">
              <span className="text-neon-green neon-text text-6xl sm:text-7xl md:text-9xl font-black italic tracking-tighter uppercase">{part1}</span>
              {part2 && <span className="text-white text-6xl sm:text-7xl md:text-9xl font-black italic tracking-tighter uppercase">{part2}</span>}
            </div>
            <div className="text-[10px] sm:text-base md:text-xl tracking-[0.8em] text-neon-green font-mono font-bold uppercase mt-4">
              Divisão de Performance
            </div>
          </motion.div>
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-neon-green/10 blur-[150px] rounded-full -z-10 animate-pulse" />
        </div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] tracking-[1em] text-white uppercase font-bold text-center mt-8"
        >
          MAIS POTÊNCIA. MAIS RESPOSTA.
        </motion.p>
      </motion.div>

      {/* Full-width Car Track Animation */}
      <div className="w-full max-w-3xl px-12 relative z-10">
        <div className="car-track w-full">
          <motion.div 
            className="car-progress"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Technical Label Below */}
        <div className="mt-12 flex justify-between items-end font-mono">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <span className="text-xs text-neon-green font-bold uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
                {progress < 33 ? "Diagnóstico do Sistema" : progress < 66 ? "Link estabelecido" : "Pronto para implantação"}
              </span>
            </div>
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-medium">
              {progress < 33 ? "> INJETANDO KERNEL_TORQUE_v4.2..." : progress < 66 ? "> CALIBRANDO PERFORMANCE_CORE..." : "> SISTEMA_ESTÁVEL_100%"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 italic">Vmax atingida</span>
            <div className="text-neon-green text-5xl font-black neon-text italic tracking-tighter">
              {progress}
              <span className="text-sm ml-1">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-12 flex items-center gap-6 text-[9px] text-zinc-700 uppercase tracking-[0.4em] font-bold">
        <span>© 2024 {appConfig.companyName}</span>
        <span className="w-1 h-1 bg-zinc-800 rounded-full" />
        <span>NÓ SEGURO: SP-01</span>
      </div>
    </div>
  );
}
