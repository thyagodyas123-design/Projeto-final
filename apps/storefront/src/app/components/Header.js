'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { signal: AbortSignal.timeout(5000) })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('não autenticado'))))
      .then((data) => {
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* segue com o logout local mesmo se a API estiver indisponível */
    }
    window.location.href = '/';
  }, []);

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : '';

  return (
    <header className="header">
      <div className="header-inner">
        <a className="header-logo" href="/">Cursando <span>Flow</span></a>

        <nav className="header-nav" role="navigation" aria-label="Principal">
          {!loading && user ? (
            <>
              <a className={`nav-link ${pathname === '/' ? 'active' : ''}`} href="/">Explorar</a>
              <a className={`nav-link ${pathname === '/meus-cursos' ? 'active' : ''}`} href="/meus-cursos">Meus Cursos</a>
            </>
          ) : null}
        </nav>

        <div className="header-actions">
          {loading ? null : user ? (
            <>
              <span className="header-email" title={user.email}>{user.email}</span>
              <div className="avatar" title={user.email}>{initial}</div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <a className="btn btn-outline btn-sm" href="/login">Entrar</a>
              <a className="btn btn-primary btn-sm" href="/register">Criar conta</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
