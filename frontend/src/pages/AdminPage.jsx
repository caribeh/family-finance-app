import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, userApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';

function AdminPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetMember, setBudgetMember] = useState(null);
  const [budgetValue, setBudgetValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await adminApi.getMembers();
      setMembers(res.data);
    } catch (err) {
      addToast('Erro ao carregar membros', 'error');
    }
  };

  const handleSaveMember = async (data) => {
    try {
      if (editingMember) {
        await adminApi.updateMember(editingMember.id, data);
        addToast('Membro atualizado!');
      } else {
        await adminApi.createMember(data);
        addToast('Membro cadastrado!');
      }
      setShowModal(false);
      setEditingMember(null);
      loadMembers();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDeleteMember = async (member) => {
    if (!confirm(`Excluir ${member.name}?`)) return;
    try {
      await adminApi.deleteMember(member.id);
      addToast('Membro excluido!');
      loadMembers();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir', 'error');
    }
  };

  const handleSetBudget = async () => {
    if (!budgetMember || !budgetValue || parseFloat(budgetValue) <= 0) return;
    try {
      await adminApi.updateMember(budgetMember.id, { monthly_budget_limit: parseFloat(budgetValue) });
      addToast('Teto definido!');
      setShowBudgetModal(false);
      setBudgetMember(null);
      setBudgetValue('');
      loadMembers();
    } catch (err) {
      addToast('Erro ao definir teto', 'error');
    }
  };

  const memberFields = [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'display_role', label: 'Funcao na Familia', type: 'text', required: true, defaultValue: 'Membro' },
  ];

  const handleDeleteAccount = async () => {
    try {
      await userApi.deleteMe();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao deletar conta', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="section-header">
        <h1>Administracao</h1>
        <button className="btn-primary" onClick={() => { setEditingMember(null); setShowModal(true); }}>
          Novo Membro
        </button>
      </div>

      <ExpenseTable
        data={members}
        columns={[
          { key: 'name', label: 'Nome' },
          { key: 'display_role', label: 'Funcao' },
          { key: 'monthly_budget_limit', label: 'Teto Mensal', format: 'currency' },
        ]}
        onEdit={(row) => { setEditingMember(row); setShowModal(true); }}
        onDelete={handleDeleteMember}
        onAction={(row) => { setBudgetMember(row); setBudgetValue(row.monthly_budget_limit || ''); setShowBudgetModal(true); }}
        actionLabel="Definir Teto"
      />

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingMember(null); }} title={editingMember ? 'Editar Membro' : 'Novo Membro'}>
        <TransactionForm
          fields={memberFields}
          onSubmit={handleSaveMember}
          initialData={editingMember}
          onCancel={() => { setShowModal(false); setEditingMember(null); }}
          submitLabel={editingMember ? 'Atualizar' : 'Cadastrar'}
        />
      </Modal>

      <Modal isOpen={showBudgetModal} onClose={() => { setShowBudgetModal(false); setBudgetMember(null); }} title={`Teto Semanal - ${budgetMember?.name}`}>
        <div className="budget-form">
          <p>Defina o teto de gastos semanal para {budgetMember?.name} ({budgetMember?.display_role})</p>
          <div className="form-group">
            <label htmlFor="budget">Valor do teto (R$)</label>
            <input
              id="budget"
              type="number"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value)}
              placeholder="Ex: 300"
              step="0.01"
              min="0"
            />
          </div>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => { setShowBudgetModal(false); setBudgetMember(null); }}>Cancelar</button>
            <button className="btn-primary" onClick={handleSetBudget}>Salvar</button>
          </div>
        </div>
      </Modal>

      <div className="admin-footer">
        <hr />
        <h2>Zona de Perigo</h2>
        <p className="text-muted">Apagar todos os dados da sua conta, incluindo membros, transacoes e configuracoes.</p>
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          Deletar Minha Conta
        </button>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Deletar Conta">
        <div className="delete-account-confirm">
          <p>Tem certeza que deseja deletar sua conta?</p>
          <p className="text-danger">Todos os dados serao permanentemente removidos. Esta acao nao pode ser desfeita.</p>
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            <button className="btn-danger" onClick={handleDeleteAccount}>Deletar Minha Conta</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AdminPage;
