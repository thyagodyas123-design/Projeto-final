import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/progress/dist/app.module.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'progresso não compilado — rode pnpm build primeiro' }, fn);

async function startApp() {
  process.env.PROGRESS_DATABASE = ':memory:';
  const { createTestApp, listen } = await import('../apps/progress/test-server.mjs');
  const app = await createTestApp();
  const url = await listen(app);
  return { app, url };
}

t('POST /enrollments cria matrícula e GET retorna progresso', async () => {
  const { app, url } = await startApp();
  const enrollment = await fetch(`${url}/enrollments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user-1', courseId: 'course-1' }),
  });
  const progress = await fetch(`${url}/enrollments/user-1/course-1`);

  assert.equal(enrollment.status, 201);
  assert.equal(progress.status, 200);
  assert.deepEqual((await progress.json()).completedLessonIds, []);
  await app.close();
});

t('PATCH /enrollments/:user/:course/lessons/:lesson atualiza conclusão', async () => {
  const { app, url } = await startApp();
  await fetch(`${url}/enrollments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user-1', courseId: 'course-1' }),
  });
  const response = await fetch(`${url}/enrollments/user-1/course-1/lessons/course-1-1`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ completed: true, totalLessons: 2 }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).progressPercent, 50);
  await app.close();
});

t('GET /enrollments?userId= lista matrículas do usuário', async () => {
  const { app, url } = await startApp();
  for (const [userId, courseId] of [['user-1', 'course-1'], ['user-1', 'course-2'], ['user-2', 'course-1']]) {
    await fetch(`${url}/enrollments`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, courseId }),
    });
  }

  const response = await fetch(`${url}/enrollments?userId=user-1`);
  const list = await response.json();

  assert.equal(response.status, 200);
  assert.equal(list.length, 2);
  assert.ok(list.every((e) => e.userId === 'user-1'));
  await app.close();
});
