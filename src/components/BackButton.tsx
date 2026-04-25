import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface BackButtonProps {
  onClick: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed top-8 left-8 z-50 flex items-center gap-3 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-neon-green hover:neon-glow transition-all px-6 py-3 bg-dark-card/40 backdrop-blur-md rounded-2xl border border-white/5"
    >
      <ArrowLeft size={16} strokeWidth={3} className="text-neon-green" />
      [[ VOLTAR ]]
    </motion.button>
  );
}
