import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminHttpServer } from '../apps/admin/src/admin-http.mjs';

test('API Admin cria e lista solicitações pendentes', async () => {
  const server = createAdminHttpServer({ database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const created = await fetch(`${base}/removal-requests`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' }) });
  const list = await fetch(`${base}/removal-requests?status=pending`);

  assert.equal(created.status, 201);
  assert.equal((await list.json()).length, 1);
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});
