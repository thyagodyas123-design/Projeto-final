import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

/* Helper de teste: sobe o gateway (compilado em dist/) numa porta efêmera.
   bodyParser: false é obrigatório para preservar o streaming do proxy. */
export async function createTestApp() {
  const { AppModule } = await import('./dist/app.module.js');
  return NestFactory.create(AppModule, { bodyParser: false });
}

export async function listen(app) {
  await app.listen(0, '127.0.0.1');
  return app.getUrl();
}
