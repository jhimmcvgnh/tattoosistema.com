import React, { useState, useEffect } from 'react';
import { Header, Account } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StatCard } from './components/StatCard';
import { ActivityTable } from './components/ActivityTable';
import { type Appointment } from './types/database.types';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PeriodNavigator } from './components/PeriodNavigator';

// Importações pesadas movidas para Lazy Loading
import { IncomeChart } from './components/IncomeChart';
import { LoginScreen } from './components/LoginScreen';

import { ReportsModal } from './components/ReportsModal';
import { AddAccountModal } from './components/AddAccountModal';
import { AdPopupModal } from './components/AdPopupModal';
import { useAdPopup } from './hooks/useAdPopup';

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
import { useStats, type PeriodType, type CustomDateRange } from './hooks/useStats';
import { useAppointments } from './hooks/useAppointments';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboard');

  // Auth via Supabase
  const { user, profile, isAuthenticated, loading: authLoading, logout, register, updateProfile } = useAuth();
  
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Hook do Anúncio Pop-up (55s inicial, 55s recorrente)
  const { isAdOpen, showNavbarCta, handleClose: handleCloseAd, handleCta: handleCtaAd } = useAdPopup();
  
  // Period filtering state
  const [period, setPeriod] = useState<PeriodType>('month');
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleSwitchAccount = (_account: Account) => { /* Mock */ };
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
  const { appointments, updateStatus, addAppointment, updateImageLink } = useAppointments();
  
  // Dynamic Stats Hook calculated with date navigation and comparison
  const { 
    revenue, 
    revenueGrowth,
    revenueTrend,
    appointmentsCount, 
    appointmentsGrowth,
    appointmentsTrend,
    cancelledCount, 
    cancelledGrowth,
    cancelledTrend,
    popularServices,
    periodLabel,
    comparisonLabel,
  } = useStats(period, appointments, targetDate, customRange);

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
        showProjectCta={showNavbarCta}
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
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 pb-28 lg:pb-10 lg:p-10 hide-scrollbar flex flex-col w-full max-w-full overflow-x-hidden">
          {activeScreen === 'dashboard' && (
            <>
              {/* Top Greeting */}
              <div className="mb-3 sm:mb-4 lg:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5 text-text-main">
                  Bom dia, {currentUser?.name?.split(' ')[0] || 'Usuário'}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">
                  Acompanhe métricas, faturamento e fluxo de agendamentos em tempo real.
                </p>
              </div>

              {/* Master Period Filter Toolbar */}
              <PeriodNavigator 
                period={period}
                onPeriodChange={setPeriod}
                targetDate={targetDate}
                onTargetDateChange={setTargetDate}
                customRange={customRange}
                onCustomRangeChange={setCustomRange}
                periodLabel={periodLabel}
                totalAppointments={appointmentsCount}
                totalRevenue={revenue}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
                  {/* Total Revenue Card */}
                  <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border-main shadow-xs relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div>
                        <p className="text-text-secondary mb-1 text-xs sm:text-sm font-medium">Total Faturado</p>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3 text-text-main">
                          R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold ${
                            revenueTrend === 'up' 
                              ? 'bg-[#DCFCE7] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400' 
                              : 'bg-[#FEE2E2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400'
                          }`}>
                            <span className="material-icons-outlined text-[13px] mr-0.5">
                              {revenueTrend === 'up' ? 'arrow_upward' : 'arrow_downward'}
                            </span> 
                            {Math.abs(revenueGrowth)}%
                          </span>
                          <span className="text-[11px] sm:text-xs text-text-secondary font-medium">
                            {comparisonLabel}
                          </span>
                        </div>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-bg-elevated border border-border-main rounded-xl sm:rounded-2xl text-text-secondary group-hover:text-primary transition-colors shrink-0">
                        <span className="material-icons-outlined text-lg sm:text-xl">
                          payments
                        </span>
                      </div>
                    </div>
                    
                    {/* Period Selector Buttons */}
                    <div className="bg-bg-elevated p-1 rounded-xl flex items-center justify-between mb-1 border border-border-main">
                      {[
                        { label: 'Dia', value: 'day' },
                        { label: 'Semana', value: 'week' },
                        { label: 'Mês', value: 'month' },
                        { label: 'Ano', value: 'year' },
                      ].map((item) => {
                         const isActive = period === item.value;
                         return (
                           <button
                             key={item.value}
                             onClick={() => setPeriod(item.value as PeriodType)}
                             className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                               isActive 
                                 ? 'bg-bg-surface shadow-xs text-primary font-bold border border-border-main scale-[1.02]' 
                                 : 'text-text-secondary hover:text-text-main hover:bg-bg-surface/50'
                             }`}
                           >
                             {item.label}
                           </button>
                         )
                       })}
                    </div>
                  </div>

                  {/* Popular Services */}
                  <div className="glass-card p-4 sm:p-6 flex-1 flex flex-col rounded-2xl sm:rounded-3xl border border-border-main shadow-xs">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-text-main">Serviços Mais Populares</h3>
                        <span className="text-xs text-text-secondary font-medium">{periodLabel}</span>
                     </div>
                     <div className="flex-1 min-h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                popularServices.length > 0 
                                  ? popularServices.map((item: any, idx: number) => ({
                                      ...item,
                                      color: ['#FF5424', '#FF8C5A', '#E04418', '#FFE0D4', '#CC3B11'][idx % 5]
                                    }))
                                  : [{ name: 'Sem agendamentos no período', value: 1, color: '#374151' }]
                              }
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={popularServices.length > 0 ? 3 : 0}
                              dataKey="value"
                            >
                              {(popularServices.length > 0 ? popularServices : [{ color: '#374151' }]).map((_entry: any, index: number) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={popularServices.length > 0 ? ['#FF5424', '#FF8C5A', '#E04418', '#FFE0D4', '#CC3B11'][index % 5] : '#374151'} 
                                  stroke="none" 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--color-bg-surface)', 
                                borderColor: 'var(--color-border-main)', 
                                borderRadius: '12px',
                                color: 'var(--color-text-main)'
                              }}
                              itemStyle={{ color: 'var(--color-text-main)' }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              align="center"
                              iconType="circle"
                              formatter={(value) => (
                                  <span className="text-text-main ml-1.5 text-xs font-medium">{value}</span>
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                           <span className="text-3xl font-extrabold text-text-main">{appointmentsCount}</span>
                           <span className="text-xs text-text-secondary font-medium">Total</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-1 gap-3 lg:gap-6 content-start">
                  <StatCard 
                    title="Agendamentos" 
                    amount={appointmentsCount.toString()} 
                    percentage={`${Math.abs(appointmentsGrowth)}%`} 
                    trend={appointmentsTrend} 
                    icon="calendar_today" 
                    isPrimary={true} 
                    period={period}
                    onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
                    comparisonLabel={comparisonLabel}
                  />
                  <StatCard 
                    title="Cancelamentos" 
                    amount={cancelledCount.toString()} 
                    percentage={`${Math.abs(cancelledGrowth)}%`} 
                    trend={cancelledTrend} 
                    icon="event_busy" 
                    isPrimary={false}
                    period={period}
                    onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
                    comparisonLabel={comparisonLabel}
                  />
                </div>

                {/* Chart Adaptable to Period */}
                <IncomeChart 
                  appointments={appointments} 
                  period={period}
                  targetDate={targetDate}
                  customRange={customRange}
                />
              </div>

              <div className="mt-6">
                {/* Activity Table */}
                <ActivityTable 
                  appointments={appointments} 
                  updateStatus={updateStatus} 
                  updateImageLink={updateImageLink} 
                />
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
      <AdPopupModal
        isOpen={isAdOpen}
        onClose={handleCloseAd}
        onCtaClick={handleCtaAd}
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
