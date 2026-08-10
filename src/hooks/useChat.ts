import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';
import type { ChatConversa, ChatMensagem } from '../types/database.types';

// ===========================================================================
// useChat — Chat interno da equipe do estúdio
// ===========================================================================

export function useChat() {
  const { estudioId, user } = useAuthContext();
  const [conversations, setConversations] = useState<ChatConversa[]>([]);
  const [activeConversaId, setActiveConversaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMensagem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!estudioId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from('chat_conversas')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('criado_em', { ascending: false });

    if (data && data.length > 0) {
      setConversations(data);
      if (!activeConversaId) {
        setActiveConversaId(data[0].id);
      }
    } else {
      setConversations([]);
    }
    setLoading(false);
  }, [estudioId, activeConversaId]);

  const fetchMessages = useCallback(async (conversaId: string) => {
    const { data } = await supabase
      .from('chat_mensagens')
      .select('*, remetente:remetente_id ( id, nome, avatar_url )')
      .eq('conversa_id', conversaId)
      .order('criado_em', { ascending: true });

    if (data) setMessages(data as any);
  }, []);

  useEffect(() => {
    if (!estudioId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    fetchConversations();
  }, [fetchConversations, estudioId]);

  useEffect(() => {
    if (!activeConversaId) return;
    fetchMessages(activeConversaId);

    const channel = supabase
      .channel(`chat-mensagens-${activeConversaId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mensagens', filter: `conversa_id=eq.${activeConversaId}` },
        (payload) => { setMessages(prev => [...prev, payload.new as ChatMensagem]); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConversaId, fetchMessages]);

  const sendMessage = useCallback(async (
    texto: string,
    arquivoUrl?: string,
    tipoConteudo = 'texto',
  ) => {
    if (!activeConversaId || !user?.id) return;

    await supabase.from('chat_mensagens').insert([{
      conversa_id: activeConversaId,
      remetente_id: user.id,
      texto,
      arquivo_url: arquivoUrl ?? null,
      tipo_conteudo: tipoConteudo,
    }]);
  }, [activeConversaId, user]);

  return { conversations, activeConversaId, setActiveConversaId, messages, loading, sendMessage };
}
