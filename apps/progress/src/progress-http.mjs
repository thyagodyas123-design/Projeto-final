import { createServer } from 'node:http';
import { createProgressService } from './progress-service.mjs';

async function readJson(request) { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; }
function send(response, status, payload) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(payload)); }

export function createProgressHttpServer({ database } = {}) {
  const service = createProgressService({ database });
  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') return send(response, 200, { service: 'progress', status: 'ok' });
      const url = new URL(request.url, 'http://localhost');
      const enrollment = url.pathname.match(/^\/enrollments\/([^/]+)\/([^/]+)$/);
      const lesson = url.pathname.match(/^\/enrollments\/([^/]+)\/([^/]+)\/lessons\/([^/]+)$/);
      if (request.method === 'POST' && url.pathname === '/enrollments') return send(response, 201, await service.enroll(await readJson(request)));
      if (request.method === 'GET' && enrollment) return send(response, 200, await service.getProgress({ userId: enrollment[1], courseId: enrollment[2], totalLessons: Number(url.searchParams.get('totalLessons') ?? 0) }));
      if (request.method === 'PATCH' && lesson) return send(response, 200, await service.setLessonCompleted({ userId: lesson[1], courseId: lesson[2], lessonId: lesson[3], ...(await readJson(request)) }));
      send(response, 404, { error: 'rota não encontrada' });
    } catch (error) { send(response, 400, { error: error.message }); }
  });
}
