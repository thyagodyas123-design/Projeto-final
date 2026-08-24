import { createCatalogHttpServer } from './catalog-http.mjs';

const server = createCatalogHttpServer();
server.listen(process.env.PORT ?? 4003, '0.0.0.0', () => console.log(`catalog listening on ${process.env.PORT ?? 4003}`));
