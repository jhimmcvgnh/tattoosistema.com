import React, { useState } from 'react';

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'vacation' | 'inactive';
  servicesCount: number;
  revenue: number;
  rating: number;
  topService: string;
}

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (employee: Omit<Employee, 'id'>) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'active' | 'vacation' | 'inactive'>('active');
  const [topService, setTopService] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && role) {
      onAdd({
        name,
        role,
        avatar: `https://i.pravatar.cc/150?u=${Date.now()}`, // Generate a random avatar
        status,
        servicesCount: 0,
        revenue: 0,
        rating: 0,
        topService: topService || 'Nenhum',
      });
      
      // Reset form
      setName('');
      setRole('');
      setStatus('active');
      setTopService('');
      
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-bg-surface w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-border-main p-5 sm:p-6 animate-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-text-main">Novo Funcionário</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-main transition-colors p-1 rounded-lg">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Nome *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main text-base sm:text-sm"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Cargo *</label>
            <input 
              type="text" 
              required
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main text-base sm:text-sm"
              placeholder="Ex: Tatuador / Body Piercer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Serviço Principal</label>
            <input 
              type="text" 
              value={topService}
              onChange={e => setTopService(e.target.value)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main text-base sm:text-sm"
              placeholder="Ex: Realismo / Blackwork"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Status</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main text-base sm:text-sm"
            >
              <option value="active">Ativo</option>
              <option value="vacation">Férias</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 sm:mt-4 bg-primary hover:bg-primary-hover text-primary-text font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.99] shadow-md shadow-primary/20 text-sm sm:text-base"
          >
            Adicionar Funcionário
          </button>
        </form>
      </div>
    </div>
  );
};
