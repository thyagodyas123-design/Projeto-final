import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DIST = new URL('../apps/auth/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'auth não compilado — rode pnpm build primeiro' }, fn);

async function startApp(database = ':memory:') {
  process.env.AUTH_DATABASE = database;
  const { createTestApp, listen } = await import('../apps/auth/test-server.mjs');
  const app = await createTestApp();
  const url = await listen(app);
  return { app, url };
}

t('POST /auth/register cria aluno e define cookie HttpOnly', async () => {
  const { app, url } = await startApp();

  const response = await fetch(`${url}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'ana@example.com', password: 'Senha123!' }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'student');
  assert.match(response.headers.get('set-cookie'), /access_token=.*HttpOnly/);
  await app.close();
});

t('POST /auth/login rejeita credencial inválida', async () => {
  const { app, url } = await startApp();

  const response = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'missing@example.com', password: 'Senha123!' }),
  });

  assert.equal(response.status, 401);
  await app.close();
});

t('Auth HTTP preserva cadastro no SQLite entre instâncias', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'plataforma-auth-'));
  const filename = join(directory, 'auth.sqlite');

  const { app: firstApp, url: firstUrl } = await startApp(filename);
  const register = await fetch(`${firstUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'persisted@example.com', password: 'Senha123!' }),
  });
  assert.equal(register.status, 201);
  await firstApp.close();

  const { app: secondApp, url: secondUrl } = await startApp(filename);
  const login = await fetch(`${secondUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'persisted@example.com', password: 'Senha123!' }),
  });
  assert.equal(login.status, 200);
  await secondApp.close();
  rmSync(directory, { recursive: true, force: true });
});
