import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressService } from '../apps/progress/src/progress-service.mjs';

const lessons = ['course-1-1', 'course-1-2'];

test('matrícula é idempotente para o mesmo aluno e curso', async () => {
  const service = createProgressService({ database: ':memory:' });
  const first = await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  const second = await service.enroll({ userId: 'user-1', courseId: 'course-1' });

  assert.equal(first.id, second.id);
});

test('conclusão retorna progresso percentual e IDs concluídos', async () => {
  const service = createProgressService({ database: ':memory:' });
  await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  const result = await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[0], completed: true, totalLessons: 2 });

  assert.equal(result.progressPercent, 50);
  assert.deepEqual(result.completedLessonIds, [lessons[0]]);
});

test('certificado é liberado quando todas as aulas são concluídas', async () => {
  const service = createProgressService({ database: ':memory:' });
  await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[0], completed: true, totalLessons: 2 });
  const result = await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[1], completed: true, totalLessons: 2 });

  assert.equal(result.progressPercent, 100);
  assert.equal(result.certificate.status, 'issued');
});
