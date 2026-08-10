import React from 'react';

interface StatCardProps {
  title: string;
  amount: string | number;
  percentage: string;
  trend: 'up' | 'down';
  icon: string;
  isPrimary?: boolean;
  period: 'week' | 'month';
  onPeriodChange: (period: 'week' | 'month') => void;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  amount, 
  percentage, 
  trend, 
  icon, 
  isPrimary,
  period,
  onPeriodChange
}) => {
  return (
    <div
      className={`glass-card p-6 flex flex-col justify-between rounded-3xl transition-all duration-200 ${
        isPrimary 
          ? 'bg-[#FF5424] text-white border-none shadow-md' 
          : 'bg-bg-surface text-text-main border border-border-main shadow-xs'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1.5">
          <span className={`text-sm font-semibold ${isPrimary ? 'text-white' : 'text-text-secondary'}`}>
            {title}
          </span>
          <div className={`flex items-center gap-1 p-0.5 rounded-lg w-fit ${isPrimary ? 'bg-white/20' : 'bg-bg-elevated'}`}>
            <button 
              onClick={(e) => { e.stopPropagation(); onPeriodChange('week'); }}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                period === 'week' 
                  ? (isPrimary ? 'bg-white text-[#FF5424] shadow-xs' : 'bg-bg-surface text-text-main shadow-xs') 
                  : (isPrimary ? 'text-white/80 hover:text-white' : 'text-text-secondary hover:text-text-main')
              }`}
            >
              Semana
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onPeriodChange('month'); }}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                period === 'month' 
                  ? (isPrimary ? 'bg-white text-[#FF5424] shadow-xs' : 'bg-bg-surface text-text-main shadow-xs') 
                  : (isPrimary ? 'text-white/80 hover:text-white' : 'text-text-secondary hover:text-text-main')
              }`}
            >
              Mês
            </button>
          </div>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
          isPrimary ? 'bg-white/20 border-white/30 text-white' : 'bg-bg-elevated border-border-main text-text-secondary'
        }`}>
          <span className="material-icons-outlined text-lg">{icon}</span>
        </div>
      </div>
      <div>
        <h3 className={`text-5xl font-extrabold mb-3 tracking-tight ${isPrimary ? 'text-white' : 'text-text-main'}`}>
          {amount}
        </h3>
        <div className={`flex items-center gap-2 text-xs font-medium ${isPrimary ? 'text-white/90' : 'text-text-secondary'}`}>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
            style={isPrimary
              ? { background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }
              : trend === 'up'
                ? { background: '#DCFCE7', color: '#16A34A' }
                : { background: '#FEE2E2', color: '#DC2626' }
            }
          >
            <span className="material-icons-outlined text-[13px] mr-1">
              {trend === 'up' ? 'arrow_upward' : 'arrow_downward'}
            </span> 
            {percentage}
          </span>
          <span>{period === 'week' ? 'Esta semana' : 'Este mês'}</span>
        </div>
      </div>
    </div>
  );
};
