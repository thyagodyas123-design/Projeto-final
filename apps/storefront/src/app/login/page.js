'use client';

import { useState } from 'react';
import Header from '../components/Header';

function errorMessage(data) {
  if (!data) return 'Não foi possível entrar. Tente novamente.';
  if (Array.isArray(data.message)) return data.message.join(' ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return 'Não foi possível entrar. Tente novamente.';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
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
      setError('Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <div className="auth-card animate-in">
          <h1 className="auth-title">Entrar</h1>
          <p className="auth-subtitle">Acesse sua conta para continuar aprendendo.</p>

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
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting || !email || !password}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="auth-switch">
            Ainda não tem conta? <a href="/register">Criar conta</a>
          </p>
        </div>
      </main>
    </>
  );
}
