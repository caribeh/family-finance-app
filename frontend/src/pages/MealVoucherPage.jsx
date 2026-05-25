import React, { useState, useEffect } from 'react';
import { mealVouchersApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';

function MealVoucherPage() {
  const { addToast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const res = await mealVouchersApi.getAll();
      setVouchers(res.data);
    } catch (err) {
      addToast('Erro ao carregar vales', 'error');
    }
  };

  const handleSaveVoucher = async (data) => {
    try {
      await mealVouchersApi.create(data);
      addToast('Vale cadastrado!');
      setShowVoucherModal(false);
      loadVouchers();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleAddCredit = async (data) => {
    if (!selectedVoucher) return;
    try {
      await mealVouchersApi.addCredit(selectedVoucher.id, data);
      addToast('Credito adicionado!');
      setShowCreditModal(false);
      loadVouchers();
    } catch (err) {
      addToast('Erro ao adicionar credito', 'error');
    }
  };

  const handleAddExpense = async (data) => {
    if (!selectedVoucher) return;
    try {
      const res = await mealVouchersApi.addExpense(selectedVoucher.id, data);
      addToast('Gasto registrado!');
      setShowExpenseModal(false);
      loadVouchers();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar gasto', 'error');
    }
  };

  const handleDeleteVoucher = async (voucher) => {
    if (!confirm('Excluir este vale?')) return;
    try {
      await mealVouchersApi.delete(voucher.id);
      addToast('Vale excluido!');
      setSelectedVoucher(null);
      setExpenses([]);
      loadVouchers();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const voucherFields = [
    { name: 'description', label: 'Descricao', type: 'text', required: true },
    { name: 'monthly_credit', label: 'Credito Mensal', type: 'number', required: true },
    { name: 'credit_date', label: 'Data de Credito', type: 'date', required: true },
  ];

  const creditFields = [
    { name: 'amount', label: 'Valor do Credito', type: 'number', required: true },
  ];

  const expenseFields = [
    { name: 'description', label: 'Descricao', type: 'text', required: true },
    { name: 'amount', label: 'Valor', type: 'number', required: true },
    { name: 'establishment', label: 'Estabelecimento', type: 'text' },
    { name: 'expense_date', label: 'Data', type: 'date', required: true },
  ];

  return (
    <div className="meal-voucher-page">
      <div className="section-header">
        <h1>Vale-Alimentacao</h1>
        <button className="btn-primary" onClick={() => setShowVoucherModal(true)}>
          Novo Vale
        </button>
      </div>

      <div className="cards-grid">
        {vouchers.map((v) => (
          <div
            key={v.id}
            className={`card-item ${selectedVoucher?.id === v.id ? 'selected' : ''}`}
            onClick={() => setSelectedVoucher(v)}
          >
            <h3>{v.description}</h3>
            <p className="card-balance">Saldo: R$ {v.available_balance.toFixed(2)}</p>
            <p>Credito: R$ {v.monthly_credit.toFixed(2)}</p>
            <button className="btn-delete btn-small" onClick={(e) => { e.stopPropagation(); handleDeleteVoucher(v); }}>
              Excluir
            </button>
          </div>
        ))}
      </div>

      {selectedVoucher && (
        <div className="voucher-detail">
          <div className="section-header">
            <h2>{selectedVoucher.description}</h2>
            <div>
              <button className="btn-secondary" onClick={() => setShowCreditModal(true)}>
                Adicionar Credito
              </button>
              <button className="btn-primary" onClick={() => setShowExpenseModal(true)}>
                Novo Gasto
              </button>
            </div>
          </div>

          <div className="summary-grid">
            <SummaryCard title="Saldo Disponivel" value={selectedVoucher.available_balance} icon="💰" variant="success" />
            <SummaryCard title="Credito Mensal" value={selectedVoucher.monthly_credit} icon="📅" variant="default" />
          </div>
        </div>
      )}

      <Modal isOpen={showVoucherModal} onClose={() => setShowVoucherModal(false)} title="Novo Vale">
        <TransactionForm fields={voucherFields} onSubmit={handleSaveVoucher} onCancel={() => setShowVoucherModal(false)} />
      </Modal>

      <Modal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} title="Adicionar Credito">
        <TransactionForm fields={creditFields} onSubmit={handleAddCredit} onCancel={() => setShowCreditModal(false)} />
      </Modal>

      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Novo Gasto">
        <TransactionForm fields={expenseFields} onSubmit={handleAddExpense} onCancel={() => setShowExpenseModal(false)} />
      </Modal>
    </div>
  );
}

export default MealVoucherPage;
