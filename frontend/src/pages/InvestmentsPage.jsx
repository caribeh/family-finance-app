import React, { useState, useEffect } from 'react';
import { investmentsApi, bankAccountsApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import SummaryCard from '../components/SummaryCard';

function InvestmentsPage() {
  const { addToast } = useToast();
  const [investments, setInvestments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [operationAmount, setOperationAmount] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invRes, accRes] = await Promise.all([
        investmentsApi.getAll(),
        bankAccountsApi.getAll(),
      ]);
      setInvestments(invRes.data);
      setBankAccounts(accRes.data);
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
    setSelectedInvestment(investment);
    setOperationAmount(investment.current_value.toString());
    setShowRedeemModal(true);
  };

  const handleRedeem = async () => {
    try {
      const res = await investmentsApi.redeem(selectedInvestment.id, {
        amount: parseFloat(operationAmount),
        date: new Date().toISOString().split('T')[0],
      });
      addToast(res.data.message || 'Resgate realizado!');
      setShowRedeemModal(false);
      setSelectedInvestment(null);
      setOperationAmount('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao resgatar', 'error');
    }
  };

  const handleOpenApply = (investment) => {
    setSelectedInvestment(investment);
    setOperationAmount('');
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    try {
      await investmentsApi.apply(selectedInvestment.id, {
        amount: parseFloat(operationAmount),
        date: new Date().toISOString().split('T')[0],
      });
      addToast('Aplicacao realizada!');
      setShowApplyModal(false);
      setSelectedInvestment(null);
      setOperationAmount('');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao aplicar', 'error');
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
          { key: 'bank_name', label: 'Conta', render: (val) => val || '-' },
          { key: 'status', label: 'Status', render: (val) => val === 'active' ? 'Ativo' : 'Fechado' },
          {
            key: 'actions', label: 'Acoes', render: (_, row) => (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {row.status === 'active' && row.bank_account_id && (
                  <>
                    <button className="btn-action" onClick={() => handleOpenApply(row)}>Aplicar</button>
                    <button className="btn-action" onClick={() => handleOpenRedeem(row)}>Resgatar</button>
                  </>
                )}
                <button className="btn-delete" onClick={() => handleDelete(row)}>Excluir</button>
              </div>
            ),
          },
        ]}
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
          <div className="form-group">
            <label htmlFor="inv_bank_account_id">Conta Vinculada</label>
            <select id="inv_bank_account_id" name="bank_account_id" value={formData.bank_account_id || ''} onChange={handleChange}>
              <option value="">Nenhuma</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (R$ {a.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); setFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Cadastrar Investimento</button>
          </div>
        </form>
      </Modal>

      {/* Redeem Modal */}
      <Modal isOpen={showRedeemModal} onClose={() => { setShowRedeemModal(false); setSelectedInvestment(null); }} title={`Resgatar - ${selectedInvestment?.type} ${selectedInvestment?.institution || ''}`}>
        <div className="redeem-form">
          <p>Valor atual: R$ {selectedInvestment?.current_value?.toFixed(2)}</p>
          <p>Conta vinculada: {selectedInvestment?.bank_name || '-'}</p>
          <div className="form-group">
            <label htmlFor="redeem_amount">Valor do Resgate (R$)</label>
            <input
              id="redeem_amount"
              type="number"
              value={operationAmount}
              onChange={(e) => setOperationAmount(e.target.value)}
              step="0.01"
              min="0.01"
              max={selectedInvestment?.current_value}
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setShowRedeemModal(false); setSelectedInvestment(null); }}>Cancelar</button>
            <button className="btn-primary" onClick={handleRedeem}>Confirmar Resgate</button>
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => { setShowApplyModal(false); setSelectedInvestment(null); }} title={`Aplicar - ${selectedInvestment?.type} ${selectedInvestment?.institution || ''}`}>
        <div className="redeem-form">
          <p>Valor atual: R$ {selectedInvestment?.current_value?.toFixed(2)}</p>
          <p>Conta vinculada: {selectedInvestment?.bank_name || '-'}</p>
          <div className="form-group">
            <label htmlFor="apply_amount">Valor a Aplicar (R$)</label>
            <input
              id="apply_amount"
              type="number"
              value={operationAmount}
              onChange={(e) => setOperationAmount(e.target.value)}
              step="0.01"
              min="0.01"
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setShowApplyModal(false); setSelectedInvestment(null); }}>Cancelar</button>
            <button className="btn-primary" onClick={handleApply}>Confirmar Aplicacao</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default InvestmentsPage;
