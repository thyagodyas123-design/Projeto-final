import { createAdminHttpServer } from './admin-http.mjs';
const server = createAdminHttpServer();
server.listen(process.env.PORT ?? 4002, '0.0.0.0', () => console.log(`admin listening on ${process.env.PORT ?? 4002}`));
