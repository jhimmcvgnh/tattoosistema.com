import React from 'react';
import type { PeriodType } from '../hooks/useStats';

interface StatCardProps {
  title: string;
  amount: string | number;
  percentage: string;
  trend: 'up' | 'down';
  icon: string;
  isPrimary?: boolean;
  period: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  comparisonLabel?: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  amount, 
  percentage, 
  trend, 
  icon, 
  isPrimary,
  period,
  onPeriodChange,
  comparisonLabel,
  subtext
}) => {
  const periodOptions: { id: PeriodType; label: string }[] = [
    { id: 'day', label: 'Dia' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
  ];

  return (
    <div
      className={`glass-card p-4 sm:p-6 flex flex-col justify-between rounded-2xl sm:rounded-3xl transition-all duration-300 relative overflow-hidden group ${
        isPrimary 
          ? 'bg-gradient-to-br from-[#FF5424] to-[#E04418] text-white border-none shadow-lg shadow-[#FF5424]/15' 
          : 'bg-bg-surface text-text-main border border-border-main shadow-xs hover:border-primary/40'
      }`}
    >
      {/* Background glow decoration for primary */}
      {isPrimary && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex flex-col gap-1.5">
          <span className={`text-sm font-semibold tracking-wide ${isPrimary ? 'text-white/90' : 'text-text-secondary'}`}>
            {title}
          </span>

          {/* Mini Period Selector if onPeriodChange is provided */}
          {onPeriodChange && (
            <div className={`flex items-center gap-1 p-0.5 rounded-xl w-fit ${isPrimary ? 'bg-black/20 backdrop-blur-sm' : 'bg-bg-elevated border border-border-main'}`}>
              {periodOptions.map((opt) => {
                const isActive = period === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPeriodChange(opt.id);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive
                        ? isPrimary
                          ? 'bg-white text-[#FF5424] shadow-xs scale-105'
                          : 'bg-bg-surface text-primary shadow-xs border border-border-main scale-105'
                        : isPrimary
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-transform duration-200 group-hover:scale-110 ${
          isPrimary 
            ? 'bg-white/15 border-white/25 text-white backdrop-blur-sm' 
            : 'bg-bg-elevated border-border-main text-text-secondary'
        }`}>
          <span className="material-icons-outlined text-xl">{icon}</span>
        </div>
      </div>

      <div className="relative z-10">
        <h3 className={`text-3xl lg:text-5xl font-extrabold mb-3 tracking-tight ${isPrimary ? 'text-white' : 'text-text-main'}`}>
          {amount}
        </h3>

        <div className={`flex items-center gap-2 text-xs font-medium flex-wrap ${isPrimary ? 'text-white/90' : 'text-text-secondary'}`}>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-transform duration-200 ${
              isPrimary
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : trend === 'up'
                  ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            <span className="material-icons-outlined text-[13px] mr-1">
              {trend === 'up' ? 'arrow_upward' : 'arrow_downward'}
            </span> 
            {percentage}
          </span>
          <span className="opacity-90">
            {comparisonLabel || subtext || (
              period === 'day' ? 'vs. ontem' :
              period === 'week' ? 'vs. semana anterior' :
              period === 'month' ? 'vs. mês anterior' :
              period === 'year' ? 'vs. ano anterior' :
              'comparado ao período anterior'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
