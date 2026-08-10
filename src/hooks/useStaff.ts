import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { StaffMember } from '../types/database.types';

// ===========================================================================
// useStaff — Membros da equipe do estúdio (tabela perfis)
// ===========================================================================

export function useStaff() {
  const { estudioId } = useAuthContext();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!estudioId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('perfis')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('nome', { ascending: true });

    if (err) {
      setError(err.message);
      setStaff([]);
    } else {
      const normalized = (data ?? []).map((p: any): StaffMember => ({
        ...p,
        name: p.nome,
        role: p.papel,
        cargo: p.papel,
        phone: p.telefone,
        created_at: p.criado_em,
      }));
      setStaff(normalized);
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setStaff([]);
      setLoading(false);
      return;
    }

    fetchStaff();

    const channel = supabase
      .channel(`perfis-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'perfis' }, fetchStaff)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStaff, estudioId]);

  const addStaff = useCallback(async (staffData: Partial<StaffMember>) => {
    if (!estudioId) throw new Error('Estúdio não identificado. Faça login novamente.');

    const { error: err } = await supabase
      .from('perfis')
      .insert([{ ...staffData, estudio_id: estudioId }]);

    if (err) throw new Error(err.message);
    fetchStaff();
  }, [estudioId, fetchStaff]);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>) => {
    const { error: err } = await supabase
      .from('perfis')
      .update(updates)
      .eq('id', id);

    if (err) throw new Error(err.message);
    fetchStaff();
  }, [fetchStaff]);

  return { staff, loading, error, refetch: fetchStaff, addStaff, updateStaff };
}
