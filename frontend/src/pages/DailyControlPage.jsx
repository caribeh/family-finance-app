import React, { useState, useEffect } from 'react';
import { useMonth } from '../context/MonthContext';
import { dailyControlApi, creditCardsApi, mealVouchersApi, benefitCardsApi, bankAccountsApi, adminApi } from '../api';
import { useToast } from '../components/Toast';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, getLocalToday } from '../utils/formatters';

const CATEGORIES = ['Alimentacao', 'Transporte', 'Saude', 'Educacao', 'Investimento', 'Contas', 'Outros'];

function DailyControlPage() {
  const { selectedMonth } = useMonth();
  const { addToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [mealVouchers, setMealVouchers] = useState([]);
  const [benefitCards, setBenefitCards] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [creditFormData, setCreditFormData] = useState({});
  const [debitFormData, setDebitFormData] = useState({});
  const [voucherFormData, setVoucherFormData] = useState({});
  const [benefitFormData, setBenefitFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const [entriesRes, cardsRes, vouchersRes, benefitRes, accountsRes, membersRes] = await Promise.all([
        dailyControlApi.getAll(selectedMonth.month, selectedMonth.year),
        creditCardsApi.getAll(),
        mealVouchersApi.getAll(),
        benefitCardsApi.getAll(),
        bankAccountsApi.getAll(),
        adminApi.getMembers(),
      ]);
      setEntries(entriesRes.data);
      setCreditCards(cardsRes.data);
      setMealVouchers(vouchersRes.data);
      setBenefitCards(benefitRes.data);
      setBankAccounts(accountsRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      addToast('Erro ao carregar dados', 'error');
    }
  };

  const handleCreditChange = (e) => {
    const { name, value } = e.target;
    setCreditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDebitChange = (e) => {
    const { name, value } = e.target;
    setDebitFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVoucherChange = (e) => {
    const { name, value } = e.target;
    setVoucherFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBenefitChange = (e) => {
    const { name, value } = e.target;
    setBenefitFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dailyControlApi.create({ ...creditFormData, type: 'credit' });
      addToast('Entrada registrada!');
      setShowCreditModal(false);
      setCreditFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar', 'error');
    }
  };

  const handleDebitSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...debitFormData, type: 'debit' };
      if (debitFormData.payment_method === 'credit_card' && debitFormData.total_installments && parseInt(debitFormData.total_installments) > 1) {
        payload.total_installments = parseInt(debitFormData.total_installments);
      }
      await dailyControlApi.create(payload);
      addToast('Saida registrada!');
      setShowDebitModal(false);
      setDebitFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar', 'error');
    }
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      await dailyControlApi.create({ ...voucherFormData, type: 'meal_voucher' });
      addToast('Credito VA registrado!');
      setShowVoucherModal(false);
      setVoucherFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar', 'error');
    }
  };

  const handleBenefitSubmit = async (e) => {
    e.preventDefault();
    try {
      await dailyControlApi.create({ ...benefitFormData, type: 'credit', payment_method: 'benefit_card' });
      addToast('Entrada no cartao de beneficio registrada!');
      setShowBenefitModal(false);
      setBenefitFormData({});
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar', 'error');
    }
  };

  const handleDelete = async (entry) => {
    if (entry.source) {
      addToast('Nao e possivel excluir lancamentos automaticos', 'error');
      return;
    }
    if (!confirm('Excluir este registro?')) return;
    try {
      await dailyControlApi.delete(entry.id);
      addToast('Registro excluido!');
      loadData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir', 'error');
    }
  };

  const today = getLocalToday();

  const isUserEntry = (e) => e.source !== 'transfer' && e.source !== 'investment';
  const standardCredits = entries.filter((e) => isUserEntry(e) && e.type === 'credit' && e.payment_method !== 'benefit_card').reduce((sum, e) => sum + e.amount, 0);
  const standardDebitsExclCC = entries.filter((e) => isUserEntry(e) && e.type === 'debit' && e.payment_method !== 'credit_card' && e.payment_method !== 'benefit_card').reduce((sum, e) => sum + e.amount, 0);
  const standardDebitsCC = entries.filter((e) => isUserEntry(e) && e.type === 'debit' && e.payment_method === 'credit_card').reduce((sum, e) => sum + e.amount, 0);
  const benefitCredits = entries.filter((e) => isUserEntry(e) && e.type === 'credit' && e.payment_method === 'benefit_card').reduce((sum, e) => sum + e.amount, 0);
  const benefitDebits = entries.filter((e) => isUserEntry(e) && e.type === 'debit' && e.payment_method === 'benefit_card').reduce((sum, e) => sum + e.amount, 0);

  const getMemberName = (userId) => {
    const member = members.find((m) => m.id === userId);
    return member ? member.name : '-';
  };

  return (
    <div className="daily-control-page">
      <div className="section-header">
        <h1>Controle Diario</h1>
        <div className="action-buttons">
          <button className="btn-success" onClick={() => { setCreditFormData({ date: today }); setShowCreditModal(true); }}>
            + Entrada
          </button>
          <button className="btn-danger" onClick={() => { setDebitFormData({ date: today, payment_method: '' }); setShowDebitModal(true); }}>
            + Saida
          </button>
          <button className="btn-benefit" onClick={() => { setBenefitFormData({ date: today }); setShowBenefitModal(true); }}>
            + Entrada Beneficio
          </button>
          {mealVouchers.length > 0 && (
            <button className="btn-secondary" onClick={() => { setVoucherFormData({ date: today }); setShowVoucherModal(true); }}>
              + Credito VA
            </button>
          )}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card summary-card--success">
          <div className="card-header">
            <span className="card-icon">📈</span>
            <span className="card-title">Entradas</span>
          </div>
          <div className="card-value" style={{ color: '#22c55e' }}>{formatCurrency(standardCredits)}</div>
        </div>
        <div className="summary-card summary-card--danger">
          <div className="card-header">
            <span className="card-icon">📉</span>
            <span className="card-title">Saidas</span>
          </div>
          <div className="card-value" style={{ color: '#ef4444' }}>{formatCurrency(standardDebitsExclCC)}</div>
        </div>
        <div className="summary-card summary-card--warning">
          <div className="card-header">
            <span className="card-icon">💳</span>
            <span className="card-title">Saidas Cartao</span>
          </div>
          <div className="card-value" style={{ color: '#f59e0b' }}>{formatCurrency(standardDebitsCC)}</div>
        </div>
      </div>

      {benefitCards.length > 0 && (
        <>
          <h2 className="benefit-section-title">Beneficios</h2>
          <div className="summary-grid summary-grid--benefit">
            <div className="summary-card summary-card--benefit">
              <div className="card-header">
                <span className="card-icon">💎</span>
                <span className="card-title">Entradas Beneficio</span>
              </div>
              <div className="card-value" style={{ color: '#8b5cf6' }}>{formatCurrency(benefitCredits)}</div>
            </div>
            <div className="summary-card summary-card--benefit-debit">
              <div className="card-header">
                <span className="card-icon">🛒</span>
                <span className="card-title">Gastos Beneficio</span>
              </div>
              <div className="card-value" style={{ color: '#a855f7' }}>{formatCurrency(benefitDebits)}</div>
            </div>
            {benefitCards.map((card) => (
              <div key={card.id} className="summary-card summary-card--benefit-balance">
                <div className="card-header">
                  <span className="card-icon">💎</span>
                  <span className="card-title">{card.name}</span>
                </div>
                <div className="card-value" style={{ color: '#7c3aed' }}>{formatCurrency(card.balance)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <ExpenseTable
        data={entries}
        columns={[
          { key: 'date', label: 'Data', format: 'date' },
          { key: 'type', label: 'Tipo', render: (val) => val === 'credit' ? 'Entrada' : val === 'meal_voucher' ? 'Credito VA' : 'Saida' },
          { key: 'member_id', label: 'Responsavel', render: (val) => getMemberName(val) },
          { key: 'description', label: 'Descricao' },
          { key: 'amount', label: 'Valor', format: 'currency' },
          { key: 'payment_method', label: 'Forma', render: (val) => {
            const labels = { credit_card: 'Credito', pix: 'PIX', benefit_card: 'Beneficio', transfer: 'Transferencia' };
            return labels[val] || '-';
          }},
          { key: 'category', label: 'Categoria' },
        ]}
        onDelete={handleDelete}
      />

      {/* Credit Modal */}
      <Modal isOpen={showCreditModal} onClose={() => { setShowCreditModal(false); setCreditFormData({}); }} title="Nova Entrada">
        <form className="transaction-form" onSubmit={handleCreditSubmit}>
          <div className="form-group">
            <label htmlFor="credit_member_id">Responsavel</label>
            <select id="credit_member_id" name="member_id" value={creditFormData.member_id || ''} onChange={handleCreditChange} required>
              <option value="">Selecione...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.display_role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="credit_description">Descricao</label>
            <input id="credit_description" name="description" type="text" value={creditFormData.description || ''} onChange={handleCreditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="credit_amount">Valor</label>
            <input id="credit_amount" name="amount" type="number" step="0.01" min="0.01" value={creditFormData.amount || ''} onChange={handleCreditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="credit_date">Data</label>
            <input id="credit_date" name="date" type="date" value={creditFormData.date || today} onChange={handleCreditChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="credit_category">Categoria</label>
            <select id="credit_category" name="category" value={creditFormData.category || ''} onChange={handleCreditChange} required>
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="credit_bank_account_id">Conta Corrente</label>
            <select id="credit_bank_account_id" name="bank_account_id" value={creditFormData.bank_account_id || ''} onChange={handleCreditChange} required>
              <option value="">Selecione...</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (R$ {a.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreditModal(false); setCreditFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Entrada</button>
          </div>
        </form>
      </Modal>

      {/* Debit Modal */}
      <Modal isOpen={showDebitModal} onClose={() => { setShowDebitModal(false); setDebitFormData({}); }} title="Nova Saida">
        <form className="transaction-form" onSubmit={handleDebitSubmit}>
          <div className="form-group">
            <label htmlFor="debit_member_id">Responsavel</label>
            <select id="debit_member_id" name="member_id" value={debitFormData.member_id || ''} onChange={handleDebitChange} required>
              <option value="">Selecione...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.display_role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="debit_description">Descricao</label>
            <input id="debit_description" name="description" type="text" value={debitFormData.description || ''} onChange={handleDebitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="debit_amount">Valor</label>
            <input id="debit_amount" name="amount" type="number" step="0.01" min="0.01" value={debitFormData.amount || ''} onChange={handleDebitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="debit_date">Data</label>
            <input id="debit_date" name="date" type="date" value={debitFormData.date || today} onChange={handleDebitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="debit_category">Categoria</label>
            <select id="debit_category" name="category" value={debitFormData.category || ''} onChange={handleDebitChange} required>
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="debit_payment_method">Forma de Pagamento</label>
            <select id="debit_payment_method" name="payment_method" value={debitFormData.payment_method || ''} onChange={handleDebitChange} required>
              <option value="pix">PIX</option>
              <option value="credit_card">Cartao de Credito</option>
              <option value="benefit_card">Cartao de Beneficio</option>
            </select>
          </div>

          {debitFormData.payment_method === 'credit_card' && (
            <>
              <div className="form-group">
                <label htmlFor="debit_credit_card_id">Cartao de Credito</label>
                <select id="debit_credit_card_id" name="credit_card_id" value={debitFormData.credit_card_id || ''} onChange={handleDebitChange} required>
                  <option value="">Selecione...</option>
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (R$ {c.available_limit.toFixed(2)} disp.)</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="debit_total_installments">Parcelas</label>
                <input id="debit_total_installments" name="total_installments" type="number" min="1" max="48" value={debitFormData.total_installments || '1'} onChange={handleDebitChange} required />
              </div>
            </>
          )}

          {debitFormData.payment_method === 'benefit_card' && (
            <div className="form-group">
              <label htmlFor="debit_benefit_card_id">Cartao de Beneficio</label>
              <select id="debit_benefit_card_id" name="benefit_card_id" value={debitFormData.benefit_card_id || ''} onChange={handleDebitChange} required>
                <option value="">Selecione...</option>
                {benefitCards.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (R$ {c.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>
          )}

          {debitFormData.payment_method === 'pix' && (
            <div className="form-group">
              <label htmlFor="debit_bank_account_id">Conta de Origem (opcional)</label>
              <select id="debit_bank_account_id" name="bank_account_id" value={debitFormData.bank_account_id || ''} onChange={handleDebitChange}>
                <option value="">Nenhuma</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (R$ {a.balance.toFixed(2)})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowDebitModal(false); setDebitFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Saida</button>
          </div>
        </form>
      </Modal>

      {/* Voucher Modal */}
      <Modal isOpen={showVoucherModal} onClose={() => { setShowVoucherModal(false); setVoucherFormData({}); }} title="Credito Vale-Alimentacao">
        <form className="transaction-form" onSubmit={handleVoucherSubmit}>
          <div className="form-group">
            <label htmlFor="voucher_member_id">Responsavel</label>
            <select id="voucher_member_id" name="member_id" value={voucherFormData.member_id || ''} onChange={handleVoucherChange} required>
              <option value="">Selecione...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.display_role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="voucher_description">Descricao</label>
            <input id="voucher_description" name="description" type="text" value={voucherFormData.description || ''} onChange={handleVoucherChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="voucher_amount">Valor</label>
            <input id="voucher_amount" name="amount" type="number" step="0.01" min="0.01" value={voucherFormData.amount || ''} onChange={handleVoucherChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="voucher_date">Data</label>
            <input id="voucher_date" name="date" type="date" value={voucherFormData.date || today} onChange={handleVoucherChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="voucher_meal_voucher_id">Vale-Alimentacao</label>
            <select id="voucher_meal_voucher_id" name="meal_voucher_id" value={voucherFormData.meal_voucher_id || ''} onChange={handleVoucherChange} required>
              <option value="">Selecione...</option>
              {mealVouchers.map((v) => (
                <option key={v.id} value={v.id}>{v.description} (R$ {v.available_balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowVoucherModal(false); setVoucherFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Adicionar Credito</button>
          </div>
        </form>
      </Modal>

      {/* Benefit Card Entry Modal */}
      <Modal isOpen={showBenefitModal} onClose={() => { setShowBenefitModal(false); setBenefitFormData({}); }} title="Entrada no Cartao de Beneficio">
        <form className="transaction-form" onSubmit={handleBenefitSubmit}>
          <div className="form-group">
            <label htmlFor="benefit_member_id">Responsavel</label>
            <select id="benefit_member_id" name="member_id" value={benefitFormData.member_id || ''} onChange={handleBenefitChange} required>
              <option value="">Selecione...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.display_role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="benefit_description">Descricao</label>
            <input id="benefit_description" name="description" type="text" value={benefitFormData.description || ''} onChange={handleBenefitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="benefit_amount">Valor</label>
            <input id="benefit_amount" name="amount" type="number" step="0.01" min="0.01" value={benefitFormData.amount || ''} onChange={handleBenefitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="benefit_date">Data</label>
            <input id="benefit_date" name="date" type="date" value={benefitFormData.date || today} onChange={handleBenefitChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="benefit_category">Categoria</label>
            <select id="benefit_category" name="category" value={benefitFormData.category || ''} onChange={handleBenefitChange} required>
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="benefit_benefit_card_id">Cartao de Beneficio</label>
            <select id="benefit_benefit_card_id" name="benefit_card_id" value={benefitFormData.benefit_card_id || ''} onChange={handleBenefitChange} required>
              <option value="">Selecione...</option>
              {benefitCards.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (R$ {c.balance.toFixed(2)})</option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowBenefitModal(false); setBenefitFormData({}); }}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Entrada</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DailyControlPage;
