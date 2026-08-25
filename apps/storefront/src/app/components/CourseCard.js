'use client';

const BADGE_COLORS = {
  BACKEND: 'background:#1e3a5f;color:#fff',
  FRONTEND: 'background:#2563eb;color:#fff',
  DEVOPS: 'background:#0891b2;color:#fff',
  DESIGN: 'background:#7c3aed;color:#fff',
  DATA: 'background:#059669;color:#fff',
};

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
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

export function SkeletonCard() {
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

export function CourseCard({ course }) {
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
