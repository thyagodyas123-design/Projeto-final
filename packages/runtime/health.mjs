import { createServer } from 'node:http';

export function startHealthServer({ name, port = process.env.PORT ?? 3000 }) {
  const server = createServer((request, response) => {
    if (request.url !== '/health') {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'not_found' }));
      return;
    }

    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ service: name, status: 'ok' }));
  });

  server.listen(port, '0.0.0.0', () => console.log(`${name} listening on ${port}`));
  return server;
}
