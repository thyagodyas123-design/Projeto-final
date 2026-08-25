import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const REPO = new URL('../apps/progress/dist/progress/progress.repository.js', import.meta.url);
const SERVICE = new URL('../apps/progress/dist/progress/progress.service.js', import.meta.url);
const BUILT = existsSync(REPO) && existsSync(SERVICE);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'progresso não compilado — rode pnpm build primeiro' }, fn);

const lessons = ['course-1-1', 'course-1-2'];

async function createService() {
  const { ProgressRepository } = await import(REPO.href);
  const { ProgressService } = await import(SERVICE.href);
  return new ProgressService(new ProgressRepository(':memory:'));
}

t('matrícula é idempotente para o mesmo aluno e curso', async () => {
  const service = await createService();
  const first = await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  const second = await service.enroll({ userId: 'user-1', courseId: 'course-1' });

  assert.equal(first.id, second.id);
});

t('conclusão retorna progresso percentual e IDs concluídos', async () => {
  const service = await createService();
  await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  const result = await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[0], completed: true, totalLessons: 2 });

  assert.equal(result.progressPercent, 50);
  assert.deepEqual(result.completedLessonIds, [lessons[0]]);
});

t('certificado é liberado quando todas as aulas são concluídas', async () => {
  const service = await createService();
  await service.enroll({ userId: 'user-1', courseId: 'course-1' });
  await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[0], completed: true, totalLessons: 2 });
  const result = await service.setLessonCompleted({ userId: 'user-1', courseId: 'course-1', lessonId: lessons[1], completed: true, totalLessons: 2 });

  assert.equal(result.progressPercent, 100);
  assert.equal(result.certificate.status, 'issued');
});
