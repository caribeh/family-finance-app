import React, { useState, useEffect } from 'react';
import { useMonth } from '../context/MonthContext';
import { reportsApi } from '../api';
import SummaryCard from '../components/SummaryCard';
import ExpenseTable from '../components/ExpenseTable';
import { formatCurrency } from '../utils/formatters';

function MonthlyReportPage() {
  const { selectedMonth } = useMonth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getMonthlyReport(selectedMonth.month, selectedMonth.year);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Gerando relatorio...</div>;
  if (!report) return <div className="empty-state">Erro ao carregar relatorio</div>;

  const { summary, income_breakdown, expense_breakdown, category_totals, daily_expenses, credit_card_summary, meal_voucher_summary, investment_summary, observations, benefit_summary } = report;

  return (
    <div className="monthly-report-page">
      <h1>Relatorio Mensal</h1>

      <div className="summary-grid">
        <SummaryCard title="Receitas" value={summary.total_income} icon="💵" variant="success" />
        <SummaryCard title="Gastos Totais" value={summary.total_expenses} icon="💰" variant="danger" />
        {summary.credit_cards_breakdown && summary.credit_cards_breakdown.length > 0 && summary.credit_cards_breakdown.map((card) => (
          <SummaryCard key={card.id} title={`Cartao ${card.name}`} value={card.total} icon="💳" variant="warning" />
        ))}
        <SummaryCard title="Total Cartoes" value={summary.total_credit_card} icon="💳" variant="warning" />
        <SummaryCard title="Pagamento Dividas" value={summary.total_debt_payments} icon="📑" variant="warning" />
        <SummaryCard title="Investimentos" value={summary.total_investments} icon="📈" variant="info" />
      </div>

      <div className="report-section">
        <h2>Resumo Final</h2>
        <div className="report-summary">
          <div className="report-line">
            <span>Receitas</span>
            <span className="positive">+ {formatCurrency(summary.total_income)}</span>
          </div>
          <div className="report-line">
            <span>Gastos Totais</span>
            <span className="negative">- {formatCurrency(summary.total_expenses)}</span>
          </div>
          {summary.credit_cards_breakdown && summary.credit_cards_breakdown.length > 0 && summary.credit_cards_breakdown.map((card) => (
            <div className="report-line" key={card.id}>
              <span>Cartao {card.name}</span>
              <span className="negative">- {formatCurrency(card.total)}</span>
            </div>
          ))}
          <div className="report-line">
            <span>Total Cartoes</span>
            <span className="negative">- {formatCurrency(summary.total_credit_card)}</span>
          </div>
          <div className="report-line">
            <span>Pagamento Dividas</span>
            <span className="negative">- {formatCurrency(summary.total_debt_payments)}</span>
          </div>
          <div className="report-line report-total">
            <span>Saldo do Mes</span>
            <span className={summary.final_balance >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(summary.final_balance)}
            </span>
          </div>
          <div className="report-line report-projected">
            <span>Saldo Projetado</span>
            <span className={summary.projected_balance >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(summary.projected_balance)}
            </span>
          </div>
        </div>
      </div>

      {category_totals.length > 0 && (
        <div className="report-section">
          <h2>Gastos por Categoria</h2>
          <ExpenseTable
            data={category_totals}
            columns={[
              { key: 'category', label: 'Categoria' },
              { key: 'total', label: 'Total', format: 'currency' },
            ]}
          />
        </div>
      )}

      {daily_expenses.length > 0 && (
        <div className="report-section">
          <h2>Gastos Diarios</h2>
          <ExpenseTable
            data={daily_expenses}
            columns={[
              { key: 'expense_date', label: 'Data', format: 'date' },
              { key: 'description', label: 'Descricao' },
              { key: 'amount', label: 'Valor', format: 'currency' },
              { key: 'payment_method', label: 'Pagamento' },
              { key: 'paid_by', label: 'Responsavel' },
              { key: 'category', label: 'Categoria' },
            ]}
          />
        </div>
      )}

      {credit_card_summary.length > 0 && (
        <div className="report-section">
          <h2>Cartoes de Credito</h2>
          <ExpenseTable
            data={credit_card_summary}
            columns={[
              { key: 'purchase_date', label: 'Data', format: 'date' },
              { key: 'description', label: 'Descricao' },
              { key: 'total_amount', label: 'Valor', format: 'currency' },
              { key: 'total_installments', label: 'Parcelas', render: (val, row) => val > 1 ? `${val}x ${row.installment_amount.toFixed(2)}` : 'A vista' },
              { key: 'establishment', label: 'Estabelecimento' },
            ]}
          />
        </div>
      )}

      {investment_summary.length > 0 && (
        <div className="report-section">
          <h2>Investimentos</h2>
          <p className="report-total-investments">Total em investimentos: {formatCurrency(summary.total_investments)}</p>
          <ExpenseTable
            data={investment_summary}
            columns={[
              { key: 'type', label: 'Tipo' },
              { key: 'institution', label: 'Instituicao' },
              { key: 'applied_amount', label: 'Aplicado', format: 'currency' },
              { key: 'current_value', label: 'Valor Atual', format: 'currency' },
            ]}
          />
        </div>
      )}

      {observations && observations.length > 0 && (
        <div className="report-section">
          <h2>Observacoes do Mes</h2>
          <div className="observations-list">
            {observations.map((obs, idx) => (
              <div key={idx} className="observation-item">
                {obs.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {benefit_summary && benefit_summary.cards.length > 0 && (
        <div className="report-section report-section--benefit">
          <h2>Beneficios</h2>
          <div className="benefit-report-summary">
            <div className="benefit-report-line">
              <span>Entradas</span>
              <span className="positive">+ {formatCurrency(benefit_summary.total_credits)}</span>
            </div>
            <div className="benefit-report-line">
              <span>Gastos</span>
              <span className="negative">- {formatCurrency(benefit_summary.total_debits)}</span>
            </div>
            <div className="benefit-report-line benefit-report-total">
              <span>Saldo Total</span>
              <span>{formatCurrency(benefit_summary.total_balance)}</span>
            </div>
          </div>

          <h3>Cartoes</h3>
          <ExpenseTable
            data={benefit_summary.cards}
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'description', label: 'Descricao' },
              { key: 'balance', label: 'Saldo', format: 'currency' },
            ]}
          />

          {benefit_summary.entries.length > 0 && (
            <>
              <h3>Movimentacoes do Mes</h3>
              <ExpenseTable
                data={benefit_summary.entries}
                columns={[
                  { key: 'date', label: 'Data', format: 'date' },
                  { key: 'type', label: 'Tipo', render: (val) => val === 'credit' ? 'Entrada' : 'Gasto' },
                  { key: 'description', label: 'Descricao' },
                  { key: 'amount', label: 'Valor', format: 'currency' },
                  { key: 'category', label: 'Categoria' },
                ]}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MonthlyReportPage;
