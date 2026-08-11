import React, { useState, useMemo, useRef } from 'react';
import { useClients } from '../hooks/useClients';
import * as XLSX from 'xlsx';

interface ClientsScreenProps {
  updateStatus?: (id: string, status: any) => Promise<void>;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { clients, loading } = useClients();

  const clientsData = useMemo(() => {
    return (clients ?? []).map(c => ({
      email: c.email || 'N/A',
      name: c.nome || 'N/A',
      phone: c.telefone || 'N/A',
      totalSpent: Number(c.total_investido) || 0,
      appointmentCount: c.total_agendamentos || 0,
    }));
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clientsData.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery),
    );
  }, [clientsData, searchQuery]);

  const handleExportExcel = () => {
    const exportData = clientsData.map(client => ({
      'Nome': client.name,
      'E-mail': client.email,
      'Telefone': client.phone,
      'Agendamentos': client.appointmentCount,
      'Valor Gasto (R$)': client.totalSpent.toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, `clientes-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData && jsonData.length > 0) {
          alert(`${jsonData.length} registros encontrados na planilha. A importação direta de clientes será integrada em breve.`);
        } else {
          alert('A planilha está vazia ou em formato inválido.');
        }
      } catch (error) {
        console.error('Erro ao importar Excel:', error);
        alert('Erro ao ler o arquivo Excel. Certifique-se de que é um arquivo .xlsx ou .xls válido.');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="mb-4 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1 lg:mb-2 text-text-main">Clientes</h1>
        <p className="text-sm text-text-secondary hidden sm:block">Histórico completo de clientes e valor total gasto.</p>
      </div>

      <div className="bg-bg-surface rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-border-main flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
          <div className="relative w-full sm:w-96">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-bg-elevated border border-border-main hover:bg-bg-surface text-text-main p-2 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
              title="Importar Excel"
            >
              <span className="material-icons-outlined text-sm">upload_file</span>
              <span className="hidden lg:inline">Importar</span>
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-primary hover:bg-primary-hover text-primary-text p-2 lg:px-4 lg:py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-primary/20 text-sm"
              title="Exportar Excel"
            >
              <span className="material-icons-outlined text-sm">download</span>
              <span className="hidden lg:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Mobile: Card List */}
        <div className="block lg:hidden flex-1 overflow-y-auto divide-y divide-border-main -mx-4 hide-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-text-secondary">
              <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : filteredClients.length > 0 ? (
            filteredClients.map((client, index) => (
              <div key={client.email || client.phone || index} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-main text-sm truncate">{client.name}</p>
                  <p className="text-xs text-text-secondary truncate">{client.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-text-main">R${client.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-text-secondary">{client.appointmentCount} agend.</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-text-secondary px-4">
              <span className="material-icons-outlined text-4xl mb-2 opacity-30">people</span>
              <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
            </div>
          )}
        </div>

        {/* Desktop: Table */}
        <div className="hidden lg:block overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-main text-text-secondary text-sm bg-bg-base">
                <th className="py-3 font-medium px-4 rounded-tl-xl">Nome</th>
                <th className="py-3 font-medium px-4">E-mail</th>
                <th className="py-3 font-medium px-4">Número</th>
                <th className="py-3 font-medium px-4 text-right">Agendamentos</th>
                <th className="py-3 font-medium px-4 text-right rounded-tr-xl">Valor Gasto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-secondary">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block mr-2" />
                    Carregando clientes...
                  </td>
                </tr>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client, index) => (
                  <tr key={client.email || client.phone || index} className="border-b border-border-main/50 hover:bg-bg-elevated transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-text-main">{client.name}</div>
                    </td>
                    <td className="py-4 px-4 text-text-secondary">
                      {client.email}
                    </td>
                    <td className="py-4 px-4 text-text-secondary">
                      {client.phone}
                    </td>
                    <td className="py-4 px-4 text-right text-text-secondary">
                      {client.appointmentCount}
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-text-main">
                      R$ {client.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-secondary">
                    Nenhum cliente cadastrado ainda. Os clientes aparecem aqui automaticamente após o primeiro agendamento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
