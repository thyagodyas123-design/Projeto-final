'use client';

import { useState, useEffect, useCallback } from 'react';
import { courses as fallbackCourses } from '@plataforma/shared';
import './catalog.css';
import Header from './components/Header';
import { CourseCard, SkeletonCard } from './components/CourseCard';

const API_BASE_CLIENT =
  typeof window !== 'undefined' ? window.location.origin + '/api/catalog' : '';

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
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
      <Header />

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
          <a className="cert-btn" href="/">Ver Trilhas</a>
        </div>
      </section>
    </>
  );
}
