'use client';

import { useState, useEffect, useCallback } from 'react';
import { courses as fallbackCourses } from '@plataforma/shared';

const USER_ID = 'user-123';

/* ─── SVG Icons ─── */
function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
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

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="11" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function CertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function LessonItem({ lesson, index, isCompleted, isActive, onToggle, onSelect }) {
  return (
    <li className={`lesson-item${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`} onClick={onSelect}>
      <div
        className={`lesson-check${isCompleted ? ' checked' : ''}`}
        role="checkbox"
        aria-label={`Marcar aula ${lesson.title} como concluída`}
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        {isCompleted ? <CheckIcon /> : <CircleIcon />}
      </div>
      <div className="lesson-info">
        <span className="lesson-number">{index + 1}. {lesson.title}</span>
        <span className="lesson-duration">{lesson.duration}{isCompleted ? ' · Concluída' : ''}</span>
      </div>
    </li>
  );
}

export default function ClassroomClient({ course, courseId }) {
  const [completedIds, setCompletedIds] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  const totalLessons = course?.lessons?.length || 0;

  const toast = useCallback((msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const apiCall = useCallback(async (method, path, body) => {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('/api' + path, { ...opts, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('API ' + res.status);
    return res.json();
  }, []);

  const loadLocalFallback = useCallback(() => {
    try {
      const raw = localStorage.getItem('progress_' + courseId);
      if (raw) return JSON.parse(raw).completed || [];
    } catch {}
    return [];
  }, [courseId]);

  const saveLocalFallback = useCallback((ids) => {
    try {
      localStorage.setItem('progress_' + courseId, JSON.stringify({ completed: ids }));
    } catch {}
  }, [courseId]);

  useEffect(() => {
    if (!course || !courseId) return;
    let cancelled = false;

    (async () => {
      try {
        const enroll = await apiCall('POST', '/progress/enrollments', { userId: USER_ID, courseId });
        if (cancelled) return;
        setEnrollmentId(enroll.id);

        const progress = await apiCall('GET', `/progress/enrollments/${USER_ID}/${courseId}?totalLessons=${totalLessons}`);
        if (cancelled) return;
        setCompletedIds(progress.completedLessonIds || []);
        setApiAvailable(true);
      } catch {
        if (cancelled) return;
        setCompletedIds(loadLocalFallback());
        setApiAvailable(false);
      }
    })();

    return () => { cancelled = true; };
  }, [course, courseId, totalLessons, apiCall, loadLocalFallback]);

  const toggleLesson = useCallback(async (lessonId) => {
    setCompletedIds((prev) => {
      const isDone = prev.includes(lessonId);
      const next = isDone ? prev.filter((id) => id !== lessonId) : [...prev, lessonId];

      if (apiAvailable) {
        apiCall('PATCH', `/progress/enrollments/${USER_ID}/${courseId}/lessons/${lessonId}`, {
          completed: !isDone,
          totalLessons,
        }).then((result) => {
          setCompletedIds(result.completedLessonIds || next);
          if (result.progressPercent === 100) toast('Certificado emitido! Parabéns!', 'success');
        }).catch(() => {
          setCompletedIds((curr) => {
            if (!isDone) return curr.filter((id) => id !== lessonId);
            return [...curr, lessonId];
          });
          toast('Erro ao salvar. Tente novamente.', 'error');
        });
      } else {
        saveLocalFallback(next);
      }

      return next;
    });
  }, [apiAvailable, courseId, totalLessons, apiCall, saveLocalFallback, toast]);

  const done = completedIds.length;
  const pct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
  const currentLesson = course.lessons[activeLesson] || course.lessons[0];

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner" style={{ maxWidth: 1400 }}>
          <a className="back-link" href="/">
            <BackIcon /> Voltar à Vitrine
          </a>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notificações"><BellIcon /></button>
            <div className="avatar" title={USER_ID}>U</div>
          </div>
        </div>
      </header>

      {/* Course Header */}
      <section className="course-header animate-in">
        <h1>Curso: {course.title}</h1>
        <div className="course-subtitle">Progresso Geral</div>
        <div className="progress-section">
          <span className="progress-label">Módulo 1</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
          <span className="progress-pct">{pct}%</span>
        </div>
      </section>

      {/* Status Bar */}
      <div className="status-bar">
        <span className={`status-dot ${apiAvailable ? 'online' : 'offline'}`} />
        <span>{apiAvailable ? 'Sincronizado com o servidor' : 'Modo offline — dados locais'}</span>
      </div>

      {/* Certificate Banner */}
      <div className={`cert-banner${pct === 100 ? ' visible' : ''}`}>
        <div className="cert-inner">
          <CertIcon />
          <span className="cert-text">Parabéns! Você concluiu o curso e recebeu seu certificado.</span>
        </div>
      </div>

      {/* Classroom Layout */}
      <div className="classroom-layout">
        {/* Video + Lesson Detail */}
        <div className="player-section animate-in delay-1">
          <div className="player-wrapper">
            <div className="player-inner">
              <button className="play-btn" aria-label="Reproduzir vídeo"><PlayIcon /></button>
            </div>
          </div>
          <div className="lesson-detail">
            <h3>Aula Atual: {currentLesson.title}</h3>
            <p>{course.longDescription}</p>
          </div>
        </div>

        {/* Lesson Sidebar */}
        <aside className="lesson-sidebar animate-in delay-2">
          <div className="sidebar-header">
            <ListIcon />
            <h2>Aulas do Curso</h2>
          </div>
          <ul className="lesson-list">
            {course.lessons.map((l, i) => (
              <LessonItem
                key={l.id}
                lesson={l}
                index={i}
                isCompleted={completedIds.includes(l.id)}
                isActive={activeLesson === i}
                onToggle={() => toggleLesson(l.id)}
                onSelect={() => setActiveLesson(i)}
              />
            ))}
          </ul>
        </aside>
      </div>

      {/* Toast */}
      <div className={`toast ${showToast ? 'show' : ''} ${toastType}`}>{toastMsg}</div>
    </>
  );
}