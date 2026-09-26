import React from 'react';
import FocusFrameBorder from '@/components/ui/shine-border-06';
import { Crosshair, X, Wand2, Gift, ArrowRight } from 'lucide-react';

interface AdPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCtaClick: () => void;
}

export const AdPopupModal: React.FC<AdPopupModalProps> = ({
  isOpen,
  onClose,
  onCtaClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <FocusFrameBorder
        duration={2.4}
        color="#00E575"
        className="w-full max-w-lg relative"
      >
        <div className="relative rounded-2xl bg-[#0c0d10] border border-white/10 p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl overflow-hidden">
          {/* Botão Fechar (X) no canto superior direito */}
          <button
            onClick={onClose}
            aria-label="Fechar anúncio"
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-xl bg-[#141518] hover:bg-[#202227] border border-white/10 flex items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <X className="size-5 stroke-[2.5]" />
          </button>

          {/* Ícone Alvo Central */}
          <div className="w-13 h-13 rounded-full bg-[#002f17]/90 border border-[#00E575]/50 flex items-center justify-center mb-3.5 shadow-[0_0_20px_rgba(0,229,117,0.35)]">
            <Crosshair className="size-6 text-[#00E575] stroke-[2.2]" />
          </div>

          {/* Badge Focus Frame */}
          <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-[#002412]/80 border border-[#00E575]/60 text-[#00E575] tracking-wide mb-5">
            Focus Frame
          </div>

          {/* Texto do Anúncio */}
          <p className="text-white text-sm sm:text-base leading-relaxed font-normal max-w-md mb-7 px-1 text-center select-none">
            Gostou da experiência? Quer melhorias? Um design totalmente novo, personalizado e melhorado? Clique no botão abaixo, responda o quiz necessário que não dura nada e ganhe um presente no final por responder!
          </p>

          {/* Linha de Ação: Wand + Botão CTA + Gift */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={onCtaClick}
              title="Novidades e melhorias"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#18191d] hover:bg-[#24262d] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <Wand2 className="size-4 sm:size-5" />
            </button>

            <button
              type="button"
              onClick={onCtaClick}
              className="flex-1 py-3 sm:py-3.5 px-2.5 sm:px-6 rounded-full bg-[#00E575] hover:bg-[#00c966] text-black font-black text-[11px] sm:text-xs md:text-sm tracking-wide sm:tracking-wider uppercase flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_0_25px_rgba(0,229,117,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="truncate">QUERO MEU PROJETO</span>
              <ArrowRight className="size-3.5 sm:size-4 stroke-[3] shrink-0" />
            </button>

            <button
              type="button"
              onClick={onCtaClick}
              title="Ganhe um presente especial"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#18191d] hover:bg-[#24262d] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <Gift className="size-4 sm:size-5" />
            </button>
          </div>
        </div>
      </FocusFrameBorder>
    </div>
  );
};
