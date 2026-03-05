import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Bot, BarChart2,
  Settings, LogOut, Wallet, Menu, X, ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { title: 'Dashboard', path: '/', icon: LayoutDashboard },
  { title: 'Lançamentos', path: '/lancamentos', icon: Receipt },
  { title: 'Assistente IA', path: '/assistente', icon: Bot, badge: true },
  { title: 'Relatórios', path: '/relatorios', icon: BarChart2 },
];

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {/* ===== NAVBAR HORIZONTAL ===== */}
      <header className="flex-shrink-0 z-30 sidebar-gradient border-b border-sidebar-border">
        <div className="flex items-center h-14 px-4 lg:px-6 gap-4">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-base font-bold text-primary-foreground tracking-tight hidden sm:block">Meu Norte</span>
          </NavLink>

          {/* Nav items — desktop */}
          <nav className="hidden lg:flex items-center gap-1 ml-4 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Spacer mobile */}
          <div className="flex-1 lg:hidden" />

          {/* User menu — desktop */}
          <div className="hidden lg:flex items-center gap-2 relative">
            <NavLink
              to="/configuracoes"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                ${location.pathname === '/configuracoes'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </NavLink>

            {/* Avatar dropdown */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-primary-foreground max-w-[120px] truncate">{user?.nome || 'Usuário'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-sidebar-muted" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1 fade-in">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-foreground truncate">{user?.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
          >
            <Menu className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-[280px] sidebar-gradient flex flex-col fade-in">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-sidebar-primary-foreground" />
                </div>
                <span className="text-base font-bold text-primary-foreground">Meu Norte</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm font-semibold">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">{user?.nome}</p>
                <p className="text-[11px] text-sidebar-muted truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative
                      ${isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.title}</span>
                    {item.badge && <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-auto" />}
                  </NavLink>
                );
              })}
            </nav>

            <div className="px-2 pb-4 space-y-1 border-t border-sidebar-border pt-4">
              <NavLink
                to="/configuracoes"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full
                  ${location.pathname === '/configuracoes'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
              >
                <Settings className="w-5 h-5" />
                <span>Configurações</span>
              </NavLink>
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
