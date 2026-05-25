import React, { useState, useEffect } from 'react';
import { benefitCardsApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';

function BenefitCardsPage() {
  const { addToast } = useToast();
  const [cards, setCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await benefitCardsApi.getAll();
      setCards(res.data);
    } catch (err) {
      addToast('Erro ao carregar cartoes', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await benefitCardsApi.create(formData);
      addToast('Cartao de beneficio cadastrado!');
      setShowModal(false);
      setFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (card) => {
    if (!confirm('Excluir este cartao de beneficio?')) return;
    try {
      await benefitCardsApi.delete(card.id);
      addToast('Cartao excluido!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="benefit-cards-page">
      <div className="section-header">
        <h1>Cartoes de Beneficio</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Novo Cartao
        </button>
      </div>

      <div className="summary-grid">
        <SummaryCard title="Saldo Total" value={totalBalance} icon="💎" variant="success" />
      </div>

      <ExpenseTable
        data={cards}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'description', label: 'Descricao' },
          { key: 'balance', label: 'Saldo', format: 'currency' },
        ]}
        onDelete={handleDelete}
      />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormData({}); }} title="Novo Cartao de Beneficio">
        <form className="transaction-form" onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="bc_name">Nome</label>
            <input id="bc_name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required placeholder="Ex: VR, Sodexo..." />
          </div>
          <div className="form-group">
            <label htmlFor="bc_description">Descricao (opcional)</label>
            <input id="bc_description" name="description" type="text" value={formData.description || ''} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Cadastrar Cartao</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default BenefitCardsPage;
