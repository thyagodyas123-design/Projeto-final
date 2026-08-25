import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const DIST = new URL('../apps/admin/dist/admin/admin.service.js', import.meta.url);
const BUILT = existsSync(DIST);

const t = (name, fn) =>
  BUILT
    ? test(name, fn)
    : test(name, { skip: 'admin não compilado — rode pnpm build primeiro' }, fn);

async function createService() {
  const { AdminService } = await import(DIST.href);
  const { AdminRepository } = await import(new URL('../apps/admin/dist/admin/admin.repository.js', import.meta.url).href);
  return new AdminService(new AdminRepository(':memory:'));
}

t('professor cria solicitação de remoção pendente', async () => {
  const service = await createService();
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });

  assert.equal(request.courseId, 'course-1');
  assert.equal(request.status, 'pending');
});

t('administrador aprova remoção de curso', async () => {
  const service = await createService();
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });
  const decision = await service.decideCourseRemoval({ requestId: request.id, actorRole: 'admin', status: 'approved' });

  assert.equal(decision.status, 'approved');
  assert.equal(decision.decidedByRole, 'admin');
});

t('rejeição exige motivo', async () => {
  const service = await createService();
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });

  await assert.rejects(service.decideCourseRemoval({ requestId: request.id, actorRole: 'admin', status: 'rejected' }), /motivo obrigatório/);
});
