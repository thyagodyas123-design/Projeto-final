import { createGatewayServer } from './gateway-http.mjs';
const server = createGatewayServer();
server.listen(process.env.PORT ?? 4000, '0.0.0.0', () => console.log(`gateway listening on ${process.env.PORT ?? 4000}`));
