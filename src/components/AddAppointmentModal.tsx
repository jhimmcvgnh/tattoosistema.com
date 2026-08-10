import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../lib/supabase';
type UrgencyLevel = 'low' | 'medium' | 'high';
import { useServices } from '../hooks/useServices';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (appointment: Omit<Appointment, 'id'>) => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { services: dbServices } = useServices();
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [service, setService] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('pendente');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [localCorpo, setLocalCorpo] = useState('Antebraço Direito');
  const [imageUrl, setImageUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && date && time && service) {
      const selectedService = dbServices.find(s => s.nome === service || s.id === service);
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const endsAt = new Date(new Date(`${date}T${time}`).getTime() + (selectedService?.duracao_minutos ?? 60) * 60 * 1000).toISOString();
      
      const fullObservacoes = localCorpo 
        ? `[Local do Corpo: ${localCorpo}] ${observacoes.trim()}`.trim()
        : observacoes.trim();

      onAdd({
        cliente_nome: clientName,
        cliente_email: email,
        cliente_telefone: phone,
        data_hora_inicio: scheduledAt,
        data_hora_fim: endsAt,
        servico_id: selectedService?.id ?? null,
        servico_nome: selectedService ? selectedService.nome : service,
        valor_cobrado: selectedService ? Number(selectedService.preco) : 0,
        status: status as AppointmentStatus,
        metodo_pagamento: 'a_combinar',
        imagem_referencia_url: imageUrl.trim() || null,
        observacoes: fullObservacoes || null,
        criado_em: new Date().toISOString(),
      } as any);
      
      // Reset form
      setClientName('');
      setEmail('');
      setPhone('');
      setDate('');
      setTime('');
      setService('');
      setLocalCorpo('Antebraço Direito');
      setStatus('pendente');
      setUrgency('medium');
      setImageUrl('');
      setObservacoes('');
      
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4 overflow-y-auto">
      <div className="bg-bg-surface w-full max-w-lg rounded-3xl shadow-xl border border-border-main p-6 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-main">Novo Agendamento</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-main transition-colors">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome do Cliente *</label>
            <input 
              type="text" 
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                placeholder="joao@gmail.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Data *</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Horário *</label>
              <input 
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Serviço *</label>
            <select 
              required
              value={service}
              onChange={e => setService(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
            >
              <option value="" disabled>Selecione um serviço</option>
              {dbServices.map(s => (
                <option key={s.id || s.nome} value={s.nome}>{s.nome} - R$ {Number(s.preco).toFixed(2)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Parte do Corpo</label>
            <select 
              value={localCorpo}
              onChange={e => setLocalCorpo(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
            >
              <option value="Antebraço Direito">Antebraço Direito</option>
              <option value="Antebraço Esquerdo">Antebraço Esquerdo</option>
              <option value="Braço Superior Direito">Braço Superior Direito</option>
              <option value="Braço Superior Esquerdo">Braço Superior Esquerdo</option>
              <option value="Peito">Peito</option>
              <option value="Costas">Costas</option>
              <option value="Costela">Costela</option>
              <option value="Perna / Coxa">Perna / Coxa</option>
              <option value="Panturrilha">Panturrilha</option>
              <option value="Mão / Dedos">Mão / Dedos</option>
              <option value="Pescoço">Pescoço</option>
              <option value="Ombro">Ombro</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Link da Imagem de Referência (URL)</label>
            <input 
              type="url" 
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              placeholder="https://exemplo.com/imagem-referencia.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Observações do Quiz / Arte</label>
            <textarea 
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main resize-none"
              placeholder="Ex: Tatuagem no antebraço direito, estilo aquarela..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              >
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Urgência</label>
              <select 
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
                className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 bg-primary hover:bg-primary-hover text-primary-text font-bold py-3 px-4 rounded-xl transition-colors shadow-sm shadow-primary/20"
          >
            Adicionar Agendamento
          </button>
        </form>
      </div>
    </div>
  );
};
