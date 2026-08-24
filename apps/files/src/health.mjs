import { createFilesHttpServer } from './files-http.mjs';
const server = createFilesHttpServer();
server.listen(process.env.PORT ?? 4005, '0.0.0.0', () => console.log(`files listening on ${process.env.PORT ?? 4005}`));
