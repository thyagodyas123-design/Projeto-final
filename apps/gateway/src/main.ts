import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser: false — o gateway precisa encaminhar o corpo bruto (streaming)
  // para os serviços de destino sem consumi-lo.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`gateway listening on ${port}`);
}

bootstrap();
