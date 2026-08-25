import { Injectable } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';

@Injectable()
export class ProgressService {
  constructor(private readonly repository: ProgressRepository) {}

  async enroll({ userId, courseId }: { userId: string; courseId: string }) {
    return this.repository.createEnrollment(userId, courseId);
  }

  async getProgress({ userId, courseId, totalLessons = 0 }: { userId: string; courseId: string; totalLessons?: number }) {
    const enrollment = await this.repository.findEnrollment(userId, courseId);
    if (!enrollment) return { enrollment: null, completedLessonIds: [], progressPercent: 0, certificate: null };
    const completedLessonIds = await this.repository.completedLessons(enrollment.id);
    return {
      enrollment,
      completedLessonIds,
      progressPercent: totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0,
      certificate: await this.repository.findCertificate(enrollment.id),
    };
  }

  async setLessonCompleted({ userId, courseId, lessonId, completed, totalLessons }: { userId: string; courseId: string; lessonId: string; completed: boolean; totalLessons?: number }) {
    const enrollment = await this.repository.createEnrollment(userId, courseId);
    await this.repository.setLesson(enrollment.id, lessonId, completed);
    const progress = await this.getProgress({ userId, courseId, totalLessons });
    if (progress.progressPercent === 100 && (totalLessons ?? 0) > 0) progress.certificate = await this.repository.issueCertificate(enrollment.id);
    return progress;
  }
}
