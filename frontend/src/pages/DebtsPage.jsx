import React, { useState, useEffect } from 'react';
import { debtsApi, bankAccountsApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';

function DebtsPage() {
  const { addToast } = useToast();
  const [debts, setDebts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingDebt, setPayingDebt] = useState(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [customPayAmount, setCustomPayAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [debtsRes, accountsRes] = await Promise.all([
        debtsApi.getAll(),
        bankAccountsApi.getAll(),
      ]);
      setDebts(debtsRes.data);
      setBankAccounts(accountsRes.data);
    } catch (err) {
      addToast('Erro ao carregar dividas', 'error');
    }
  };

  const handleSave = async (data) => {
    try {
      await debtsApi.create(data);
      addToast('Divida cadastrada!');
      setShowModal(false);
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleOpenPayModal = (debt) => {
    setPayingDebt(debt);
    setSelectedBankAccount(debt.bank_account_id || '');
    setCustomPayAmount(debt.installment_amount?.toString() || '');
    setShowPayModal(true);
  };

  const handlePayInstallment = async () => {
    try {
      const amount = customPayAmount ? parseFloat(customPayAmount) : null;
      await debtsApi.payInstallment(payingDebt.id, selectedBankAccount || null, amount);
      addToast('Parcela paga!');
      setShowPayModal(false);
      setPayingDebt(null);
      setSelectedBankAccount('');
      setCustomPayAmount('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao pagar parcela', 'error');
    }
  };

  const handleDelete = async (debt) => {
    if (!confirm('Excluir esta divida?')) return;
    try {
      await debtsApi.delete(debt.id);
      addToast('Divida excluida!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const typeOptions = [
    { value: 'debt', label: 'Divida (eu devo)' },
    { value: 'loan', label: 'Emprestimo (me devem)' },
  ];

  const debtFields = [
    { name: 'creditor_debtor', label: 'Credor/Devedor', type: 'text', required: true },
    { name: 'installment_amount', label: 'Valor da Parcela', type: 'number', required: true },
    { name: 'total_installments', label: 'Total de Parcelas', type: 'number', required: true },
    { name: 'start_date', label: 'Data de Inicio', type: 'date', required: true },
    { name: 'type', label: 'Tipo', type: 'select', required: true, options: typeOptions },
  ];

  return (
    <div className="debts-page">
      <div className="section-header">
        <h1>Dividas e Emprestimos</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Novo Registro
        </button>
      </div>

      <ExpenseTable
        data={debts}
        columns={[
          { key: 'creditor_debtor', label: 'Credor/Devedor' },
          { key: 'installment_amount', label: 'Parcela', format: 'currency' },
          { key: 'type', label: 'Tipo', render: (val) => val === 'debt' ? 'Divida' : 'Emprestimo' },
          { key: 'paid_installments', label: 'Parcelas', render: (val, row) => `${val}/${row.total_installments}` },
        ]}
        onAction={handleOpenPayModal}
        actionLabel="Pagar Parcela"
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nova Divida/Emprestimo">
        <TransactionForm fields={debtFields} onSubmit={handleSave} onCancel={() => setShowModal(false)} />
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => { setShowPayModal(false); setPayingDebt(null); }} title={`Pagar Parcela - ${payingDebt?.creditor_debtor}`}>
        <div className="pay-debt-form">
          <p>Parcela sugerida: R$ {payingDebt?.installment_amount?.toFixed(2)} ({payingDebt?.paid_installments + 1} de {payingDebt?.total_installments})</p>
          <div className="form-group">
            <label htmlFor="pay_amount">Valor a pagar (R$)</label>
            <input
              id="pay_amount"
              type="number"
              value={customPayAmount}
              onChange={(e) => setCustomPayAmount(e.target.value)}
              placeholder="Valor da parcela"
              step="0.01"
              min="0.01"
            />
          </div>
          {bankAccounts.length > 0 && (
            <div className="form-group">
              <label htmlFor="bank_account">Conta de Origem (opcional)</label>
              <select id="bank_account" value={selectedBankAccount} onChange={(e) => setSelectedBankAccount(e.target.value)}>
                <option value="">Nenhuma</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (R$ {a.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setShowPayModal(false); setPayingDebt(null); }}>Cancelar</button>
            <button className="btn-primary" onClick={handlePayInstallment}>Confirmar Pagamento</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DebtsPage;
