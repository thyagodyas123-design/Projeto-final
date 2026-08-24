import { createAuthHttpServer } from './auth-http.mjs';
import { createAuthRepository } from './auth-repository.mjs';
const server = createAuthHttpServer({ repository: createAuthRepository(process.env.AUTH_DATABASE) });
server.listen(process.env.PORT ?? 4001, '0.0.0.0', () => console.log(`auth listening on ${process.env.PORT ?? 4001}`));
