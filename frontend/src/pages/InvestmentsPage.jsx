import React, { useState, useEffect } from 'react';
import { investmentsApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';

function InvestmentsPage() {
  const { addToast } = useToast();
  const [investments, setInvestments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemingInvestment, setRedeemingInvestment] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const invRes = await investmentsApi.getAll();
      setInvestments(invRes.data);
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await investmentsApi.create(formData);
      addToast('Investimento cadastrado!');
      setShowCreateModal(false);
      setFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleOpenRedeem = (investment) => {
    setRedeemingInvestment(investment);
    setRedeemAmount(investment.current_value.toString());
    setShowRedeemModal(true);
  };

  const handleRedeem = async () => {
    try {
      await investmentsApi.redeem(redeemingInvestment.id, {
        amount: parseFloat(redeemAmount),
      });
      addToast('Resgate realizado!');
      setShowRedeemModal(false);
      setRedeemingInvestment(null);
      setRedeemAmount('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao resgatar', 'error');
    }
  };

  const handleDelete = async (investment) => {
    if (!confirm('Excluir este investimento?')) return;
    try {
      await investmentsApi.delete(investment.id);
      addToast('Investimento excluido!');
      loadData();
    } catch (err) {
      addToast('Erro ao excluir', 'error');
    }
  };

  const typeOptions = [
    { value: 'poupanca', label: 'Poupanca' },
    { value: 'cdb', label: 'CDB' },
    { value: 'tesouro', label: 'Tesouro Direto' },
    { value: 'acoes', label: 'Acoes' },
    { value: 'fii', label: 'FIIs' },
    { value: 'outro', label: 'Outro' },
  ];

  const totalApplied = investments.reduce((sum, inv) => sum + inv.applied_amount, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + (inv.current_value || inv.applied_amount), 0);

  return (
    <div className="investments-page">
      <div className="section-header">
        <h1>Investimentos</h1>
        <button className="btn-primary" onClick={() => { setFormData({ application_date: new Date().toISOString().split('T')[0] }); setShowCreateModal(true); }}>
          Novo Investimento
        </button>
      </div>

      <div className="summary-grid">
        <SummaryCard title="Total Aplicado" value={totalApplied} icon="💵" variant="default" />
        <SummaryCard title="Valor Atual" value={totalCurrent} icon="📈" variant="success" />
      </div>

      <ExpenseTable
        data={investments}
        columns={[
          { key: 'type', label: 'Tipo' },
          { key: 'institution', label: 'Instituicao' },
          { key: 'applied_amount', label: 'Aplicado', format: 'currency' },
          { key: 'current_value', label: 'Valor Atual', format: 'currency' },
          { key: 'status', label: 'Status', render: (val) => val === 'active' ? 'Ativo' : 'Fechado' },
        ]}
        onAction={handleOpenRedeem}
        actionLabel="Resgatar"
        onDelete={handleDelete}
      />

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setFormData({}); }} title="Novo Investimento">
        <form className="transaction-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="inv_type">Tipo</label>
            <select id="inv_type" name="type" value={formData.type || ''} onChange={handleChange} required>
              <option value="">Selecione...</option>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="inv_institution">Instituicao</label>
            <input id="inv_institution" name="institution" type="text" value={formData.institution || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="inv_applied_amount">Valor Aplicado</label>
            <input id="inv_applied_amount" name="applied_amount" type="number" step="0.01" min="0.01" value={formData.applied_amount || ''} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="inv_application_date">Data da Aplicacao</label>
            <input id="inv_application_date" name="application_date" type="date" value={formData.application_date || ''} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); setFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Cadastrar Investimento</button>
          </div>
        </form>
      </Modal>

      {/* Redeem Modal */}
      <Modal isOpen={showRedeemModal} onClose={() => { setShowRedeemModal(false); setRedeemingInvestment(null); }} title={`Resgatar - ${redeemingInvestment?.type} ${redeemingInvestment?.institution || ''}`}>
        <div className="redeem-form">
          <p>Valor atual: R$ {redeemingInvestment?.current_value?.toFixed(2)}</p>
          <div className="form-group">
            <label htmlFor="redeem_amount">Valor do Resgate (R$)</label>
            <input
              id="redeem_amount"
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max={redeemingInvestment?.current_value}
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setShowRedeemModal(false); setRedeemingInvestment(null); }}>Cancelar</button>
            <button className="btn-primary" onClick={handleRedeem}>Confirmar Resgate</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InvestmentsPage;
