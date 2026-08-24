import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function toUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, password: row.password, active: Boolean(row.active) };
}

function runSqlite(filename, sql, json = false) {
  const args = json ? ['-json', filename, sql] : [filename, sql];
  const output = execFileSync('sqlite3', args, { encoding: 'utf8' });
  return output.trim();
}

export function createAuthRepository(filename = process.env.AUTH_DATABASE ?? 'storage/auth/auth.sqlite') {
  const memory = filename === ':memory:' ? new Map() : null;
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });

  if (!memory) runSqlite(filename, `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
      password TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  return {
    async saveUser(user) {
      if (memory) {
        if (memory.has(user.email)) throw new Error('e-mail já cadastrado');
        memory.set(user.email, { ...user });
        return;
      }

      try {
        runSqlite(filename, `INSERT INTO users (id, email, role, password, active)
          VALUES (${quote(user.id)}, ${quote(user.email)}, ${quote(user.role)}, ${quote(user.password)}, ${user.active ? 1 : 0});`);
      } catch (error) {
        if (String(error.stderr ?? error.message).includes('UNIQUE constraint failed')) {
          throw new Error('e-mail já cadastrado');
        }
        throw error;
      }
    },
    async findUserByEmail(email) {
      if (memory) return memory.get(email) ? { ...memory.get(email) } : null;
      const output = runSqlite(filename, `SELECT id, email, role, password, active FROM users WHERE email = ${quote(email)} LIMIT 1;`, true);
      return toUser(output ? JSON.parse(output)[0] : null);
    },
    close() {},
  };
}
