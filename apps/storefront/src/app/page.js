'use client';

import { useState, useEffect, useCallback } from 'react';
import { courses as fallbackCourses } from '@plataforma/shared';
import './catalog.css';

const API_BASE_CLIENT =
  typeof window !== 'undefined' ? window.location.origin + '/api/catalog' : '';

const BADGE_COLORS = {
  BACKEND: 'background:#1e3a5f;color:#fff',
  FRONTEND: 'background:#2563eb;color:#fff',
  DEVOPS: 'background:#0891b2;color:#fff',
  DESIGN: 'background:#7c3aed;color:#fff',
  DATA: 'background:#059669;color:#fff',
};

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function CardSvgPattern() {
  return (
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', opacity: 0.15 }}>
      <rect x="10" y="10" width="60" height="40" rx="4" stroke="#fff" strokeWidth="1.5" />
      <rect x="80" y="20" width="50" height="30" rx="4" stroke="#fff" strokeWidth="1.5" />
      <rect x="140" y="10" width="50" height="50" rx="4" stroke="#fff" strokeWidth="1.5" />
      <rect x="30" y="60" width="70" height="35" rx="4" stroke="#fff" strokeWidth="1.5" />
      <rect x="110" y="70" width="60" height="30" rx="4" stroke="#fff" strokeWidth="1.5" />
      <circle cx="160" cy="100" r="12" stroke="#fff" strokeWidth="1.5" />
      <path d="M70 40 L100 25" stroke="#fff" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M130 40 L140 70" stroke="#fff" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <article className={`course-card skeleton-card`}>
      <div className="card-image skeleton-image"><div className="skeleton-shimmer" /></div>
      <div className="card-body">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-desc short" />
        <div className="card-footer">
          <div className="skeleton-line skeleton-small" />
          <div className="skeleton-line skeleton-link" />
        </div>
      </div>
    </article>
  );
}

function CourseCard({ course }) {
  return (
    <article className="course-card animate-in" data-category={course.category} onClick={() => (window.location.href = `/curso/${course.id}`)}>
      <div className="card-image" style={{ background: course.color }}>
        <span className="card-badge" style={BADGE_COLORS[course.category] || 'background:#334155;color:#fff'}>{course.category}</span>
        <div className="card-image-pattern"><CardSvgPattern /></div>
      </div>
      <div className="card-body">
        <h3 className="card-title">{course.title}</h3>
        <p className="card-description">{course.description}</p>
        <div className="card-footer">
          <span className="card-instructor"><UserIcon /> {course.instructor}</span>
          <a href={`/curso/${course.id}`} className="card-link" onClick={(e) => e.stopPropagation()}>
            Acessar Curso <ArrowIcon />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function CatalogPage() {
  const [allCourses, setAllCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSource, setDataSource] = useState('loading');
  const [visibleCount, setVisibleCount] = useState(0);

  const fetchCourses = useCallback(async () => {
    setDataSource('loading');
    try {
      const res = await fetch(API_BASE_CLIENT + '/courses', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setAllCourses(data);
        setDataSource('online');
      } else {
        throw new Error('Empty');
      }
    } catch {
      setAllCourses(fallbackCourses);
      setDataSource('local');
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filteredCourses = allCourses.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchFilter = activeFilter === 'ALL' || c.category === activeFilter;
    return matchSearch && matchFilter;
  });

  useEffect(() => { setVisibleCount(filteredCourses.length); }, [filteredCourses]);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">Fábrica de <span>Gênios</span></div>
          <nav className="header-nav" role="navigation" aria-label="Principal">
            <a className="nav-link" href="#">Meus Cursos</a>
            <a className="nav-link active" href="/" aria-current="page">Explorar</a>
          </nav>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notificações"><BellIcon /></button>
            <div className="avatar" title="user-123">U</div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section className="page-header animate-in">
        <h1>
          Catálogo de Cursos
          <span
            className={`source-badge ${dataSource === 'online' ? 'online' : 'offline'}`}
            style={{ display: dataSource === 'loading' ? 'none' : 'inline-flex' }}
          >
            {dataSource === 'online' ? 'API' : 'Dados locais'}
          </span>
        </h1>
        <p>Explore nossas trilhas de aprendizado e expanda suas habilidades.</p>
      </section>

      {/* Search + Filters */}
      <div className="filters-bar animate-in delay-1">
        <div className="search-box">
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Buscar cursos..."
            aria-label="Buscar cursos"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group" role="group" aria-label="Filtrar por categoria">
          {['ALL', 'BACKEND', 'FRONTEND', 'DEVOPS'].map((f) => (
            <button
              key={f}
              className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === 'ALL' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button className="filter-btn"><FilterIcon /> Filtros</button>
      </div>

      {/* Course Grid */}
      <main className="catalog">
        <div className="course-grid">
          {dataSource === 'loading' ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            filteredCourses.map((c) => <CourseCard key={c.id} course={c} />)
          )}
          <div className={`empty-state ${dataSource !== 'loading' && visibleCount === 0 ? 'visible' : ''}`}>
            <SearchIcon />
            <h3>Nenhum curso encontrado</h3>
            <p>Tente buscar por outro termo ou categoria.</p>
          </div>
        </div>
      </main>

      {/* Certification Banner */}
      <section className="cert-banner animate-in delay-4">
        <div className="cert-inner">
          <div className="cert-left">
            <div className="cert-icon"><CertIcon /></div>
            <div className="cert-text">
              <h3>Certificação Profissional</h3>
              <p>Complete as trilhas recomendadas e obtenha certificados reconhecidos pelo mercado para impulsionar sua carreira.</p>
            </div>
          </div>
          <button className="cert-btn">Ver Trilhas</button>
        </div>
      </section>
    </>
  );
}
