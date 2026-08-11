import React, { useState, useMemo } from 'react';
import { useServices } from '../hooks/useServices';
import { type Appointment } from '../lib/supabase';
import { useFinance } from '../hooks/useFinance';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface FinanceScreenProps {
  appointments: Appointment[];
}

export const FinanceScreen: React.FC<FinanceScreenProps> = () => {
  const { transactions: dbTransactions, addTransaction } = useFinance();
  const { services: dbServices } = useServices();
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form State
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const transactions: Transaction[] = useMemo(() => {
    return (dbTransactions ?? []).map(t => ({
      id: t.id,
      type: t.tipo === 'entrada' ? 'income' : 'expense',
      category: t.categoria || 'Geral',
      description: t.descricao || '',
      amount: Number(t.valor) || 0,
      date: (t.data || t.criado_em || new Date().toISOString()).split('T')[0],
    }));
  }, [dbTransactions]);

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory || !newAmount) return;

    try {
      await addTransaction({
        tipo: newType === 'income' ? 'entrada' : 'saida',
        categoria: newCategory,
        descricao: newDescription,
        valor: parseFloat(newAmount),
        data: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewCategory('');
      setNewDescription('');
      setNewAmount('');
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
    }
  };
   return (
    <div className="flex flex-col h-full gap-4 lg:gap-6">
       {/* Summary Cards - horizontal scroll on mobile */}
       <div className="flex lg:grid lg:grid-cols-3 gap-3 lg:gap-6 overflow-x-auto pb-1 lg:pb-0 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0">
          {/* Income Card */}
          <div className="bg-bg-surface p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-border-main flex items-center gap-3 lg:gap-4 transition-colors duration-200 shrink-0 w-64 lg:w-auto snap-start">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-success/10 flex items-center justify-center text-success shrink-0">
               <span className="material-icons-outlined">arrow_downward</span>
            </div>
            <div>
               <p className="text-text-secondary text-xs lg:text-sm">Entradas</p>
               <h3 className="text-lg lg:text-2xl font-bold text-text-main">R$ {totalIncome.toFixed(2)}</h3>
            </div>
          </div>

          {/* Expense Card */}
          <div className="bg-bg-surface p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-border-main flex items-center gap-3 lg:gap-4 transition-colors duration-200 shrink-0 w-64 lg:w-auto snap-start">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger shrink-0">
               <span className="material-icons-outlined">arrow_upward</span>
            </div>
            <div>
               <p className="text-text-secondary text-xs lg:text-sm">Saídas</p>
               <h3 className="text-lg lg:text-2xl font-bold text-text-main">R$ {totalExpense.toFixed(2)}</h3>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-bg-surface p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-border-main flex items-center gap-3 lg:gap-4 transition-colors duration-200 shrink-0 w-64 lg:w-auto snap-start">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shrink-0 ${balance >= 0 ? 'bg-info/10 text-info' : 'bg-primary-subtle text-primary'}`}>
               <span className="material-icons-outlined">account_balance_wallet</span>
            </div>
            <div>
               <p className="text-text-secondary text-xs lg:text-sm">Saldo Atual</p>
               <h3 className={`text-lg lg:text-2xl font-bold ${balance >= 0 ? 'text-info' : 'text-primary'}`}>R$ {balance.toFixed(2)}</h3>
            </div>
          </div>
       </div>

       {/* Actions & Filters */}
       <div className="flex justify-between items-center">
          <h2 className="text-lg lg:text-xl font-bold text-text-main">Transações</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-hover text-primary-text px-3 py-2 lg:px-4 rounded-xl flex items-center gap-1.5 transition-colors font-medium shadow-sm shadow-primary/20 text-sm"
          >
            <span className="material-icons-outlined text-sm">add</span>
            <span className="hidden sm:inline">Nova </span>Transação
          </button>
       </div>

       {/* Transactions List */}
       <div className="bg-bg-surface rounded-2xl lg:rounded-3xl shadow-sm border border-border-main overflow-hidden flex-1 transition-colors duration-200">
          {/* Mobile: Card List */}
          <div className="block lg:hidden divide-y divide-border-main">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">
                <span className="material-icons-outlined text-4xl mb-2 opacity-30">receipt_long</span>
                <p className="text-sm">Nenhuma transação ainda</p>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    <span className="material-icons-outlined text-sm">{t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{t.category}</p>
                    <p className="text-xs text-text-secondary truncate">{t.description || new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'} R${t.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
          {/* Desktop: Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-bg-base">
                <tr>
                  <th className="p-4 text-sm font-medium text-text-secondary">Tipo</th>
                  <th className="p-4 text-sm font-medium text-text-secondary">Categoria</th>
                  <th className="p-4 text-sm font-medium text-text-secondary">Descrição</th>
                  <th className="p-4 text-sm font-medium text-text-secondary">Data</th>
                  <th className="p-4 text-sm font-medium text-text-secondary text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border-main last:border-0 hover:bg-bg-elevated transition-colors">
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${t.type === 'income' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                        {t.type === 'income' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="p-4 text-text-main font-medium">{t.category}</td>
                    <td className="p-4 text-text-secondary text-sm">{t.description}</td>
                    <td className="p-4 text-text-secondary text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>

       {/* Add Transaction Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-bg-surface rounded-3xl p-6 w-full max-w-md shadow-xl border border-border-main animate-in fade-in zoom-in duration-200">
             <h3 className="text-xl font-bold text-text-main mb-4">Nova Transação</h3>
             <form onSubmit={handleAddTransaction} className="flex flex-col gap-4">
               
               {/* Type Selection */}
               <div className="flex gap-2 p-1 bg-bg-base rounded-xl">
                 <button 
                   type="button"
                   onClick={() => setNewType('income')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === 'income' ? 'bg-bg-surface text-success shadow-sm' : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/50'}`}
                 >
                   Entrada
                 </button>
                 <button 
                   type="button"
                   onClick={() => setNewType('expense')}
                   className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${newType === 'expense' ? 'bg-bg-surface text-danger shadow-sm' : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/50'}`}
                 >
                   Saída
                 </button>
               </div>

               <div>
                 <label className="block text-xs font-medium text-text-secondary mb-1">Valor (R$)</label>
                 <input 
                   type="number" 
                   step="0.01"
                   value={newAmount}
                   onChange={(e) => setNewAmount(e.target.value)}
                   className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm"
                   placeholder="0.00"
                   required
                 />
               </div>

               <div>
                 <label className="block text-xs font-medium text-text-secondary mb-1">Categoria</label>
                  {newType === 'income' ? (
                    <select 
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value);
                        const service = dbServices.find(s => s.nome === e.target.value);
                        if (service) setNewAmount(Number(service.preco).toString());
                      }}
                      className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm"
                      required
                    >
                      <option value="" disabled>Selecione um serviço</option>
                      {dbServices.map(s => (
                        <option key={s.id || s.nome} value={s.nome}>{s.nome}</option>
                      ))}
                    </select>
                  ) : (
                   <input 
                     type="text" 
                     value={newCategory}
                     onChange={(e) => setNewCategory(e.target.value)}
                     className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm"
                     placeholder="Ex: Aluguel, Produtos..."
                     required
                   />
                 )}
               </div>

               <div>
                 <label className="block text-xs font-medium text-text-secondary mb-1">Descrição</label>
                 <input 
                   type="text" 
                   value={newDescription}
                   onChange={(e) => setNewDescription(e.target.value)}
                   className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm"
                   placeholder="Ex: Tatuagem do João"
                 />
               </div>

               <div className="flex gap-3 mt-2">
                 <button 
                   type="button" 
                   onClick={() => setShowAddModal(false)}
                   className="flex-1 py-3 rounded-xl border border-border-main text-text-main hover:bg-bg-elevated transition-colors font-medium"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit" 
                   className="flex-1 py-3 rounded-xl bg-primary text-primary-text hover:bg-primary-hover transition-colors font-medium shadow-sm shadow-primary/20"
                 >
                   Salvar
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};
