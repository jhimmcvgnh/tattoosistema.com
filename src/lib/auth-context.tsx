import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import type { Perfil } from '../types/database.types';
import type { Session, User } from '@supabase/supabase-js';

// ===========================================================================
// Auth Context — Fonte única da verdade para autenticação e estudio_id
// ===========================================================================

interface AuthContextValue {
  user: User | null;
  profile: Perfil | null;
  estudioId: string | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; avatar_url?: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ===========================================================================
// Provider
// ===========================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega o perfil do usuário a partir do banco uma única vez por sessão
  const loadProfile = useCallback(async (userId: string) => {
    try {
      // Timeout de 4s na query para nunca bloquear o login
      const queryPromise = supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 4000)
      );

      const { data } = (await Promise.race([queryPromise, timeoutPromise])) as any;

      if (data) {
        setProfile(data as Perfil);
      }
    } catch (err) {
      console.error('[loadProfile] Erro ao carregar perfil:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Timeout de segurança absoluto (3.5s) que garante a liberação da tela de loading
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3500);

    // Verifica sessão existente na inicialização
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!mounted) return;
        setSession(s);
        if (s?.user) {
          loadProfile(s.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[auth] Erro ao buscar sessão:', err);
        if (mounted) setLoading(false);
      });

    // Escuta mudanças de auth (login, logout, refresh de token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone: string,
  ) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nome: name,
          telefone: phone,
          nome_estudio: `Estúdio de ${name}`,
        },
      },
    });
    if (error) throw error;
  }, []);

  const loginDemo = useCallback(async () => {
    const demoEmail = 'demo@tattooquizz.com';
    const demoPass = '123456';
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (error) {
        // Se a conta demo ainda não existe no Supabase, cadastra de verdade
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPass,
          options: {
            data: {
              nome: 'Usuário Demonstrativo',
              telefone: '(11) 99999-9999',
              nome_estudio: 'Estúdio Demo Tattoo',
            },
          },
        });

        if (signUpError && !signUpError.message?.includes('already registered')) {
          throw signUpError;
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPass,
        });

        if (retryError) throw retryError;
      }
    } catch (err: any) {
      console.error('Falha ao entrar no modo demo:', err);
      throw new Error(err?.message || 'Não foi possível entrar no modo de demonstração. Tente novamente em instantes.');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; phone?: string; avatar_url?: string }) => {
    if (!session?.user) throw new Error('Usuário não autenticado.');

    const payload: any = {};
    if (updates.name !== undefined) payload.nome = updates.name.trim();
    if (updates.phone !== undefined) payload.telefone = updates.phone.trim();
    if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url.trim();

    const { data: updated, error: err } = await supabase
      .from('perfis')
      .update(payload)
      .eq('id', session.user.id)
      .select()
      .maybeSingle();

    if (err) throw new Error(err.message);

    if (updated) {
      setProfile(updated as Perfil);
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    profile,
    estudioId: profile?.estudio_id ?? null,
    session,
    loading,
    login,
    register,
    loginDemo,
    logout,
    updateProfile,
    isAuthenticated: !!session?.user,
  }), [session, profile, loading, login, register, loginDemo, logout, updateProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================================================
// Hook de consumo
// ===========================================================================

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
