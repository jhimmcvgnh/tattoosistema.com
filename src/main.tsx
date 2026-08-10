import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/auth-context.tsx';
import './index.css';

// ===========================================================================
// ErrorBoundary — Captura erros de renderização e exibe mensagem amigável
// ===========================================================================

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.name === 'TypeError';

    if (isChunkError && !sessionStorage.getItem('chunk_reload_auto')) {
      sessionStorage.setItem('chunk_reload_auto', 'true');
      window.location.reload();
    }
  }

  handleReload = () => {
    sessionStorage.removeItem('chunk_reload_auto');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module');
      return (
        <div className="min-h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-6 font-display">
          <div className="max-w-lg w-full bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold">!</div>
            <h2 className="text-2xl font-bold text-white">
              {isChunkError ? 'Nova versão disponível' : 'Ops! Algo deu errado'}
            </h2>
            <p className="text-sm text-gray-300">
              {isChunkError
                ? 'O sistema foi atualizado. Clique abaixo para carregar a versão mais recente.'
                : 'Ocorreu um erro inesperado ao carregar a tela.'}
            </p>
            {this.state.error && !isChunkError && (
              <div className="bg-black/50 p-4 rounded-xl text-left border border-white/10 overflow-auto max-h-40 text-xs text-red-300 font-mono">
                <p className="font-bold text-red-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-gray-400 whitespace-pre-wrap mt-2">{this.state.error.stack}</pre>
                )}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              Atualizar e Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ===========================================================================
// Bootstrap da aplicação
// ===========================================================================

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
