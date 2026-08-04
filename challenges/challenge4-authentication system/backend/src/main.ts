import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { CustomSocketIoAdapter } from './socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ── Security middleware ────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );
  app.use(cookieParser());

  // ── CORS ──────────────────────────────────────────────────────────────────
  const corsOrigin =
    configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Custom Socket.IO adapter with correct CORS ────────────────────────────
  app.useWebSocketAdapter(new CustomSocketIoAdapter(app));

  // ── Global validation pipe ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global route prefix ───────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);

  logger.log(`🚀 Identity API running on http://localhost:${port}/api`);
  logger.log(`🔑 Google OAuth  → http://localhost:${port}/api/auth/google`);
  logger.log(`🔌 WebSocket     → ws://localhost:${port}/socket.io`);
}

bootstrap();
