import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { type Appointment } from '../lib/supabase';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, appointments }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateReport();
    }
  }, [isOpen]);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Você é um consultor de negócios especializado em studios de tatuagem e body piercing.
        Analise os seguintes dados de agendamentos e gere um relatório detalhado em Português do Brasil.
        
        Dados dos Agendamentos:
        ${JSON.stringify(appointments, null, 2)}
        
        O relatório deve conter as seguintes seções:
        1. **Resumo Executivo**: Um resumo escrito do último mês/semana em relação a tudo (faturamento, volume de clientes, serviços mais procurados).
        2. **Análise de Probabilidade**: Uma análise de probabilidade de resultados futuros baseada na tendência atual.
        3. **Dicas Estratégicas**: Dicas práticas do que fazer para ter mais resultados e aumentar o faturamento.
        
        Use formatação Markdown para deixar o relatório elegante e fácil de ler.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });

      setReport(response.text || 'Não foi possível gerar o relatório.');
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError('Ocorreu um erro ao gerar o relatório inteligente. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-bg-surface rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col border border-border-main overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border-main flex justify-between items-center bg-bg-base">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-lg sm:text-xl">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-text-main">Relatório Inteligente</h2>
              <p className="text-[10px] sm:text-xs text-text-secondary">Análise estratégica baseada em IA</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-bg-elevated rounded-full transition-colors text-text-secondary"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 sm:mb-6"></div>
              <p className="text-base sm:text-lg font-medium text-text-main animate-pulse">
                Gerando análise estratégica...
              </p>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 sm:mt-2">
                Isso pode levar alguns segundos.
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-16 sm:py-20">
              <span className="material-icons-outlined text-5xl sm:text-6xl text-danger mb-3 sm:mb-4">error_outline</span>
              <p className="text-base sm:text-lg font-medium text-text-main">{error}</p>
              <button 
                onClick={generateReport}
                className="mt-4 sm:mt-6 px-6 py-2.5 bg-primary text-primary-text rounded-xl hover:bg-primary-hover transition-colors font-bold text-sm"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="max-w-none markdown-body text-text-main text-sm sm:text-base leading-relaxed">
              <Markdown>{report}</Markdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-6 border-t border-border-main bg-bg-base flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] sm:text-xs text-text-secondary text-center sm:text-left">
            Baseado em {appointments.length} agendamentos recentes.
          </p>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button 
              onClick={generateReport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-primary hover:bg-primary/10 transition-colors border border-primary/20"
            >
              <span className="material-icons-outlined text-sm">refresh</span> Atualizar
            </button>
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 bg-primary hover:bg-primary-hover text-primary-text rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm shadow-primary/20"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
