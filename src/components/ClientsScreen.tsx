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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-text-main">Clientes</h1>
        <p className="text-text-secondary">Histórico completo de clientes e valor total gasto.</p>
      </div>

      <div className="bg-bg-surface rounded-3xl p-6 shadow-sm border border-border-main flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
            <input 
              type="text" 
              placeholder="Buscar cliente por nome, email ou telefone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-bg-elevated border border-border-main hover:bg-bg-surface text-text-main px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
              title="Importar Excel"
            >
              <span className="material-icons-outlined text-sm">upload_file</span> Importar
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-primary/20 text-sm"
              title="Exportar Excel"
            >
              <span className="material-icons-outlined text-sm">download</span> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
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
