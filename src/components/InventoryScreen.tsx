import React, { useState, useEffect, useRef } from 'react';
import { useInventory, type InventoryItem } from '../hooks/useInventory';

export const InventoryScreen: React.FC = () => {
  const { inventory, loading, addItem, updateQuantity } = useInventory();
  const [isAdding, setIsAdding] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Produtos' as InventoryItem['category'],
    quantity: 0,
    min_quantity: 0,
    price_per_unit: 0
  });

  const lowStockItems = inventory.filter(item => item.quantity <= item.min_quantity);

  useEffect(() => {
    if (lowStockItems.length > 0) {
      setShowNotification(true);
      // Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    } else {
      setShowNotification(false);
    }
  }, [inventory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || newItem.quantity < 0) return;

    try {
      await addItem(newItem);
      setIsAdding(false);
      setNewItem({ name: '', category: 'Produtos', quantity: 0, min_quantity: 0, price_per_unit: 0 });
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleUpdateQuantity = async (id: string, delta: number) => {
    try {
      await updateQuantity(id, delta);
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const totalValue = inventory.reduce((acc, curr) => acc + (curr.quantity * curr.price_per_unit), 0);

  return (
    <div className="flex flex-col h-full gap-4 sm:gap-6">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-text-main">Estoque &amp; Mercadorias</h2>
          <p className="text-xs sm:text-sm text-text-secondary">Gerencie seus equipamentos e produtos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary hover:bg-primary-hover text-primary-text px-3.5 py-2 lg:px-6 lg:py-2.5 rounded-xl flex items-center gap-1.5 transition-all font-bold shadow-md shadow-primary/20 shrink-0 text-xs sm:text-sm active:scale-95"
        >
          <span className="material-icons-outlined text-sm sm:text-base">add_shopping_cart</span>
          <span className="hidden sm:inline">Comprar Mercadoria</span>
          <span className="sm:hidden">Comprar</span>
        </button>
      </div>

      {/* Low Stock Alert Banner */}
      {showNotification && (
        <div className="bg-danger/10 border border-danger/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-full bg-danger flex items-center justify-center text-white shrink-0">
              <span className="material-icons-outlined text-sm">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-danger font-bold text-sm">Aviso de Estoque Baixo!</h4>
              <p className="text-xs text-text-main opacity-80">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item precisa' : 'itens precisam'} de reposição imediata.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 self-stretch sm:self-auto sm:ml-auto">
            {lowStockItems.slice(0, 3).map(item => (
              <span key={item.id} className="px-2.5 py-1 bg-danger/20 text-danger rounded-lg text-[10px] font-bold uppercase tracking-wider">
                {item.name}
              </span>
            ))}
            {lowStockItems.length > 3 && <span className="text-xs text-danger font-bold self-center">+{lowStockItems.length - 3} mais</span>}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-bg-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border-main shadow-xs flex flex-col gap-1.5">
          <span className="text-text-secondary text-xs sm:text-sm">Valor Total em Estoque</span>
          <h3 className="text-2xl sm:text-3xl font-bold text-primary">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center gap-1 text-xs text-success">
            <span className="material-icons-outlined text-xs sm:text-sm">trending_up</span>
            <span>Estoque ativo</span>
          </div>
        </div>
        <div className="bg-bg-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border-main shadow-xs flex flex-col gap-1.5">
          <span className="text-text-secondary text-xs sm:text-sm">Total de Itens</span>
          <h3 className="text-2xl sm:text-3xl font-bold text-text-main">{inventory.reduce((acc, curr) => acc + curr.quantity, 0)}</h3>
          <span className="text-xs text-text-secondary">{inventory.length} categorias cadastradas</span>
        </div>
        <div className="bg-bg-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border-main shadow-xs flex flex-col gap-1.5">
          <span className="text-text-secondary text-xs sm:text-sm">Itens Críticos</span>
          <h3 className={`text-2xl sm:text-3xl font-bold ${lowStockItems.length > 0 ? 'text-danger' : 'text-success'}`}>{lowStockItems.length}</h3>
          <span className="text-xs text-text-secondary">Necessitam de reposição</span>
        </div>
      </div>

      {/* Inventory Container */}
      <div className="bg-bg-surface rounded-2xl sm:rounded-3xl border border-border-main shadow-xs overflow-hidden flex-1 flex flex-col">
        {/* Mobile Cards List */}
        <div className="lg:hidden divide-y divide-border-main">
          {inventory.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-sm">Nenhum item em estoque cadastrado.</div>
          ) : (
            inventory.map(item => (
              <div key={item.id} className="p-3.5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-text-main text-sm truncate">{item.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {item.category || (item as any).categoria || 'Geral'}
                    </span>
                  </div>
                  <div>
                    {item.quantity <= item.min_quantity ? (
                      <span className="flex items-center gap-1 text-danger text-[10px] font-bold px-2 py-0.5 rounded-md bg-danger/10 border border-danger/20">
                        <span className="material-icons-outlined text-xs">warning</span> Reposição
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-success text-[10px] font-bold px-2 py-0.5 rounded-md bg-success/10 border border-success/20">
                        <span className="material-icons-outlined text-xs">check_circle</span> OK
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-bg-base/70 p-2.5 rounded-xl border border-border-main/50">
                  <div className="text-xs">
                    <span className="text-text-secondary block text-[10px]">Unidade / Subtotal</span>
                    <span className="font-semibold text-text-main">
                      R$ {item.price_per_unit.toFixed(2)}
                    </span>
                    <span className="text-text-secondary font-medium ml-1">
                      (R$ {(item.quantity * item.price_per_unit).toFixed(2)})
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, -1)} 
                      className="w-8 h-8 rounded-lg bg-bg-elevated hover:bg-danger/10 hover:text-danger active:scale-95 flex items-center justify-center transition-colors border border-border-main"
                    >
                      <span className="material-icons-outlined text-sm">remove</span>
                    </button>
                    <span className={`font-bold min-w-[24px] text-center text-sm ${item.quantity <= item.min_quantity ? 'text-danger' : 'text-text-main'}`}>
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, 1)} 
                      className="w-8 h-8 rounded-lg bg-bg-elevated hover:bg-success/10 hover:text-success active:scale-95 flex items-center justify-center transition-colors border border-border-main"
                    >
                      <span className="material-icons-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-base border-b border-border-main">
              <tr>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Mercadoria</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Qtd. Atual</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Preço/Un.</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Subtotal</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {inventory.map(item => (
                <tr key={item.id} className="hover:bg-bg-elevated/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-text-main">{item.name}</div>
                    <div className="text-xs text-text-secondary">Última compra: {item.last_purchase_date ? new Date(item.last_purchase_date).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {item.category || (item as any).categoria || 'Geral'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleUpdateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-bg-elevated hover:bg-danger/10 hover:text-danger flex items-center justify-center transition-colors">
                        <span className="material-icons-outlined text-sm">remove</span>
                      </button>
                      <span className={`font-bold min-w-[20px] text-center ${item.quantity <= item.min_quantity ? 'text-danger scale-110' : 'text-text-main'}`}>
                        {item.quantity}
                      </span>
                      <button onClick={() => handleUpdateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-bg-elevated hover:bg-success/10 hover:text-success flex items-center justify-center transition-colors">
                        <span className="material-icons-outlined text-sm">add</span>
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-text-main">
                    R$ {item.price_per_unit.toFixed(2)}
                  </td>
                  <td className="p-4 text-sm font-bold text-text-main">
                    R$ {(item.quantity * item.price_per_unit).toFixed(2)}
                  </td>
                  <td className="p-4">
                    {item.quantity <= item.min_quantity ? (
                      <span className="flex items-center gap-1 text-danger text-xs font-bold">
                        <span className="material-icons-outlined text-sm">warning</span> Reposição
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-success text-xs font-bold">
                        <span className="material-icons-outlined text-sm">check_circle</span> OK
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-text-secondary hover:text-primary transition-colors">
                      <span className="material-icons-outlined text-lg">shopping_basket</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Merchandise Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-bg-surface w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-border-main p-5 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-text-main">Registrar Nova Compra</h3>
              <button onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-text-main p-1 rounded-lg">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="flex flex-col gap-4 sm:gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Nome da Mercadoria</label>
                  <input 
                    type="text" 
                    required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="Ex: Navalhete Premium, Gel..."
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-text-main text-base sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Categoria</label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-text-main text-base sm:text-sm"
                  >
                    <option value="Produtos">Produtos</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Descartáveis">Descartáveis</option>
                    <option value="Tintas">Tintas</option>
                    <option value="Agulhas">Agulhas</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Preço Unitário (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newItem.price_per_unit || ''}
                    onChange={e => setNewItem({...newItem, price_per_unit: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-text-main text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Quantidade</label>
                  <input 
                    type="number" 
                    required
                    value={newItem.quantity || ''}
                    onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                    placeholder="0"
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-text-main text-base sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Mínimo para Alerta</label>
                  <input 
                    type="number" 
                    required
                    value={newItem.min_quantity || ''}
                    onChange={e => setNewItem({...newItem, min_quantity: parseInt(e.target.value)})}
                    placeholder="Ex: 5"
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-text-main text-base sm:text-sm"
                  />
                </div>
              </div>

              <div className="bg-primary/5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-primary/20 mt-1">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-text-secondary text-xs sm:text-sm">Subtotal da Compra:</span>
                  <span className="text-primary text-lg sm:text-xl">R$ {((newItem.quantity || 0) * (newItem.price_per_unit || 0)).toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 sm:py-4 bg-primary text-primary-text font-bold rounded-xl sm:rounded-2xl hover:bg-primary-hover active:scale-[0.99] transition-all shadow-lg shadow-primary/20 text-sm sm:text-base">
                Confirmar Compra
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
