import { createServer } from 'node:http';
import { courses as fallbackCourses, getCourse as fallbackGetCourse } from '../../../packages/shared/data.mjs';

const PORT = process.env.PORT ?? 3004;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';
const USER_ID = 'user-123';

/* ─── SVG Icons ─── */
const icons = {
  back: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  play: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="11"/><path d="m9 12 2 2 4-4"/></svg>',
  circle: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  cert: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
};

function renderPage(courseId) {
  const course = fallbackGetCourse(courseId);
  if (!course) return null;

  const lessonsHtml = course.lessons
    .map(
      (l, i) => `
    <li class="lesson-item" data-lesson="${l.id}" data-index="${i}">
      <div class="lesson-check" role="checkbox" aria-label="Marcar aula ${l.title} como concluída" tabindex="0">
        ${icons.circle}
      </div>
      <div class="lesson-info">
        <span class="lesson-number">${i + 1}. ${l.title}</span>
        <span class="lesson-duration">${l.duration}</span>
      </div>
    </li>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${course.title} — Fábrica de Gênios</title>
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
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.07);
      --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);
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
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--gray-200);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--gray-600);
      text-decoration: none;
      transition: color var(--transition);
    }
    .back-link:hover { color: var(--blue-600) }
    .header-actions { display: flex; align-items: center; gap: 12px }
    .icon-btn {
      width: 38px; height: 38px;
      border-radius: 10px; border: none; background: transparent;
      color: var(--gray-500); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition);
    }
    .icon-btn:hover { background: var(--gray-100); color: var(--gray-700) }
    .avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, var(--blue-600), var(--blue-400));
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.75rem; font-weight: 600; cursor: pointer;
    }
    .avatar:hover { transform: scale(1.06) }

    /* ─── COURSE HEADER ─── */
    .course-header {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px 0;
    }
    .course-header h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-900);
      letter-spacing: -0.03em;
    }
    .course-subtitle {
      font-size: 0.95rem;
      color: var(--gray-500);
      margin-top: 2px;
    }
    .progress-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
    }
    .progress-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--gray-600);
    }
    .progress-pct {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--blue-600);
    }
    .progress-track {
      flex: 1;
      height: 8px;
      background: var(--gray-200);
      border-radius: 99px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      background: linear-gradient(90deg, var(--blue-600), var(--blue-400));
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      width: 0%;
    }

    /* ─── STATUS BAR ─── */
    .status-bar {
      max-width: 1400px;
      margin: 12px auto 0;
      padding: 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--gray-400);
    }
    .status-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-dot.online { background: #22c55e }
    .status-dot.offline { background: #f59e0b }

    /* ─── CERTIFICATE BANNER ─── */
    .cert-banner {
      max-width: 1400px;
      margin: 20px auto 0;
      padding: 0 24px;
      display: none;
    }
    .cert-banner.visible { display: block }
    .cert-inner {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid #bbf7d0;
      border-radius: var(--radius);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cert-inner svg { flex-shrink: 0 }
    .cert-text { font-size: 0.88rem; color: #166534; font-weight: 500 }

    /* ─── LAYOUT ─── */
    .classroom-layout {
      max-width: 1400px;
      margin: 24px auto 60px;
      padding: 0 24px;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 28px;
      align-items: start;
    }

    /* ─── VIDEO PLAYER ─── */
    .player-section { position: relative }
    .player-wrapper {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      background: var(--blue-900);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }
    .player-inner {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a, #1e3a5f);
    }
    .play-btn {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition);
    }
    .play-btn:hover {
      background: rgba(255,255,255,0.2);
      transform: scale(1.08);
    }

    /* ─── LESSON INFO ─── */
    .lesson-detail {
      margin-top: 20px;
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius);
      padding: 20px 24px;
    }
    .lesson-detail h3 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: 4px;
    }
    .lesson-detail p {
      font-size: 0.9rem;
      color: var(--gray-500);
      line-height: 1.55;
    }

    /* ─── LESSON SIDEBAR ─── */
    .lesson-sidebar {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--gray-100);
    }
    .sidebar-header h2 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-900);
    }
    .lesson-list {
      list-style: none;
      padding: 8px;
    }
    .lesson-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 12px;
      border-radius: 10px;
      cursor: pointer;
      transition: all var(--transition);
    }
    .lesson-item:hover { background: var(--gray-50) }
    .lesson-item.active {
      background: var(--blue-50);
      border-left: 3px solid var(--blue-600);
      padding-left: 9px;
    }
    .lesson-check {
      flex-shrink: 0;
      cursor: pointer;
      transition: transform var(--transition);
    }
    .lesson-check:hover { transform: scale(1.15) }
    .lesson-check.checked svg { color: var(--blue-600) }
    .lesson-info { display: flex; flex-direction: column; gap: 1px }
    .lesson-number {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--gray-800);
    }
    .lesson-duration {
      font-size: 0.78rem;
      color: var(--gray-400);
    }
    .lesson-item.completed .lesson-number {
      color: var(--gray-400);
    }
    .lesson-item.completed .lesson-duration { color: var(--blue-600) }

    /* ─── SPINNER ─── */
    .spin { animation: spin 1s linear infinite }
    @keyframes spin { to { transform: rotate(360deg) } }

    /* ─── TOAST ─── */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #fff;
      background: var(--gray-800);
      box-shadow: var(--shadow-lg);
      transform: translateY(80px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      z-index: 200;
    }
    .toast.show { transform: translateY(0); opacity: 1 }
    .toast.error { background: #dc2626 }
    .toast.success { background: #16a34a }

    /* ─── ANIMATIONS ─── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px) }
      to { opacity: 1; transform: translateY(0) }
    }
    .animate-in { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both }
    .delay-1 { animation-delay: 0.05s }
    .delay-2 { animation-delay: 0.1s }
    .delay-3 { animation-delay: 0.15s }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 960px) {
      .classroom-layout {
        grid-template-columns: 1fr;
      }
      .lesson-sidebar { order: -1 }
    }
    @media (max-width: 480px) {
      .course-header h1 { font-size: 1.5rem }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header class="header">
    <div class="header-inner">
      <a class="back-link" href="/">
        ${icons.back} Voltar à Vitrine
      </a>
      <div class="header-actions">
        <button class="icon-btn" aria-label="Notificações">${icons.bell}</button>
        <div class="avatar" title="${USER_ID}">U</div>
      </div>
    </div>
  </header>

  <!-- COURSE HEADER -->
  <section class="course-header animate-in">
    <h1 id="courseTitle">Curso: ${course.title}</h1>
    <div class="course-subtitle">Progresso Geral</div>
    <div class="progress-section">
      <span class="progress-label" id="moduleLabel">Módulo 1</span>
      <div class="progress-track">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <span class="progress-pct" id="progressPct">0%</span>
    </div>
  </section>

  <!-- STATUS BAR -->
  <div class="status-bar" id="statusBar">
    <span class="status-dot offline" id="statusDot"></span>
    <span id="statusText">Conectando...</span>
  </div>

  <!-- CERTIFICATE BANNER -->
  <div class="cert-banner" id="certBanner">
    <div class="cert-inner">
      ${icons.cert}
      <span class="cert-text">Parabéns! Você concluiu o curso e recebeu seu certificado.</span>
    </div>
  </div>

  <!-- CLASSROOM LAYOUT -->
  <div class="classroom-layout">
    <!-- VIDEO + LESSON DETAIL -->
    <div class="player-section animate-in delay-1">
      <div class="player-wrapper">
        <div class="player-inner">
          <button class="play-btn" aria-label="Reproduzir vídeo">${icons.play}</button>
        </div>
      </div>
      <div class="lesson-detail" id="lessonDetail">
        <h3>Aula Atual: ${course.lessons[0].title}</h3>
        <p>${course.longDescription}</p>
      </div>
    </div>

    <!-- LESSON SIDEBAR -->
    <aside class="lesson-sidebar animate-in delay-2">
      <div class="sidebar-header">
        ${icons.list}
        <h2>Aulas do Curso</h2>
      </div>
      <ul class="lesson-list" id="lessonList">
        ${lessonsHtml}
      </ul>
    </aside>
  </div>

  <!-- TOAST -->
  <div class="toast" id="toast"></div>

  <script>
    /* ─── Constants ─── */
    const COURSE_ID = '${courseId}';
    const USER_ID = '${USER_ID}';
    const TOTAL_LESSONS = ${course.lessons.length};
    const LESSONS = ${JSON.stringify(course.lessons)};
    const ICONS = ${JSON.stringify(icons)};
    const API_BASE = window.location.origin + '/api';

    /* ─── State ─── */
    let completedIds = [];
    let apiAvailable = false;
    let enrollmentId = null;

    /* ─── DOM ─── */
    const lessonItems = document.querySelectorAll('.lesson-item');
    const progressFill = document.getElementById('progressFill');
    const progressPct = document.getElementById('progressPct');
    const lessonDetail = document.getElementById('lessonDetail');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const certBanner = document.getElementById('certBanner');
    const toast = document.getElementById('toast');

    /* ─── Toast ─── */
    let toastTimer;
    function showToast(msg, type = 'success') {
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.className = 'toast ' + type + ' show';
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    /* ─── API calls ─── */
    async function apiCall(method, path, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API_BASE + path, { ...opts, signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    }

    async function initApi() {
      try {
        /* 1. Ensure enrollment */
        const enroll = await apiCall('POST', '/progress/enrollments', { userId: USER_ID, courseId: COURSE_ID });
        enrollmentId = enroll.id;

        /* 2. Fetch progress */
        const progress = await apiCall('GET', '/progress/enrollments/' + USER_ID + '/' + COURSE_ID + '?totalLessons=' + TOTAL_LESSONS);
        completedIds = progress.completedLessonIds || [];
        apiAvailable = true;
        setStatus(true, 'Sincronizado com o servidor');
      } catch {
        /* Fallback: try localStorage */
        completedIds = loadLocalFallback();
        apiAvailable = false;
        setStatus(false, 'Modo offline — dados locais');
      }
      updateUI();
    }

    function loadLocalFallback() {
      try {
        const raw = localStorage.getItem('progress_' + COURSE_ID);
        if (raw) return JSON.parse(raw).completed || [];
      } catch {}
      return [];
    }

    function saveLocalFallback() {
      try {
        localStorage.setItem('progress_' + COURSE_ID, JSON.stringify({ completed: completedIds }));
      } catch {}
    }

    async function toggleLesson(lessonId) {
      const isDone = completedIds.includes(lessonId);
      const newCompleted = !isDone;

      /* Optimistic update */
      if (newCompleted) {
        completedIds.push(lessonId);
      } else {
        completedIds = completedIds.filter(id => id !== lessonId);
      }
      updateUI();

      if (apiAvailable) {
        try {
          const result = await apiCall('PATCH',
            '/progress/enrollments/' + USER_ID + '/' + COURSE_ID + '/lessons/' + lessonId,
            { completed: newCompleted, totalLessons: TOTAL_LESSONS }
          );
          completedIds = result.completedLessonIds || completedIds;
          updateUI();
          if (result.progressPercent === 100) {
            showToast('Certificado emitido! Parabéns!', 'success');
          }
        } catch {
          /* Revert on error */
          if (newCompleted) {
            completedIds = completedIds.filter(id => id !== lessonId);
          } else {
            completedIds.push(lessonId);
          }
          updateUI();
          showToast('Erro ao salvar. Tente novamente.', 'error');
        }
      } else {
        saveLocalFallback();
      }
    }

    /* ─── UI ─── */
    function setStatus(online, text) {
      statusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
      statusText.textContent = text;
    }

    function updateUI() {
      const done = completedIds.length;
      const pct = TOTAL_LESSONS > 0 ? Math.round((done / TOTAL_LESSONS) * 100) : 0;
      progressFill.style.width = pct + '%';
      progressPct.textContent = pct + '%';

      /* Certificate */
      certBanner.classList.toggle('visible', pct === 100);

      /* Lesson items */
      lessonItems.forEach((item, i) => {
        const lessonId = LESSONS[i].id;
        const isDone = completedIds.includes(lessonId);
        const check = item.querySelector('.lesson-check');
        if (isDone) {
          check.innerHTML = ICONS.check;
          check.classList.add('checked');
          item.classList.add('completed');
          item.querySelector('.lesson-duration').textContent =
            LESSONS[i].duration + ' · Concluída';
        } else {
          check.innerHTML = ICONS.circle;
          check.classList.remove('checked');
          item.classList.remove('completed');
          item.querySelector('.lesson-duration').textContent = LESSONS[i].duration;
        }
      });
    }

    /* ─── Check toggles ─── */
    lessonItems.forEach((item, i) => {
      const check = item.querySelector('.lesson-check');
      check.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLesson(LESSONS[i].id);
      });
      check.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          check.click();
        }
      });
    });

    /* ─── Lesson selection ─── */
    lessonItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        lessonItems.forEach(l => l.classList.remove('active'));
        item.classList.add('active');
        lessonDetail.querySelector('h3').textContent = 'Aula Atual: ' + LESSONS[i].title;
        lessonDetail.querySelector('p').textContent =
          ${JSON.stringify(fallbackCourses.map(c => c.longDescription))}[0] ||
          'Conteúdo desta aula em breve disponível.';
      });
    });

    /* ─── Init ─── */
    initApi();
  </script>
</body>
</html>`;
}

/* ─── Server ─── */
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ service: 'classroom', status: 'ok' }));
    return;
  }

  const courseMatch = req.url.match(/^\/curso\/([^/]+)\/?$/);
  if (courseMatch) {
    const courseId = courseMatch[1];
    const html = renderPage(courseId);
    if (!html) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px 20px">
        <h1>404</h1><p>Curso não encontrado.</p><a href="/">Voltar ao catálogo</a></body></html>`);
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  /* Root redirect to storefront */
  if (req.url === '/' || req.url === '') {
    res.writeHead(302, { Location: 'http://localhost:3000' });
    res.end();
    return;
  }

  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:80px 20px">
    <h1>404</h1><p>Página não encontrada.</p><a href="http://localhost:3000">Voltar ao catálogo</a></body></html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Classroom listening on http://localhost:${PORT}`);
});

export { server };
