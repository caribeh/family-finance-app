import React, { useState, useEffect } from 'react';
import { billRemindersApi } from '../api';
import { useToast } from '../components/Toast';
import TransactionForm from '../components/TransactionForm';
import ExpenseTable from '../components/ExpenseTable';
import Modal from '../components/Modal';

function BillRemindersPage() {
  const { addToast } = useToast();
  const [reminders, setReminders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [config, setConfig] = useState({ email_recipient: '', telegram_bot_token: '', telegram_chat_id: '' });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadReminders();
    loadConfig();
  }, []);

  const loadReminders = async () => {
    try {
      const res = await billRemindersApi.getAll();
      setReminders(res.data);
    } catch {
      addToast('Erro ao carregar lembretes', 'error');
    }
  };

  const loadConfig = async () => {
    try {
      const res = await billRemindersApi.getConfig();
      setConfig(res.data);
    } catch {
      // config may not exist yet
    }
  };

  const handleSave = async (data) => {
    try {
      if (editing) {
        await billRemindersApi.update(editing.id, data);
        addToast('Lembrete atualizado!');
      } else {
        await billRemindersApi.create(data);
        addToast('Lembrete cadastrado!');
      }
      setShowModal(false);
      setEditing(null);
      loadReminders();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (reminder) => {
    if (!confirm(`Excluir lembrete "${reminder.name}"?`)) return;
    try {
      await billRemindersApi.delete(reminder.id);
      addToast('Lembrete excluido!');
      loadReminders();
    } catch {
      addToast('Erro ao excluir', 'error');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await billRemindersApi.saveConfig({
        email_recipient: config.email_recipient || null,
        telegram_bot_token: config.telegram_bot_token || null,
        telegram_chat_id: config.telegram_chat_id || null,
      });
      addToast('Configuracao salva!');
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao salvar configuracao', 'error');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await billRemindersApi.testNotification();
      const msgs = [];
      if (res.data.sentEmail) msgs.push('Email enviado');
      if (res.data.sentTelegram) msgs.push('Telegram enviado');
      addToast(msgs.length > 0 ? msgs.join(' e ') + ' com sucesso!' : 'Nenhuma notificacao enviada');
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao testar', 'error');
    } finally {
      setTesting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Nome da Conta', type: 'text', required: true },
    { name: 'dueDay', label: 'Dia de Vencimento', type: 'number', required: true, min: 1, max: 31 },
  ];

  return (
    <div>
      <div className="section-header">
        <h1>Lembretes de Contas</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          Novo Lembrete
        </button>
      </div>

      <ExpenseTable
        data={reminders}
        columns={[
          { key: 'name', label: 'Conta' },
          { key: 'due_day', label: 'Vencimento', render: (val) => `Dia ${val}` },
          { key: 'active', label: 'Ativo', render: (val) => val ? 'Sim' : 'Nao' },
        ]}
        onEdit={(row) => { setEditing(row); setShowModal(true); }}
        onDelete={handleDelete}
      />

      <div className="report-section" style={{ marginTop: '2rem' }}>
        <h2>Notificacoes</h2>

        <div className="form-group">
          <label>Email para notificacoes</label>
          <input
            type="text"
            placeholder="seu@email.com, outro@email.com"
            value={config.email_recipient}
            onChange={(e) => setConfig({ ...config, email_recipient: e.target.value })}
          />
          <small className="text-muted">Separe varios emails por virgula</small>
        </div>

        <div className="form-group">
          <label>Token do Bot do Telegram</label>
          <input
            type="text"
            placeholder="123456:ABC-DEF1234..."
            value={config.telegram_bot_token}
            onChange={(e) => setConfig({ ...config, telegram_bot_token: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Chat ID do Telegram</label>
          <input
            type="text"
            placeholder="-123456789"
            value={config.telegram_chat_id}
            onChange={(e) => setConfig({ ...config, telegram_chat_id: e.target.value })}
          />
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          <button className="btn-primary" onClick={handleSaveConfig}>
            Salvar Configuracao
          </button>
          <button className="btn-success" onClick={handleTest} disabled={testing}>
            {testing ? 'Testando...' : 'Testar Notificacao'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Editar Lembrete' : 'Novo Lembrete'}
      >
        <TransactionForm
          fields={fields}
          onSubmit={handleSave}
          initialData={editing ? { name: editing.name, dueDay: editing.due_day } : null}
          onCancel={() => { setShowModal(false); setEditing(null); }}
          submitLabel={editing ? 'Atualizar' : 'Cadastrar'}
        />
      </Modal>
    </div>
  );
}

export default BillRemindersPage;
