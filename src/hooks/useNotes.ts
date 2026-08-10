import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { Anotacao } from '../types/database.types';

export type Note = Anotacao;

// ===========================================================================
// useNotes — Anotações rápidas (post-its) do estúdio
// ===========================================================================

export function useNotes() {
  const { estudioId, user } = useAuthContext();
  const [notes, setNotes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!estudioId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('anotacoes')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('criado_em', { ascending: false });

    if (err) {
      setError(err.message);
      setNotes([]);
    } else {
      const normalized = (data ?? []).map((n: any): Anotacao => ({
        ...n,
        content: n.conteudo,
        color: n.cor,
        user_id: n.perfil_id,
        created_at: n.criado_em,
      }));
      setNotes(normalized);
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    fetchNotes();

    const channel = supabase
      .channel(`anotacoes-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anotacoes' }, fetchNotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotes, estudioId]);

  const addNote = useCallback(async (content: string, color: string) => {
    if (!estudioId || !user?.id) throw new Error('Usuário não autenticado.');

    const { error: err } = await supabase.from('anotacoes').insert([{
      conteudo: content,
      cor: color,
      estudio_id: estudioId,
      perfil_id: user.id,
    }]);
    if (err) throw new Error(err.message);
    fetchNotes();
  }, [estudioId, user, fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('anotacoes').delete().eq('id', id);
    if (err) throw new Error(err.message);
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, addNote, deleteNote, refetch: fetchNotes };
}
