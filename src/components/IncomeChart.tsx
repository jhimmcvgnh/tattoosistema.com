import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { type Appointment } from '../lib/supabase';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IncomeChartProps {
  appointments: Appointment[];
}

export const IncomeChart: React.FC<IncomeChartProps> = ({ appointments }) => {
  const data = React.useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayAppts = (appointments || []).filter(a => {
        if (!a || !a.data_hora_inicio || typeof a.data_hora_inicio !== 'string') return false;
        try {
          const parsed = parseISO(a.data_hora_inicio);
          if (isNaN(parsed.getTime())) return false;
          return isSameDay(parsed, day);
        } catch {
          return false;
        }
      });
      return {
        name: format(day, 'eee', { locale: ptBR }).replace('.', '').charAt(0).toUpperCase() + format(day, 'eee', { locale: ptBR }).slice(1, 3),
        activity: dayAppts.length
      };
    });
  }, [appointments]);

  const maxActivity = Math.max(...data.map(d => d.activity), 1);

  return (
    <div className="glass-card p-6 xl:col-span-1 col-span-1 md:col-span-2 xl:col-start-3 xl:col-end-4 flex flex-col">
      <div className="mb-6">
        <h3 className="font-bold text-lg text-text-main">Movimento Semanal</h3>
        <p className="text-sm text-text-secondary">Atendimentos por dia da semana</p>
      </div>
      
      <div className="flex justify-between items-end text-xs text-text-secondary mb-4">
        <span className="font-medium text-text-main">Atendimentos</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5424]"></span> Dia Mais Cheio</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Normal</span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 0,
              left: -25,
              bottom: 0,
            }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-main)" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-surface)', 
                borderColor: 'var(--color-border-main)', 
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-text-main)'
              }}
              itemStyle={{ color: 'var(--color-text-main)' }}
            />
            <Bar dataKey="activity" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.activity === maxActivity && maxActivity > 0 ? '#FF5424' : '#E5E7EB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
