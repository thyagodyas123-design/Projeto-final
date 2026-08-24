import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import net from 'node:net';

/* ─── Helpers ─── */
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body })
      );
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function getPort(server) {
  return server.address().port;
}

/* Find a free port */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
    s.on('error', reject);
  });
}

/* ─── Servers ─── */
let storefrontServer, classroomServer;
let SF_URL, CR_URL;

before(async () => {
  /* Classroom must start first so storefront can proxy to it */
  const classroomPort = await freePort();
  process.env.PORT = String(classroomPort);
  process.env.GATEWAY_URL = 'http://127.0.0.1:19999';

  const classroom = await import('../apps/classroom/src/server.mjs');
  classroomServer = classroom.server;

  await new Promise(r => setTimeout(r, 150));

  /* Now start storefront pointing to the classroom port */
  const sfPort = await freePort();
  process.env.PORT = String(sfPort);
  process.env.CLASSROOM_PORT = String(classroomPort);

  const storefront = await import('../apps/storefront/src/server.mjs');
  storefrontServer = storefront.server;

  await new Promise(r => setTimeout(r, 150));

  SF_URL = `http://localhost:${sfPort}`;
  CR_URL = `http://localhost:${classroomPort}`;
});

after(async () => {
  const close = (s) => new Promise((r) => { if (!s) return r(); s.closeAllConnections?.(); s.close(r); });
  await Promise.all([close(storefrontServer), close(classroomServer)]);
});

it('proxy do Storefront permite host interno configurável', () => {
  const source = readFileSync(new URL('../apps/storefront/src/server.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes('CLASSROOM_HOST'));
});

/* ═══════════════════════════════════════════════
   STOREFRONT TESTS
   ═══════════════════════════════════════════════ */
describe('Storefront', () => {
  it('GET /health returns 200', async () => {
    const res = await fetch(`${SF_URL}/health`);
    assert.equal(res.status, 200);
    const data = JSON.parse(res.body);
    assert.equal(data.service, 'storefront');
    assert.equal(data.status, 'ok');
  });

  it('GET / renders catalog with skeleton loading and API badge', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Catálogo de Cursos'));
    assert.ok(res.body.includes('Fábrica de Gênios'));

    /* Skeleton loading elements */
    assert.ok(res.body.includes('skeleton-card'));
    assert.ok(res.body.includes('skeleton-shimmer'));
    assert.ok(res.body.includes('loadingBar'));

    /* Source badge (hidden initially, shown by JS) */
    assert.ok(res.body.includes('sourceBadge'));
    assert.ok(res.body.includes('Dados locais'));

    /* Client-side fetch logic */
    assert.ok(res.body.includes('API_BASE'));
    assert.ok(res.body.includes('fetchCourses'));
    assert.ok(res.body.includes('FALLBACK_COURSES'));
    assert.ok(res.body.includes('AbortSignal.timeout'));
  });

  it('catalog page has filter chips and search input', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('data-filter="ALL"'));
    assert.ok(res.body.includes('data-filter="BACKEND"'));
    assert.ok(res.body.includes('data-filter="FRONTEND"'));
    assert.ok(res.body.includes('data-filter="DEVOPS"'));
    assert.ok(res.body.includes('searchInput'));
  });

  it('catalog page renders fallback course cards', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('NestJS Básico'));
    assert.ok(res.body.includes('NextJS Avançado'));
    assert.ok(res.body.includes('Docker'));
    assert.ok(res.body.includes('BACKEND'));
    assert.ok(res.body.includes('FRONTEND'));
    assert.ok(res.body.includes('DEVOPS'));
  });

  it('GET /curso/nestjs-basico proxies to classroom (keeps URL on 3000)', async () => {
    const res = await fetch(`${SF_URL}/curso/nestjs-basico`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Curso: NestJS Básico'));
    assert.ok(res.body.includes('Aulas do Curso'));
    assert.ok(res.headers['content-type'].includes('text/html'));
    /* Should NOT be a redirect */
    assert.notEqual(res.status, 302);
    assert.ok(!res.headers.location);
  });

  it('GET /curso/nextjs-avancado proxies correctly', async () => {
    const res = await fetch(`${SF_URL}/curso/nextjs-avancado`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Curso: NextJS Avançado'));
  });

  it('GET /curso/invalido returns 404', async () => {
    const res = await fetch(`${SF_URL}/curso/invalido`);
    assert.equal(res.status, 404);
    assert.ok(res.body.includes('404'));
  });

  it('GET /rota-inexistente returns 404', async () => {
    const res = await fetch(`${SF_URL}/rota-inexistente`);
    assert.equal(res.status, 404);
  });

  it('catalog page has certification banner', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('Certificação Profissional'));
    assert.ok(res.body.includes('Ver Trilhas'));
  });

  it('catalog renders inline SVG patterns on cards', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('card-image-pattern'));
    assert.ok(res.body.includes('viewBox="0 0 200 120"'));
  });
});

