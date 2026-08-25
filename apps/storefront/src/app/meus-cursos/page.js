'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import { CourseCard, SkeletonCard } from '../components/CourseCard';
import '../catalog.css';

function BookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export default function MeusCursosPage() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!meRes.ok) throw new Error('auth');
      const meData = await meRes.json();
      const userId = meData?.user?.id;
      if (!userId) throw new Error('auth');

      const enrollRes = await fetch(`/api/progress/enrollments?userId=${encodeURIComponent(userId)}`);
      if (!enrollRes.ok) throw new Error('progress');
      const enrollments = await enrollRes.json();

      const catalogRes = await fetch('/api/catalog/courses');
      if (!catalogRes.ok) throw new Error('catalog');
      const allCourses = await catalogRes.json();

      const enrolledIds = new Set((Array.isArray(enrollments) ? enrollments : []).map((e) => e.courseId));
      const enrolled = (Array.isArray(allCourses) ? allCourses : []).filter((c) => enrolledIds.has(c.id));

      setCourses(enrolled);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header />

      <section className="page-header animate-in">
        <h1>Meus Cursos</h1>
        <p>Continue de onde parou nos cursos em que você está matriculado.</p>
      </section>

      <main className="catalog">
        <div className="course-grid">
          {status === 'loading' ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : status === 'error' ? (
            <div className="empty-state visible">
              <BookIcon />
              <h3>Não foi possível carregar seus cursos</h3>
              <p>Verifique sua conexão e tente novamente.</p>
              <button className="btn btn-primary" onClick={load}>Tentar novamente</button>
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state visible">
              <BookIcon />
              <h3>Você ainda não está matriculado em nenhum curso</h3>
              <p>Explore o catálogo e comece a aprender agora.</p>
              <a className="btn btn-primary" href="/">Explorar cursos</a>
            </div>
          ) : (
            courses.map((c) => <CourseCard key={c.id} course={c} />)
          )}
        </div>
      </main>
    </>
  );
}
