import React, { useState, useMemo } from 'react';
import { type Appointment, type AppointmentStatus } from '../types/database.types';
import { AppointmentDetailModal } from './AppointmentDetailModal';

interface ActivityTableProps {
  appointments: Appointment[];
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  updateImageLink?: (id: string, imageUrl: string) => Promise<void>;
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ appointments, updateStatus, updateImageLink }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [mobileActiveTab, setMobileActiveTab] = useState<AppointmentStatus>('pendente');
  
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calculate totals (memoized)
  const { totalAppointments, totalCancelled, totalHighPriority, totalRevenue } = useMemo(() => {
    const totalAppointments = appointments.length;
    const totalCancelled = appointments.filter(a => a.status === 'cancelado').length;
    const totalHighPriority = appointments.filter(a => (Number(a.valor_cobrado) || 0) > 50).length;
    const totalRevenue = appointments
      .filter(a => a.status === 'concluido' || a.status === 'confirmado')
      .reduce((acc, curr) => acc + (Number(curr.valor_cobrado) || 0), 0);
    return { totalAppointments, totalCancelled, totalHighPriority, totalRevenue };
  }, [appointments]);

  // Filter & Sort logic (memoized)
  const sortedAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = appointments.filter(app => {
      if (!query) return true;
      const name = (app.cliente_nome || '').toLowerCase();
      const email = (app.cliente_email || '').toLowerCase();
      const service = (app.servico?.nome || app.servico_nome || '').toLowerCase();
      return name.includes(query) || email.includes(query) || service.includes(query);
    });

    return filtered.sort((a, b) => {
      const timeA = a?.data_hora_inicio ? new Date(a.data_hora_inicio).getTime() : 0;
      const timeB = b?.data_hora_inicio ? new Date(b.data_hora_inicio).getTime() : 0;
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });
  }, [appointments, searchQuery]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data N/A';
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch {
      return 'Data N/A';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Hora N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Hora N/A';
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
    } catch {
      return 'Hora N/A';
    }
  };

  const getUrgencyColor = (price: number) => {
    if (price >= 60) return 'text-black bg-red-200 border border-red-400 dark:bg-red-900/50 dark:text-white dark:border-red-700';
    if (price >= 40) return 'text-black bg-orange-200 border border-orange-400 dark:bg-orange-900/50 dark:text-white dark:border-orange-700';
    return 'text-black bg-green-200 border border-green-400 dark:bg-green-900/50 dark:text-white dark:border-green-700';
  };

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateStatus(id, status);
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const openDetail = (app: Appointment) => {
    setSelectedAppt(app);
    setIsDetailOpen(true);
  };

  const columns: { id: AppointmentStatus; title: string; count: number }[] = [
    { id: 'pendente', title: 'Pendente', count: sortedAppointments.filter(a => a.status === 'pendente').length },
    { id: 'confirmado', title: 'Confirmado', count: sortedAppointments.filter(a => a.status === 'confirmado').length },
    { id: 'concluido', title: 'Concluído', count: sortedAppointments.filter(a => a.status === 'concluido').length },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 xl:col-span-3">
      {/* Summary Cards Row — 2 colunas em mobile e 4 em desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="glass-card bg-[#1E69FF] text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-none shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Urgentes</h4>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">{totalHighPriority}</span>
            </div>
          </div>
        </div>

        <div className="glass-card bg-[#FF5424] text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-none shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Agendamentos</h4>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">{totalAppointments}</span>
            </div>
          </div>
        </div>

        <div className="glass-card bg-[#E5A100] text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-none shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Cancelados</h4>
            <div className="flex items-end gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">{totalCancelled}</span>
            </div>
          </div>
        </div>

        <div className="glass-card bg-[#00C853] text-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-none shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-white/90 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Faturado</h4>
            <div className="flex items-end gap-2">
              <span className="text-xl sm:text-2xl lg:text-4xl font-extrabold truncate">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Buscar cliente ou serviço..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main transition-all shadow-xs"
            />
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-surface p-1 rounded-xl border border-border shadow-xs">
              <button 
                onClick={() => setViewMode('board')} 
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'board' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:bg-bg-elevated'
                }`}
              >
                <span className="material-icons-outlined text-sm">grid_view</span>
                <span>Kanban</span>
              </button>
              <button 
                onClick={() => setViewMode('table')} 
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:bg-bg-elevated'
                }`}
              >
                <span className="material-icons-outlined text-sm">view_list</span>
                <span>Lista</span>
              </button>
            </div>
          </div>
        </div>

        {/* Board View */}
        {viewMode === 'board' && (
          <div>
            {/* Mobile Column Tabs (lg:hidden) */}
            <div className="flex lg:hidden gap-1.5 p-1 bg-bg-elevated rounded-2xl border border-border-main mb-4">
              {columns.map(col => {
                const isActive = mobileActiveTab === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={() => setMobileActiveTab(col.id)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                  >
                    <span>{col.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-bg-surface text-text-secondary border border-border-main'
                    }`}>
                      {col.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile: Active Column Single View */}
            <div className="flex lg:hidden flex-col gap-3">
              {sortedAppointments.filter(app => app.status === mobileActiveTab).length === 0 ? (
                <div className="py-12 text-center text-text-secondary bg-bg-surface rounded-2xl border border-border-main">
                  <span className="material-icons-outlined text-4xl mb-1 opacity-30">inbox</span>
                  <p className="text-sm font-medium">Nenhum agendamento neste status</p>
                </div>
              ) : (
                sortedAppointments.filter(app => app.status === mobileActiveTab).map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => openDetail(app)}
                    className="glass-card p-4 rounded-2xl border-l-4 border-l-primary hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyColor(Number(app.valor_cobrado) || 0)}`}>
                        {(Number(app.valor_cobrado) || 0) >= 60 ? 'ALTA' : (Number(app.valor_cobrado) || 0) >= 40 ? 'MÉDIA' : 'BAIXA'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(app);
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                          app.imagem_referencia_url 
                            ? 'bg-primary/20 text-primary border border-primary/30' 
                            : 'bg-bg-elevated text-text-secondary'
                        }`}
                      >
                        <span className="material-icons-outlined text-xs">collections</span>
                        <span>{app.imagem_referencia_url ? 'Foto' : '+ Foto'}</span>
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="font-bold text-base text-text-main group-hover:text-primary transition-colors">{app.cliente_nome}</h4>
                      <p className="text-xs text-text-secondary font-medium mb-1.5">{app.servico?.nome || app.servico_nome || 'Serviço Personalizado'}</p>
                      <div className="flex items-center justify-between gap-2">
                         <p className="text-base font-extrabold text-primary">R$ {(Number(app.valor_cobrado) || 0).toFixed(2)}</p>
                         <div className="flex items-center gap-1 text-text-secondary text-xs bg-bg-elevated px-2 py-1 rounded-lg">
                            <span className="material-icons-outlined text-xs">calendar_today</span>
                            <span>{formatDate(app.data_hora_inicio)} {formatTime(app.data_hora_inicio)}</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-border-main" onClick={e => e.stopPropagation()}>
                      {app.cliente_telefone && (
                        <a href={`https://wa.me/${app.cliente_telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl bg-success text-white hover:bg-success/90 text-xs font-bold transition-all flex items-center justify-center gap-1">
                          <span className="material-icons-outlined text-sm">message</span> WhatsApp
                        </a>
                      )}
                      {app.status === 'pendente' && (
                        <button onClick={() => handleStatusChange(app.id, 'confirmado')} className="flex-1 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-xs font-bold transition-all">
                          Confirmar
                        </button>
                      )}
                      {app.status === 'confirmado' && (
                        <button onClick={() => handleStatusChange(app.id, 'concluido')} className="flex-1 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 text-xs font-bold transition-all">
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: 3 Columns Side by Side (hidden on mobile) */}
            <div className="hidden lg:grid grid-cols-3 gap-6">
              {columns.map(col => (
                <div key={col.id} className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-primary p-3 rounded-2xl shadow-sm mb-2">
                    <h3 className="font-bold text-primary-text flex items-center gap-2">
                      {col.title} <span className="bg-primary-text text-primary text-[10px] px-2 py-0.5 rounded-full">{col.count}</span>
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {sortedAppointments.filter(app => app.status === col.id).map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => openDetail(app)}
                        className="glass-card p-5 border-l-4 border-l-primary hover:shadow-lg transition-all group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getUrgencyColor(Number(app.valor_cobrado) || 0)}`}>
                            {(Number(app.valor_cobrado) || 0) >= 60 ? 'ALTA' : (Number(app.valor_cobrado) || 0) >= 40 ? 'MÉDIA' : 'BAIXA'}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(app);
                            }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                              app.imagem_referencia_url 
                                ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30' 
                                : 'bg-bg-elevated text-text-secondary hover:text-text-main'
                            }`}
                            title="Ver Foto e Detalhes"
                          >
                            <span className="material-icons-outlined text-xs">collections</span>
                            <span>{app.imagem_referencia_url ? 'Foto' : '+ Foto'}</span>
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-bold text-lg text-text-main group-hover:text-primary transition-colors">{app.cliente_nome}</h4>
                          <p className="text-sm text-text-secondary font-medium mb-2">{app.servico?.nome || app.servico_nome || 'Serviço Personalizado'}</p>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                             <p className="text-base font-bold text-primary">R$ {(Number(app.valor_cobrado) || 0).toFixed(2)}</p>
                             <div className="flex items-center gap-1.5 text-text-secondary text-xs bg-bg-elevated px-2 py-1 rounded-lg">
                                <span className="material-icons-outlined text-xs">calendar_today</span>
                                <span className="font-medium">{formatDate(app.data_hora_inicio)} {formatTime(app.data_hora_inicio)}</span>
                             </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-border-main" onClick={e => e.stopPropagation()}>
                          {app.cliente_telefone && (
                            <a href={`https://wa.me/${app.cliente_telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl bg-success text-primary-text hover:bg-success/90 text-xs font-bold transition-all flex items-center justify-center gap-1">
                              <span className="material-icons-outlined text-sm">message</span> WhatsApp
                            </a>
                          )}
                          {app.status === 'pendente' && (
                            <button onClick={() => handleStatusChange(app.id, 'confirmado')} className="flex-1 py-2 rounded-xl bg-primary text-primary-text hover:bg-primary-hover text-xs font-bold transition-all">
                              Confirmar
                            </button>
                          )}
                          {app.status === 'confirmado' && (
                            <button onClick={() => handleStatusChange(app.id, 'concluido')} className="flex-1 py-2 rounded-xl bg-green-600 text-primary-text hover:bg-green-700 text-xs font-bold transition-all">
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <>
            {/* Mobile Card List (lg:hidden) */}
            <div className="block lg:hidden flex flex-col gap-3">
              {sortedAppointments.length === 0 ? (
                <div className="py-12 text-center text-text-secondary bg-bg-surface rounded-2xl border border-border-main">
                  <span className="material-icons-outlined text-4xl mb-1 opacity-30">calendar_today</span>
                  <p className="text-sm font-medium">Nenhum agendamento encontrado</p>
                </div>
              ) : (
                sortedAppointments.map((app) => (
                  <div 
                    key={app.id} 
                    onClick={() => openDetail(app)}
                    className="glass-card p-4 rounded-2xl border border-border-main hover:bg-bg-elevated/40 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-text-main text-base">{app.cliente_nome}</p>
                        <p className="text-xs text-text-secondary">{app.servico?.nome || app.servico_nome || 'Personalizado'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        app.status === 'concluido' ? 'bg-success/20 text-success' :
                        app.status === 'pendente' ? 'bg-warning/20 text-warning' :
                        'bg-info/20 text-info'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-main">
                      <span className="font-bold text-primary text-sm">R$ {(Number(app.valor_cobrado) || 0).toFixed(2)}</span>
                      <span>{formatDate(app.data_hora_inicio)} {formatTime(app.data_hora_inicio)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (hidden lg:block) */}
            <div className="hidden lg:block glass-card p-6 overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-primary border-b border-border-main bg-primary-subtle">
                    <th className="py-3 pl-4 font-semibold rounded-tl-xl">Cliente</th>
                    <th className="py-3 font-semibold">Contato</th>
                    <th className="py-3 font-semibold">Serviço</th>
                    <th className="py-3 font-semibold">Preço</th>
                    <th className="py-3 font-semibold">Data</th>
                    <th className="py-3 font-semibold">Imagem</th>
                    <th className="py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border-main">
                   {sortedAppointments.map((app) => (
                    <tr key={app.id} onClick={() => openDetail(app)} className="hover:bg-bg-elevated transition-colors cursor-pointer">
                      <td className="py-4 pl-4 font-medium text-text-main">{app.cliente_nome}</td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-text-main">{app.cliente_email}</span>
                          <span className="text-xs text-text-secondary">{app.cliente_telefone}</span>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-text-main">{app.servico?.nome || app.servico_nome || 'Personalizado'}</td>
                      <td className="py-4 text-text-main">R$ {(Number(app.valor_cobrado) || 0).toFixed(2)}</td>
                      <td className="py-4 text-text-secondary">{formatDate(app.data_hora_inicio)} {formatTime(app.data_hora_inicio)}</td>
                      <td className="py-4" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => openDetail(app)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            app.imagem_referencia_url 
                              ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30' 
                              : 'bg-bg-elevated text-text-secondary hover:text-text-main'
                          }`}
                        >
                          <span className="material-icons-outlined text-xs">collections</span>
                          <span>{app.imagem_referencia_url ? 'Foto' : '+ Foto'}</span>
                        </button>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          app.status === 'concluido' ? 'bg-success/20 text-success' :
                          app.status === 'pendente' ? 'bg-warning/20 text-warning' :
                          'bg-info/20 text-info'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AppointmentDetailModal 
        appointment={selectedAppt}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateStatus={updateStatus}
        onUpdateImageLink={updateImageLink}
      />
    </div>
  );
};
