import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalogHttpServer } from '../apps/catalog/src/catalog-http.mjs';

test('GET /courses retorna catálogo JSON', async () => {
  const server = createCatalogHttpServer({ database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/courses`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 3);
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

test('GET /courses/:id retorna 404 para curso inexistente', async () => {
  const server = createCatalogHttpServer({ database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/courses/inexistente`);

  assert.equal(response.status, 404);
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});
