import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  CalendarDays,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { format, isSameDay, isSameMonth, isSameYear, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PeriodType, CustomDateRange } from '../hooks/useStats';

interface PeriodNavigatorProps {
  period: PeriodType;
  onPeriodChange: (newPeriod: PeriodType) => void;
  targetDate: Date;
  onTargetDateChange: (newDate: Date) => void;
  customRange: CustomDateRange | null;
  onCustomRangeChange: (range: CustomDateRange | null) => void;
  periodLabel: string;
  totalAppointments?: number;
  totalRevenue?: number;
}

export const PeriodNavigator: React.FC<PeriodNavigatorProps> = ({
  period,
  onPeriodChange,
  targetDate,
  onTargetDateChange,
  customRange,
  onCustomRangeChange,
  periodLabel,
  totalAppointments,
  totalRevenue,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    customRange ? format(customRange.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [tempEndDate, setTempEndDate] = useState(
    customRange ? format(customRange.end, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );

  const isCurrentPeriod = (() => {
    const now = new Date();
    if (period === 'day') return isSameDay(targetDate, now);
    if (period === 'week') return isSameDay(targetDate, now);
    if (period === 'month') return isSameMonth(targetDate, now);
    if (period === 'year') return isSameYear(targetDate, now);
    return false;
  })();

  const handlePrev = () => {
    switch (period) {
      case 'day':
        onTargetDateChange(subDays(targetDate, 1));
        break;
      case 'week':
        onTargetDateChange(subWeeks(targetDate, 1));
        break;
      case 'month':
        onTargetDateChange(subMonths(targetDate, 1));
        break;
      case 'year':
        onTargetDateChange(subYears(targetDate, 1));
        break;
      case 'custom':
        if (customRange) {
          const diffDays = Math.max(1, Math.round((customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24)));
          onCustomRangeChange({
            start: subDays(customRange.start, diffDays),
            end: subDays(customRange.end, diffDays),
          });
        }
        break;
    }
  };

  const handleNext = () => {
    switch (period) {
      case 'day':
        onTargetDateChange(addDays(targetDate, 1));
        break;
      case 'week':
        onTargetDateChange(addWeeks(targetDate, 1));
        break;
      case 'month':
        onTargetDateChange(addMonths(targetDate, 1));
        break;
      case 'year':
        onTargetDateChange(addYears(targetDate, 1));
        break;
      case 'custom':
        if (customRange) {
          const diffDays = Math.max(1, Math.round((customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24)));
          onCustomRangeChange({
            start: addDays(customRange.start, diffDays),
            end: addDays(customRange.end, diffDays),
          });
        }
        break;
    }
  };

  const handleToday = () => {
    onTargetDateChange(new Date());
    if (period === 'custom') {
      onPeriodChange('month');
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempStartDate || !tempEndDate) return;
    const start = new Date(`${tempStartDate}T00:00:00`);
    const end = new Date(`${tempEndDate}T23:59:59`);
    if (start <= end) {
      onCustomRangeChange({ start, end });
      onPeriodChange('custom');
      setShowDatePicker(false);
    } else {
      alert('A data inicial deve ser anterior à data final.');
    }
  };

  const periodOptions: { id: PeriodType; label: string }[] = [
    { id: 'day', label: 'Dia' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
    { id: 'year', label: 'Ano' },
  ];

  return (
    <div className="bg-bg-surface/80 backdrop-blur-md p-3 lg:p-4 rounded-2xl lg:rounded-3xl border border-border-main shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 transition-all duration-200">
      {/* Left: Period Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-bg-elevated rounded-xl border border-border-main overflow-x-auto hide-scrollbar shrink-0">
        {periodOptions.map((opt) => {
          const isActive = period === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                onPeriodChange(opt.id);
                setShowDatePicker(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white shadow-sm shadow-primary/30 scale-[1.02]'
                  : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/60'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            period === 'custom' || showDatePicker
              ? 'bg-[#FF5424]/15 text-[#FF5424] border border-[#FF5424]/30'
              : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/60'
          }`}
          title="Selecionar período customizado ou data específica"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Personalizado</span>
        </button>
      </div>

      {/* Center / Right: Navigation Controls */}
      <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
        <div className="flex items-center bg-bg-elevated border border-border-main rounded-xl p-0.5 shadow-2xs">
          <button
            onClick={handlePrev}
            className="p-1.5 lg:p-2 text-text-secondary hover:text-text-main hover:bg-bg-surface rounded-lg transition-colors cursor-pointer"
            title="Período anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-2.5 lg:px-3.5 py-1 text-xs lg:text-sm font-medium text-text-main hover:text-primary flex items-center gap-2 transition-colors cursor-pointer"
            title="Clique para escolher uma data"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold tracking-tight">{periodLabel}</span>
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 lg:p-2 text-text-secondary hover:text-text-main hover:bg-bg-surface rounded-lg transition-colors cursor-pointer"
            title="Próximo período"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Return to today button if not current */}
        {!isCurrentPeriod && (
          <button
            onClick={handleToday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
            title="Voltar para a data/período atual"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Hoje</span>
          </button>
        )}

        {/* Quick summary pill */}
        {(totalAppointments !== undefined || totalRevenue !== undefined) && (
          <div className="hidden xl:flex items-center gap-3 pl-2 border-l border-border-main text-xs text-text-secondary">
            {totalAppointments !== undefined && (
              <span>
                <strong className="text-text-main font-semibold">{totalAppointments}</strong> agendamentos
              </span>
            )}
            {totalRevenue !== undefined && (
              <span>
                <strong className="text-text-main font-semibold">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Date Picker Dropdown Popover */}
      {showDatePicker && (
        <div className="w-full mt-3 pt-3 border-t border-border-main flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          {period === 'day' ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-primary" /> Escolher dia específico:
              </span>
              <input
                type="date"
                value={format(targetDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    onTargetDateChange(new Date(y, m - 1, d));
                  }
                }}
                className="bg-bg-base border border-border-main rounded-xl px-3 py-1.5 text-xs lg:text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTargetDateChange(new Date())}
                  className="px-2.5 py-1 text-xs bg-bg-elevated hover:bg-bg-surface border border-border-main rounded-lg text-text-main cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  onClick={() => onTargetDateChange(subDays(new Date(), 1))}
                  className="px-2.5 py-1 text-xs bg-bg-elevated hover:bg-bg-surface border border-border-main rounded-lg text-text-main cursor-pointer"
                >
                  Ontem
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyCustomRange} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <CalendarDays className="w-4 h-4 text-primary" /> Intervalo personalizado:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="bg-bg-base border border-border-main rounded-xl px-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  required
                />
                <span className="text-text-secondary text-xs">até</span>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="bg-bg-base border border-border-main rounded-xl px-3 py-1.5 text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
              >
                Aplicar Intervalo
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
