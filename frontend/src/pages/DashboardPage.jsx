import React, { useState, useEffect } from 'react';
import { useMonth } from '../context/MonthContext';
import { reportsApi } from '../api';
import SummaryCard from '../components/SummaryCard';
import BudgetProgressBar from '../components/BudgetProgressBar';
import ExpenseTable from '../components/ExpenseTable';
import { formatCurrency } from '../utils/formatters';

function DashboardPage() {
  const { selectedMonth } = useMonth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dashRes = await reportsApi.getDashboard(selectedMonth.month, selectedMonth.year);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (!dashboard) return <div className="empty-state">Erro ao carregar dashboard</div>;

  const hasAnyBudget = dashboard.members_budgets && dashboard.members_budgets.some((m) => m.limit_amount > 0);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      <div className="summary-grid">
        <SummaryCard title="Receitas" value={dashboard.total_income} icon="💵" variant="success" />
        <SummaryCard title="Gastos Diarios" value={dashboard.total_daily_expenses} icon="💰" variant="danger" />
        <SummaryCard
          title="Saldo Projetado"
          value={dashboard.projected_balance}
          icon="📊"
          variant={dashboard.projected_balance >= 0 ? 'success' : 'danger'}
        />
      </div>

      {(dashboard.benefit_credits > 0 || dashboard.benefit_debits > 0 || dashboard.total_benefit_balance > 0) && (
        <div className="benefit-dashboard-section">
          <h2>Beneficios</h2>
          <div className="summary-grid">
            <SummaryCard title="Entradas Beneficio" value={dashboard.benefit_credits} icon="💎" variant="benefit" />
            <SummaryCard title="Gastos Beneficio" value={dashboard.benefit_debits} icon="🛒" variant="benefit-debit" />
            <SummaryCard title="Saldo Beneficios" value={dashboard.total_benefit_balance} icon="💰" variant="benefit-balance" />
          </div>
        </div>
      )}

      {hasAnyBudget && (
        <div className="budget-section">
          <h2>Tetos Mensais</h2>
          <div className="members-budgets">
            {dashboard.members_budgets.map((member) => (
              <div key={member.id} className="member-budget-card">
                <div className="member-header">
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.display_role}</span>
                </div>
                {member.limit_amount > 0 ? (
                  <>
                    <BudgetProgressBar
                      spent={member.spent}
                      limit={member.limit_amount}
                      label={`Teto: ${formatCurrency(member.limit_amount)}`}
                    />
                    <p className={`remaining-text ${member.remaining < 0 ? 'negative' : ''}`}>
                      {member.remaining >= 0
                        ? `Disponivel: ${formatCurrency(member.remaining)}`
                        : `Excedido: ${formatCurrency(Math.abs(member.remaining))}`}
                    </p>
                  </>
                ) : (
                  <p className="no-limit">Teto nao definido</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="details-grid">
        <div className="detail-card">
          <h3>Cartao de Credito</h3>
          <p>Total: {formatCurrency(dashboard.total_credit_card_expenses)}</p>
        </div>
      </div>

      {dashboard.expenses_by_category.length > 0 && (
        <div className="category-section">
          <h2>Gastos por Categoria</h2>
          <ExpenseTable data={dashboard.expenses_by_category} columns={[
            { key: 'category', label: 'Categoria' },
            { key: 'total', label: 'Total', format: 'currency' },
          ]} />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
