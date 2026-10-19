import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { REFRESH_TOKEN_COOKIE } from './api/usuario-autenticacao/auth-cookie.service.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const voiceNoteHttpLogger = new Logger('VoiceNoteHttp');

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (
      request.method !== 'PUT' ||
      !request.originalUrl.startsWith('/api/v1/mobile/diario-sintomas/hoje')
    ) {
      next();
      return;
    }

    const header = request.headers['x-request-id'];
    const candidate = Array.isArray(header) ? header[0] : header;
    const requestId =
      typeof candidate === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(candidate)
        ? candidate
        : 'missing';
    const startedAt = Date.now();
    response.setHeader('X-Request-Id', requestId);
    voiceNoteHttpLogger.log(
      JSON.stringify({ event: 'voice-note-http-start', requestId }),
    );
    response.on('finish', () => {
      voiceNoteHttpLogger.log(
        JSON.stringify({
          durationMillis: Date.now() - startedAt,
          event: 'voice-note-http-finish',
          requestId,
          status: response.statusCode,
        }),
      );
    });
    next();
  });
  app.enableCors({
    origin: 'http://localhost:8081',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OnCoopera API')
    .setDescription('Documentação oficial da API do OnCoopera')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth(REFRESH_TOKEN_COOKIE, undefined, 'refreshToken')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
