import { useMemo } from 'react';
import type { Appointment } from '../types/database.types';
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  isWithinInterval, parseISO,
} from 'date-fns';

// ===========================================================================
// useStats — Estatísticas calculadas a partir dos agendamentos
// ===========================================================================

type Period = 'day' | 'week' | 'month' | 'year';

function getPeriodInterval(period: Period) {
  const now = new Date();
  switch (period) {
    case 'day': return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year': return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
  }
}

const COLORS = ['#FF622B', '#FF8C5A', '#CC4A1F', '#FFE0D4'];

export function useStats(period: Period = 'month', appointmentsInput: Appointment[] = []) {
  const appointments = appointmentsInput;
  const loading = false;

  const stats = useMemo(() => {
    const empty = { revenue: 0, appointmentsCount: 0, cancelledCount: 0, revenueGrowth: 0, appointmentsGrowth: 0, popularServices: [] };
    if (loading || !appointments.length) return empty;

    const interval = getPeriodInterval(period);

    const periodAppts = appointments.filter(a => {
      if (!a?.data_hora_inicio) return false;
      try {
        const date = parseISO(a.data_hora_inicio);
        return !isNaN(date.getTime()) && isWithinInterval(date, interval);
      } catch { return false; }
    });

    const revenue = periodAppts
      .filter(a => a.status === 'confirmado' || a.status === 'concluido')
      .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

    const cancelledCount = periodAppts.filter(a => a.status === 'cancelado').length;

    // Contagem de serviços populares
    const serviceCounts: Record<string, { name: string; value: number; color: string }> = {};
    periodAppts.forEach(a => {
      const names = (a.servico?.nome ?? a.servico_nome ?? 'Personalizado')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      names.forEach((name: string) => {
        if (!serviceCounts[name]) {
          serviceCounts[name] = { name, value: 0, color: COLORS[Object.keys(serviceCounts).length % COLORS.length] };
        }
        serviceCounts[name].value++;
      });
    });

    return {
      revenue,
      appointmentsCount: periodAppts.length,
      cancelledCount,
      revenueGrowth: 0,
      appointmentsGrowth: 0,
      popularServices: Object.values(serviceCounts).sort((a, b) => b.value - a.value),
    };
  }, [appointments, loading, period]);

  return { ...stats, loading };
}
