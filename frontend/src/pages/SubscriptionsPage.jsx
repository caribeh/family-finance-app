import React, { useState, useEffect } from 'react';
import { subscriptionsApi, creditCardsApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';

function SubscriptionsPage() {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, cardRes] = await Promise.all([
        subscriptionsApi.getAll(),
        creditCardsApi.getAll(),
      ]);
      setSubscriptions(subRes.data);
      setCreditCards(cardRes.data);
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await subscriptionsApi.create(formData);
      addToast('Assinatura cadastrada!');
      setShowModal(false);
      setFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleCancel = async (subscription) => {
    if (!confirm(`Cancelar assinatura ${subscription.name}?`)) return;
    try {
      await subscriptionsApi.cancel(subscription.id);
      addToast('Assinatura cancelada!');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao cancelar', 'error');
    }
  };

  const handleDelete = async (subscription) => {
    if (!confirm('Excluir esta assinatura?')) return;
    try {
      await subscriptionsApi.delete(subscription.id);
      addToast('Assinatura excluida!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const totalActive = subscriptions.filter((s) => s.is_active).reduce((sum, s) => sum + s.amount, 0);
  const totalCancelled = subscriptions.filter((s) => !s.is_active).reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="subscriptions-page">
      <div className="section-header">
        <h1>Assinaturas</h1>
        <button className="btn-primary" onClick={() => { setFormData({ billing_day: '1' }); setShowModal(true); }}>
          Nova Assinatura
        </button>
      </div>

      <div className="summary-grid">
        <SummaryCard title="Total Ativo" value={totalActive} icon="📋" variant="success" />
        <SummaryCard title="Total Cancelado" value={totalCancelled} icon="🚫" variant="danger" />
      </div>

      <ExpenseTable
        data={subscriptions}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'amount', label: 'Valor', format: 'currency' },
          { key: 'billing_day', label: 'Dia Cobranca', render: (val) => `Dia ${val}` },
          { key: 'credit_card_id', label: 'Cartao', render: (val) => {
            const card = creditCards.find((c) => c.id === val);
            return card ? card.name : '-';
          }},
          { key: 'is_active', label: 'Status', render: (val) => val ? 'Ativo' : 'Cancelado' },
        ]}
        onAction={handleCancel}
        actionLabel="Cancelar"
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormData({}); }} title="Nova Assinatura">
        <form className="transaction-form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="sub_name">Nome</label>
            <input id="sub_name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required placeholder="Ex: Netflix, Spotify..." />
          </div>
          <div className="form-group">
            <label htmlFor="sub_amount">Valor Mensal</label>
            <input id="sub_amount" name="amount" type="number" step="0.01" min="0.01" value={formData.amount || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="sub_billing_day">Dia de Cobranca</label>
            <input id="sub_billing_day" name="billing_day" type="number" min="1" max="31" value={formData.billing_day || '1'} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="sub_credit_card_id">Cartao de Credito</label>
            <select id="sub_credit_card_id" name="credit_card_id" value={formData.credit_card_id || ''} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Cadastrar Assinatura</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SubscriptionsPage;
