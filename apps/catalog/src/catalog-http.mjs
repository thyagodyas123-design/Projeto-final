import { createServer } from 'node:http';
import { createCatalogRepository } from './catalog-repository.mjs';

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

export function createCatalogHttpServer({ database } = {}) {
  const repository = createCatalogRepository(database);
  const ready = repository.seed();

  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') {
        sendJson(response, 200, { service: 'catalog', status: 'ok' });
        return;
      }

      await ready;
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/courses') {
        const courses = await repository.listCourses({ search: url.searchParams.get('search') ?? '', category: url.searchParams.get('category') ?? '' });
        sendJson(response, 200, courses);
        return;
      }

      const match = url.pathname.match(/^\/courses\/([^/]+)$/);
      if (request.method === 'GET' && match) {
        const course = await repository.findCourse(match[1]);
        if (!course) {
          sendJson(response, 404, { error: 'curso não encontrado' });
          return;
        }
        sendJson(response, 200, course);
        return;
      }

      sendJson(response, 404, { error: 'rota não encontrada' });
    } catch (error) {
      sendJson(response, 500, { error: 'erro interno do catálogo', detail: error.message });
    }
  });
}
