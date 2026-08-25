import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { NeuralNoise } from './ui/neural-noise';

import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes("Email not confirmed")) {
        setError("Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada.");
      } else if (msg.includes("Invalid login")) {
        setError("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      } else {
        setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-black font-display overflow-hidden">
      <NeuralNoise color={[1.0, 0.384, 0.169]} opacity={0.8} speed={0.001} />

      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 pointer-events-none">
        <div className="w-full max-w-md p-8 space-y-5 bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="text-center mb-2">
            <div className="flex justify-center items-center text-white mb-3">
              <span className="material-icons-outlined text-3xl text-primary">draw</span>
              <span className="ml-2 font-bold text-2xl tracking-wide">Quizz Tattoo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Bem-vindo!
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Faça login para continuar
            </p>
          </div>

          {/* Success Notification */}
          {success && (
            <div className="text-green-300 text-xs text-center bg-green-950/60 p-3 rounded-xl border border-green-500/40 flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-300 text-xs text-center bg-red-950/60 p-3 rounded-xl border border-red-500/40">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="input_email" className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                <Mail size={14} className="text-primary" />
                <span>Endereço de E-mail</span>
              </label>
              <input
                type="email"
                id="input_email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full px-4 py-3 bg-black/40 hover:bg-black/50 focus:bg-black/60 text-white placeholder-gray-500 text-sm rounded-xl border border-white/15 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="seu.email@exemplo.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="input_password" className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                  <Lock size={14} className="text-primary" />
                  <span>Senha</span>
                </label>
                <a href="#" className="text-xs text-gray-400 hover:text-primary transition-colors">
                  Esqueceu a Senha?
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input_password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full pl-4 pr-11 py-3 bg-black/40 hover:bg-black/50 focus:bg-black/60 text-white placeholder-gray-500 text-sm rounded-xl border border-white/15 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1.5 text-gray-400 hover:text-white transition-colors focus:outline-none rounded-lg hover:bg-white/10 cursor-pointer"
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center py-3.5 px-4 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-primary shadow-lg shadow-primary/25 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

