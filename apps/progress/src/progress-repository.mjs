import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
function run(filename, sql, json = false) {
  return execFileSync('sqlite3', json ? ['-json', filename, sql] : [filename, sql], { encoding: 'utf8' }).trim();
}

export function createProgressRepository(filename = process.env.PROGRESS_DATABASE ?? 'storage/progress/progress.sqlite') {
  const memory = filename === ':memory:' ? { enrollments: new Map(), lessons: new Map(), certificates: new Map() } : null;
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  if (!memory) run(filename, `
    CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, course_id TEXT NOT NULL, UNIQUE(user_id, course_id));
    CREATE TABLE IF NOT EXISTS lesson_progress (id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, UNIQUE(enrollment_id, lesson_id));
    CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL UNIQUE, issued_at TEXT NOT NULL);
  `);

  return {
    async findEnrollment(userId, courseId) {
      if (memory) return memory.enrollments.get(`${userId}:${courseId}`) ?? null;
      const output = run(filename, `SELECT id, user_id AS userId, course_id AS courseId FROM enrollments WHERE user_id=${quote(userId)} AND course_id=${quote(courseId)} LIMIT 1;`, true);
      return output ? JSON.parse(output)[0] : null;
    },
    async createEnrollment(userId, courseId) {
      const existing = await this.findEnrollment(userId, courseId);
      if (existing) return existing;
      const enrollment = { id: randomUUID(), userId, courseId };
      if (memory) memory.enrollments.set(`${userId}:${courseId}`, enrollment);
      else run(filename, `INSERT OR IGNORE INTO enrollments (id,user_id,course_id) VALUES (${quote(enrollment.id)},${quote(userId)},${quote(courseId)});`);
      return (await this.findEnrollment(userId, courseId)) ?? enrollment;
    },
    async setLesson(enrollmentId, lessonId, completed) {
      if (memory) {
        const key = `${enrollmentId}:${lessonId}`;
        memory.lessons.set(key, { enrollmentId, lessonId, completed });
        return;
      }
      run(filename, `INSERT INTO lesson_progress (id,enrollment_id,lesson_id,completed) VALUES (${quote(randomUUID())},${quote(enrollmentId)},${quote(lessonId)},${completed ? 1 : 0}) ON CONFLICT(enrollment_id,lesson_id) DO UPDATE SET completed=excluded.completed;`);
    },
    async completedLessons(enrollmentId) {
      if (memory) return [...memory.lessons.values()].filter((item) => item.enrollmentId === enrollmentId && item.completed).map((item) => item.lessonId);
      const output = run(filename, `SELECT lesson_id AS lessonId FROM lesson_progress WHERE enrollment_id=${quote(enrollmentId)} AND completed=1 ORDER BY rowid;`, true);
      return output ? JSON.parse(output).map((row) => row.lessonId) : [];
    },
    async findCertificate(enrollmentId) {
      if (memory) return memory.certificates.get(enrollmentId) ?? null;
      const output = run(filename, `SELECT id, enrollment_id AS enrollmentId, issued_at AS issuedAt FROM certificates WHERE enrollment_id=${quote(enrollmentId)} LIMIT 1;`, true);
      return output ? JSON.parse(output)[0] : null;
    },
    async issueCertificate(enrollmentId) {
      const existing = await this.findCertificate(enrollmentId);
      if (existing) return existing;
      const certificate = { id: randomUUID(), enrollmentId, issuedAt: new Date().toISOString(), status: 'issued' };
      if (memory) memory.certificates.set(enrollmentId, certificate);
      else run(filename, `INSERT OR IGNORE INTO certificates (id,enrollment_id,issued_at) VALUES (${quote(certificate.id)},${quote(enrollmentId)},${quote(certificate.issuedAt)});`);
      return { ...(await this.findCertificate(enrollmentId) ?? certificate), status: 'issued' };
    },
    close() {},
  };
}
