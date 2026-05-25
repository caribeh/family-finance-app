import React, { useState, useEffect } from 'react';
import { fixedIncomesApi, fixedExpensesApi, bankAccountsApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';

function FixedDataPage() {
  const { addToast } = useToast();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [incRes, expRes, cardsRes] = await Promise.all([
        fixedIncomesApi.getAll(),
        fixedExpensesApi.getAll(),
        bankAccountsApi.getAll(),
      ]);
      setIncomes(incRes.data);
      setExpenses(expRes.data);
      setBankAccounts(cardsRes.data);
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    }
  };

  const handleSaveIncome = async (data) => {
    try {
      if (editingIncome) {
        await fixedIncomesApi.update(editingIncome.id, data);
        addToast('Renda atualizada!');
      } else {
        await fixedIncomesApi.create(data);
        addToast('Renda cadastrada!');
      }
      setShowIncomeModal(false);
      setEditingIncome(null);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleSaveExpense = async (data) => {
    try {
      if (editingExpense) {
        await fixedExpensesApi.update(editingExpense.id, data);
        addToast('Conta atualizada!');
      } else {
        await fixedExpensesApi.create(data);
        addToast('Conta cadastrada!');
      }
      setShowExpenseModal(false);
      setEditingExpense(null);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleMarkPaid = async (expense) => {
    try {
      await fixedExpensesApi.markPaid(expense.id, expense.bank_account_id);
      addToast('Conta marcada como paga!');
      loadData();
    } catch (err) {
      addToast('Erro ao marcar como paga', 'error');
    }
  };

  const handleDeleteIncome = async (income) => {
    if (!confirm('Excluir esta renda?')) return;
    try {
      await fixedIncomesApi.delete(income.id);
      addToast('Renda excluida!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const handleDeleteExpense = async (expense) => {
    if (!confirm('Excluir esta conta?')) return;
    try {
      await fixedExpensesApi.delete(expense.id);
      addToast('Conta excluida!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const getIncomeFields = () => {
    const fields = [
      { name: 'description', label: 'Descricao', type: 'text', required: true },
      { name: 'amount', label: 'Valor', type: 'number', required: true },
      { name: 'due_day', label: 'Dia de Recebimento', type: 'number', required: true },
    ];
    if (bankAccounts.length > 0) {
      fields.push({
        name: 'bank_account_id',
        label: 'Conta Destino',
        type: 'select',
        options: bankAccounts.map((a) => ({ value: a.id, label: `${a.name} (${a.bank_name || 'Sem banco'})` })),
      });
    }
    return fields;
  };

  const paymentMethodOptions = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'debit', label: 'Debito' },
    { value: 'credit_card', label: 'Cartao de Credito' },
    { value: 'meal_voucher', label: 'Vale-Alimentacao' },
  ];

  const getExpenseFields = () => {
    const fields = [
      { name: 'description', label: 'Descricao', type: 'text', required: true },
      { name: 'amount', label: 'Valor', type: 'number', required: true },
      { name: 'due_day', label: 'Dia de Vencimento', type: 'number', required: true },
      { name: 'category', label: 'Categoria', type: 'text', required: true },
      {
        name: 'payment_method',
        label: 'Forma de Pagamento',
        type: 'select',
        required: true,
        options: paymentMethodOptions,
        defaultValue: editingExpense?.payment_method || 'cash',
      },
    ];

    if (bankAccounts.length > 0) {
      fields.push({
        name: 'bank_account_id',
        label: 'Conta de Origem',
        type: 'select',
        options: bankAccounts.map((a) => ({ value: a.id, label: `${a.name} (R$ ${a.balance.toFixed(2)})` })),
      });
    }

    return fields;
  };

  return (
    <div className="fixed-data-page">
      <h1>Dados Fixos</h1>

      <div className="section">
        <div className="section-header">
          <h2>Rendas Fixas</h2>
          <button className="btn-primary" onClick={() => { setEditingIncome(null); setShowIncomeModal(true); }}>
            Nova Renda
          </button>
        </div>
        <ExpenseTable
          data={incomes}
          columns={[
            { key: 'description', label: 'Descricao' },
            { key: 'amount', label: 'Valor', format: 'currency' },
            { key: 'due_day', label: 'Dia' },
            { key: 'bank_account_id', label: 'Conta', render: (val) => {
              const acc = bankAccounts.find(a => a.id === val);
              return acc ? acc.name : '-';
            }},
          ]}
          onEdit={(row) => { setEditingIncome(row); setShowIncomeModal(true); }}
          onDelete={handleDeleteIncome}
        />
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Contas Fixas</h2>
          <button className="btn-primary" onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}>
            Nova Conta
          </button>
        </div>
        <ExpenseTable
          data={expenses}
          columns={[
            { key: 'description', label: 'Descricao' },
            { key: 'amount', label: 'Valor', format: 'currency' },
            { key: 'due_day', label: 'Vencimento' },
            { key: 'category', label: 'Categoria' },
            { key: 'payment_method', label: 'Pagamento', render: (val) => {
              const labels = { cash: 'Dinheiro', pix: 'PIX', debit: 'Debito', credit_card: 'Credito', meal_voucher: 'VA' };
              return labels[val] || val || 'Dinheiro';
            }},
            { key: 'is_paid', label: 'Status', render: (val) => val ? 'Paga' : 'Pendente' },
          ]}
          onAction={handleMarkPaid}
          actionLabel="Pagar"
          onEdit={(row) => { setEditingExpense(row); setShowExpenseModal(true); }}
          onDelete={handleDeleteExpense}
        />
      </div>

      <Modal isOpen={showIncomeModal} onClose={() => { setShowIncomeModal(false); setEditingIncome(null); }} title={editingIncome ? 'Editar Renda' : 'Nova Renda'}>
        <TransactionForm
          fields={getIncomeFields()}
          onSubmit={handleSaveIncome}
          initialData={editingIncome}
          onCancel={() => { setShowIncomeModal(false); setEditingIncome(null); }}
        />
      </Modal>

      <Modal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }} title={editingExpense ? 'Editar Conta' : 'Nova Conta'}>
        <TransactionForm
          fields={getExpenseFields()}
          onSubmit={handleSaveExpense}
          initialData={editingExpense}
          onCancel={() => { setShowExpenseModal(false); setEditingExpense(null); }}
        />
      </Modal>
    </div>
  );
}

export default FixedDataPage;
