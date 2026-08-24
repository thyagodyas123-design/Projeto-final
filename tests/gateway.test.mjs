import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createGatewayServer } from '../apps/gateway/src/gateway-http.mjs';

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

test('Gateway encaminha rota de catálogo e preserva resposta', async () => {
  const upstream = createServer((request, response) => {
    assert.equal(request.url, '/courses?category=BACKEND');
    assert.equal(request.headers.cookie, 'access_token=abc');
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const gateway = createGatewayServer({ targets: { catalog: `http://127.0.0.1:${upstreamPort}` } });
  const gatewayPort = await listen(gateway);
  const response = await fetch(`http://127.0.0.1:${gatewayPort}/api/catalog/courses?category=BACKEND`, { headers: { cookie: 'access_token=abc' } });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  upstream.closeAllConnections?.();
  gateway.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => upstream.close(resolve)),
    new Promise((resolve) => gateway.close(resolve)),
  ]);
});

test('Gateway retorna 404 para rota desconhecida', async () => {
  const gateway = createGatewayServer();
  const port = await listen(gateway);
  const response = await fetch(`http://127.0.0.1:${port}/unknown`);

  assert.equal(response.status, 404);
  gateway.closeAllConnections?.();
  await new Promise((resolve) => gateway.close(resolve));
});

test('Gateway preserva prefixo /auth para endpoints de autenticação', async () => {
  const upstream = createServer((request, response) => {
    assert.equal(request.url, '/auth/register');
    response.writeHead(201, { 'content-type': 'application/json' });
    response.end('{"ok":true}');
  });
  const upstreamPort = await listen(upstream);
  const gateway = createGatewayServer({ targets: { auth: `http://127.0.0.1:${upstreamPort}` } });
  const gatewayPort = await listen(gateway);
  const response = await fetch(`http://127.0.0.1:${gatewayPort}/api/auth/register`, { method: 'POST', body: '{}' });

  assert.equal(response.status, 201);
  upstream.closeAllConnections?.();
  gateway.closeAllConnections?.();
  await Promise.all([
    new Promise((resolve) => upstream.close(resolve)),
    new Promise((resolve) => gateway.close(resolve)),
  ]);
});
