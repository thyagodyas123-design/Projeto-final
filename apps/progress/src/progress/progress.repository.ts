import { Injectable, Optional } from '@nestjs/common';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

function quote(value: unknown) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runSqlite(filename: string, sql: string, json = false) {
  const args = json ? ['-json', filename, sql] : [filename, sql];
  return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
}

@Injectable()
export class ProgressRepository {
  private memory: {
    enrollments: Map<string, any>;
    lessons: Map<string, any>;
    certificates: Map<string, any>;
  } | null = null;
  private filename: string;

  constructor(@Optional() filename?: string) {
    this.filename = filename || process.env.PROGRESS_DATABASE || 'storage/progress/progress.sqlite';
    if (this.filename === ':memory:') {
      this.memory = { enrollments: new Map(), lessons: new Map(), certificates: new Map() };
    } else {
      mkdirSync(dirname(this.filename), { recursive: true });
    }
    this.initDatabase();
  }

  private initDatabase() {
    if (this.memory) return;
    runSqlite(this.filename, `
      CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, course_id TEXT NOT NULL, UNIQUE(user_id, course_id));
      CREATE TABLE IF NOT EXISTS lesson_progress (id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, UNIQUE(enrollment_id, lesson_id));
      CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL UNIQUE, issued_at TEXT NOT NULL);
    `);
  }

  async findEnrollment(userId: string, courseId: string) {
    if (this.memory) return this.memory.enrollments.get(`${userId}:${courseId}`) ?? null;
    const output = runSqlite(this.filename, `SELECT id, user_id AS userId, course_id AS courseId FROM enrollments WHERE user_id=${quote(userId)} AND course_id=${quote(courseId)} LIMIT 1;`, true);
    return output ? JSON.parse(output)[0] : null;
  }

  async createEnrollment(userId: string, courseId: string) {
    const existing = await this.findEnrollment(userId, courseId);
    if (existing) return existing;
    const enrollment = { id: randomUUID(), userId, courseId };
    if (this.memory) this.memory.enrollments.set(`${userId}:${courseId}`, enrollment);
    else runSqlite(this.filename, `INSERT OR IGNORE INTO enrollments (id,user_id,course_id) VALUES (${quote(enrollment.id)},${quote(userId)},${quote(courseId)});`);
    return (await this.findEnrollment(userId, courseId)) ?? enrollment;
  }

  async setLesson(enrollmentId: string, lessonId: string, completed: boolean) {
    if (this.memory) {
      const key = `${enrollmentId}:${lessonId}`;
      this.memory.lessons.set(key, { enrollmentId, lessonId, completed });
      return;
    }
    runSqlite(this.filename, `INSERT INTO lesson_progress (id,enrollment_id,lesson_id,completed) VALUES (${quote(randomUUID())},${quote(enrollmentId)},${quote(lessonId)},${completed ? 1 : 0}) ON CONFLICT(enrollment_id,lesson_id) DO UPDATE SET completed=excluded.completed;`);
  }

  async completedLessons(enrollmentId: string) {
    if (this.memory) return [...this.memory.lessons.values()].filter((item) => item.enrollmentId === enrollmentId && item.completed).map((item) => item.lessonId);
    const output = runSqlite(this.filename, `SELECT lesson_id AS lessonId FROM lesson_progress WHERE enrollment_id=${quote(enrollmentId)} AND completed=1 ORDER BY rowid;`, true);
    return output ? JSON.parse(output).map((row: any) => row.lessonId) : [];
  }

  async findCertificate(enrollmentId: string) {
    if (this.memory) return this.memory.certificates.get(enrollmentId) ?? null;
    const output = runSqlite(this.filename, `SELECT id, enrollment_id AS enrollmentId, issued_at AS issuedAt FROM certificates WHERE enrollment_id=${quote(enrollmentId)} LIMIT 1;`, true);
    return output ? JSON.parse(output)[0] : null;
  }

  async issueCertificate(enrollmentId: string) {
    const existing = await this.findCertificate(enrollmentId);
    if (existing) return existing;
    const certificate = { id: randomUUID(), enrollmentId, issuedAt: new Date().toISOString(), status: 'issued' };
    if (this.memory) this.memory.certificates.set(enrollmentId, certificate);
    else runSqlite(this.filename, `INSERT OR IGNORE INTO certificates (id,enrollment_id,issued_at) VALUES (${quote(certificate.id)},${quote(enrollmentId)},${quote(certificate.issuedAt)});`);
    return { ...(await this.findCertificate(enrollmentId) ?? certificate), status: 'issued' };
  }

  close() {}
}
