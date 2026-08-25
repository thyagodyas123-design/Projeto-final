import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';

/* Helper de teste: sobe o app NestJS (compilado em dist/) numa porta efêmera.
   Fica dentro do pacote para resolver @nestjs/* do node_modules local. */
export async function createTestApp() {
  const { AppModule } = await import('./dist/app.module.js');
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  return app;
}

export async function listen(app) {
  await app.listen(0, '127.0.0.1');
  return app.getUrl();
}
