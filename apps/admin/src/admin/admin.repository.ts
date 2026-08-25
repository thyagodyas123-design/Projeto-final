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
export class AdminRepository {
  private memory: Map<string, any> | null = null;
  private filename: string;

  constructor(@Optional() filename?: string) {
    this.filename = filename || process.env.ADMIN_DATABASE || 'storage/admin/admin.sqlite';
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
      CREATE TABLE IF NOT EXISTS removal_requests (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        requested_by TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        decided_by TEXT,
        created_at TEXT NOT NULL,
        decided_at TEXT
      );
    `);
  }

  async createRemoval({ courseId, requestedBy }: { courseId: string; requestedBy: string }) {
    const request = {
      id: randomUUID(),
      courseId,
      requestedBy,
      status: 'pending',
      reason: null,
      decidedBy: null,
      createdAt: new Date().toISOString(),
      decidedAt: null,
    };
    if (this.memory) {
      this.memory.set(request.id, request);
    } else {
      runSqlite(this.filename, `INSERT INTO removal_requests (id, course_id, requested_by, status, created_at) VALUES (${quote(request.id)}, ${quote(courseId)}, ${quote(requestedBy)}, 'pending', ${quote(request.createdAt)});`);
    }
    return request;
  }

  async findRemoval(id: string) {
    if (this.memory) return this.memory.get(id) ?? null;
    const output = runSqlite(this.filename, `SELECT id, course_id AS courseId, requested_by AS requestedBy, status, reason, decided_by AS decidedBy, created_at AS createdAt, decided_at AS decidedAt FROM removal_requests WHERE id = ${quote(id)} LIMIT 1;`, true);
    return output ? JSON.parse(output)[0] : null;
  }

  async listRemovals(status = '') {
    if (this.memory) return [...this.memory.values()].filter((request) => !status || request.status === status);
    const where = status ? `WHERE status = ${quote(status)}` : '';
    const output = runSqlite(this.filename, `SELECT id, course_id AS courseId, requested_by AS requestedBy, status, reason, decided_by AS decidedBy, created_at AS createdAt, decided_at AS decidedAt FROM removal_requests ${where} ORDER BY created_at DESC;`, true);
    return output ? JSON.parse(output) : [];
  }

  async decideRemoval(id: string, { status, reason, decidedBy }: { status: string; reason?: string | null; decidedBy: string }) {
    const decidedAt = new Date().toISOString();
    if (this.memory) {
      const request = this.memory.get(id);
      if (!request) return null;
      const updated = { ...request, status, reason: reason ?? null, decidedBy, decidedByRole: decidedBy, decidedAt };
      this.memory.set(id, updated);
      return updated;
    }
    runSqlite(this.filename, `UPDATE removal_requests SET status = ${quote(status)}, reason = ${reason == null ? 'NULL' : quote(reason)}, decided_by = ${quote(decidedBy)}, decided_at = ${quote(decidedAt)} WHERE id = ${quote(id)};`);
    const updated = await this.findRemoval(id);
    return updated ? { ...updated, decidedByRole: decidedBy } : null;
  }
}
