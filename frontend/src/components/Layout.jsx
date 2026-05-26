import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMonth } from '../context/MonthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import MonthlyNavigator from './MonthlyNavigator';
import '../styles/global.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const { monthLabel } = useMonth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="layout">
      <Sidebar onLogout={logout} userName={user?.name} />
      <div className="main-content">
        <header className="top-header">
          <MonthlyNavigator />
          <div className="user-info">
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}>
              {theme === 'light' ? '\u263E' : '\u2600'}
            </button>
            <span>{monthLabel}</span>
            <span className="user-name">{user?.name}</span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
