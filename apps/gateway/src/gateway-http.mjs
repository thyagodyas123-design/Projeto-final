import { createServer } from 'node:http';

const defaultTargets = {
  auth: process.env.AUTH_URL ?? 'http://auth:4001',
  admin: process.env.ADMIN_URL ?? 'http://admin:4002',
  catalog: process.env.CATALOG_URL ?? 'http://catalog:4003',
  progress: process.env.PROGRESS_URL ?? 'http://progress:4004',
  files: process.env.FILES_URL ?? 'http://files:4005',
};

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

export function createGatewayServer({ targets = defaultTargets } = {}) {
  return createServer((request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      sendJson(response, 200, { service: 'gateway', status: 'ok' });
      return;
    }

    const match = request.url.match(/^\/api\/([^/]+)(\/.*)?$/);
    const target = match ? targets[match[1]] : null;
    if (!target) {
      sendJson(response, 404, { error: 'rota não encontrada' });
      return;
    }

    const path = match[2] ?? '/';
    const upstreamPath = match[1] === 'auth' && !path.startsWith('/auth/') ? `/auth${path}` : path;
    const upstream = new URL(upstreamPath, target);
    const proxyRequest = upstream.protocol === 'https:' ? import('node:https') : import('node:http');
    proxyRequest.then(({ request: requestUpstream }) => {
      const upstreamRequest = requestUpstream(upstream, {
        method: request.method,
        headers: { ...request.headers, host: upstream.host },
      }, (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
      });
      upstreamRequest.on('error', () => {
        if (!response.headersSent) sendJson(response, 502, { error: 'serviço indisponível' });
        else response.destroy();
      });
      request.pipe(upstreamRequest);
    }).catch(() => sendJson(response, 502, { error: 'serviço indisponível' }));
  });
}
