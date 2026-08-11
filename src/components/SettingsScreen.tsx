import React, { useState } from 'react';
import { Account } from './Header';

interface SettingsScreenProps {
  accounts: Account[];
  currentUser: Account;
  onSwitchAccount: (account: Account) => void;
  onAddAccount: () => void;
  handleLogoutProp: () => void;
  onUpdateProfile?: (updates: { name?: string; phone?: string; avatar_url?: string }) => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  accounts, 
  currentUser, 
  onSwitchAccount, 
  onAddAccount, 
  handleLogoutProp,
  onUpdateProfile 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'accounts' | 'security' | 'notifications'>('accounts');

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || '');
  const [isEditingAvatarUrl, setIsEditingAvatarUrl] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateProfile) return;

    setSavingProfile(true);
    try {
      await onUpdateProfile({
        name: profileName,
        phone: profilePhone,
        avatar_url: profileAvatar,
      });
      alert('Perfil e foto de perfil atualizados com sucesso!');
      setIsEditingAvatarUrl(false);
    } catch (err: any) {
      alert(`Erro ao salvar perfil: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSwitchAccount = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    if (account) {
      onSwitchAccount(account);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: 'person' },
    { id: 'accounts', label: 'Contas', icon: 'manage_accounts' },
    { id: 'security', label: 'Segurança', icon: 'lock' },
    { id: 'notifications', label: 'Notificações', icon: 'notifications' },
  ];

  return (
    <div className="flex flex-col h-full gap-4 lg:gap-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-text-main">Configurações</h2>
        <p className="text-sm text-text-secondary hidden sm:block">Gerencie suas preferências e contas</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
        {/* Navigation — horizontal scroll on mobile, vertical list on desktop */}
        <div className="lg:w-64 shrink-0">
          {/* Mobile: horizontal pill tabs */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-1 px-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-text shadow-md shadow-primary/20' 
                    : 'text-text-secondary bg-bg-elevated hover:bg-bg-surface'
                }`}
              >
                <span className="material-icons-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Desktop: vertical list */}
          <div className="hidden lg:flex flex-col gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-text shadow-md shadow-primary/20' 
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-main hover:shadow-sm'
                }`}
              >
                <span className="material-icons-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-bg-surface rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-sm border border-border-main overflow-y-auto hide-scrollbar">
          
          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-text-main">Gerenciar Contas</h3>
                  <p className="text-sm text-text-secondary">Alterne entre contas ou adicione novas</p>
                </div>
                <button 
                  onClick={onAddAccount}
                  className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
                >
                  <span className="material-icons-outlined text-sm">add</span> Adicionar Conta
                </button>
              </div>

              <div className="space-y-4">
                {accounts.map(account => (
                  <div 
                    key={account.id} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      currentUser.id === account.id 
                        ? 'border-primary bg-primary-subtle ring-1 ring-primary' 
                        : 'border-border-main hover:border-text-secondary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={account.avatar} alt={account.name} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                        {currentUser.id === account.id && (
                          <div className="absolute -bottom-1 -right-1 bg-success border-2 border-bg-surface w-4 h-4 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-main">{account.name}</h4>
                        <p className="text-sm text-text-secondary">{account.email}</p>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-bg-base px-2 py-0.5 rounded text-text-secondary mt-1 inline-block">
                          Administrador
                        </span>
                      </div>
                    </div>
                    
                    {currentUser.id === account.id ? (
                      <span className="text-sm font-bold text-primary flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">check_circle</span> Atual
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSwitchAccount(account.id)}
                        className="text-sm font-medium text-text-secondary hover:text-text-main px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
                      >
                        Alternar
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-border-main">
                <button 
                  onClick={handleLogoutProp}
                  className="text-danger hover:text-danger/80 font-medium flex items-center gap-2 text-sm px-4 py-2 rounded-xl hover:bg-danger/10 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <span className="material-icons-outlined">logout</span> Sair de todas as contas
                </button>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-text-main">Informações Pessoais</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => setIsEditingAvatarUrl(!isEditingAvatarUrl)}
                  title="Clique para alterar a foto de perfil"
                >
                  <img 
                    src={profileAvatar || currentUser.avatar} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-bg-base shadow-md" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-icons-outlined text-white">camera_alt</span>
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-lg font-bold text-text-main">{profileName || currentUser.name}</h4>
                  <p className="text-text-secondary">Administrador</p>
                  
                  {isEditingAvatarUrl && (
                    <div className="mt-3 flex gap-2 max-w-md animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="url" 
                        value={profileAvatar}
                        onChange={(e) => setProfileAvatar(e.target.value)}
                        placeholder="https://exemplo.com/sua-foto.jpg"
                        className="flex-1 p-2 text-xs bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main"
                      />
                      <button 
                        type="button"
                        onClick={() => setIsEditingAvatarUrl(false)}
                        className="bg-bg-elevated text-text-secondary text-xs px-3 py-1.5 rounded-xl hover:text-text-main"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">E-mail</label>
                  <input 
                    type="email" 
                    defaultValue={currentUser.email} 
                    disabled
                    className="w-full p-3 bg-bg-base/50 border border-border-main rounded-xl text-text-secondary cursor-not-allowed shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Telefone</label>
                  <input 
                    type="tel" 
                    value={profilePhone} 
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">URL da Foto de Perfil (Avatar)</label>
                  <input 
                    type="url" 
                    value={profileAvatar} 
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://i.pravatar.cc/300"
                    className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" 
                  />
                </div>
              </div>

              <div className="bg-bg-base border border-border-main p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-text-main text-base">Link do Seu Site de Agendamentos</h4>
                    <p className="text-xs text-text-secondary">Compartilhe este link com seus clientes para receber agendamentos diretos.</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    readOnly
                    value={`${window.location.origin.replace('3001', '3000')}/?estudio=${(profileName || currentUser.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
                    className="flex-1 p-3 bg-bg-surface border border-border-main rounded-xl text-sm font-mono text-primary font-bold focus:outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin.replace('3001', '3000')}/?estudio=${(profileName || currentUser.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
                      navigator.clipboard.writeText(link);
                      alert('Link do site de agendamento copiado!');
                    }}
                    className="bg-primary hover:bg-primary-hover text-primary-text px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <span className="material-icons-outlined text-sm">content_copy</span> Copiar Link
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit"
                  disabled={savingProfile}
                  className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-text px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-primary/20 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-text-main">Segurança</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Confirmar Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-bg-base border border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main shadow-sm" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button className="bg-primary hover:bg-primary-hover text-primary-text px-6 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-primary/20">
                  Alterar Senha
                </button>
              </div>
            </div>
          )}

           {/* Notifications Tab */}
           {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-text-main">Preferências de Notificação</h3>
              
              <div className="space-y-4">
                {['Novos Agendamentos', 'Cancelamentos', 'Mensagens de Chat', 'Relatórios Semanais', 'Promoções e Dicas'].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-bg-base rounded-xl border border-border-main/50">
                    <span className="font-medium text-text-main">{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={index < 3} />
                      <div className="w-11 h-6 bg-text-secondary/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-text after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
