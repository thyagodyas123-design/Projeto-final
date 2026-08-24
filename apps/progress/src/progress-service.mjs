import { createProgressRepository } from './progress-repository.mjs';

export function createProgressService({ database } = {}) {
  const repository = createProgressRepository(database);

  async function enroll({ userId, courseId }) {
    return repository.createEnrollment(userId, courseId);
  }

  async function getProgress({ userId, courseId, totalLessons = 0 }) {
    const enrollment = await repository.findEnrollment(userId, courseId);
    if (!enrollment) return { enrollment: null, completedLessonIds: [], progressPercent: 0, certificate: null };
    const completedLessonIds = await repository.completedLessons(enrollment.id);
    return {
      enrollment,
      completedLessonIds,
      progressPercent: totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0,
      certificate: await repository.findCertificate(enrollment.id),
    };
  }

  async function setLessonCompleted({ userId, courseId, lessonId, completed, totalLessons }) {
    const enrollment = await repository.createEnrollment(userId, courseId);
    await repository.setLesson(enrollment.id, lessonId, completed);
    const progress = await getProgress({ userId, courseId, totalLessons });
    if (progress.progressPercent === 100 && totalLessons > 0) progress.certificate = await repository.issueCertificate(enrollment.id);
    return progress;
  }

  return { enroll, getProgress, setLessonCompleted };
}
