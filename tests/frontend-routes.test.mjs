import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import net from 'node:net';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STOREFRONT_DIR = path.join(ROOT, 'apps/storefront');
const CLASSROOM_DIR = path.join(ROOT, 'apps/classroom');

const BUILT =
  existsSync(path.join(STOREFRONT_DIR, '.next', 'BUILD_ID')) &&
  existsSync(path.join(CLASSROOM_DIR, '.next', 'BUILD_ID'));

const gated = (opts) => (BUILT ? opts : { ...opts, skip: 'apps não construídas — rode pnpm build primeiro' });

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
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

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

function startNextApp(appDir, port, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(port), '-H', '127.0.0.1'],
      {
        cwd: appDir,
        env: { ...process.env, ...extraEnv, NEXT_TELEMETRY_DISABLED: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('error', reject);

    const started = Date.now();
    const poll = setInterval(async () => {
      if (child.exitCode !== null) {
        clearInterval(poll);
        reject(new Error(`next start falhou:\n${output}`));
        return;
      }
      if (Date.now() - started > 45000) {
        clearInterval(poll);
        child.kill('SIGKILL');
        reject(new Error('timeout ao iniciar next start'));
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`);
        if (res.status) {
          clearInterval(poll);
          resolve(child);
        }
      } catch {
        /* ainda subindo */
      }
    }, 400);
  });
}

function stopApp(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }, 3000).unref();
  });
}

/* ─── Servers ─── */
let classroomProc, storefrontProc;
let SF_URL, CR_URL;

before(async () => {
  if (!BUILT) return;

  const classroomPort = await freePort();
  const sfPort = await freePort();

  classroomProc = await startNextApp(CLASSROOM_DIR, classroomPort, {
    GATEWAY_URL: 'http://127.0.0.1:19999',
  });

  storefrontProc = await startNextApp(STOREFRONT_DIR, sfPort, {
    GATEWAY_URL: 'http://127.0.0.1:19999',
  });

  SF_URL = `http://127.0.0.1:${sfPort}`;
  CR_URL = `http://127.0.0.1:${classroomPort}`;
});

after(async () => {
  await Promise.all([stopApp(storefrontProc), stopApp(classroomProc)]);
});

/* ═══════════════════════════════════════════════
   STOREFRONT (Next.js)
   ═══════════════════════════════════════════════ */
describe('Storefront (Next.js)', gated({}), () => {
  it('GET / renderiza o catálogo', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Catálogo de Cursos'));
    assert.ok(res.body.includes('Fábrica de Gênios'));
  });

  it('catálogo renderiza estado de carregamento (skeleton) no SSR', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('skeleton-card'));
    assert.ok(res.body.includes('skeleton-shimmer'));
  });

  it('catálogo tem busca e banner de certificação', async () => {
    const res = await fetch(`${SF_URL}/`);
    assert.ok(res.body.includes('Buscar cursos'));
    assert.ok(res.body.includes('Certificação Profissional'));
  });

  it('GET /rota-inexistente retorna 404', async () => {
    const res = await fetch(`${SF_URL}/rota-inexistente`);
    assert.equal(res.status, 404);
  });
});

/* ═══════════════════════════════════════════════
   CLASSROOM (Next.js)
   ═══════════════════════════════════════════════ */
describe('Classroom (Next.js)', gated({}), () => {
  it('GET /curso/nestjs-basico renderiza a sala de aula completa', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.equal(res.status, 200);

    assert.ok(res.body.includes('NestJS Básico'));
    assert.ok(res.body.includes('Progresso Geral'));
    assert.ok(res.body.includes('Aulas do Curso'));

    /* 5 aulas com checkbox */
    const checkboxes = (res.body.match(/role="checkbox"/g) || []).length;
    assert.equal(checkboxes, 5);
    assert.ok(res.body.includes('Introdução ao NestJS'));
    assert.ok(res.body.includes('Integração com TypeORM'));

    assert.ok(res.body.includes('Voltar à Vitrine'));
  });

  it('GET /curso/docker renderiza o curso correto', async () => {
    const res = await fetch(`${CR_URL}/curso/docker`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes('Docker'));
    assert.ok(res.body.includes('Fundamentos de Containers'));
  });

  it('GET /curso/invalido retorna 404', async () => {
    const res = await fetch(`${CR_URL}/curso/invalido`);
    assert.equal(res.status, 404);
  });

  it('sala de aula tem layout responsivo no CSS', async () => {
    const res = await fetch(`${CR_URL}/curso/nestjs-basico`);
    assert.ok(res.body.includes('classroom-layout'));
    assert.ok(res.body.includes('lesson-sidebar'));
    assert.ok(res.body.includes('player-section'));
  });
});

/* ═══════════════════════════════════════════════
   MULTI-ZONE PROXY (config estática — proxy real é validado no smoke do Docker)
   ═══════════════════════════════════════════════ */
describe('Multi-zone proxy (config)', () => {
  it('storefront declara rewrite de /curso/:id para o classroom', () => {
    const cfg = readFileSync(path.join(STOREFRONT_DIR, 'next.config.mjs'), 'utf8');
    assert.match(cfg, /source: '\/curso\/:id'/);
    assert.match(cfg, /CLASSROOM_HOST/);
    assert.match(cfg, /CLASSROOM_PORT/);
    assert.match(cfg, /destination: `http:\/\//);
  });

  it('compose define CLASSROOM_HOST=classroom para o storefront', () => {
    const compose = readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf8');
    assert.match(compose, /CLASSROOM_HOST: "classroom"/);
  });

  it('Dockerfile assa CLASSROOM_HOST antes do build (rewrite é build-time)', () => {
    const dockerfile = readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
    assert.match(dockerfile, /ENV CLASSROOM_HOST=classroom/);
  });
});
