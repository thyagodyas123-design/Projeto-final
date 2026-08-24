import { createServer, request as httpRequest } from 'node:http';
import { courses as fallbackCourses, getCourse as fallbackGetCourse } from '../../../packages/shared/data.mjs';

const PORT = process.env.PORT ?? 3000;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';
const CLASSROOM_PORT = process.env.CLASSROOM_PORT || '3004';
const CLASSROOM_HOST = process.env.CLASSROOM_HOST || 'localhost';

/* ─── SVG Icons ─── */
const icons = {
  search:
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  filter:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  arrow:
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  user:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  certificate:
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  spinner:
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

/* ─── Helper: category badge color ─── */
function badgeColor(cat) {
  const m = {
    BACKEND: 'background:#1e3a5f;color:#fff',
    FRONTEND: 'background:#2563eb;color:#fff',
    DEVOPS: 'background:#0891b2;color:#fff',
    DESIGN: 'background:#7c3aed;color:#fff',
    DATA: 'background:#059669;color:#fff',
  };
  return m[cat] || 'background:#334155;color:#fff';
}

/* ─── Course card ─── */
function courseCard(c) {
  return `
  <article class="course-card" data-category="${c.category}" onclick="window.location.href='/curso/${c.id}'">
    <div class="card-image" style="background:${c.color}">
      <span class="card-badge" style="${badgeColor(c.category)}">${c.category}</span>
      <div class="card-image-pattern">
        <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;opacity:0.15">
          <rect x="10" y="10" width="60" height="40" rx="4" stroke="#fff" stroke-width="1.5"/>
          <rect x="80" y="20" width="50" height="30" rx="4" stroke="#fff" stroke-width="1.5"/>
          <rect x="140" y="10" width="50" height="50" rx="4" stroke="#fff" stroke-width="1.5"/>
          <rect x="30" y="60" width="70" height="35" rx="4" stroke="#fff" stroke-width="1.5"/>
          <rect x="110" y="70" width="60" height="30" rx="4" stroke="#fff" stroke-width="1.5"/>
          <circle cx="160" cy="100" r="12" stroke="#fff" stroke-width="1.5"/>
          <path d="M70 40 L100 25" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/>
          <path d="M130 40 L140 70" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/>
        </svg>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">${c.title}</h3>
      <p class="card-description">${c.description}</p>
      <div class="card-footer">
        <span class="card-instructor">${icons.user} ${c.instructor}</span>
        <a href="/curso/${c.id}" class="card-link" onclick="event.stopPropagation()">
          Acessar Curso ${icons.arrow}
        </a>
      </div>
    </div>
  </article>`;
}

/* ─── Skeleton card for loading state ─── */
function skeletonCard() {
  return `
  <article class="course-card skeleton-card">
    <div class="card-image skeleton-image"><div class="skeleton-shimmer"></div></div>
    <div class="card-body">
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-desc"></div>
      <div class="skeleton-line skeleton-desc short"></div>
      <div class="card-footer">
        <div class="skeleton-line skeleton-small"></div>
        <div class="skeleton-line skeleton-link"></div>
      </div>
    </div>
  </article>`;
}

/* ─── HTML Page ─── */
function renderPage() {
  const cards = fallbackCourses.map(courseCard).join('\n');
  const skeletons = Array(3).fill(null).map(() => skeletonCard()).join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fábrica de Gênios — Catálogo de Cursos</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}

    :root {
      --blue-900: #0f172a;
      --blue-800: #1e293b;
      --blue-700: #1e3a5f;
      --blue-600: #2563eb;
      --blue-500: #3b82f6;
      --blue-400: #60a5fa;
      --blue-100: #dbeafe;
      --blue-50: #eff6ff;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-300: #cbd5e1;
      --gray-400: #94a3b8;
      --gray-500: #64748b;
      --gray-600: #475569;
      --gray-700: #334155;
      --gray-800: #1e293b;
      --gray-900: #0f172a;
      --white: #ffffff;
      --radius: 12px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
      --shadow-lg: 0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
      --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    html { scroll-behavior: smooth }

    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--gray-50);
      color: var(--gray-800);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    /* ─── HEADER ─── */
    .header {
      background: var(--white);
      border-bottom: 1px solid var(--gray-200);
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      background: rgba(255,255,255,0.95);
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-logo {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--blue-700);
      letter-spacing: -0.02em;
    }
    .header-logo span { color: var(--blue-600) }
    .header-nav { display: flex; gap: 8px }
    .nav-link {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--gray-500);
      text-decoration: none;
      transition: all var(--transition);
      cursor: pointer;
    }
    .nav-link:hover { color: var(--gray-800); background: var(--gray-100) }
    .nav-link.active {
      color: var(--blue-600);
      background: var(--blue-50);
      font-weight: 600;
    }
    .header-actions { display: flex; align-items: center; gap: 12px }
    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--gray-500);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
    }
    .icon-btn:hover { background: var(--gray-100); color: var(--gray-700) }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--blue-600), var(--blue-400));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform var(--transition);
    }
    .avatar:hover { transform: scale(1.08) }

    /* ─── HERO / PAGE HEADER ─── */
    .page-header {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px 0;
    }
    .page-header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--gray-900);
      letter-spacing: -0.03em;
      margin-bottom: 6px;
    }
    .page-header p {
      font-size: 1.05rem;
      color: var(--gray-500);
      max-width: 560px;
    }

    /* ─── SEARCH / FILTERS ─── */
    .filters-bar {
      max-width: 1200px;
      margin: 28px auto 0;
      padding: 0 24px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .search-box {
      flex: 1;
      max-width: 420px;
      position: relative;
    }
    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 1.5px solid var(--gray-200);
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.95rem;
      color: var(--gray-800);
      background: var(--white);
      outline: none;
      transition: all var(--transition);
    }
    .search-box input::placeholder { color: var(--gray-400) }
    .search-box input:focus {
      border-color: var(--blue-500);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    .search-box .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--gray-400);
      display: flex;
      pointer-events: none;
    }
    .filter-group { display: flex; gap: 8px; flex-wrap: wrap }
    .filter-chip {
      padding: 10px 18px;
      border-radius: 10px;
      border: 1.5px solid var(--gray-200);
      background: var(--white);
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
    }
    .filter-chip:hover { border-color: var(--blue-400); color: var(--blue-600) }
    .filter-chip.active {
      background: var(--blue-600);
      color: #fff;
      border-color: var(--blue-600);
    }
    .filter-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      border: 1.5px solid var(--gray-200);
      background: var(--white);
      font-family: inherit;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all var(--transition);
    }
    .filter-btn:hover { border-color: var(--blue-400); color: var(--blue-600) }

    /* ─── COURSE GRID ─── */
    .catalog {
      max-width: 1200px;
      margin: 32px auto 0;
      padding: 0 24px 60px;
    }
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }

    /* ─── COURSE CARD ─── */
    .course-card {
      background: var(--white);
      border-radius: var(--radius);
      border: 1px solid var(--gray-200);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition);
      position: relative;
    }
    .course-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius);
      border: 2px solid transparent;
      transition: border-color var(--transition);
      pointer-events: none;
    }
    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--blue-400);
    }
    .course-card:hover::after { border-color: var(--blue-500) }
    .card-image {
      height: 180px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-image-pattern {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card-badge {
      position: absolute;
      top: 14px;
      left: 14px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      z-index: 2;
    }
    .card-body { padding: 20px }
    .card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 6px;
    }
    .card-description {
      font-size: 0.88rem;
      color: var(--gray-500);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--gray-100);
    }
    .card-instructor {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: var(--gray-500);
    }
    .card-instructor svg { flex-shrink: 0; opacity: 0.6 }
    .card-link {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--blue-600);
      text-decoration: none;
      transition: all var(--transition);
    }
    .card-link:hover { color: var(--blue-700); gap: 8px }

    /* ─── CERTIFICATION BANNER ─── */
    .cert-banner {
      max-width: 1200px;
      margin: 0 auto 60px;
      padding: 0 24px;
    }
    .cert-inner {
      background: linear-gradient(135deg, var(--blue-50), #eef2ff);
      border: 1px solid var(--blue-100);
      border-radius: var(--radius);
      padding: 28px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .cert-left { display: flex; align-items: center; gap: 18px }
    .cert-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .cert-text h3 {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 600;
      font-size: 1.05rem;
      color: var(--gray-900);
      margin-bottom: 2px;
    }
    .cert-text p { font-size: 0.88rem; color: var(--gray-500) }
    .cert-btn {
      padding: 10px 24px;
      border-radius: 10px;
      border: 1.5px solid var(--blue-600);
      background: var(--white);
      color: var(--blue-600);
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap;
    }
    .cert-btn:hover { background: var(--blue-600); color: #fff }

    /* ─── EMPTY STATE ─── */
    .empty-state {
      display: none;
      grid-column: 1 / -1;
      text-align: center;
      padding: 80px 20px;
    }
    .empty-state.visible { display: block }
    .empty-state svg { margin: 0 auto 16px; opacity: 0.3 }
    .empty-state h3 { font-size: 1.1rem; color: var(--gray-600); margin-bottom: 4px }
    .empty-state p { font-size: 0.9rem; color: var(--gray-400) }

    /* ─── LOADING / SKELETON ─── */
    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      margin-left: 12px;
      vertical-align: middle;
    }
    .source-badge.online { background: #dcfce7; color: #166534 }
    .source-badge.offline { background: #fef3c7; color: #92400e }
    .loading-bar {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--blue-100);
      z-index: 99;
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .loading-bar.active { opacity: 1 }
    .loading-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: -40%;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, transparent, var(--blue-500), transparent);
      animation: loadingSlide 1s ease-in-out infinite;
    }
    @keyframes loadingSlide {
      to { left: 100% }
    }
    .skeleton-card { pointer-events: none }
    .skeleton-image {
      background: var(--gray-200);
      position: relative;
      overflow: hidden;
    }
    .skeleton-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { to { transform: translateX(100%) } }
    .skeleton-line {
      height: 14px;
      background: var(--gray-200);
      border-radius: 6px;
      margin-bottom: 8px;
      position: relative;
      overflow: hidden;
    }
    .skeleton-line::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: shimmer 1.5s infinite;
    }
    .skeleton-title { width: 60%; height: 18px }
    .skeleton-desc { width: 90% }
    .skeleton-desc.short { width: 50% }
    .skeleton-small { width: 80px; height: 12px }
    .skeleton-link { width: 100px; height: 12px }

    /* ─── ANIMATIONS ─── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px) }
      to { opacity: 1; transform: translateY(0) }
    }
    .animate-in {
      animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .delay-1 { animation-delay: 0.05s }
    .delay-2 { animation-delay: 0.1s }
    .delay-3 { animation-delay: 0.15s }
    .delay-4 { animation-delay: 0.2s }
    .delay-5 { animation-delay: 0.25s }

    .spin { animation: spin 1s linear infinite }
    @keyframes spin { to { transform: rotate(360deg) } }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 768px) {
      .page-header h1 { font-size: 1.75rem }
      .course-grid { grid-template-columns: 1fr }
      .cert-inner { flex-direction: column; text-align: center }
      .cert-left { flex-direction: column }
      .filters-bar { flex-wrap: wrap }
      .search-box { max-width: 100% }
      .header-logo { font-size: 1rem }
      .nav-link { padding: 6px 12px; font-size: 0.82rem }
    }
    @media (max-width: 480px) {
      .filter-group { display: none }
    }
  </style>
</head>
<body>

  <!-- LOADING BAR -->
  <div class="loading-bar" id="loadingBar"></div>

  <!-- HEADER -->
  <header class="header">
    <div class="header-inner">
      <div class="header-logo">Fábrica de <span>Gênios</span></div>
      <nav class="header-nav" role="navigation" aria-label="Principal">
        <a class="nav-link" href="#">Meus Cursos</a>
        <a class="nav-link active" href="/" aria-current="page">Explorar</a>
      </nav>
      <div class="header-actions">
        <button class="icon-btn" aria-label="Notificações">${icons.bell}</button>
        <div class="avatar" title="user-123">U</div>
      </div>
    </div>
  </header>

  <!-- PAGE HEADER -->
  <section class="page-header animate-in">
    <h1>Catálogo de Cursos <span class="source-badge offline" id="sourceBadge" style="display:none"></span></h1>
    <p>Explore nossas trilhas de aprendizado e expanda suas habilidades.</p>
  </section>

  <!-- SEARCH + FILTERS -->
  <div class="filters-bar animate-in delay-1">
    <div class="search-box">
      <span class="search-icon">${icons.search}</span>
      <input
        type="text"
        id="searchInput"
        placeholder="Buscar cursos..."
        aria-label="Buscar cursos"
        autocomplete="off"
      />
    </div>
    <div class="filter-group" role="group" aria-label="Filtrar por categoria">
      <button class="filter-chip active" data-filter="ALL">Todos</button>
      <button class="filter-chip" data-filter="BACKEND">Backend</button>
      <button class="filter-chip" data-filter="FRONTEND">Frontend</button>
      <button class="filter-chip" data-filter="DEVOPS">DevOps</button>
    </div>
    <button class="filter-btn">${icons.filter} Filtros</button>
  </div>

  <!-- COURSE GRID -->
  <main class="catalog">
    <div class="course-grid" id="courseGrid">
      ${skeletons}
      <div class="empty-state" id="emptyState">
        ${icons.search}
        <h3>Nenhum curso encontrado</h3>
        <p>Tente buscar por outro termo ou categoria.</p>
      </div>
    </div>
  </main>

  <!-- CERTIFICATION BANNER -->
  <section class="cert-banner animate-in delay-4">
    <div class="cert-inner">
      <div class="cert-left">
        <div class="cert-icon">${icons.certificate}</div>
        <div class="cert-text">
          <h3>Certificação Profissional</h3>
          <p>Complete as trilhas recomendadas e obtenha certificados reconhecidos pelo mercado para impulsionar sua carreira.</p>
        </div>
      </div>
      <button class="cert-btn">Ver Trilhas</button>
    </div>
  </section>

  <script>
    /* ─── Constants ─── */
    const API_BASE = window.location.origin + '/api/catalog';
    const FALLBACK_COURSES = ${JSON.stringify(fallbackCourses)};
    const ICONS = ${JSON.stringify(icons)};

    /* ─── State ─── */
    let allCourses = [];
    let activeFilter = 'ALL';
    let dataSource = 'local';

    /* ─── DOM ─── */
    const searchInput = document.getElementById('searchInput');
    const filterChips = document.querySelectorAll('.filter-chip');
    const courseGrid = document.getElementById('courseGrid');
    const emptyState = document.getElementById('emptyState');
    const loadingBar = document.getElementById('loadingBar');
    const sourceBadge = document.getElementById('sourceBadge');

    /* ─── Helpers ─── */
    function badgeColor(cat) {
      const m = { BACKEND:'background:#1e3a5f;color:#fff', FRONTEND:'background:#2563eb;color:#fff', DEVOPS:'background:#0891b2;color:#fff', DESIGN:'background:#7c3aed;color:#fff', DATA:'background:#059669;color:#fff' };
      return m[cat] || 'background:#334155;color:#fff';
    }

    function renderCard(c) {
      return \`
      <article class="course-card animate-in" data-category="\${c.category}" onclick="window.location.href='/curso/\${c.id}'">
        <div class="card-image" style="background:\${c.color}">
          <span class="card-badge" style="\${badgeColor(c.category)}">\${c.category}</span>
          <div class="card-image-pattern">
            <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;opacity:0.15">
              <rect x="10" y="10" width="60" height="40" rx="4" stroke="#fff" stroke-width="1.5"/>
              <rect x="80" y="20" width="50" height="30" rx="4" stroke="#fff" stroke-width="1.5"/>
              <rect x="140" y="10" width="50" height="50" rx="4" stroke="#fff" stroke-width="1.5"/>
              <rect x="30" y="60" width="70" height="35" rx="4" stroke="#fff" stroke-width="1.5"/>
              <rect x="110" y="70" width="60" height="30" rx="4" stroke="#fff" stroke-width="1.5"/>
              <circle cx="160" cy="100" r="12" stroke="#fff" stroke-width="1.5"/>
              <path d="M70 40 L100 25" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/>
              <path d="M130 40 L140 70" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/>
            </svg>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">\${c.title}</h3>
          <p class="card-description">\${c.description}</p>
          <div class="card-footer">
            <span class="card-instructor">\${ICONS.user} \${c.instructor}</span>
            <a href="/curso/\${c.id}" class="card-link" onclick="event.stopPropagation()">Acessar Curso \${ICONS.arrow}</a>
          </div>
        </div>
      </article>\`;
    }

    /* ─── Fetch courses from API ─── */
    async function fetchCourses() {
      loadingBar.classList.add('active');
      try {
        const res = await fetch(API_BASE + '/courses', { signal: AbortSignal.timeout(4000) });
        if (!res.ok) throw new Error('API ' + res.status);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          allCourses = data;
          dataSource = 'online';
          showSourceBadge(true);
        } else {
          throw new Error('Empty');
        }
      } catch {
        allCourses = FALLBACK_COURSES;
        dataSource = 'local';
        showSourceBadge(false);
      } finally {
        loadingBar.classList.remove('active');
        renderGrid();
      }
    }

    function showSourceBadge(online) {
      sourceBadge.style.display = 'inline-flex';
      if (online) {
        sourceBadge.className = 'source-badge online';
        sourceBadge.textContent = 'API';
      } else {
        sourceBadge.className = 'source-badge offline';
        sourceBadge.textContent = 'Dados locais';
      }
    }

    /* ─── Render grid ─── */
    function renderGrid() {
      const q = searchInput.value.toLowerCase().trim();
      let html = '';
      let visible = 0;
      allCourses.forEach(c => {
        const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
        const matchFilter = activeFilter === 'ALL' || c.category === activeFilter;
        if (matchSearch && matchFilter) {
          html += renderCard(c);
          visible++;
        }
      });
      /* Remove old cards, keep empty state */
      courseGrid.querySelectorAll('.course-card').forEach(el => el.remove());
      courseGrid.insertAdjacentHTML('afterbegin', html);
      emptyState.classList.toggle('visible', visible === 0);
    }

    /* ─── Events ─── */
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderGrid, 150);
    });

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        renderGrid();
      });
    });

    /* ─── Init ─── */
    fetchCourses();
  </script>
</body>
</html>`;
}

/* ─── Proxy helper: forward request to classroom ─── */
function proxyToClassroom(req, res) {
  const upstream = httpRequest({
    hostname: CLASSROOM_HOST,
    port: CLASSROOM_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: CLASSROOM_HOST + ':' + CLASSROOM_PORT },
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px 20px">
        <h1>502</h1><p>Sala de aula indisponível.</p><a href="/">Voltar ao catálogo</a></body></html>`);
    }
  });
  req.pipe(upstream);
}

/* ─── Server ─── */
const server = createServer((req, res) => {
  /* Health check */
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ service: 'storefront', status: 'ok' }));
    return;
  }

  /* Catalog (home) */
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(renderPage());
    return;
  }

  /* Course detail — PROXY to classroom (keeps URL on port 3000) */
  if (req.url.match(/^\/curso\/([^/]+)\/?$/)) {
    proxyToClassroom(req, res);
    return;
  }

  /* 404 */
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px 20px">
    <h1>404</h1><p>Página não encontrada.</p><a href="/">Voltar ao catálogo</a></body></html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Storefront listening on http://localhost:${PORT}`);
});

export { server };
