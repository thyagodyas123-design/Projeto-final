import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressHttpServer } from '../apps/progress/src/progress-http.mjs';

test('POST /enrollments cria matrícula e GET retorna progresso', async () => {
  const server = createProgressHttpServer({ database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const enrollment = await fetch(`${base}/enrollments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user-1', courseId: 'course-1' }),
  });
  const progress = await fetch(`${base}/enrollments/user-1/course-1`);

  assert.equal(enrollment.status, 201);
  assert.equal(progress.status, 200);
  assert.deepEqual((await progress.json()).completedLessonIds, []);
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

test('PATCH /enrollments/:user/:course/lessons/:lesson atualiza conclusão', async () => {
  const server = createProgressHttpServer({ database: ':memory:' });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  await fetch(`${base}/enrollments`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'user-1', courseId: 'course-1' }),
  });
  const response = await fetch(`${base}/enrollments/user-1/course-1/lessons/course-1-1`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ completed: true, totalLessons: 2 }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).progressPercent, 50);
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});
