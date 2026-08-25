import { Injectable, Optional } from '@nestjs/common';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

function quote(value: unknown) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function toUser(row: any) {
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, password: row.password, active: Boolean(row.active) };
}

function runSqlite(filename: string, sql: string, json = false) {
  const args = json ? ['-json', filename, sql] : [filename, sql];
  return execFileSync('sqlite3', args, { encoding: 'utf8' }).trim();
}

@Injectable()
export class AuthRepository {
  private memory: Map<string, any> | null = null;
  private filename: string;

  constructor(@Optional() filename?: string) {
    this.filename = filename || process.env.AUTH_DATABASE || 'storage/auth/auth.sqlite';
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
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
        password TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      );
    `);
  }

  async saveUser(user: any) {
    if (this.memory) {
      if (this.memory.has(user.email)) throw new Error('e-mail já cadastrado');
      this.memory.set(user.email, { ...user });
      return;
    }

    try {
      runSqlite(this.filename, `INSERT INTO users (id, email, role, password, active)
        VALUES (${quote(user.id)}, ${quote(user.email)}, ${quote(user.role)}, ${quote(user.password)}, ${user.active ? 1 : 0});`);
    } catch (error: any) {
      if (String(error.stderr ?? error.message).includes('UNIQUE constraint failed')) {
        throw new Error('e-mail já cadastrado');
      }
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    if (this.memory) return this.memory.get(email) ? { ...this.memory.get(email) } : null;
    const output = runSqlite(this.filename, `SELECT id, email, role, password, active FROM users WHERE email = ${quote(email)} LIMIT 1;`, true);
    return toUser(output ? JSON.parse(output)[0] : null);
  }

  async findUserById(id: string) {
    if (this.memory) {
      for (const user of this.memory.values()) {
        if (user.id === id) return { ...user };
      }
      return null;
    }
    const output = runSqlite(this.filename, `SELECT id, email, role, password, active FROM users WHERE id = ${quote(id)} LIMIT 1;`, true);
    return toUser(output ? JSON.parse(output)[0] : null);
  }

  close() {}
}
