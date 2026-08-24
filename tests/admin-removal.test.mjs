import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService } from '../apps/admin/src/admin-service.mjs';

test('professor cria solicitação de remoção pendente', async () => {
  const service = createAdminService({ database: ':memory:' });
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });

  assert.equal(request.courseId, 'course-1');
  assert.equal(request.status, 'pending');
});

test('administrador aprova remoção de curso', async () => {
  const service = createAdminService({ database: ':memory:' });
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });
  const decision = await service.decideCourseRemoval({ requestId: request.id, actorRole: 'admin', status: 'approved' });

  assert.equal(decision.status, 'approved');
  assert.equal(decision.decidedByRole, 'admin');
});

test('rejeição exige motivo', async () => {
  const service = createAdminService({ database: ':memory:' });
  const request = await service.requestCourseRemoval({ courseId: 'course-1', requestedBy: 'teacher-1', actorRole: 'teacher' });

  await assert.rejects(service.decideCourseRemoval({ requestId: request.id, actorRole: 'admin', status: 'rejected' }), /motivo obrigatório/);
});
