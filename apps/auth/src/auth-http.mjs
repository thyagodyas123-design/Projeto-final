import { createServer } from 'node:http';
import { createAuthService } from './auth-service.mjs';
import { createAuthRepository } from './auth-repository.mjs';
import { createTokenService } from './auth-tokens.mjs';

async function readJson(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, { 'content-type': 'application/json', ...headers });
  response.end(JSON.stringify(payload));
}

export function createAuthHttpServer({ secret = process.env.JWT_SECRET ?? 'local-development-secret', repository } = {}) {
  const auth = createAuthService({ repository: repository ?? createAuthRepository() });
  const tokens = createTokenService(secret);

  return createServer(async (request, response) => {
    try {
      if (request.method === 'GET' && request.url === '/health') {
        sendJson(response, 200, { service: 'auth', status: 'ok' });
        return;
      }

      if (request.method === 'POST' && request.url === '/auth/register') {
        const user = await auth.registerStudent(await readJson(request));
        const token = tokens.createAccessToken({ sub: user.id, role: user.role });
        sendJson(response, 201, { user: { id: user.id, email: user.email, role: user.role } }, {
          'set-cookie': `access_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
        });
        return;
      }

      if (request.method === 'POST' && request.url === '/auth/login') {
        const user = await auth.authenticate(await readJson(request));
        const token = tokens.createAccessToken({ sub: user.id, role: user.role });
        sendJson(response, 200, { user }, {
          'set-cookie': `access_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
        });
        return;
      }

      sendJson(response, 404, { error: 'not_found' });
    } catch (error) {
      const status = /credenciais inválidas/.test(error.message) ? 401 : 400;
      sendJson(response, status, { error: error.message });
    }
  });
}
