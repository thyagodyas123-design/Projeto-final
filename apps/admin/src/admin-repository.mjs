import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
function run(filename, sql, json = false) { return execFileSync('sqlite3', json ? ['-json', filename, sql] : [filename, sql], { encoding: 'utf8' }).trim(); }

export function createAdminRepository(filename = process.env.ADMIN_DATABASE ?? 'storage/admin/admin.sqlite') {
  const memory = filename === ':memory:' ? new Map() : null;
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  if (!memory) run(filename, 'CREATE TABLE IF NOT EXISTS removal_requests (id TEXT PRIMARY KEY, course_id TEXT NOT NULL, requested_by TEXT NOT NULL, status TEXT NOT NULL, reason TEXT, decided_by TEXT, created_at TEXT NOT NULL, decided_at TEXT);');

  return {
    async createRemoval({ courseId, requestedBy }) {
      const request = { id: randomUUID(), courseId, requestedBy, status: 'pending', reason: null, decidedBy: null, createdAt: new Date().toISOString(), decidedAt: null };
      if (memory) memory.set(request.id, request);
      else run(filename, `INSERT INTO removal_requests (id,course_id,requested_by,status,created_at) VALUES (${quote(request.id)},${quote(courseId)},${quote(requestedBy)},'pending',${quote(request.createdAt)});`);
      return request;
    },
    async findRemoval(id) {
      if (memory) return memory.get(id) ?? null;
      const output = run(filename, `SELECT id,course_id AS courseId,requested_by AS requestedBy,status,reason,decided_by AS decidedBy,created_at AS createdAt,decided_at AS decidedAt FROM removal_requests WHERE id=${quote(id)} LIMIT 1;`, true);
      return output ? JSON.parse(output)[0] : null;
    },
    async listRemovals(status = '') {
      if (memory) return [...memory.values()].filter((request) => !status || request.status === status);
      const where = status ? `WHERE status=${quote(status)}` : '';
      const output = run(filename, `SELECT id,course_id AS courseId,requested_by AS requestedBy,status,reason,decided_by AS decidedBy,created_at AS createdAt,decided_at AS decidedAt FROM removal_requests ${where} ORDER BY created_at DESC;`, true);
      return output ? JSON.parse(output) : [];
    },
    async decideRemoval(id, { status, reason, decidedBy }) {
      const decidedAt = new Date().toISOString();
      if (memory) {
        const request = memory.get(id);
        if (!request) return null;
        const updated = { ...request, status, reason: reason ?? null, decidedBy, decidedByRole: decidedBy, decidedAt };
        memory.set(id, updated);
        return updated;
      }
      run(filename, `UPDATE removal_requests SET status=${quote(status)},reason=${reason == null ? 'NULL' : quote(reason)},decided_by=${quote(decidedBy)},decided_at=${quote(decidedAt)} WHERE id=${quote(id)};`);
      return this.findRemoval(id);
    },
  };
}
