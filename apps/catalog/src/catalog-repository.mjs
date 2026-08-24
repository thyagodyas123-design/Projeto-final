import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { courses as seedCourses } from '../../../packages/shared/data.mjs';

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runSqlite(filename, sql, json = false) {
  const args = json ? ['-json', filename, sql] : [filename, sql];
  return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
}

function normalizeCourse(course) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    instructor: course.instructor,
    color: course.color,
    longDescription: course.longDescription,
    lessons: [...course.lessons]
      .map((lesson, index) => ({
        ...lesson,
        order: lesson.order ?? index + 1,
        videoUrl: lesson.videoUrl ?? lesson.video_url ?? null,
      }))
      .sort((a, b) => a.order - b.order),
  };
}

export function createCatalogRepository(filename = process.env.CATALOG_DATABASE ?? 'storage/catalog/catalog.sqlite') {
  const memory = filename === ':memory:' ? new Map() : null;
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });

  if (!memory) {
    runSqlite(filename, `
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

  async function saveCourse(course) {
    const normalized = normalizeCourse(course);
    if (memory) {
      if (memory.has(normalized.id)) return;
      memory.set(normalized.id, normalized);
      return;
    }

    runSqlite(filename, `BEGIN;
      INSERT OR IGNORE INTO courses (id, title, description, category, instructor, color, long_description)
      VALUES (${quote(normalized.id)}, ${quote(normalized.title)}, ${quote(normalized.description)}, ${quote(normalized.category)}, ${quote(normalized.instructor)}, ${quote(normalized.color)}, ${quote(normalized.longDescription)});
      ${normalized.lessons.map((lesson, index) => `INSERT OR IGNORE INTO lessons (id, course_id, title, duration, lesson_order, video_url) VALUES (${quote(`${normalized.id}-${lesson.id}`)}, ${quote(normalized.id)}, ${quote(lesson.title)}, ${quote(lesson.duration)}, ${index + 1}, NULL);`).join('\n')}
      COMMIT;`);
  }

  async function seed() {
    for (const course of seedCourses) await saveCourse(course);
  }

  async function findCourse(id) {
    if (memory) return memory.has(id) ? normalizeCourse(memory.get(id)) : null;
    const rows = runSqlite(filename, `SELECT id, title, description, category, instructor, color, long_description AS longDescription FROM courses WHERE id = ${quote(id)} LIMIT 1;`, true);
    if (!rows) return null;
    const course = JSON.parse(rows)[0];
    const lessons = runSqlite(filename, `SELECT id, title, duration, lesson_order AS "order", video_url AS videoUrl FROM lessons WHERE course_id = ${quote(id)} ORDER BY lesson_order ASC;`, true);
    return normalizeCourse({ ...course, lessons: lessons ? JSON.parse(lessons) : [] });
  }

  async function listCourses({ search = '', category = '' } = {}) {
    if (memory) {
      const query = search.trim().toLowerCase();
      return [...memory.values()]
        .filter((course) => !query || `${course.title} ${course.description}`.toLowerCase().includes(query))
        .filter((course) => !category || course.category === category.toUpperCase())
        .map(normalizeCourse);
    }

    const conditions = [];
    if (search.trim()) {
      const query = `%${search.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(title) LIKE ${quote(query)} OR LOWER(description) LIKE ${quote(query)})`);
    }
    if (category.trim()) conditions.push(`category = ${quote(category.trim().toUpperCase())}`);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = runSqlite(filename, `SELECT id FROM courses ${where} ORDER BY title ASC;`, true);
    const ids = rows ? JSON.parse(rows).map((row) => row.id) : [];
    return Promise.all(ids.map(findCourse));
  }

  return { seed, saveCourse, findCourse, listCourses, close() {} };
}

export async function seedCatalog(repository) {
  await repository.seed();
}
