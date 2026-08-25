'use client';

import { useState } from 'react';
import Header from '../components/Header';

const PASSWORD_RULES = [
  { key: 'length', label: 'Mínimo de 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'Uma letra minúscula', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Um número', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Um símbolo', test: (p) => /[^A-Za-z\d]/.test(p) },
];

function errorMessage(data) {
  if (!data) return 'Não foi possível criar a conta. Tente novamente.';
  if (Array.isArray(data.message)) return data.message.join(' ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return 'Não foi possível criar a conta. Tente novamente.';
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));
  const showMismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!passwordValid) {
      setError('A senha não atende aos requisitos mínimos.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        window.location.href = '/';
        return;
      }
      setError(errorMessage(data));
    } catch {
      setError('Não foi possível criar a conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <div className="auth-card animate-in">
          <h1 className="auth-title">Criar conta</h1>
          <p className="auth-subtitle">Comece sua jornada na Fábrica de Gênios.</p>

          {error ? <div className="alert-error" role="alert">{error}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {password ? (
                <div className="password-checklist">
                  {PASSWORD_RULES.map((rule) => (
                    <span key={rule.key} className={`req ${rule.test(password) ? 'met' : ''}`}>
                      {rule.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="form-hint">Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirm">Confirmar senha</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={showMismatch ? 'input-error' : ''}
                required
              />
              {showMismatch ? <p className="field-error">As senhas não coincidem.</p> : null}
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !email || !password || !confirm}>
              {submitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="auth-switch">
            Já tem uma conta? <a href="/login">Entrar</a>
          </p>
        </div>
      </main>
    </>
  );
}
