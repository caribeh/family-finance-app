import React, { useState, useEffect } from 'react';
import { bankAccountsApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import { formatCurrency } from '../utils/formatters';

function BankAccountsPage() {
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await bankAccountsApi.getAll();
      setAccounts(res.data);
    } catch (err) {
      addToast('Erro ao carregar contas', 'error');
    }
  };

  const handleOpenModal = (account = null) => {
    setEditingAccount(account);
    setFormData(account || { name: '', bank_name: '', account_type: 'checking', balance: 0 });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await bankAccountsApi.update(editingAccount.id, formData);
        addToast('Conta atualizada!');
      } else {
        await bankAccountsApi.create(formData);
        addToast('Conta cadastrada!');
      }
      setShowModal(false);
      setEditingAccount(null);
      setFormData({});
      loadAccounts();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (account) => {
    if (!confirm(`Excluir conta ${account.name}?`)) return;
    try {
      await bankAccountsApi.delete(account.id);
      addToast('Conta excluida!');
      loadAccounts();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  return (
    <div className="bank-accounts-page">
      <div className="section-header">
        <h1>Contas Correntes</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          Nova Conta
        </button>
      </div>

      <div className="summary-grid">
        {accounts.map((a) => (
          <div key={a.id} className={`summary-card summary-card--${a.balance >= 0 ? 'success' : 'danger'}`}>
            <div className="card-header">
              <span className="card-icon">🏦</span>
              <span className="card-title">{a.name}</span>
            </div>
            <p className="card-subtitle">{a.bank_name || 'Sem banco'} - {a.account_type === 'checking' ? 'Corrente' : 'Poupanca'}</p>
            <div className="card-value">{formatCurrency(a.balance)}</div>
          </div>
        ))}
      </div>

      <ExpenseTable
        data={accounts}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'bank_name', label: 'Banco' },
          { key: 'account_type', label: 'Tipo', render: (val) => val === 'checking' ? 'Corrente' : 'Poupanca' },
          { key: 'balance', label: 'Saldo', format: 'currency' },
        ]}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingAccount(null); }} title={editingAccount ? 'Editar Conta' : 'Nova Conta'}>
        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome da Conta</label>
            <input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required placeholder="Ex: Conta Principal" />
          </div>
          <div className="form-group">
            <label htmlFor="bank_name">Banco</label>
            <input id="bank_name" name="bank_name" type="text" value={formData.bank_name || ''} onChange={handleChange} placeholder="Ex: Nubank, Itaú..." />
          </div>
          <div className="form-group">
            <label htmlFor="account_type">Tipo</label>
            <select id="account_type" name="account_type" value={formData.account_type || 'checking'} onChange={handleChange}>
              <option value="checking">Corrente</option>
              <option value="savings">Poupanca</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="balance">Saldo Inicial</label>
            <input id="balance" name="balance" type="number" step="0.01" value={formData.balance || 0} onChange={handleChange} placeholder="0.00" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingAccount(null); }}>Cancelar</button>
            <button type="submit" className="btn-primary">{editingAccount ? 'Atualizar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BankAccountsPage;
