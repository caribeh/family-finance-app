import React, { useState, useEffect } from 'react';
import { creditCardsApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';
import { getLocalToday } from '../utils/formatters';

function CreditCardsPage() {
  const { addToast } = useToast();
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const res = await creditCardsApi.getAll();
      setCards(res.data);
    } catch (err) {
      addToast('Erro ao carregar cartoes', 'error');
    }
  };

  const loadInvoice = async (cardId) => {
    try {
      const res = await creditCardsApi.getInvoice(cardId);
      setInvoice(res.data);
      setSelectedCard(res.data.card);
    } catch (err) {
      addToast('Erro ao carregar fatura', 'error');
    }
  };

  const handleSaveCard = async (data) => {
    try {
      await creditCardsApi.create(data);
      addToast('Cartao cadastrado!');
      setShowCardModal(false);
      loadCards();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleAddExpense = async (data) => {
    if (!selectedCard) return;
    try {
      await creditCardsApi.addExpense(selectedCard.id, data);
      addToast('Gasto registrado!');
      setShowExpenseModal(false);
      loadInvoice(selectedCard.id);
      loadCards();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar gasto', 'error');
    }
  };

  const handleDeleteCard = async (card) => {
    if (!confirm('Excluir este cartao?')) return;
    try {
      await creditCardsApi.delete(card.id);
      addToast('Cartao excluido!');
      setSelectedCard(null);
      setInvoice(null);
      loadCards();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const cardFields = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'brand', label: 'Bandeira', type: 'text' },
    { name: 'credit_limit', label: 'Limite', type: 'number', required: true },
    { name: 'closing_day', label: 'Dia de Fechamento', type: 'number', required: true },
    { name: 'due_day', label: 'Dia de Vencimento', type: 'number', required: true },
  ];

  const expenseFields = [
    { name: 'description', label: 'Descricao', type: 'text', required: true },
    { name: 'total_amount', label: 'Valor Total', type: 'number', required: true },
    { name: 'total_installments', label: 'Parcelas', type: 'number', defaultValue: '1', required: true },
    { name: 'establishment', label: 'Estabelecimento', type: 'text' },
    { name: 'purchase_date', label: 'Data da Compra', type: 'date', required: true, defaultValue: getLocalToday() },
  ];

  return (
    <div className="credit-cards-page">
      <div className="section-header">
        <h1>Cartoes de Credito</h1>
        <button className="btn-primary" onClick={() => setShowCardModal(true)}>
          Novo Cartao
        </button>
      </div>

      <div className="cards-grid">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''}`}
            onClick={() => loadInvoice(card.id)}
          >
            <h3>{card.name}</h3>
            <p>{card.brand}</p>
            <p className="card-limit">Limite: {card.credit_limit.toFixed(2)}</p>
            <p className="card-available">Disponivel: {card.available_limit.toFixed(2)}</p>
            <button className="btn-delete btn-small" onClick={(e) => { e.stopPropagation(); handleDeleteCard(card); }}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      {invoice && (
        <div className="invoice-section">
          <div className="section-header">
            <h2>Fatura - {invoice.card.name}</h2>
            <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>
              Novo Gasto
            </button>
          </div>

          <div className="summary-grid">
            <SummaryCard title="Total Compras" value={invoice.total_current} icon="💳" variant="warning" />
            <SummaryCard title="Limite Disponivel" value={invoice.available_limit} icon="✅" variant="success" />
          </div>

          <ExpenseTable
            data={invoice.expenses}
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

      <Modal isOpen={showCardModal} onClose={() => setShowCardModal(false)} title="Novo Cartao">
        <TransactionForm fields={cardFields} onSubmit={handleSaveCard} onCancel={() => setShowCardModal(false)} />
      </Modal>

      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Novo Gasto">
        <TransactionForm key="new-expense" fields={expenseFields} onSubmit={handleAddExpense} onCancel={() => setShowExpenseModal(false)} />
      </Modal>
    </div>
  );
}

export default CreditCardsPage;
