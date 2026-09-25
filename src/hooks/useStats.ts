import { useMemo } from 'react';
import type { Appointment } from '../types/database.types';
import {
  startOfDay, endOfDay, subDays,
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfYear, endOfYear, subYears,
  isWithinInterval, parseISO, format, differenceInCalendarDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ===========================================================================
// useStats — Estatísticas calculadas dinamicamente a partir dos agendamentos
// ===========================================================================

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export interface DateInterval {
  start: Date;
  end: Date;
}

export interface CustomDateRange {
  start: Date;
  end: Date;
}

export function getPeriodIntervals(
  period: PeriodType,
  targetDate: Date = new Date(),
  customRange?: CustomDateRange | null
): { current: DateInterval; previous: DateInterval; label: string; comparisonLabel: string } {
  const baseDate = targetDate instanceof Date && !isNaN(targetDate.getTime()) ? targetDate : new Date();

  switch (period) {
    case 'day': {
      const current = { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      const prevDate = subDays(baseDate, 1);
      const previous = { start: startOfDay(prevDate), end: endOfDay(prevDate) };
      
      const isToday = format(baseDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      const isYesterday = format(baseDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      let label = format(baseDate, "d 'de' MMMM, yyyy", { locale: ptBR });
      if (isToday) label = `Hoje (${format(baseDate, 'dd/MM/yyyy')})`;
      else if (isYesterday) label = `Ontem (${format(baseDate, 'dd/MM/yyyy')})`;

      return {
        current,
        previous,
        label,
        comparisonLabel: 'vs. dia anterior'
      };
    }
    case 'week': {
      const current = { 
        start: startOfWeek(baseDate, { weekStartsOn: 1 }), 
        end: endOfWeek(baseDate, { weekStartsOn: 1 }) 
      };
      const prevDate = subWeeks(baseDate, 1);
      const previous = { 
        start: startOfWeek(prevDate, { weekStartsOn: 1 }), 
        end: endOfWeek(prevDate, { weekStartsOn: 1 }) 
      };
      
      const label = `${format(current.start, 'dd/MM')} a ${format(current.end, 'dd/MM/yyyy')}`;
      return {
        current,
        previous,
        label: `Semana (${label})`,
        comparisonLabel: 'vs. semana anterior'
      };
    }
    case 'month': {
      const current = { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      const prevDate = subMonths(baseDate, 1);
      const previous = { start: startOfMonth(prevDate), end: endOfMonth(prevDate) };
      
      const monthName = format(baseDate, 'MMMM yyyy', { locale: ptBR });
      const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        current,
        previous,
        label: capitalized,
        comparisonLabel: 'vs. mês anterior'
      };
    }
    case 'year': {
      const current = { start: startOfYear(baseDate), end: endOfYear(baseDate) };
      const prevDate = subYears(baseDate, 1);
      const previous = { start: startOfYear(prevDate), end: endOfYear(prevDate) };
      
      return {
        current,
        previous,
        label: `Ano de ${format(baseDate, 'yyyy')}`,
        comparisonLabel: 'vs. ano anterior'
      };
    }
    case 'custom': {
      if (customRange && customRange.start && customRange.end) {
        const current = { 
          start: startOfDay(customRange.start), 
          end: endOfDay(customRange.end) 
        };
        const daysDiff = Math.max(1, differenceInCalendarDays(current.end, current.start) + 1);
        const previous = {
          start: subDays(current.start, daysDiff),
          end: subDays(current.start, 1)
        };
        const label = `${format(current.start, 'dd/MM/yyyy')} - ${format(current.end, 'dd/MM/yyyy')}`;
        return {
          current,
          previous,
          label: `Período (${label})`,
          comparisonLabel: 'vs. período anterior'
        };
      }
      // Fallback to month
      const current = { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      const previous = { start: startOfMonth(subMonths(baseDate, 1)), end: endOfMonth(subMonths(baseDate, 1)) };
      return {
        current,
        previous,
        label: format(baseDate, 'MMMM yyyy', { locale: ptBR }),
        comparisonLabel: 'vs. período anterior'
      };
    }
  }
}

const COLORS = ['#FF5424', '#FF8C5A', '#E04418', '#FFB499', '#CC3B11', '#FFD1C1'];

function parseApptDate(appt: Appointment): Date | null {
  if (!appt?.data_hora_inicio) return null;
  try {
    const date = parseISO(appt.data_hora_inicio);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function useStats(
  period: PeriodType = 'month',
  appointmentsInput: Appointment[] = [],
  targetDate: Date = new Date(),
  customRange?: CustomDateRange | null
) {
  const appointments = appointmentsInput;
  const loading = false;

  const stats = useMemo(() => {
    const intervals = getPeriodIntervals(period, targetDate, customRange);
    const { current, previous, label, comparisonLabel } = intervals;

    if (loading || !appointments || appointments.length === 0) {
      return {
        revenue: 0,
        previousRevenue: 0,
        revenueGrowth: 0,
        revenueTrend: 'up' as 'up' | 'down',
        appointmentsCount: 0,
        previousAppointmentsCount: 0,
        appointmentsGrowth: 0,
        appointmentsTrend: 'up' as 'up' | 'down',
        cancelledCount: 0,
        previousCancelledCount: 0,
        cancelledGrowth: 0,
        cancelledTrend: 'down' as 'up' | 'down',
        completedCount: 0,
        pendingCount: 0,
        popularServices: [],
        periodLabel: label,
        comparisonLabel,
        periodInterval: current,
        filteredAppointments: [] as Appointment[],
      };
    }

    // Filtra agendamentos do período atual
    const periodAppts = appointments.filter(a => {
      const date = parseApptDate(a);
      return date ? isWithinInterval(date, current) : false;
    });

    // Filtra agendamentos do período anterior para cálculo de crescimento real
    const previousAppts = appointments.filter(a => {
      const date = parseApptDate(a);
      return date ? isWithinInterval(date, previous) : false;
    });

    // Faturamento
    const revenue = periodAppts
      .filter(a => a.status === 'confirmado' || a.status === 'concluido')
      .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

    const previousRevenue = previousAppts
      .filter(a => a.status === 'confirmado' || a.status === 'concluido')
      .reduce((acc, a) => acc + (Number(a.valor_cobrado) || 0), 0);

    let revenueGrowth = 0;
    if (previousRevenue > 0) {
      revenueGrowth = Math.round(((revenue - previousRevenue) / previousRevenue) * 100);
    } else if (revenue > 0) {
      revenueGrowth = 100;
    }
    const revenueTrend: 'up' | 'down' = revenueGrowth >= 0 ? 'up' : 'down';

    // Agendamentos
    const appointmentsCount = periodAppts.length;
    const previousAppointmentsCount = previousAppts.length;
    let appointmentsGrowth = 0;
    if (previousAppointmentsCount > 0) {
      appointmentsGrowth = Math.round(((appointmentsCount - previousAppointmentsCount) / previousAppointmentsCount) * 100);
    } else if (appointmentsCount > 0) {
      appointmentsGrowth = 100;
    }
    const appointmentsTrend: 'up' | 'down' = appointmentsGrowth >= 0 ? 'up' : 'down';

    // Cancelamentos
    const cancelledCount = periodAppts.filter(a => a.status === 'cancelado').length;
    const previousCancelledCount = previousAppts.filter(a => a.status === 'cancelado').length;
    let cancelledGrowth = 0;
    if (previousCancelledCount > 0) {
      cancelledGrowth = Math.round(((cancelledCount - previousCancelledCount) / previousCancelledCount) * 100);
    } else if (cancelledCount > 0) {
      cancelledGrowth = 100;
    }
    const cancelledTrend: 'up' | 'down' = cancelledCount <= previousCancelledCount ? 'down' : 'up';

    // Concluídos e Pendentes
    const completedCount = periodAppts.filter(a => a.status === 'concluido').length;
    const pendingCount = periodAppts.filter(a => a.status === 'pendente').length;

    // Contagem de serviços populares no período
    const serviceCounts: Record<string, { name: string; value: number; totalRevenue: number; color: string }> = {};
    periodAppts.forEach(a => {
      const names = (a.servico?.nome ?? a.servico_nome ?? 'Personalizado')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      const val = Number(a.valor_cobrado) || 0;

      names.forEach((name: string) => {
        if (!serviceCounts[name]) {
          const colorIdx = Object.keys(serviceCounts).length % COLORS.length;
          serviceCounts[name] = { 
            name, 
            value: 0, 
            totalRevenue: 0,
            color: COLORS[colorIdx] 
          };
        }
        serviceCounts[name].value++;
        serviceCounts[name].totalRevenue += val;
      });
    });

    const popularServices = Object.values(serviceCounts).sort((a, b) => b.value - a.value);

    return {
      revenue,
      previousRevenue,
      revenueGrowth,
      revenueTrend,
      appointmentsCount,
      previousAppointmentsCount,
      appointmentsGrowth,
      appointmentsTrend,
      cancelledCount,
      previousCancelledCount,
      cancelledGrowth,
      cancelledTrend,
      completedCount,
      pendingCount,
      popularServices,
      periodLabel: label,
      comparisonLabel,
      periodInterval: current,
      filteredAppointments: periodAppts,
    };
  }, [appointments, loading, period, targetDate, customRange]);

  return { ...stats, loading };
}
