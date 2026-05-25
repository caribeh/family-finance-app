import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) {
        setError('Preencha email e senha');
        setLoading(false);
        return;
      }
      if (showRegister && !formData.name) {
        setError('Preencha seu nome');
        setLoading(false);
        return;
      }

      if (showRegister) {
        await register(formData.name, formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Family Finance</h1>
        <h2>{showRegister ? 'Criar Conta' : 'Entrar'}</h2>
        <form onSubmit={handleSubmit}>
          {showRegister && (
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimo 6 caracteres"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Carregando...' : showRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>
        <p className="login-note">
          {showRegister ? (
            'Ao criar uma conta, voce sera o administrador do seu proprio grupo familiar.'
          ) : (
            <>
              Nao tem conta?{' '}
              <button className="btn-link" onClick={() => setShowRegister(true)}>
                Criar conta
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
