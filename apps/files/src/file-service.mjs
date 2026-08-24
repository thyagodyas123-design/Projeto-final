import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { basename, dirname, join } from 'node:path';
import { mkdirSync, promises as fs } from 'node:fs';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

function quote(value) { return `'${String(value).replaceAll("'", "''")}'`; }
function run(filename, sql, json = false) { return execFileSync('sqlite3', json ? ['-json', filename, sql] : [filename, sql], { encoding: 'utf8' }).trim(); }

export function createFileService({ root = process.env.FILE_STORAGE ?? 'storage/files', database = process.env.FILES_DATABASE ?? 'storage/files/files.sqlite' } = {}) {
  const memory = database === ':memory:' ? new Map() : null;
  mkdirSync(root, { recursive: true });
  if (database !== ':memory:') {
    mkdirSync(dirname(database), { recursive: true });
    run(database, 'CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, filename TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, path TEXT NOT NULL, created_at TEXT NOT NULL);');
  }

  async function saveMetadata(metadata) {
    if (memory) { memory.set(metadata.id, { ...metadata }); return; }
    run(database, `INSERT INTO files (id,filename,mime_type,size,path,created_at) VALUES (${quote(metadata.id)},${quote(metadata.filename)},${quote(metadata.mimeType)},${metadata.size},${quote(metadata.path)},${quote(metadata.createdAt)});`);
  }

  async function getMetadata(id) {
    if (memory) return memory.get(id) ?? null;
    const output = run(database, `SELECT id, filename, mime_type AS mimeType, size, path, created_at AS createdAt FROM files WHERE id=${quote(id)} LIMIT 1;`, true);
    return output ? JSON.parse(output)[0] : null;
  }

  async function upload({ filename, mimeType, content }) {
    if (!ALLOWED_TYPES.has(mimeType)) throw new Error('formato não permitido');
    if (!Buffer.isBuffer(content)) throw new Error('conteúdo inválido');
    if (content.length > MAX_FILE_SIZE) throw new Error('tamanho máximo de 50 MB excedido');
    const id = randomUUID();
    const safeFilename = basename(filename || 'arquivo');
    const path = join(root, `${id}-${safeFilename}`);
    const metadata = { id, filename: safeFilename, mimeType, size: content.length, path, createdAt: new Date().toISOString() };
    await fs.writeFile(path, content, { flag: 'wx' });
    try { await saveMetadata(metadata); } catch (error) { await fs.rm(path, { force: true }); throw error; }
    return { ...metadata, path: undefined };
  }

  async function download(id) {
    const metadata = await getMetadata(id);
    if (!metadata) throw new Error('arquivo não encontrado');
    return { ...metadata, content: await fs.readFile(metadata.path) };
  }

  return { upload, download };
}
