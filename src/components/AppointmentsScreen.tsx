import React, { useState, useRef } from 'react';
import { AddAppointmentModal } from './AddAppointmentModal';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import * as XLSX from 'xlsx';

import { type Appointment, type AppointmentStatus } from '../types/database.types';

// Types
export type ViewType = 'kanban' | 'calendar' | 'list';

interface AppointmentsScreenProps {
  appointments: Appointment[];
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  addAppointment?: (apt: Partial<Appointment>) => Promise<void>;
  updateImageLink?: (id: string, imageUrl: string) => Promise<void>;
}

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({ 
  appointments, 
  updateStatus, 
  addAppointment,
  updateImageLink 
}) => {
  const [view, setView] = useState<ViewType>('kanban');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openDetailModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsDetailModalOpen(true);
  };

  const handleAddAppointment = async (newAppointmentData: any) => {
    if (addAppointment) {
      await addAppointment(newAppointmentData);
    }
    setIsAddModalOpen(false);
  };

  const handleExport = () => {
    const exportData = appointments.map(apt => ({
      'ID': apt.id,
      'Cliente': apt.cliente_nome,
      'E-mail': apt.cliente_email,
      'Telefone': apt.cliente_telefone,
      'Data e Hora': apt.data_hora_inicio,
      'Serviço': apt.servico?.nome || apt.servico_nome || 'Personalizado',
      'Status': apt.status === 'pendente' ? 'Pendente' : 
                apt.status === 'confirmado' ? 'Confirmado' : 
                apt.status === 'concluido' ? 'Concluído' : 'Cancelado',
      'Valor': Number(apt.valor_cobrado || 0).toFixed(2),
      'Link da Imagem': apt.imagem_referencia_url || 'Sem foto'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Agendamentos");
    XLSX.writeFile(workbook, `agendamentos-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    alert('Importação temporariamente desabilitada enquanto migramos para o Supabase.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getUrgencyColor = (price: number) => {
    if (price >= 60) return 'bg-danger/10 text-danger border border-danger/20';
    if (price >= 40) return 'bg-warning/10 text-warning border border-warning/20';
    return 'bg-success/10 text-success border border-success/20';
  };

  const getUrgencyLabel = (price: number) => {
    if (price >= 60) return 'Alta';
    if (price >= 40) return 'Média';
    return 'Baixa';
  };

  const handleContact = (phone: string) => {
    window.open(`https://wa.me/55${phone.replace(/\D/g, '')}`, '_blank');
  };

  const hasAppointmentImage = (apt: Appointment) => {
    return Boolean(
      (apt.imagem_referencia_url && apt.imagem_referencia_url.trim()) ||
      (apt.referencias && apt.referencias.length > 0) ||
      (apt.observacoes && /https?:\/\/[^\s,]+/i.test(apt.observacoes))
    );
  };

  const currentYearMonth = new Date().toISOString().substring(0, 7);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Agendamentos</h2>
          <p className="text-text-secondary">Gerencie seus horários e clientes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-bg-elevated p-1 rounded-xl">
            {(['kanban', 'calendar', 'list'] as ViewType[]).map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${view === v ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-secondary hover:text-primary hover:bg-bg-surface'}`}
              >
                <span className="material-icons-outlined text-sm">{v === 'kanban' ? 'view_kanban' : v === 'calendar' ? 'calendar_month' : 'table_rows'}</span> 
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-primary/20 text-sm"
          >
            <span className="material-icons-outlined text-sm">add</span> Novo
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {view === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto pb-4 h-full">
            {[
              { id: 'pendente' as AppointmentStatus, title: 'Pendente' },
              { id: 'confirmado' as AppointmentStatus, title: 'Confirmado' },
              { id: 'concluido' as AppointmentStatus, title: 'Concluído' },
            ].map(col => (
              <div key={col.id} className="flex-1 min-w-[300px] bg-bg-base rounded-2xl p-4 flex flex-col">
                <h3 className="font-bold text-text-main mb-4 flex items-center justify-between">
                  {col.title}
                  <span className="bg-bg-surface px-2 py-0.5 rounded-full text-xs text-text-secondary">
                    {appointments.filter(a => a.status === col.id).length}
                  </span>
                </h3>
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 hide-scrollbar">
                  {appointments.filter(a => a.status === col.id).map(apt => (
                    <div 
                      key={apt.id} 
                      className="bg-bg-surface p-4 rounded-xl shadow-sm border border-border-main hover:shadow-md transition-all group cursor-pointer"
                      onClick={() => openDetailModal(apt)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getUrgencyColor(Number(apt.valor_cobrado) || 0)}`}>
                          {getUrgencyLabel(Number(apt.valor_cobrado) || 0)}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(apt);
                          }}
                          className="text-text-secondary hover:text-text-main p-1 rounded-lg hover:bg-bg-elevated"
                        >
                          <span className="material-icons-outlined text-sm">more_horiz</span>
                        </button>
                      </div>
                      <h4 className="font-bold text-text-main group-hover:text-primary transition-colors">{apt.cliente_nome}</h4>
                      <p className="text-sm text-text-secondary mb-3">{apt.servico?.nome || apt.servico_nome || 'Personalizado'}</p>
                      
                      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary mb-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="material-icons-outlined text-sm shrink-0">event</span>
                          <span className="truncate">
                            {apt?.data_hora_inicio ? new Date(apt.data_hora_inicio).toLocaleString('pt-BR') : 'Data N/A'}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(apt);
                          }}
                          title={hasAppointmentImage(apt) ? "Ver imagem e detalhes" : "Adicionar/Ver foto"}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                            hasAppointmentImage(apt) 
                              ? 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 shadow-xs' 
                              : 'bg-bg-elevated text-text-secondary hover:text-text-main hover:bg-bg-base border border-border-main'
                          }`}
                        >
                          <span className="material-icons-outlined text-sm">collections</span>
                          <span>{hasAppointmentImage(apt) ? 'Foto' : '+ Foto'}</span>
                        </button>
                      </div>

                      <div className="flex gap-2 mt-2 pt-3 border-t border-border-main" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleContact(apt.cliente_telefone || '')}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                        >
                          <span className="material-icons-outlined text-sm">whatsapp</span> Contato
                        </button>
                        {apt.status === 'pendente' && (
                          <button 
                            onClick={() => updateStatus(apt.id, 'confirmado')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary text-primary-text text-xs font-bold hover:bg-primary-hover transition-colors"
                          >
                            Confirmar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && (
          <div className="bg-bg-surface rounded-3xl shadow-sm border border-border-main overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-bg-base">
                  <tr>
                    <th className="p-4 text-sm font-medium text-text-secondary">Cliente</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Contato</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Serviço</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Data e Hora</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Imagem</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Urgência</th>
                    <th className="p-4 text-sm font-medium text-text-secondary">Status</th>
                    <th className="p-4 text-sm font-medium text-text-secondary text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr 
                      key={apt.id} 
                      className="border-b border-border-main last:border-0 hover:bg-bg-elevated transition-colors cursor-pointer"
                      onClick={() => openDetailModal(apt)}
                    >
                      <td className="p-4">
                        <div className="font-medium text-text-main">{apt.cliente_nome}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-text-main">{apt.cliente_email}</div>
                        <div className="text-xs text-text-secondary">{apt.cliente_telefone}</div>
                      </td>
                      <td className="p-4 text-sm text-text-main">{apt.servico?.nome || apt.servico_nome || 'Personalizado'}</td>
                      <td className="p-4 text-sm text-text-secondary">
                        {apt?.data_hora_inicio ? new Date(apt.data_hora_inicio).toLocaleString('pt-BR') : 'Data N/A'}
                      </td>
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openDetailModal(apt)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            hasAppointmentImage(apt) 
                              ? 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30' 
                              : 'bg-bg-elevated text-text-secondary hover:text-text-main'
                          }`}
                        >
                          <span className="material-icons-outlined text-sm">collections</span>
                          <span>{hasAppointmentImage(apt) ? 'Foto' : '+ Foto'}</span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(Number(apt.valor_cobrado) || 0)}`}>
                          {getUrgencyLabel(Number(apt.valor_cobrado) || 0)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize border 
                          ${apt.status === 'confirmado' ? 'bg-info/10 text-info border-info/20' : 
                            apt.status === 'concluido' ? 'bg-success/10 text-success border-success/20' : 
                            'bg-warning/10 text-warning border-warning/20'}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleContact(apt.cliente_telefone || '')}
                          className="p-2 hover:bg-bg-elevated rounded-lg text-success transition-colors" 
                          title="Entrar em contato"
                        >
                          <span className="material-icons-outlined text-lg">whatsapp</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="bg-bg-surface rounded-3xl shadow-sm border border-border-main p-6 h-full flex flex-col overflow-hidden">
            <div className="overflow-x-auto h-full">
              <div className="min-w-[800px] h-full flex flex-col">
                <div className="grid grid-cols-7 gap-4 mb-4 text-center">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-sm font-medium text-text-secondary uppercase">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                    const dateStr = `${currentYearMonth}-${day.toString().padStart(2, '0')}`;
                    const dayAppointments = (appointments || []).filter(a => a && a.data_hora_inicio && typeof a.data_hora_inicio === 'string' && a.data_hora_inicio.startsWith(dateStr));
                    return (
                      <div key={day} className="border border-border-main rounded-xl p-2 flex flex-col gap-1 min-h-[100px] hover:bg-bg-elevated transition-colors">
                        <span className="text-sm font-medium text-text-secondary">{day}</span>
                        <div className="flex flex-col gap-1 overflow-y-auto hide-scrollbar">
                          {dayAppointments.map(apt => (
                            <div 
                              key={apt.id} 
                              onClick={() => openDetailModal(apt)}
                              className={`text-[10px] p-1 rounded truncate cursor-pointer hover:opacity-80 flex items-center justify-between ${getUrgencyColor(Number(apt.valor_cobrado) || 0)}`}
                            >
                              <span className="truncate">
                                {apt.data_hora_inicio && !isNaN(new Date(apt.data_hora_inicio).getTime())
                                  ? new Date(apt.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                                  : '--:--'} - {apt.cliente_nome || 'Cliente'}
                              </span>
                              {apt.imagem_referencia_url && (
                                <span className="material-icons-outlined text-[10px] ml-1 shrink-0">image</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddAppointmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddAppointment} 
      />

      <AppointmentDetailModal 
        appointment={selectedAppointment}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateStatus={updateStatus}
        onUpdateImageLink={updateImageLink}
      />
    </div>
  );
};
