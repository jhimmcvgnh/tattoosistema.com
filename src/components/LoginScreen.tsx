import React, { useState } from 'react';
import { User, Lock, ArrowRight, Phone, UserCheck, CheckCircle, Zap } from 'lucide-react';
import { NeuralNoise } from './ui/neural-noise';

import { useAuth } from '../hooks/useAuth';

export const LoginScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, loginDemo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Por favor, informe seu nome completo.');
        }
        await register(email.trim(), password, name.trim(), phone.trim());
        setSuccess('Conta criada com sucesso! ✉️ Verifique seu e-mail caso a confirmação esteja ativada no Supabase.');
        setIsRegistering(false);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || '';
      if (msg.includes("Email not confirmed")) {
        setError("Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada ou desative 'Confirm Email' no painel do Supabase.");
      } else if (msg.includes("Invalid login")) {
        setError("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      } else if (msg.includes("already registered") || msg.includes("already exists")) {
        setError("Este e-mail já está cadastrado. Alterne para a tela de Login abaixo.");
      } else if (msg.includes("at least 6 characters")) {
        setError("A senha deve conter no mínimo 6 caracteres.");
      } else {
        setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await loginDemo();
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar no modo teste.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
  };

  return (
    <main className="relative w-screen h-screen bg-black font-display overflow-hidden">
      <NeuralNoise color={[1.0, 0.384, 0.169]} opacity={0.8} speed={0.001} />

      <div className="relative z-10 flex items-center justify-center w-full h-full p-4 pointer-events-none">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl pointer-events-auto">
          
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center items-center text-white mb-4">
              <span className="material-icons-outlined text-3xl text-primary">draw</span>
              <span className="ml-2 font-bold text-2xl tracking-wide">Quizz Tattoo</span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              {isRegistering ? 'Criar Conta' : 'Bem-vindo!'}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {isRegistering ? 'Preencha os dados abaixo para se cadastrar' : 'Faça login para continuar'}
            </p>
          </div>

          {/* Success Notification */}
          {success && (
            <div className="text-green-300 text-xs text-center bg-green-900/50 p-3 rounded-xl border border-green-500/50 animate-in fade-in duration-200 flex items-start gap-2">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-300 text-xs text-center bg-red-900/50 p-3 rounded-xl border border-red-500/50 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Botão Entrar sem Senha (Modo Teste) */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap size={18} className="animate-pulse" />
            Entrar Sem Senha (Modo Teste)
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-400 my-2">
            <div className="h-px bg-white/20 flex-1" />
            <span>ou continue com e-mail</span>
            <div className="h-px bg-white/20 flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {isRegistering && (
              <>
                {/* Nome */}
                <div className="relative z-0">
                  <input
                    type="text"
                    id="floating_name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    placeholder=" "
                    required
                  />
                  <label
                    htmlFor="floating_name"
                    className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    <UserCheck className="inline-block mr-2 -mt-1" size={16} />
                    Nome Completo
                  </label>
                </div>

                {/* Telefone */}
                <div className="relative z-0">
                  <input
                    type="tel"
                    id="floating_phone"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                    placeholder=" "
                  />
                  <label
                    htmlFor="floating_phone"
                    className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                  >
                    <Phone className="inline-block mr-2 -mt-1" size={16} />
                    Telefone / WhatsApp
                  </label>
                </div>
              </>
            )}

            {/* Email */}
            <div className="relative z-0">
              <input
                type="email"
                id="floating_email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                placeholder=" "
                required
                autoComplete="email"
              />
              <label
                htmlFor="floating_email"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <User className="inline-block mr-2 -mt-1" size={16} />
                Endereço de E-mail
              </label>
            </div>

            {/* Password */}
            <div className="relative z-0">
              <input
                type="password"
                id="floating_password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-primary peer"
                placeholder=" "
                required
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
              />
              <label
                htmlFor="floating_password"
                className="absolute text-sm text-gray-300 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                <Lock className="inline-block mr-2 -mt-1" size={16} />
                Senha {isRegistering && '(mínimo 6 caracteres)'}
              </label>
            </div>

            {!isRegistering && (
              <div className="flex items-center justify-between">
                <a href="#" className="text-xs text-gray-300 hover:text-white transition">Esqueceu a Senha?</a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center py-3 px-4 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isRegistering ? 'Cadastrando...' : 'Entrando...'}
                </span>
              ) : (
                <>
                  {isRegistering ? 'Cadastrar Conta' : 'Entrar'}
                  <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-gray-300 hover:text-white transition underline"
            >
              {isRegistering ? (
                <span>Já tem uma conta? <strong className="text-primary">Faça Login</strong></span>
              ) : (
                <span>Não tem uma conta? <strong className="text-primary">Criar Conta</strong></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
