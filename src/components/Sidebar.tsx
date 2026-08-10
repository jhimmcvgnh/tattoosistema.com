import React from 'react';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  isMobileOpen?: boolean;
  closeMobileSidebar?: () => void;
  handleLogoutProp: () => void;
}

interface NavItem {
  screen: string;
  icon: string;
  title: string;
}

const navItems: NavItem[] = [
  { screen: 'dashboard',    icon: 'grid_view',              title: 'Dashboard de Resultados' },
  { screen: 'appointments', icon: 'calendar_month',         title: 'Agendamentos' },
  { screen: 'chat',         icon: 'chat',                   title: 'Chat' },
  { screen: 'finance',      icon: 'account_balance_wallet', title: 'Financeiro' },
  { screen: 'clients',      icon: 'people',                 title: 'Clientes' },
  { screen: 'inventory',    icon: 'inventory_2',            title: 'Estoque e Mercadorias' },
  { screen: 'employees',    icon: 'badge',                  title: 'Funcionários' },
  { screen: 'notes',        icon: 'edit_note',              title: 'Anotações' },
  { screen: 'settings',     icon: 'settings',               title: 'Perfil e Configurações' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  darkMode,
  toggleDarkMode,
  activeScreen,
  setActiveScreen,
  isMobileOpen,
  closeMobileSidebar,
  handleLogoutProp,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-10
          w-20 flex flex-col items-center py-5 px-2 shrink-0
          transition-transform duration-300 ease-in-out
          border-r border-white/5
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={darkMode ? {
          background: 'rgba(15, 15, 15, 0.55)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        } : {}}
      >
        {/* Dark / Light mode toggle — pill container */}
        <div className="pill-glass flex flex-col items-center gap-1 p-1.5 w-full mb-4">
          <button
            title="Modo claro"
            onClick={() => darkMode && toggleDarkMode()}
            className={
              darkMode
                ? 'pill-btn w-full'
                : 'w-full flex items-center justify-center p-2 rounded-xl bg-white border border-gray-200 shadow-2xs text-gray-900 font-semibold'
            }
          >
            <span className="material-icons-outlined text-[20px]">light_mode</span>
          </button>
          <button
            title="Modo escuro"
            onClick={() => !darkMode && toggleDarkMode()}
            className={!darkMode ? 'pill-btn w-full text-gray-400 hover:text-gray-600' : 'pill-btn-active w-full'}
          >
            <span className="material-icons-outlined text-[20px]">dark_mode</span>
          </button>
        </div>

        {/* Navigation items — vertical pill container */}
        <div className="pill-glass flex flex-col items-center gap-1 p-1 w-full flex-1">
          {navItems.map(({ screen, icon, title }) => (
            <button
              key={screen}
              title={title}
              onClick={() => setActiveScreen(screen)}
              className={activeScreen === screen ? 'pill-btn-active w-full' : 'pill-btn w-full'}
            >
              <span className="material-icons-outlined text-[22px]">{icon}</span>
            </button>
          ))}
        </div>

        {/* Bottom actions — pill container */}
        <div className="pill-glass flex flex-col items-center gap-1 p-1 w-full mt-4">
          <button
            title="Ajuda"
            className="pill-btn w-full"
          >
            <span className="material-icons-outlined text-[20px]">help_outline</span>
          </button>
          <button
            title="Sair"
            onClick={handleLogoutProp}
            className="pill-btn w-full hover:!text-red-400"
          >
            <span className="material-icons-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
