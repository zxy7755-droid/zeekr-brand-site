import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PORT } from './contract';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  app.setGlobalPrefix('');
  await app.listen(PORT);
  // eslint-disable-next-line no-console
  console.log(`[api] listening on ${PORT}`);
}

void bootstrap();
