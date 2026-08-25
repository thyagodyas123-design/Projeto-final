import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/gateway/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT ? test(name, fn) : test(name, { skip: 'gateway não compilado — rode pnpm build primeiro' }, fn);

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

async function startGateway(env = {}) {
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
  const { createTestApp, listen: appListen } = await import('../apps/gateway/test-server.mjs');
  const app = await createTestApp();
  const url = await appListen(app);
  return { app, url };
}

async function closeServer(server) {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
}

t('Gateway encaminha rota de catálogo e preserva resposta', async () => {
  const upstream = createServer((request, response) => {
    assert.equal(request.url, '/courses?category=BACKEND');
    assert.equal(request.headers.cookie, 'access_token=abc');
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const { app, url } = await startGateway({ CATALOG_URL: `http://127.0.0.1:${upstreamPort}` });

  const response = await fetch(`${url}/api/catalog/courses?category=BACKEND`, { headers: { cookie: 'access_token=abc' } });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  await app.close();
  await closeServer(upstream);
});

t('Gateway retorna 404 para rota desconhecida', async () => {
  const { app, url } = await startGateway();
  const response = await fetch(`${url}/unknown`);
  assert.equal(response.status, 404);
  await app.close();
});

t('Gateway preserva prefixo /auth para endpoints de autenticação', async () => {
  const upstream = createServer((request, response) => {
    assert.equal(request.url, '/auth/register');
    response.writeHead(201, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const { app, url } = await startGateway({ AUTH_URL: `http://127.0.0.1:${upstreamPort}` });

  const response = await fetch(`${url}/api/auth/register`, { method: 'POST', body: '{}' });

  assert.equal(response.status, 201);
  await app.close();
  await closeServer(upstream);
});