/* ═══════════════════════════════════════════════
   CLASSROOM TESTS
   ═══════════════════════════════════════════════ */
describe('Classroom', () => {
  it('GET /health returns 200', async () => {
    const res = await fetch(`${CR_URL}/health`);
    assert.equal(res.status, 200);
    const data = JSON.parse(res.body);
    assert.equal(data.service, 'classroom');
  });

  it('GET / redirects to storefront (302)', async () => {
    const res = await fetch(`${CR_URL}/`);
    assert.equal(res.status, 302);
  });

  it('GET /curso/nestjs-basico renders full classroom page', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.equal(res.status, 200);

    /* Course header */
    assert.ok(res.body.includes('Curso: NestJS Básico'));
    assert.ok(res.body.includes('Progresso Geral'));

    /* Progress elements */
    assert.ok(res.body.includes('progress-fill'));
    assert.ok(res.body.includes('progressPct'));
    assert.ok(res.body.includes('progress-track'));

    /* Video player */
    assert.ok(res.body.includes('player-wrapper'));
    assert.ok(res.body.includes('play-btn'));

    /* 5 lessons */
    const checkboxes = (res.body.match(/role="checkbox"/g) || []).length;
    assert.equal(checkboxes, 5);
    assert.ok(res.body.includes('1. Introdução ao NestJS'));
    assert.ok(res.body.includes('2. Criando o primeiro módulo'));
    assert.ok(res.body.includes('3. Controllers e Rotas'));
    assert.ok(res.body.includes('4. Providers e Injeção de Dep.'));
    assert.ok(res.body.includes('5. Integração com TypeORM'));

    /* Back link points to storefront root */
    assert.ok(res.body.includes('Voltar à Vitrine'));
    assert.ok(res.body.includes('href="/"'));
  });

  it('classroom has API integration code for progress', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);

    /* API_BASE constructed from origin */
    assert.ok(res.body.includes("window.location.origin + '/api'"));

    /* apiCall function that makes fetch requests */
    assert.ok(res.body.includes('apiCall'));

    /* Enrollment creation via POST */
    assert.ok(res.body.includes("'POST'"));
    assert.ok(res.body.includes('/progress/enrollments'));

    /* Lesson toggle via PATCH */
    assert.ok(res.body.includes("'PATCH'"));
    assert.ok(res.body.includes('/lessons/'));

    /* Enrollment and progress state */
    assert.ok(res.body.includes('enrollmentId'));
    assert.ok(res.body.includes('completedLessonIds'));
    assert.ok(res.body.includes('progressPercent'));
  });

  it('classroom has fallback and offline mode', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);

    /* Local fallback for when API is down */
    assert.ok(res.body.includes('loadLocalFallback'));
    assert.ok(res.body.includes('saveLocalFallback'));
    assert.ok(res.body.includes('localStorage'));

    /* Status bar showing online/offline */
    assert.ok(res.body.includes('statusBar'));
    assert.ok(res.body.includes('statusDot'));
    assert.ok(res.body.includes('Modo offline'));
    assert.ok(res.body.includes('Sincronizado'));

    /* API availability tracking */
    assert.ok(res.body.includes('apiAvailable'));
  });

  it('classroom has certificate banner', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('certBanner'));
    assert.ok(res.body.includes('certificado'));
    assert.ok(res.body.includes('progressPercent === 100'));
  });

  it('classroom has toast notifications', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('showToast'));
    assert.ok(res.body.includes('toast'));
    assert.ok(res.body.includes('Erro ao salvar'));
  });

  it('classroom has error handling with revert', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('Revert on error'));
    assert.ok(res.body.includes('try'));
    assert.ok(res.body.includes('catch'));
  });

  it('classroom has AbortSignal timeout for fetch', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('AbortSignal.timeout'));
  });

  it('classroom has optimistic update pattern', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('Optimistic update'));
    assert.ok(res.body.includes('toggleLesson'));
    assert.ok(res.body.includes('initApi'));
  });

  it('GET /curso/docker renders correct course', async () => {
    const res = await fetch(`${CR_URL}/curso/docker`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Curso: Docker'));
    assert.ok(res.body.includes('Fundamentos de Containers'));
  });

  it('GET /curso/invalido returns 404', async () => {
    const res = await fetch(`${CR_URL}/curso/invalido`);
    assert.equal(res.status, 404);
    assert.ok(res.body.includes('404'));
  });

  it('classroom has responsive layout', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('classroom-layout'));
    assert.ok(res.body.includes('lesson-sidebar'));
    assert.ok(res.body.includes('player-section'));
    assert.ok(res.body.includes('@media'));
  });
});
