import { Injectable, Optional } from '@nestjs/common';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { courses as seedCourses } from '@plataforma/shared';

function quote(value: unknown) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runSqlite(filename: string, sql: string, json = false) {
  const args = json ? ['-json', filename, sql] : [filename, sql];
  return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
}

function normalizeCourse(course: any) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    instructor: course.instructor,
    color: course.color,
    longDescription: course.longDescription,
    lessons: [...course.lessons]
      .map((lesson: any, index: number) => ({
        ...lesson,
        order: lesson.order ?? index + 1,
        videoUrl: lesson.videoUrl ?? lesson.video_url ?? null,
      }))
      .sort((a: any, b: any) => a.order - b.order),
  };
}

@Injectable()
export class CatalogRepository {
  private memory: Map<string, any> | null = null;
  private filename: string;

  constructor(@Optional() filename?: string) {
    this.filename = filename || process.env.CATALOG_DATABASE || 'storage/catalog/catalog.sqlite';
    if (this.filename === ':memory:') {
      this.memory = new Map();
    } else {
      mkdirSync(dirname(this.filename), { recursive: true });
    }
    this.initDatabase();
  }

  private initDatabase() {
    if (this.memory) return;
    runSqlite(this.filename, `
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        instructor TEXT NOT NULL,
        color TEXT NOT NULL,
        long_description TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        title TEXT NOT NULL,
        duration TEXT NOT NULL,
        lesson_order INTEGER NOT NULL,
        video_url TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      );
    `);
  }

  async saveCourse(course: any) {
    const normalized = normalizeCourse(course);
    if (this.memory) {
      if (this.memory.has(normalized.id)) return;
      this.memory.set(normalized.id, normalized);
      return;
    }

    runSqlite(this.filename, `BEGIN;
      INSERT OR IGNORE INTO courses (id, title, description, category, instructor, color, long_description)
      VALUES (${quote(normalized.id)}, ${quote(normalized.title)}, ${quote(normalized.description)}, ${quote(normalized.category)}, ${quote(normalized.instructor)}, ${quote(normalized.color)}, ${quote(normalized.longDescription)});
      ${normalized.lessons.map((lesson: any, index: number) => `INSERT OR IGNORE INTO lessons (id, course_id, title, duration, lesson_order, video_url) VALUES (${quote(`${normalized.id}-${lesson.id}`)}, ${quote(normalized.id)}, ${quote(lesson.title)}, ${quote(lesson.duration)}, ${index + 1}, NULL);`).join('\n')}
      COMMIT;`);
  }

  async seed() {
    for (const course of seedCourses) await this.saveCourse(course);
  }

  async findCourse(id: string) {
    if (this.memory) return this.memory.has(id) ? normalizeCourse(this.memory.get(id)) : null;
    const rows = runSqlite(this.filename, `SELECT id, title, description, category, instructor, color, long_description AS longDescription FROM courses WHERE id = ${quote(id)} LIMIT 1;`, true);
    if (!rows) return null;
    const course = JSON.parse(rows)[0];
    const lessons = runSqlite(this.filename, `SELECT id, title, duration, lesson_order AS "order", video_url AS videoUrl FROM lessons WHERE course_id = ${quote(id)} ORDER BY lesson_order ASC;`, true);
    return normalizeCourse({ ...course, lessons: lessons ? JSON.parse(lessons) : [] });
  }

  async listCourses({ search = '', category = '' } = {}) {
    if (this.memory) {
      const query = search.trim().toLowerCase();
      return [...this.memory.values()]
        .filter((course) => !query || `${course.title} ${course.description}`.toLowerCase().includes(query))
        .filter((course) => !category || course.category === category.toUpperCase())
        .map(normalizeCourse);
    }

    const conditions: string[] = [];
    if (search.trim()) {
      const query = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(title) LIKE ${quote(query)} OR LOWER(description) LIKE ${quote(query)})`);
    }
    if (category.trim()) conditions.push(`category = ${quote(category.trim().toUpperCase())}`);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = runSqlite(this.filename, `SELECT id FROM courses ${where} ORDER BY title ASC;`, true);
    const ids = rows ? JSON.parse(rows).map((row: any) => row.id) : [];
    return Promise.all(ids.map((id: string) => this.findCourse(id)));
  }

  close() {}
}
