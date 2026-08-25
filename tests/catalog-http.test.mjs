import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/catalog/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'catálogo não compilado — rode pnpm build primeiro' }, fn);

async function startApp() {
  process.env.CATALOG_DATABASE = ':memory:';
  const { createTestApp, listen } = await import('../apps/catalog/test-server.mjs');
  const app = await createTestApp();
  const url = await listen(app);
  return { app, url };
}

t('GET /courses retorna catálogo JSON', async () => {
  const { app, url } = await startApp();
  const response = await fetch(`${url}/courses`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 3);
  await app.close();
});

t('GET /courses/:id retorna 404 para curso inexistente', async () => {
  const { app, url } = await startApp();
  const response = await fetch(`${url}/courses/inexistente`);

  assert.equal(response.status, 404);
  await app.close();
});
