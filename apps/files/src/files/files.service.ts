import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
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

function quote(value: unknown) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function run(filename: string, sql: string, json = false) {
  return execFileSync('sqlite3', json ? ['-json', filename, sql] : [filename, sql], { encoding: 'utf8' }).trim();
}

@Injectable()
export class FilesService {
  private memory: Map<string, any> | null = null;
  private readonly root: string;
  private readonly database: string;

  constructor(@Optional() root?: string, @Optional() database?: string) {
    this.root = root || process.env.FILE_STORAGE || 'storage/files';
    this.database = database || process.env.FILES_DATABASE || 'storage/files/files.sqlite';
    mkdirSync(this.root, { recursive: true });
    if (this.database === ':memory:') {
      this.memory = new Map();
    } else {
      mkdirSync(dirname(this.database), { recursive: true });
      run(this.database, 'CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, filename TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, path TEXT NOT NULL, created_at TEXT NOT NULL);');
    }
  }

  private saveMetadata(metadata: any) {
    if (this.memory) {
      this.memory.set(metadata.id, { ...metadata });
      return;
    }
    run(this.database, `INSERT INTO files (id,filename,mime_type,size,path,created_at) VALUES (${quote(metadata.id)},${quote(metadata.filename)},${quote(metadata.mimeType)},${metadata.size},${quote(metadata.path)},${quote(metadata.createdAt)});`);
  }

  private getMetadata(id: string): any {
    if (this.memory) return this.memory.get(id) ?? null;
    const output = run(this.database, `SELECT id, filename, mime_type AS mimeType, size, path, created_at AS createdAt FROM files WHERE id=${quote(id)} LIMIT 1;`, true);
    return output ? JSON.parse(output)[0] : null;
  }

  async upload(input: { filename?: string; mimeType?: string; content?: Buffer }) {
    const { filename, mimeType, content } = input;
    if (!mimeType || !ALLOWED_TYPES.has(mimeType)) throw new BadRequestException('formato não permitido');
    if (!content || !Buffer.isBuffer(content)) throw new BadRequestException('conteúdo inválido');
    if (content.length > MAX_FILE_SIZE) throw new BadRequestException('tamanho máximo de 50 MB excedido');
    const id = randomUUID();
    const safeFilename = basename(filename || 'arquivo');
    const path = join(this.root, `${id}-${safeFilename}`);
    const metadata = { id, filename: safeFilename, mimeType, size: content.length, path, createdAt: new Date().toISOString() };
    await fs.writeFile(path, content, { flag: 'wx' });
    try {
      this.saveMetadata(metadata);
    } catch (error) {
      await fs.rm(path, { force: true });
      throw error;
    }
    const { path: _path, ...rest } = metadata;
    return rest;
  }

  async download(id: string) {
    const metadata = this.getMetadata(id);
    if (!metadata) throw new NotFoundException('arquivo não encontrado');
    const content = await fs.readFile(metadata.path);
    return { ...metadata, content };
  }
}
