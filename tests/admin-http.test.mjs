import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/admin/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'admin não compilado — rode pnpm build primeiro' }, fn);

async function startApp() {
  process.env.ADMIN_DATABASE = ':memory:';
  const { createTestApp, listen } = await import('../apps/admin/test-server.mjs');
  const app = await createTestApp();
  const url = await listen(app);
  return { app, url };
}

t('API Admin cria e lista solicitações pendentes', async () => {
  const { app, url } = await startApp();
  const created = await fetch(`${url}/removal-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' }) });
  const list = await fetch(`${url}/removal-requests?status=pending`);

  assert.equal(created.status, 201);
  assert.equal((await list.json()).length, 1);
  await app.close();
});
