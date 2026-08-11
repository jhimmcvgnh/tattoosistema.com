import React, { useState, useEffect } from 'react';
import { Header, Account } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { ActivityTable } from './components/ActivityTable';
import { type Appointment } from './types/database.types';
import { MobileBottomNav } from './components/MobileBottomNav';

// Importações pesadas foram movidas para Lazy Loading abaixo
import { IncomeChart } from './components/IncomeChart';
import { LoginScreen } from './components/LoginScreen';

import { ReportsModal } from './components/ReportsModal';
import { AddAccountModal } from './components/AddAccountModal';

function safeLazy<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T } | any>) {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (err: any) {
      console.warn('Falha no carregamento dinâmico do módulo, recarregando página:', err);
      const isChunkError = err?.message?.includes('Failed to fetch dynamically imported module') ||
                           err?.message?.includes('Importing a module script failed') ||
                           err?.name === 'TypeError';
      if (isChunkError && !sessionStorage.getItem('chunk_reload_retry')) {
        sessionStorage.setItem('chunk_reload_retry', 'true');
        window.location.reload();
      }
      throw err;
    }
  });
}

// Lazy loading seguro das telas pesadas
const LazyChatScreen = safeLazy(() => import('./components/ChatScreen').then(module => ({ default: module.ChatScreen })));
const LazyFinanceScreen = safeLazy(() => import('./components/FinanceScreen').then(module => ({ default: module.FinanceScreen })));
const LazyAppointmentsScreen = safeLazy(() => import('./components/AppointmentsScreen').then(module => ({ default: module.AppointmentsScreen })));
const LazyNotesScreen = safeLazy(() => import('./components/NotesScreen').then(module => ({ default: module.NotesScreen })));
const LazyInventoryScreen = safeLazy(() => import('./components/InventoryScreen').then(module => ({ default: module.InventoryScreen })));
const LazyEmployeesScreen = safeLazy(() => import('./components/EmployeesScreen').then(module => ({ default: module.EmployeesScreen })));
const LazySettingsScreen = safeLazy(() => import('./components/SettingsScreen').then(module => ({ default: module.SettingsScreen })));
const LazyClientsScreen = safeLazy(() => import('./components/ClientsScreen').then(module => ({ default: module.ClientsScreen })));
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AnimatedBackground } from './components/AnimatedBackground';

