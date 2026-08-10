import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { Appointment, AppointmentStatus } from '../types/database.types';

// ===========================================================================
// useAppointments — Sincronização em tempo real via Supabase Realtime
// ===========================================================================

export function useAppointments(date?: string) {
  const { estudioId } = useAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (showLoading = false) => {
    if (!estudioId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          servico:servico_id ( id, nome, duracao_minutos, preco ),
          profissional:profissional_id ( id, nome, email, avatar_url, papel, ativo ),
          referencias:agendamento_referencias ( id, url, ordem )
        `)
        .eq('estudio_id', estudioId)
        .order('data_hora_inicio', { ascending: false });

      if (date) {
        query = query.eq('data_agendamento', date);
      }

      const { data, error: err } = await query;

      if (err) throw new Error(err.message);

      const normalized = (data ?? []).map((apt: any): Appointment => {
        let imgUrl = apt.imagem_referencia_url || (apt.referencias && apt.referencias[0]?.url) || null;
        if (!imgUrl && apt.observacoes) {
          const match = apt.observacoes.match(/https?:\/\/[^\s,]+/i);
          if (match) imgUrl = match[0];
        }

        return {
          ...apt,
          servico_nome: apt.servico?.nome ?? apt.servico_nome ?? 'Tatuagem Personalizada',
          imagem_referencia_url: imgUrl,
          valor_cobrado: Number(apt.valor_cobrado ?? 0),
        };
      });

      setAppointments(normalized);
    } catch (e: any) {
      console.error('[useAppointments] Erro ao buscar agendamentos:', e);
      setError(e?.message ?? 'Erro ao carregar agendamentos');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [estudioId, date]);

  useEffect(() => {
    if (!estudioId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    fetchAppointments(true);

    const channelName = `agendamentos-${estudioId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos', filter: `estudio_id=eq.${estudioId}` },
        () => fetchAppointments(false),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAppointments, estudioId]);

  // ===========================================================================
  // Mutações
  // ===========================================================================

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));

    const { error: err } = await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', id);

    if (err) {
      fetchAppointments(false);
      throw new Error(err.message);
    }
  }, [fetchAppointments]);

  const addAppointment = useCallback(async (apt: Partial<Appointment>) => {
    if (!estudioId) throw new Error('Estúdio não carregado.');

    const payload = {
      ...apt,
      estudio_id: estudioId,
      status: apt.status ?? 'pendente',
    };

    const { data: created, error: err } = await supabase
      .from('agendamentos')
      .insert([payload])
      .select()
      .single();

    if (err) throw new Error(err.message);

    if (apt.imagem_referencia_url && created?.id) {
      await supabase.from('agendamento_referencias').insert([{
        agendamento_id: created.id,
        url: apt.imagem_referencia_url,
        ordem: 0,
      }]);
    }
  }, [estudioId]);

  const updateImageLink = useCallback(async (id: string, imageUrl: string) => {
    const cleanUrl = imageUrl.trim();
    if (!cleanUrl) return;

    await Promise.all([
      supabase.from('agendamentos').update({ imagem_referencia_url: cleanUrl }).eq('id', id),
      supabase.from('agendamento_referencias').insert([{
        agendamento_id: id,
        url: cleanUrl,
        ordem: 0,
      }])
    ]);

    fetchAppointments(false);
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: () => fetchAppointments(false),
    updateStatus,
    addAppointment,
    updateImageLink,
  };
}
