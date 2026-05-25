import React, { useState, useEffect } from 'react';
import { useMonth } from '../context/MonthContext';
import { dailyExpensesApi, creditCardsApi, mealVouchersApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import { getLocalToday } from '../utils/formatters';

function DailyExpensesPage() {
  const { selectedMonth } = useMonth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [mealVouchers, setMealVouchers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const [expRes, cardsRes, vouchersRes] = await Promise.all([
        dailyExpensesApi.getAll(selectedMonth.month, selectedMonth.year),
        creditCardsApi.getAll(),
        mealVouchersApi.getAll(),
      ]);
      setExpenses(expRes.data);
      setCreditCards(cardsRes.data);
      setMealVouchers(vouchersRes.data);
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingExpense) {
        await dailyExpensesApi.update(editingExpense.id, data);
        addToast('Gasto atualizado!');
      } else {
        await dailyExpensesApi.create(data);
        addToast('Gasto registrado!');
      }
      setShowModal(false);
      setEditingExpense(null);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (expense) => {
    if (!confirm('Excluir este gasto?')) return;
    try {
      await dailyExpensesApi.delete(expense.id);
      addToast('Gasto excluido!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const paymentMethodOptions = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartao de Credito' },
    { value: 'meal_voucher', label: 'Vale-Alimentacao' },
  ];

  const paidByOptions = [
    { value: 'user', label: 'Eu' },
    { value: 'wife', label: 'Esposa' },
  ];

  const getFields = () => {
    const today = getLocalToday();
    const fields = [
      { name: 'description', label: 'Descricao', type: 'text', required: true },
      { name: 'amount', label: 'Valor', type: 'number', required: true },
      { name: 'expense_date', label: 'Data', type: 'date', required: true, defaultValue: today },
      {
        name: 'payment_method',
        label: 'Forma de Pagamento',
        type: 'select',
        required: true,
        options: paymentMethodOptions,
      },
      {
        name: 'paid_by',
        label: 'Quem Pagou',
        type: 'select',
        required: true,
        options: paidByOptions,
      },
      { name: 'category', label: 'Categoria', type: 'text' },
    ];

    if (creditCards.length > 0) {
      fields.push({
        name: 'credit_card_id',
        label: 'Cartao de Credito',
        type: 'select',
        options: creditCards.map((c) => ({ value: c.id, label: `${c.name} (R$ ${c.available_limit})` })),
      });
    }

    if (mealVouchers.length > 0) {
      fields.push({
        name: 'meal_voucher_id',
        label: 'Vale-Alimentacao',
        type: 'select',
        options: mealVouchers.map((v) => ({ value: v.id, label: `${v.description} (R$ ${v.available_balance})` })),
      });
    }

    return fields;
  };

  return (
    <div className="daily-expenses-page">
      <div className="section-header">
        <h1>Gastos Diarios</h1>
        <button className="btn-primary" onClick={() => { setEditingExpense(null); setShowModal(true); }}>
          Novo Gasto
        </button>
      </div>

      <ExpenseTable
        data={expenses}
        columns={[
          { key: 'expense_date', label: 'Data', format: 'date' },
          { key: 'description', label: 'Descricao' },
          { key: 'amount', label: 'Valor', format: 'currency' },
          { key: 'payment_method', label: 'Pagamento', render: (val) => val === 'cash' ? 'Dinheiro' : val === 'credit_card' ? 'Cartao' : 'VA' },
          { key: 'paid_by', label: 'Responsavel', render: (val) => val === 'user' ? 'Eu' : 'Esposa' },
          { key: 'category', label: 'Categoria' },
        ]}
        onEdit={(row) => { setEditingExpense(row); setShowModal(true); }}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingExpense(null); }} title={editingExpense ? 'Editar Gasto' : 'Novo Gasto'}>
        <TransactionForm
          key={editingExpense?.id || 'new'}
          fields={getFields()}
          onSubmit={handleSave}
          initialData={editingExpense}
          onCancel={() => { setShowModal(false); setEditingExpense(null); }}
        />
      </Modal>
    </div>
  );
}

export default DailyExpensesPage;
