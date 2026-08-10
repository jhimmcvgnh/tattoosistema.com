import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { TransacaoFinanceira } from '../types/database.types';

// ===========================================================================
// useFinance — Transações financeiras do estúdio
// ===========================================================================

export function useFinance() {
  const { estudioId } = useAuthContext();
  const [transactions, setTransactions] = useState<TransacaoFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!estudioId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('data', { ascending: false });

    if (err) {
      setError(err.message);
      setTransactions([]);
    } else {
      setTransactions(data ?? []);
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    fetchTransactions();

    const channel = supabase
      .channel(`transacoes-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras' }, fetchTransactions)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions, estudioId]);

  const addTransaction = useCallback(async (t: {
    tipo: 'entrada' | 'saida';
    categoria: string;
    descricao?: string;
    valor: number;
    data?: string;
  }) => {
    if (!estudioId) throw new Error('Estúdio não identificado. Faça login novamente.');

    const { error: err } = await supabase
      .from('transacoes_financeiras')
      .insert([{
        estudio_id: estudioId,
        tipo: t.tipo,
        categoria: t.categoria,
        descricao: t.descricao ?? null,
        valor: t.valor,
        data: t.data ?? new Date().toISOString(),
      }]);

    if (err) throw new Error(err.message);
    fetchTransactions();
  }, [estudioId, fetchTransactions]);

  return { transactions, loading, error, addTransaction, refetch: fetchTransactions };
}
