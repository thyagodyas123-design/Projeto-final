import { createServer } from 'node:http';
import { createFileService } from './file-service.mjs';

async function readJson(request) { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; }
function sendJson(response, status, payload) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(payload)); }

export function createFilesHttpServer(options = {}) {
  const service = createFileService(options);
  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') return sendJson(response, 200, { service: 'files', status: 'ok' });
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && url.pathname === '/files') {
        const body = await readJson(request);
        const file = await service.upload({ filename: body.filename, mimeType: body.mimeType, content: Buffer.from(body.contentBase64 ?? '', 'base64') });
        return sendJson(response, 201, file);
      }
      const match = url.pathname.match(/^\/files\/([^/]+)$/);
      if (request.method === 'GET' && match) {
        const file = await service.download(match[1]);
        response.writeHead(200, { 'content-type': file.mimeType, 'content-length': file.size, 'content-disposition': `attachment; filename="${file.filename.replaceAll('"', '')}"` });
        return response.end(file.content);
      }
      sendJson(response, 404, { error: 'rota não encontrada' });
    } catch (error) { sendJson(response, /não encontrado/.test(error.message) ? 404 : 400, { error: error.message }); }
  });
}
