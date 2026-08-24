import { createAdminRepository } from './admin-repository.mjs';

export function createAdminService({ database } = {}) {
  const repository = createAdminRepository(database);
  return {
    async requestCourseRemoval({ courseId, requestedBy, actorRole }) {
      if (actorRole !== 'teacher') throw new Error('somente professor pode solicitar remoção');
      return repository.createRemoval({ courseId, requestedBy });
    },
    async listCourseRemovals(status) { return repository.listRemovals(status); },
    async decideCourseRemoval({ requestId, actorRole, status, reason }) {
      if (actorRole !== 'admin') throw new Error('somente administrador pode decidir remoções');
      if (!['approved', 'rejected'].includes(status)) throw new Error('decisão inválida');
      if (status === 'rejected' && !reason?.trim()) throw new Error('motivo obrigatório para rejeição');
      const request = await repository.findRemoval(requestId);
      if (!request) throw new Error('solicitação não encontrada');
      if (request.status !== 'pending') throw new Error('solicitação já decidida');
      return repository.decideRemoval(requestId, { status, reason, decidedBy: 'admin' });
    },
  };
}