import { useAuth } from './hooks/useAuth';
import { useStats } from './hooks/useStats';
import { useAppointments } from './hooks/useAppointments';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboard');

  // Auth via Supabase
  const { user, profile, isAuthenticated, loading: authLoading, logout, register, updateProfile } = useAuth();
  
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleSwitchAccount = (account: Account) => { /* Mock */ };
  const handleLogout = async () => { 
    await logout();
  };
  const handleUpdateAvatar = async (url: string) => {
    try {
      await updateProfile({ avatar_url: url });
    } catch (err: any) {
      alert(`Erro ao atualizar foto de perfil: ${err.message}`);
    }
  };
  
  const handleAddAccount = async (account: any) => { 
    try {
      if (account.password) {
        await register(account.email, account.password, account.name, account.phone);
        alert('Usuário cadastrado com sucesso!');
      }
    } catch (err: any) {
      alert(`Erro ao cadastrar: ${err.message}`);
    } finally {
      setIsAddAccountModalOpen(false);
    }
  };

  // Dados Reais via Hooks
  const { appointments, loading: apptsLoading, updateStatus, addAppointment, updateImageLink } = useAppointments();
  const { 
    revenue, 
    appointmentsCount, 
    cancelledCount, 
    revenueGrowth, 
    popularServices 
  } = useStats(revenuePeriod, appointments);


  const currentUser: Account = {
    id: user?.id ?? '1',
    name: profile?.nome ?? user?.email?.split('@')[0] ?? 'Admin',
    email: user?.email ?? '',
    avatar: profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${user?.email?.charAt(0) ?? 'U'}&background=FF622B&color=fff`,
  };

  const accounts: Account[] = [currentUser];

  if (authLoading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-primary">Carregando Sistema...</div>;
  }

  // Mostra o Login se não estiver autenticado
  if (!isAuthenticated) {
    return (
      <LoginScreen />
    );
  }

  return (
    <div className="bg-bg-base text-text-main antialiased transition-colors duration-200 h-screen h-[100dvh] flex flex-col font-display relative overflow-hidden">
      <AnimatedBackground darkMode={darkMode} />
      <Header 
        currentUser={currentUser}
        accounts={accounts}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={() => setIsAddAccountModalOpen(true)}
        onUpdateAvatar={handleUpdateAvatar}
        onOpenReports={() => setIsReportsModalOpen(true)}
        toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        handleLogoutProp={handleLogout}
        activeScreen={activeScreen}
      />
      <div className="flex flex-1 overflow-hidden relative">
          <Sidebar 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            activeScreen={activeScreen} 
            setActiveScreen={(screen) => {
              setActiveScreen(screen);
              setIsMobileSidebarOpen(false);
            }} 
            isMobileOpen={isMobileSidebarOpen}
            closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
            handleLogoutProp={handleLogout}
          />
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-10 lg:p-10 hide-scrollbar flex flex-col w-full">
          {activeScreen === 'dashboard' && (
            <>
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold mb-1 lg:mb-2 text-text-main">
                  Bom dia, {currentUser?.name?.split(' ')[0] || 'Usuário'}
                </h1>
                <p className="text-sm text-text-secondary hidden sm:block">Fique por dentro das suas tarefas, acompanhe o progresso e verifique o status.</p>
              </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="flex flex-col gap-6">
              {/* Total Revenue Card */}
              <div className="glass-card p-6 rounded-3xl border border-border-main shadow-xs">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-text-secondary mb-1 text-sm font-medium">Total Faturado</p>
                    <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 text-text-main">
                      R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A]">
                        <span className="material-icons-outlined text-[13px] mr-0.5">arrow_upward</span> 
                        {revenueGrowth || 0}%
                      </span>
                      <span className="text-xs text-text-secondary font-medium">
                        comparado ao período anterior
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-bg-elevated border border-border-main rounded-xl">
                    <span className="material-icons-outlined text-text-secondary text-xl">
                      grid_view
                    </span>
                  </div>
                </div>
                
                {/* Period Selectors */}
                <div className="bg-bg-elevated p-1 rounded-xl flex items-center justify-between mb-2 border border-border-main">
                  {['Dia', 'Semana', 'Mês', 'Ano'].map((period) => {
                     const value = period === 'Dia' ? 'day' : period === 'Semana' ? 'week' : period === 'Mês' ? 'month' : 'year';
                     const isActive = revenuePeriod === value;
                     return (
                       <button
                         key={value}
                         onClick={() => setRevenuePeriod(value as any)}
                         className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                           isActive 
                             ? 'bg-bg-surface shadow-xs text-[#FF5424] font-semibold border border-border-main' 
                             : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/50'
                         }`}
                       >
                         {period}
                       </button>
                     )
                   })}
                </div>

                {/* Date Picker Input (Visible only when 'day' is selected) */}
                {revenuePeriod === 'day' && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="date" 
                      className="w-full bg-bg-base border border-border-main rounded-xl px-4 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Popular Services */}
              <div className="glass-card p-6 flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-text-main">Serviços Mais Populares</h3>
                    <button className="text-xs text-[#FF5424] font-medium hover:underline">Ver todos</button>
                 </div>
                 <div className="flex-1 min-h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={
                            popularServices.length > 0 
                              ? popularServices.map((item: any, idx: number) => ({
                                  ...item,
                                  color: ['#FF8C66', '#C83E14', '#FFE2D9', '#FF5424'][idx % 4]
                                }))
                              : [{ name: 'Sem agendamentos', value: 1, color: '#374151' }]
                          }
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(popularServices.length > 0 ? popularServices : [{ color: '#374151' }]).map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={popularServices.length > 0 ? ['#FF8C66', '#C83E14', '#FFE2D9', '#FF5424'][index % 4] : '#374151'} 
                              stroke="none" 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--color-text-primary)' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          align="center"
                          iconType="circle"
                          formatter={(value) => (
                              <span className="text-text-main ml-2 text-xs font-medium">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                       <span className="text-3xl font-bold text-text-main">{appointmentsCount}</span>
                       <span className="text-xs text-text-secondary">Total</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 gap-3 lg:gap-6 content-start">
              <StatCard 
                title="Agendamentos" 
                amount={appointmentsCount.toString()} 
                percentage={`${revenueGrowth || 0}%`} 
                trend="up" 
                icon="calendar_today" 
                isPrimary={true} 
                period={revenuePeriod === 'day' ? 'month' : revenuePeriod as any}
                onPeriodChange={() => {}}
              />
              <StatCard 
                title="Cancelamentos" 
                amount={cancelledCount.toString()} 
                percentage="0%" 
                trend="down" 
                icon="event_busy" 
                isPrimary={true}
                period={revenuePeriod === 'day' ? 'month' : revenuePeriod as any}
                onPeriodChange={() => {}}
              />
            </div>

            {/* Chart */}
            <IncomeChart appointments={appointments} />
          </div>

          <div className="mt-6">
            {/* Activity Table */}
            <ActivityTable appointments={appointments} updateStatus={updateStatus} updateImageLink={updateImageLink} />
          </div>
          </>
          )}

          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center text-primary"><span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span></div>}>
            {activeScreen === 'chat' && <LazyChatScreen />}
            {activeScreen === 'finance' && <LazyFinanceScreen appointments={appointments} />}
            {activeScreen === 'appointments' && <LazyAppointmentsScreen appointments={appointments} updateStatus={updateStatus} addAppointment={addAppointment} updateImageLink={updateImageLink} />}
            {activeScreen === 'notes' && <LazyNotesScreen />}
            {activeScreen === 'inventory' && <LazyInventoryScreen />}
            {activeScreen === 'employees' && <LazyEmployeesScreen appointments={appointments} />}
            {activeScreen === 'settings' && (
              <LazySettingsScreen 
                accounts={accounts}
                currentUser={currentUser}
                onSwitchAccount={handleSwitchAccount}
                onAddAccount={() => setIsAddAccountModalOpen(true)}
                handleLogoutProp={handleLogout}
                onUpdateProfile={updateProfile}
              />
            )}
            {activeScreen === 'clients' && <LazyClientsScreen appointments={appointments} updateStatus={updateStatus} />}
          </React.Suspense>
        </main>
      </div>

      {/* Modals */}
      <ReportsModal 
        isOpen={isReportsModalOpen} 
        onClose={() => setIsReportsModalOpen(false)} 
        appointments={appointments}
      />
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        onAdd={handleAddAccount}
      />
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
      />
    </div>
  );
}
