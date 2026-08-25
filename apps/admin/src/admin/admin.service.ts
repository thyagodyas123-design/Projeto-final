import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly repository: AdminRepository) {}

  async requestCourseRemoval({ courseId, requestedBy, actorRole }: { courseId: string; requestedBy: string; actorRole: string }) {
    if (actorRole !== 'teacher') throw new BadRequestException('somente professor pode solicitar remoção');
    return this.repository.createRemoval({ courseId, requestedBy });
  }

  async listCourseRemovals(status = '') {
    return this.repository.listRemovals(status);
  }

  async decideCourseRemoval({ requestId, actorRole, status, reason }: { requestId: string; actorRole: string; status: string; reason?: string }) {
    if (actorRole !== 'admin') throw new BadRequestException('somente administrador pode decidir remoções');
    if (!['approved', 'rejected'].includes(status)) throw new BadRequestException('decisão inválida');
    if (status === 'rejected' && !reason?.trim()) throw new BadRequestException('motivo obrigatório para rejeição');
    const request = await this.repository.findRemoval(requestId);
    if (!request) throw new NotFoundException('solicitação não encontrada');
    if (request.status !== 'pending') throw new BadRequestException('solicitação já decidida');
    return this.repository.decideRemoval(requestId, { status, reason, decidedBy: 'admin' });
  }
}
