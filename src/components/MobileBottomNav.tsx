import React, { useState } from 'react';

interface NavItem {
  screen: string;
  icon: string;
  label: string;
}

const primaryNav: NavItem[] = [
  { screen: 'dashboard',    icon: 'grid_view',              label: 'Início' },
  { screen: 'appointments', icon: 'calendar_month',         label: 'Agenda' },
  { screen: 'chat',         icon: 'chat',                   label: 'Chat' },
  { screen: 'finance',      icon: 'account_balance_wallet', label: 'Finanças' },
];

const moreNav: NavItem[] = [
  { screen: 'clients',   icon: 'people',        label: 'Clientes' },
  { screen: 'inventory', icon: 'inventory_2',   label: 'Estoque' },
  { screen: 'employees', icon: 'badge',         label: 'Funcionários' },
  { screen: 'notes',     icon: 'edit_note',     label: 'Anotações' },
  { screen: 'settings',  icon: 'settings',      label: 'Configurações' },
];

interface MobileBottomNavProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeScreen,
  setActiveScreen,
  darkMode,
  toggleDarkMode,
  handleLogout,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = moreNav.some(item => item.screen === activeScreen);

  const handleNavClick = (screen: string) => {
    setActiveScreen(screen);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* More Menu Sheet */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Bottom Sheet */}
          <div
            className="mobile-more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border-strong opacity-40" />
            </div>

            <div className="px-4 pb-2">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                Mais opções
              </p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {moreNav.map(({ screen, icon, label }) => {
                  const isActive = activeScreen === screen;
                  return (
                    <button
                      key={screen}
                      onClick={() => handleNavClick(screen)}
                      className={`mobile-more-item ${isActive ? 'mobile-more-item-active' : ''}`}
                    >
                      <span className="material-icons-outlined text-[26px]">{icon}</span>
                      <span className="text-xs font-medium mt-1">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-border-main mb-4" />

              {/* Dark mode + Logout */}
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => { toggleDarkMode(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-bg-elevated border border-border-main text-text-secondary hover:text-text-main transition-colors text-sm font-medium"
                >
                  <span className="material-icons-outlined text-[18px]">
                    {darkMode ? 'light_mode' : 'dark_mode'}
                  </span>
                  {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-danger/10 border border-danger/20 text-danger transition-colors text-sm font-medium"
                >
                  <span className="material-icons-outlined text-[18px]">logout</span>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="mobile-bottom-nav lg:hidden">
        <div className="mobile-bottom-nav-inner">
          {primaryNav.map(({ screen, icon, label }) => {
            const isActive = activeScreen === screen;
            return (
              <button
                key={screen}
                onClick={() => handleNavClick(screen)}
                className={`mobile-tab-btn ${isActive ? 'mobile-tab-btn-active' : ''}`}
              >
                <span className={`material-icons-outlined mobile-tab-icon ${isActive ? 'mobile-tab-icon-active' : ''}`}>
                  {icon}
                </span>
                <span className={`mobile-tab-label ${isActive ? 'mobile-tab-label-active' : ''}`}>
                  {label}
                </span>
                {isActive && <span className="mobile-tab-indicator" />}
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`mobile-tab-btn ${isMoreActive || isMoreOpen ? 'mobile-tab-btn-active' : ''}`}
          >
            <span className={`material-icons-outlined mobile-tab-icon ${isMoreActive || isMoreOpen ? 'mobile-tab-icon-active' : ''}`}>
              {isMoreOpen ? 'close' : 'more_horiz'}
            </span>
            <span className={`mobile-tab-label ${isMoreActive || isMoreOpen ? 'mobile-tab-label-active' : ''}`}>
              {isMoreOpen ? 'Fechar' : 'Mais'}
            </span>
            {(isMoreActive || isMoreOpen) && <span className="mobile-tab-indicator" />}
          </button>
        </div>
      </nav>
    </>
  );
};
