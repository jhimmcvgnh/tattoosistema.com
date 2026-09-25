import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_DELAY_MS = 3 * 60 * 1000; // 3 minutos para a primeira exibição
const RECURRING_DELAY_MS = 90 * 1000;    // 1:30 minutos para as próximas exibições

export function useAdPopup() {
  const [isAdOpen, setIsAdOpen] = useState(false);
  const [showNavbarCta, setShowNavbarCta] = useState(() => {
    try {
      return sessionStorage.getItem('ad_navbar_cta_unlocked') === 'true';
    } catch {
      return false;
    }
  });

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
    // Ao carregar o site, não aparece imediatamente: aguarda os 3 minutos
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
    setShowNavbarCta(true);
    try {
      sessionStorage.setItem('ad_navbar_cta_unlocked', 'true');
    } catch {
      // Ignora erro de storage
    }
    // Após fechar no X, programa para reaparecer a cada 1:30 minutos (90s)
    scheduleNextPopup(RECURRING_DELAY_MS);
  }, [scheduleNextPopup]);

  const handleCta = useCallback(() => {
    window.open('https://jimdevtattooquizz-com.vercel.app', '_blank', 'noopener,noreferrer');
    setIsAdOpen(false);
    setShowNavbarCta(true);
    try {
      sessionStorage.setItem('ad_navbar_cta_unlocked', 'true');
    } catch {
      // Ignora erro de storage
    }
    scheduleNextPopup(RECURRING_DELAY_MS);
  }, [scheduleNextPopup]);

  return {
    isAdOpen,
    showNavbarCta,
    handleClose,
    handleCta,
  };
}
