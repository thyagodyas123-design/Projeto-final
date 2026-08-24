import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAuthHttpServer } from '../apps/auth/src/auth-http.mjs';
import { createAuthRepository } from '../apps/auth/src/auth-repository.mjs';

const memoryServer = () => createAuthHttpServer({ secret: 'http-test-secret', repository: createAuthRepository(':memory:') });
const closeServer = (server) => new Promise((resolve) => {
  server.closeAllConnections?.();
  server.close(resolve);
});

test('POST /auth/register cria aluno e define cookie HttpOnly', async () => {
  const server = memoryServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();

  const response = await fetch(`http://127.0.0.1:${address.port}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'ana@example.com', password: 'Senha123!' }),
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.user.role, 'student');
  assert.match(response.headers.get('set-cookie'), /access_token=.*HttpOnly/);
  await closeServer(server);
});

test('POST /auth/login rejeita credencial inválida', async () => {
  const server = memoryServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();

  const response = await fetch(`http://127.0.0.1:${address.port}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'missing@example.com', password: 'Senha123!' }),
  });

  assert.equal(response.status, 401);
  await closeServer(server);
});

test('Auth HTTP preserva cadastro no SQLite entre instâncias', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'plataforma-auth-'));
  const filename = join(directory, 'auth.sqlite');
  const first = createAuthRepository(filename);
  const firstServer = createAuthHttpServer({ secret: 'persistent-secret', repository: first });
  await new Promise((resolve) => firstServer.listen(0, resolve));
  const firstPort = firstServer.address().port;
  const register = await fetch(`http://127.0.0.1:${firstPort}/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'persisted@example.com', password: 'Senha123!' }),
  });
  assert.equal(register.status, 201);
  await closeServer(firstServer);

  const second = createAuthRepository(filename);
  const secondServer = createAuthHttpServer({ secret: 'persistent-secret', repository: second });
  await new Promise((resolve) => secondServer.listen(0, resolve));
  const secondPort = secondServer.address().port;
  const login = await fetch(`http://127.0.0.1:${secondPort}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'persisted@example.com', password: 'Senha123!' }),
  });
  assert.equal(login.status, 200);
  await closeServer(secondServer);
  first.close(); second.close(); rmSync(directory, { recursive: true, force: true });
});
