import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../lib/auth-context';

export type InventoryCategory = 'Produtos' | 'Equipamentos' | 'Descartáveis' | 'Tintas' | 'Agulhas' | 'Outros';

export interface InventoryItem {
  id: string;
  estudio_id?: string | null;
  item: string;
  categoria: InventoryCategory;
  quantidade: number;
  minimo_alerta: number;
  preco_unitario: number;
  data_ultima_compra?: string | null;
  criado_em?: string;

  // Aliases usados pelos componentes existentes
  name: string;
  category: InventoryCategory;
  quantity: number;
  min_quantity: number;
  price_per_unit: number;
  last_purchase_date?: string | null;
}

function normalizeItem(raw: any): InventoryItem {
  return {
    ...raw,
    name: raw.item,
    category: raw.categoria,
    quantity: raw.quantidade,
    min_quantity: raw.minimo_alerta,
    price_per_unit: raw.preco_unitario,
    last_purchase_date: raw.data_ultima_compra ?? null,
  };
}

// ===========================================================================
// useInventory — Estoque do estúdio
// ===========================================================================

export function useInventory() {
  const { estudioId } = useAuthContext();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!estudioId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('estoque_itens')
      .select('*')
      .eq('estudio_id', estudioId)
      .order('item', { ascending: true });

    if (err) {
      setError(err.message);
      setInventory([]);
    } else {
      setInventory((data ?? []).map(normalizeItem));
    }
    setLoading(false);
  }, [estudioId]);

  useEffect(() => {
    if (!estudioId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    fetchInventory();

    const channel = supabase
      .channel(`estoque-${estudioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque_itens' }, fetchInventory)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchInventory, estudioId]);

  const addItem = useCallback(async (item: {
    name: string;
    category: InventoryCategory;
    quantity: number;
    min_quantity: number;
    price_per_unit: number;
  }) => {
    if (!estudioId) throw new Error('Estúdio não identificado.');

    const { error: err } = await supabase.from('estoque_itens').insert([{
      estudio_id: estudioId,
      item: item.name,
      categoria: item.category,
      quantidade: item.quantity,
      minimo_alerta: item.min_quantity,
      preco_unitario: item.price_per_unit,
    }]);
    if (err) throw new Error(err.message);
    fetchInventory();
  }, [estudioId, fetchInventory]);

  const updateQuantity = useCallback(async (id: string, delta: number) => {
    const current = inventory.find(i => i.id === id);
    if (!current) return;
    const newQty = Math.max(0, current.quantidade + delta);

    const { error: err } = await supabase
      .from('estoque_itens')
      .update({ quantidade: newQty })
      .eq('id', id);
    if (err) throw new Error(err.message);
    fetchInventory();
  }, [inventory, fetchInventory]);

  const updateItem = useCallback(async (id: string, updates: Partial<{
    name: string; category: InventoryCategory; quantity: number;
    min_quantity: number; price_per_unit: number;
  }>) => {
    const mapped: Record<string, unknown> = {};
    if (updates.name !== undefined) mapped.item = updates.name;
    if (updates.category !== undefined) mapped.categoria = updates.category;
    if (updates.quantity !== undefined) mapped.quantidade = updates.quantity;
    if (updates.min_quantity !== undefined) mapped.minimo_alerta = updates.min_quantity;
    if (updates.price_per_unit !== undefined) mapped.preco_unitario = updates.price_per_unit;

    const { error: err } = await supabase.from('estoque_itens').update(mapped).eq('id', id);
    if (err) throw new Error(err.message);
    fetchInventory();
  }, [fetchInventory]);

  const deleteItem = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('estoque_itens').delete().eq('id', id);
    if (err) throw new Error(err.message);
    fetchInventory();
  }, [fetchInventory]);

  return { inventory, loading, error, addItem, updateQuantity, updateItem, deleteItem, refetch: fetchInventory };
}
