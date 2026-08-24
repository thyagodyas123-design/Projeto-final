import { createServer } from 'node:http';
import { createAdminService } from './admin-service.mjs';

async function readJson(request) { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; }
function send(response, status, payload) { response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(payload)); }

export function createAdminHttpServer({ database } = {}) {
  const service = createAdminService({ database });
  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') return send(response, 200, { service: 'admin', status: 'ok' });
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && url.pathname === '/removal-requests') return send(response, 201, await service.requestCourseRemoval(await readJson(request)));
      if (request.method === 'GET' && url.pathname === '/removal-requests') return send(response, 200, await service.listCourseRemovals(url.searchParams.get('status') ?? ''));
      const match = url.pathname.match(/^\/removal-requests\/([^/]+)$/);
      if (request.method === 'PATCH' && match) return send(response, 200, await service.decideCourseRemoval({ requestId: match[1], ...(await readJson(request)) }));
      send(response, 404, { error: 'rota não encontrada' });
    } catch (error) { send(response, /não encontrada/.test(error.message) ? 404 : 400, { error: error.message }); }
  });
}
