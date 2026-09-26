import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_DELAY_MS = 55 * 1000; // 55 segundos para a primeira exibição
const RECURRING_DELAY_MS = 55 * 1000; // 55 segundos para as próximas exibições

export function useAdPopup() {
  const [isAdOpen, setIsAdOpen] = useState(false);
  // Sempre começa como falso ao entrar ou recarregar a página
  const [showNavbarCta, setShowNavbarCta] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNextPopup = useCallback((delayMs: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setIsAdOpen(true);
    }, delayMs);
  }, []);

  useEffect(() => {
    // Limpa qualquer dado residual de storage para garantir estado inicial limpo
    try {
      sessionStorage.removeItem('ad_navbar_cta_unlocked');
    } catch {
      // Ignora erro de storage
    }

    // Ao carregar o site, não aparece imediatamente: aguarda os 55 segundos
    scheduleNextPopup(INITIAL_DELAY_MS);

    // Atalho global para teste e validação imediata no console se necessário
    (window as any).__triggerAdPopup = () => {
      setIsAdOpen(true);
    };

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      delete (window as any).__triggerAdPopup;
    };
  }, [scheduleNextPopup]);

  const handleClose = useCallback(() => {
    setIsAdOpen(false);
    // Somente após o usuário fechar o anúncio no X os elementos pós-anúncio aparecem
    setShowNavbarCta(true);
    // Agenda para reaparecer a cada 55 segundos
    scheduleNextPopup(RECURRING_DELAY_MS);
  }, [scheduleNextPopup]);

  const handleCta = useCallback(() => {
    window.open('https://jimdevtattooquizz-com.vercel.app', '_blank', 'noopener,noreferrer');
    setIsAdOpen(false);
    setShowNavbarCta(true);
    scheduleNextPopup(RECURRING_DELAY_MS);
  }, [scheduleNextPopup]);

  return {
    isAdOpen,
    showNavbarCta,
    handleClose,
    handleCta,
  };
}
