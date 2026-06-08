import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // Any localhost port by default — Vite auto-increments (5173, 5174, …)
    // when its preferred port is taken. CORS_ORIGIN pins an exact origin.
    origin:
      process.env.CORS_ORIGIN ?? /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3200);
  console.log(
    `Graphql Endpoint: http://localhost:${process.env.PORT ?? 3200}/graphql`,
  );
}
bootstrap();
