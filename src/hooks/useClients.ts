import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { Cliente } from '../types/database.types';

// ===========================================================================
// useClients — Clientes do estúdio
// ===========================================================================

export function useClients() {
  const { estudioId } = useAuthContext();
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!estudioId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('clientes')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('nome', { ascending: true });

    if (err) {
      setError(err.message);
      setClients([]);
    } else {
      setClients(data ?? []);
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setClients([]);
      setLoading(false);
      return;
    }

    fetchClients();

    const channel = supabase
      .channel(`clientes-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchClients)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchClients, estudioId]);

  return { clients, loading, error, refetch: fetchClients };
}
