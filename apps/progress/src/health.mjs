import { createProgressHttpServer } from './progress-http.mjs';
const server = createProgressHttpServer();
server.listen(process.env.PORT ?? 4004, '0.0.0.0', () => console.log(`progress listening on ${process.env.PORT ?? 4004}`));
