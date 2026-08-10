import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { Servico } from '../types/database.types';

// ===========================================================================
// useServices — Serviços oferecidos pelo estúdio
// ===========================================================================

export function useServices() {
  const { estudioId } = useAuthContext();
  const [services, setServices] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!estudioId) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('servicos')
      .select('*')
      .eq('estudio_id', estudioId)
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (err) {
      setError(err.message);
      setServices([]);
    } else {
      const normalized = (data ?? []).map((s: any): Servico => ({
        ...s,
        duracao: s.duracao_minutos,
      }));
      setServices(normalized);
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setServices([]);
      setLoading(false);
      return;
    }

    fetchServices();

    const channel = supabase
      .channel(`servicos-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, fetchServices)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchServices, estudioId]);

  return { services, loading, error, refetch: fetchServices };
}
