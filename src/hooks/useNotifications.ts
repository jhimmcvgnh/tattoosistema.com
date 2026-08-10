import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { Notificacao } from '../types/database.types';

// ===========================================================================
// useNotifications — Notificações do sistema para o estúdio
// ===========================================================================

function normalizeNotification(n: any): Notificacao {
  return {
    ...n,
    title: n.titulo,
    content: n.mensagem,
    body: n.mensagem,
    read: n.lida,
    created_at: n.criado_em,
  };
}

export function useNotifications() {
  const { estudioId } = useAuthContext();
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!estudioId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('criado_em', { ascending: false })
      .limit(20);

    if (err) {
      setError(err.message);
      setNotifications([]);
    } else {
      setNotifications((data ?? []).map(normalizeNotification));
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    fetchNotifications();

    const channelName = `notificacoes-${estudioId}-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [normalizeNotification(payload.new), ...prev].slice(0, 20));
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => n.id === payload.new.id ? normalizeNotification(payload.new) : n));
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications, estudioId]);

  const markAsRead = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', id);
    if (!err) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true, read: true } : n));
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('notificacoes').delete().eq('id', id);
    if (!err) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const clearAll = useCallback(async () => {
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;
    const { error: err } = await supabase.from('notificacoes').delete().in('id', ids);
    if (!err) setNotifications([]);
  }, [notifications]);

  return { notifications, loading, error, markAsRead, deleteNotification, clearAll };
}
