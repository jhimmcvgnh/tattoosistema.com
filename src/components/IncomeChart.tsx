import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { type Appointment } from '../types/database.types';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  startOfDay, 
  endOfDay,
  eachDayOfInterval, 
  eachMonthOfInterval,
  format, 
  isSameDay, 
  isSameMonth,
  parseISO,
  isWithinInterval,
  getHours
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PeriodType, CustomDateRange } from '../hooks/useStats';

interface IncomeChartProps {
  appointments: Appointment[];
  period?: PeriodType;
  targetDate?: Date;
  customRange?: CustomDateRange | null;
}

export const IncomeChart: React.FC<IncomeChartProps> = ({ 
  appointments, 
  period = 'week', 
  targetDate = new Date(),
  customRange 
}) => {
  const [metric, setMetric] = useState<'count' | 'revenue'>('count');
  const [localPeriod, setLocalPeriod] = useState<PeriodType>(period);

  // Sync with prop if it changes
  React.useEffect(() => {
    setLocalPeriod(period);
  }, [period]);

  const chartData = useMemo(() => {
    const baseDate = targetDate instanceof Date && !isNaN(targetDate.getTime()) ? targetDate : new Date();

    if (localPeriod === 'day') {
      // 8 time slots: 08h, 10h, 12h, 14h, 16h, 18h, 20h, 22h
      const hours = [8, 10, 12, 14, 16, 18, 20, 22];
      const dayInterval = { start: startOfDay(baseDate), end: endOfDay(baseDate) };

      const dayAppts = (appointments || []).filter(a => {
        if (!a?.data_hora_inicio) return false;
        try {
          const d = parseISO(a.data_hora_inicio);
          return isWithinInterval(d, dayInterval);
        } catch { return false; }
      });

      return hours.map((hour, idx) => {
        const nextHour = hours[idx + 1] || 24;
        const slotAppts = dayAppts.filter(a => {
          try {
            const h = getHours(parseISO(a.data_hora_inicio));
            return h >= hour && h < nextHour;
          } catch { return false; }
        });

        const revenue = slotAppts
          .filter(a => a.status === 'confirmado' || a.status === 'concluido')
          .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

        return {
          name: `${hour.toString().padStart(2, '0')}:00`,
          fullLabel: `${hour}:00 às ${nextHour}:00`,
          count: slotAppts.length,
          revenue,
          value: metric === 'count' ? slotAppts.length : revenue
        };
      });
    }

    if (localPeriod === 'week') {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const dayAppts = (appointments || []).filter(a => {
          if (!a?.data_hora_inicio) return false;
          try {
            const parsed = parseISO(a.data_hora_inicio);
            return isSameDay(parsed, day);
          } catch { return false; }
        });

        const revenue = dayAppts
          .filter(a => a.status === 'confirmado' || a.status === 'concluido')
          .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

        const dayName = format(day, 'eee', { locale: ptBR }).replace('.', '');
        const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);

        return {
          name: `${capitalized} ${format(day, 'dd')}`,
          fullLabel: format(day, "EEEE, dd 'de' MMMM", { locale: ptBR }),
          count: dayAppts.length,
          revenue,
          value: metric === 'count' ? dayAppts.length : revenue
        };
      });
    }

    if (localPeriod === 'month') {
      const start = startOfMonth(baseDate);
      const end = endOfMonth(baseDate);
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const dayAppts = (appointments || []).filter(a => {
          if (!a?.data_hora_inicio) return false;
          try {
            const parsed = parseISO(a.data_hora_inicio);
            return isSameDay(parsed, day);
          } catch { return false; }
        });

        const revenue = dayAppts
          .filter(a => a.status === 'confirmado' || a.status === 'concluido')
          .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

        return {
          name: format(day, 'dd'),
          fullLabel: format(day, "dd 'de' MMMM", { locale: ptBR }),
          count: dayAppts.length,
          revenue,
          value: metric === 'count' ? dayAppts.length : revenue
        };
      });
    }

    if (localPeriod === 'year') {
      const start = startOfYear(baseDate);
      const end = endOfYear(baseDate);
      const months = eachMonthOfInterval({ start, end });

      return months.map(m => {
        const mAppts = (appointments || []).filter(a => {
          if (!a?.data_hora_inicio) return false;
          try {
            const parsed = parseISO(a.data_hora_inicio);
            return isSameMonth(parsed, m) && parsed.getFullYear() === baseDate.getFullYear();
          } catch { return false; }
        });

        const revenue = mAppts
          .filter(a => a.status === 'confirmado' || a.status === 'concluido')
          .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

        const mName = format(m, 'MMM', { locale: ptBR }).replace('.', '');
        const capitalized = mName.charAt(0).toUpperCase() + mName.slice(1, 3);

        return {
          name: capitalized,
          fullLabel: format(m, "MMMM 'de' yyyy", { locale: ptBR }),
          count: mAppts.length,
          revenue,
          value: metric === 'count' ? mAppts.length : revenue
        };
      });
    }

    // Custom Interval
    if (customRange && customRange.start && customRange.end) {
      const days = eachDayOfInterval({ start: customRange.start, end: customRange.end });
      return days.map(day => {
        const dayAppts = (appointments || []).filter(a => {
          if (!a?.data_hora_inicio) return false;
          try {
            const parsed = parseISO(a.data_hora_inicio);
            return isSameDay(parsed, day);
          } catch { return false; }
        });

        const revenue = dayAppts
          .filter(a => a.status === 'confirmado' || a.status === 'concluido')
          .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

        return {
          name: format(day, 'dd/MM'),
          fullLabel: format(day, "dd 'de' MMMM", { locale: ptBR }),
          count: dayAppts.length,
          revenue,
          value: metric === 'count' ? dayAppts.length : revenue
        };
      });
    }

    return [];
  }, [appointments, localPeriod, targetDate, customRange, metric]);

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  const periodTitle = 
    localPeriod === 'day' ? 'Movimento do Dia' :
    localPeriod === 'week' ? 'Movimento Semanal' :
    localPeriod === 'month' ? 'Movimento Mensal' :
    localPeriod === 'year' ? 'Movimento Anual' : 'Movimento do Período';

  const periodSubtitle = 
    localPeriod === 'day' ? 'Atendimentos por faixa de horário' :
    localPeriod === 'week' ? 'Atendimentos por dia da semana' :
    localPeriod === 'month' ? 'Distribuição diária no mês' :
    localPeriod === 'year' ? 'Evolução mensal ao longo do ano' : 'Distribuição ao longo do período';

  return (
    <div className="glass-card p-6 xl:col-span-1 col-span-1 md:col-span-2 xl:col-start-3 xl:col-end-4 flex flex-col rounded-3xl border border-border-main shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div>
          <h3 className="font-bold text-lg text-text-main">{periodTitle}</h3>
          <p className="text-xs text-text-secondary">{periodSubtitle}</p>
        </div>

        {/* Metric Selector: Count vs Revenue */}
        <div className="flex items-center gap-1 p-0.5 bg-bg-elevated rounded-xl border border-border-main self-end sm:self-auto">
          <button
            onClick={() => setMetric('count')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              metric === 'count'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            Qtd.
          </button>
          <button
            onClick={() => setMetric('revenue')}
            className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              metric === 'revenue'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            R$
          </button>
        </div>
      </div>
      
      {/* Sub-legend */}
      <div className="flex justify-between items-end text-xs text-text-secondary mb-4">
        <span className="font-semibold text-text-main">
          {metric === 'count' ? 'Total de Agendamentos' : 'Faturamento Total'}
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5424] shadow-xs shadow-[#FF5424]/40"></span> 
            Pico
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border-strong dark:bg-zinc-700"></span> 
            Normal
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 5,
              left: metric === 'revenue' ? -10 : -25,
              bottom: 0,
            }}
            barSize={localPeriod === 'month' ? 8 : localPeriod === 'year' ? 16 : 22}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-main)" opacity={0.4} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} 
              dy={10}
              interval={localPeriod === 'month' ? 3 : 0}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
              tickFormatter={(v) => metric === 'revenue' ? `R$${v}` : v}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 6 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-bg-surface/95 backdrop-blur-md p-3 rounded-2xl border border-border-main shadow-xl text-xs space-y-1 z-50">
                      <p className="font-bold text-text-main text-sm">{data.fullLabel || data.name}</p>
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-main/50">
                        <span className="text-text-secondary">Agendamentos:</span>
                        <span className="font-bold text-primary">{data.count}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Faturamento:</span>
                        <span className="font-bold text-emerald-500">
                          R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 2, 2]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value === maxValue && maxValue > 0 ? '#FF5424' : 'rgba(255, 255, 255, 0.15)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
