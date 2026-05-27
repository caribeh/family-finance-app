import React from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/daily-control', label: 'Controle Diario', icon: '💰' },
  { path: '/bank-accounts', label: 'Contas Correntes', icon: '🏦' },
  { path: '/credit-cards', label: 'Cartoes de Credito', icon: '💳' },
  { path: '/benefit-cards', label: 'Cartoes de Beneficio', icon: '💎' },
  { path: '/debts', label: 'Dividas', icon: '📑' },
  { path: '/investments', label: 'Investimentos', icon: '📈' },
  { path: '/subscriptions', label: 'Assinaturas', icon: '🔄' },
  { path: '/monthly-report', label: 'Relatorio Mensal', icon: '📄' },
  { path: '/bill-reminders', label: 'Lembretes', icon: '🔔' },
];

const adminMenuItem = { path: '/admin', label: 'Administracao', icon: '⚙️' };

function Sidebar({ onLogout, userName }) {
  const items = [...menuItems, adminMenuItem];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Family Finance</h2>
        {userName && <p className="sidebar-user">{userName}</p>}
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="logout-btn" onClick={onLogout}>
        Sair
      </button>
    </aside>
  );
}

export default Sidebar;
